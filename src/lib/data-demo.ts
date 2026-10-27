import { defaultArt, defaultScenes } from "./art";
import { DEMO_PROGRAMS } from "./demo-programs";
import { commissionCents, formatPrice } from "./pricing";
import { slugify } from "./slug";
import type { Course, Enrollment, NewCourseInput, SaleOrigin } from "./types";

/**
 * Modo demo: datos en memoria con programas de ejemplo, sin cuentas.
 * Se usa cuando no hay variables de Supabase (ver src/lib/data.ts).
 */
type Store = { courses: Course[]; enrollments: Enrollment[] };

const g = globalThis as unknown as { __lernze?: Store };
const store: Store = (g.__lernze ??= { courses: [...DEMO_PROGRAMS], enrollments: [] });

export async function listCourses(): Promise<Course[]> {
  return store.courses;
}

export async function getCourseBySlug(slug: string): Promise<Course | null> {
  return store.courses.find((c) => c.slug === slug) ?? null;
}

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
    trailerSeconds: 0,
    members: 0,
    rating: 0,
    art: defaultArt(input.title, input.category, slug),
    scenes: defaultScenes(input.title, input.description, input.creatorName, formatPrice(input.priceCents)),
    demo: false,
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

