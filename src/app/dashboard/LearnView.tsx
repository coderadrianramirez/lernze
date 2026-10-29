import Link from "next/link";
import { Stage } from "@/components/Stage";
import { NOUN, programPath } from "@/lib/copy";
import { clock } from "@/lib/lessons";
import type { Course, Lesson } from "@/lib/types";

export type LearnItem = {
  course: Course;
  joinedAt: string;
  lessons: Lesson[];
  done: number;
  next: Lesson | null;
  lastActive: string;
};

function Bar({ pct, className = "" }: { pct: number; className?: string }) {
  return (
    <span className={`block h-1.5 overflow-hidden rounded-full bg-line ${className}`} aria-hidden>
      <span className="block h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
    </span>
  );
}

const pctOf = (i: LearnItem) => (i.lessons.length ? Math.round((i.done / i.lessons.length) * 100) : 0);

export function LearnView({ items, recent }: { items: LearnItem[]; recent: Course[] }) {
  // Continuar: el programa con actividad más reciente que todavía tiene clases por ver.
  const resume = [...items]
    .filter((i) => i.next)
    .sort((a, b) => (a.lastActive < b.lastActive ? 1 : -1))[0];
  const inProgress = items.filter((i) => !i.lessons.length || i.done < i.lessons.length);
  const finished = items.filter((i) => i.lessons.length > 0 && i.done === i.lessons.length);
  const lessonsDone = items.reduce((s, i) => s + i.done, 0);

  if (!items.length) {
    return (
      <>
        <div className="mt-6 rounded-2xl border border-dashed border-line p-8 text-center">
          <p className="font-display text-xl font-bold">{`Tu primer ${NOUN.one} te espera`}</p>
          <p className="mx-auto mt-2 max-w-[44ch] text-muted">
            {`Cuando te unas a un ${NOUN.one}, aquí vas a retomar tus clases y ver cuánto avanzaste.`}
          </p>
          <Link href="/" className="mt-5 inline-block rounded-xl bg-accent px-5 py-3 font-bold text-accent-ink">
            {`Explorar ${NOUN.other}`}
          </Link>
        </div>
        <Recent recent={recent} />
      </>
    );
  }

  return (
    <>
      {/* continuar */}
      {resume && resume.next && (
        <Link
          href={`/aprender/${resume.course.slug}?clase=${resume.next.id}`}
          className="group mt-6 grid overflow-hidden rounded-2xl border border-line bg-surface transition-colors hover:border-accent/50 sm:grid-cols-[minmax(0,300px)_minmax(0,1fr)]"
        >
          <div className="lz-thumb relative">
            <Stage course={resume.course} badges={false} />
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-accent text-accent-ink shadow-lg transition-transform group-hover:scale-105">
                <svg width="20" height="20" viewBox="0 0 14 14" fill="currentColor" aria-hidden>
                  <path d="M3 2l9 5-9 5V2z" />
                </svg>
              </span>
            </span>
          </div>
          <div className="flex flex-col justify-center gap-1.5 p-5">
            <p className="text-xs font-semibold tracking-widest text-accent uppercase">Continúa donde lo dejaste</p>
            <p className="font-display text-xl leading-tight font-bold">{resume.course.title}</p>
            <p className="text-sm text-muted">
              Clase {resume.lessons.findIndex((l) => l.id === resume.next!.id) + 1} de {resume.lessons.length} · {resume.next.title}
              {resume.next.durationSeconds ? ` · ${clock(resume.next.durationSeconds)}` : ""}
            </p>
            <div className="mt-2 flex items-center gap-3">
              <Bar pct={pctOf(resume)} className="flex-1" />
              <span className="text-xs font-semibold">{pctOf(resume)}%</span>
            </div>
          </div>
        </Link>
      )}

      {/* resumen */}
      <dl className="mt-4 grid grid-cols-3 gap-3">
        {[
          { k: "En curso", v: inProgress.length },
          { k: "Terminados", v: finished.length },
          { k: "Clases completadas", v: lessonsDone },
        ].map((s) => (
          <div key={s.k} className="rounded-2xl border border-line bg-surface px-4 py-3">
            <dt className="text-xs text-muted">{s.k}</dt>
            <dd className="mt-0.5 font-display text-2xl font-extrabold">{s.v}</dd>
          </div>
        ))}
      </dl>

      <ProgramGrid title="En curso" items={inProgress} />
      {finished.length > 0 && <ProgramGrid title="Terminados" items={finished} />}
      <Recent recent={recent} />
    </>
  );
}

function ProgramGrid({ title, items }: { title: string; items: LearnItem[] }) {
  if (!items.length) return null;
  return (
    <section className="mt-9">
      <h2 className="mb-3 font-display text-xl font-bold tracking-tight">{title}</h2>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((i) => {
          const pct = pctOf(i);
          return (
            <li key={i.course.id}>
              <Link href={`/aprender/${i.course.slug}`} className="group block overflow-hidden rounded-2xl border border-line bg-surface transition-colors hover:border-fg/25">
                <div className="lz-thumb">
                  <Stage course={i.course} badges={false} />
                </div>
                <div className="p-4">
                  <p className="truncate font-semibold group-hover:text-accent">{i.course.title}</p>
                  <p className="truncate text-xs text-muted">{i.course.creatorName}</p>
                  {i.lessons.length ? (
                    <>
                      <Bar pct={pct} className="mt-3" />
                      <p className="mt-1.5 flex justify-between text-xs text-muted">
                        <span>
                          {i.done} de {i.lessons.length} clases
                        </span>
                        <span className="font-semibold text-fg">{pct === 100 ? "Terminado" : `${pct}%`}</span>
                      </p>
                    </>
                  ) : (
                    <p className="mt-3 text-xs text-muted">Las clases están en camino</p>
                  )}
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function Recent({ recent }: { recent: Course[] }) {
  if (!recent.length) return null;
  return (
    <section className="mt-9">
      <h2 className="mb-3 font-display text-xl font-bold tracking-tight">Vistos recientemente</h2>
      <ul className="no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1">
        {recent.map((c) => (
          <li key={c.id} className="w-[200px] shrink-0 snap-start sm:w-[220px]">
            <Link href={`${programPath(c.slug)}?src=discover`} className="group block">
              <div className="lz-thumb">
                <Stage course={c} badges={false} />
              </div>
              <p className="mt-2 truncate text-sm font-semibold group-hover:text-accent">{c.title}</p>
              <p className="truncate text-xs text-muted">{c.creatorName}</p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
