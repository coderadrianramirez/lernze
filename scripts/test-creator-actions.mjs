import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import ts from 'typescript';

const id='11111111-1111-4111-8111-111111111111', viewer='22222222-2222-4222-8222-222222222222';
let user=null, ready=true, available=true, failure=null, count=0;
const writes=[], filters=[], paths=[];
const mocks={
 'next/cache':{revalidatePath:p=>paths.push(p)},
 '@/lib/auth':{getCurrentUser:async()=>user},
 '@/lib/creators':{
  creatorIdValid:s=>/^[a-f0-9-]{36}$/.test(s),creatorPath:s=>`/creador/${s}`,
  publicCreator:async()=>({ready,creator:available?{id,followers:count}:null}),
 },
 '@/lib/supabase/server':{createSessionClient:async()=>({from(table){assert.equal(table,'creator_follows');return {
  async upsert(row,options){writes.push(row);assert.equal(options.ignoreDuplicates,true);if(!failure)count=1;return {error:failure};},
  delete(){const query={eq(key,value){filters.push([key,value]);return query;},then(resolve){if(!failure)count=0;resolve({error:failure});}};return query;},
 };}})},
};
const mod={exports:{}};
vm.runInNewContext(ts.transpileModule(await readFile(new URL('../src/app/creador/[id]/actions.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{module:mod,exports:mod.exports,require:name=>{assert.ok(mocks[name],name);return mocks[name];}});
const follow=mod.exports.followCreatorAction;
assert.ok((await follow('bad',true)).error);
assert.ok((await follow(id,'true')).error);
assert.equal((await follow(id,true)).requiresSignIn,true);
user={id:viewer,demo:true};assert.equal((await follow(id,true)).requiresSignIn,true);
user={id,demo:false};assert.ok((await follow(id,true)).error);
user={id:viewer,demo:false};ready=false;assert.ok((await follow(id,true)).error);
ready=true;available=false;assert.ok((await follow(id,true)).error);
assert.equal(writes.length,0);
available=true;
assert.equal((await follow(id,true)).followers,1);
assert.equal(writes[0].follower_id,viewer);
assert.equal(writes[0].creator_id,id);
assert.equal((await follow(id,true)).followers,1);
assert.equal((await follow(id,false)).followers,0);
assert.equal(filters[0][0],'follower_id');assert.equal(filters[0][1],viewer);
assert.equal(filters[1][0],'creator_id');assert.equal(filters[1][1],id);
assert.ok(paths.includes('/siguiendo'));
failure={message:'offline'};assert.ok((await follow(id,true)).error);
console.log('Acciones de seguimiento: sesión, identidad propia, seguimiento propio, activación, perfil ausente, seguir, dejar de seguir y errores aprobados.');
