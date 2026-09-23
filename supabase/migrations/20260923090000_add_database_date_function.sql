create or replace function public.get_database_date()
returns date
language sql
stable
security invoker
set search_path = public
as $$
  select current_date;
$$;

grant execute on function public.get_database_date() to anon, authenticated;
