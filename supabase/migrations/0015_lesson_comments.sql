-- Conversaciones privadas por clase. No depende de 0012 ni 0013.
begin;

create function public.can_access_lesson_comments(target_lesson uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select auth.uid() is not null and exists (
    select 1 from public.lessons l join public.courses c on c.id=l.course_id
    where l.id=target_lesson and (c.creator_id=auth.uid() or exists (
      select 1 from public.enrollments e where e.course_id=c.id and e.user_id=auth.uid()
    ))
  );
$$;
revoke all on function public.can_access_lesson_comments(uuid) from public, anon, authenticated;
grant execute on function public.can_access_lesson_comments(uuid) to authenticated;

create table public.lesson_comments (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  author_id uuid references public.profiles(id) on delete set null,
  moderator_id uuid references public.profiles(id) on delete set null,
  parent_id uuid references public.lesson_comments(id) on delete cascade,
  body text not null default '' check (char_length(body)<=2000),
  image_paths text[] not null default '{}' check (cardinality(image_paths)<=4),
  deleted boolean not null default false,
  created_at timestamptz not null default now(),
  edited_at timestamptz,
  check (parent_id is null or parent_id<>id),
  check (deleted or char_length(btrim(body))>0 or cardinality(image_paths)>0)
);
create index lesson_comments_thread_idx on public.lesson_comments(lesson_id,parent_id,created_at desc,id desc);
create index lesson_comments_author_idx on public.lesson_comments(author_id,created_at desc);
create index lesson_comments_images_idx on public.lesson_comments using gin(image_paths);
alter table public.lesson_comments enable row level security;
create policy "comentarios solo para miembros" on public.lesson_comments for select to authenticated
using (public.can_access_lesson_comments(lesson_id));
revoke all on public.lesson_comments from public, anon, authenticated;
grant select on public.lesson_comments to authenticated;

-- Permite limpiar fotos moderadas sin dar al creador acceso a borradores sin enviar.
create table public.lesson_comment_image_removals(photo text primary key, moderator_id uuid, created_at timestamptz not null default now());
alter table public.lesson_comment_image_removals enable row level security;
revoke all on public.lesson_comment_image_removals from public, anon, authenticated;
create function public.queue_removed_comment_images() returns trigger
language plpgsql security definer set search_path='' as $$
declare remaining text[];
begin
  remaining:=case when tg_op='DELETE' then '{}'::text[] else new.image_paths end;
  insert into public.lesson_comment_image_removals(photo,moderator_id)
    select p,old.moderator_id from unnest(old.image_paths) p where not p=any(remaining) on conflict do nothing;
  if tg_op='DELETE' then return old; end if;
  return new;
end;
$$;
revoke all on function public.queue_removed_comment_images() from public, anon, authenticated;
create trigger queue_removed_comment_images after update of image_paths or delete on public.lesson_comments for each row execute function public.queue_removed_comment_images();

create function public.save_lesson_comment(target_lesson uuid, comment_id uuid, parent_comment uuid, comment_body text, photos text[]) returns uuid
language plpgsql security definer set search_path = '' as $$
declare old_row public.lesson_comments; photo text; result_id uuid; clean_body text:=btrim(coalesce(comment_body,'')); clean_photos text[]:=coalesce(photos,'{}');
begin
  if not public.can_access_lesson_comments(target_lesson) then raise exception 'Únete al programa para comentar.'; end if;
  perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,15));
  if char_length(clean_body)>2000 or cardinality(clean_photos)>4 or (clean_body='' and cardinality(clean_photos)=0)
    or array_position(clean_photos,null) is not null then raise exception 'Escribe un comentario o añade hasta cuatro fotos.'; end if;
  if comment_id is not null then
    select * into old_row from public.lesson_comments where id=comment_id for update;
    if not found or old_row.lesson_id<>target_lesson or old_row.author_id is distinct from auth.uid() or old_row.deleted
      then raise exception 'Solo puedes editar tus comentarios.'; end if;
    if parent_comment is distinct from old_row.parent_id then raise exception 'No se puede mover una respuesta.'; end if;
  else
    if (select count(*) from public.lesson_comments where author_id=auth.uid() and created_at>now()-interval '1 minute')>=10
      then raise exception 'Espera un minuto antes de publicar otro comentario.'; end if;
    if parent_comment is not null and not exists(select 1 from public.lesson_comments where id=parent_comment and lesson_id=target_lesson and parent_id is null)
      then raise exception 'La conversación ya no está disponible.'; end if;
  end if;
  foreach photo in array clean_photos loop
    if photo is null or photo !~ ('^'||auth.uid()::text||'/'||target_lesson::text||'/[0-9a-f-]{36}\.webp$')
      or not exists(select 1 from storage.objects where bucket_id='comment-images' and name=photo)
      or exists(select 1 from public.lesson_comments where image_paths @> array[photo] and id is distinct from comment_id)
      then raise exception 'La foto no pertenece a este comentario.'; end if;
  end loop;
  if cardinality(clean_photos)<>(select count(distinct p) from unnest(clean_photos) p) then raise exception 'No repitas la misma foto.'; end if;
  if comment_id is null then
    insert into public.lesson_comments(lesson_id,author_id,moderator_id,parent_id,body,image_paths)
      select target_lesson,auth.uid(),c.creator_id,parent_comment,clean_body,clean_photos from public.lessons l join public.courses c on c.id=l.course_id where l.id=target_lesson returning id into result_id;
  else
    update public.lesson_comments set body=clean_body,image_paths=clean_photos,edited_at=now() where id=comment_id returning id into result_id;
  end if;
  return result_id;
