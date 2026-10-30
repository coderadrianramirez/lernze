import { PGlite } from "@electric-sql/pglite";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";

// PostgreSQL local y efímero. Nunca lee .env ni se conecta a Supabase.
export async function createTestDb({ legacyPolicyNames = false } = {}) {
  const db = new PGlite();
  await db.exec(`
    create role anon nologin;
    create role authenticated nologin;
    create schema auth;
    create table auth.users (id uuid primary key, email text, raw_user_meta_data jsonb);
    create function auth.uid() returns uuid language sql stable as $$
      select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
    $$;
    create schema storage;
    create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
    create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text references storage.buckets(id), name text, unique(bucket_id, name));
    alter table storage.objects enable row level security;
    create function storage.foldername(name text) returns text[] language sql immutable as $$
      select (string_to_array(name, '/'))[1:array_length(string_to_array(name, '/'), 1)-1];
    $$;
  `);
  const migrations = new URL("../supabase/migrations/", import.meta.url);
  for (const name of (await readdir(migrations))
    .filter((s) => s.endsWith(".sql"))
    .sort()) {
    if (legacyPolicyNames && name.startsWith("0008_")) {
      await db.exec('alter policy "cursos publicados son públicos" on public.courses rename to "cursos publicados son publicos"');
    }
    await db.exec(await readFile(new URL(name, migrations), "utf8"));
  }
  await db.exec(`
    grant usage on schema public, auth, storage to anon, authenticated;
    grant select, insert, update, delete on all tables in schema public, storage to anon, authenticated;
    insert into auth.users values
      ('11111111-1111-4111-8111-111111111111', 'creador@lernze.test', '{"display_name":"Ana Creadora"}'),
      ('22222222-2222-4222-8222-222222222222', 'alumno@lernze.test', '{"display_name":"Luis Alumno"}'),
      ('33333333-3333-4333-8333-333333333333', 'otro@lernze.test', '{"display_name":"Otra Persona"}');
  `);
  return db;
}

export async function asUser(db, userId, sql, params = []) {
  return db.transaction(async (tx) => {
    await tx.exec(`set local role ${userId ? "authenticated" : "anon"}`);
    await tx.query("select set_config('request.jwt.claim.sub', $1, true)", [
      userId ?? "",
    ]);
    return tx.query(sql, params);
  });
}

