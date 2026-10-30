"use server";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { createCourse } from "@/lib/data";
import { readProgram, type ProgramFormState } from "@/lib/program-validation";
import { revalidateProgram } from "@/lib/revalidate-program";

export async function createCourseAction(
  _prev: ProgramFormState,
  formData: FormData,
): Promise<ProgramFormState> {
  const user = await getCurrentUser();
  if (!user) redirect("/entrar?next=/crear");
  if (user.demo)
    return {
      errors: {},
      error: "Inicia sesión para guardar un programa propio.",
    };
  const { input, errors } = readProgram(formData);
  if (Object.keys(errors).length) return { errors };
  let slug: string;
  try {
    slug = (await createCourse(input, user.id)).slug;
  } catch {
    return {
      errors: {},
      error: "No pudimos guardar tu borrador. Inténtalo de nuevo.",
    };
  }
  revalidateProgram(slug);
  redirect(`/programa/${slug}/clases?creado=1`);
}
