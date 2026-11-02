/* eslint-disable @next/next/no-img-element -- Fotos privadas con enlaces temporales de Supabase. */
"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { Avatar } from "./Avatar";
import { ConfirmDialog } from "./ConfirmDialog";
import { imageBlob } from "@/lib/browser-image";
import type { CommentCursor, CommentPage, LessonComment } from "@/lib/comments";
import { loadCommentsAction, saveCommentAction, deleteCommentAction, commentUploadAction, cleanupCommentPhotosAction, renewCommentPhotoAction } from "@/app/actions/comments";

export type CommentApi = {
  load: typeof loadCommentsAction;
  save: typeof saveCommentAction;
  remove: typeof deleteCommentAction;
  upload: typeof commentUploadAction;
  cleanup: typeof cleanupCommentPhotosAction;
  photo: typeof renewCommentPhotoAction;
};
const liveApi: CommentApi = { load:loadCommentsAction,save:saveCommentAction,remove:deleteCommentAction,upload:commentUploadAction,cleanup:cleanupCommentPhotosAction,photo:renewCommentPhotoAction };
type Identity = { id:string; name:string; avatar?:string|null };
type Props = { lessonId:string; user:Identity; moderator:boolean; initial:CommentPage; api?:CommentApi };

export function LessonComments({ lessonId,user,moderator,initial,api=liveApi }:Props) {
  const [page,setPage]=useState(initial);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState(initial.error ?? "");
  const [version,setVersion]=useState(0);
  const [lightbox,setLightbox]=useState<string|null>(null);
  const [notice,setNotice]=useState("");
  async function refresh(more=false) {
    setLoading(true);setError("");
    try {
      const last=page.comments.at(-1);
      const result=await api.load(lessonId,null,more && last ? {createdAt:last.createdAt,id:last.id} : undefined);
      if(!result.ready) {setError(result.error ?? "Los comentarios todavía no están disponibles.");return;}
      setPage({...result,comments:more ? [...page.comments,...result.comments.filter(c=>!page.comments.some(old=>old.id===c.id))] : result.comments});
      if(!more) setVersion(v=>v+1);
    } catch {setError("No pudimos conectar. Tu mensaje sigue en el formulario.");}
    finally {setLoading(false);}
  }
  async function openPhoto(path:string) {
    setNotice("");
    try {const r=await api.photo(path);if(r.url)setLightbox(r.url);else setNotice(r.error ?? "La foto no está disponible.");}
    catch {setNotice("No pudimos abrir la foto. Inténtalo de nuevo.");}
  }
  return <section className="lesson-comments" aria-labelledby="lesson-comments-title">
    <header className="lc-heading"><div><span className="lc-eyebrow">APRENDE EN CONVERSACIÓN</span><h2 id="lesson-comments-title">Comentarios de la clase<span>.</span></h2></div>{page.ready && <button type="button" className="lc-text-button" disabled={loading} onClick={()=>void refresh()}>{loading ? "Actualizando…" : "Actualizar"}</button>}</header>
    <p className="lc-intro">Pregunta, comparte tu práctica o ayuda a otro alumno. Esta conversación es privada para quienes forman parte del programa.</p>
    {!page.ready ? <div className="lc-empty"><p>Los comentarios de esta clase estarán disponibles pronto.</p><p className="lc-muted">Aquí podrás conversar y compartir fotos de tus avances.</p></div> : <>
      <Composer key={lessonId} lessonId={lessonId} user={user} api={api} onSaved={()=>{setNotice("Comentario publicado");void refresh();}} />
      {!page.comments.length && !error && <div className="lc-empty"><span aria-hidden="true">↗</span><h3>Tu pregunta puede ayudar a alguien más</h3><p>Inicia la conversación sobre esta clase.</p></div>}
      <div className="lc-threads">{page.comments.map(comment=><Thread key={comment.id} comment={comment} user={user} moderator={moderator} api={api} version={version} onChange={()=>{setNotice("");void refresh();}} onPhoto={openPhoto} />)}</div>
      {page.hasMore && <button type="button" className="lc-load" disabled={loading} onClick={()=>void refresh(true)}>{loading ? "Cargando…" : "Ver más comentarios"}</button>}
    </>}
    {error && <p role="alert" className="lc-error">{error} <button type="button" onClick={()=>void refresh()}>Reintentar</button></p>}
    <p className="lc-status" role="status">{notice}</p>
    <PhotoDialog url={lightbox} onClose={()=>setLightbox(null)} />
  </section>;
}

