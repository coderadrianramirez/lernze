"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { CATEGORIES } from "@/lib/types";

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
        <Link href="/" className={chip(isHome)} aria-current={isHome ? "page" : undefined}>
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
    <nav aria-label="Categorías" className="flex items-center gap-5">
      <Link href="/" className={linkClass(isHome)} aria-current={isHome ? "page" : undefined}>
        Inicio
      </Link>
      {CATEGORIES.map((cat) => (
        <Link
          key={cat}
          href={catHref(cat)}
          scroll={false}
          className={linkClass(active === cat)}
          aria-current={active === cat ? "page" : undefined}
        >
          {cat}
        </Link>
      ))}
    </nav>
  );
}
