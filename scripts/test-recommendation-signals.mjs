import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createTestDb, asUser } from "./test-program-publication.mjs";
const db = await createTestDb({ maxMigration: 13 });
const owner = "11111111-1111-4111-8111-111111111111",
  viewer = "22222222-2222-4222-8222-222222222222",
  other = "33333333-3333-4333-8333-333333333333";
try {
  // Supabase concede EXECUTE explícito por defecto a anon y authenticated.
  await db.exec("alter default privileges in schema public grant execute on functions to anon, authenticated");
  await db.exec(
    await readFile(
      new URL(
        "../supabase/migrations/0014_recommendation_signals.sql",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  const {
    rows: [course],
  } = await asUser(
    db,
    owner,
    "insert into public.courses(slug,title,description,creator_id,creator_name,category,price_cents) values('algoritmo','Programa del algoritmo','Descripción suficiente para comprobar las recomendaciones.', $1,'Ana','Marketing',0) returning id",
    [owner],
  );
  const record = (who, kind = "trailer") =>
    asUser(
      db,
      who,
      "select public.record_recommendation_signal($1,$2) as saved",
      [course.id, kind],
    );
  assert.equal((await record(viewer)).rows[0].saved, false);
  const video = `${owner}/${course.id}/test.mp4`;
  await db.query(
    "insert into storage.objects(bucket_id,name) values('lessons',$1)",
    [video],
  );
  await asUser(
    db,
    owner,
    "insert into public.lessons(course_id,title,video_path) values($1,$2,$3)",
    [course.id, "Clase", video],
  );
  await asUser(
    db,
    owner,
    "update public.courses set published=true where id=$1",
    [course.id],
  );
  await assert.rejects(record(null));
  await assert.rejects(asUser(db, null, "select public.restore_recommendation($1)", [course.id]));
  assert.equal((await record(owner)).rows[0].saved, false);
  assert.equal((await record(viewer, "made-up")).rows[0].saved, false);
  assert.equal((await record(viewer)).rows[0].saved, true);
  const first = (
    await asUser(db, viewer, "select * from public.recommendation_signals")
  ).rows[0];
  await record(viewer);
  const repeated = (
    await asUser(db, viewer, "select * from public.recommendation_signals")
  ).rows;
  assert.equal(repeated.length, 1);
  assert.equal(String(first.occurred_at), String(repeated[0].occurred_at));
  assert.equal(first.user_id, viewer);
  assert.deepEqual(Object.keys(first).sort(), [
    "course_id",
    "kind",
    "occurred_at",
    "user_id",
  ]);
  assert.equal(
    (await asUser(db, owner, "select * from public.recommendation_signals"))
      .rows.length,
    0,
  );
  assert.equal(
    (await asUser(db, other, "select * from public.recommendation_signals"))
      .rows.length,
    0,
  );
  await assert.rejects(
    asUser(db, null, "select * from public.recommendation_signals"),
  );
  await assert.rejects(
    asUser(
      db,
      viewer,
      "insert into public.recommendation_signals(user_id,course_id,kind) values($1,$2,$3)",
      [other, course.id, "trailer"],
    ),
  );
  await assert.rejects(
    asUser(
      db,
      viewer,
      "update public.recommendation_signals set occurred_at=now()",
    ),
  );
  await record(viewer, "dismiss");
  await asUser(db, other, "select public.restore_recommendation($1)", [
    course.id,
  ]);
  assert.equal(
    (
      await asUser(
        db,
        viewer,
        "select * from public.recommendation_signals where kind='dismiss'",
      )
    ).rows.length,
    1,
  );
  await asUser(db, viewer, "select public.restore_recommendation($1)", [
    course.id,
  ]);
  assert.equal(
    (
      await asUser(
        db,
        viewer,
        "select * from public.recommendation_signals where kind='dismiss'",
      )
    ).rows.length,
    0,
  );
  await db.query(
    "update public.recommendation_signals set occurred_at=now()-interval '181 days' where user_id=$1",
    [viewer],
  );
  await record(viewer, "search");
  assert.equal(
    (await asUser(db, viewer, "select * from public.recommendation_signals"))
      .rows.length,
    1,
  );
  await db.query("delete from public.profiles where id=$1", [viewer]);
  assert.equal(
    (await db.query("select * from public.recommendation_signals")).rows.length,
    0,
  );
  console.log(
    "Señales: solo cuenta propia, catálogo público, tipos válidos, deduplicación temporal, privacidad, restauración, retención y cascada aprobados.",
  );
} finally {
  await db.close();
}
