import Link from "next/link";
import type { ReactNode } from "react";
import { programPath } from "@/lib/copy";
import { formatPrice } from "@/lib/pricing";
import type { Course } from "@/lib/types";
import { Stage } from "./Stage";

/** Fila de programa: miniatura, título, creador y precio. `aside` reemplaza el precio. */
export function CourseListItem({ course, src = "discover", aside }: { course: Course; src?: string; aside?: ReactNode }) {
  return (
    <Link
      href={`${programPath(course.slug)}?src=${src}`}
      className="group flex items-center gap-4 rounded-2xl p-2 transition-colors hover:bg-surface active:bg-surface"
    >
      <div className="lz-thumb w-[132px] shrink-0 sm:w-[168px]">
        <Stage course={course} lockup={false} badges={false} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 leading-snug font-semibold group-hover:text-accent">{course.title}</p>
        <p className="mt-1 truncate text-[13px] text-muted">{course.creatorName}</p>
        <p className="mt-1.5 flex items-center gap-2 text-xs text-muted">
          <span>{course.category}</span>
          {course.rating > 0 && <span className="font-semibold text-good">★ {course.rating.toFixed(1)}</span>}
        </p>
      </div>
      <div className="shrink-0 self-center pr-1 text-right">
        {aside ?? <span className="font-display text-base font-extrabold">{formatPrice(course.priceCents, course.currency)}</span>}
      </div>
    </Link>
  );
}
