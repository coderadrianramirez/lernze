export type Category = "Negocios" | "Idiomas" | "Oficios" | "Marketing" | "Inversión";

export const CATEGORIES: Category[] = ["Negocios", "Idiomas", "Oficios", "Marketing", "Inversión"];

export type TrailerSource = "creator" | "ai";

/** De dónde llegó la venta. Define la comisión de Lernze. */
export type SaleOrigin = "own" | "discover" | "agent";

export type PropKind = "doc" | "bubble" | "scissors" | "phone" | "house" | "bottle" | "percent" | "chip" | "case";
export type BustKind = "long" | "short" | "bun" | "curly" | "beard";

/** Datos con los que se dibuja la portada ilustrada de un programa. */
export type ArtConfig = {
  /** Líneas del título tal como se muestran (máximo 3). */
  lines: string[];
  /** Índice de la línea resaltada con el color de brillo. */
  hl: number;
  prop: PropKind;
  bust: BustKind;
  /** Colores en hexadecimal de 6 dígitos. */
  outfit: string;
  glow: string;
  a: string;
  b: string;
  glyph: string;
};

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
  /** Video del trailer. Si falta, se muestra el trailer animado con las frases de `scenes`. */
  trailerUrl: string | null;
  trailerSeconds: number;
  members: number;
  rating: number;
  art: ArtConfig;
  /** Cinco frases del trailer animado: gancho, problema, solución, testimonio y llamada. */
  scenes: string[];
  /** Programa de ejemplo, cargado para mostrar el diseño. */
  demo: boolean;
  published: boolean;
};

/** Una clase del programa. El video vive en el bucket privado "lessons". */
export type Lesson = {
  id: string;
  courseId: string;
  position: number;
  title: string;
  description: string;
  videoPath: string | null;
  durationSeconds: number;
  isPreview: boolean;
};

export type LessonInput = {
  title: string;
  description: string;
  videoPath: string | null;
  durationSeconds: number;
  isPreview: boolean;
};

export type NewCourseInput = {
  title: string;
  description: string;
  creatorName: string;
  category: Category;
  priceCents: number;
  trailerUrl: string | null;
  /** Duración del video subido, en segundos. 0 si no se conoce. */
  trailerSeconds?: number;
};

export type Enrollment = {
  courseId: string;
  origin: SaleOrigin;
  grossCents: number;
  commissionCents: number;
  createdAt: string;
};
