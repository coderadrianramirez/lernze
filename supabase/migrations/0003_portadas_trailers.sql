-- Portadas ilustradas, frases del trailer animado, programas de ejemplo y almacenamiento de trailers.

alter table public.courses
  add column art jsonb not null default '{}'::jsonb,
  add column scenes text[] not null default '{}',
  add column demo boolean not null default false;

-- Los programas de ejemplo no pertenecen a ninguna cuenta.
alter table public.courses alter column creator_id drop not null;

-- Bucket público para los videos de trailer (lectura por URL pública, sin listado).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('trailers', 'trailers', true, 52428800, array['video/mp4', 'video/webm'])
on conflict (id) do nothing;

-- Cada creador sube y borra solo dentro de su carpeta: trailers/<su id>/archivo.mp4
create policy "el creador sube sus trailers" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'trailers' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "el creador borra sus trailers" on storage.objects
  for delete to authenticated
  using (bucket_id = 'trailers' and (storage.foldername(name))[1] = (select auth.uid())::text);