async function run(legacyPolicyNames = false) {
  const db = await createTestDb({ legacyPolicyNames });
  const owner = "11111111-1111-4111-8111-111111111111",
    student = "22222222-2222-4222-8222-222222222222",
    other = "33333333-3333-4333-8333-333333333333";
  let checks = 0;
  const check = (value, message) => {
    assert.ok(value, message);
    checks++;
    console.log("✓ " + message);
  };
  const rejects = async (fn, pattern, message) => {
    await assert.rejects(fn, pattern);
    checks++;
    console.log("✓ " + message);
  };
  try {
    const {
      rows: [course],
    } = await asUser(
      db,
      owner,
      `insert into public.courses (slug,title,description,creator_id,creator_name,category,price_cents)
      values ('mi-programa','Mi programa','Aprende a crear tu primer negocio con clases prácticas.', $1,'Ana','Negocios',4900) returning *`,
      [owner],
    );
    const id = course.id,
      video = `${owner}/${id}/clase.mp4`;
    check(course.published === false, "Un programa nuevo nace como borrador");
    check(
      (await asUser(db, null, "select * from public.courses")).rows.length ===
        0,
      "Un visitante no ve borradores",
    );
    check(
      (await asUser(db, other, "select * from public.courses")).rows.length ===
        0,
      "Otra cuenta no ve borradores",
    );
    check(
      (await asUser(db, owner, "select * from public.courses")).rows.length ===
        1,
      "El creador ve su borrador",
    );
    check(
      (
        await asUser(
          db,
          other,
          "update public.courses set title=$1 where id=$2 returning id",
          ["Ataque", id],
        )
      ).rows.length === 0,
      "Otra cuenta no puede editar el programa",
    );
    await rejects(
      () =>
        asUser(
          db,
          owner,
          "update public.courses set published=true where id=$1",
          [id],
        ),
      /Agrega al menos/,
      "Se impide publicar sin clases",
    );
    const {
      rows: [lesson],
    } = await asUser(
      db,
      owner,
      "insert into public.lessons (course_id,title,is_preview) values ($1,$2,true) returning *",
      [id, "Mi primera clase"],
    );
    await rejects(
      () =>
        asUser(
          db,
          owner,
          "update public.courses set published=true where id=$1",
          [id],
        ),
      /Todas las clases/,
      "Se impide publicar una clase sin video",
    );
    await asUser(
      db,
      owner,
      "update public.lessons set video_path=$1 where id=$2",
      [video, lesson.id],
    );
    await rejects(
      () =>
        asUser(
          db,
          owner,
          "update public.courses set published=true where id=$1",
          [id],
        ),
      /Todas las clases/,
      "Una ruta inventada no cuenta como video subido",
    );
    await asUser(
      db,
      owner,
      "insert into storage.objects (bucket_id,name) values ('lessons',$1)",
      [video],
    );
    await asUser(
      db,
      owner,
      "update public.courses set published=true where id=$1",
      [id],
    );
    check(
      (await asUser(db, null, "select * from public.courses")).rows.length ===
        1,
      "El programa publicado aparece en el catálogo",
    );
    check(
      (
        await asUser(
          db,
          null,
          "select * from storage.objects where bucket_id='lessons'",
        )
      ).rows.length === 1,
      "La vista previa publicada es pública",
    );
    await asUser(
      db,
      owner,
      "update public.lessons set is_preview=false where id=$1",
      [lesson.id],
    );
    check(
      (
        await asUser(
          db,
          null,
          "select * from storage.objects where bucket_id='lessons'",
        )
      ).rows.length === 0,
      "Los videos privados no son públicos",
    );
    await rejects(
      () =>
        asUser(db, owner, "delete from public.lessons where id=$1", [
          lesson.id,
        ]),
      /última/,
      "Se protege la última clase de un programa publicado",
    );
    await rejects(
      () =>
        asUser(
          db,
          owner,
          "insert into public.lessons (course_id,title) values ($1,$2)",
          [id, "Clase sin video"],
        ),
      /Sube un video/,
      "Un programa publicado no recibe clases incompletas",
    );
    await rejects(
      () =>
        asUser(
          db,
          owner,
          "update public.courses set description='' where id=$1",
          [id],
        ),
      /descripción/,
      "Se protege la descripción de un programa publicado",
    );
    check(
      (
        await asUser(
          db,
          owner,
          "delete from storage.objects where name=$1 returning id",
          [video],
        )
      ).rows.length === 0,
      "No se borra un video que usa un programa publicado",
    );
    await asUser(
      db,
      student,
      "insert into public.enrollments (course_id,user_id,gross_cents,commission_cents) values ($1,$2,4900,0)",
      [id, student],
    );
    await asUser(
      db,
      student,
      "insert into public.lesson_progress (user_id,lesson_id) values ($1,$2) on conflict (user_id,lesson_id) do update set completed_at=now()",
      [student, lesson.id],
    );
    await asUser(
      db,
      student,
      "insert into public.lesson_progress (user_id,lesson_id) values ($1,$2) on conflict (user_id,lesson_id) do update set completed_at=now()",
      [student, lesson.id],
    );
    check(true, "El alumno puede guardar el progreso de forma repetida");
    await asUser(
      db,
      owner,
      "update public.courses set published=false where id=$1",
      [id],
    );
    check(
      (await asUser(db, null, "select * from public.courses")).rows.length ===
        0,
      "Retirar elimina el programa del catálogo",
    );
    check(
      (await asUser(db, student, "select * from public.courses")).rows
        .length === 1,
      "El alumno conserva el programa retirado",
    );
    check(
      (await asUser(db, student, "select * from public.lessons")).rows
        .length === 1,
      "El alumno conserva las clases",
    );
    check(
      (
        await asUser(
          db,
          student,
          "select * from storage.objects where bucket_id='lessons'",
        )
      ).rows.length === 1,
      "El alumno conserva acceso al video privado",
    );
    await asUser(
      db,
      owner,
      "update public.lessons set is_preview=true where id=$1",
      [lesson.id],
    );
    check(
      (
        await asUser(
          db,
          null,
          "select * from storage.objects where bucket_id='lessons'",
        )
      ).rows.length === 0,
      "La vista previa de un programa retirado deja de ser pública",
    );
    check(
      (await asUser(db, other, "select * from public.courses")).rows.length ===
        0,
      "Una persona no inscrita no ve el programa retirado",
    );
    await rejects(
      () =>
        asUser(
          db,
          other,
          "insert into public.enrollments (course_id,user_id,gross_cents,commission_cents) values ($1,$2,4900,0)",
          [id, other],
        ),
      /row-level security/,
      "Se impiden nuevas inscripciones al programa retirado",
    );
    await rejects(
      () =>
        asUser(
          db,
          other,
          "insert into public.lesson_progress (user_id,lesson_id) values ($1,$2)",
          [other, lesson.id],
        ),
      /row-level security/,
      "Una persona sin acceso no puede falsificar progreso",
    );
    await asUser(
      db,
      owner,
      "update public.courses set title=$1,price_cents=7900 where id=$2",
      ["Mi programa mejorado", id],
    );
    check(
      (
        await asUser(db, owner, "select slug from public.courses where id=$1", [
          id,
        ])
      ).rows[0].slug === "mi-programa",
      "Editar título y precio conserva el enlace",
    );
    await asUser(
      db,
      owner,
      "update public.courses set published=true where id=$1",
      [id],
    );
    check(
      (await asUser(db, null, "select * from public.courses")).rows.length ===
        1,
      "Se puede volver a publicar",
    );
    console.log(
      `\n${checks} comprobaciones de publicación y permisos aprobadas.`,
    );
  } finally {
    await db.close();
  }
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  console.log("Políticas del repositorio:");
  await run();
  console.log("Políticas históricas de producción (nombre sin tilde):");
  await run(true);
}
