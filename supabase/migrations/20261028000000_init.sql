-- Leave Block Exchange: database setup
-- Run once in Supabase: SQL Editor > New query > paste > Run
-- (or with the Supabase CLI: supabase db push)

-- 1. Tables. Each is a simple document store: one row per document, JSON in "data".
create table if not exists public.listings (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
create table if not exists public.swaps (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
create table if not exists public.holdings (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
create table if not exists public.rounds (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Handy indexes for reporting queries
create index if not exists listings_status_idx on public.listings ((data->>'status'));
create index if not exists swaps_status_idx on public.swaps ((data->>'status'));

-- 2. Deep merge of two JSON objects (used for partial updates, e.g. adding one acceptance)
create or replace function public.jsonb_deep_merge(a jsonb, b jsonb)
returns jsonb
language plpgsql
immutable
as $$
declare
  k text;
  result jsonb;
begin
  if a is null or jsonb_typeof(a) <> 'object' or b is null or jsonb_typeof(b) <> 'object' then
    return b;
  end if;
  result := a;
  for k in select jsonb_object_keys(b) loop
    if jsonb_typeof(result -> k) = 'object' and jsonb_typeof(b -> k) = 'object' then
      result := jsonb_set(result, array[k], public.jsonb_deep_merge(result -> k, b -> k));
    else
      result := jsonb_set(result, array[k], b -> k);
    end if;
  end loop;
  return result;
end;
$$;

-- 3. Partial update of an existing document. Returns the merged document, or null if it does not exist.
create or replace function public.merge_doc(coll text, doc_id text, patch jsonb)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  result jsonb;
begin
  if coll not in ('listings', 'swaps', 'holdings', 'rounds') then
    raise exception 'unknown collection %', coll;
  end if;
  execute format(
    'update public.%I set data = public.jsonb_deep_merge(data, $2), updated_at = now() where id = $1 returning data',
    coll
  ) into result using doc_id, patch;
  return result;
end;
$$;

-- 4. Insert a document only if the id is free. Returns true if this call created it.
--    Used so only one browser runs each scheduled matching round.
create or replace function public.claim_doc(coll text, doc_id text, payload jsonb)
returns boolean
language plpgsql
security invoker
set search_path = public
as $$
declare
  n int;
begin
  if coll not in ('listings', 'swaps', 'holdings', 'rounds') then
    raise exception 'unknown collection %', coll;
  end if;
  execute format(
    'insert into public.%I (id, data) values ($1, $2) on conflict (id) do nothing',
    coll
  ) using doc_id, payload;
  get diagnostics n = row_count;
  return n > 0;
end;
$$;

grant execute on function public.jsonb_deep_merge(jsonb, jsonb) to anon, authenticated;
grant execute on function public.merge_doc(text, text, jsonb) to anon, authenticated;
grant execute on function public.claim_doc(text, text, jsonb) to anon, authenticated;

-- 5. Row Level Security.
--    OPEN DEMO MODE: anyone with the site link can read and change everything,
--    just like the prototype. Replace these policies before using real staff data.
alter table public.listings enable row level security;
alter table public.swaps    enable row level security;
alter table public.holdings enable row level security;
alter table public.rounds   enable row level security;

do $$
declare t text;
begin
  foreach t in array array['listings', 'swaps', 'holdings', 'rounds'] loop
    execute format('drop policy if exists "demo read"   on public.%I', t);
    execute format('drop policy if exists "demo insert" on public.%I', t);
    execute format('drop policy if exists "demo update" on public.%I', t);
    execute format('drop policy if exists "demo delete" on public.%I', t);
    execute format('create policy "demo read"   on public.%I for select to anon, authenticated using (true)', t);
    execute format('create policy "demo insert" on public.%I for insert to anon, authenticated with check (true)', t);
    execute format('create policy "demo update" on public.%I for update to anon, authenticated using (true) with check (true)', t);
    execute format('create policy "demo delete" on public.%I for delete to anon, authenticated using (true)', t);
  end loop;
end $$;

grant select, insert, update, delete on public.listings, public.swaps, public.holdings, public.rounds to anon, authenticated;

-- 6. Realtime: send row changes to every open browser
do $$
declare t text;
begin
  foreach t in array array['listings', 'swaps', 'holdings', 'rounds'] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;
