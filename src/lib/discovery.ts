type Snapshot = { ids?: unknown; active?: unknown; time?: unknown; at?: unknown };

/** Un retorno nunca recupera programas que dejaron de ser elegibles para esta cuenta. */
export function restoreDiscovery(ids: string[], value: unknown, now: number) {
  const fallback = { ids, index: 0, time: 0 };
  if (!value || typeof value !== "object") return fallback;
  const s = value as Snapshot;
  if (typeof s.at !== "number" || s.at > now || now - s.at > 2 * 60 * 60 * 1000 || !Array.isArray(s.ids)) return fallback;
  const available = new Set(ids), seen = new Set<string>();
  const ordered = [...s.ids, ...ids].filter((id): id is string => {
    if (typeof id !== "string" || !available.has(id) || seen.has(id)) return false;
    seen.add(id); return true;
  });
  const index = ordered.indexOf(typeof s.active === "string" ? s.active : "");
  return { ids: ordered, index: Math.max(0, index), time: index >= 0 && typeof s.time === "number" && Number.isFinite(s.time) ? Math.max(0, Math.min(s.time, 3600)) : 0 };
}

/** Solo tiempo de video realmente avanzado: saltar, volver al inicio o estar oculto no suma. */
export function watchedSeconds(previous: number, current: number, eligible: boolean) {
  const delta = current - previous;
  return eligible && Number.isFinite(delta) && delta > 0 && delta <= 1.5 ? delta : 0;
}
