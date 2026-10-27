/**
 * Palabra con la que la interfaz nombra lo que vende un creador (clases + comunidad).
 * Las tablas y el código siguen llamándolo "course"; solo cambia el texto visible.
 */
export const NOUN = { one: "programa", other: "programas" } as const;

export const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Ruta pública de un programa. */
export const programPath = (slug: string) => `/programa/${slug}`;

/** "1 miembro", "2.140 miembros". */
export const memberCount = (n: number) => `${n.toLocaleString("es-US")} ${n === 1 ? "miembro" : "miembros"}`;
