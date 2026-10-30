-- Configuración de perfil: foto propia y nombre coherente en todos los programas.
-- No cambia perfiles ni programas existentes. Ejecutar después de 0009.
begin;
alter table public.profiles add column avatar_path text;
alter table public.profiles add constraint profile_name_length check (char_length(display_name)<=120);
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('avatars','avatars',true,1048576,array['image/webp']) on conflict (id) do nothing;
create policy "foto propia insert" on storage.objects for insert to authenticated with check (
  bucket_id='avatars' and (storage.foldername(name))[1]=(select auth.uid())::text
  and name ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.webp$'
);
create policy "foto propia select" on storage.objects for select to authenticated using (
  bucket_id='avatars' and (storage.foldername(name))[1]=(select auth.uid())::text
);
create policy "foto propia delete sin uso" on storage.objects for delete to authenticated using (
  bucket_id='avatars' and (storage.foldername(name))[1]=(select auth.uid())::text
  and not exists (select 1 from public.profiles p where p.avatar_path=name)
);
create function public.validate_profile_photo() returns trigger
language plpgsql security definer set search_path='' as $$
begin
  if new.avatar_path is not null and (
    split_part(new.avatar_path,'/',1)<>new.id::text
    or new.avatar_path !~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.webp$'
    or not exists(select 1 from storage.objects where bucket_id='avatars' and name=new.avatar_path)
  ) then raise exception 'La foto debe estar subida y pertenecer a tu cuenta.'; end if;
  return new;
end;
$$;
revoke all on function public.validate_profile_photo() from public,anon,authenticated;
create trigger validate_profile_photo before insert or update of avatar_path on public.profiles
for each row execute function public.validate_profile_photo();
create function public.account_settings_ready() returns boolean language sql stable set search_path='' as $$ select true; $$;
revoke all on function public.account_settings_ready() from public;
grant execute on function public.account_settings_ready() to authenticated;
create function public.save_creator_profile(public_name text, photo_path text) returns void
language plpgsql security invoker set search_path='' as $$
begin
  if auth.uid() is null then raise exception 'Inicia sesión para editar tu perfil.'; end if;
  if char_length(trim(public_name)) not between 2 and 120 then raise exception 'Escribe un nombre de entre 2 y 120 caracteres.'; end if;
  update public.profiles set display_name=trim(public_name),avatar_path=photo_path where id=auth.uid();
  if not found then raise exception 'No encontramos tu perfil.'; end if;
  update public.courses set creator_name=trim(public_name) where creator_id=auth.uid();
end;
$$;
revoke all on function public.save_creator_profile(text,text) from public;
grant execute on function public.save_creator_profile(text,text) to authenticated;
commit;
