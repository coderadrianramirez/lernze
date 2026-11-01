import type { Course } from "./types";

const stop = new Set(
  "para como desde sobre entre hasta este esta estos estas una uno unos unas los las del por con sin que tus sus mas muy todo todos paso cero aprende aprender programa programas curso cursos crear primer primera negocio negocios contenido practica practicas experiencia incluye aprenderas ser hacer son tiene tambien donde cualquier forma cada puedes mejor tus tu su en de el la al un lo es se y o a".split(
    " ",
  ),
);
function terms(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .split(/[^a-z0-9]+/)
    .filter((t) => (t.length >= 3 || t === "ia") && !stop.has(t));
}

/** Afinidad léxica del catálogo público; títulos pesan más, términos comunes menos. */
export function contentAffinity(courses: Course[]) {
  const words = new Map<string, Map<string, number>>(),
    frequency = new Map<string, number>();
  for (const c of courses) {
    const vector = new Map<string, number>();
    for (const [text, weight] of [
      [c.title, 3],
      [c.description, 1],
    ] as const) {
      for (const term of terms(text ?? ""))
        vector.set(term, Math.min(6, (vector.get(term) ?? 0) + weight));
    }
    words.set(c.id, vector);
    for (const term of vector.keys())
      frequency.set(term, (frequency.get(term) ?? 0) + 1);
  }
  const norms = new Map<string, number>();
  for (const [id, vector] of words) {
    let sum = 0;
    for (const [term, value] of vector) {
      const weighted =
        value *
        (1 + Math.log((courses.length + 1) / ((frequency.get(term) ?? 0) + 1)));
      vector.set(term, weighted);
      sum += weighted * weighted;
    }
    norms.set(id, Math.sqrt(sum));
  }
  return (a: string, b: string) => {
    const x = words.get(a),
      y = words.get(b),
      denom = (norms.get(a) ?? 0) * (norms.get(b) ?? 0);
    if (!x || !y || !denom) return 0;
    let dot = 0;
    for (const [term, value] of x) dot += value * (y.get(term) ?? 0);
    return Math.min(1, dot / denom);
  };
}
