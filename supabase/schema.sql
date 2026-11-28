-- Run once in Supabase: SQL Editor -> New query -> paste -> Run.
create table if not exists public.kv (
  col text not null,
  id  text not null,
  data jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (col, id)
);
alter table public.kv enable row level security;
-- The app signs people in itself (admin password / staff access code), so the table is opened to the app's anon key.
create policy "app read"   on public.kv for select to anon using (true);
create policy "app insert" on public.kv for insert to anon with check (true);
create policy "app update" on public.kv for update to anon using (true) with check (true);
create policy "app delete" on public.kv for delete to anon using (true);
-- Newer Supabase projects do not always give the anon role table rights automatically. These lines make sure it has them.
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on table public.kv to anon, authenticated;
