import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthForm } from "../auth/AuthForm";
import { NOUN } from "@/lib/copy";
import { safeNext } from "@/lib/auth";

export const metadata: Metadata = { title: "Crear cuenta" };

export default function SignUpPage({ searchParams }: PageProps<"/registro">) {
  return (
    <main className="mx-auto max-w-[420px] px-4 pt-10 pb-12">
      <h1 className="font-display text-[34px] leading-[1.05] font-extrabold tracking-tight">Crea tu cuenta</h1>
      <p className="mt-2 mb-6 text-muted">{`Compra ${NOUN.other} o publica los tuyos desde la misma cuenta.`}</p>
      <Suspense fallback={<div className="h-72 animate-pulse rounded-xl bg-surface" />}>
        <Form searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function Form({ searchParams }: { searchParams: PageProps<"/registro">["searchParams"] }) {
  const sp = await searchParams;
  const next = safeNext(typeof sp.next === "string" ? sp.next : undefined, "/");
  return <AuthForm mode="signup" next={next} />;
}
