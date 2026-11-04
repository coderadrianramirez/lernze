-- Banner y enlaces opcionales. No modifica perfiles ni programas existentes.
begin;
create table public.profile_branding (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  banner_path text,
  links jsonb not null default '[]'::jsonb
);
alter table public.profile_branding enable row level security;
create policy "branding visible" on public.profile_branding for select to anon,authenticated using (
  profile_id=(select auth.uid()) or exists(select 1 from public.creator_accounts a where a.profile_id=profile_branding.profile_id)
);
create policy "branding propio insert" on public.profile_branding for insert to authenticated with check (profile_id=(select auth.uid()));
create policy "branding propio update" on public.profile_branding for update to authenticated using (profile_id=(select auth.uid())) with check (profile_id=(select auth.uid()));
revoke all on public.profile_branding from public,anon,authenticated;
grant select on public.profile_branding to anon,authenticated;
grant insert,update on public.profile_branding to authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('profile-banners','profile-banners',true,2097152,array['image/webp']);
create policy "banner propio insert" on storage.objects for insert to authenticated with check (
  bucket_id='profile-banners' and (storage.foldername(name))[1]=(select auth.uid())::text
  and name ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.webp$'
);
create policy "banner propio select" on storage.objects for select to authenticated using (
  bucket_id='profile-banners' and (storage.foldername(name))[1]=(select auth.uid())::text
);
create policy "banner propio delete sin uso" on storage.objects for delete to authenticated using (
  bucket_id='profile-banners' and (storage.foldername(name))[1]=(select auth.uid())::text
  and not exists(select 1 from public.profile_branding b where b.profile_id=(select auth.uid()) and b.banner_path=name)
);
create function public.validate_profile_branding() returns trigger
language plpgsql security definer set search_path='' as $$
declare link jsonb;
begin
  if new.banner_path is not null and (
    split_part(new.banner_path,'/',1)<>new.profile_id::text
    or new.banner_path !~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.webp$'
    or not exists(select 1 from storage.objects where bucket_id='profile-banners' and name=new.banner_path)
  ) then raise exception 'El banner debe estar subido y pertenecer a tu cuenta.'; end if;
  if jsonb_typeof(new.links)<>'array' then raise exception 'Los enlaces deben ser una lista.'; end if;
  if jsonb_array_length(new.links)>6 then raise exception 'Máximo seis enlaces.'; end if;
  for link in select * from jsonb_array_elements(new.links) loop
    if jsonb_typeof(link)<>'string' or char_length(link#>>'{}')>500
      or (link#>>'{}') !~ '^https://([a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z]{2,63}([/?#][^[:space:]\\]*)?$'
    then raise exception 'Usa un enlace HTTPS válido.'; end if;
  end loop;
  return new;
end;
$$;
revoke all on function public.validate_profile_branding() from public,anon,authenticated;
create trigger validate_profile_branding before insert or update on public.profile_branding
for each row execute function public.validate_profile_branding();
commit;
