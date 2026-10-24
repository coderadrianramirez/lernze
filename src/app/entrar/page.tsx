import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthForm } from "../auth/AuthForm";
import { safeNext } from "@/lib/auth";

export const metadata: Metadata = { title: "Entrar" };

export default function SignInPage({ searchParams }: PageProps<"/entrar">) {
  return (
    <main className="mx-auto max-w-[420px] px-4 pt-10 pb-12">
      <h1 className="font-display text-[34px] leading-[1.05] font-extrabold tracking-tight">Entrar a Lernze</h1>
      <p className="mt-2 mb-6 text-muted">Accede a tus cursos y a tu panel de creador.</p>
      <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-surface" />}>
        <Form searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function Form({ searchParams }: { searchParams: PageProps<"/entrar">["searchParams"] }) {
  const sp = await searchParams;
  const next = safeNext(typeof sp.next === "string" ? sp.next : undefined, "/");
  const notice = sp.error === "enlace" ? "El enlace del correo venció o ya se usó. Inicia sesión o regístrate otra vez." : undefined;
  return <AuthForm mode="signin" next={next} notice={notice} />;
}
