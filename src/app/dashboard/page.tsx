import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Avatar } from "@/components/Avatar";
import { lastActivityByCourse, lessonsByCourse, listCreatorSales, memberSince } from "@/lib/account";
import { getCurrentUser } from "@/lib/auth";
import { listMyCourses, listMyEnrollments, listRecentViews } from "@/lib/data";
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

async function Account({ searchParams }: { searchParams: PageProps<"/dashboard">["searchParams"] }) {
  const user = await getCurrentUser();
  if (!user || user.demo) redirect("/entrar?next=/dashboard");
  const sp = await searchParams;

  const [enrollments, recent, created, completed, since, activity, sales] = await Promise.all([
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


  return (
    <>
      {/* perfil + pestañas */}
      <header className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <Avatar name={user.name} src={user.avatarUrl} className="h-14 w-14 font-display text-xl sm:h-16 sm:w-16 sm:text-2xl" />
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

      {sp.eliminado === "1" && <p role="status" className="mt-5 rounded-xl border border-good/30 bg-good/10 p-4 text-sm text-good">Programa eliminado.</p>}
      {tab === "aprender" ? (
        <LearnView items={learn} recent={recent} />
      ) : (
        <TeachView courses={created} lessons={lessons} sales={sales} />
      )}

    </>
  );
}
