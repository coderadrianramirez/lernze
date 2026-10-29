"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export function SearchField({ initial }: { initial: string }) {
  const router = useRouter();
  const [value, setValue] = useState(initial);
  const timer = useRef<number | undefined>(undefined);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!initial) input.current?.focus();
    return () => window.clearTimeout(timer.current);
  }, [initial]);

  const go = (q: string) => {
    const t = q.trim();
    router.replace(t ? `/buscar?q=${encodeURIComponent(t)}` : "/buscar", { scroll: false });
  };

  const change = (q: string) => {
    setValue(q);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => go(q), 280);
  };

  return (
    <form
      role="search"
      action="/buscar"
      onSubmit={(e) => {
        e.preventDefault();
        window.clearTimeout(timer.current);
        go(value);
        input.current?.blur();
      }}
      className="relative"
    >
      <svg
        className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-muted"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        aria-hidden
      >
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
      <input
        ref={input}
        type="search"
        name="q"
        value={value}
        onChange={(e) => change(e.target.value)}
        enterKeyHint="search"
        autoComplete="off"
        placeholder="Programas, creadores o temas"
        aria-label="Buscar programas"
        className="h-13 w-full rounded-2xl border border-line bg-surface pr-12 pl-12 text-base text-fg placeholder:text-muted/60 focus:border-accent focus:outline-none [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button
          type="button"
          aria-label="Borrar búsqueda"
          onClick={() => {
            change("");
            input.current?.focus();
          }}
          className="absolute top-1/2 right-3 flex h-8 w-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-muted active:bg-surface-2"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
      )}
    </form>
  );
}
