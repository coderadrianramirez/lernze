import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth";
import { getUserInterests, listCourses } from "@/lib/data";
import { recommendationActivity } from "@/lib/recommendation-data";
import { recommendPrograms } from "@/lib/recommendations";
import { NoTabBar } from "@/components/MobileTabBar";
import { ShowFooterOnMobile } from "@/components/Footer";
import { restoreInterestAction } from "@/app/actions/recommendations";

export const metadata: Metadata = { title: "Tus intereses" };
export default function InterestsPage() {
  return (
    <main className="mx-auto max-w-[760px] px-4 pt-6 pb-12 md:pt-10">
      <NoTabBar />
      <ShowFooterOnMobile />
      <Suspense
        fallback={<div className="h-80 animate-pulse rounded-2xl bg-surface" />}
      >
        <Interests />
      </Suspense>
    </main>
  );
}
async function Interests() {
  const user = await getCurrentUser();
  if (!user || user.demo) redirect("/entrar?next=/intereses");
  const [chosen, catalogue, activity] = await Promise.all([
    getUserInterests(user.id),
    listCourses(),
    recommendationActivity(user.id),
  ]);
  const model = recommendPrograms(catalogue, {
    ...activity,
    chosen: chosen ?? [],
    userId: user.id,
  });
  const learned = model.interests.filter((i) => i.sources.length);
  const hidden = catalogue.filter((c) => model.dismissed.includes(c.id));
  return (
    <>
      <Link
        href="/configuracion"
        className="inline-flex min-h-11 items-center text-sm text-muted hover:text-fg"
      >
        ← Configuración
      </Link>
      <p className="mt-5 text-xs font-bold uppercase tracking-[.18em] text-accent">
        Tu descubrimiento
      </p>
      <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight">
        Tus intereses evolucionan contigo
      </h1>
      <p className="mt-3 max-w-[58ch] text-sm leading-relaxed text-muted">
        Lo que ves, buscas y decides seguir nos ayuda a recomendarte programas.
        No necesitas actualizar una lista: seguimos aprendiendo de tu actividad.
      </p>
      <section className="mt-8 rounded-2xl border border-line bg-surface p-5 sm:p-6">
        <h2 className="font-display text-lg font-bold">Tu punto de partida</h2>
        <p className="mt-2 text-sm text-muted">
          Los temas que elegiste al comenzar siguen contando.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {chosen?.length ? (
            chosen.map((c) => (
              <span
                key={c}
                className="rounded-full border border-accent/30 bg-accent/10 px-3 py-1.5 text-sm text-accent"
              >
                {c}
              </span>
            ))
          ) : (
            <p className="text-sm text-muted">
              Todavía no elegiste temas iniciales. Puedes empezar explorando.
            </p>
          )}
        </div>
      </section>
      <section className="mt-7" aria-labelledby="learned-topics">
        <h2 id="learned-topics" className="font-display text-xl font-bold">
          Lo que estás explorando
        </h2>
        <p className="mt-2 text-sm text-muted">
          Las señales recientes pesan más y las antiguas van perdiendo fuerza.
        </p>
        {learned.length ? (
          <ul className="mt-4 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
            {learned.map((t) => (
              <li key={t.category} className="p-5">
                <p className="font-semibold">{t.category}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted">
                  {t.sources.join(" · ")}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-4 rounded-2xl border border-dashed border-line p-6 text-sm text-muted">
            Aún no hay suficiente actividad. Abre programas que te interesen
            para que podamos conocerte mejor.
          </div>
        )}
      </section>
      <section className="mt-7 rounded-2xl border border-line p-5 text-sm leading-relaxed text-muted">
        <h2 className="font-semibold text-fg">Cómo se prepara tu inicio</h2>
        <p className="mt-2">
          Combinamos tus temas iniciales con los programas que abres, trailers
          que ves, búsquedas, programas a los que te unes y creadores que
          sigues. También reservamos espacio para otros temas.
        </p>
        <p className="mt-3">
          No guardamos el texto de tus búsquedas para recomendarte: solo
          coincidencias con programas públicos. Tus señales de actividad son
          privadas.
        </p>
        {!activity.ready && (
          <p className="mt-3 text-accent">
            La ampliación de señales está pendiente de activación. Tus temas
            iniciales, visitas e inscripciones ya cuentan.
          </p>
        )}
      </section>
      {hidden.length > 0 && (
        <section className="mt-7">
          <h2 className="font-display text-xl font-bold">
            Programas que preferiste ocultar
          </h2>
          <ul className="mt-4 divide-y divide-line rounded-2xl border border-line bg-surface">
            {hidden.map((c) => (
              <li key={c.id} className="flex items-center gap-3 p-4">
                <p className="min-w-0 flex-1 break-words text-sm">{c.title}</p>
                <form action={restoreInterestAction}>
                  <input type="hidden" name="courseId" value={c.id} />
                  <button className="min-h-11 cursor-pointer rounded-lg border border-line px-3 text-xs font-semibold text-accent">
                    Volver a recomendar
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </section>
      )}
      <Link
        href="/"
        className="mt-8 inline-flex min-h-11 items-center rounded-xl bg-accent px-5 py-3 text-sm font-bold text-accent-ink"
      >
        Ver recomendaciones →
      </Link>
    </>
  );
}
