import type { CoverConfig } from "./types";
const PATH = /^[0-9a-f-]{36}(?:\/[0-9a-f-]{36})?\/[0-9a-f-]{36}\.webp$/i;
const bound = (v: unknown, fallback: number, min: number, max: number) =>
  typeof v === "number" && Number.isFinite(v)
    ? Math.max(min, Math.min(max, v))
    : fallback;

export function sanitizeCover(raw: unknown): CoverConfig | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const r = raw as Record<string, unknown>;
  if (r.path != null && (typeof r.path !== "string" || !PATH.test(r.path)))
    return null;
  return {
    path: typeof r.path === "string" ? r.path : null,
    title: typeof r.title === "string" ? r.title.trim().slice(0, 120) : "",
    x: bound(r.x, 50, 0, 100),
    y: bound(r.y, 50, 0, 100),
    zoom: bound(r.zoom, 1, 1, 2),
    tone: r.tone === "teal" || r.tone === "rose" ? r.tone : "amber",
  };
}

export function parseCover(
  value: FormDataEntryValue | null,
): CoverConfig | null {
  if (!value || typeof value !== "string") return null;
  if (value.length > 1200)
    throw new Error("La portada no es válida. Vuelve a seleccionarla.");
  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    throw new Error("La portada no es válida. Vuelve a seleccionarla.");
  }
  if (parsed === null) return null;
  const cover = sanitizeCover(parsed);
  if (!cover)
    throw new Error("La portada no es válida. Vuelve a seleccionarla.");
  return cover;
}
