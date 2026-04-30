create table if not exists public.entries (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  kind text not null check (kind in ('expense', 'income')),
  category text not null check (category in ('fixed', 'additional', 'casual', 'card', 'credit', 'future', 'income')),
  amount numeric not null check (amount > 0),
  start text not null,
  frequency text not null check (frequency in ('monthly', 'once', 'weekly', 'annual')),
  duration integer not null default 0,
  payment text not null check (payment in ('cash', 'transfer', 'card', 'credit')),
  installments integer not null default 1,
  status text not null default 'pending' check (status in ('pending', 'paid', 'planned', 'overdue')),
  due_day integer not null default 0,
  account text not null default '',
  vendor text not null default '',
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high')),
  budget numeric not null default 0,
  tags text[] not null default '{}',
  notes text not null default '',
  created_at timestamptz not null default now()
);

alter table public.entries add column if not exists status text not null default 'pending';
alter table public.entries add column if not exists due_day integer not null default 0;
alter table public.entries add column if not exists account text not null default '';
alter table public.entries add column if not exists vendor text not null default '';
alter table public.entries add column if not exists priority text not null default 'normal';
alter table public.entries add column if not exists budget numeric not null default 0;
alter table public.entries add column if not exists tags text[] not null default '{}';
alter table public.entries add column if not exists user_id uuid references auth.users(id) on delete cascade;

alter table public.entries enable row level security;

drop policy if exists "Allow anon read entries" on public.entries;
drop policy if exists "Allow anon insert entries" on public.entries;
drop policy if exists "Allow anon update entries" on public.entries;
drop policy if exists "Allow anon delete entries" on public.entries;
drop policy if exists "Users can read own entries" on public.entries;
drop policy if exists "Users can insert own entries" on public.entries;
drop policy if exists "Users can update own entries" on public.entries;
drop policy if exists "Users can delete own entries" on public.entries;

create policy "Users can read own entries"
on public.entries
for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can insert own entries"
on public.entries
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can update own entries"
on public.entries
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete own entries"
on public.entries
for delete
to authenticated
using (auth.uid() = user_id);

create table if not exists public.activity_logs (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade,
  action text not null check (action in ('created', 'updated', 'deleted', 'cleared')),
  entry_id text not null default '',
  entry_name text not null default '',
  amount numeric not null default 0,
  kind text not null default '',
  category text not null default '',
  detail text not null default '',
  created_at timestamptz not null default now()
);

alter table public.activity_logs add column if not exists user_id uuid references auth.users(id) on delete cascade;

alter table public.activity_logs enable row level security;

drop policy if exists "Allow anon read activity logs" on public.activity_logs;
drop policy if exists "Allow anon insert activity logs" on public.activity_logs;
drop policy if exists "Users can read own activity logs" on public.activity_logs;
drop policy if exists "Users can insert own activity logs" on public.activity_logs;

create policy "Users can read own activity logs"
on public.activity_logs
for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can insert own activity logs"
on public.activity_logs
for insert
to authenticated
with check (auth.uid() = user_id);
