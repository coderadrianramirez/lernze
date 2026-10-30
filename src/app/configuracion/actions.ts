"use server";

import { headers } from "next/headers";
import { randomUUID } from "node:crypto";
import { revalidatePath, revalidateTag } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { createSessionClient } from "@/lib/supabase/server";
import { avatarUrl } from "@/lib/profile";

export type SettingsState = {
  error?: string;
  notice?: string;
  saved?: boolean;
};
async function session() {
  const user = await getCurrentUser();
  if (!user || user.demo)
    throw new Error("Inicia sesión para editar tu cuenta.");
  return { user, db: await createSessionClient() };
}
async function removeUnusedPhotos(userId: string, paths: string[]) {
  const db = await createSessionClient();
  const { data, error } = await db
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  if (error) throw new Error("No pudimos comprobar tu foto actual.");
  const unused = [...new Set(paths)].filter(
    (p) => avatarUrl(p) && p.startsWith(userId + "/") && p !== data.avatar_path,
  );
  if (unused.length) {
    const result = await db.storage.from("avatars").remove(unused);
    if (result.error)
      throw new Error(
        "No pudimos limpiar las fotos descartadas. Inténtalo de nuevo.",
      );
  }
}
export async function discardPhotosAction(
  paths: string[],
): Promise<SettingsState> {
  try {
    const { user } = await session();
    if (
      !Array.isArray(paths) ||
      paths.length > 100 ||
      paths.some((p) => typeof p !== "string")
    )
      return { error: "Las fotos no son válidas." };
    await removeUnusedPhotos(user.id, paths);
    return {};
  } catch (e) {
    return { error: (e as Error).message };
  }
}
export async function createPhotoUploadAction(): Promise<{
  path?: string;
  signedUrl?: string;
  error?: string;
}> {
  try {
    const { user, db } = await session();
    const ready = await db.rpc("account_settings_ready");
    if (ready.error || ready.data !== true)
      return { error: "La edición del perfil estará disponible en breve." };
    const path = `${user.id}/${randomUUID()}.webp`;
    const ticket = await db.storage.from("avatars").createSignedUploadUrl(path);
    if (ticket.error || !ticket.data)
      return { error: "No pudimos preparar la subida." };
    return { path, signedUrl: ticket.data.signedUrl };
  } catch (e) {
    return { error: (e as Error).message };
  }
}
export async function saveProfileAction(
  _prev: SettingsState,
  form: FormData,
): Promise<SettingsState> {
  try {
    const { user, db } = await session();
    const name = String(form.get("name") ?? "").trim();
    const path = String(form.get("avatarPath") ?? "") || null;
    if (name.length < 2 || name.length > 120)
      return { error: "Escribe un nombre de entre 2 y 120 caracteres." };
    if (path && (!avatarUrl(path) || !path.startsWith(user.id + "/")))
      return { error: "Selecciona una foto propia." };
    const previous = await db
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();
    if (previous.error) return { error: "No pudimos cargar tu perfil." };
    const result = await db.rpc("save_creator_profile", {
      public_name: name,
      photo_path: path,
    });
    if (result.error)
      return { error: "No pudimos guardar tu perfil. Inténtalo de nuevo." };
    let paths: string[] = [];
    try {
      const raw = JSON.parse(String(form.get("photoUploads") ?? "[]"));
      if (Array.isArray(raw))
        paths = raw.filter((p) => typeof p === "string").slice(0, 100);
    } catch {}
    if (previous.data.avatar_path) paths.push(previous.data.avatar_path);
    await removeUnusedPhotos(user.id, paths);
    revalidatePath("/", "layout");
    revalidateTag("courses", "max");
    return {
      notice: "Perfil guardado. Tu nombre se actualizó en todos tus programas.",
      saved: true,
    };
  } catch (e) {
    return { error: (e as Error).message };
  }
}
export async function changeEmailAction(
  _prev: SettingsState,
  form: FormData,
): Promise<SettingsState> {
  try {
    const { user, db } = await session();
    const email = String(form.get("email") ?? "")
      .trim()
      .toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return { error: "Escribe un correo válido." };
    if (email === user.email.toLowerCase())
      return { error: "Escribe un correo diferente del actual." };
    // Supabase gestiona la confirmación de la dirección; no se cambia el correo localmente.
    const requestHeaders = await headers();
    const origin =
      requestHeaders.get("origin") ??
      process.env.NEXT_PUBLIC_SITE_URL ??
      "http://localhost:3000";
    const { data, error } = await db.auth.updateUser(
      { email },
      { emailRedirectTo: `${origin}/auth/callback?next=/configuracion` },
    );
    if (error)
      return {
        error:
          error.code === "over_email_send_rate_limit"
            ? "Espera unos minutos antes de solicitar otro correo."
            : "No pudimos solicitar el cambio. Revisa el correo e inténtalo de nuevo.",
      };
    revalidatePath("/configuracion");
    return {
      notice:
        data.user.email === email
          ? "Correo actualizado."
          : "Revisa el nuevo correo y también el actual: confirma el cambio en los mensajes que recibas.",
      saved: true,
    };
  } catch (e) {
    return { error: (e as Error).message };
  }
}
export async function sendPasswordCodeAction(): Promise<SettingsState> {
  try {
    const { db } = await session();
    const { error } = await db.auth.reauthenticate();
    return error
      ? {
          error:
            "No pudimos enviar el código. Espera unos minutos e inténtalo de nuevo.",
        }
      : { notice: "Te enviamos un código de verificación a tu correo." };
  } catch (e) {
    return { error: (e as Error).message };
  }
}
export async function changePasswordAction(
  _prev: SettingsState,
  form: FormData,
): Promise<SettingsState> {
  try {
    const { user, db } = await session();
    const password = String(form.get("password") ?? "");
    const current = String(form.get("currentPassword") ?? "");
    const nonce = String(form.get("nonce") ?? "").trim();
    if (password.length < 8 || password.length > 128)
      return { error: "Usa una contraseña de entre 8 y 128 caracteres." };
    if (password !== form.get("confirmPassword"))
      return { error: "Las contraseñas nuevas no coinciden." };
    const passwordStatus = await db.rpc("account_has_password");
    if (passwordStatus.error || typeof passwordStatus.data !== "boolean")
      return {
        error:
          "No pudimos comprobar el acceso a tu cuenta. Inténtalo de nuevo.",
      };
    const hasPassword = passwordStatus.data;
    if (!hasPassword)
      return {
        error: "Solicita un enlace por correo para crear tu contraseña.",
      };
    {
      if (!current) return { error: "Escribe tu contraseña actual." };
      const verified = await db.auth.signInWithPassword({
        email: user.email,
        password: current,
      });
      if (verified.error) return { error: "La contraseña actual no coincide." };
    }
    const { error } = await db.auth.updateUser({
      password,
      ...(current ? { current_password: current } : {}),
      ...(nonce ? { nonce } : {}),
    });
    if (error)
      return {
        error:
          error.code === "same_password"
            ? "Elige una contraseña diferente de la actual."
            : "No pudimos cambiar la contraseña. Revisa los datos y, si se solicita, pide un nuevo código por correo.",
      };
    return { notice: "Contraseña actualizada.", saved: true };
  } catch (e) {
    return { error: (e as Error).message };
  }
}
