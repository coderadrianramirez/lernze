import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Avatar } from "@/components/Avatar";
import { CourseListItem } from "@/components/CourseListItem";
import { ShowFooterOnMobile } from "@/components/Footer";
import { getCurrentUser } from "@/lib/auth";
import { followsCreator, publicCreator } from "@/lib/creators";
import { courseCreatorId } from "@/lib/creator-path";
import { listCourses } from "@/lib/data";
import { CreatorInterest } from "@/components/InterestTracking";
import { FollowButton } from "./FollowButton";

export async function generateMetadata({ params }: PageProps<"/creador/[id]">): Promise<Metadata> {
  await connection();
  const { id } = await params;
  const { creator } = await publicCreator(id);
  return { title: creator ? `${creator.name} · Creador` : "Perfil de creador" };
}

export default function CreatorPage({ params }: PageProps<"/creador/[id]">) {
  return (
    <main className="mx-auto max-w-[1100px] px-4 pt-6 pb-12 md:pt-10">
      <ShowFooterOnMobile />
      <Suspense fallback={<div className="h-80 animate-pulse rounded-3xl bg-surface" aria-label="Cargando perfil" />}><Profile params={params} /></Suspense>
    </main>
  );
}

async function Profile({ params }: { params: PageProps<"/creador/[id]">["params"] }) {
  const { id } = await params;
  const [{ creator: publicProfile, ready }, user, all] = await Promise.all([publicCreator(id), getCurrentUser(), listCourses()]);
  const own = Boolean(user && user.id === id && !user.demo);
  const programs = all.filter((course) => courseCreatorId(course) === id);
  const creator = own ? { id, name: user!.name, avatarUrl: user!.avatarUrl ?? null, followers: publicProfile?.followers ?? 0, programs: programs.length } : publicProfile;
  if (!creator) notFound();
  const followed = ready && user && !user.demo && !own ? await followsCreator(user.id, id) : false;
  const categories = [...new Set(programs.map((p) => p.category))];
  return (
    <>
      <Link href="/buscar" className="inline-flex min-h-11 items-center text-sm text-muted hover:text-fg">← Explorar creadores y programas</Link>
      {own && !publicProfile && <p role="status" className="mt-3 rounded-xl border border-accent/30 bg-accent/10 p-4 text-sm">Vista previa de tu perfil. Será público cuando publiques tu primer programa.</p>}
      {publicProfile?.demo && <p role="status" className="mt-3 rounded-xl border border-line bg-surface p-4 text-sm text-muted">Perfil de ejemplo con contenido de prueba. No corresponde a una cuenta real.</p>}
      {!ready && publicProfile && !publicProfile.demo && <p role="status" className="mt-3 rounded-xl border border-line bg-surface p-4 text-sm text-muted">Vista previa del perfil. El seguimiento estará disponible en breve.</p>}
      {!own && <CreatorInterest courseIds={[...new Map(programs.map(c => [c.category, c.id])).values()]} />}
      <header className="mt-3 overflow-hidden rounded-3xl border border-line bg-surface">
        <div className="h-24 border-b border-accent/15 bg-[radial-gradient(ellipse_at_top_right,rgba(255,181,71,.22),transparent_65%)] sm:h-32" aria-hidden />
        <div className="px-5 pb-6 sm:px-8 sm:pb-8">
          <div className="-mt-10 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0 flex-1">
              <div className="inline-flex rounded-full bg-surface p-1.5"><Avatar name={creator.name} src={creator.avatarUrl} className="h-20 w-20 font-display text-3xl sm:h-24 sm:w-24" /></div>
              <p className="mt-3 text-[11px] font-bold uppercase tracking-[.18em] text-accent">Creador en Lernze</p>
              <h1 className="mt-2 break-words font-display text-[clamp(28px,5vw,44px)] leading-tight font-extrabold tracking-tight">{creator.name}</h1>
              <p className="mt-2 text-sm text-muted">{programs.length} {programs.length === 1 ? "programa publicado" : "programas publicados"}</p>
            </div>
            <FollowButton key={`${id}:${followed}:${creator.followers}`} creatorId={id} creatorName={creator.name} followers={creator.followers} following={followed} signedIn={Boolean(user && !user.demo)} own={Boolean(own)} ready={ready && !publicProfile?.demo} demo={Boolean(publicProfile?.demo)} />
          </div>
          {categories.length > 0 && <ul aria-label="Temas de sus programas" className="mt-6 flex flex-wrap gap-2">{categories.map((c) => <li key={c} className="rounded-full border border-line px-3 py-1 text-xs text-muted">{c}</li>)}</ul>}
        </div>
      </header>
      <section className="mt-10" aria-labelledby="creator-programs">
        <h2 id="creator-programs" className="font-display text-xl font-bold">Programas de {creator.name}</h2>
        {programs.length ? <ul className="mt-4 grid gap-2 md:grid-cols-2">{programs.map((course) => <li key={course.id} className="min-w-0"><CourseListItem course={course} src="own" /></li>)}</ul>
          : <div className="mt-4 rounded-2xl border border-dashed border-line p-7 text-center"><p className="font-semibold">Todavía no hay programas publicados</p><p className="mt-2 text-sm text-muted">{own ? "Los borradores permanecen privados. Cuando publiques un programa, aparecerá aquí." : "Vuelve pronto para conocer sus próximos programas."}</p>{own && <Link href="/dashboard?vista=ensenar" className="mt-4 inline-block text-sm font-bold text-accent">Gestionar mis programas →</Link>}</div>}
      </section>
    </>
  );
}
