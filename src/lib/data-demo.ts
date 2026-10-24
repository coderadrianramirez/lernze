import { commissionCents } from "./pricing";
import { slugify } from "./slug";
import { SEED_COURSES } from "./seed";
import type { Course, Enrollment, NewCourseInput, SaleOrigin } from "./types";

/**
 * Modo demo: datos en memoria con programas de ejemplo, sin cuentas.
 * Se usa cuando no hay variables de Supabase (ver src/lib/data.ts).
 */
type Store = { courses: Course[]; enrollments: Enrollment[] };

const g = globalThis as unknown as { __lernze?: Store };
const store: Store = (g.__lernze ??= { courses: [...SEED_COURSES], enrollments: [] });

export async function listCourses(): Promise<Course[]> {
  return store.courses;
}

export async function getCourseBySlug(slug: string): Promise<Course | null> {
  return store.courses.find((c) => c.slug === slug) ?? null;
}

const PALETTES: [string, string][] = [
  ["#12304a", "#5a2340"],
  ["#0f3d3e", "#1b2a5a"],
  ["#3b1450", "#0f3a50"],
  ["#173a2d", "#0d2a45"],
  ["#4a1b3c", "#2b1b5a"],
  ["#1b4a46", "#3a1b4a"],
];

export async function createCourse(input: NewCourseInput): Promise<Course> {
  const base = slugify(input.title) || "programa";
  let slug = base;
  for (let n = 2; store.courses.some((c) => c.slug === slug); n++) slug = `${base}-${n}`;

  const course: Course = {
    id: crypto.randomUUID(),
    slug,
    title: input.title,
    description: input.description,
    creatorName: input.creatorName,
    category: input.category,
    priceCents: input.priceCents,
    currency: "USD",
    // Sin trailer propio, Lernze lo genera con IA (pendiente de construir).
    trailerSource: input.trailerUrl ? "creator" : "ai",
    trailerUrl: input.trailerUrl,
    trailerSeconds: input.trailerUrl ? 0 : 90,
    members: 0,
    rating: 0,
    palette: PALETTES[store.courses.length % PALETTES.length],
    glyph: input.title.trim().charAt(0).toUpperCase() || "$",
  };
  store.courses.unshift(course);
  return course;
}

export async function enroll(course: Course, origin: SaleOrigin): Promise<Enrollment> {
  const e: Enrollment = {
    courseId: course.id,
    origin,
    grossCents: course.priceCents,
    commissionCents: commissionCents(course.priceCents, origin),
    createdAt: new Date().toISOString(),
  };
  store.enrollments.push(e);
  course.members += 1;
  return e;
}

export async function listEnrollments(): Promise<Enrollment[]> {
  return store.enrollments;
}

