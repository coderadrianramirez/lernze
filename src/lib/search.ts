import type { Course } from "./types";

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");

/** Busca en título, creador, categoría y descripción, sin importar mayúsculas ni acentos. */
export function searchCourses(courses: Course[], query: string): Course[] {
  const words = norm(query).split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  return courses
    .map((c) => {
      const title = norm(c.title);
      const hay = `${title} ${norm(c.creatorName)} ${norm(c.category)} ${norm(c.description)}`;
      if (!words.every((w) => hay.includes(w))) return null;
      const score = words.filter((w) => title.includes(w)).length * 10 + c.rating;
      return { c, score };
    })
    .filter((x): x is { c: Course; score: number } => x !== null)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.c);
}
