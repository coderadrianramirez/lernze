-- Programas que abrió cada usuario. Alimenta "Vistos recientemente" y las recomendaciones.
create table if not exists public.course_views (
  user_id uuid not null references public.profiles (id) on delete cascade,
  course_id uuid not null references public.courses (id) on delete cascade,
  viewed_at timestamptz not null default now(),
  primary key (user_id, course_id)
);

create index if not exists course_views_recent_idx on public.course_views (user_id, viewed_at desc);

alter table public.course_views enable row level security;

-- Cada quien ve, registra y actualiza solo sus propias visitas.
create policy "cada quien ve sus visitas" on public.course_views
  for select using (user_id = (select auth.uid()));
create policy "cada quien registra sus visitas" on public.course_views
  for insert with check (user_id = (select auth.uid()));
create policy "cada quien actualiza sus visitas" on public.course_views
  for update using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