function Thread({comment,user,moderator,api,version,onChange,onPhoto}:{comment:LessonComment;user:Identity;moderator:boolean;api:CommentApi;version:number;onChange:()=>void;onPhoto:(path:string)=>void}) {
  const [replies,setReplies]=useState<LessonComment[]>([]);
  const [open,setOpen]=useState(false);
  const [replyTo,setReplyTo]=useState<string|null>(null);
  const [more,setMore]=useState(false);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");
  const repliesId=useId();
  // Cambiar comentarios no refresca la página ni reinicia el reproductor de la clase.
  useEffect(()=>{
    if(!open)return;
    let stale=false;
    void api.load(comment.lessonId,comment.id).then(r=>{if(stale)return;if(r.ready){setReplies(r.comments);setMore(r.hasMore);setError("");}else setError(r.error ?? "No pudimos cargar las respuestas.");}).catch(()=>{if(!stale)setError("No pudimos cargar las respuestas.");});
    return()=>{stale=true;};
  },[open,version,api,comment.id,comment.lessonId]);
  async function loadMore() {
    setLoading(true);setError("");
    try {const last=replies.at(-1);const cursor:CommentCursor|undefined=last?{createdAt:last.createdAt,id:last.id}:undefined;const r=await api.load(comment.lessonId,comment.id,cursor);if(r.ready){setReplies(old=>[...old,...r.comments.filter(c=>!old.some(o=>o.id===c.id))]);setMore(r.hasMore);}else setError(r.error ?? "No pudimos cargar las respuestas.");}
    catch{setError("No pudimos conectar. Inténtalo de nuevo.");}finally{setLoading(false);}
  }
  return <article className="lc-thread">
    <CommentRow comment={comment} user={user} moderator={moderator} api={api} onChange={onChange} onReply={name=>{setOpen(true);setReplyTo(name);}} onPhoto={onPhoto} />
    {(comment.replies>0 || open) && <button type="button" className="lc-replies-toggle" aria-expanded={open} aria-controls={repliesId} onClick={()=>setOpen(v=>!v)}><span aria-hidden="true">—</span>{open?"Ocultar respuestas":`Ver ${comment.replies} ${comment.replies===1?"respuesta":"respuestas"}`}</button>}
    {open && <div id={repliesId} className="lc-replies">{replies.map(reply=><CommentRow key={reply.id} comment={reply} user={user} moderator={moderator} api={api} onChange={onChange} onReply={setReplyTo} onPhoto={onPhoto} />)}
      {more && <button type="button" className="lc-text-button" disabled={loading} onClick={()=>void loadMore()}>{loading?"Cargando…":"Ver más respuestas"}</button>}
      {error && <p role="alert" className="lc-error">{error} <button type="button" onClick={()=>void loadMore()}>Reintentar</button></p>}
      {replyTo && <Composer key={`${comment.id}:${replyTo}`} lessonId={comment.lessonId} parentId={comment.id} replyTo={replyTo} user={user} api={api} onCancel={()=>setReplyTo(null)} onSaved={()=>{setReplyTo(null);onChange();}} />}
    </div>}
  </article>;
}

