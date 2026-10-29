import Link from "next/link";
import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth";
import { SearchBar } from "./SearchBar";
import { UserMenu } from "./UserMenu";
import { CategoryNav } from "./CategoryNav";

async function AccountNav() {
  const user = await getCurrentUser();

  if (!user || user.demo) {
    return (
      <div className="flex items-center gap-2">
        <Link
          href="/entrar"
          className="rounded-lg px-4 py-2.5 text-sm text-muted transition-colors hover:text-fg"
        >
          Entrar
        </Link>
        <Link
          href="/registro"
          className="rounded-lg bg-accent px-4 py-2.5 text-sm font-bold text-accent-ink transition-opacity hover:opacity-90"
        >
          Crear cuenta
        </Link>
      </div>
    );
  }

  return <UserMenu name={user.name} />;
}

export function Header() {
  return (
    <header className="sticky top-0 z-10 border-b border-line bg-ink/90 backdrop-blur">
      <div className="mx-auto flex h-[80px] max-w-[1400px] items-center gap-6 px-5">
        <Link
          href="/"
          className="shrink-0 font-display text-[26px] font-extrabold tracking-tight"
          aria-label="Lernze — inicio"
        >
          lernze<span className="text-accent">.</span>
        </Link>

        <Suspense fallback={<div className="h-5 w-64 animate-pulse rounded bg-surface" />}>
          <CategoryNav />
        </Suspense>

        <div className="flex-1" />

        <Suspense fallback={<div className="h-9 w-48 animate-pulse rounded-xl bg-surface" />}>
          <SearchBar />
        </Suspense>

        <Suspense
          fallback={<div className="h-9 w-28 animate-pulse rounded-lg bg-surface" />}
        >
          <AccountNav />
        </Suspense>
      </div>
    </header>
  );
}
