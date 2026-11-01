import { createSessionClient } from "./supabase/server";
import { isSupabaseConfigured } from "./supabase/config";
import type { InterestSignal } from "./recommendations";

/** Todo se lee con la sesión actual y RLS; nunca se utiliza una clave de servicio. */
export async function recommendationActivity(userId: string) {
  if (!isSupabaseConfigured)
    return {
      signals: [] as InterestSignal[],
      following: [] as string[],
      enrolled: [] as string[],
      ready: false,
    };
  const db = await createSessionClient();
  const since = new Date(Date.now() - 90 * 86_400_000).toISOString();
  const [signals, views, following, enrolled] = await Promise.all([
    db
      .from("recommendation_signals")
      .select("course_id,kind,occurred_at")
      .eq("user_id", userId)
      .order("occurred_at", { ascending: false })
      .limit(400),
    db
      .from("course_views")
      .select("course_id,viewed_at")
      .eq("user_id", userId)
      .gte("viewed_at", since)
      .order("viewed_at", { ascending: false })
      .limit(100),
    db
      .from("creator_follows")
      .select("creator_id")
      .eq("follower_id", userId)
      .order("created_at", { ascending: false })
      .limit(500),
    db
      .from("enrollments")
      .select("course_id,created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1000),
  ]);
  return {
    signals: [
      ...(signals.data ?? []).map(
        (s) =>
          ({
            courseId: s.course_id,
            kind: s.kind,
            at: s.occurred_at,
          }) as InterestSignal,
      ),
      ...(views.data ?? []).map((s) => ({
        courseId: s.course_id,
        kind: "view" as const,
        at: s.viewed_at,
      })),
      ...(enrolled.data ?? []).map((s) => ({
        courseId: s.course_id,
        kind: "enroll" as const,
        at: s.created_at,
      })),
    ],
    following: (following.data ?? []).map((s) => s.creator_id as string),
    enrolled: (enrolled.data ?? []).map((s) => s.course_id as string),
    ready: !signals.error,
  };
}
