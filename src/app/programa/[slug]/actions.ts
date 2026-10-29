"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { enroll, getCourseBySlug, recordView } from "@/lib/data";
import { programPath } from "@/lib/copy";
import { parseOrigin } from "@/lib/pricing";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Guarda que el usuario abrió este programa. Sin sesión no hace nada. */
export async function trackViewAction(courseId: string) {
  if (!UUID_RE.test(courseId)) return;
  const user = await getCurrentUser();
  if (!user || user.demo) return;
  await recordView(user.id, courseId);
}

/** Compra simulada: registra la inscripción y su origen, sin cobrar. Requiere sesión. */
export async function enrollAction(formData: FormData) {
  const slug = String(formData.get("slug") ?? "");
  const origin = parseOrigin(String(formData.get("origin") ?? ""));
  const course = await getCourseBySlug(slug);
  if (!course) redirect("/");

  const user = await getCurrentUser();
  if (!user) redirect(`/registro?next=${encodeURIComponent(`${programPath(course.slug)}?src=${origin}`)}`);

  await enroll(course, origin, user.id);
  revalidatePath("/");
  redirect(`${programPath(course.slug)}?ok=1`);
}
