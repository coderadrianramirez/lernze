-- Lernze: esquema inicial (perfiles, cursos, inscripciones con origen de venta).
-- Ejecuta este archivo en el SQL Editor de Supabase o con `supabase db push`.

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '',
  created_at timestamptz not null default now()
);

create table public.courses (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null check (char_length(title) between 4 and 120),
  description text not null default '' check (char_length(description) <= 2000),
  creator_id uuid not null references public.profiles (id) on delete cascade,
  creator_name text not null default '',
  category text not null check (category in ('Negocios', 'Idiomas', 'Oficios', 'Marketing', 'Inversión')),
  price_cents integer not null check (price_cents >= 0),
  currency text not null default 'USD',
  trailer_source text not null default 'ai' check (trailer_source in ('creator', 'ai')),
  trailer_url text,
  trailer_seconds integer not null default 0,
  palette text[] not null default array['#12304a', '#5a2340'],
  glyph text not null default '$',
  rating numeric(2, 1),
  published boolean not null default true,
  created_at timestamptz not null default now()
);

create index courses_category_idx on public.courses (category) where published;
create index courses_creator_idx on public.courses (creator_id);

-- origin define la comisión de plataforma: own 0%, agent 3%, discover 5%.
create table public.enrollments (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  origin text not null default 'own' check (origin in ('own', 'discover', 'agent')),
  gross_cents integer not null check (gross_cents >= 0),
  commission_cents integer not null check (commission_cents >= 0),
  created_at timestamptz not null default now(),
  unique (course_id, user_id)
);

create index enrollments_user_idx on public.enrollments (user_id);

alter table public.profiles enable row level security;
alter table public.courses enable row level security;
alter table public.enrollments enable row level security;

create policy "perfil propio" on public.profiles
  for all using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy "cursos publicados son públicos" on public.courses
  for select using (published or creator_id = (select auth.uid()));
create policy "el creador crea sus cursos" on public.courses
  for insert with check (creator_id = (select auth.uid()));
create policy "el creador edita sus cursos" on public.courses
  for update using (creator_id = (select auth.uid())) with check (creator_id = (select auth.uid()));

create policy "cada quien ve sus inscripciones" on public.enrollments
  for select using (user_id = (select auth.uid()));
create policy "el creador ve las inscripciones de sus cursos" on public.enrollments
  for select using (exists (select 1 from public.courses c where c.id = course_id and c.creator_id = (select auth.uid())));
create policy "cada quien se inscribe" on public.enrollments
  for insert with check (user_id = (select auth.uid()));

-- Crea el perfil al registrarse.
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)));
  return new;
end;
$$;

-- Solo el trigger la ejecuta: nadie debe poder llamarla como función pública.
revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Conteo de miembros por curso, visible para todos. Se ejecuta con los permisos del dueño a propósito:
-- expone solo el número, no quién se inscribió.
create view public.course_member_counts as
  select course_id, count(*)::int as members from public.enrollments group by course_id;
grant select on public.course_member_counts to anon, authenticated;
