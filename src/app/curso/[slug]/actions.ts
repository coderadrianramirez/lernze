"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { enroll, getCourseBySlug } from "@/lib/data";
import { parseOrigin } from "@/lib/pricing";

/** Compra simulada: registra la inscripción y su origen, sin cobrar. Requiere sesión. */
export async function enrollAction(formData: FormData) {
  const slug = String(formData.get("slug") ?? "");
  const origin = parseOrigin(String(formData.get("origin") ?? ""));
  const course = await getCourseBySlug(slug);
  if (!course) redirect("/");

  const user = await getCurrentUser();
  if (!user) redirect(`/registro?next=${encodeURIComponent(`/curso/${course.slug}?src=${origin}`)}`);

  await enroll(course, origin, user.id);
  revalidatePath("/");
  redirect(`/curso/${course.slug}?ok=1`);
}
