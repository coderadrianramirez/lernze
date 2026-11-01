-- Señales privadas para recomendaciones. No se guarda el texto de búsquedas.
begin;
create table public.recommendation_signals (
  user_id uuid not null references public.profiles(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  kind text not null check (kind in ('trailer','search','creator','dismiss')),
  occurred_at timestamptz not null default now(),
  primary key (user_id, course_id, kind)
);
create index recommendation_signals_recent_idx on public.recommendation_signals(user_id, occurred_at desc);
alter table public.recommendation_signals enable row level security;
create policy "leer mis señales" on public.recommendation_signals for select to authenticated
  using (user_id=(select auth.uid()));
revoke all on public.recommendation_signals from public, anon, authenticated;
grant select on public.recommendation_signals to authenticated;

-- La identidad y la hora proceden del servidor; solo admite programas públicos ajenos.
create function public.record_recommendation_signal(target_course uuid, signal_kind text) returns boolean
language plpgsql security definer set search_path='' as $$
declare viewer uuid := auth.uid();
begin
  if viewer is null or signal_kind not in ('trailer','search','creator','dismiss') or signal_kind is null then return false; end if;
  if not exists(select 1 from public.courses c where c.id=target_course and c.published and c.creator_id is distinct from viewer) then return false; end if;
  -- Mantiene un único registro por programa y tipo; las repeticiones no aumentan frecuencia.
  insert into public.recommendation_signals(user_id,course_id,kind)
  values(viewer,target_course,signal_kind)
  on conflict(user_id,course_id,kind) do update set occurred_at=now()
    where recommendation_signals.occurred_at < now()-interval '6 hours';
  delete from public.recommendation_signals where user_id=viewer and occurred_at < now()-interval '180 days';
  -- Cota privada por usuario, incluso con un catálogo grande.
  delete from public.recommendation_signals where user_id=viewer and (course_id,kind) in (
    select s.course_id,s.kind from public.recommendation_signals s where s.user_id=viewer
    order by s.occurred_at desc,s.course_id,s.kind offset 400
  );
  return true;
end; $$;
revoke all on function public.record_recommendation_signal(uuid,text) from public;
grant execute on function public.record_recommendation_signal(uuid,text) to authenticated;

create function public.restore_recommendation(target_course uuid) returns boolean
language plpgsql security definer set search_path='' as $$
begin
  if auth.uid() is null then return false; end if;
  delete from public.recommendation_signals where user_id=auth.uid() and course_id=target_course and kind='dismiss';
  return true;
end; $$;
revoke all on function public.restore_recommendation(uuid) from public;
grant execute on function public.restore_recommendation(uuid) to authenticated;
commit;
