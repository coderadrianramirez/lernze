"use server";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import {
  getOwnedProgram,
  publicationReady,
  setProgramPublished,
  updateProgram,
} from "@/lib/program-management";
import {
  publicationChecks,
  readProgram,
  type ProgramFormState,
} from "@/lib/program-validation";
import { lessonVideoUrl, listLessons } from "@/lib/lessons";
import { revalidateProgram } from "@/lib/revalidate-program";

export async function updateProgramAction(
  slug: string,
  _prev: ProgramFormState,
  formData: FormData,
): Promise<ProgramFormState> {
  const user = await getCurrentUser();
  if (!user || user.demo)
    return { errors: {}, error: "Inicia sesión para guardar los cambios." };
  const course = await getOwnedProgram(slug, user.id);
  if (!course)
    return { errors: {}, error: "Solo el creador puede editar este programa." };
  const { input, errors } = readProgram(formData);
  if (course.published && input.description.length < 20)
    errors.description =
      "Un programa publicado necesita una descripción de al menos 20 caracteres.";
  if (Object.keys(errors).length) return { errors };
  try {
    await updateProgram(course, user.id, input);
  } catch {
    return {
      errors: {},
      error:
        "No pudimos guardar los cambios. Revisa los datos e inténtalo de nuevo.",
    };
  }
  revalidateProgram(slug);
  if (formData.get("next") === "classes") redirect(`/programa/${slug}/clases`);
  return { errors: {}, saved: true };
}

export async function publishProgramAction(
  slug: string,
  _prev: { error?: string; ok?: string },
  formData: FormData,
): Promise<{ error?: string; ok?: string }> {
  const user = await getCurrentUser();
  if (!user || user.demo)
    return { error: "Inicia sesión para gestionar tu programa." };
  const course = await getOwnedProgram(slug, user.id);
  if (!course)
    return { error: "Solo el creador puede gestionar este programa." };
  if (!(await publicationReady(course.id)))
    return {
      error:
        "La publicación estará disponible en breve. Puedes seguir preparando tu programa.",
    };
  const published = formData.get("intent") === "publish";
  if (!["publish", "withdraw"].includes(String(formData.get("intent"))))
    return { error: "Elige una acción válida." };
  if (published) {
    const lessons = await listLessons(course.id);
    if (publicationChecks(course, lessons).some((c) => !c.done))
      return { error: "Completa los pasos pendientes antes de publicar." };
    const videos = await Promise.all(
      lessons.map((l) => lessonVideoUrl(l.videoPath!)),
    );
    if (videos.some((url) => !url))
      return {
        error:
          "No pudimos acceder a todos los videos. Revisa las clases antes de publicar.",
      };
  }
  try {
    await setProgramPublished(course.id, user.id, published);
  } catch {
    return {
      error:
        "No pudimos cambiar la publicación. Comprueba que las clases tengan sus videos e inténtalo de nuevo.",
    };
  }
  revalidateProgram(slug);
  return {
    ok: published
      ? "¡Tu programa ya está publicado!"
      : "Programa retirado del catálogo. Tus alumnos conservan el acceso.",
  };
}
