import { Suspense } from "react";
import Link from "next/link";
import { NoTabBar } from "@/components/MobileTabBar";
import { createSessionClient } from "@/lib/supabase/server";
import { safeNext } from "@/lib/auth";
import { isRecoverySession } from "@/lib/password-recovery";
import { RecoveryForm } from "../recuperar-contrasena/RecoveryForm";
export const metadata = { title: "Nueva contraseña" };
export default function Page({
  searchParams,
}: PageProps<"/restablecer-contrasena">) {
  return (
    <main className="mx-auto max-w-[420px] px-4 pt-10 pb-16">
      <NoTabBar />
      <h1 className="font-display text-[34px] leading-tight font-extrabold">
        Nueva contraseña
      </h1>
      <Suspense
        fallback={<p className="mt-6 text-muted">Comprobando tu enlace…</p>}
      >
        <Form searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
async function Form({
  searchParams,
}: {
  searchParams: PageProps<"/restablecer-contrasena">["searchParams"];
}) {
  const sp = await searchParams;
  const db = await createSessionClient();
  const [user, claims] = await Promise.all([
    db.auth.getUser(),
    db.auth.getClaims(),
  ]);
  if (
    user.error ||
    claims.error ||
    !user.data.user ||
    !isRecoverySession(claims.data?.claims, user.data.user.id)
  )
    return (
      <div className="mt-6">
        <p className="text-sm text-muted">
          El enlace venció o no es válido. Solicita uno nuevo para recuperar tu
          acceso.
        </p>
        <Link
          href="/recuperar-contrasena"
          className="mt-5 inline-block rounded-xl bg-accent px-4 py-3 text-sm font-bold text-accent-ink"
        >
          Solicitar nuevo enlace
        </Link>
      </div>
    );
  return (
    <RecoveryForm
      reset
      next={safeNext(typeof sp.next === "string" ? sp.next : undefined, "/")}
    />
  );
}
