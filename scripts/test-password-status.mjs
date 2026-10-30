import assert from "node:assert/strict";
import { createTestDb, asUser } from "./test-program-publication.mjs";
const db = await createTestDb();
const owner = "11111111-1111-4111-8111-111111111111",
  other = "22222222-2222-4222-8222-222222222222";
try {
  await db.query("update auth.users set encrypted_password=$1 where id=$2", [
    "fixture-hash",
    owner,
  ]);
  assert.equal(
    (await asUser(db, owner, "select public.account_has_password() as value"))
      .rows[0].value,
    true,
  );
  assert.equal(
    (await asUser(db, other, "select public.account_has_password() as value"))
      .rows[0].value,
    false,
  );
  await assert.rejects(
    () => asUser(db, null, "select public.account_has_password()"),
    /permission denied/,
  );
  await assert.rejects(
    () => asUser(db, other, "select public.account_has_password($1)", [owner]),
    /does not exist/,
  );
  console.log(
    "Estado de contraseña: consulta propia, cuenta externa, anónimo y consulta ajena aprobadas.",
  );
} finally {
  await db.close();
}
