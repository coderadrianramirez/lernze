import { commissionCents } from "./pricing";
import { createPublicReadClient, createSessionClient } from "./supabase/server";
import { slugify } from "./slug";
import type { Category, Course, Enrollment, NewCourseInput, SaleOrigin } from "./types";

type CourseRow = {
  id: string;
  slug: string;
  title: string;
  description: string;
  creator_name: string;
  category: Category;
  price_cents: number;
  currency: string;
  trailer_source: "creator" | "ai";
  trailer_url: string | null;
  trailer_seconds: number;
  palette: string[];
  glyph: string;
  rating: number | null;
  members_count: number;
};

function toCourse(row: CourseRow): Course {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    creatorName: row.creator_name,
    category: row.category,
    priceCents: row.price_cents,
    currency: row.currency,
    trailerSource: row.trailer_source,
    trailerUrl: row.trailer_url,
    trailerSeconds: row.trailer_seconds,
    members: row.members_count,
    rating: row.rating ?? 0,
    palette: [row.palette[0] ?? "#12304a", row.palette[1] ?? "#5a2340"],
    glyph: row.glyph,
  };
}

export async function listCourses(): Promise<Course[]> {
  const supabase = createPublicReadClient();
  const { data, error } = await supabase
    .from("courses")
    .select("*")
    .eq("published", true)
    .order("created_at", { ascending: false });
  if (error) throw new Error(`No se pudieron leer los cursos: ${error.message}`);
  return (data as CourseRow[]).map(toCourse);
}

export async function getCourseBySlug(slug: string): Promise<Course | null> {
  const supabase = createPublicReadClient();
  const { data, error } = await supabase.from("courses").select("*").eq("slug", slug).eq("published", true).maybeSingle();
  if (error) throw new Error(`No se pudo leer el curso: ${error.message}`);
  return data ? toCourse(data as CourseRow) : null;
}

const PALETTES = [
  ["#12304a", "#5a2340"],
  ["#0f3d3e", "#1b2a5a"],
  ["#3b1450", "#0f3a50"],
  ["#173a2d", "#0d2a45"],
  ["#4a1b3c", "#2b1b5a"],
  ["#1b4a46", "#3a1b4a"],
];

export async function createCourse(input: NewCourseInput, userId: string): Promise<Course> {
  const supabase = await createSessionClient();
  const base = slugify(input.title) || "curso";

  for (let attempt = 0; attempt < 4; attempt++) {
    const slug = attempt === 0 ? base : `${base}-${Math.random().toString(36).slice(2, 6)}`;
    const { data, error } = await supabase
      .from("courses")
      .insert({
        slug,
        title: input.title,
        description: input.description,
        creator_id: userId,
        creator_name: input.creatorName,
        category: input.category,
        price_cents: input.priceCents,
        trailer_source: input.trailerUrl ? "creator" : "ai",
        trailer_url: input.trailerUrl,
        trailer_seconds: input.trailerUrl ? 0 : 90,
        palette: PALETTES[Math.floor(Math.random() * PALETTES.length)],
        glyph: input.title.trim().charAt(0).toUpperCase() || "$",
      })
      .select("*")
      .single();
    if (!error) return toCourse(data as CourseRow);
    if (error.code !== "23505") throw new Error(`No se pudo crear el curso: ${error.message}`);
  }
  throw new Error("No se pudo crear un enlace único para el curso. Cambia el título e inténtalo otra vez.");
}

export async function enroll(course: Course, origin: SaleOrigin, userId: string): Promise<Enrollment> {
  const supabase = await createSessionClient();
  const row = {
    course_id: course.id,
    user_id: userId,
    origin,
    gross_cents: course.priceCents,
    commission_cents: commissionCents(course.priceCents, origin),
  };
  const { data, error } = await supabase.from("enrollments").insert(row).select("created_at").single();
  // 23505: ya estaba inscrito. No es un error para quien compra.
  if (error && error.code !== "23505") throw new Error(`No se pudo registrar la inscripción: ${error.message}`);
  return {
    courseId: course.id,
    origin,
    grossCents: row.gross_cents,
    commissionCents: row.commission_cents,
    createdAt: data?.created_at ?? new Date().toISOString(),
  };
}
