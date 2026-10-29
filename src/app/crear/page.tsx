import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { NoTabBar } from "@/components/MobileTabBar";
import { getCurrentUser } from "@/lib/auth";
import { NOUN } from "@/lib/copy";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { CreateCourseForm } from "./CreateCourseForm";

export const metadata: Metadata = { title: `Crear ${NOUN.one}` };

export default function CreatePage() {
  return (
    <main className="mx-auto max-w-[720px] px-4 pt-6 pb-12">
      <NoTabBar />
      <h1 className="font-display text-[clamp(28px,4vw,38px)] leading-[1.05] font-extrabold tracking-tight">
        Publica tu {NOUN.one}
      </h1>
      <p className="mt-2 mb-7 text-muted">
        {`Aparece en el Discover ante quien tenga interés en tu tema. Después de publicarlo agregas las clases.`}
      </p>
      <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-surface" />}>
        <Gate />
      </Suspense>
    </main>
  );
}

async function Gate() {
  const user = await getCurrentUser();
  if (!user) redirect("/entrar?next=/crear");
  return <CreateCourseForm defaultName={user.name} canUpload={isSupabaseConfigured && !user.demo} />;
}
