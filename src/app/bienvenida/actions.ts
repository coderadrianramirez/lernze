"use server";

import { getCurrentUser } from "@/lib/auth";
import { saveUserInterests } from "@/lib/data";
import { CATEGORIES } from "@/lib/types";

/** Guarda los intereses de quien tiene la sesión abierta; ignora categorías desconocidas. */
export async function saveInterestsAction(interests: string[]): Promise<void> {
  const user = await getCurrentUser();
  if (!user || user.demo) return;
  const clean = [...new Set(interests)].filter((x) => (CATEGORIES as string[]).includes(x));
  await saveUserInterests(user.id, clean);
}
