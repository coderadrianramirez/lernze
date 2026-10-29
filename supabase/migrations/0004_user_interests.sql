-- Intereses del usuario: array de categorías (Negocios, Idiomas, Oficios, Marketing, Inversión).
-- Null = no ha completado el onboarding. Array vacío = completó pero no eligió nada.
alter table public.profiles
  add column if not exists interests text[] default null,
  add column if not exists onboarding_done boolean not null default false;

-- El usuario lee y edita solo su propio perfil (política "perfil propio" ya cubre all).
-- No necesitamos política adicional.
