"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { listCourses } from "@/lib/data";
import { searchCourses } from "@/lib/search";
import { createSessionClient } from "@/lib/supabase/server";

const uuid = (s: unknown): s is string =>
  typeof s === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
export async function interestSignalAction(
  courseId: string,
  kind: "trailer" | "creator" | "dismiss",
) {
  if (!uuid(courseId) || !["trailer", "creator", "dismiss"].includes(kind))
    return { saved: false, error: "El programa no es válido." };
  const user = await getCurrentUser();
  if (!user || user.demo)
    return {
      saved: false,
      error: "Inicia sesión para personalizar tus recomendaciones.",
    };
  const db = await createSessionClient();
  const { data, error } = await db.rpc("record_recommendation_signal", {
    target_course: courseId,
    signal_kind: kind,
  });
  if (error || data !== true)
    return {
      saved: false,
      error: "No pudimos guardar esta preferencia. Inténtalo más tarde.",
    };
  if (kind === "dismiss") {
    revalidatePath("/");
    revalidatePath("/intereses");
    revalidatePath("/descubrir");
  }
  return { saved: true };
}

/** Solo conserva coincidencias públicas: el texto no se escribe en la base. */
export async function searchInterestAction(query: string) {
  if (typeof query !== "string" || query.trim().length < 3 || query.length > 80)
    return;
  const user = await getCurrentUser();
  if (!user || user.demo) return;
  const matches = searchCourses(await listCourses(), query).filter(
    (c) => c.creatorId !== user.id,
  );
  const categories = new Set<string>();
  const chosen = matches
    .filter((c) => {
      if (categories.has(c.category)) return false;
      categories.add(c.category);
      return true;
    })
    .slice(0, 3);
  if (!chosen.length) return;
  const db = await createSessionClient();
  const results = await Promise.all(
    chosen
      .filter((c) => uuid(c.id))
      .map((c) =>
        db.rpc("record_recommendation_signal", {
          target_course: c.id,
          signal_kind: "search",
        }),
      ),
  );
  return { saved: results.some((r) => !r.error && r.data === true) };
}

export async function restoreInterestAction(form: FormData) {
  const id = form.get("courseId");
  if (!uuid(id)) return;
  const user = await getCurrentUser();
  if (!user || user.demo) return;
  const db = await createSessionClient();
  const { error } = await db.rpc("restore_recommendation", {
    target_course: id,
  });
  if (error)
    throw new Error(
      "No pudimos recuperar esta recomendación. Inténtalo de nuevo.",
    );
  revalidatePath("/");
  revalidatePath("/intereses");
  revalidatePath("/descubrir");
}
