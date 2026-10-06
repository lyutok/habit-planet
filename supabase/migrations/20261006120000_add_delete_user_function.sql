-- Creates a function that allows an authenticated user to delete their own account.
-- Uses SECURITY DEFINER so it can access auth.users with elevated privileges.
-- The caller must be authenticated; the function deletes auth.uid() only.

create or replace function public.delete_current_user()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Only allow authenticated users to delete their own account
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  -- Deleting from auth.users cascades to all user data tables
  -- (habits, habit_entries, planet_objects) via ON DELETE CASCADE
  delete from auth.users where id = auth.uid();
end;
$$;

-- Restrict execution to authenticated users only
revoke all on function public.delete_current_user() from public, anon;
grant execute on function public.delete_current_user() to authenticated;
