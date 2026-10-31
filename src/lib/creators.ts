import { listCourses } from "./data";
import { avatarUrl } from "./profile";
import { courseCreatorId } from "./creator-path";
export { creatorPath } from "./creator-path";
import { createPublicReadClient, createSessionClient } from "./supabase/server";
import { isSupabaseConfigured } from "./supabase/config";

export type Creator = { id: string; name: string; avatarUrl: string | null; followers: number; programs: number; demo?: boolean };
export const creatorIdValid = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

/** Antes de la activación solo se muestra información ya pública del catálogo. */
async function catalogueCreators(query: string, ids?: string[]): Promise<Creator[]> {
  const courses = await listCourses();
  const groups = new Map<string, typeof courses>();
  for (const course of courses) {
    const id = courseCreatorId(course);
    if (!id || (ids && !ids.includes(id))) continue;
    groups.set(id, [...(groups.get(id) ?? []), course]);
  }
  return [...groups.entries()].flatMap(([id, programs]) => {
    const names = [...new Set(programs.map((p) => p.creatorName))];
    const words = norm(query).split(/\s+/).filter(Boolean);
    if (!words.every((word) => norm(names.join(" ")).includes(word))) return [];
    return [{ id, name: names.length === 1 ? names[0] : "Creador de estos programas", avatarUrl: null, followers: 0, programs: programs.length, demo: id.startsWith("demo-") }];
  });
}

export async function listPublicCreators(query = "", ids?: string[]): Promise<{ creators: Creator[]; ready: boolean }> {
  if (!isSupabaseConfigured) return { creators: await catalogueCreators(query, ids), ready: false };
  if (ids && !ids.length) return { creators: [], ready: true };
  const onlyDemo = ids?.every((id) => id.startsWith("demo-"));
  if (onlyDemo) return { creators: await catalogueCreators(query, ids), ready: false };
  const db = createPublicReadClient();
  const { data, error } = await db.rpc("list_public_creators", { search_text: query.slice(0, 80), creator_ids: ids?.filter((id) => creatorIdValid(id)) ?? null });
  if (error) return { creators: await catalogueCreators(query, ids), ready: false };
  return {
    creators: [...(data ?? []).map((r: { id: string; display_name: string; avatar_path: string | null; follower_count: number; program_count: number }) => ({
      id: r.id, name: r.display_name, avatarUrl: avatarUrl(r.avatar_path), followers: Number(r.follower_count), programs: Number(r.program_count),
    })), ...(await catalogueCreators(query, ids)).filter((creator) => creator.demo)],
    ready: true,
  };
}

export async function publicCreator(id: string) {
  if (isSupabaseConfigured && !creatorIdValid(id) && !/^demo-[a-z0-9-]+$/.test(id)) return { creator: null, ready: false };
  const result = await listPublicCreators("", [id]);
  return { creator: result.creators[0] ?? null, ready: result.ready };
}

export async function followsCreator(userId: string, creatorId: string): Promise<boolean> {
  if (!isSupabaseConfigured || !creatorIdValid(creatorId)) return false;
  const db = await createSessionClient();
  const { data } = await db.from("creator_follows").select("creator_id").eq("follower_id", userId).eq("creator_id", creatorId).maybeSingle();
  return Boolean(data);
}

export async function followingCreators(userId: string, page: number) {
  if (!isSupabaseConfigured) return { creators: [] as Creator[], ready: false, hasNext: false };
  const db = await createSessionClient();
  const start = (page - 1) * 30;
  const { data, error } = await db.from("creator_follows").select("creator_id").eq("follower_id", userId).order("created_at", { ascending: false }).order("creator_id").range(start, start + 30);
  if (error) return { creators: [] as Creator[], ready: false, hasNext: false };
  const ids = (data ?? []).slice(0, 30).map((r) => r.creator_id as string);
  const result = await listPublicCreators("", ids);
  result.creators.sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));
  return { ...result, hasNext: (data?.length ?? 0) > 30 };
}
