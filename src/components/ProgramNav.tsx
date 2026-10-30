import Link from "next/link";
import type { Course } from "@/lib/types";

export function ProgramNav({
  course,
  step,
}: {
  course: Course;
  step: "editar" | "clases" | "publicar";
}) {
  const steps = [
    { key: "editar", label: "Información" },
    { key: "clases", label: "Clases" },
    { key: "publicar", label: "Publicación" },
  ];
  return (
    <header className="mb-7 min-w-0">
      <Link
        href="/dashboard?vista=ensenar"
        className="inline-flex py-2 text-sm font-medium text-muted hover:text-fg"
      >
        ← Mis programas
      </Link>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <h1 className="min-w-0 break-words font-display text-[clamp(26px,4vw,36px)] leading-tight font-extrabold">
          {course.title}
        </h1>
        <span
          className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold ${course.published ? "border-good/30 bg-good/10 text-good" : "border-accent/30 bg-accent/10 text-accent"}`}
        >
          {course.published ? "Publicado" : "Borrador"}
        </span>
      </div>
      <p className="mt-2 text-sm text-muted">
        {course.published
          ? "Los cambios que guardes estarán disponibles para tus alumnos."
          : "Prepara tu programa a tu ritmo. Tú decides cuándo publicarlo."}
      </p>
      <nav
        aria-label="Gestionar programa"
        className="mt-6 grid grid-cols-3 gap-1 rounded-xl border border-line bg-surface p-1"
      >
        {steps.map((s, i) => (
          <Link
            key={s.key}
            href={`/programa/${course.slug}/${s.key}`}
            aria-current={step === s.key ? "page" : undefined}
            className={`min-w-0 rounded-lg px-1 py-3 text-center text-xs font-semibold transition-colors sm:text-sm ${step === s.key ? "bg-fg text-ink" : "text-muted hover:text-fg"}`}
          >
            <span className="mr-1 opacity-60">{i + 1}.</span>
            {s.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
