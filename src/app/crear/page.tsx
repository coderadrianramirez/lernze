import type { Metadata } from "next";
import { CreateCourseForm } from "./CreateCourseForm";

export const metadata: Metadata = { title: "Crear curso" };

export default function CreatePage() {
  return (
    <main className="mx-auto max-w-[720px] px-4 pt-6 pb-12">
      <h1 className="font-display text-[clamp(28px,4vw,38px)] leading-[1.05] font-extrabold tracking-tight">
        Publica tu curso
      </h1>
      <p className="mt-2 mb-7 text-muted">
        Aparece en el Discover feed ante quien tenga interés en tu tema.
      </p>
      <CreateCourseForm />
    </main>
  );
}
