import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { NOUN } from "@/lib/copy";

export const metadata: Metadata = { title: "Mi panel" };

export default function DashboardPage() {
  return (
    <main className="px-4 py-10 md:px-[60px]">
      <Suspense fallback={<div className="h-64 animate-pulse rounded-2xl bg-surface" />}>
        <Panel />
      </Suspense>
    </main>
  );
}

async function Panel() {
  const user = await getCurrentUser();
  if (!user || user.demo) redirect("/entrar?next=/dashboard");

  return (
    <>
      <div className="mb-8 flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent text-xl font-bold text-accent-ink">
          {user.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight">{user.name}</h1>
          <p className="text-sm text-muted">{user.email}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/crear"
          className="group rounded-2xl border border-line bg-surface p-6 transition-colors hover:border-accent/40 hover:bg-surface-2"
        >
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <h2 className="font-semibold text-fg">Crear {NOUN.one}</h2>
          <p className="mt-1 text-sm text-muted">Publica tu conocimiento y empieza a generar ingresos.</p>
        </Link>

        <div className="rounded-2xl border border-line bg-surface p-6 opacity-50">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-surface-2">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <rect x="2" y="2" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.5" />
              <rect x="11" y="2" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.5" />
              <rect x="2" y="11" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.5" />
              <rect x="11" y="11" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </div>
          <h2 className="font-semibold text-fg">Mis {NOUN.other}</h2>
          <p className="mt-1 text-sm text-muted">Próximamente — tus {NOUN.other} publicados y sus métricas.</p>
        </div>

        <div className="rounded-2xl border border-line bg-surface p-6 opacity-50">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-surface-2">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 2a8 8 0 1 0 0 16A8 8 0 0 0 10 2Z" stroke="currentColor" strokeWidth="1.5" />
              <path d="M10 6v4l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <h2 className="font-semibold text-fg">Historial</h2>
          <p className="mt-1 text-sm text-muted">Próximamente — {NOUN.other} que compraste y tu progreso.</p>
        </div>
      </div>
    </>
  );
}
