import { Suspense } from "react";
import { NoTabBar } from "@/components/MobileTabBar";
import { safeNext } from "@/lib/auth";
import { RecoveryForm } from "./RecoveryForm";
export const metadata = { title: "Recuperar contraseña" };
export default function Page({
  searchParams,
}: PageProps<"/recuperar-contrasena">) {
  return (
    <main className="mx-auto max-w-[420px] px-4 pt-10 pb-16">
      <NoTabBar />
      <h1 className="font-display text-[34px] leading-tight font-extrabold">
        Recupera tu acceso
      </h1>
      <p className="mt-3 text-sm text-muted">
        Te enviaremos un enlace para crear una nueva contraseña. Ábrelo en este
        mismo navegador.
      </p>
      <Suspense fallback={<p className="mt-6 text-muted">Cargando…</p>}>
        <Form searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
async function Form({
  searchParams,
}: {
  searchParams: PageProps<"/recuperar-contrasena">["searchParams"];
}) {
  const sp = await searchParams;
  return (
    <>
      {sp.error && (
        <p role="alert" className="mt-4 text-sm text-bad">
          El enlace venció o ya se usó. Solicita uno nuevo.
        </p>
      )}
      <RecoveryForm
        next={safeNext(typeof sp.next === "string" ? sp.next : undefined, "/")}
      />
    </>
  );
}
