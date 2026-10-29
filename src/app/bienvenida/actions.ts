"use server";

import { saveUserInterests } from "@/lib/data";

export async function saveInterestsAction(userId: string, interests: string[]): Promise<void> {
  await saveUserInterests(userId, interests);
}
