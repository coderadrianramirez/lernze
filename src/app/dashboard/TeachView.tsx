import Link from "next/link";
import { Stage } from "@/components/Stage";
import type { Sale } from "@/lib/account";
import { NOUN, programPath } from "@/lib/copy";
import { formatDuration } from "@/lib/lessons";
import { formatPrice } from "@/lib/pricing";
import type { Course, Lesson, SaleOrigin } from "@/lib/types";

const ORIGIN_LABEL: Record<SaleOrigin, string> = { discover: "Discover", agent: "Clips de agentes", own: "Tráfico propio" };

export function TeachView({
  courses,
  lessons,
  sales,
}: {
  courses: Course[];
  lessons: Record<string, Lesson[]>;
  sales: Sale[];
}) {
  if (!courses.length) return <TeachInvite />;

  const net = sales.reduce((s, x) => s + x.grossCents - x.commissionCents, 0);
  const last30 = sales.filter((s) => s.ageDays < 30);
  const prev30 = sales.filter((s) => s.ageDays >= 30 && s.ageDays < 60);
  const allLessons = Object.values(lessons).flat();
  const delta = last30.length - prev30.length;

  const kpis = [
    { k: "Alumnos", v: String(sales.length), hint: "en todos tus programas" },
    { k: "Ingresos netos", v: formatPrice(net), hint: "después de comisiones" },
    {
      k: "Nuevos · 30 días",
      v: String(last30.length),
      hint: delta === 0 ? "igual que el mes anterior" : `${delta > 0 ? "+" : ""}${delta} vs. mes anterior`,
      tone: delta > 0 ? "text-good" : delta < 0 ? "text-bad" : "text-muted",
    },
    { k: "Clases creadas", v: String(allLessons.length), hint: formatDuration(allLessons.reduce((s, l) => s + l.durationSeconds, 0)) || "sin videos aún" },
  ];

  const steps = [
    { t: `Crea tu ${NOUN.one}`, done: courses.length > 0, href: `/programa/${courses[0].slug}/editar` },
    { t: "Agrega tus clases", done: allLessons.length > 0, href: `/programa/${courses[0].slug}/clases` },
    { t: "Revisa y publica", done: courses.some((c) => c.published), href: `/programa/${courses[0].slug}/publicar` },
    { t: "Consigue tu primer alumno", done: sales.length > 0, href: programPath(courses[0].slug) },
  ];
  const doneSteps = steps.filter((s) => s.done).length;

  const byOrigin = (["discover", "agent", "own"] as SaleOrigin[]).map((o) => {
    const rows = sales.filter((s) => s.origin === o);
    return { o, count: rows.length, net: rows.reduce((s, x) => s + x.grossCents - x.commissionCents, 0) };
  });

  return (
    <>
      {/* métricas */}
      <dl className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map((m) => (
          <div key={m.k} className="rounded-2xl border border-line bg-surface p-4">
            <dt className="text-xs text-muted">{m.k}</dt>
            <dd className="mt-1 font-display text-[26px] leading-none font-extrabold">{m.v}</dd>
            <p className={`mt-2 text-xs ${m.tone ?? "text-muted"}`}>{m.hint}</p>
          </div>
        ))}
      </dl>

      {/* primeros pasos */}
      {doneSteps < steps.length && (
        <section className="mt-6 rounded-2xl border border-line bg-surface p-5">
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-display text-lg font-bold">Primeros pasos</h2>
            <span className="text-sm text-muted">
              {doneSteps} de {steps.length}
            </span>
          </div>
          <span className="mt-3 block h-1.5 overflow-hidden rounded-full bg-line" aria-hidden>
            <span className="block h-full rounded-full bg-accent" style={{ width: `${(doneSteps / steps.length) * 100}%` }} />
          </span>
          <ol className="mt-4 grid gap-1">
            {steps.map((s) => (
              <li key={s.t}>
                <Link href={s.href} className={`flex items-center gap-3 rounded-xl px-2 py-2 text-sm transition-colors hover:bg-surface-2 ${s.done ? "text-muted" : ""}`}>
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${s.done ? "border-good bg-good text-ink" : "border-line"}`}
                    aria-label={s.done ? "Hecho" : "Pendiente"}
                  >
                    {s.done && (
                      <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.6" aria-hidden>
                        <path d="M3 8.5l3 3 7-7" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </span>
                  <span className={`flex-1 ${s.done ? "line-through decoration-muted/50" : "font-medium"}`}>{s.t}</span>
                  {!s.done && <span className="text-accent">→</span>}
                </Link>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* programas */}
      <section className="mt-9">
        <div className="mb-3 flex items-end justify-between gap-4">
          <h2 className="font-display text-xl font-bold tracking-tight">Tus {NOUN.other}</h2>
          <Link href="/crear" className="rounded-lg border border-line px-3 py-1.5 text-sm font-semibold hover:border-accent">
            + Nuevo
          </Link>
        </div>
        <ul className="grid gap-3">
          {courses.map((c) => {
            const ls = lessons[c.id] ?? [];
            const cs = sales.filter((s) => s.courseId === c.id);
            const cNet = cs.reduce((s, x) => s + x.grossCents - x.commissionCents, 0);
            const warn = !ls.length ? "Sin clases" : ls.some((l) => !l.videoPath) ? "Hay clases sin video" : null;
            return (
              <li key={c.id} className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-3 sm:flex-row sm:items-center">
                <div className="lz-thumb w-full shrink-0 sm:w-[168px]">
                  <Stage course={c} lockup={false} badges={false} />
                </div>
                <div className="min-w-0 flex-1">
                  <span className={`mb-2 inline-block rounded-full px-2.5 py-1 text-[11px] font-semibold ${c.published ? "bg-good/10 text-good" : "bg-accent/10 text-accent"}`}>{c.published ? "Publicado" : "Borrador"}</span>
                  <p className="break-words font-semibold">{c.title}</p>
                  <p className="mt-0.5 text-xs text-muted">
                    {c.category} · {formatPrice(c.priceCents, c.currency)}
                  </p>
                  {warn && <p className="mt-1.5 text-xs font-semibold text-accent">⚠ {warn}</p>}
                </div>
                <dl className="grid grid-cols-3 gap-4 text-center sm:w-[260px]">
                  <div>
                    <dt className="text-[11px] text-muted">Alumnos</dt>
                    <dd className="font-display text-lg font-bold">{cs.length}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] text-muted">Ingresos</dt>
                    <dd className="font-display text-lg font-bold">{formatPrice(cNet)}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] text-muted">Clases</dt>
                    <dd className="font-display text-lg font-bold">{ls.length}</dd>
                  </div>
                </dl>
                <div className="flex gap-2 sm:flex-col">
                  <Link href={`/programa/${c.slug}/editar`} className="flex-1 rounded-lg bg-accent px-3 py-2 text-center text-sm font-bold text-accent-ink">
                    Gestionar
                  </Link>
                  <Link href={`/programa/${c.slug}/publicar`} className="flex-1 rounded-lg border border-line px-3 py-2 text-center text-sm font-semibold hover:border-fg/30">
                    Publicación
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {/* de dónde vienen las ventas */}
      <section className="mt-9">
        <h2 className="mb-3 font-display text-xl font-bold tracking-tight">De dónde vienen tus alumnos</h2>
        <ul className="grid gap-3 sm:grid-cols-3">
          {byOrigin.map((x) => (
            <li key={x.o} className="rounded-2xl border border-line bg-surface p-4">
              <p className="text-sm font-semibold">{ORIGIN_LABEL[x.o]}</p>
              <p className="mt-1 text-xs text-muted">
                {x.count} {x.count === 1 ? "alumno" : "alumnos"} · {formatPrice(x.net)} netos
              </p>
              <span className="mt-3 block h-1.5 overflow-hidden rounded-full bg-line" aria-hidden>
                <span className="block h-full rounded-full bg-ai" style={{ width: `${sales.length ? (x.count / sales.length) * 100 : 0}%` }} />
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-muted">Comisión de Lernze: 0% en tráfico propio, 3% en clips de agentes y 5% en el Discover.</p>
      </section>
    </>
  );
}

function TeachInvite() {
  const steps = [
    { t: "Crea tu borrador", d: "Título, precio y una descripción clara." },
    { t: "Sube tus clases", d: "Videos privados que solo ven tus alumnos." },
    { t: "Revisa y publica", d: "Cuando esté listo, aparece en el Discover." },
  ];
  return (
    <section className="lz-news mt-6 rounded-2xl border border-line p-6 sm:p-8">
      <p className="text-xs font-semibold tracking-widest text-accent uppercase">Para creadores</p>
      <h2 className="mt-2 font-display text-[clamp(24px,3vw,32px)] leading-tight font-extrabold">Convierte lo que sabes en un {NOUN.one}</h2>
      <ol className="mt-6 grid gap-3 sm:grid-cols-3">
        {steps.map((s, i) => (
          <li key={s.t} className="rounded-xl border border-line bg-ink/40 p-4">
            <span className="font-display text-2xl font-extrabold text-accent">{String(i + 1).padStart(2, "0")}</span>
            <p className="mt-2 font-semibold">{s.t}</p>
            <p className="text-sm text-muted">{s.d}</p>
          </li>
        ))}
      </ol>
      <Link href="/crear" className="mt-6 inline-block rounded-xl bg-accent px-5 py-3 font-bold text-accent-ink">
        {`Crear mi ${NOUN.one}`}
      </Link>
    </section>
  );
}
