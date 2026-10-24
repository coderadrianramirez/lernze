import Link from "next/link";
import { Suspense } from "react";
import { signOutAction } from "@/app/auth/actions";
import { getCurrentUser } from "@/lib/auth";
import { NOUN } from "@/lib/copy";

async function AccountNav() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <Link href="/entrar" className="rounded-lg px-3 py-2 text-muted hover:text-fg">
          Entrar
        </Link>
        <Link href="/registro" className="rounded-lg bg-accent px-3.5 py-2 font-bold text-accent-ink">
          Crear cuenta
        </Link>
      </div>
    );
  }
  if (user.demo) {
    return (
      <span className="hidden rounded-full bg-surface-2 px-3 py-1 text-xs text-muted sm:inline">
        Modo demo · sin cuenta
      </span>
    );
  }
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="hidden max-w-[160px] truncate text-muted sm:inline">{user.name}</span>
      <form action={signOutAction}>
        <button className="cursor-pointer rounded-lg bg-surface-2 px-3 py-2 hover:text-accent">Salir</button>
      </form>
    </div>
  );
}

export function Header() {
  return (
    <header className="sticky top-0 z-10 border-b border-line bg-ink/90 backdrop-blur">
      <div className="mx-auto flex max-w-[1180px] items-center gap-5 px-4 py-3">
        <Link href="/" className="font-display text-2xl font-extrabold tracking-tight">
          lernze<span className="text-accent">.</span>
        </Link>
        <nav aria-label="Principal" className="flex flex-1 gap-1 text-[15px] text-muted">
          <Link href="/" className="rounded-lg px-3 py-2 hover:text-fg">
            Descubrir
          </Link>
          <Link href="/crear" className="rounded-lg px-3 py-2 hover:text-fg">
            Crear {NOUN.one}
          </Link>
        </nav>
        <Suspense fallback={<div className="h-9 w-24 animate-pulse rounded-lg bg-surface" />}>
          <AccountNav />
        </Suspense>
      </div>
    </header>
  );
}