end;
$$;
revoke all on function public.save_lesson_comment(uuid,uuid,uuid,text,text[]) from public, anon, authenticated;
grant execute on function public.save_lesson_comment(uuid,uuid,uuid,text,text[]) to authenticated;

create function public.remove_lesson_comment(target_comment uuid) returns text[]
language plpgsql security definer set search_path = '' as $$
declare item public.lesson_comments;
begin
  select * into item from public.lesson_comments where id=target_comment for update;
  if not found or not public.can_access_lesson_comments(item.lesson_id) then raise exception 'No tienes acceso a este comentario.'; end if;
  if item.author_id is distinct from auth.uid() and not exists (
    select 1 from public.lessons l join public.courses c on c.id=l.course_id where l.id=item.lesson_id and c.creator_id=auth.uid()
  ) then raise exception 'No puedes eliminar este comentario.'; end if;
  update public.lesson_comments set body='',image_paths='{}',deleted=true where id=target_comment;
  return item.image_paths;
end;
$$;
revoke all on function public.remove_lesson_comment(uuid) from public, anon, authenticated;
grant execute on function public.remove_lesson_comment(uuid) to authenticated;

create function public.list_lesson_comments(target_lesson uuid,parent_comment uuid default null,before_created timestamptz default null,before_id uuid default null)
returns table(id uuid,lesson_id uuid,parent_id uuid,author_id uuid,author_name text,avatar_path text,is_creator boolean,body text,image_paths text[],deleted boolean,created_at timestamptz,edited_at timestamptz,reply_count bigint)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.can_access_lesson_comments(target_lesson) then raise exception 'Únete al programa para ver la conversación.'; end if;
  return query select m.id,m.lesson_id,m.parent_id,case when m.deleted then null else m.author_id end,
    case when m.deleted then 'Comentario eliminado' else coalesce(nullif(p.display_name,''),'Cuenta eliminada') end,
    case when m.deleted then null else p.avatar_path end,
    not m.deleted and m.author_id=c.creator_id,m.body,m.image_paths,m.deleted,m.created_at,m.edited_at,
    (select count(*) from public.lesson_comments r where r.parent_id=m.id and not r.deleted)
  from public.lesson_comments m join public.lessons l on l.id=m.lesson_id join public.courses c on c.id=l.course_id left join public.profiles p on p.id=m.author_id
  where m.lesson_id=target_lesson and m.parent_id is not distinct from parent_comment
    and (not m.deleted or (m.parent_id is null and exists(select 1 from public.lesson_comments r where r.parent_id=m.id and not r.deleted)))
    and (before_created is null or before_id is null or (m.created_at,m.id)<(before_created,before_id))
  order by m.created_at desc,m.id desc limit 21;
end;
$$;
revoke all on function public.list_lesson_comments(uuid,uuid,timestamptz,uuid) from public, anon, authenticated;
grant execute on function public.list_lesson_comments(uuid,uuid,timestamptz,uuid) to authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('comment-images','comment-images',false,5242880,array['image/webp']) on conflict(id) do nothing;

create function public.can_read_comment_image(photo text) returns boolean
language sql stable security definer set search_path='' as $$
  select auth.uid() is not null and (
    exists(select 1 from public.lesson_comments m where m.image_paths @> array[photo] and not m.deleted and public.can_access_lesson_comments(m.lesson_id))
    or ((storage.foldername(photo))[1]=auth.uid()::text and not exists(select 1 from public.lesson_comments m where m.image_paths @> array[photo]))
  );
$$;
create function public.can_delete_comment_image(photo text) returns boolean
language sql stable security definer set search_path='' as $$
  select auth.uid() is not null and not exists(select 1 from public.lesson_comments m where m.image_paths @> array[photo])
    and ((storage.foldername(photo))[1]=auth.uid()::text or exists (select 1 from public.lesson_comment_image_removals q where q.photo=photo and q.moderator_id=auth.uid()));
$$;
revoke all on function public.can_read_comment_image(text),public.can_delete_comment_image(text) from public, anon, authenticated;
grant execute on function public.can_read_comment_image(text),public.can_delete_comment_image(text) to authenticated;
create policy "subir fotos de comentarios propias" on storage.objects for insert to authenticated with check (
  bucket_id='comment-images' and (storage.foldername(name))[1]=auth.uid()::text
  and name ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}/[0-9a-f-]{36}\.webp$'
  and exists(select 1 from public.lessons l where l.id::text=(storage.foldername(name))[2] and public.can_access_lesson_comments(l.id))
);
create policy "fotos de comentarios privadas" on storage.objects for select to authenticated using (bucket_id='comment-images' and (public.can_read_comment_image(name) or public.can_delete_comment_image(name)));
create policy "limpiar fotos de comentarios sin uso" on storage.objects for delete to authenticated using (bucket_id='comment-images' and public.can_delete_comment_image(name));
commit;
