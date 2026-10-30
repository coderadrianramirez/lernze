"use server";
import { headers } from "next/headers";
import { createSessionClient } from "@/lib/supabase/server";
import { safeNext } from "@/lib/auth";
import { isRecoverySession } from "@/lib/password-recovery";
export type RecoveryState = {
  error?: string;
  notice?: string;
  saved?: boolean;
};
export async function requestRecoveryAction(
  _prev: RecoveryState,
  form: FormData,
): Promise<RecoveryState> {
  const email = String(form.get("email") ?? "")
    .trim()
    .toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254)
    return { error: "Escribe un correo válido." };
  try {
    const db = await createSessionClient();
    const h = await headers();
    const origin =
      process.env.NEXT_PUBLIC_SITE_URL ||
      h.get("origin") ||
      "http://localhost:3000";
    const next = safeNext(String(form.get("next") ?? ""), "/");
    const destination =
      "/restablecer-contrasena?next=" + encodeURIComponent(next);
    const { error } = await db.auth.resetPasswordForEmail(email, {
      redirectTo:
        origin + "/auth/callback?next=" + encodeURIComponent(destination),
    });
    if (
      error &&
      ![
        "over_email_send_rate_limit",
        "over_request_rate_limit",
        "user_not_found",
      ].includes(error.code ?? "")
    )
      return {
        error:
          "No pudimos enviar el enlace. Espera unos minutos e inténtalo de nuevo.",
      };
    return {
      notice:
        "Si hay una cuenta asociada a este correo, recibirás un enlace para crear una nueva contraseña. Revisa también la carpeta de spam.",
      saved: true,
    };
  } catch {
    return { error: "No pudimos conectar. Inténtalo de nuevo." };
  }
}
export async function resetPasswordAction(
  _prev: RecoveryState,
  form: FormData,
): Promise<RecoveryState> {
  const password = String(form.get("password") ?? "");
  if (password.length < 8 || password.length > 128)
    return { error: "Usa una contraseña de entre 8 y 128 caracteres." };
  if (password !== form.get("confirmPassword"))
    return { error: "Las contraseñas no coinciden." };
  try {
    const db = await createSessionClient();
    const [user, claims] = await Promise.all([
      db.auth.getUser(),
      db.auth.getClaims(),
    ]);
    if (
      user.error ||
      claims.error ||
      !user.data.user ||
      !isRecoverySession(claims.data?.claims, user.data.user.id)
    )
      return {
        error: "El enlace venció o ya no es válido. Solicita uno nuevo.",
      };
    const { error } = await db.auth.updateUser({ password });
    if (error)
      return {
        error:
          error.code === "same_password"
            ? "Elige una contraseña diferente de la anterior."
            : "No pudimos guardar la contraseña. Solicita un enlace nuevo e inténtalo de nuevo.",
      };
    await db.auth.signOut({ scope: "local" });
    return {
      saved: true,
      notice: "Contraseña actualizada. Ya puedes iniciar sesión con ella.",
    };
  } catch {
    return { error: "No pudimos conectar. Inténtalo de nuevo." };
  }
}
