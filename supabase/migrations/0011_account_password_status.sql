-- Solo permite consultar si la cuenta propia tiene contraseña. No devuelve el hash.
create or replace function public.account_has_password()
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from auth.users
    where id = (select auth.uid()) and coalesce(encrypted_password, '') <> ''
  );
$$;
revoke all on function public.account_has_password() from public, anon;
grant execute on function public.account_has_password() to authenticated;
