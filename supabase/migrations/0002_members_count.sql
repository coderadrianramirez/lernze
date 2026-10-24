-- Reemplaza la vista course_member_counts (marcada como riesgo por el linter de Supabase)
-- por un contador guardado en el curso y mantenido por un trigger.

alter table public.courses add column members_count integer not null default 0 check (members_count >= 0);

update public.courses c
set members_count = (select count(*) from public.enrollments e where e.course_id = c.id);

create function public.sync_members_count() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    update public.courses set members_count = members_count + 1 where id = new.course_id;
  elsif tg_op = 'DELETE' then
    update public.courses set members_count = greatest(members_count - 1, 0) where id = old.course_id;
  end if;
  return null;
end;
$$;

revoke execute on function public.sync_members_count() from public, anon, authenticated;

create trigger enrollments_sync_members
  after insert or delete on public.enrollments
  for each row execute function public.sync_members_count();

drop view public.course_member_counts;
