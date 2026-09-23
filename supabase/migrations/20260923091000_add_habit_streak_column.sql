alter table public.habits
  add column if not exists streak integer not null default 0;

notify pgrst, 'reload schema';
