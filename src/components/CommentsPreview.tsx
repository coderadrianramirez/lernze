"use client";
import {useState} from "react";
import {LessonComments,type CommentApi} from "./LessonComments";
import type {LessonComment} from "@/lib/comments";
const lessonId="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",user={id:"22222222-2222-4222-8222-222222222222",name:"Lucía Torres"};
const photoPath=`${user.id}/${lessonId}/bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb.webp`;
const fixture:LessonComment[]=[
 {id:"11111111-aaaa-4111-8111-111111111111",lessonId,parentId:null,authorId:user.id,name:user.name,avatar:null,creator:false,body:"Esta es mi primera práctica. ¿Cómo puedo mejorar la posición de la mano?",photos:[{path:photoPath,url:"/images/catalog-covers/barberia-pro.webp"}],deleted:false,createdAt:"2026-11-02T14:00:00Z",editedAt:null,replies:1},
 {id:"11111111-bbbb-4111-8111-111111111111",lessonId,parentId:"11111111-aaaa-4111-8111-111111111111",authorId:"11111111-1111-4111-8111-111111111111",name:"Ana Creadora",avatar:null,creator:true,body:"¡Buen comienzo, Lucía! Prueba con el codo un poco más bajo, como vimos en la clase. Comparte otra foto cuando lo practiques.",photos:[],deleted:false,createdAt:"2026-11-02T14:15:00Z",editedAt:null,replies:0},
];
export function CommentsPreview(){

 const [api]=useState<CommentApi>(()=>{const rows:LessonComment[]=structuredClone(fixture);return {
  load:async(_lesson,parent,cursor)=>{const filtered=rows.filter(c=>c.parentId===parent&&(!c.deleted||rows.some(r=>r.parentId===c.id&&!r.deleted))).sort((a,b)=>b.createdAt.localeCompare(a.createdAt));const start=cursor?Math.max(0,filtered.findIndex(c=>c.id===cursor.id)+1):0;return{comments:structuredClone(filtered.slice(start,start+20)),ready:true,hasMore:filtered.length>start+20};},
  save:async input=>{if(input.id){const item=rows.find(c=>c.id===input.id);if(item){item.body=input.body;item.photos=item.photos.filter(p=>input.photos.includes(p.path));item.editedAt=new Date().toISOString();}}else{rows.unshift({id:crypto.randomUUID(),lessonId,parentId:input.parentId,authorId:user.id,name:user.name,avatar:null,creator:false,body:input.body,photos:[],deleted:false,createdAt:new Date().toISOString(),editedAt:null,replies:0});}for(const row of rows)row.replies=rows.filter(c=>c.parentId===row.id&&!c.deleted).length;return{saved:true};},
  remove:async id=>{const item=rows.find(c=>c.id===id);if(item){item.deleted=true;item.body="";item.photos=[];item.authorId=null;item.name="Comentario eliminado";}for(const row of rows)row.replies=rows.filter(c=>c.parentId===row.id&&!c.deleted).length;return{saved:true};},
  upload:async()=>({error:"La subida real se habilita al activar la migración. Esta vista solo comprueba la interfaz."}),
  cleanup:async()=>{},photo:async()=>({url:"/images/catalog-covers/barberia-pro.webp"}),
 };});
 const [initial]=useState(()=>({comments:structuredClone(fixture.filter(c=>!c.parentId)),ready:true,hasMore:false}));
 return <LessonComments lessonId={lessonId} user={user} moderator={true} initial={initial} api={api}/>;
}
