"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { creatorIdValid, creatorPath, publicCreator } from "@/lib/creators";
import { createSessionClient } from "@/lib/supabase/server";

export type FollowResult = { following?: boolean; followers?: number; error?: string; requiresSignIn?: boolean };

export async function followCreatorAction(creatorId: string, following: boolean): Promise<FollowResult> {
  if (typeof creatorId !== "string" || !creatorIdValid(creatorId) || typeof following !== "boolean") return { error: "El perfil no es válido." };
  const user = await getCurrentUser();
  if (!user || user.demo) return { error: "Inicia sesión para seguir a este creador.", requiresSignIn: true };
  if (user.id === creatorId) return { error: "Este es tu propio perfil." };
  const { creator, ready } = await publicCreator(creatorId);
  if (!ready) return { error: "El seguimiento estará disponible en breve." };
  if (!creator) return { error: "Este perfil ya no está disponible." };
  const db = await createSessionClient();
  const result = following
    ? await db.from("creator_follows").upsert({ follower_id: user.id, creator_id: creatorId }, { onConflict: "follower_id,creator_id", ignoreDuplicates: true })
    : await db.from("creator_follows").delete().eq("follower_id", user.id).eq("creator_id", creatorId);
  if (result.error) return { error: "No pudimos guardar el cambio. Inténtalo de nuevo." };
  const updated = await publicCreator(creatorId);
  revalidatePath(creatorPath(creatorId));
  revalidatePath("/siguiendo");
  revalidatePath("/");
  revalidatePath("/dashboard");
  return { following, followers: updated.creator?.followers ?? creator.followers };
}
