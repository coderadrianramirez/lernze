import { CATALOG_MEDIA } from "./catalog-media";
import type { Course } from "./types";

export function hasDemoCoins(course: Pick<Course, "id" | "demo">) {
  return course.demo || CATALOG_MEDIA.some(item => item.id === course.id);
}

// Precios ilustrativos del prototipo, sin equivalencia monetaria acordada.
export function demoCoinPrice(course: Pick<Course, "priceCents">) {
  return Math.max(50, Math.round(course.priceCents / 10));
}

export const DEMO_COIN_PACKS = [100, 300, 700] as const;
