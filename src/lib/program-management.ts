import { createSessionClient } from "./supabase/server";
import { isSupabaseConfigured } from "./supabase/config";
import { toCourse } from "./data-supabase";
import { withCover } from "./covers";
import { defaultScenes } from "./art";
import { formatPrice } from "./pricing";
import type { Course, NewCourseInput } from "./types";

export async function getOwnedProgram(
  slug: string,
  userId: string,
): Promise<Course | null> {
  if (!isSupabaseConfigured) return null;
  const db = await createSessionClient();
  const { data, error } = await db
    .from("courses")
    .select("*")
    .eq("slug", slug)
    .eq("creator_id", userId)
    .maybeSingle();
  if (error)
    throw new Error("No pudimos cargar tu programa. Inténtalo de nuevo.");
  return data ? toCourse(data) : null;
}

/** Solo para rutas dentro de Suspense. RLS permite publicados, creador e inscritos. */
export async function getAccessibleProgram(
  slug: string,
): Promise<Course | null> {
  if (!isSupabaseConfigured) {
    const { getCourseBySlug } = await import("./data-demo");
    return getCourseBySlug(slug);
  }
  const db = await createSessionClient();
  const { data, error } = await db
    .from("courses")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error)
    throw new Error("No pudimos cargar el programa. Inténtalo de nuevo.");
  return data ? toCourse(data) : null;
}

export async function updateProgram(
  course: Course,
  userId: string,
  input: NewCourseInput,
) {
  const db = await createSessionClient();
  const { error, data } = await db
    .from("courses")
    .update({
      title: input.title,
      description: input.description,
      creator_name: input.creatorName,
      category: input.category,
      price_cents: input.priceCents,
      trailer_url: input.trailerUrl,
      trailer_seconds: input.trailerSeconds,
      trailer_source: input.trailerUrl ? "creator" : "ai",
      art: withCover(course.art, input.title, input.cover),
      scenes: defaultScenes(
        input.title,
        input.description,
        input.creatorName,
        formatPrice(input.priceCents, course.currency),
      ),
    })
    .eq("id", course.id)
    .eq("creator_id", userId)
    .select("id")
    .single();
  if (error || !data)
    throw new Error(error?.message ?? "No pudimos guardar los cambios.");
}

export async function setProgramPublished(
  courseId: string,
  userId: string,
  published: boolean,
) {
  const db = await createSessionClient();
  const { error, data } = await db
    .from("courses")
    .update({ published })
    .eq("id", courseId)
    .eq("creator_id", userId)
    .select("id")
    .single();
  if (error || !data)
    throw new Error(error?.message ?? "No pudimos cambiar la publicación.");
}

/** Habilita publicación solo cuando las políticas de acceso están instaladas. */
export async function publicationReady(courseId: string): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  const db = await createSessionClient();
  const { data, error } = await db.rpc("has_course_access", {
    program_id: courseId,
  });
  return !error && data === true;
}
