/*
  Supabase adapter for Leave Block Exchange.

  The app talks to a small document-store interface:
    db.collection(name).onSnapshot(fn, onError)
    db.doc('collection/id').get() / .set(data) / .update(patch) / .delete()
    db.claim('collection/id', data)   (insert only if the id is free)

  Each collection is a Supabase table with columns (id text, data jsonb, updated_at).
  Live changes arrive through Supabase Realtime, so every open browser stays in sync.
*/
(function () {
  var COLLECTIONS = ['listings', 'swaps', 'holdings', 'rounds'];
  var PAGE = 1000;

  function clone(v) { return v == null ? v : JSON.parse(JSON.stringify(v)); }
  function rid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }

  function SupaDB(client) {
    var cache = {}, subs = {}, errs = {}, loading = {}, channel = null;
    COLLECTIONS.forEach(function (c) { cache[c] = {}; subs[c] = []; errs[c] = []; });

    function check(c) { if (COLLECTIONS.indexOf(c) < 0) throw new Error('Unknown collection: ' + c); }
    function split(path) { var i = path.indexOf('/'); var c = path.slice(0, i), id = path.slice(i + 1); check(c); return { c: c, id: id }; }

    function emit(c) {
      var docs = Object.keys(cache[c]).map(function (id) {
        var v = cache[c][id];
        return { id: id, exists: true, data: function () { return v; } };
      });
      var snap = { docs: docs, size: docs.length, empty: !docs.length };
      subs[c].forEach(function (f) { try { f(snap); } catch (e) { console.error(e); } });
    }
    function fail(c, e) { console.error(e); errs[c].forEach(function (f) { try { f(e); } catch (x) {} }); }

    function startRealtime() {
      if (channel) return;
      channel = client.channel('lbx-changes');
      COLLECTIONS.forEach(function (c) {
        channel.on('postgres_changes', { event: '*', schema: 'public', table: c }, function (p) {
          if (p.eventType === 'DELETE') { if (p.old && p.old.id != null) delete cache[c][p.old.id]; }
          else if (p.new && p.new.id != null) cache[c][p.new.id] = p.new.data;
          emit(c);
        });
      });
      channel.subscribe(function (status) {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') COLLECTIONS.forEach(function (c) { fail(c, new Error('Realtime ' + status)); });
        // after a reconnect, reload everything so nothing missed while offline is lost
        if (status === 'SUBSCRIBED' && startRealtime.connectedOnce) COLLECTIONS.forEach(function (c) { load(c, true); });
        if (status === 'SUBSCRIBED') startRealtime.connectedOnce = true;
      });
    }

    function load(c, force) {
      if (loading[c] && !force) return loading[c];
      var rows = [];
      function page(from) {
        return client.from(c).select('id,data').order('id').range(from, from + PAGE - 1).then(function (r) {
          if (r.error) throw r.error;
          rows = rows.concat(r.data || []);
          if ((r.data || []).length === PAGE) return page(from + PAGE);
        });
      }
      loading[c] = page(0).then(function () {
        var m = {}; rows.forEach(function (row) { m[row.id] = row.data; });
        cache[c] = m; emit(c);
      }, function (e) { loading[c] = null; fail(c, e); });
      return loading[c];
    }

    function doc(path) {
      var p = split(path);
      return {
        id: p.id, path: path,
        get: function () {
          return client.from(p.c).select('data').eq('id', p.id).maybeSingle().then(function (r) {
            if (r.error) throw r.error;
            var v = r.data ? r.data.data : undefined;
            return { exists: !!r.data, data: function () { return v; } };
          });
        },
        set: function (d) {
          var data = clone(d);
          return client.from(p.c).upsert({ id: p.id, data: data, updated_at: new Date().toISOString() }).then(function (r) {
            if (r.error) throw r.error;
            cache[p.c][p.id] = data; emit(p.c);
          });
        },
        update: function (patch) {
          return client.rpc('merge_doc', { coll: p.c, doc_id: p.id, patch: clone(patch) }).then(function (r) {
            if (r.error) throw r.error;
            if (r.data != null) { cache[p.c][p.id] = r.data; emit(p.c); }
          });
        },
        delete: function () {
          return client.from(p.c).delete().eq('id', p.id).then(function (r) {
            if (r.error) throw r.error;
            delete cache[p.c][p.id]; emit(p.c);
          });
        }
      };
    }

    return {
      doc: doc,
      collection: function (c) {
        check(c);
        return {
          doc: function (id) { return doc(c + '/' + (id || rid())); },
          onSnapshot: function (fn, onError) {
            subs[c].push(fn); if (onError) errs[c].push(onError);
            startRealtime();
            if (loading[c]) setTimeout(function () { emit(c); }, 0); else load(c);
            return function () {
              subs[c] = subs[c].filter(function (f) { return f !== fn; });
              errs[c] = errs[c].filter(function (f) { return f !== onError; });
            };
          }
        };
      },
      // Insert a document only if its id is not taken. Resolves true if this browser got it.
      claim: function (path, data) {
        var p = split(path);
        return client.rpc('claim_doc', { coll: p.c, doc_id: p.id, payload: clone(data) }).then(function (r) {
          if (r.error) throw r.error;
          if (r.data) { cache[p.c][p.id] = clone(data); emit(p.c); }
          return !!r.data;
        });
      }
    };
  }

  window.LBXConnectSupabase = function () {
    var cfg = window.LBX_CONFIG || {};
    if (!cfg.supabaseUrl || !cfg.supabaseAnonKey || /YOUR-/.test(cfg.supabaseUrl + cfg.supabaseAnonKey)) return null;
    if (!window.supabase || !window.supabase.createClient) { console.error('supabase-js did not load'); return null; }
    var client = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, { auth: { persistSession: false } });
    return SupaDB(client);
  };
})();
