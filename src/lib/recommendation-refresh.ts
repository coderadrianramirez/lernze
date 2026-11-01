"use client";

/** Solo una marca de actualización; no contiene búsquedas, intereses ni identidad. */
const key = "lernze:recommendations-dirty";
export function markRecommendationsDirty() {
  try {
    sessionStorage.setItem(key, "1");
  } catch {
    /* El bloqueo de almacenamiento no impide explorar. */
  }
}
export function consumeRecommendationUpdate() {
  try {
    const dirty = sessionStorage.getItem(key) === "1";
    sessionStorage.removeItem(key);
    return dirty;
  } catch {
    return false;
  }
}
