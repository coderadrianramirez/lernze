"use client";

import { usePathname } from "next/navigation";

export function SearchBar() {
  if (usePathname() === "/buscar") return null;
  return (
    <form
      action="/buscar"
      method="GET"
      role="search"
      className="relative flex w-full items-center"
    >
      <span className="pointer-events-none absolute left-3 text-muted" aria-hidden>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.5" />
          <path d="M10.5 10.5L13.5 13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </span>
      <input
        type="search"
        name="q"
        placeholder="Buscar programas o creadores…"
        aria-label="Buscar"
        className="w-full rounded-xl border border-line bg-surface py-2 pl-9 pr-3 text-sm text-fg placeholder:text-muted/60 transition-colors hover:border-line/80 focus:border-accent focus:bg-surface-2 focus:outline-none"
      />
    </form>
  );
}
