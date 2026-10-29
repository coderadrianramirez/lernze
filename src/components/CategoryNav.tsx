"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { CATEGORIES } from "@/lib/types";

export function CategoryNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const active = searchParams.get("i");

  const isHome = pathname === "/" && !active;

  const catHref = (cat: string) => {
    const p = new URLSearchParams();
    p.set("i", cat);
    return `/?${p.toString()}`;
  };

  const linkClass = (on: boolean) =>
    `text-base font-medium whitespace-nowrap transition-colors ${
      on ? "text-fg" : "text-muted hover:text-fg/80"
    }`;

  return (
    <nav className="flex items-center gap-5 overflow-x-auto">
      <Link href="/" className={linkClass(isHome)}>
        Inicio
      </Link>
      {CATEGORIES.map((cat) => (
        <Link key={cat} href={catHref(cat)} scroll={false} className={linkClass(active === cat)}>
          {cat}
        </Link>
      ))}
    </nav>
  );
}
