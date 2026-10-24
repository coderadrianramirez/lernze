export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

// Acepta la clave "publishable" nueva o la "anon" clásica.
export const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/** Sin variables de entorno la app corre en modo demo, en memoria y sin cuentas. */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);
