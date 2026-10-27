// Graba los trailers animados de los programas de ejemplo, cuadro por cuadro, con Chrome sin ventana.
// Uso: node scripts/render-trailers.mjs <urlBase> <carpetaSalida> [slug ...]
// Requiere un servidor de producción levantado con ENABLE_RENDER=1 (ver scripts/make-demo-videos.sh).
import { spawn } from "node:child_process";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { DEMO_PROGRAMS } from "../src/lib/demo-programs.ts";

const [base, outDir, ...only] = process.argv.slice(2);
if (!base || !outDir) throw new Error("uso: render-trailers.mjs <urlBase> <carpetaSalida> [slug ...]");
const FPS = 24;
const SECONDS = 14.1; // 0,7 s de título + 13,4 s de frases
const PORT = 9333;
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const chrome = spawn(
  CHROME,
  [
    "--headless=new",
    `--remote-debugging-port=${PORT}`,
    "--window-size=1280,720",
    "--hide-scrollbars",
    "--no-first-run",
    "--no-default-browser-check",
    "--user-data-dir=/tmp/lz-chrome-profile",
    "about:blank",
  ],
  { stdio: "ignore" },
);
const quit = () => chrome.kill();
process.on("exit", quit);

async function waitFor(fn, ms = 20000) {
  const end = Date.now() + ms;
  for (;;) {
    try {
      const v = await fn();
      if (v) return v;
    } catch {
      // se reintenta
    }
    if (Date.now() > end) throw new Error("tiempo agotado");
    await new Promise((r) => setTimeout(r, 150));
  }
}

const target = await waitFor(async () => {
  const list = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json();
  return list.find((t) => t.type === "page");
});
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((res, rej) => {
  ws.onopen = res;
  ws.onerror = rej;
});
let id = 0;
const pending = new Map();
ws.onmessage = (m) => {
  const msg = JSON.parse(m.data);
  if (msg.id && pending.has(msg.id)) {
    const { res, rej } = pending.get(msg.id);
    pending.delete(msg.id);
    if (msg.error) rej(new Error(JSON.stringify(msg.error)));
    else res(msg.result);
  }
};
const send = (method, params = {}) =>
  new Promise((res, rej) => {
    const i = ++id;
    pending.set(i, { res, rej });
    ws.send(JSON.stringify({ id: i, method, params }));
  });
const evalJs = (expression) =>
  send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true }).then((r) => r.result?.value);

await send("Page.enable");
await send("Emulation.setDeviceMetricsOverride", { width: 1280, height: 720, deviceScaleFactor: 1, mobile: false });

const programs = DEMO_PROGRAMS.filter((p) => !only.length || only.includes(p.slug));
const frames = Math.ceil(SECONDS * FPS);
for (const p of programs) {
  const dir = `${outDir}/${p.slug}`;
  await rm(dir, { recursive: true, force: true });
  await mkdir(dir, { recursive: true });
  await send("Page.navigate", { url: `${base}/render/${p.slug}` });
  await waitFor(() => evalJs("window.__lzReady === true"));
  await evalJs("document.fonts.ready.then(() => true)");
  await new Promise((r) => setTimeout(r, 500));
  for (let f = 0; f < frames; f++) {
    await evalJs(`window.__lzSetTime(${(f / FPS).toFixed(4)})`);
    await evalJs("new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r(true))))");
    const shot = await send("Page.captureScreenshot", { format: "jpeg", quality: 90 });
    await writeFile(`${dir}/frame_${String(f + 1).padStart(4, "0")}.jpg`, Buffer.from(shot.data, "base64"));
  }
  console.log(`${p.slug}: ${frames} cuadros`);
}
ws.close();
quit();
