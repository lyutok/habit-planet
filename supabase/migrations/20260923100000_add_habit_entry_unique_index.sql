create unique index if not exists habit_entries_habit_id_date_unique
  on public.habit_entries (habit_id, date);

notify pgrst, 'reload schema';
