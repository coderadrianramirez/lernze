"use server";

import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSessionClient } from "@/lib/supabase/server";

export type NewsletterState = { ok?: string; error?: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function subscribeAction(_prev: NewsletterState, formData: FormData): Promise<NewsletterState> {
  // Campo trampa: las personas no lo ven, los bots lo completan.
  if (String(formData.get("website") ?? "")) return { ok: "¡Listo! Te avisaremos de los nuevos programas." };

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!EMAIL_RE.test(email) || email.length > 254) return { error: "Escribe un correo válido." };
  if (!isSupabaseConfigured) return { error: "No pudimos guardar tu correo. Inténtalo más tarde." };

  const supabase = await createSessionClient();
  const { error } = await supabase.from("newsletter_subscribers").insert({ email });
  if (error?.code === "23505") return { ok: "Ya estabas en la lista. ¡Gracias!" };
  if (error) {
    console.error("[newsletter]", error.message);
    return { error: "No pudimos guardar tu correo. Inténtalo más tarde." };
  }
  return { ok: "¡Listo! Te avisaremos de los nuevos programas." };
}
