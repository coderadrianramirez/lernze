import { isSupabaseConfigured } from "./supabase/config";
import { createSessionClient } from "./supabase/server";
import type { Lesson, LessonInput } from "./types";

/**
 * Clases, progreso y videos privados. Todo pasa por el cliente con la sesión del usuario:
 * las políticas de la base deciden qué puede ver o cambiar cada quien.
 * Si la migración 0007 no está aplicada, las lecturas devuelven listas vacías.
 */

type LessonRow = {
  id: string;
  course_id: string;
  position: number;
  title: string;
  description: string;
  video_path: string | null;
  duration_seconds: number;
  is_preview: boolean;
};

const toLesson = (r: LessonRow): Lesson => ({
  id: r.id,
  courseId: r.course_id,
  position: r.position,
  title: r.title,
  description: r.description,
  videoPath: r.video_path,
  durationSeconds: r.duration_seconds,
  isPreview: r.is_preview,
});

/** false si la tabla de clases todavía no existe (migración 0007 sin aplicar). */
export async function lessonsReady(): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  const supabase = await createSessionClient();
  const { error } = await supabase.from("lessons").select("id").limit(1);
  return !error;
}

export async function listLessons(courseId: string): Promise<Lesson[]> {
  if (!isSupabaseConfigured) return [];
  const supabase = await createSessionClient();
  const { data, error } = await supabase
    .from("lessons")
    .select("*")
    .eq("course_id", courseId)
    .order("position")
    .order("created_at");
  if (error) {
    // PGRST205 / 42P01: la tabla aún no existe (migración 0007 pendiente). No es un error del usuario.
    if (error.code !== "PGRST205" && error.code !== "42P01") console.error("[lessons]", error.message);
    return [];
  }
  return (data as LessonRow[]).map(toLesson);
}

/** Cantidad de clases y minutos totales de varios programas a la vez. */
export async function lessonStats(courseIds: string[]): Promise<Record<string, { count: number; seconds: number; ids: string[] }>> {
  const out: Record<string, { count: number; seconds: number; ids: string[] }> = {};
  if (!isSupabaseConfigured || !courseIds.length) return out;
  const supabase = await createSessionClient();
  const { data, error } = await supabase.from("lessons").select("id, course_id, duration_seconds").in("course_id", courseIds);
  if (error) return out;
  for (const r of data as { id: string; course_id: string; duration_seconds: number }[]) {
    const s = (out[r.course_id] ??= { count: 0, seconds: 0, ids: [] });
    s.count += 1;
    s.seconds += r.duration_seconds;
    s.ids.push(r.id);
  }
  return out;
}

export async function isEnrolled(userId: string, courseId: string): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  const supabase = await createSessionClient();
  const { data } = await supabase
    .from("enrollments")
    .select("course_id")
    .eq("user_id", userId)
    .eq("course_id", courseId)
    .maybeSingle();
  return Boolean(data);
}

/** Ids de las clases que completó el usuario (de todos sus programas). */
export async function completedLessonIds(userId: string): Promise<Set<string>> {
  if (!isSupabaseConfigured) return new Set();
  const supabase = await createSessionClient();
  const { data, error } = await supabase.from("lesson_progress").select("lesson_id").eq("user_id", userId);
  if (error) return new Set();
  return new Set((data as { lesson_id: string }[]).map((r) => r.lesson_id));
}

export async function setLessonDone(userId: string, lessonId: string, done: boolean): Promise<void> {
  const supabase = await createSessionClient();
  const { error } = done
    ? await supabase.from("lesson_progress").upsert({ user_id: userId, lesson_id: lessonId }, { onConflict: "user_id,lesson_id" })
    : await supabase.from("lesson_progress").delete().eq("user_id", userId).eq("lesson_id", lessonId);
  if (error) throw new Error(`No se pudo guardar tu progreso: ${error.message}`);
}

/** Enlace temporal al video. Devuelve null si el usuario no tiene permiso. */
export async function lessonVideoUrl(path: string): Promise<string | null> {
  const supabase = await createSessionClient();
  const { data, error } = await supabase.storage.from("lessons").createSignedUrl(path, 60 * 60 * 3);
  if (error) return null;
  return data.signedUrl;
}

/* ---------- edición (solo el creador; lo garantiza la base) ---------- */

export async function addLesson(courseId: string, input: LessonInput): Promise<void> {
  const supabase = await createSessionClient();
  const { data: last } = await supabase
    .from("lessons")
    .select("position")
    .eq("course_id", courseId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();
  const { error } = await supabase.from("lessons").insert({
    course_id: courseId,
    position: (last?.position ?? -1) + 1,
    title: input.title,
    description: input.description,
    video_path: input.videoPath,
    duration_seconds: input.durationSeconds,
    is_preview: input.isPreview,
  });
  if (error) throw new Error(`No se pudo agregar la clase: ${error.message}`);
}

export async function updateLesson(lessonId: string, input: Partial<LessonInput>): Promise<void> {
  const supabase = await createSessionClient();
  const patch: Record<string, unknown> = {};
  if (input.title !== undefined) patch.title = input.title;
  if (input.description !== undefined) patch.description = input.description;
  if (input.videoPath !== undefined) patch.video_path = input.videoPath;
  if (input.durationSeconds !== undefined) patch.duration_seconds = input.durationSeconds;
  if (input.isPreview !== undefined) patch.is_preview = input.isPreview;
  const { error } = await supabase.from("lessons").update(patch).eq("id", lessonId);
  if (error) throw new Error(`No se pudo guardar la clase: ${error.message}`);
}

export async function deleteLesson(lesson: Lesson): Promise<void> {
  const supabase = await createSessionClient();
  const { error } = await supabase.from("lessons").delete().eq("id", lesson.id);
  if (error) throw new Error(`No se pudo borrar la clase: ${error.message}`);
  if (lesson.videoPath) await supabase.storage.from("lessons").remove([lesson.videoPath]);
}

/** Intercambia la posición de una clase con la vecina de arriba o de abajo. */
export async function moveLesson(lessons: Lesson[], lessonId: string, dir: -1 | 1): Promise<void> {
  const i = lessons.findIndex((l) => l.id === lessonId);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= lessons.length) return;
  const supabase = await createSessionClient();
  const a = lessons[i];
  const b = lessons[j];
  const { error: firstError } = await supabase.from("lessons").update({ position: j }).eq("id", a.id);
  if (firstError) throw new Error("No pudimos ordenar las clases. Inténtalo de nuevo.");
  const { error: secondError } = await supabase.from("lessons").update({ position: i }).eq("id", b.id);
  if (secondError) throw new Error("No pudimos ordenar las clases. Inténtalo de nuevo.");
  // Normaliza el resto por si había huecos o empates.
  await Promise.all(
    lessons.map((l, k) => (k !== i && k !== j && l.position !== k ? supabase.from("lessons").update({ position: k }).eq("id", l.id) : null)),
  );
}

/** Programa (incluso sin publicar) solo si el usuario es su creador. */
export async function getOwnCourseId(slug: string, userId: string): Promise<string | null> {
  if (!isSupabaseConfigured) return null;
  const supabase = await createSessionClient();
  const { data } = await supabase.from("courses").select("id, creator_id").eq("slug", slug).maybeSingle();
  return data && data.creator_id === userId ? data.id : null;
}

export const formatDuration = (s: number) => {
  if (!s) return "";
  const h = Math.floor(s / 3600);
  const m = Math.round((s % 3600) / 60);
  return h ? `${h} h ${m} min` : `${Math.max(1, m)} min`;
};

export const clock = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
