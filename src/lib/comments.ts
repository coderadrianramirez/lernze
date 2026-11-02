import { createSessionClient } from "./supabase/server";
import { avatarUrl } from "./profile";

export type LessonComment = { id: string; lessonId: string; parentId: string | null; authorId: string | null; name: string; avatar: string | null; creator: boolean; body: string; photos: { path: string; url: string }[]; deleted: boolean; createdAt: string; editedAt: string | null; replies: number };
export type CommentPage = { comments: LessonComment[]; hasMore: boolean; ready: boolean; error?: string };
export type CommentCursor = { createdAt: string; id: string };
export const commentUuid = (v: unknown): v is string => typeof v === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
export const commentPhotoPath = (p: unknown): p is string => typeof p === "string" && /^[0-9a-f-]{36}\/[0-9a-f-]{36}\/[0-9a-f-]{36}\.webp$/.test(p);

export async function readLessonComments(lessonId: string, parentId: string | null = null, cursor?: CommentCursor): Promise<CommentPage> {
  const db = await createSessionClient();
  const { data, error } = await db.rpc("list_lesson_comments", { target_lesson: lessonId, parent_comment: parentId, before_created: cursor?.createdAt ?? null, before_id: cursor?.id ?? null });
  if (error) return { comments: [], hasMore: false, ready: false, error: ["PGRST202", "42883"].includes(error.code) ? undefined : "No pudimos cargar la conversación. Inténtalo de nuevo." };
  type Row = { id: string; lesson_id: string; parent_id: string | null; author_id: string | null; author_name: string; avatar_path: string | null; is_creator: boolean; body: string; image_paths: string[]; deleted: boolean; created_at: string; edited_at: string | null; reply_count: number };
  const rows = (data ?? []) as Row[];
  const paths = rows.slice(0,20).flatMap(r => r.image_paths).filter(commentPhotoPath);
  const signed = paths.length ? await db.storage.from("comment-images").createSignedUrls(paths, 600) : null;
  const urls = new Map((signed?.data ?? []).map(p => [p.path, p.signedUrl]));
  return { ready: true, hasMore: rows.length > 20, comments: rows.slice(0,20).map(r => ({ id:r.id,lessonId:r.lesson_id,parentId:r.parent_id,authorId:r.author_id,name:r.author_name,avatar:avatarUrl(r.avatar_path),creator:r.is_creator,body:r.body,photos:r.image_paths.filter(commentPhotoPath).map(path=>({path,url:urls.get(path) ?? ""})),deleted:r.deleted,createdAt:r.created_at,editedAt:r.edited_at,replies:Number(r.reply_count) })) };
}
