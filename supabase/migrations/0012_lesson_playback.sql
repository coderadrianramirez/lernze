-- Posición de reproducción privada. No cambia clases, vídeos ni clases completadas.
begin;

create table public.lesson_playback (
  user_id uuid not null references public.profiles(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  video_path text not null,
  position_seconds integer not null check (position_seconds between 0 and 86400),
  updated_at timestamptz not null default now(),
  primary key (user_id, lesson_id)
);

alter table public.lesson_playback enable row level security;
create policy "reproduccion propia visible" on public.lesson_playback for select to authenticated
  using (user_id = (select auth.uid()) and exists (
    select 1 from public.lessons l where l.id = lesson_id and public.has_course_access(l.course_id)
  ));
create policy "guardar reproduccion propia" on public.lesson_playback for insert to authenticated
  with check (user_id = (select auth.uid()) and exists (
    select 1 from public.lessons l where l.id = lesson_id and public.has_course_access(l.course_id)
      and l.video_path = lesson_playback.video_path
      and (l.duration_seconds = 0 or position_seconds <= l.duration_seconds)
  ));
create policy "actualizar reproduccion propia" on public.lesson_playback for update to authenticated
  using (user_id = (select auth.uid()) and exists (
    select 1 from public.lessons l where l.id = lesson_id and public.has_course_access(l.course_id)
  ))
  with check (user_id = (select auth.uid()) and exists (
    select 1 from public.lessons l where l.id = lesson_id and public.has_course_access(l.course_id)
      and l.video_path = lesson_playback.video_path
      and (l.duration_seconds = 0 or position_seconds <= l.duration_seconds)
  ));
create policy "borrar reproduccion propia" on public.lesson_playback for delete to authenticated
  using (user_id = (select auth.uid()));

create function public.timestamp_lesson_playback() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at = clock_timestamp();
  return new;
end;
$$;
revoke all on function public.timestamp_lesson_playback() from public, anon, authenticated;
create trigger timestamp_lesson_playback before insert or update on public.lesson_playback
  for each row execute function public.timestamp_lesson_playback();
revoke all on public.lesson_playback from public, anon;
grant select, insert, update, delete on public.lesson_playback to authenticated;

commit;
