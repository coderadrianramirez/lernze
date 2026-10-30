import Image from "next/image";
import Link from "next/link";
import { Stage } from "@/components/Stage";
import { DEMO_PROGRAMS } from "@/lib/demo-programs";
import { NoTabBar } from "@/components/MobileTabBar";
import { ShowFooterOnMobile } from "@/components/Footer";
export const metadata = {
  title: "Prueba de portadas",
  robots: { index: false, follow: false },
};
const examples = [
  { slug: "abre-tu-negocio-online", image: "negocio-online" },
  { slug: "barberia-pro", image: "barberia" },
  { slug: "tiktok-shop-con-ia", image: "tiktok-ia" },
];
export default function Page() {
  return (
    <main className="mx-auto max-w-[1280px] px-4 pt-8 pb-16 md:px-8">
      <NoTabBar />
      <ShowFooterOnMobile />
      <Link href="/" className="text-sm text-muted">
        ← Descubrir
      </Link>
      <p className="mt-8 text-xs font-bold tracking-widest text-accent uppercase">
        Prueba visual
      </p>
      <h1 className="mt-2 font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
        Una imagen. Tu programa.
      </h1>
      <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted">
        Tres ejemplos con imágenes creadas para el tema de cada trailer. El
        título y el color siguen usando el diseño de Lernze. Son imágenes
        ilustrativas; no representan a los creadores.
      </p>
      <div className="mt-9 grid gap-8 lg:grid-cols-3">
        {examples.map(({ slug, image }) => {
          const course = DEMO_PROGRAMS.find((c) => c.slug === slug)!;
          return (
            <article key={slug} className="min-w-0">
              <Stage
                course={course}
                className="aspect-video rounded-2xl border border-line"
                under={
                  <Image
                    src={"/images/cover-previews/" + image + ".webp"}
                    alt=""
                    fill
                    loading="eager"
                    sizes="(min-width:1024px) 400px, 100vw"
                    className="object-cover"
                  />
                }
              />
              <h2 className="mt-4 font-display text-xl font-bold">
                {course.title}
              </h2>
              <p className="mt-1 text-sm text-muted">
                {course.category} · Ejemplo de portada horizontal
              </p>
              <details className="mt-4">
                <summary className="cursor-pointer text-sm font-semibold text-accent">
                  Ver portada vertical
                </summary>
                <Stage
                  course={course}
                  mode="v"
                  className="aspect-[2/3] mt-4 max-w-[300px] rounded-2xl border border-line"
                  under={
                    <Image
                      src={"/images/cover-previews/" + image + ".png"}
                      alt=""
                      fill
                      sizes="800px"
                      className="object-cover"
                      style={{ objectPosition: "65% center" }}
                    />
                  }
                />
              </details>
            </article>
          );
        })}
      </div>
    </main>
  );
}
