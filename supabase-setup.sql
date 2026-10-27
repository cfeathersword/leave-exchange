-- Leave Block Exchange: database setup for the demo.
-- Paste all of this into Supabase > SQL Editor > New query, then press Run.
-- Safe to run more than once.

-- One table holds everything: offers, swaps, agreed rosters and matching rounds.
create table if not exists public.docs (
  coll       text        not null,               -- listings, swaps, holdings, rounds, meta
  id         text        not null,
  data       jsonb       not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (coll, id)
);

-- Live updates: send the full row on changes so every open screen updates.
alter table public.docs replica identity full;
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'docs'
  ) then
    alter publication supabase_realtime add table public.docs;
  end if;
end $$;

-- DEMO ACCESS: anyone with the link can read and change the data.
-- This is fine for made-up staff. Do not put real names or leave in this table.
alter table public.docs enable row level security;
grant select, insert, update, delete on public.docs to anon;

drop policy if exists "demo read"   on public.docs;
drop policy if exists "demo insert" on public.docs;
drop policy if exists "demo update" on public.docs;
drop policy if exists "demo delete" on public.docs;
create policy "demo read"   on public.docs for select to anon using (true);
create policy "demo insert" on public.docs for insert to anon with check (true);
create policy "demo update" on public.docs for update to anon using (true) with check (true);
create policy "demo delete" on public.docs for delete to anon using (true);

-- To start the demo completely fresh later (example requests reload on next visit):
-- delete from public.docs;
