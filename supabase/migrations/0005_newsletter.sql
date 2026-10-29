-- Suscriptores del newsletter del footer.
create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique check (char_length(email) between 3 and 254),
  created_at timestamptz not null default now()
);

alter table public.newsletter_subscribers enable row level security;

-- Cualquiera puede suscribirse. Sin política de lectura: la lista solo se ve desde el panel de Supabase.
create policy "cualquiera se suscribe al newsletter" on public.newsletter_subscribers
  for insert to anon, authenticated
  with check (true);
