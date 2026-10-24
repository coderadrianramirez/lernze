export type Category = "Negocios" | "Idiomas" | "Oficios" | "Marketing" | "Inversión";

export const CATEGORIES: Category[] = ["Negocios", "Idiomas", "Oficios", "Marketing", "Inversión"];

export type TrailerSource = "creator" | "ai";

/** De dónde llegó la venta. Define la comisión de Lernze. */
export type SaleOrigin = "own" | "discover" | "agent";

export type Course = {
  id: string;
  slug: string;
  title: string;
  description: string;
  creatorName: string;
  category: Category;
  priceCents: number;
  currency: string;
  trailerSource: TrailerSource;
  trailerUrl: string | null;
  trailerSeconds: number;
  members: number;
  rating: number;
  /** Dos colores hex para el póster generado. */
  palette: [string, string];
  glyph: string;
};

export type NewCourseInput = {
  title: string;
  description: string;
  creatorName: string;
  category: Category;
  priceCents: number;
  trailerUrl: string | null;
};

export type Enrollment = {
  courseId: string;
  origin: SaleOrigin;
  grossCents: number;
  commissionCents: number;
  createdAt: string;
};
