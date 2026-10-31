-- Directorio público acotado de creadores y seguimiento privado por usuario.
-- Los perfiles de alumnos, correos, intereses e inscripciones no se hacen públicos.
begin;

create table public.creator_accounts (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.creator_accounts enable row level security;
create policy "directorio de creadores publico" on public.creator_accounts for select using (true);
revoke all on public.creator_accounts from public, anon, authenticated;
grant select on public.creator_accounts to anon, authenticated;

insert into public.creator_accounts(profile_id)
select distinct creator_id from public.courses where published and creator_id is not null on conflict do nothing;

create function public.register_published_creator() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.published and new.creator_id is not null then
    insert into public.creator_accounts(profile_id) values (new.creator_id) on conflict do nothing;
  end if;
  return new;
end;
$$;
revoke all on function public.register_published_creator() from public, anon, authenticated;
create trigger register_published_creator after insert or update of published on public.courses
for each row execute function public.register_published_creator();

create table public.creator_follows (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  creator_id uuid not null references public.creator_accounts(profile_id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, creator_id),
  check (follower_id <> creator_id)
);
create index creator_follows_creator_idx on public.creator_follows(creator_id);
alter table public.creator_follows enable row level security;
create policy "consultar mis seguimientos" on public.creator_follows for select to authenticated
  using (follower_id = (select auth.uid()));
create policy "seguir como usuario propio" on public.creator_follows for insert to authenticated
  with check (follower_id = (select auth.uid()) and follower_id <> creator_id);
create policy "dejar de seguir como usuario propio" on public.creator_follows for delete to authenticated
  using (follower_id = (select auth.uid()));
revoke all on public.creator_follows from public, anon, authenticated;
grant select, insert, delete on public.creator_follows to authenticated;

-- Se devuelve solo información pública, nunca la fila completa de profiles.
create function public.list_public_creators(search_text text default '', creator_ids uuid[] default null)
returns table (id uuid, display_name text, avatar_path text, follower_count bigint, program_count bigint)
language sql stable security definer set search_path = '' as $$
  select p.id, coalesce(nullif(btrim(p.display_name), ''), 'Creador'), p.avatar_path,
    (select count(*) from public.creator_follows f where f.creator_id = p.id),
    (select count(*) from public.courses c where c.creator_id = p.id and c.published)
  from public.creator_accounts a join public.profiles p on p.id = a.profile_id
  where (creator_ids is null or p.id = any(creator_ids[1:60]))
    and not exists (
      select 1 from regexp_split_to_table(translate(lower(btrim(left(coalesce(search_text, ''), 80))), 'áéíóúüñ', 'aeiouun'), '\s+') term
      where term <> '' and position(term in translate(lower(p.display_name), 'áéíóúüñ', 'aeiouun')) = 0
    )
  order by (select count(*) from public.courses c where c.creator_id=p.id and c.published) desc,
    p.display_name, p.id
  limit 60;
$$;
revoke all on function public.list_public_creators(text, uuid[]) from public;
grant execute on function public.list_public_creators(text, uuid[]) to anon, authenticated;

commit;
