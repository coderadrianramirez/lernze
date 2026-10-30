import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
import ts from "typescript";
const source = await readFile(
  new URL("../src/lib/catalog-media.ts", import.meta.url),
  "utf8",
);
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;
const testModule = { exports: {} };
vm.runInNewContext(compiled, {
  module: testModule,
  exports: testModule.exports,
  Map,
});
const { CATALOG_MEDIA, catalogCover, catalogTrailer } = testModule.exports;
assert.equal(CATALOG_MEDIA.length, 17);
assert.equal(new Set(CATALOG_MEDIA.map((m) => m.id)).size, 17);
let total = 0;
for (const media of CATALOG_MEDIA) {
  const course = { id: media.id, art: {}, trailerUrl: media.sourceTrailerUrl };
  assert.equal(catalogCover(course).image, media.image);
  assert.equal(catalogTrailer(course).video, media.video);
  assert.equal(
    catalogTrailer({ ...course, trailerUrl: "https://creador.test/nuevo.mp4" }),
    undefined,
    "Un nuevo trailer tiene prioridad",
  );
  assert.equal(
    catalogCover({
      ...course,
      art: { cover: { path: null, title: "Mi ilustración" } },
    }),
    undefined,
    "Elegir ilustración desactiva la fotografía de prueba",
  );
  assert.equal(
    catalogTrailer({ ...course, art: { cover: { path: "propia.webp" } } }),
    undefined,
    "Una portada propia conserva el trailer elegido",
  );
  assert.equal(
    catalogCover({ ...course, id: "otro-id", slug: media.slug }),
    undefined,
    "Reutilizar un título o slug no asigna fotos a otra cuenta",
  );
  const image = await readFile(
    new URL("../public" + media.image, import.meta.url),
  );
  assert.equal(image.toString("ascii", 0, 4), "RIFF");
  assert.equal(image.toString("ascii", 8, 12), "WEBP");
  const video = await readFile(
    new URL("../public" + media.video, import.meta.url),
  );
  assert.equal(video.toString("ascii", 4, 8), "ftyp");
  assert.ok(
    video.indexOf(Buffer.from("moov")) < video.indexOf(Buffer.from("mdat")),
    "El índice MP4 está al principio para reproducción progresiva",
  );
  assert.ok(video.length < 2 * 1024 * 1024);
  assert.equal(media.seconds, 14);
  assert.equal(media.captions.length, 4);
  total += image.length + video.length;
}
console.log(
  "17 portadas y 17 MP4 válidos; prioridad de contenido propio, ilustración explícita y aislamiento de otros programas aprobados. Total " +
    Math.round((total / 1024 / 1024) * 10) / 10 +
    " MB.",
);
