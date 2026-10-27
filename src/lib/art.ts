import type { ArtConfig, BustKind, Category, PropKind } from "./types";

const PROPS: PropKind[] = ["doc", "bubble", "scissors", "phone", "house", "bottle", "percent", "chip", "case"];
const BUSTS: BustKind[] = ["long", "short", "bun", "curly", "beard"];
const HEX = /^#[0-9a-fA-F]{6}$/;

const hex = (v: unknown, fallback: string) => (typeof v === "string" && HEX.test(v) ? v : fallback);

function esc(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);
}

/** Acepta lo que venga de la base de datos y devuelve una configuración segura. */
export function sanitizeArt(raw: unknown, fallback: ArtConfig): ArtConfig {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const lines = Array.isArray(r.lines)
    ? r.lines.filter((l): l is string => typeof l === "string" && l.trim() !== "").slice(0, 3).map((l) => l.slice(0, 24))
    : [];
  const hl = typeof r.hl === "number" && r.hl >= 0 && r.hl < (lines.length || fallback.lines.length) ? Math.floor(r.hl) : fallback.hl;
  return {
    lines: lines.length ? lines : fallback.lines,
    hl,
    prop: PROPS.includes(r.prop as PropKind) ? (r.prop as PropKind) : fallback.prop,
    bust: BUSTS.includes(r.bust as BustKind) ? (r.bust as BustKind) : fallback.bust,
    outfit: hex(r.outfit, fallback.outfit),
    glow: hex(r.glow, fallback.glow),
    a: hex(r.a, fallback.a),
    b: hex(r.b, fallback.b),
    glyph: typeof r.glyph === "string" && r.glyph.trim() ? r.glyph.trim().slice(0, 2) : fallback.glyph,
  };
}

const THEMES: { a: string; b: string; glow: string; outfit: string }[] = [
  { a: "#12304a", b: "#5a2340", glow: "#ffb547", outfit: "#2b3f66" },
  { a: "#0f3d3e", b: "#1b2a5a", glow: "#7fd6c8", outfit: "#1f4d52" },
  { a: "#3b1450", b: "#0f3a50", glow: "#ff6ea8", outfit: "#3a2a63" },
  { a: "#173a2d", b: "#0d2a45", glow: "#6fd38b", outfit: "#1f4a3a" },
  { a: "#4a1b3c", b: "#2b1b5a", glow: "#ff9ad5", outfit: "#5a2a55" },
  { a: "#3a1c1c", b: "#1c1c3a", glow: "#ff8a5c", outfit: "#4a2424" },
];

const PROP_BY_CATEGORY: Record<Category, PropKind> = {
  Negocios: "doc",
  Idiomas: "bubble",
  Oficios: "scissors",
  Marketing: "phone",
  Inversión: "percent",
};

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

/** Parte un título en hasta 3 líneas de longitud parecida. */
export function splitTitle(title: string): string[] {
  const words = title.trim().split(/\s+/).filter(Boolean);
  if (words.length <= 1) return [title.trim().slice(0, 24) || "Programa"];
  const target = Math.max(8, Math.ceil(title.length / Math.min(3, Math.ceil(title.length / 12))));
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    if (cur && (cur + " " + w).length > target && lines.length < 2) {
      lines.push(cur);
      cur = w;
    } else cur = cur ? cur + " " + w : w;
  }
  if (cur) lines.push(cur);
  return lines.slice(0, 3).map((l) => l.slice(0, 24));
}

/** Portada por defecto para programas que no traen una configuración propia. */
export function defaultArt(title: string, category: Category, seed: string): ArtConfig {
  const h = hash(seed + title);
  const t = THEMES[h % THEMES.length];
  const lines = splitTitle(title);
  const initials = title.trim().split(/\s+/).slice(0, 2).map((w) => w.charAt(0).toUpperCase()).join("");
  return {
    lines,
    hl: Math.min(lines.length - 1, lines.length > 1 ? 1 : 0),
    prop: PROP_BY_CATEGORY[category],
    bust: BUSTS[(h >> 3) % BUSTS.length],
    outfit: t.outfit,
    glow: t.glow,
    a: t.a,
    b: t.b,
    glyph: initials || "L",
  };
}

