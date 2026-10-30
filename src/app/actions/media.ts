"use server";
import { getCurrentUser } from "@/lib/auth";
import { createSessionClient } from "@/lib/supabase/server";
import {
  cleanupUnusedMedia,
  contentToolsReady,
  type MediaAsset,
} from "@/lib/media-management";

export async function createCoverUploadAction(courseId?: string) {
  const user = await getCurrentUser();
  if (!user || user.demo)
    return { error: "Inicia sesión para guardar una portada." };
  if (!(await contentToolsReady()))
    return {
      error: "Las imágenes personalizadas estarán disponibles en breve.",
    };
  const db = await createSessionClient();
  if (courseId) {
    if (!/^[0-9a-f-]{36}$/i.test(courseId))
      return { error: "El programa no es válido." };
    const { data } = await db
      .from("courses")
      .select("creator_id")
      .eq("id", courseId)
      .maybeSingle();
    if (data?.creator_id !== user.id)
      return { error: "Solo el creador puede cambiar esta portada." };
  }
  const path =
    user.id +
    "/" +
    (courseId ? courseId + "/" : "") +
    crypto.randomUUID() +
    ".webp";
  const { data, error } = await db.storage
    .from("covers")
    .createSignedUploadUrl(path);
  if (error || !data)
    return { error: "No pudimos preparar la imagen. Inténtalo de nuevo." };
  return { path, signedUrl: data.signedUrl };
}

export async function discardMediaAction(
  assets: MediaAsset[],
): Promise<{ error?: string }> {
  const user = await getCurrentUser();
  if (!user || user.demo)
    return { error: "Inicia sesión para gestionar tus archivos." };
  if (
    !Array.isArray(assets) ||
    assets.length > 100 ||
    assets.some(
      (a) =>
        !a ||
        !["covers", "trailers", "lessons"].includes(a.bucket) ||
        typeof a.path !== "string",
    )
  )
    return { error: "Los archivos no son válidos." };
  try {
    await cleanupUnusedMedia(user.id, assets);
    return {};
  } catch {
    return {
      error: "No pudimos limpiar las subidas pendientes. Inténtalo de nuevo.",
    };
  }
}
