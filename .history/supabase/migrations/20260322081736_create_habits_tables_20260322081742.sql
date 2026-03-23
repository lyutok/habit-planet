-- Create habits, habit_entries, and planet_objects tables with RLS
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard → SQL Editor

-- Habits table
create table if not exists public.habits (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  icon text not null,
  type text not null,
  streak integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Habit entries table
create table if not exists public.habit_entries (
  id text primary key default gen_random_uuid()::text,
  user_id uuid not null references auth.users(id) on delete cascade,
  habit_id text not null references public.habits(id) on delete cascade,
  date date not null,
  completed boolean not null default false,
  created_at timestamptz not null default now(),
  unique(habit_id, date)
);

-- Planet objects table
create table if not exists public.planet_objects (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  habit_id text references public.habits(id) on delete cascade,
  type text not null,
  sub_type text,
  position_x float not null,
  position_y float not null,
  position_z float not null,
  scale float not null,
  color text not null,
  rotation float not null,
  milestone boolean not null default false,
  created_at timestamptz not null default now()
);

-- Enable RLS
alter table public.habits enable row level security;
alter table public.habit_entries enable row level security;
alter table public.planet_objects enable row level security;

-- RLS Policies for habits
drop policy if exists "habits_select_own" on public.habits;
create policy "habits_select_own" on public.habits
  for select using (auth.uid() = user_id);

drop policy if exists "habits_insert_own" on public.habits;
create policy "habits_insert_own" on public.habits
  for insert with check (auth.uid() = user_id);

drop policy if exists "habits_update_own" on public.habits;
create policy "habits_update_own" on public.habits
  for update using (auth.uid() = user_id);

drop policy if exists "habits_delete_own" on public.habits;
create policy "habits_delete_own" on public.habits
  for delete using (auth.uid() = user_id);

-- RLS Policies for habit_entries
drop policy if exists "habit_entries_select_own" on public.habit_entries;
create policy "habit_entries_select_own" on public.habit_entries
  for select using (auth.uid() = user_id);

drop policy if exists "habit_entries_insert_own" on public.habit_entries;
create policy "habit_entries_insert_own" on public.habit_entries
  for insert with check (auth.uid() = user_id);

drop policy if exists "habit_entries_update_own" on public.habit_entries;
create policy "habit_entries_update_own" on public.habit_entries
  for update using (auth.uid() = user_id);

drop policy if exists "habit_entries_delete_own" on public.habit_entries;
create policy "habit_entries_delete_own" on public.habit_entries
  for delete using (auth.uid() = user_id);

-- RLS Policies for planet_objects
drop policy if exists "planet_objects_select_own" on public.planet_objects;
create policy "planet_objects_select_own" on public.planet_objects
  for select using (auth.uid() = user_id);

drop policy if exists "planet_objects_insert_own" on public.planet_objects;
create policy "planet_objects_insert_own" on public.planet_objects
  for insert with check (auth.uid() = user_id);

drop policy if exists "planet_objects_update_own" on public.planet_objects;
create policy "planet_objects_update_own" on public.planet_objects
  for update using (auth.uid() = user_id);

drop policy if exists "planet_objects_delete_own" on public.planet_objects;
create policy "planet_objects_delete_own" on public.planet_objects
  for delete using (auth.uid() = user_id);

-- Create indexes for better performance
create index if not exists habits_user_id_idx on public.habits(user_id);
create index if not exists habit_entries_user_id_idx on public.habit_entries(user_id);
create index if not exists habit_entries_habit_id_date_idx on public.habit_entries(habit_id, date);
create index if not exists planet_objects_user_id_idx on public.planet_objects(user_id);