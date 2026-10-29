import * as demo from "./data-demo";
import * as db from "./data-supabase";
import { isSupabaseConfigured } from "./supabase/config";
import type { Category, Course, Enrollment, NewCourseInput, SaleOrigin } from "./types";

/**
 * Punto único de acceso a los datos. Con variables de Supabase usa la base real;
 * sin ellas, el modo demo en memoria (src/lib/data-demo.ts).
 */
export function listCourses(): Promise<Course[]> {
  return isSupabaseConfigured ? db.listCourses() : demo.listCourses();
}

export function getCourseBySlug(slug: string): Promise<Course | null> {
  return isSupabaseConfigured ? db.getCourseBySlug(slug) : demo.getCourseBySlug(slug);
}

export function createCourse(input: NewCourseInput, userId: string): Promise<Course> {
  return isSupabaseConfigured ? db.createCourse(input, userId) : demo.createCourse(input);
}

export function enroll(course: Course, origin: SaleOrigin, userId: string): Promise<Enrollment> {
  return isSupabaseConfigured ? db.enroll(course, origin, userId) : demo.enroll(course, origin);
}

export async function getUserInterests(userId: string): Promise<string[] | null> {
  return isSupabaseConfigured ? db.getUserInterests(userId) : null;
}

export async function saveUserInterests(userId: string, interests: string[]): Promise<void> {
  if (isSupabaseConfigured) await db.saveUserInterests(userId, interests);
}

/** Orden de "Para ti": primero los programas de tus intereses, luego por valoración. */
export function rankForInterests(courses: Course[], interests: Category[]): Course[] {
  const mine = new Set(interests);
  return courses
    .filter((c) => mine.has(c.category))
    .sort((a, b) => b.rating - a.rating || b.members - a.members);
}
