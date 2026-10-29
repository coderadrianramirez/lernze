import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { signOutAction } from "@/app/auth/actions";
import { CourseListItem } from "@/components/CourseListItem";
import { Stage } from "@/components/Stage";
import { getCurrentUser } from "@/lib/auth";
import { NOUN, memberCount, programPath } from "@/lib/copy";
import { getUserInterests, listMyCourses, listMyEnrollments, listRecentViews } from "@/lib/data";

export const metadata: Metadata = { title: "Mi cuenta" };

export default function AccountPage() {
  return (
    <main className="mx-auto max-w-[960px] px-4 pt-6 pb-10 md:pt-10">
      <Suspense fallback={<div className="h-64 animate-pulse rounded-2xl bg-surface" />}>
        <Account />
      </Suspense>
    </main>
  );
}

const fmtDate = new Intl.DateTimeFormat("es", { day: "numeric", month: "short", year: "numeric" });

function Section({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="mt-9">
      <div className="mb-3 flex items-end justify-between gap-4">
        <h2 className="font-display text-xl font-bold tracking-tight">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function Chevron() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

async function Account() {
  const user = await getCurrentUser();
  if (!user || user.demo) redirect("/entrar?next=/dashboard");

  const [interests, enrollments, recent, created] = await Promise.all([
    getUserInterests(user.id),
    listMyEnrollments(user.id),
    listRecentViews(user.id, 10),
    listMyCourses(user.id),
  ]);

  const rowCls =
    "flex w-full items-center gap-3 px-4 py-3.5 text-left text-sm transition-colors hover:bg-surface-2 active:bg-surface-2";

  return (
    <>
      {/* perfil */}
      <header className="flex items-center gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-accent font-display text-2xl font-extrabold text-accent-ink">
          {user.name.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <h1 className="truncate font-display text-2xl font-extrabold tracking-tight">{user.name}</h1>
          <p className="truncate text-sm text-muted">{user.email}</p>
        </div>
      </header>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        {interests && interests.length > 0 ? (
          interests.map((i) => (
            <Link
              key={i}
              href={`/?i=${encodeURIComponent(i)}`}
              className="rounded-full border border-line bg-surface px-3 py-1 text-sm text-fg transition-colors hover:border-accent"
            >
              {i}
            </Link>
          ))
        ) : (
          <span className="text-sm text-muted">Todavía no elegiste temas.</span>
        )}
        <Link href="/bienvenida?next=/dashboard" className="px-2 py-1 text-sm font-semibold text-accent">
          {interests && interests.length > 0 ? "Editar" : "Elegir temas"}
        </Link>
      </div>

      {/* programas a los que se unió */}
      <Section
        title={`Mis ${NOUN.other}`}
        action={enrollments.length > 0 ? <span className="text-sm text-muted">{enrollments.length}</span> : undefined}
      >
        {enrollments.length > 0 ? (
          <ul className="-mx-2 flex flex-col">
            {enrollments.map(({ course, joinedAt }) => (
              <li key={course.id}>
                <CourseListItem
                  course={course}
                  src="own"
                  aside={
                    <span className="block text-right">
                      <span className="block text-xs text-muted">Te uniste</span>
                      <span className="block text-xs font-semibold text-fg">{fmtDate.format(new Date(joinedAt))}</span>
                    </span>
                  }
                />
              </li>
            ))}
          </ul>
        ) : (
          <div className="rounded-2xl border border-dashed border-line p-6 text-center">
            <p className="font-semibold">{`Todavía no te uniste a ningún ${NOUN.one}`}</p>
            <p className="mx-auto mt-1 max-w-[40ch] text-sm text-muted">
              Cuando te sumes a uno, vas a encontrarlo aquí con sus clases y su comunidad.
            </p>
            <Link href="/" className="mt-4 inline-block rounded-xl bg-accent px-5 py-3 text-sm font-bold text-accent-ink">
              {`Explorar ${NOUN.other}`}
            </Link>
          </div>
        )}
      </Section>

      {/* vistos recientemente */}
      {recent.length > 0 && (
        <Section title="Vistos recientemente">
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
        </Section>
      )}

      {/* como creador */}
      {created.length > 0 ? (
        <Section
          title="Publicados por ti"
          action={
            <Link href="/crear" className="text-sm font-semibold text-accent">
              + Crear
            </Link>
          }
        >
          <ul className="-mx-2 flex flex-col">
            {created.map((c) => (
              <li key={c.id}>
                <CourseListItem
                  course={c}
                  src="own"
                  aside={<span className="text-xs text-muted">{memberCount(c.members)}</span>}
                />
              </li>
            ))}
          </ul>
        </Section>
      ) : (
        <Link
          href="/crear"
          className="lz-news mt-9 flex items-center gap-4 rounded-2xl border border-line p-5 transition-colors hover:border-accent/50"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
              <path d="M12 5v14M5 12h14" />
            </svg>
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-semibold">¿Enseñas algo?</span>
            <span className="block text-sm text-muted">{`Publica tu ${NOUN.one} y llega a alumnos nuevos con un trailer.`}</span>
          </span>
          <span className="text-muted">
            <Chevron />
          </span>
        </Link>
      )}

      {/* ajustes */}
      <Section title="Ajustes">
        <div className="overflow-hidden rounded-2xl border border-line bg-surface">
          <Link href="/bienvenida?next=/dashboard" className={rowCls}>
            <span className="flex-1">Mis intereses</span>
            <span className="text-muted">
              <Chevron />
            </span>
          </Link>
          <Link href="/legal/terminos" className={`${rowCls} border-t border-line`}>
            <span className="flex-1">Términos y condiciones</span>
            <span className="text-muted">
              <Chevron />
            </span>
          </Link>
          <Link href="/legal/privacidad" className={`${rowCls} border-t border-line`}>
            <span className="flex-1">Privacidad</span>
            <span className="text-muted">
              <Chevron />
            </span>
          </Link>
          <form action={signOutAction} className="border-t border-line">
            <button type="submit" className={`${rowCls} cursor-pointer text-bad`}>
              <span className="flex-1">Cerrar sesión</span>
            </button>
          </form>
        </div>
      </Section>
    </>
  );
}
