import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
import ts from "typescript";
const cats = ["Negocios", "Idiomas", "Oficios", "Marketing", "Inversión"];
const contentMod = { exports: {} };
vm.runInNewContext(
  ts.transpileModule(
    await readFile(
      new URL("../src/lib/content-affinity.ts", import.meta.url),
      "utf8",
    ),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    },
  ).outputText,
  { module: contentMod, exports: contentMod.exports },
);
const mod = { exports: {} };
vm.runInNewContext(
  ts.transpileModule(
    await readFile(
      new URL("../src/lib/recommendations.ts", import.meta.url),
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
      if (name === "./content-affinity") return contentMod.exports;
      assert.equal(name, "./types");
      return { CATEGORIES: cats };
    },
  },
);
const recommend = mod.exports.recommendPrograms,
  now = Date.UTC(2026, 9, 31),
  at = (days = 0) => new Date(now - days * 86400000).toISOString();
const courses = Array.from({ length: 25 }, (_, i) => ({
  id: `p${i}`,
  creatorId: `creator${i % 10}`,
  creatorName: `Creador ${i % 10}`,
  category: cats[Math.floor(i / 5)],
  title: `Programa ${i}`,
  published: true,
  members: 10,
}));
const input = { chosen: [], signals: [], following: [], enrolled: [], now };
const rank = (overrides = {}, catalogue = courses) =>
  recommend(catalogue, { ...input, ...overrides });
assert.equal(rank().ranked.length, 25);
assert.equal(rank().hasPersonalization, false);
const relatedCatalogue = [
  {
    ...courses[0],
    id: "seed",
    category: "Marketing",
    title: "Google Ads para pequeñas empresas",
    description: "Campañas publicitarias rentables.",
  },
  {
    ...courses[1],
    id: "related",
    category: "Marketing",
    title: "Optimiza campañas de Google Ads",
    description: "Anuncios y campañas publicitarias.",
  },
  {
    ...courses[2],
    id: "unrelated",
    category: "Marketing",
    title: "Fotografía para Instagram",
    description: "Cámara, iluminación y retratos.",
  },
];
const specific = rank(
  { signals: [{ courseId: "seed", kind: "trailer", at: at() }] },
  relatedCatalogue,
);
assert.ok(
  specific.ranked.findIndex((r) => r.course.id === "related") <
    specific.ranked.findIndex((r) => r.course.id === "unrelated"),
);
const newer = { ...courses[0], id: "new", members: 0, createdAt: at() };
const older = { ...courses[0], id: "old", members: 100000, createdAt: at(100) };
assert.equal(rank({}, [older, newer]).ranked[0].course.id, "new");
assert.equal(
  rank({ chosen: ["Marketing"] }).ranked[0].course.category,
  "Marketing",
);
const activity = {
  chosen: ["Marketing"],
  signals: [{ courseId: "p5", kind: "trailer", at: at() }],
};
assert.ok(
  rank(activity).interests.some(
    (t) => t.category === "Idiomas" && t.sources.includes("Trailers que viste"),
  ),
);
const once = rank(activity),
  repeated = rank({
    ...activity,
    signals: Array(100).fill(activity.signals[0]),
  });
assert.equal(JSON.stringify(once), JSON.stringify(repeated));
const signal = (days) =>
  rank({ signals: [{ courseId: "p5", kind: "trailer", at: at(days) }] })
    .interests[0]?.score ?? 0;
assert.ok(signal(0) > signal(21));
assert.ok(signal(21) > signal(60));
assert.equal(signal(91), 0);
assert.equal(
  rank({
    signals: [
      { courseId: "p5", kind: "trailer", at: "invalid" },
      { courseId: "p5", kind: "trailer", at: at(-3) },
    ],
  }).interests.length,
  0,
);
const excluded = rank(
  {
    userId: "creator0",
    enrolled: ["p1"],
    signals: [{ courseId: "p2", kind: "dismiss", at: at() }],
  },
  [...courses, { ...courses[0], id: "draft", published: false }, courses[2]],
);
assert.ok(
  excluded.ranked.every(
    (r) =>
      r.course.creatorId !== "creator0" &&
      r.course.id !== "p1" &&
      r.course.id !== "p2" &&
      r.course.id !== "draft",
  ),
);
assert.equal(
  new Set(excluded.ranked.map((r) => r.course.id)).size,
  excluded.ranked.length,
);
assert.ok(
  rank({
    signals: [{ courseId: "p2", kind: "dismiss", at: at(181) }],
  }).ranked.some((r) => r.course.id === "p2"),
);
const following = rank({ following: ["creator6"] });
assert.equal(following.ranked[0].course.creatorId, "creator6");
assert.equal(following.ranked[0].reason, "De un creador que sigues");
const discovery = rank({ chosen: ["Marketing"] });
assert.equal(discovery.ranked[3].exploration, true);
assert.equal(discovery.ranked[7].exploration, true);
assert.notEqual(discovery.ranked[3].course.category, "Marketing");
assert.equal(rank({}, []).ranked.length, 0);
assert.equal(
  rank(
    {},
    Array.from({ length: 1000 }, (_, i) => ({
      ...courses[i % 25],
      id: `large-${i}`,
    })),
  ).ranked.length,
  60,
);
assert.equal(rank({ enrolled: courses.map((c) => c.id) }).ranked.length, 0);
const counts = new Map();
for (const { course } of discovery.ranked.slice(0, 8))
  counts.set(course.creatorId, (counts.get(course.creatorId) ?? 0) + 1);
assert.ok([...counts.values()].every((n) => n <= 2));
assert.equal(JSON.stringify(rank(activity)), JSON.stringify(rank(activity)));
console.log(
  "Recomendaciones: inicio sin señales, intereses combinados, recencia, repetición, exclusiones, privacidad del catálogo, seguimiento, diversidad y exploración aprobados.",
);
