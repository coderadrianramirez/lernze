import {
  CATEGORIES,
  type Course,
  type Lesson,
  type NewCourseInput,
} from "./types";

export type ProgramErrors = Partial<
  Record<
    | "title"
    | "description"
    | "price"
    | "category"
    | "trailerUrl"
    | "creatorName",
    string
  >
>;
export type ProgramFormState = {
  errors: ProgramErrors;
  error?: string;
  saved?: boolean;
};

export function readProgram(formData: FormData): {
  input: NewCourseInput;
  errors: ProgramErrors;
} {
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const creatorName = String(formData.get("creatorName") ?? "").trim();
  const category = String(formData.get("category") ?? "");
  const rawPrice = String(formData.get("price") ?? "")
    .trim()
    .replace(",", ".");
  const price = Number(rawPrice);
  const trailerUrl = String(formData.get("trailerUrl") ?? "").trim() || null;
  const trailerSeconds = Math.max(
    0,
    Math.min(180, Math.round(Number(formData.get("trailerSeconds")) || 0)),
  );
  const errors: ProgramErrors = {};
  if (title.length < 4 || title.length > 120)
    errors.title = "Escribe un título de entre 4 y 120 caracteres.";
  if (description.length > 2000)
    errors.description = "La descripción puede tener hasta 2.000 caracteres.";
  if (!creatorName || creatorName.length > 120)
    errors.creatorName = "Escribe un nombre público de hasta 120 caracteres.";
  if (!(CATEGORIES as string[]).includes(category))
    errors.category = "Elige una categoría.";
  if (!rawPrice || !Number.isFinite(price) || price < 0 || price > 5000)
    errors.price =
      "Escribe un precio entre 0 y 5.000 dólares. Usa 0 si es gratis.";
  if (trailerUrl) {
    try {
      if (new URL(trailerUrl).protocol !== "https:") throw new Error();
    } catch {
      errors.trailerUrl = "Usa un enlace HTTPS directo a un video MP4 o WebM.";
    }
  }
  return {
    input: {
      title,
      description,
      creatorName,
      category: category as NewCourseInput["category"],
      priceCents: Math.round(price * 100),
      trailerUrl,
      trailerSeconds,
    },
    errors,
  };
}

export function publicationChecks(
  course: Pick<Course, "description">,
  lessons: Pick<Lesson, "videoPath">[],
) {
  return [
    {
      key: "description",
      label: "Explica qué aprenderán tus alumnos",
      detail: "Añade una descripción de al menos 20 caracteres.",
      done: course.description.trim().length >= 20,
      step: "editar",
    },
    {
      key: "lessons",
      label: "Agrega al menos una clase",
      detail: "Tu programa necesita contenido antes de publicarse.",
      done: lessons.length > 0,
      step: "clases",
    },
    {
      key: "videos",
      label: "Completa los videos de tus clases",
      detail: "Todas las clases deben tener su video subido.",
      done: lessons.length > 0 && lessons.every((l) => Boolean(l.videoPath)),
      step: "clases",
    },
  ];
}
