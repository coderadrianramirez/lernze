"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { addLesson, deleteLesson, getOwnCourseId, listLessons, moveLesson, updateLesson } from "@/lib/lessons";

export type LessonFormState = { ok?: boolean; error?: string; key?: number };

async function ownCourse(slug: string) {
  const user = await getCurrentUser();
  if (!user || user.demo) return null;
  return getOwnCourseId(slug, user.id);
}

function readLesson(formData: FormData, courseId: string) {
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim().slice(0, 2000);
  const videoPath = String(formData.get("videoPath") ?? "").trim() || null;
  const durationSeconds = Math.max(0, Math.min(36_000, Math.round(Number(formData.get("durationSeconds") ?? 0) || 0)));
  const isPreview = formData.get("isPreview") === "on";
  // El video tiene que estar en la carpeta de este programa.
  const pathOk = !videoPath || videoPath.split("/")[1] === courseId;
  return { title, description, videoPath: pathOk ? videoPath : null, durationSeconds, isPreview };
}

export async function addLessonAction(slug: string, _prev: LessonFormState, formData: FormData): Promise<LessonFormState> {
  const courseId = await ownCourse(slug);
  if (!courseId) return { error: "Solo el creador puede agregar clases." };
  const input = readLesson(formData, courseId);
  if (input.title.length < 2 || input.title.length > 120) return { error: "El título debe tener entre 2 y 120 caracteres." };
  try {
    await addLesson(courseId, input);
  } catch (e) {
    return { error: (e as Error).message };
  }
  revalidatePath(`/programa/${slug}`, "layout");
  return { ok: true, key: Date.now() };
}

export async function updateLessonAction(slug: string, lessonId: string, formData: FormData): Promise<LessonFormState> {
  const courseId = await ownCourse(slug);
  if (!courseId) return { error: "Solo el creador puede editar clases." };
  const lessons = await listLessons(courseId);
  if (!lessons.some((l) => l.id === lessonId)) return { error: "Esa clase no es de este programa." };
  const input = readLesson(formData, courseId);
  if (input.title.length < 2 || input.title.length > 120) return { error: "El título debe tener entre 2 y 120 caracteres." };
  try {
    await updateLesson(lessonId, input);
  } catch (e) {
    return { error: (e as Error).message };
  }
  revalidatePath(`/programa/${slug}`, "layout");
  return { ok: true };
}

export async function deleteLessonAction(slug: string, lessonId: string): Promise<LessonFormState> {
  const courseId = await ownCourse(slug);
  if (!courseId) return { error: "Solo el creador puede borrar clases." };
  const lesson = (await listLessons(courseId)).find((l) => l.id === lessonId);
  if (!lesson) return { error: "Esa clase no es de este programa." };
  try {
    await deleteLesson(lesson);
  } catch (e) {
    return { error: (e as Error).message };
  }
  revalidatePath(`/programa/${slug}`, "layout");
  return { ok: true };
}

export async function moveLessonAction(slug: string, lessonId: string, dir: -1 | 1): Promise<void> {
  const courseId = await ownCourse(slug);
  if (!courseId) return;
  await moveLesson(await listLessons(courseId), lessonId, dir);
  revalidatePath(`/programa/${slug}`, "layout");
}
