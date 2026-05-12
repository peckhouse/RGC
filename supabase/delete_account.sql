-- delete_account.sql
-- Run once in the Supabase SQL editor (Project → SQL Editor → New query).
-- Creates public.delete_user_account() so signed-in users can purge their
-- own account from the app. Required for App Store guideline 5.1.1(v) and
-- Google Play policy compliance.

create or replace function public.delete_user_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid;
begin
  uid := auth.uid();
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  delete from public.user_collections where user_id = uid;
  delete from public.user_wishlists  where user_id = uid;
  delete from public.profiles        where id      = uid;
  delete from auth.users             where id      = uid;
end;
$$;

revoke all on function public.delete_user_account from public;
grant execute on function public.delete_user_account to authenticated;
