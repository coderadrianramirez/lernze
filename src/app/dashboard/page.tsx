import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { signOutAction } from "@/app/auth/actions";
import { lastActivityByCourse, lessonsByCourse, listCreatorSales, memberSince } from "@/lib/account";
import { getCurrentUser } from "@/lib/auth";
import { getUserInterests, listMyCourses, listMyEnrollments, listRecentViews } from "@/lib/data";
import { completedLessonIds } from "@/lib/lessons";
import { LearnView, type LearnItem } from "./LearnView";
import { TeachView } from "./TeachView";

export const metadata: Metadata = { title: "Mi cuenta" };

export default function AccountPage({ searchParams }: PageProps<"/dashboard">) {
  return (
    <main className="mx-auto max-w-[1100px] px-4 pt-6 pb-12 md:pt-10">
      <Suspense fallback={<div className="h-64 animate-pulse rounded-2xl bg-surface" />}>
        <Account searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

const fmtMonth = new Intl.DateTimeFormat("es", { month: "long", year: "numeric" });

function Chevron() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

async function Account({ searchParams }: { searchParams: PageProps<"/dashboard">["searchParams"] }) {
  const user = await getCurrentUser();
  if (!user || user.demo) redirect("/entrar?next=/dashboard");
  const sp = await searchParams;

  const [interests, enrollments, recent, created, completed, since, activity, sales] = await Promise.all([
    getUserInterests(user.id),
    listMyEnrollments(user.id),
    listRecentViews(user.id, 10),
    listMyCourses(user.id),
    completedLessonIds(user.id),
    memberSince(user.id),
    lastActivityByCourse(user.id),
    listCreatorSales(user.id),
  ]);
  const lessons = await lessonsByCourse([...enrollments.map((e) => e.course.id), ...created.map((c) => c.id)]);

  const learn: LearnItem[] = enrollments.map(({ course, joinedAt }) => {
    const ls = lessons[course.id] ?? [];
    return {
      course,
      joinedAt,
      lessons: ls,
      done: ls.filter((l) => completed.has(l.id)).length,
      next: ls.find((l) => !completed.has(l.id)) ?? null,
      lastActive: activity[course.id] ?? joinedAt,
    };
  });

  // Abre en la pestaña que más usa: quien solo crea, entra a "Enseñar".
  const tab = sp.vista === "ensenar" || sp.vista === "aprender" ? sp.vista : created.length && !enrollments.length ? "ensenar" : "aprender";
  const tabCls = (on: boolean) =>
    `flex-1 rounded-lg px-4 py-2 text-center text-sm font-semibold transition-colors sm:flex-none ${on ? "bg-fg text-ink" : "text-muted hover:text-fg"}`;

  const rowCls = "flex w-full items-center gap-3 px-4 py-3.5 text-left text-sm transition-colors hover:bg-surface-2 active:bg-surface-2";

  return (
    <>
      {/* perfil + pestañas */}
      <header className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-accent font-display text-xl font-extrabold text-accent-ink sm:h-16 sm:w-16 sm:text-2xl">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <h1 className="truncate font-display text-2xl font-extrabold tracking-tight">{user.name}</h1>
            <p className="truncate text-sm text-muted">
              {since ? `Miembro desde ${fmtMonth.format(new Date(since))}` : user.email}
            </p>
          </div>
        </div>
        <nav aria-label="Secciones de tu cuenta" className="flex rounded-xl border border-line bg-surface p-1">
          <Link href="/dashboard?vista=aprender" aria-current={tab === "aprender" ? "page" : undefined} className={tabCls(tab === "aprender")} scroll={false}>
            Aprender
          </Link>
          <Link href="/dashboard?vista=ensenar" aria-current={tab === "ensenar" ? "page" : undefined} className={tabCls(tab === "ensenar")} scroll={false}>
            Enseñar
          </Link>
        </nav>
      </header>

      {tab === "aprender" ? (
        <LearnView items={learn} recent={recent} />
      ) : (
        <TeachView courses={created} lessons={lessons} sales={sales} />
      )}

      {/* cuenta */}
      <section className="mt-10">
        <h2 className="mb-3 font-display text-xl font-bold tracking-tight">Cuenta</h2>
        <div className="overflow-hidden rounded-2xl border border-line bg-surface">
          <Link href="/bienvenida?next=/dashboard" className={rowCls}>
            <span className="min-w-0 flex-1">
              <span className="block font-medium">Temas de tu feed</span>
              <span className="block truncate text-xs text-muted">
                {interests && interests.length ? interests.join(" · ") : "Sin elegir: te mostramos de todo"}
              </span>
            </span>
            <span className="text-muted">
              <Chevron />
            </span>
          </Link>
          <div className={`${rowCls} border-t border-line hover:bg-transparent`}>
            <span className="min-w-0 flex-1">
              <span className="block font-medium">Correo</span>
              <span className="block truncate text-xs text-muted">{user.email}</span>
            </span>
          </div>
          <Link href="/legal/terminos" className={`${rowCls} border-t border-line`}>
            <span className="flex-1 font-medium">Términos y condiciones</span>
            <span className="text-muted">
              <Chevron />
            </span>
          </Link>
          <Link href="/legal/privacidad" className={`${rowCls} border-t border-line`}>
            <span className="flex-1 font-medium">Privacidad</span>
            <span className="text-muted">
              <Chevron />
            </span>
          </Link>
          <form action={signOutAction} className="border-t border-line">
            <button type="submit" className={`${rowCls} cursor-pointer font-medium text-bad`}>
              Cerrar sesión
            </button>
          </form>
        </div>
      </section>
    </>
  );
}
