"use server";

import { getCurrentUser } from "@/lib/auth";
import { createSessionClient } from "@/lib/supabase/server";
import { commentPhotoPath, commentUuid, readLessonComments, type CommentCursor } from "@/lib/comments";

async function session() {
  const user = await getCurrentUser();
  return user && !user.demo ? { user, db: await createSessionClient() } : null;
}

export async function loadCommentsAction(lessonId: string, parentId: string | null, cursor?: CommentCursor) {
  if (!commentUuid(lessonId) || (parentId !== null && !commentUuid(parentId)) || (cursor && (!commentUuid(cursor.id) || !Number.isFinite(Date.parse(cursor.createdAt))))) return { comments: [], ready: false, hasMore: false, error: "La conversación no es válida." };
  if (!await session()) return { comments: [], ready: false, hasMore: false, error: "Inicia sesión para ver los comentarios." };
  return readLessonComments(lessonId, parentId, cursor);
}

export async function commentUploadAction(lessonId: string) {
  if (!commentUuid(lessonId)) return { error: "La clase no es válida." };
  const s = await session();
  if (!s) return { error: "Inicia sesión para añadir fotos." };
  const access = await s.db.rpc("can_access_lesson_comments", { target_lesson: lessonId });
  if (access.error || !access.data) return { error: "Solo los alumnos inscritos y el creador pueden añadir fotos." };
  const path = `${s.user.id}/${lessonId}/${crypto.randomUUID()}.webp`;
  const { data, error } = await s.db.storage.from("comment-images").createSignedUploadUrl(path);
  return error || !data ? { error: "No pudimos preparar la foto. Inténtalo de nuevo." } : { path, signedUrl: data.signedUrl };
}

export async function cleanupCommentPhotosAction(paths: string[]) {
  if (!Array.isArray(paths) || paths.length > 4) return;
  const s = await session();
  if (!s) return;
  const own = paths.filter(p => commentPhotoPath(p) && p.startsWith(`${s.user.id}/`));
  if (own.length) await s.db.storage.from("comment-images").remove(own);
}

export async function saveCommentAction(input: { lessonId: string; id?: string; parentId: string | null; body: string; photos: string[] }) {
  if (!input || !commentUuid(input.lessonId) || (input.id !== undefined && !commentUuid(input.id)) || (input.parentId !== null && !commentUuid(input.parentId)) || typeof input.body !== "string" || input.body.trim().length > 2000 || !Array.isArray(input.photos) || input.photos.length > 4 || !input.photos.every(commentPhotoPath) || (!input.body.trim() && !input.photos.length)) return { error: "Escribe un comentario de hasta 2000 caracteres o añade hasta cuatro fotos." };
  const s = await session();
  if (!s) return { error: "Inicia sesión para comentar." };
  const old = input.id ? await s.db.from("lesson_comments").select("image_paths").eq("id",input.id).eq("author_id",s.user.id).maybeSingle() : null;
  const { data, error } = await s.db.rpc("save_lesson_comment", { target_lesson:input.lessonId,comment_id:input.id ?? null,parent_comment:input.parentId,comment_body:input.body.trim(),photos:input.photos });
  if (error || !data) return { error: error?.code === "P0001" ? error.message : "No pudimos guardar el comentario. Inténtalo de nuevo." };
  const removed = ((old?.data?.image_paths ?? []) as string[]).filter(p=>!input.photos.includes(p));
  if (removed.length) { const result=await s.db.storage.from("comment-images").remove(removed); if(result.error) console.error("[comment photo cleanup]",result.error.message); }
  return { saved: true };
}

export async function deleteCommentAction(id: string) {
  if (!commentUuid(id)) return { error: "El comentario no es válido." };
  const s = await session();
  if (!s) return { error: "Inicia sesión para continuar." };
  const { data, error } = await s.db.rpc("remove_lesson_comment", { target_comment:id });
  if (error) return { error: "No pudimos eliminar el comentario. Comprueba tu acceso e inténtalo de nuevo." };
  const paths = (Array.isArray(data) ? data : []).filter(commentPhotoPath);
  if (paths.length) { const result=await s.db.storage.from("comment-images").remove(paths); if(result.error) console.error("[comment photo cleanup]",result.error.message); }
  return { saved:true };
}

export async function renewCommentPhotoAction(path: string) {
  if (!commentPhotoPath(path)) return { error:"La imagen no es válida." };
  const s = await session();
  if (!s) return { error:"Inicia sesión para ver la foto." };
  const {data,error}=await s.db.storage.from("comment-images").createSignedUrl(path,600);
  return error || !data ? {error:"La foto ya no está disponible."} : {url:data.signedUrl};
}
