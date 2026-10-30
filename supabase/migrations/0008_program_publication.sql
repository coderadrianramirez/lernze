-- Borradores, publicación validada y acceso de alumnos a programas retirados.
-- Aplicar ANTES de usar la publicación en producción. No cambia el estado de programas existentes.
begin;

alter table public.courses alter column published set default false;

-- Evita recursión entre las políticas de courses y enrollments.
-- La identidad siempre proviene de la sesión, nunca de un parámetro del cliente.
create function public.has_course_access(program_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select auth.uid() is not null and (
    exists (select 1 from public.courses c where c.id = program_id and c.creator_id = auth.uid())
    or exists (select 1 from public.enrollments e where e.course_id = program_id and e.user_id = auth.uid())
  );
$$;
revoke all on function public.has_course_access(uuid) from public;
grant execute on function public.has_course_access(uuid) to anon, authenticated;

-- La instalación inicial de producción usó el nombre sin tilde.
drop policy if exists "cursos publicados son públicos" on public.courses;
drop policy if exists "cursos publicados son publicos" on public.courses;
create policy "catálogo y acceso adquirido" on public.courses
  for select using (published or creator_id = (select auth.uid()) or public.has_course_access(id));

drop policy "temario visible" on public.lessons;
create policy "temario visible" on public.lessons
  for select using (
    exists (select 1 from public.courses c where c.id = course_id and c.published)
    or public.has_course_access(course_id)
  );

drop policy "cada quien se inscribe" on public.enrollments;
create policy "cada quien se inscribe en programas publicados" on public.enrollments
  for insert with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.courses c where c.id = course_id and c.published)
  );

drop policy "cada quien marca su progreso" on public.lesson_progress;
create policy "cada quien marca su progreso" on public.lesson_progress
  for insert with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.lessons l where l.id = lesson_id and public.has_course_access(l.course_id))
  );
create policy "cada quien actualiza su progreso" on public.lesson_progress
  for update using (user_id = (select auth.uid())) with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.lessons l where l.id = lesson_id and public.has_course_access(l.course_id))
  );

drop policy "ver videos de clases" on storage.objects;
create policy "ver videos de clases" on storage.objects
  for select to anon, authenticated using (
    bucket_id = 'lessons' and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or exists (
        select 1 from public.lessons l join public.courses c on c.id = l.course_id
        where l.video_path = name
          and (public.has_course_access(l.course_id) or (l.is_preview and c.published))
      )
    )
  );

drop policy "el creador borra videos de clases" on storage.objects;
create policy "el creador borra videos de clases" on storage.objects
  for delete to authenticated using (
    bucket_id = 'lessons' and (storage.foldername(name))[1] = (select auth.uid())::text
    and not exists (
      select 1 from public.lessons l join public.courses c on c.id = l.course_id
      where l.video_path = name and c.published
    )
  );

-- La base valida también las llamadas directas: no basta con desactivar un botón.
create function public.validate_program_publication() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.published then
    if char_length(btrim(new.description)) < 20 then
      raise exception 'Añade una descripción de al menos 20 caracteres antes de publicar.';
    end if;
    if not exists (select 1 from public.lessons l where l.course_id = new.id) then
      raise exception 'Agrega al menos una clase con video antes de publicar.';
    end if;
    if exists (
      select 1 from public.lessons l where l.course_id = new.id and (
        l.video_path is null
        or split_part(l.video_path, '/', 1) <> new.creator_id::text
        or split_part(l.video_path, '/', 2) <> new.id::text
        or not exists (select 1 from storage.objects o where o.bucket_id = 'lessons' and o.name = l.video_path)
      )
    ) then
      raise exception 'Todas las clases deben tener un video subido a este programa.';
    end if;
  end if;
  return new;
end;
$$;
revoke all on function public.validate_program_publication() from public, anon, authenticated;
create trigger validate_program_publication before insert or update of published, description, creator_id on public.courses
  for each row execute function public.validate_program_publication();

-- Serializa cambios de clases con publicación para evitar programas vacíos por concurrencia.
create function public.protect_published_lessons() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  program_id uuid;
  program public.courses%rowtype;
begin
  if tg_op = 'UPDATE' and new.course_id <> old.course_id then
    raise exception 'No se puede mover una clase a otro programa.';
  end if;
  if tg_op = 'DELETE' then program_id := old.course_id; else program_id := new.course_id; end if;
  select * into program from public.courses where id = program_id for update;
  if program.published then
    if tg_op = 'DELETE' then
      if (select count(*) from public.lessons where course_id = program_id) <= 1 then
        raise exception 'Tu programa necesita al menos una clase. Retíralo del catálogo antes de borrar la última.';
      end if;
    elsif new.video_path is null
      or split_part(new.video_path, '/', 1) <> program.creator_id::text
      or split_part(new.video_path, '/', 2) <> program_id::text
      or not exists (select 1 from storage.objects o where o.bucket_id = 'lessons' and o.name = new.video_path) then
      raise exception 'Sube un video antes de guardar una clase en un programa publicado.';
    end if;
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;
revoke all on function public.protect_published_lessons() from public, anon, authenticated;
create trigger protect_published_lessons before insert or update or delete on public.lessons
  for each row execute function public.protect_published_lessons();
commit;