function CommentRow({comment,user,moderator,api,onChange,onReply,onPhoto}:{comment:LessonComment;user:Identity;moderator:boolean;api:CommentApi;onChange:()=>void;onReply:(name:string)=>void;onPhoto:(path:string)=>void}) {
  const [edit,setEdit]=useState(false);
  const [confirm,setConfirm]=useState(false);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const own=comment.authorId===user.id;
  async function remove() {setBusy(true);setError("");try{const result=await api.remove(comment.id);if(result.error){setError(result.error);return;}setConfirm(false);onChange();}catch{setError("No pudimos eliminar el comentario. Inténtalo de nuevo.");}finally{setBusy(false);}}
  return <div className={`lc-comment ${comment.deleted?"is-deleted":""}`}>
    <Avatar name={comment.name} src={comment.avatar} className="h-8 w-8 text-xs sm:h-9 sm:w-9" />
    <div className="lc-comment-main"><div className="lc-author"><strong>{comment.name}</strong>{comment.creator && <span>Creador</span>}<time dateTime={comment.createdAt} title={comment.createdAt}>{new Intl.DateTimeFormat("es",{day:"numeric",month:"short",timeZone:"UTC"}).format(new Date(comment.createdAt))}</time>{comment.editedAt && !comment.deleted && <small>Editado</small>}</div>
      {edit ? <Composer lessonId={comment.lessonId} parentId={comment.parentId} initial={comment} user={user} api={api} onCancel={()=>setEdit(false)} onSaved={()=>{setEdit(false);onChange();}} /> : <>
        <p className="lc-body">{comment.deleted?"El contenido de este comentario fue eliminado. Las respuestas se conservan.":comment.body}</p>
        {!!comment.photos.length && <div className="lc-photos">{comment.photos.map((photo,i)=><CommentPhoto key={photo.path} photo={photo} name={comment.name} index={i} api={api} onOpen={()=>onPhoto(photo.path)} />)}</div>}
        {!comment.deleted && <button type="button" className="lc-reply-button" onClick={()=>onReply(comment.name)}>Responder</button>}
      </>}
      {comment.deleted && <button type="button" className="lc-reply-button" onClick={()=>onReply("la conversación")}>Responder al hilo</button>}
      {error && !confirm && <p role="alert" className="lc-error">{error}</p>}
    </div>
    {!comment.deleted && (own||moderator) && <details className="lc-menu"><summary aria-label={`Opciones del comentario de ${comment.name}`}>•••</summary><div>{own && <button type="button" onClick={event=>{event.currentTarget.closest("details")?.removeAttribute("open");setEdit(true);}}>Editar</button>}<button type="button" onClick={event=>{event.currentTarget.closest("details")?.removeAttribute("open");setConfirm(true);}}>Eliminar</button></div></details>}
    <ConfirmDialog open={confirm} title={own?"¿Eliminar tu comentario?":"¿Eliminar este comentario?"} onClose={()=>{if(!busy)setConfirm(false);}} busy={busy}><p className="text-sm text-muted">Se quitarán el texto y las fotos. Las respuestas de otras personas se conservarán. Esta acción no se puede deshacer.</p>{error && <p role="alert" className="lc-error">{error}</p>}<div className="mt-5 flex justify-end gap-3"><button type="button" disabled={busy} className="lc-text-button" onClick={()=>setConfirm(false)}>Cancelar</button><button type="button" disabled={busy} className="lc-delete" onClick={()=>void remove()}>{busy?"Eliminando…":"Eliminar comentario"}</button></div></ConfirmDialog>
  </div>;
}

