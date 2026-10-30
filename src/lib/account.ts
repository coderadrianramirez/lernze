import { sanitizeCover } from "./covers";
import { isSupabaseConfigured } from "./supabase/config";
import { createSessionClient } from "./supabase/server";
import type { Lesson, SaleOrigin } from "./types";

/** Datos de Mi cuenta que no son del catálogo: ventas del creador, clases ordenadas y antigüedad. */

/** `ageDays`: días desde la inscripción, calculado al leer (los componentes no leen la hora). */
export type Sale = { courseId: string; origin: SaleOrigin; grossCents: number; commissionCents: number; createdAt: string; ageDays: number };

/** Inscripciones a los programas del creador (la base solo le deja ver las suyas). */
export async function listCreatorSales(userId: string): Promise<Sale[]> {
  if (!isSupabaseConfigured) return [];
  const supabase = await createSessionClient();
  const { data, error } = await supabase
    .from("enrollments")
    .select("course_id, origin, gross_cents, commission_cents, created_at, courses!inner(creator_id)")
    .eq("courses.creator_id", userId);
  if (error) {
    console.error("[account]", error.message);
    return [];
  }
  const now = Date.now();
  return (data as { course_id: string; origin: SaleOrigin; gross_cents: number; commission_cents: number; created_at: string }[]).map((r) => ({
    courseId: r.course_id,
    origin: r.origin,
    grossCents: r.gross_cents,
    commissionCents: r.commission_cents,
    createdAt: r.created_at,
    ageDays: (now - new Date(r.created_at).getTime()) / 86_400_000,
  }));
}

/** Clases de varios programas, en orden, agrupadas por programa. */
export async function lessonsByCourse(courseIds: string[]): Promise<Record<string, Lesson[]>> {
  const out: Record<string, Lesson[]> = {};
  if (!isSupabaseConfigured || !courseIds.length) return out;
  const supabase = await createSessionClient();
  const { data, error } = await supabase
    .from("lessons")
    .select("*")
    .in("course_id", courseIds)
    .order("position")
    .order("created_at");
  if (error) return out;
  for (const r of data as {
    id: string;
    course_id: string;
    position: number;
    title: string;
    description: string;
    video_path: string | null;
    duration_seconds: number;
    is_preview: boolean;
    cover?: unknown;
  }[]) {
    (out[r.course_id] ??= []).push({
      id: r.id,
      courseId: r.course_id,
      position: r.position,
      title: r.title,
      description: r.description,
      videoPath: r.video_path,
      durationSeconds: r.duration_seconds,
      isPreview: r.is_preview,
      cover: sanitizeCover(r.cover),
    });
  }
  return out;
}

/** Fecha en que se creó el perfil. */
export async function memberSince(userId: string): Promise<string | null> {
  if (!isSupabaseConfigured) return null;
  const supabase = await createSessionClient();
  const { data } = await supabase.from("profiles").select("created_at").eq("id", userId).maybeSingle();
  return data?.created_at ?? null;
}

/** Última vez que el usuario completó una clase de cada programa (para ordenar "continuar"). */
export async function lastActivityByCourse(userId: string): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  if (!isSupabaseConfigured) return out;
  const supabase = await createSessionClient();
  const { data, error } = await supabase
    .from("lesson_progress")
    .select("completed_at, lessons!inner(course_id)")
    .eq("user_id", userId);
  if (error) return out;
  for (const r of data as unknown as { completed_at: string; lessons: { course_id: string } }[]) {
    const id = r.lessons.course_id;
    if (!out[id] || out[id] < r.completed_at) out[id] = r.completed_at;
  }
  return out;
}
