import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { CreatorCard } from "@/components/CreatorCard";
import { ShowFooterOnMobile } from "@/components/Footer";
import { NoTabBar } from "@/components/MobileTabBar";
import { getCurrentUser } from "@/lib/auth";
import { followingCreators } from "@/lib/creators";

export const metadata: Metadata = { title: "Creadores que sigues" };
export default function FollowingPage({ searchParams }: PageProps<"/siguiendo">) {
  return <main className="mx-auto max-w-[900px] px-4 pt-6 pb-12 md:pt-10"><NoTabBar /><ShowFooterOnMobile /><Suspense fallback={<div className="h-64 animate-pulse rounded-2xl bg-surface" />}><Following searchParams={searchParams} /></Suspense></main>;
}
async function Following({ searchParams }: { searchParams: PageProps<"/siguiendo">["searchParams"] }) {
  const user = await getCurrentUser();
  if (!user || user.demo) redirect("/entrar?next=/siguiendo");
  const sp = await searchParams;
  const page = typeof sp.p === "string" && /^\d+$/.test(sp.p) ? Math.min(10000, Math.max(1, Number(sp.p))) : 1;
  const result = await followingCreators(user.id, page);
  return <>
    <Link href="/dashboard" className="inline-flex min-h-11 items-center text-sm text-muted hover:text-fg">← Mi cuenta</Link>
    <h1 className="mt-3 font-display text-3xl font-extrabold tracking-tight">Creadores que sigues</h1>
    <p className="mt-2 text-sm text-muted">Tus creadores favoritos, reunidos en un solo lugar.</p>
    {result.creators.length ? <ul className="mt-6 grid gap-3 sm:grid-cols-2">{result.creators.map((creator) => <li key={creator.id} className="min-w-0"><CreatorCard creator={creator} /></li>)}</ul>
      : <div className="mt-7 rounded-2xl border border-dashed border-line bg-surface p-8 text-center"><p className="font-display text-xl font-bold">{!result.ready ? "El seguimiento estará disponible en breve" : page > 1 ? "No hay más creadores en esta página" : "Encuentra a tu próximo creador favorito"}</p><p className="mx-auto mt-2 max-w-[42ch] text-sm text-muted">{result.ready ? "Sigue a un creador desde su perfil para encontrarlo aquí cuando quieras." : "Mientras tanto, puedes descubrir sus programas en el buscador."}</p><Link href="/buscar" className="mt-5 inline-block rounded-xl bg-accent px-5 py-3 text-sm font-bold text-accent-ink">Explorar creadores</Link></div>}
    {(page > 1 || result.hasNext) && <nav aria-label="Páginas de creadores seguidos" className="mt-6 flex justify-between gap-4">{page > 1 ? <Link href={`/siguiendo?p=${page-1}`} className="rounded-xl border border-line px-4 py-3 text-sm">← Anterior</Link> : <span />}{result.hasNext && <Link href={`/siguiendo?p=${page+1}`} className="rounded-xl border border-line px-4 py-3 text-sm">Siguiente →</Link>}</nav>}
  </>;
}
