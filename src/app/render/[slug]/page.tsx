import { notFound } from "next/navigation";
import { RenderTrailer } from "@/components/RenderTrailer";
import { DEMO_PROGRAMS } from "@/lib/demo-programs";

/** Solo para grabar los videos de prueba en local: con ENABLE_RENDER=1. En producción responde 404. */
export function generateStaticParams() {
  return DEMO_PROGRAMS.map((p) => ({ slug: p.slug }));
}

export default async function RenderPage({ params }: PageProps<"/render/[slug]">) {
  const { slug } = await params;
  const course = DEMO_PROGRAMS.find((p) => p.slug === slug);
  if (process.env.ENABLE_RENDER !== "1" || !course) notFound();
  return <RenderTrailer course={course} />;
}
