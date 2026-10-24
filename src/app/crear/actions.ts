"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { createCourse } from "@/lib/data";
import { programPath } from "@/lib/copy";
import { CATEGORIES, type Category } from "@/lib/types";

export type CreateState = { errors: Partial<Record<"title" | "price" | "category" | "trailerUrl" | "creatorName", string>> };

export async function createCourseAction(_prev: CreateState, formData: FormData): Promise<CreateState> {
  const user = await getCurrentUser();
  if (!user) redirect("/entrar?next=/crear");

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const creatorName = String(formData.get("creatorName") ?? "").trim();
  const category = String(formData.get("category") ?? "");
  const price = Number(String(formData.get("price") ?? "").replace(",", "."));
  const trailerRaw = String(formData.get("trailerUrl") ?? "").trim();

  const errors: CreateState["errors"] = {};
  if (title.length < 4 || title.length > 120) errors.title = "El título debe tener entre 4 y 120 caracteres.";
  if (!creatorName) errors.creatorName = "Escribe el nombre que verán los alumnos.";
  if (!(CATEGORIES as string[]).includes(category)) errors.category = "Elige una categoría.";
  if (!Number.isFinite(price) || price < 0 || price > 5000) errors.price = "El precio debe estar entre 0 y 5.000 dólares.";
  if (trailerRaw) {
    try {
      const u = new URL(trailerRaw);
      if (u.protocol !== "https:") errors.trailerUrl = "El enlace del trailer debe empezar con https://.";
    } catch {
      errors.trailerUrl = "Ese enlace no es válido.";
    }
  }
  if (Object.keys(errors).length) return { errors };

  const course = await createCourse({
    title,
    description,
    creatorName,
    category: category as Category,
    priceCents: Math.round(price * 100),
    trailerUrl: trailerRaw || null,
  }, user.id);
  revalidatePath("/");
  redirect(programPath(course.slug));
}
