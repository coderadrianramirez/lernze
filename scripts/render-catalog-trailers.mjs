import { readFile, mkdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import vm from "node:vm";
import ts from "typescript";

// FFMPEG points to a local executable. No network, credentials or database writes.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const binary = process.env.FFMPEG || "ffmpeg";
const source = await readFile(
  path.join(root, "src/lib/catalog-media.ts"),
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
const entries = testModule.exports.CATALOG_MEDIA;
await mkdir(path.join(root, "public/videos/catalog-trailers"), {
  recursive: true,
});
async function render(entry) {
  const output = path.join(root, "public", entry.video),
    frames = entry.seconds * 30;
  // Oversample before zoompan: integer crop coordinates otherwise produce visible jitter.
  // The first frame matches the cover; the cosine loop has no jump at either end.
  const filter = `scale=7680:4320:flags=lanczos,zoompan=z='1+0.035*(1-cos(2*PI*on/${frames - 1}))/2':x='(iw-iw/zoom)*0.68':y='(ih-ih/zoom)*0.32':d=${frames}:s=1280x720:fps=30,format=yuv420p`;
  const args = [
    "-y",
    "-hide_banner",
    "-loglevel",
    "error",
    "-i",
    path.join(root, "public", entry.image),
    "-vf",
    filter,
    "-frames:v",
    String(frames),
    "-an",
    "-c:v",
    "libx264",
    "-preset",
    "fast",
    "-crf",
    "24",
    "-threads",
    "2",
    "-movflags",
    "+faststart",
    output,
  ];
  await new Promise((resolve, reject) => {
    const child = spawn(binary, args, { windowsHide: true });
    let errors = "";
    child.stderr.on("data", (b) => (errors += b));
    child.on("error", reject);
    child.on("close", (code) =>
      code === 0 ? resolve() : reject(Error(entry.slug + ": " + errors)),
    );
  });
  console.log(
    entry.slug + ": " + Math.round((await stat(output)).size / 1024) + " KB",
  );
}
let cursor = 0;
await Promise.all(
  Array.from({ length: 2 }, async () => {
    while (cursor < entries.length) await render(entries[cursor++]);
  }),
);
console.log(
  `${entries.length} trailers MP4 H.264 de 14 segundos, 1280 × 720, 30 fps, sin audio ni textos superpuestos.`,
);
