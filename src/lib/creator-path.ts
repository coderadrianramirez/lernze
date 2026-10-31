import { slugify } from "./slug";
import type { Course } from "./types";

export const creatorPath = (id: string) => `/creador/${encodeURIComponent(id)}`;
/** Los ejemplos conservan una identidad visual, sin inventar una cuenta real. */
export function courseCreatorId(course: Course) {
  return course.creatorId || `demo-${slugify(course.creatorName)}`;
}
