-- Portadas de trailers y clases, y eliminación por su creador.
-- No cambia ni elimina programas existentes. Ejecutar manualmente en Supabase.
begin;
alter table public.lessons add column cover jsonb;

create function public.content_tools_ready() returns boolean
language sql stable set search_path = '' as $$ select true; $$;
revoke all on function public.content_tools_ready() from public;
grant execute on function public.content_tools_ready() to authenticated;

create policy "el creador elimina sus programas" on public.courses
  for delete to authenticated using (creator_id = (select auth.uid()));

insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('covers','covers',true,2097152,array['image/webp']) on conflict (id) do nothing;

create policy "el creador sube sus portadas" on storage.objects
  for insert to authenticated with check (
    bucket_id='covers' and (storage.foldername(name))[1]=(select auth.uid())::text
    and name ~ '^[0-9a-f-]{36}(/[0-9a-f-]{36})?/[0-9a-f-]{36}\.webp$'
    and (array_length(storage.foldername(name),1)=1 or exists (
      select 1 from public.courses c where c.id::text=(storage.foldername(name))[2] and c.creator_id=(select auth.uid())
    ))
  );
create policy "el creador consulta sus portadas" on storage.objects
  for select to authenticated using (bucket_id='covers' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy "el creador borra portadas sin usar" on storage.objects
  for delete to authenticated using (
    bucket_id='covers' and (storage.foldername(name))[1]=(select auth.uid())::text
    and not exists (select 1 from public.courses c where c.art->'cover'->>'path'=name)
    and not exists (select 1 from public.lessons l where l.cover->>'path'=name)
  );

create function public.validate_content_cover() returns trigger
language plpgsql security definer set search_path = '' as $$
declare config jsonb; owner_id uuid; program_id uuid; image_path text;
begin
  if tg_table_name='courses' then
    config:=new.art->'cover'; owner_id:=new.creator_id;
  else
    config:=new.cover; program_id:=new.course_id;
    select creator_id into owner_id from public.courses where id=program_id;
  end if;
  if config is null or config='null'::jsonb then return new; end if;
  if jsonb_typeof(config)<>'object' then raise exception 'La portada no es válida.'; end if;
  if char_length(coalesce(config->>'title',''))>120
    or coalesce(config->>'tone','amber') not in ('amber','teal','rose')
    or coalesce((config->>'x')::numeric,50) not between 0 and 100
    or coalesce((config->>'y')::numeric,50) not between 0 and 100
    or coalesce((config->>'zoom')::numeric,1) not between 1 and 2
  then raise exception 'Revisa el título y el encuadre de la portada.'; end if;
  image_path:=config->>'path';
  if image_path is not null then
    if owner_id is null or split_part(image_path,'/',1)<>owner_id::text
      or image_path !~ '^[0-9a-f-]{36}(/[0-9a-f-]{36})?/[0-9a-f-]{36}\.webp$'
      or (program_id is not null and split_part(image_path,'/',2)<>program_id::text)
      or not exists (select 1 from storage.objects where bucket_id='covers' and name=image_path)
    then raise exception 'La imagen debe estar subida y pertenecer a este contenido.'; end if;
  end if;
  return new;
end;
$$;
revoke all on function public.validate_content_cover() from public,anon,authenticated;
create trigger validate_program_cover before insert or update of art on public.courses
  for each row execute function public.validate_content_cover();
create trigger validate_lesson_cover before insert or update of cover on public.lessons
  for each row execute function public.validate_content_cover();
commit;