/** Frases del trailer animado para programas que no traen las suyas. */
export function defaultScenes(title: string, description: string, creator: string, priceText: string): string[] {
  const first = description.split(/(?<=[.!?])\s/)[0]?.trim();
  const hook = first && first.length <= 90 ? first : `Aprende ${title.toLowerCase()}.`;
  return [hook, "Clases claras y una comunidad que te acompaña.", `Con ${creator}.`, "Sesiones en vivo, ranking y soporte.", `${title}. Entra hoy por ${priceText}.`];
}

/* ---------- ilustración SVG ---------- */

function hairMarkup(style: BustKind) {
  const H = "#120f18";
  const cap = `<path fill="${H}" d="M-114 392 C-122 258 -60 214 6 214 C76 214 126 266 114 392 C82 322 -60 312 -114 392 Z"/>`;
  switch (style) {
    case "long":
      return {
        back: `<path fill="${H}" d="M-135 420 C-150 250 -80 190 0 190 C80 190 150 250 135 420 L152 650 C100 668 62 604 62 560 L-62 560 C-62 604 -100 668 -152 650 Z"/>`,
        front: `<path fill="${H}" d="M-112 385 C-102 272 -42 232 18 236 C70 240 107 292 112 385 C62 332 -40 322 -112 385 Z"/>`,
      };
    case "bun":
      return { back: `<circle fill="${H}" cx="8" cy="188" r="52"/>`, front: cap };
    case "curly":
      return {
        back: `<g fill="${H}"><circle cx="-92" cy="305" r="56"/><circle cx="-52" cy="236" r="60"/><circle cx="10" cy="212" r="64"/><circle cx="72" cy="236" r="58"/><circle cx="108" cy="305" r="54"/><circle cx="-112" cy="392" r="42"/><circle cx="114" cy="392" r="42"/></g>`,
        front: "",
      };
    case "beard":
      return {
        back: "",
        front: `${cap}<path fill="${H}" d="M-100 468 C-96 566 -44 600 0 600 C44 600 96 566 100 468 C64 522 -64 522 -100 468 Z"/>`,
      };
    default:
      return { back: "", front: cap };
  }
}

function propMarkup(kind: PropKind, g: string) {
  const s = `stroke="${g}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" fill="${g}" fill-opacity=".12"`;
  const m: Record<PropKind, string> = {
    doc: '<rect x="-62" y="-84" width="124" height="168" rx="12"/><path fill="none" d="M-36 -42 H36 M-36 -10 H36 M-36 22 H6"/><circle cx="36" cy="52" r="22"/>',
    bubble:
      '<path d="M-96 -56 h130 a22 22 0 0 1 22 22 v52 a22 22 0 0 1 -22 22 h-74 l-34 30 v-30 h-22 a22 22 0 0 1 -22 -22 v-52 a22 22 0 0 1 22 -22z"/><path d="M40 20 h46 a18 18 0 0 1 18 18 v34 a18 18 0 0 1 -18 18 h-12 v22 l-26 -22 h-8 a18 18 0 0 1 -18 -18 v-34 a18 18 0 0 1 18 -18z"/>',
    scissors: '<circle cx="-46" cy="58" r="28"/><circle cx="46" cy="58" r="28"/><path fill="none" d="M-32 36 L52 -88 M32 36 L-52 -88"/>',
    phone: '<rect x="-48" y="-90" width="96" height="180" rx="20"/><path d="M-14 -22 L24 0 L-14 22z"/>',
    house: '<path d="M-86 10 L0 -76 L86 10 V84 H-86z"/><path fill="none" d="M-22 84 V32 H22 V84"/>',
    bottle: '<rect x="-32" y="-12" width="64" height="96" rx="16"/><rect x="-15" y="-66" width="30" height="54" rx="7"/>',
    percent: '<circle cx="0" cy="0" r="86"/><circle cx="-34" cy="-34" r="20" fill="none"/><circle cx="34" cy="34" r="20" fill="none"/><path fill="none" d="M46 -58 L-46 58"/>',
    chip: `<rect x="-56" y="-56" width="112" height="112" rx="18"/><path fill="none" d="M-28 -56 V-82 M28 -56 V-82 M-28 56 V82 M28 56 V82 M-56 -28 H-82 M-56 28 H-82 M56 -28 H82 M56 28 H82"/><text x="0" y="20" text-anchor="middle" font-size="58" font-weight="800" fill="${g}" stroke="none" style="font-family:var(--font-bricolage),sans-serif">IA</text>`,
    case: '<rect x="-76" y="-28" width="152" height="108" rx="16"/><path fill="none" d="M-30 -28 V-56 H30 V-28 M-76 14 H76"/>',
  };
  return `<g ${s}>${m[kind] ?? m.doc}</g>`;
}

