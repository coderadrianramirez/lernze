"use server";

import { parseCover } from "@/lib/covers";
import {
  cleanupFormMedia,
  cleanupUnusedMedia,
  contentToolsReady,
  validateCoverOwner,
  type MediaAsset,
} from "@/lib/media-management";
import { revalidateProgram } from "@/lib/revalidate-program";
import { getCurrentUser } from "@/lib/auth";
import {
  addLesson,
  deleteLesson,
  getOwnCourseId,
  listLessons,
  moveLesson,
  updateLesson,
} from "@/lib/lessons";

export type LessonFormState = { ok?: boolean; error?: string; key?: number };

async function ownCourse(slug: string) {
  const user = await getCurrentUser();
  if (!user || user.demo) return null;
  return getOwnCourseId(slug, user.id);
}

function readLesson(formData: FormData, courseId: string) {
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "")
    .trim()
    .slice(0, 2000);
  const videoPath = String(formData.get("videoPath") ?? "").trim() || null;
  const durationSeconds = Math.max(
    0,
    Math.min(
      36_000,
      Math.round(Number(formData.get("durationSeconds") ?? 0) || 0),
    ),
  );
  const isPreview = formData.get("isPreview") === "on";
  // El video tiene que estar en la carpeta de este programa.
  const pathOk = !videoPath || videoPath.split("/")[1] === courseId;
  return {
    title,
    description,
    videoPath: pathOk ? videoPath : null,
    durationSeconds,
    isPreview,
  };
}

export async function addLessonAction(
  slug: string,
  _prev: LessonFormState,
  formData: FormData,
): Promise<LessonFormState> {
  const courseId = await ownCourse(slug);
  if (!courseId) return { error: "Solo el creador puede agregar clases." };
  const input = readLesson(formData, courseId);
  if (input.title.length < 2 || input.title.length > 120)
    return { error: "El título debe tener entre 2 y 120 caracteres." };
  try {
    const user = await getCurrentUser();
    const cover = (await contentToolsReady())
      ? parseCover(formData.get("cover"))
      : undefined;
    await validateCoverOwner(cover, user!.id, courseId);
    await addLesson(courseId, { ...input, cover });
    await cleanupFormMedia(user!.id, formData);
  } catch (e) {
    return { error: (e as Error).message };
  }
  revalidateProgram(slug);
  return { ok: true, key: Date.now() };
}

export async function updateLessonAction(
  slug: string,
  lessonId: string,
  formData: FormData,
): Promise<LessonFormState> {
  const courseId = await ownCourse(slug);
  if (!courseId) return { error: "Solo el creador puede editar clases." };
  const lessons = await listLessons(courseId);
  if (!lessons.some((l) => l.id === lessonId))
    return { error: "Esa clase no es de este programa." };
  const input = readLesson(formData, courseId);
  if (input.title.length < 2 || input.title.length > 120)
    return { error: "El título debe tener entre 2 y 120 caracteres." };
  try {
    const user = await getCurrentUser();
    const cover = (await contentToolsReady())
      ? parseCover(formData.get("cover"))
      : undefined;
    await validateCoverOwner(cover, user!.id, courseId);
    await updateLesson(lessonId, { ...input, cover });
    await cleanupFormMedia(user!.id, formData);
    const old = lessons.find((l) => l.id === lessonId)!;
    const assets: MediaAsset[] = [];
    if (old.videoPath && old.videoPath !== input.videoPath)
      assets.push({ bucket: "lessons", path: old.videoPath });
    if (
      old.cover?.path &&
      cover !== undefined &&
      old.cover.path !== cover?.path
    )
      assets.push({ bucket: "covers", path: old.cover.path });
    try {
      await cleanupUnusedMedia(user!.id, assets);
    } catch (e) {
      console.error("[media cleanup]", (e as Error).message);
    }
  } catch (e) {
    return { error: (e as Error).message };
  }
  revalidateProgram(slug);
  return { ok: true };
}

export async function deleteLessonAction(
  slug: string,
  lessonId: string,
): Promise<LessonFormState> {
  const courseId = await ownCourse(slug);
  if (!courseId) return { error: "Solo el creador puede borrar clases." };
  const lesson = (await listLessons(courseId)).find((l) => l.id === lessonId);
  if (!lesson) return { error: "Esa clase no es de este programa." };
  try {
    await deleteLesson(lesson);
  } catch (e) {
    return { error: (e as Error).message };
  }
  revalidateProgram(slug);
  return { ok: true };
}

export async function moveLessonAction(
  slug: string,
  lessonId: string,
  dir: -1 | 1,
): Promise<LessonFormState> {
  const courseId = await ownCourse(slug);
  if (!courseId) return { error: "Solo el creador puede ordenar las clases." };
  if (dir !== -1 && dir !== 1) return { error: "Elige una dirección válida." };
  try {
    await moveLesson(await listLessons(courseId), lessonId, dir);
  } catch {
    return { error: "No pudimos ordenar las clases. Inténtalo de nuevo." };
  }
  revalidateProgram(slug);
  return { ok: true };
}

export async function previewLessonVideoAction(
  slug: string,
  lessonId: string,
): Promise<{ url?: string; error?: string }> {
  const courseId = await ownCourse(slug);
  if (!courseId)
    return { error: "Solo el creador puede previsualizar este video." };
  const lesson = (await listLessons(courseId)).find((l) => l.id === lessonId);
  if (!lesson?.videoPath)
    return { error: "Esta clase todavía no tiene video." };
  const { lessonVideoUrl } = await import("@/lib/lessons");
  const url = await lessonVideoUrl(lesson.videoPath);
  return url
    ? { url }
    : { error: "No pudimos abrir el video. Inténtalo de nuevo." };
}
