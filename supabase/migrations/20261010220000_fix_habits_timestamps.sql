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
