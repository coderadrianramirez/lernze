"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { safeNext } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSessionClient } from "@/lib/supabase/server";

export type AuthState = { error?: string; notice?: string };

function translate(message: string): string {
  console.error("[auth]", message);
  const m = message.toLowerCase();
  if (m.includes("invalid login")) return "El correo o la contraseña no coinciden.";
  if (m.includes("already registered") || m.includes("already been registered")) return "Ese correo ya tiene una cuenta. Inicia sesión.";
  if (m.includes("password")) return "La contraseña debe tener al menos 8 caracteres.";
  if (m.includes("email not confirmed")) return "Confirma tu correo antes de entrar. Revisa tu bandeja de entrada.";
  if (m.includes("rate limit")) return "Demasiados intentos. Espera unos minutos y vuelve a probar.";
  return "No pudimos completar la acción. Inténtalo de nuevo.";
}

function readCredentials(formData: FormData) {
  return {
    email: String(formData.get("email") ?? "").trim().toLowerCase(),
    password: String(formData.get("password") ?? ""),
    next: safeNext(String(formData.get("next") ?? ""), "/"),
  };
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function signInAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  if (!isSupabaseConfigured) return { error: "Supabase aún no está conectado. Revisa el archivo .env.local." };
  const { email, password, next } = readCredentials(formData);
  if (!EMAIL_RE.test(email)) return { error: "Escribe un correo válido." };
  if (!password) return { error: "Escribe tu contraseña." };

  const supabase = await createSessionClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: translate(error.message) };
  redirect(next);
}

export async function signUpAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  if (!isSupabaseConfigured) return { error: "Supabase aún no está conectado. Revisa el archivo .env.local." };
  const { email, password, next } = readCredentials(formData);
  const name = String(formData.get("name") ?? "").trim();
  if (name.length < 2) return { error: "Escribe tu nombre." };
  if (!EMAIL_RE.test(email)) return { error: "Escribe un correo válido." };
  if (password.length < 8) return { error: "La contraseña debe tener al menos 8 caracteres." };

  const supabase = await createSessionClient();
  const h = await headers();
  const origin = h.get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: name },
      emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });
  if (error) return { error: translate(error.message) };

  // Con confirmación de correo activa no hay sesión hasta que la persona abre el enlace.
  if (!data.session) return { notice: "Te enviamos un correo para confirmar tu cuenta. Ábrelo y vuelve aquí." };
  redirect(next);
}

export async function signOutAction() {
  if (isSupabaseConfigured) {
    const supabase = await createSessionClient();
    await supabase.auth.signOut();
  }
  redirect("/");
}
