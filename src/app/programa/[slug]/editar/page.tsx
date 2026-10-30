import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { NoTabBar } from "@/components/MobileTabBar";
import { ProgramNav } from "@/components/ProgramNav";
import { getCurrentUser } from "@/lib/auth";
import { getOwnedProgram } from "@/lib/program-management";
import { CreateCourseForm } from "@/app/crear/CreateCourseForm";

export const metadata = { title: "Editar programa" };
export default function EditPage({
  params,
}: PageProps<"/programa/[slug]/editar">) {
  return (
    <main className="mx-auto max-w-[760px] px-4 pt-6 pb-16 md:pt-10">
      <NoTabBar />
      <Suspense
        fallback={<div className="h-80 animate-pulse rounded-2xl bg-surface" />}
      >
        <Editor params={params} />
      </Suspense>
    </main>
  );
}
async function Editor({
  params,
}: {
  params: PageProps<"/programa/[slug]/editar">["params"];
}) {
  const { slug } = await params;
  const user = await getCurrentUser();
  if (!user || user.demo)
    redirect(`/entrar?next=${encodeURIComponent(`/programa/${slug}/editar`)}`);
  const course = await getOwnedProgram(slug, user.id);
  if (!course) notFound();
  return (
    <>
      <ProgramNav course={course} step="editar" />
      <h2 className="mb-1 font-display text-xl font-bold">
        Información del programa
      </h2>
      <p className="mb-6 text-sm text-muted">
        Presenta lo que enseñas. El enlace de tu programa se mantiene aunque
        cambies el título.
      </p>
      <CreateCourseForm
        key={course.id}
        course={course}
        defaultName={course.creatorName}
        canUpload
      />
    </>
  );
}
