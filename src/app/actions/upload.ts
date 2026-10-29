"use server";

import { getCurrentUser } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSessionClient } from "@/lib/supabase/server";

export type UploadKind = "trailer" | "lesson";
export type UploadTicket =
  | { ok: true; signedUrl: string; path: string; publicUrl: string | null }
  | { ok: false; error: string };

const TYPES: Record<string, string> = { "video/mp4": "mp4", "video/webm": "webm" };
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Pide a Supabase un permiso de subida firmado para un video. El archivo viaja directo del
 * navegador al almacenamiento; el servidor solo decide la carpeta (siempre la del usuario).
 * Trailers: bucket público. Clases: bucket privado y solo para el creador del programa.
 */
export async function createUploadAction(kind: UploadKind, contentType: string, courseId?: string): Promise<UploadTicket> {
  if (!isSupabaseConfigured) return { ok: false, error: "La subida de videos necesita Supabase conectado." };
  const user = await getCurrentUser();
  if (!user || user.demo) return { ok: false, error: "Inicia sesión para subir videos." };
  const ext = TYPES[contentType];
  if (!ext) return { ok: false, error: "Sube el video en MP4 o WebM." };

  const supabase = await createSessionClient();
  let bucket = "trailers";
  let path = `${user.id}/${crypto.randomUUID()}.${ext}`;

  if (kind === "lesson") {
    if (!courseId || !UUID_RE.test(courseId)) return { ok: false, error: "Falta el programa." };
    const { data: course } = await supabase.from("courses").select("creator_id").eq("id", courseId).maybeSingle();
    if (!course || course.creator_id !== user.id) return { ok: false, error: "Solo el creador puede subir clases." };
    bucket = "lessons";
    path = `${user.id}/${courseId}/${crypto.randomUUID()}.${ext}`;
  }

  const { data, error } = await supabase.storage.from(bucket).createSignedUploadUrl(path);
  if (error || !data) {
    console.error("[upload]", error?.message);
    return { ok: false, error: "No pudimos preparar la subida. Inténtalo de nuevo." };
  }
  const publicUrl = bucket === "trailers" ? supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl : null;
  return { ok: true, signedUrl: data.signedUrl, path, publicUrl };
}
