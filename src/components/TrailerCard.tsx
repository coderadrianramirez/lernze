import Link from "next/link";
import { programPath } from "@/lib/copy";
import { formatDuration, formatPrice } from "@/lib/pricing";
import type { Course } from "@/lib/types";

export function Poster({ course, className = "" }: { course: Course; className?: string }) {
  return (
    <div
      className={`relative flex aspect-video items-end overflow-hidden rounded-xl p-3 ${className}`}
      style={{ background: `linear-gradient(135deg, ${course.palette[0]}, ${course.palette[1]})` }}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute -right-1 -bottom-5 font-display text-[110px] leading-none font-extrabold tracking-tighter text-white/15"
      >
        {course.glyph}
      </span>
      <span
        className={`absolute top-2 left-2 rounded-full bg-black/55 px-2.5 py-0.5 text-[11px] font-medium ${
          course.trailerSource === "ai" ? "text-ai" : "text-accent"
        }`}
      >
        {course.trailerSource === "ai" ? "Trailer IA" : "Trailer del creador"}
      </span>
      {course.trailerSeconds > 0 && (
        <span className="absolute top-2 right-2 rounded-md bg-black/55 px-2 py-0.5 text-[11px] tabular-nums">
          {formatDuration(course.trailerSeconds)}
        </span>
      )}
      <span className="relative max-w-[75%] font-display text-[17px] leading-[1.1] font-bold [text-shadow:0_1px_8px_rgba(0,0,0,.5)]">
        {course.title}
      </span>
    </div>
  );
}

export function TrailerCard({ course, why }: { course: Course; why?: string }) {
  return (
    <Link
      href={`${programPath(course.slug)}?src=discover`}
      className="group block w-[min(300px,78vw)] flex-none snap-start"
    >
      <div className="relative transition-transform duration-200 group-hover:-translate-y-0.5 group-focus-visible:-translate-y-0.5">
        <Poster course={course} />
        <span
          aria-hidden
          className="absolute inset-0 grid place-items-center rounded-xl bg-black/30 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
        >
          <span className="ml-1 border-y-[11px] border-l-[18px] border-y-transparent border-l-white" />
        </span>
        <span
          aria-hidden
          className="absolute bottom-0 left-0 h-[3px] w-0 rounded-bl-xl bg-accent group-hover:w-full group-hover:transition-[width] group-hover:duration-[6000ms] group-hover:ease-linear"
        />
      </div>
      <div className="flex justify-between gap-2 pt-2 text-[13px]">
        <span className="truncate text-muted">
          {course.creatorName} · {course.members.toLocaleString("es")} miembros
        </span>
        <span className="font-bold whitespace-nowrap">{formatPrice(course.priceCents, course.currency)}</span>
      </div>
      {why && <div className="mt-0.5 text-xs text-ai">{why}</div>}
    </Link>
  );
}

export function Rail({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-8">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 className="font-display text-[22px] font-bold tracking-tight">{title}</h2>
        {subtitle && <span className="text-[13px] text-muted">{subtitle}</span>}
      </div>
      <div className="scrollbar-thin flex snap-x snap-proximity gap-3.5 overflow-x-auto pb-2.5">{children}</div>
    </section>
  );
}
