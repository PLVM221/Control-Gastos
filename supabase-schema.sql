create table if not exists public.entries (
  id text primary key,
  name text not null,
  kind text not null check (kind in ('expense', 'income')),
  category text not null check (category in ('fixed', 'additional', 'casual', 'card', 'credit', 'future', 'income')),
  amount numeric not null check (amount > 0),
  start text not null,
  frequency text not null check (frequency in ('monthly', 'once', 'weekly', 'annual')),
  duration integer not null default 0,
  payment text not null check (payment in ('cash', 'transfer', 'card', 'credit')),
  installments integer not null default 1,
  notes text not null default '',
  created_at timestamptz not null default now()
);

alter table public.entries enable row level security;

create policy "Allow anon read entries"
on public.entries
for select
to anon
using (true);

create policy "Allow anon insert entries"
on public.entries
for insert
to anon
with check (true);

create policy "Allow anon update entries"
on public.entries
for update
to anon
using (true)
with check (true);

create policy "Allow anon delete entries"
on public.entries
for delete
to anon
using (true);
