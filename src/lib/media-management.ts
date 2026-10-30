import { createSessionClient } from "./supabase/server";
import { isSupabaseConfigured, supabaseUrl } from "./supabase/config";
import type { CoverConfig } from "./types";

export type MediaAsset = {
  bucket: "covers" | "trailers" | "lessons";
  path: string;
};

export function ownPublicAsset(
  url: string | null | undefined,
  bucket: "covers" | "trailers",
  ownerId: string,
): MediaAsset | null {
  const prefix = supabaseUrl + "/storage/v1/object/public/" + bucket + "/";
  if (!url?.startsWith(prefix)) return null;
  const path = url.slice(prefix.length);
  return safeOwnPath(path, ownerId) ? { bucket, path } : null;
}
export function safeOwnPath(path: string, ownerId: string) {
  return (
    path.startsWith(ownerId + "/") &&
    /^[a-z0-9/-]+\.(mp4|webm|webp)$/i.test(path) &&
    !path.includes("..")
  );
}
export async function contentToolsReady(): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  const db = await createSessionClient();
  const { data, error } = await db.rpc("content_tools_ready");
  return !error && data === true;
}
export async function validateCoverOwner(
  cover: CoverConfig | null | undefined,
  userId: string,
  courseId?: string,
) {
  if (!cover?.path) return;
  const parts = cover.path.split("/");
  if (!safeOwnPath(cover.path, userId) || (courseId && parts[1] !== courseId))
    throw new Error("La imagen debe pertenecer a este contenido.");
  const db = await createSessionClient();
  const { error } = await db.storage
    .from("covers")
    .createSignedUrl(cover.path, 60);
  if (error)
    throw new Error(
      "No encontramos la imagen. Vuelve a subirla antes de guardar.",
    );
}

/** Solo elimina archivos del usuario que ya no referencia ningún contenido suyo. */
export async function cleanupUnusedMedia(userId: string, assets: MediaAsset[]) {
  if (!assets.length) return;
  const db = await createSessionClient();
  const { data: programs, error } = await db
    .from("courses")
    .select("id,trailer_url,art")
    .eq("creator_id", userId);
  if (error || !programs)
    throw new Error("No pudimos comprobar tus archivos. Inténtalo de nuevo.");
  const { data: lessons, error: lessonError } = programs.length
    ? await db
        .from("lessons")
        .select("*")
        .in(
          "course_id",
          programs.map((p) => p.id),
        )
    : { data: [], error: null };
  if (lessonError)
    throw new Error("No pudimos comprobar tus archivos. Inténtalo de nuevo.");
  const used = new Set<string>();
  for (const p of programs) {
    const trailer = ownPublicAsset(p.trailer_url, "trailers", userId);
    if (trailer) used.add("trailers/" + trailer.path);
    if (p.art?.cover?.path) used.add("covers/" + p.art.cover.path);
  }
  for (const l of lessons ?? []) {
    if (l.video_path) used.add("lessons/" + l.video_path);
    if (l.cover?.path) used.add("covers/" + l.cover.path);
  }
  for (const bucket of ["covers", "trailers", "lessons"] as const) {
    const paths = [
      ...new Set(
        assets
          .filter(
            (a) =>
              a.bucket === bucket &&
              safeOwnPath(a.path, userId) &&
              !used.has(bucket + "/" + a.path),
          )
          .map((a) => a.path),
      ),
    ];
    if (!paths.length) continue;
    const { error: removeError } = await db.storage.from(bucket).remove(paths);
    if (removeError)
      throw new Error(
        "El contenido se guardó, pero no pudimos limpiar todos los archivos anteriores.",
      );
  }
}

export async function cleanupFormMedia(userId: string, form: FormData) {
  let assets: MediaAsset[] = [];
  try {
    const raw = JSON.parse(String(form.get("draftAssets") ?? "[]"));
    if (Array.isArray(raw))
      assets = raw
        .slice(0, 100)
        .filter(
          (a): a is MediaAsset =>
            !!a &&
            ["covers", "trailers", "lessons"].includes(a.bucket) &&
            typeof a.path === "string",
        );
  } catch {
    return;
  }
  try {
    await cleanupUnusedMedia(userId, assets);
  } catch (e) {
    console.error("[media cleanup]", (e as Error).message);
  }
}
