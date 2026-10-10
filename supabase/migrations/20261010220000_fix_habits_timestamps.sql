-- Fix habits table timestamps: preserve created_at on update and auto-update updated_at
create or replace function public.handle_habits_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Always preserve the original created_at timestamp
  new.created_at = old.created_at;
  -- Automatically set updated_at to current timestamp on any update
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_habits_updated_at on public.habits;
create trigger set_habits_updated_at
  before update on public.habits
  for each row
  execute function public.handle_habits_updated_at();

-- Enable Supabase Realtime broadcasting for habits, habit_entries, and planet_objects
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.habits;
    alter publication supabase_realtime add table public.habit_entries;
    alter publication supabase_realtime add table public.planet_objects;
  end if;
exception when others then
  null;
end $$;
