import assert from 'node:assert/strict';
import { createTestDb, asUser } from './test-program-publication.mjs';

const db=await createTestDb({maxMigration:12});
// Producción conserva programas de ejemplo sin una cuenta creadora.
await db.exec("insert into public.courses(slug,title,creator_name,category,price_cents,published,demo) values ('ejemplo-sin-cuenta','Ejemplo','Creador ficticio','Negocios',0,false,true)");
await db.exec("alter table public.courses disable trigger user; update public.courses set published=true where slug='ejemplo-sin-cuenta'; alter table public.courses enable trigger user;");
await db.exec(await (await import('node:fs/promises')).readFile(new URL('../supabase/migrations/0013_creator_profiles_and_follows.sql',import.meta.url),'utf8'));
const creator='11111111-1111-4111-8111-111111111111', follower='22222222-2222-4222-8222-222222222222', other='33333333-3333-4333-8333-333333333333';
try {
 assert.equal((await asUser(db,null,'select * from public.list_public_creators()')).rows.length,0);
 const {rows:[course]}=await asUser(db,creator,`insert into public.courses(slug,title,description,creator_id,creator_name,category,price_cents) values ('perfil-test','Programa de perfiles','Descripción suficiente para publicar y probar el perfil.', $1,'Ana Creadora','Negocios',0) returning id`,[creator]);
 assert.equal((await asUser(db,null,'select * from public.list_public_creators()')).rows.length,0);
 const video=`${creator}/${course.id}/video.mp4`;
 await db.query(`insert into storage.objects(bucket_id,name) values ('lessons',$1)`,[video]);
 await asUser(db,creator,`insert into public.lessons(course_id,title,video_path) values ($1,'Clase de perfiles',$2)`,[course.id,video]);
 await asUser(db,creator,'update public.courses set published=true where id=$1',[course.id]);
 const directory=(await asUser(db,null,'select * from public.list_public_creators()')).rows;
 assert.equal(directory.length,1);
 assert.deepEqual(Object.keys(directory[0]).sort(),['avatar_path','display_name','follower_count','id','program_count']);
 assert.equal(directory[0].display_name,'Ana Creadora');
 assert.equal(Number(directory[0].program_count),1);
 assert.equal((await asUser(db,null,'select * from public.profiles')).rows.length,0);
 await assert.rejects(asUser(db,follower,'insert into public.creator_accounts(profile_id) values ($1)',[follower]));
 const follow=(who,as=who,target=creator)=>asUser(db,who,'insert into public.creator_follows(follower_id,creator_id) values ($1,$2) on conflict do nothing',[as,target]);
 await follow(follower);await follow(follower);
 assert.equal((await asUser(db,follower,'select * from public.creator_follows')).rows.length,1);
 assert.equal((await asUser(db,creator,'select * from public.creator_follows')).rows.length,0);
 assert.equal((await asUser(db,other,'select * from public.creator_follows')).rows.length,0);
 await assert.rejects(follow(other,follower));
 await assert.rejects(follow(creator));
 await assert.rejects(follow(follower,follower,other));
 await assert.rejects(asUser(db,null,'insert into public.creator_follows(follower_id,creator_id) values ($1,$2)',[other,creator]));
 assert.equal(Number((await asUser(db,null,'select follower_count from public.list_public_creators()')).rows[0].follower_count),1);
 await asUser(db,other,'delete from public.creator_follows where follower_id=$1',[follower]);
 assert.equal((await asUser(db,follower,'select * from public.creator_follows')).rows.length,1);
 await asUser(db,creator,'update public.profiles set display_name=$1 where id=$2',['Ána Maestra',creator]);
 assert.equal((await asUser(db,null,'select * from public.list_public_creators($1)', ['ana maestra'])).rows.length,1);
 assert.equal((await asUser(db,null,'select * from public.list_public_creators($1)', ['%'])).rows.length,0);
 await asUser(db,creator,'update public.courses set published=false where id=$1',[course.id]);
 assert.equal(Number((await asUser(db,null,'select program_count from public.list_public_creators()')).rows[0].program_count),0);
 assert.equal((await asUser(db,follower,'select * from public.creator_follows')).rows.length,1);
 await asUser(db,follower,'delete from public.creator_follows where follower_id=$1',[follower]);
 assert.equal(Number((await asUser(db,null,'select follower_count from public.list_public_creators()')).rows[0].follower_count),0);
 await follow(follower);
 await db.query('delete from public.profiles where id=$1',[follower]);
 assert.equal((await db.query('select * from public.creator_follows')).rows.length,0);
 console.log('Perfiles y seguimiento: publicación, privacidad, búsqueda, conteos, idempotencia, auto-seguimiento, aislamiento, retirada y cascada aprobados.');
} finally {await db.close();}
