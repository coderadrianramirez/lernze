import Link from "next/link";
import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth";
import { CategoryNav } from "./CategoryNav";
import { SearchBar } from "./SearchBar";
import { UserMenu } from "./UserMenu";

async function AccountNav() {
  const user = await getCurrentUser();

  if (!user || user.demo) {
    return (
      <div className="flex items-center gap-1 md:gap-2">
        <Link
          href="/entrar"
          className="rounded-lg px-3 py-2 text-sm font-medium text-muted transition-colors hover:text-fg md:px-4 md:py-2.5"
        >
          Entrar
        </Link>
        <Link
          href="/registro"
          className="hidden rounded-lg bg-accent px-4 py-2.5 text-sm font-bold text-accent-ink transition-opacity hover:opacity-90 md:block"
        >
          Crear cuenta
        </Link>
      </div>
    );
  }

  return <UserMenu name={user.name} avatarUrl={user.avatarUrl} />;
}

export function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-ink/90 backdrop-blur-md pt-[env(safe-area-inset-top)]">
      <div className="mx-auto flex h-[60px] max-w-[1400px] items-center gap-3 px-4 md:h-[80px] md:gap-6 md:px-5">
        <Link
          href="/"
          className="shrink-0 font-display text-[23px] font-extrabold tracking-tight md:text-[26px]"
          aria-label="Lernze — inicio"
        >
          lernze<span className="text-accent">.</span>
        </Link>

        <div className="hidden md:block">
          <Suspense fallback={<div className="h-5 w-64 animate-pulse rounded bg-surface" />}>
            <CategoryNav />
          </Suspense>
        </div>

        <div className="flex-1" />

        <div className="hidden w-full max-w-[470px] md:block">
          <Suspense fallback={<div className="h-9 w-full animate-pulse rounded-xl bg-surface" />}>
            <SearchBar />
          </Suspense>
        </div>

        <Link
          href="/buscar"
          aria-label="Buscar"
          className="flex h-10 w-10 items-center justify-center rounded-full text-fg transition-colors active:bg-surface md:hidden"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
        </Link>

        <Suspense fallback={<div className="h-9 w-20 animate-pulse rounded-lg bg-surface md:w-28" />}>
          <AccountNav />
        </Suspense>
      </div>

      <div className="md:hidden">
        <Suspense fallback={null}>
          <CategoryNav variant="chips" />
        </Suspense>
      </div>
    </header>
  );
}
