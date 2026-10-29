import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

const DOCS = {
  terminos: {
    title: "Términos y condiciones",
    about: "las reglas para usar Lernze, comprar programas y publicar como creador",
  },
  privacidad: {
    title: "Política de privacidad",
    about: "qué datos guardamos, para qué los usamos y cómo puedes pedir que los borremos",
  },
  cookies: {
    title: "Política de cookies",
    about: "qué cookies usa Lernze para mantener tu sesión iniciada y recordar tus preferencias",
  },
} as const;

type Doc = keyof typeof DOCS;

export function generateStaticParams() {
  return Object.keys(DOCS).map((doc) => ({ doc }));
}

export async function generateMetadata({ params }: PageProps<"/legal/[doc]">): Promise<Metadata> {
  const { doc } = await params;
  return { title: DOCS[doc as Doc]?.title ?? "Legal" };
}

export default async function LegalPage({ params }: PageProps<"/legal/[doc]">) {
  const { doc } = await params;
  const page = DOCS[doc as Doc];
  if (!page) notFound();

  return (
    <main className="mx-auto max-w-[760px] px-5 pt-14 pb-20">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted">Legal</p>
      <h1 className="mt-2 font-display text-[clamp(28px,4vw,40px)] font-extrabold tracking-tight">{page.title}</h1>
      <div className="mt-8 rounded-2xl border border-line bg-surface p-6">
        <p className="leading-relaxed text-[#cfd0da]">
          Estamos preparando este documento. Aquí vas a encontrar {page.about}.
        </p>
        <p className="mt-3 text-sm text-muted">Lo publicaremos antes del lanzamiento oficial de Lernze.</p>
      </div>
      <nav aria-label="Otros documentos legales" className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm">
        {(Object.keys(DOCS) as Doc[])
          .filter((d) => d !== doc)
          .map((d) => (
            <Link key={d} href={`/legal/${d}`} className="text-muted transition-colors hover:text-accent">
              {DOCS[d].title} →
            </Link>
          ))}
      </nav>
    </main>
  );
}
