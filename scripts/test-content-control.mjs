import assert from "node:assert/strict";
import { createTestDb, asUser } from "./test-program-publication.mjs";

// Integración con PostgreSQL real en memoria: no carga .env ni usa producción.
const db = await createTestDb();
const owner = "11111111-1111-4111-8111-111111111111",
  student = "22222222-2222-4222-8222-222222222222",
  other = "33333333-3333-4333-8333-333333333333";
let checks = 0;
const check = (value, message) => {
  assert.ok(value, message);
  checks++;
  console.log("✓ " + message);
};
const reject = async (fn, pattern, message) => {
  await assert.rejects(fn, pattern);
  checks++;
  console.log("✓ " + message);
};
try {
  const course = (
    await asUser(
      db,
      owner,
      `insert into public.courses (slug,title,description,creator_id,creator_name,category,price_cents) values ('control-total','Control total','Aprende con un programa de clases prácticas.',$1,'Ana','Oficios',4900) returning *`,
      [owner],
    )
  ).rows[0];
  const id = course.id,
    coverPath = `${owner}/${crypto.randomUUID()}.webp`,
    classCover = `${owner}/${id}/${crypto.randomUUID()}.webp`,
    foreign = `${other}/${crypto.randomUUID()}.webp`,
    photo = `${owner}/${crypto.randomUUID()}.webp`;
  for (const name of [coverPath, classCover])
    await asUser(
      db,
      owner,
      "insert into storage.objects(bucket_id,name)values('covers',$1)",
      [name],
    );
  await asUser(
    db,
    other,
    "insert into storage.objects(bucket_id,name)values('covers',$1)",
    [foreign],
  );
  const config = (path) => ({
    path,
    title: "Portada propia",
    x: 25,
    y: 70,
    zoom: 1.3,
    tone: "amber",
  });
  await asUser(
    db,
    owner,
    "update public.courses set art=jsonb_build_object('cover',$1::jsonb) where id=$2",
    [JSON.stringify(config(coverPath)), id],
  );
  check(
    (
      await asUser(db, owner, "select art from public.courses where id=$1", [
        id,
      ])
    ).rows[0].art.cover.path === coverPath,
    "El creador guarda su portada y encuadre",
  );
  await reject(
    () =>
      asUser(
        db,
        owner,
        "update public.courses set art=jsonb_build_object('cover',$1::jsonb) where id=$2",
        [JSON.stringify(config(foreign)), id],
      ),
    /pertenecer/,
    "No se puede usar la portada de otra cuenta",
  );
  await reject(
    () =>
      asUser(
        db,
        owner,
        "update public.courses set art=jsonb_build_object('cover',$1::jsonb) where id=$2",
        [JSON.stringify(config(`${owner}/${crypto.randomUUID()}.webp`)), id],
      ),
    /pertenecer/,
    "Se rechazan imágenes inexistentes",
  );
  await reject(
    () =>
      asUser(
        db,
        owner,
        "update public.courses set art=jsonb_build_object('cover',$1::jsonb) where id=$2",
        [JSON.stringify({ ...config(coverPath), zoom: 100 }), id],
      ),
    /encuadre/,
    "La base valida el encuadre incluso fuera del formulario",
  );
  check(
    !(
      await asUser(
        db,
        owner,
        "delete from storage.objects where bucket_id='covers' and name=$1 returning id",
        [coverPath],
      )
    ).rows.length,
    "Una portada guardada no se borra por descarte de otra pestaña",
  );
  await asUser(db, owner, "update public.courses set art='{}' where id=$1", [
    id,
  ]);
  check(
    (
      await asUser(
        db,
        owner,
        "delete from storage.objects where bucket_id='covers' and name=$1 returning id",
        [coverPath],
      )
    ).rows.length === 1,
    "La imagen anterior puede eliminarse al quitarla del programa",
  );
  await reject(
    () =>
      asUser(
        db,
        owner,
        "insert into public.lessons(course_id,title,cover) values($1,'Clase equivocada',$2)",
        [id, JSON.stringify(config(foreign))],
      ),
    /pertenecer/,
    "Las portadas de clases también exigen propiedad",
  );
  const lesson = (
    await asUser(
      db,
      owner,
      "insert into public.lessons(course_id,title,cover)values($1,'Clase ilustrada',$2) returning *",
      [id, JSON.stringify(config(classCover))],
    )
  ).rows[0];
  check(
    lesson.cover.path === classCover,
    "Cada clase conserva su propia portada",
  );
  const video = `${owner}/${id}/${crypto.randomUUID()}.mp4`;
  await asUser(
    db,
    owner,
    "insert into storage.objects(bucket_id,name)values('lessons',$1)",
    [video],
  );
  await asUser(
    db,
    owner,
    "update public.lessons set video_path=$1 where id=$2",
    [video, lesson.id],
  );
  await asUser(
    db,
    owner,
    "update public.courses set published=true where id=$1",
    [id],
  );
  await asUser(
    db,
    student,
    "insert into public.enrollments(course_id,user_id,gross_cents,commission_cents)values($1,$2,4900,0)",
    [id, student],
  );
  await asUser(
    db,
    student,
    "insert into public.lesson_progress(user_id,lesson_id)values($1,$2)",
    [student, lesson.id],
  );
  await reject(
    () =>
      asUser(
        db,
        owner,
        "update public.lessons set video_path=null where id=$1",
        [lesson.id],
      ),
    /video/,
    "Un programa publicado no pierde el video por una petición directa",
  );
  check(
    !(
      await asUser(
        db,
        other,
        "delete from public.courses where id=$1 returning id",
        [id],
      )
    ).rows.length,
    "Otra cuenta no puede eliminar el programa",
  );
  check(
    !(
      await asUser(
        db,
        null,
        "delete from public.courses where id=$1 returning id",
        [id],
      )
    ).rows.length,
    "Un visitante no puede eliminar el programa",
  );
  await asUser(
    db,
    owner,
    "update public.courses set published=false where id=$1",
    [id],
  );
  await asUser(
    db,
    owner,
    "update public.lessons set video_path=null where id=$1",
    [lesson.id],
  );
  check(
    (
      await asUser(
        db,
        owner,
        "select video_path from public.lessons where id=$1",
        [lesson.id],
      )
    ).rows[0].video_path === null,
    "Tras retirar el programa se puede quitar el video guardado",
  );
  await asUser(
    db,
    owner,
    "update public.lessons set video_path=$1 where id=$2",
    [video, lesson.id],
  );
  await asUser(
    db,
    owner,
    "update public.courses set published=true where id=$1",
    [id],
  );
  await asUser(
    db,
    owner,
    "insert into storage.objects(bucket_id,name)values('avatars',$1)",
    [photo],
  );
  await asUser(db, owner, "select public.save_creator_profile($1,$2)", [
    "Ana Fotografía",
    photo,
  ]);
  check(
    (
      await asUser(
        db,
        owner,
        "select display_name,avatar_path from public.profiles where id=$1",
        [owner],
      )
    ).rows[0].avatar_path === photo,
    "Se guarda una foto propia en el perfil",
  );
  check(
    (
      await asUser(
        db,
        owner,
        "select creator_name,slug from public.courses where id=$1",
        [id],
      )
    ).rows[0].creator_name === "Ana Fotografía",
    "El nombre público se actualiza en programas publicados y en la búsqueda",
  );
  check(
    (
      await asUser(db, owner, "select slug from public.courses where id=$1", [
        id,
      ])
    ).rows[0].slug === "control-total",
    "El cambio de nombre conserva los enlaces de programas",
  );
  await reject(
    () =>
      asUser(db, other, "select public.save_creator_profile($1,$2)", [
        "Intruso",
        photo,
      ]),
    /pertenecer/,
    "Otra cuenta no puede usar la foto del creador",
  );
  check(
    (
      await asUser(
        db,
        other,
        "select display_name from public.profiles where id=$1",
        [other],
      )
    ).rows[0].display_name === "Otra Persona",
    "La actualización de perfil falla de forma atómica",
  );
  check(
    !(
      await asUser(
        db,
        owner,
        "delete from storage.objects where bucket_id='avatars' and name=$1 returning id",
        [photo],
      )
    ).rows.length,
    "La foto en uso está protegida frente a limpieza accidental",
  );
  await asUser(db, owner, "select public.save_creator_profile($1,null)", [
    "Ana Fotografía",
  ]);
  check(
    (
      await asUser(
        db,
        owner,
        "delete from storage.objects where bucket_id='avatars' and name=$1 returning id",
        [photo],
      )
    ).rows.length === 1,
    "Quitar la foto libera el archivo y permite volver a las iniciales",
  );
  check(
    (
      await asUser(
        db,
        owner,
        "delete from public.courses where id=$1 returning id",
        [id],
      )
    ).rows.length === 1,
    "El creador puede eliminar incluso un programa publicado con alumnos",
  );
  for (const [table, col] of [
    ["lessons", "course_id"],
    ["enrollments", "course_id"],
    ["lesson_progress", "lesson_id"],
  ])
    check(
      (
        await db.query(`select * from public.${table} where ${col}=$1`, [
          table === "lesson_progress" ? lesson.id : id,
        ])
      ).rows.length === 0,
      `La eliminación limpia ${table}`,
    );
  check(
    (
      await asUser(
        db,
        owner,
        "delete from storage.objects where bucket_id='covers' and name=$1 returning id",
        [classCover],
      )
    ).rows.length === 1,
    "Tras eliminar el programa se puede limpiar la portada de la clase",
  );
  check(
    (
      await asUser(
        db,
        owner,
        "delete from storage.objects where bucket_id='lessons' and name=$1 returning id",
        [video],
      )
    ).rows.length === 1,
    "Tras eliminar el programa se puede limpiar el video privado",
  );
  console.log(
    `\n${checks} comprobaciones de contenido y configuración aprobadas.`,
  );
} finally {
  await db.close();
}

// El código debe poder desplegarse antes de que el dueño active las migraciones.
const previous = await createTestDb({ maxMigration: 8 });
try {
  const columns = (
    await previous.query(
      "select table_name,column_name from information_schema.columns where table_schema='public' and column_name in ('cover','avatar_path')",
    )
  ).rows;
  assert.equal(columns.length, 0);
  const rpc = (
    await previous.query(
      "select proname from pg_proc where proname in ('content_tools_ready','account_settings_ready')",
    )
  ).rows;
  assert.equal(rpc.length, 0);
  await asUser(previous, owner, "select * from public.profiles where id=$1", [
    owner,
  ]);
  await asUser(previous, owner, "select * from public.lessons");
  console.log(
    "✓ Lecturas compatibles con producción anterior a 0009/0010; las funciones de activación aún no existen.",
  );
} finally {
  await previous.close();
}
