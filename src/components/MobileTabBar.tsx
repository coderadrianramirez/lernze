"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";

const TABS = [
  { href: "/", label: "Inicio", icon: "M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" },
  { href: "/buscar", label: "Buscar", icon: "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-3.5-3.5" },
  { href: "/ofertas", label: "Ofertas", icon: "M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8zM7.5 7.5h.01" },
  { href: "/dashboard", label: "Cuenta", icon: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0" },
];

/**
 * Barra de pestañas fija en móvil. Una página la oculta renderizando `<NoTabBar />`
 * (lo resuelve el CSS, así el layout no necesita leer la ruta).
 */
export function MobileTabBar() {
  return (
    <Suspense fallback={<Bar pathname={null} />}>
      <LiveBar />
    </Suspense>
  );
}

export function NoTabBar() {
  return <span data-no-tabbar hidden />;
}

function LiveBar() {
  return <Bar pathname={usePathname()} />;
}

function Bar({ pathname }: { pathname: string | null }) {
  const isActive = (href: string) =>
    pathname !== null && (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <>
      <div aria-hidden className="lz-tabbar h-[calc(64px+env(safe-area-inset-bottom))] md:hidden" />
      <nav
        aria-label="Navegación principal"
        className="lz-tabbar fixed inset-x-0 bottom-0 z-30 border-t border-line bg-ink/92 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
      >
        <ul className="grid h-16 grid-cols-4">
          {TABS.map((t) => {
            const on = isActive(t.href);
            return (
              <li key={t.href}>
                <Link
                  href={t.href}
                  aria-current={on ? "page" : undefined}
                  className={`flex h-full flex-col items-center justify-center gap-1 text-[11px] font-semibold transition-colors ${
                    on ? "text-accent" : "text-muted active:text-fg"
                  }`}
                >
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill={on && t.label === "Inicio" ? "currentColor" : "none"}
                    stroke="currentColor"
                    strokeWidth="1.9"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                  >
                    <path d={t.icon} />
                  </svg>
                  {t.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
