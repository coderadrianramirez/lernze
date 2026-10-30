"use server";

import { revalidatePath } from "next/cache";
import { getAccessibleProgram } from "@/lib/program-management";
import { getCurrentUser } from "@/lib/auth";
import { getOwnCourseId, isEnrolled, listLessons, setLessonDone } from "@/lib/lessons";

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