/**
 * Ilustración de la portada: fondo con luz, símbolo grande, objeto del tema y la silueta del creador.
 * `h` es 16:9 (billboard y tarjetas horizontales) y `v` recorta al centro para el póster 2:3.
 * Todos los valores se validan antes de entrar al SVG. `idPrefix` debe ser estable entre servidor y
 * navegador (por ejemplo el id del programa), porque da nombre a los degradados.
 */
export function artSvg(input: ArtConfig, mode: "h" | "v", idPrefix: string): string {
  const c = sanitizeArt(input, input);
  const u = idPrefix.replace(/[^a-zA-Z0-9]/g, "") + mode;
  const g = c.glow;
  const vb = mode === "v" ? "690 0 620 900" : "0 0 1600 900";
  const h = hairMarkup(c.bust);
  const body = "M-330 900 C-330 760 -250 690 -120 660 L-60 640 L60 640 L120 660 C250 690 330 760 330 900 Z";
  const neck = "M-55 560 L55 560 L65 650 C30 690 -30 690 -65 650 Z";
  const head = '<ellipse cx="0" cy="430" rx="105" ry="135"/>';
  const pts = ([[300, 140, 5], [520, 80, 3], [1180, 120, 4], [1420, 300, 6], [1330, 640, 3], [240, 520, 4], [760, 60, 3]] as const)
    .map((q) => `<circle cx="${q[0]}" cy="${q[1]}" r="${q[2]}" fill="${g}" opacity=".35"/>`)
    .join("");
  return (
    `<svg viewBox="${vb}" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false"><defs>` +
    `<linearGradient id="bg${u}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c.a}"/><stop offset="1" stop-color="${c.b}"/></linearGradient>` +
    `<radialGradient id="gl${u}" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="${g}" stop-opacity=".55"/><stop offset="1" stop-color="${g}" stop-opacity="0"/></radialGradient>` +
    `<linearGradient id="bm${u}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".16"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>` +
    `<linearGradient id="bd${u}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a2230"/><stop offset="1" stop-color="#150f19"/></linearGradient>` +
    `<linearGradient id="ot${u}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c.outfit}"/><stop offset="1" stop-color="#0e0c14"/></linearGradient>` +
    `<linearGradient id="rm${u}" x1="0" y1="0" x2="1" y2="0"><stop offset=".35" stop-color="${g}" stop-opacity="0"/><stop offset="1" stop-color="${g}"/></linearGradient>` +
    `<radialGradient id="vg${u}" cx=".5" cy=".5" r=".75"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".6"/></radialGradient>` +
    `</defs><rect width="1600" height="900" fill="url(#bg${u})"/>` +
    `<g class="l-back"><text x="900" y="760" text-anchor="middle" font-size="780" font-weight="800" fill="#fff" opacity=".07" style="font-family:var(--font-bricolage),sans-serif">${esc(c.glyph)}</text>` +
    `<polygon points="1240,0 1400,0 940,900 700,900" fill="url(#bm${u})" opacity=".55"/><polygon points="1000,0 1080,0 760,900 640,900" fill="url(#bm${u})" opacity=".4"/>${pts}</g>` +
    `<circle cx="1000" cy="440" r="440" fill="url(#gl${u})"/>` +
    `<g transform="translate(800 330)"><g class="l-mid">${propMarkup(c.prop, g)}</g></g>` +
    `<g transform="translate(1000 0)"><g class="l-front">${h.back}` +
    `<path d="${body}" fill="url(#ot${u})"/><path d="M-62 642 L0 724 L62 642" fill="none" stroke="rgba(255,255,255,.14)" stroke-width="5"/>` +
    `<path d="${neck}" fill="url(#bd${u})"/><g fill="url(#bd${u})">${head}</g>${h.front}` +
    `<g fill="none" stroke="url(#rm${u})" stroke-width="5"><path d="${body}"/><path d="${neck}"/>${head}</g>` +
    `</g></g><rect width="1600" height="900" fill="url(#vg${u})"/></svg>`
  );
}
