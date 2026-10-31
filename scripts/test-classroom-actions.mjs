import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';
import vm from 'node:vm';

// Acciones reales, límite de Supabase simulado: sin credenciales ni escrituras reales.
let user = null, enrolled = false, owner = false, published = true, preview = false, videoAvailable = true, writeError = null;
const writes=[], links=[];
const course={id:'program',published:true};
const lesson={id:'lesson',videoPath:'owner/program/video.mp4',durationSeconds:60,isPreview:false};
const mocks={
 'next/cache':{revalidatePath(){}},
 '@/lib/auth':{getCurrentUser:async()=>user},
 '@/lib/program-management':{getAccessibleProgram:async()=>({...course,published})},
 '@/lib/lessons':{
  getOwnCourseId:async()=>owner?course.id:null,
  isEnrolled:async()=>enrolled,
  listLessons:async()=>[{...lesson,isPreview:preview}],
  setLessonDone:async()=>{},
  lessonVideoUrl:async(path)=>{links.push(path);return videoAvailable?'https://example.test/temporal.mp4':null;},
 },
 '@/lib/supabase/server':{createSessionClient:async()=>({from(table){assert.equal(table,'lesson_playback');return{upsert:async(row)=>{writes.push(row);return{error:writeError};}};}})},
};
const mod={exports:{}};
vm.runInNewContext(ts.transpileModule(await readFile(new URL('../src/app/aprender/[slug]/actions.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{module:mod,exports:mod.exports,require:(name)=>{assert.ok(mocks[name],name);return mocks[name];}});
const {renewLessonVideoAction:renew,savePlaybackAction:save}=mod.exports;
assert.ok((await renew('program','lesson')).error);
assert.equal(links.length,0);
preview=true;
assert.ok((await renew('program','lesson')).src);
published=false;
assert.ok((await renew('program','lesson')).error);
assert.ok((await save('program','lesson',20)).error);
user={id:'student',demo:false};
preview=false;published=true;
assert.ok((await renew('program','lesson')).error);
assert.ok((await save('program','lesson',20)).error);
assert.equal(writes.length,0);
enrolled=true;
assert.ok((await renew('program','lesson')).src);
assert.equal((await save('program','lesson',20.9)).error,undefined);
assert.equal(writes.at(-1).position_seconds,20);
assert.equal(writes.at(-1).user_id,'student');
assert.equal(writes.at(-1).video_path,lesson.videoPath);
assert.ok((await save('program','lesson',NaN)).error);
assert.ok((await save('program','lesson',-1)).error);
assert.ok((await save('program','lesson',Infinity)).error);
assert.ok((await save('program','other-lesson',20)).error);
assert.ok((await renew('program','other-lesson')).error);
await save('program','lesson',100);
assert.equal(writes.at(-1).position_seconds,60);
videoAvailable=false;
assert.ok((await renew('program','lesson')).error);
writeError={message:'network'};
assert.ok((await save('program','lesson',20)).error);
owner=true;enrolled=false;videoAvailable=true;published=false;
assert.ok((await renew('program','lesson')).src);
console.log('Acciones del aula: vista previa, acceso privado, creador, revocación, límites, ruta de vídeo y recuperación de errores aprobados.');
