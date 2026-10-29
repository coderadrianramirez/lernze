"use client";

import Link from "next/link";
import { useRef, useState, useEffect } from "react";
import { signOutAction } from "@/app/auth/actions";

interface Props {
  name: string;
}

export function UserMenu({ name }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const initial = name.charAt(0).toUpperCase();

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Menú de cuenta"
        aria-expanded={open}
        className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-accent text-sm font-bold text-accent-ink transition-opacity hover:opacity-80"
      >
        {initial}
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-50 min-w-[180px] rounded-xl border border-line bg-surface-2 py-1 shadow-xl">
          <div className="border-b border-line px-4 py-2.5">
            <p className="text-xs text-muted">Conectado como</p>
            <p className="truncate text-sm font-semibold text-fg">{name}</p>
          </div>

          <Link
            href="/dashboard"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-fg transition-colors hover:bg-surface hover:text-accent"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
              <circle cx="8" cy="5.5" r="3" stroke="currentColor" strokeWidth="1.5" />
              <path d="M2.5 14.5a5.5 5.5 0 0 1 11 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            Mi cuenta
          </Link>

          <Link
            href="/crear"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-fg transition-colors hover:bg-surface hover:text-accent"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
              <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            Crear programa
          </Link>

          <div className="my-1 border-t border-line" />

          <form action={signOutAction}>
            <button
              type="submit"
              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-muted transition-colors hover:bg-surface hover:text-fg"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                <path d="M6 2H3a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M10.5 5L14 8l-3.5 3M14 8H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Cerrar sesión
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
