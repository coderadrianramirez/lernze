import { cache } from "react";
import { avatarUrl } from "./profile";
import { connection } from "next/server";
import { isSupabaseConfigured } from "./supabase/config";
import { createSessionClient } from "./supabase/server";

export type CurrentUser = {
  id: string;
  email: string;
  name: string;
  demo: boolean;
  avatarUrl?: string | null;
};

const DEMO_USER: CurrentUser = {
  id: "demo-user",
  email: "demo@lernze.com",
  name: "Demo",
  demo: true,
};

/** Quien hace la petición, validado contra Supabase. Sin Supabase devuelve un usuario demo. */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  if (!isSupabaseConfigured) return DEMO_USER;
  // La sesión depende de cada petición: que Next no intente prerenderizarla.
  await connection();
  const supabase = await createSessionClient();
  const { data } = await supabase.auth.getUser();
  const u = data.user;
  if (!u) return null;
  const email = u.email ?? "";
  const profile = await supabase
    .from("profiles")
    .select("*")
    .eq("id", u.id)
    .maybeSingle();
  const name =
    (profile.data?.display_name as string | undefined) ||
    (u.user_metadata?.display_name as string | undefined) ||
    email.split("@")[0] ||
    "Creador";
  return {
    id: u.id,
    email,
    name,
    demo: false,
    avatarUrl: avatarUrl(profile.data?.avatar_path),
  };
});

/** Acepta solo rutas internas para evitar redirecciones a otros sitios. */
export function safeNext(
  value: string | null | undefined,
  fallback = "/",
): string {
  if (
    !value ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\")
  )
    return fallback;
  return value;
}
