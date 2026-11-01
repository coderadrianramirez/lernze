import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
import ts from "typescript";
let user = null,
  error = null;
const writes = [],
  paths = [];
const own = "11111111-1111-4111-8111-111111111111",
  viewer = "22222222-2222-4222-8222-222222222222";
const courses = [0, 1, 2, 3, 4].map((n) => ({
  id: `a0000000-0000-4000-8000-00000000000${n}`,
  creatorId: n === 4 ? viewer : own,
  category: ["Idiomas", "Idiomas", "Marketing", "Oficios", "Inversión"][n],
}));
const mocks = {
  "next/cache": { revalidatePath: (p) => paths.push(p) },
  "@/lib/auth": { getCurrentUser: async () => user },
  "@/lib/data": { listCourses: async () => courses },
  "@/lib/search": {
    searchCourses: (all, q) => (q === "sin coincidencias" ? [] : all),
  },
  "@/lib/supabase/server": {
    createSessionClient: async () => ({
      rpc: async (name, args) => {
        writes.push({ name, args });
        return { data: true, error };
      },
    }),
  },
};
const mod = { exports: {} };
vm.runInNewContext(
  ts.transpileModule(
    await readFile(
      new URL("../src/app/actions/recommendations.ts", import.meta.url),
      "utf8",
    ),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    },
  ).outputText,
  {
    module: mod,
    exports: mod.exports,
    require: (name) => {
      assert.ok(mocks[name], name);
      return mocks[name];
    },
    FormData,
  },
);
const {
  interestSignalAction: signal,
  searchInterestAction: search,
  restoreInterestAction: restore,
} = mod.exports;
assert.equal((await signal(courses[0].id, "trailer")).saved, false);
await search("marketing");
assert.equal(writes.length, 0);
user = { id: viewer, demo: false };
assert.equal((await signal("bad", "trailer")).saved, false);
assert.equal((await signal(courses[0].id, "hack")).saved, false);
assert.equal(writes.length, 0);
assert.equal((await signal(courses[0].id, "trailer")).saved, true);
assert.equal(writes[0].args.signal_kind, "trailer");
assert.equal(
  Object.keys(writes[0].args).sort().join(","),
  "signal_kind,target_course",
);
writes.length = 0;
await search("ab");
await search("a".repeat(81));
await search("sin coincidencias");
assert.equal(writes.length, 0);
await search("tema de búsqueda privada");
assert.equal(writes.length, 3);
assert.ok(writes.every((w) => w.args.signal_kind === "search"));
assert.equal(
  new Set(
    writes.map(
      (w) => courses.find((c) => c.id === w.args.target_course).category,
    ),
  ).size,
  3,
);
assert.ok(!JSON.stringify(writes).includes("privada"));
assert.ok(!writes.some((w) => w.args.target_course === courses[4].id));
error = { message: "missing migration" };
assert.equal((await signal(courses[0].id, "dismiss")).saved, false);
error = null;
assert.equal((await signal(courses[0].id, "dismiss")).saved, true);
assert.ok(paths.includes("/"));
const form = new FormData();
form.set("courseId", courses[0].id);
await restore(form);
assert.equal(writes.at(-1).name, "restore_recommendation");
console.log(
  "Acciones de interés: sesión, validación, ausencia de búsquedas en la base, límites por tema, propiedad, errores y restauración aprobados.",
);
