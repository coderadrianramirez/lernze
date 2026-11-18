"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { CATEGORIES } from "@/lib/types";

export function DiscoverNavLink() {
  const active = usePathname() === "/descubrir";

  return (
    <Link
      href="/descubrir"
      aria-current={active ? "page" : undefined}
      className={`inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl border px-3 text-sm font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent ${
        active ? "border-accent bg-accent text-accent-ink" : "border-accent/40 bg-accent/10 text-accent hover:border-accent hover:bg-accent/20"
      }`}
    >
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="m9 6 10 6-10 6V6ZM4 5v14" />
      </svg>
      Descubrir
    </Link>
  );
}

const catHref = (cat: string) => `/?${new URLSearchParams({ i: cat }).toString()}`;

/** `bar`: enlaces del header en escritorio. `chips`: tira deslizable bajo el header en móvil. */
export function CategoryNav({ variant = "bar" }: { variant?: "bar" | "chips" }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const active = searchParams.get("i");
  const isHome = pathname === "/" && !active;

  if (variant === "chips") {
    if (pathname !== "/") return null;
    const chip = (on: boolean) =>
      `shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium whitespace-nowrap transition-colors ${
        on ? "border-fg bg-fg text-ink" : "border-line text-muted active:bg-surface"
      }`;
    return (
      <nav aria-label="Categorías" className="no-scrollbar lz-fade-x flex gap-2 overflow-x-auto px-4 pb-3">
        <Link href="/?vista=catalogo" className={chip(isHome)} aria-current={isHome ? "page" : undefined}>
          Todo
        </Link>
        {CATEGORIES.map((cat) => (
          <Link
            key={cat}
            href={catHref(cat)}
            scroll={false}
            className={chip(active === cat)}
            aria-current={active === cat ? "page" : undefined}
          >
            {cat}
          </Link>
        ))}
      </nav>
    );
  }

  const linkClass = (on: boolean) =>
    `text-base font-medium whitespace-nowrap transition-colors ${on ? "text-fg" : "text-muted hover:text-fg/80"}`;

  return (
    <nav aria-label="Categorías" className="flex items-center gap-4">
      <Link href="/" className={linkClass(isHome)} aria-current={isHome ? "page" : undefined}>
        Inicio
      </Link>
      {CATEGORIES.map((cat) => (
        <Link
          key={cat}
          href={catHref(cat)}
          scroll={false}
          className={`${linkClass(active === cat)} hidden xl:inline`}
          aria-current={active === cat ? "page" : undefined}
        >
          {cat}
        </Link>
      ))}
    </nav>
  );
}
