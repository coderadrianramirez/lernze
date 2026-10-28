import Link from "next/link";
import { Suspense } from "react";
import { signOutAction } from "@/app/auth/actions";
import { getCurrentUser } from "@/lib/auth";
import { SearchBar } from "./SearchBar";

async function AccountNav() {
  const user = await getCurrentUser();

  if (!user || user.demo) {
    return (
      <div className="flex items-center gap-2">
        <Link
          href="/entrar"
          className="rounded-lg px-3.5 py-2 text-sm text-muted transition-colors hover:text-fg"
        >
          Entrar
        </Link>
        <Link
          href="/registro"
          className="rounded-lg bg-accent px-3.5 py-2 text-sm font-bold text-accent-ink transition-opacity hover:opacity-90"
        >
          Crear cuenta
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Link
        href="/crear"
        className="hidden rounded-lg bg-surface-2 px-3.5 py-2 text-sm font-medium text-fg transition-colors hover:text-accent sm:block"
      >
        Crear programa
      </Link>
      <form action={signOutAction}>
        <button
          title={user.name}
          className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-accent text-sm font-bold text-accent-ink transition-opacity hover:opacity-80"
        >
          {user.name.charAt(0).toUpperCase()}
        </button>
      </form>
    </div>
  );
}

export function Header() {
  return (
    <header className="sticky top-0 z-10 border-b border-line bg-ink/90 backdrop-blur">
      <div className="mx-auto flex max-w-[1180px] items-center gap-4 px-4 py-3">
        <Link
          href="/"
          className="shrink-0 font-display text-2xl font-extrabold tracking-tight"
          aria-label="Lernze — inicio"
        >
          lernze<span className="text-accent">.</span>
        </Link>

        <div className="flex-1">
          <Suspense fallback={<div className="h-9 w-full max-w-[480px] animate-pulse rounded-xl bg-surface" />}>
            <SearchBar />
          </Suspense>
        </div>

        <Suspense
          fallback={<div className="h-9 w-28 animate-pulse rounded-lg bg-surface" />}
        >
          <AccountNav />
        </Suspense>
      </div>
    </header>
  );
}
