-- Clases de cada programa, progreso de los alumnos y videos privados.

create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  position integer not null default 0,
  title text not null check (char_length(title) between 2 and 120),
  description text not null default '' check (char_length(description) <= 2000),
  -- Ruta dentro del bucket privado "lessons": <creador>/<programa>/<archivo>.
  video_path text,
  duration_seconds integer not null default 0 check (duration_seconds >= 0),
  is_preview boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists lessons_course_idx on public.lessons (course_id, position);

alter table public.lessons enable row level security;

-- El temario de un programa publicado es público (es parte de la venta). El creador ve también sus borradores.
create policy "temario visible" on public.lessons
  for select using (
    exists (select 1 from public.courses c where c.id = course_id and (c.published or c.creator_id = (select auth.uid())))
  );
create policy "el creador agrega clases" on public.lessons
  for insert with check (exists (select 1 from public.courses c where c.id = course_id and c.creator_id = (select auth.uid())));
create policy "el creador edita clases" on public.lessons
  for update using (exists (select 1 from public.courses c where c.id = course_id and c.creator_id = (select auth.uid())))
  with check (exists (select 1 from public.courses c where c.id = course_id and c.creator_id = (select auth.uid())));
create policy "el creador borra clases" on public.lessons
  for delete using (exists (select 1 from public.courses c where c.id = course_id and c.creator_id = (select auth.uid())));

-- Clases completadas por cada alumno.
create table if not exists public.lesson_progress (
  user_id uuid not null references public.profiles (id) on delete cascade,
  lesson_id uuid not null references public.lessons (id) on delete cascade,
  completed_at timestamptz not null default now(),
  primary key (user_id, lesson_id)
);

alter table public.lesson_progress enable row level security;

create policy "cada quien ve su progreso" on public.lesson_progress
  for select using (user_id = (select auth.uid()));
create policy "cada quien marca su progreso" on public.lesson_progress
  for insert with check (user_id = (select auth.uid()));
create policy "cada quien desmarca su progreso" on public.lesson_progress
  for delete using (user_id = (select auth.uid()));

-- Bucket privado: los videos se sirven solo con enlaces firmados de corta duración.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('lessons', 'lessons', false, 52428800, array['video/mp4', 'video/webm'])
on conflict (id) do nothing;

-- El creador sube y borra dentro de <su id>/<un programa suyo>/.
create policy "el creador sube clases" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'lessons'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and exists (
      select 1 from public.courses c
      where c.id::text = (storage.foldername(name))[2] and c.creator_id = (select auth.uid())
    )
  );
create policy "el creador borra videos de clases" on storage.objects
  for delete to authenticated
  using (bucket_id = 'lessons' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- Ver un video (firmar su enlace): el creador, quien se inscribió, o cualquiera si la clase es vista previa.
create policy "ver videos de clases" on storage.objects
  for select to anon, authenticated
  using (
    bucket_id = 'lessons'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or exists (
        select 1 from public.lessons l
        join public.enrollments e on e.course_id = l.course_id
        where l.video_path = name and e.user_id = (select auth.uid())
      )
      or exists (select 1 from public.lessons l where l.video_path = name and l.is_preview)
    )
  );
