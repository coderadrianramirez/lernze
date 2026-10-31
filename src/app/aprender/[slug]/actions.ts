"use server";

import { revalidatePath } from "next/cache";
import { getAccessibleProgram } from "@/lib/program-management";
import { createSessionClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { getOwnCourseId, isEnrolled, listLessons, setLessonDone, lessonVideoUrl } from "@/lib/lessons";

/** Marca o desmarca una clase como completada. Solo para quien tiene acceso al programa. */
export async function setDoneAction(slug: string, lessonId: string, done: boolean): Promise<{ error?: string }> {
  const user = await getCurrentUser();
  if (!user || user.demo) return { error: "Inicia sesión para guardar tu progreso." };
  const course = await getAccessibleProgram(slug);
  if (!course) return { error: "Ese programa no existe." };
  const [enrolled, ownId, lessons] = await Promise.all([
    isEnrolled(user.id, course.id),
    getOwnCourseId(slug, user.id),
    listLessons(course.id),
  ]);
  if (!enrolled && ownId !== course.id) return { error: "Únete al programa para guardar tu progreso." };
  if (!lessons.some((l) => l.id === lessonId)) return { error: "Esa clase no es de este programa." };
  try {
    await setLessonDone(user.id, lessonId, done);
  } catch (e) {
    return { error: (e as Error).message };
  }
  revalidatePath(`/aprender/${slug}`);
  revalidatePath("/dashboard");
  return {};
}

/** Renueva el enlace desde la sesión actual, sin aceptar rutas enviadas por el cliente. */
export async function renewLessonVideoAction(slug: string, lessonId: string): Promise<{ src?: string; error?: string }> {
  const course = await getAccessibleProgram(slug);
  if (!course) return { error: "El programa ya no está disponible." };
  const user = await getCurrentUser();
  const [lessons, enrolled, ownId] = await Promise.all([
    listLessons(course.id),
    user && !user.demo ? isEnrolled(user.id, course.id) : false,
    user && !user.demo ? getOwnCourseId(slug, user.id) : null,
  ]);
  const lesson = lessons.find((l) => l.id === lessonId);
  if (!lesson?.videoPath || !(enrolled || ownId === course.id || (course.published && lesson.isPreview)))
    return { error: "No tienes acceso al vídeo de esta clase." };
  const src = await lessonVideoUrl(lesson.videoPath);
  return src ? { src } : { error: "No pudimos cargar el vídeo. Revisa tu conexión e inténtalo de nuevo." };
}

/** Guardar la posición no completa la clase ni concede acceso. */
export async function savePlaybackAction(slug: string, lessonId: string, seconds: number): Promise<{ error?: string }> {
  if (!Number.isFinite(seconds) || seconds < 0 || seconds > 86400) return { error: "Posición de reproducción no válida." };
  const user = await getCurrentUser();
  if (!user || user.demo) return { error: "Inicia sesión para sincronizar tu reproducción." };
  const course = await getAccessibleProgram(slug);
  if (!course) return { error: "El programa ya no está disponible." };
  const [lessons, enrolled, ownId] = await Promise.all([listLessons(course.id), isEnrolled(user.id, course.id), getOwnCourseId(slug, user.id)]);
  if (!enrolled && ownId !== course.id) return { error: "Únete al programa para guardar tu reproducción." };
  const lesson = lessons.find((l) => l.id === lessonId);
  if (!lesson?.videoPath) return { error: "Esta clase no tiene vídeo disponible." };
  const position = Math.floor(Math.min(seconds, lesson.durationSeconds || 86400));
  const db = await createSessionClient();
  const { error } = await db.from("lesson_playback").upsert({ user_id: user.id, lesson_id: lessonId, video_path: lesson.videoPath, position_seconds: position }, { onConflict: "user_id,lesson_id" });
  return error ? { error: "Guardamos el punto en este navegador, pero no pudimos sincronizarlo con tu cuenta." } : {};
}