type DraftPhoto={url:string;path?:string;blob?:Blob};
function Composer({lessonId,parentId=null,replyTo,initial,user,api,onSaved,onCancel}:{lessonId:string;parentId?:string|null;replyTo?:string;initial?:LessonComment;user:Identity;api:CommentApi;onSaved:()=>void;onCancel?:()=>void}) {
  const [body,setBody]=useState(initial?.body??"");
  const [photos,setPhotos]=useState<DraftPhoto[]>(initial?.photos??[]);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const input=useRef<HTMLInputElement>(null);
  const label=useId();
  async function choose(files:FileList|null) {
    if(!files)return;setError("");
    if(photos.length+files.length>4){setError("Puedes añadir hasta cuatro fotos por mensaje.");return;}
    setBusy(true);const fresh:DraftPhoto[]=[];
    try{for(const file of Array.from(files)){if(!["image/jpeg","image/png","image/webp"].includes(file.type)||file.size>8*1024*1024)throw Error("Elige fotos JPG, PNG o WebP de hasta 8 MB.");const blob=await imageBlob(file,1600);if(blob.size>5*1024*1024)throw Error("La imagen es demasiado grande. Prueba con otra foto.");fresh.push({blob,url:URL.createObjectURL(blob)});}setPhotos(old=>[...old,...fresh]);}
    catch(e){fresh.forEach(p=>URL.revokeObjectURL(p.url));setError(e instanceof Error?e.message:"No pudimos preparar la foto.");}finally{setBusy(false);if(input.current)input.current.value="";}
  }
  const clear=()=>{photos.forEach(p=>{if(p.blob)URL.revokeObjectURL(p.url);});setPhotos(initial?.photos??[]);setBody(initial?.body??"");setError("");};
  async function submit(event:FormEvent) {
    event.preventDefault();if(busy)return;setBusy(true);setError("");const uploaded:string[]=[];
    try {
      const paths:string[]=[];
      for(const photo of photos){if(photo.path){paths.push(photo.path);continue;}if(!photo.blob)continue;const ticket=await api.upload(lessonId);if(!ticket.path||!ticket.signedUrl)throw Error(ticket.error??"No pudimos subir la foto.");const data=new FormData();data.append("",photo.blob,"practica.webp");uploaded.push(ticket.path);const response=await fetch(ticket.signedUrl,{method:"PUT",headers:{"x-upsert":"false"},body:data});if(!response.ok)throw Error("No pudimos subir la foto. Tu comentario no se ha enviado.");paths.push(ticket.path);}
      const result=await api.save({lessonId,id:initial?.id,parentId,body,photos:paths});if(result.error)throw Error(result.error);
      photos.forEach(p=>{if(p.blob)URL.revokeObjectURL(p.url);});setBody("");setPhotos([]);onSaved();
    } catch(e) {if(uploaded.length)void api.cleanup(uploaded).catch(()=>{});setError(e instanceof Error?e.message:"No pudimos publicar. Inténtalo de nuevo.");}
    finally{setBusy(false);}
  }
  return <form className={`lc-composer ${parentId||initial?"is-compact":""}`} onSubmit={submit}>
    {!parentId&&!initial&&<Avatar name={user.name} src={user.avatar} className="h-9 w-9 text-xs" />}
    <div className="lc-compose-main"><label htmlFor={label}>{initial?"Editar comentario":replyTo?`Responder a ${replyTo}`:"Comparte tu pregunta o tu avance"}</label><textarea id={label} value={body} disabled={busy} onChange={e=>setBody(e.target.value)} maxLength={2000} rows={parentId||initial?2:3} placeholder={replyTo?"Escribe tu respuesta…":"¿Qué te gustaría preguntar o compartir?"} />
      {!!photos.length&&<div className="lc-draft-photos">{photos.map((photo,i)=><div key={photo.url}><img src={photo.url} alt={`Foto adjunta ${i+1}`} /><button type="button" disabled={busy} aria-label={`Quitar foto ${i+1}`} onClick={()=>{if(photo.blob)URL.revokeObjectURL(photo.url);setPhotos(old=>old.filter((_,j)=>i!==j));}}>×</button></div>)}</div>}
      <div className="lc-compose-tools"><input ref={input} type="file" multiple accept="image/jpeg,image/png,image/webp" className="sr-only" aria-label="Seleccionar fotos" disabled={busy||photos.length>=4} onChange={e=>void choose(e.target.files)} /><button type="button" className="lc-add-photo" disabled={busy||photos.length>=4} onClick={()=>input.current?.click()}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="4"/><circle cx="8" cy="8" r="1.5"/><path d="m3 17 5-5 4 4 3-3 6 6"/></svg><span>Foto{photos.length?` ${photos.length}/4`:""}</span></button><span className="lc-character-count">{body.length}/2000</span><div className="lc-submit-actions">{(onCancel||body||photos.length>0)&&<button type="button" className="lc-text-button" disabled={busy} onClick={()=>{clear();onCancel?.();}}>Cancelar</button>}<button type="submit" className="lc-submit" disabled={busy||(!body.trim()&&!photos.length)}>{busy?"Guardando…":initial?"Guardar":parentId?"Responder":"Publicar"}</button></div></div>
      {error&&<p role="alert" className="lc-error">{error}</p>}
      {!parentId&&!initial&&<p className="lc-photo-hint">Hasta 4 fotos. Comparte solo imágenes que quieras mostrar al grupo.</p>}
    </div>
  </form>;
}

function CommentPhoto({photo,name,index,api,onOpen}:{photo:{path:string;url:string};name:string;index:number;api:CommentApi;onOpen:()=>void}) {
  const [url,setUrl]=useState(photo.url);const [failed,setFailed]=useState(!photo.url);const [busy,setBusy]=useState(false);
  async function retry(){setBusy(true);try{const r=await api.photo(photo.path);if(r.url){setUrl(r.url);setFailed(false);}}catch{/* El botón permite reintentar sin perder el hilo. */}finally{setBusy(false);}}
  return failed?<button type="button" className="lc-photo-retry" disabled={busy} onClick={()=>void retry()}>{busy?"Cargando…":"Recargar foto"}</button>:<button type="button" onClick={onOpen} aria-label={`Ampliar foto ${index+1} del comentario de ${name}`}><img src={url} loading="lazy" alt={`Foto ${index+1} compartida por ${name}`} onError={()=>setFailed(true)}/></button>;
}

function PhotoDialog({url,onClose}:{url:string|null;onClose:()=>void}) {
  const dialog=useRef<HTMLDialogElement>(null);
  useEffect(()=>{const d=dialog.current;if(url&&!d?.open)d?.showModal();if(!url&&d?.open)d.close();return()=>{if(d?.open)d.close();};},[url]);
  return <dialog ref={dialog} className="lc-photo-dialog" aria-label="Foto del comentario" onCancel={onClose} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>{url&&<><button type="button" aria-label="Cerrar foto" onClick={onClose}>×</button><img src={url} alt="Foto ampliada del comentario"/></>}</dialog>;
}
