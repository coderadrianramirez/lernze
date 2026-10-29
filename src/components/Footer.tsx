import Link from "next/link";
import { NOUN } from "@/lib/copy";
import { CATEGORIES } from "@/lib/types";

/** Redes oficiales de Lernze. Sin dirección, el ícono se muestra pero no enlaza. */
const SOCIAL: { name: string; href: string; icon: string }[] = [
  {
    name: "Instagram",
    href: "",
    icon: "M12 7.3a4.7 4.7 0 1 0 0 9.4 4.7 4.7 0 0 0 0-9.4Zm0 7.7a3 3 0 1 1 0-6 3 3 0 0 1 0 6Zm6-7.9a1.1 1.1 0 1 1-2.2 0 1.1 1.1 0 0 1 2.2 0ZM12 4c2.6 0 2.9 0 4 .1 2.6.1 3.8 1.3 3.9 3.9.1 1 .1 1.4.1 4s0 2.9-.1 4c-.1 2.6-1.3 3.8-3.9 3.9-1.1.1-1.4.1-4 .1s-2.9 0-4-.1c-2.6-.1-3.8-1.3-3.9-3.9C4 14.9 4 14.6 4 12s0-2.9.1-4C4.2 5.4 5.4 4.2 8 4.1 9.1 4 9.4 4 12 4Z",
  },
  {
    name: "TikTok",
    href: "",
    icon: "M16.6 5.8A4.3 4.3 0 0 1 15.5 3h-3.1v12.4a2.6 2.6 0 1 1-2.6-2.6c.3 0 .5 0 .8.1V9.7a5.7 5.7 0 1 0 4.9 5.7V9a7.3 7.3 0 0 0 4.3 1.4V7.3a4.3 4.3 0 0 1-3.2-1.5Z",
  },
  {
    name: "YouTube",
    href: "",
    icon: "M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4A2.5 2.5 0 0 0 2.4 7.2 26 26 0 0 0 2 12a26 26 0 0 0 .4 4.8 2.5 2.5 0 0 0 1.8 1.8c1.6.4 7.8.4 7.8.4s6.2 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8A26 26 0 0 0 22 12a26 26 0 0 0-.4-4.8ZM10 15V9l5.2 3L10 15Z",
  },
];

const EXPLORE = [
  { label: "Inicio", href: "/" },
  ...CATEGORIES.map((c) => ({ label: c, href: `/?i=${encodeURIComponent(c)}` })),
  { label: "Por menos de $100", href: "/ofertas" },
];

const LEGAL = [
  { label: "Términos", href: "/legal/terminos" },
  { label: "Privacidad", href: "/legal/privacidad" },
  { label: "Cookies", href: "/legal/cookies" },
];

export function Footer() {
  return (
    <footer className="mt-10 border-t border-line bg-[#0b0c12]">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-10 px-5 pt-12 pb-10 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-[340px]">
          <Link href="/" className="font-display text-[28px] font-extrabold tracking-tight" aria-label="Lernze — inicio">
            lernze<span className="text-accent">.</span>
          </Link>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            {`Aprende de creadores reales. Mira el trailer, elige tu ${NOUN.one} y únete a su comunidad.`}
          </p>
          <ul className="mt-5 flex gap-2.5" aria-label="Redes sociales">
            {SOCIAL.map((s) => {
              const icon = (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d={s.icon} />
                </svg>
              );
              const cls =
                "flex h-10 w-10 items-center justify-center rounded-full border border-line text-muted transition-colors hover:border-accent hover:text-accent";
              return (
                <li key={s.name}>
                  {s.href ? (
                    <a href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.name} className={cls}>
                      {icon}
                    </a>
                  ) : (
                    <span role="img" aria-label={s.name} title={s.name} className={cls}>
                      {icon}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        <nav aria-label="Explorar" className="lg:pt-2">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-fg lg:text-right">Explorar</h2>
          <ul className="mt-4 flex flex-wrap gap-x-7 gap-y-3 lg:justify-end">
            {EXPLORE.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-sm text-muted transition-colors hover:text-accent">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="border-t border-line">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-x-8 gap-y-4 px-5 py-5 text-xs text-muted">
          <p>© 2026 Lernze. Todos los derechos reservados.</p>
          <nav aria-label="Legal" className="flex flex-wrap gap-x-6 gap-y-2 md:mr-auto md:ml-4">
            {LEGAL.map((l) => (
              <Link key={l.href} href={l.href} className="transition-colors hover:text-accent">
                {l.label}
              </Link>
            ))}
          </nav>
          <label className="flex items-center gap-2">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
              <circle cx="12" cy="12" r="9" />
              <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
            </svg>
            <span className="sr-only">Idioma</span>
            <select
              defaultValue="es"
              className="w-28 cursor-pointer rounded-lg border border-line bg-surface py-1.5 pr-7 pl-2.5 text-xs text-fg focus:border-accent focus:outline-none"
            >
              <option value="es">Español</option>
              <option value="en" disabled>
                English (próximamente)
              </option>
            </select>
          </label>
        </div>
      </div>
    </footer>
  );
}
