import { redirect } from "next/navigation";
import { Suspense } from "react";
import type { Metadata } from "next";
import { getCurrentUser, safeNext } from "@/lib/auth";
import { getUserInterests } from "@/lib/data";
import { InterestPicker } from "./InterestPicker";
import { NoTabBar } from "@/components/MobileTabBar";

export const metadata: Metadata = { title: "¿Qué te interesa aprender?" };

export default function BienvenidaPage({ searchParams }: PageProps<"/bienvenida">) {
  return (
    <main className="flex min-h-[calc(100svh-64px)] items-center justify-center px-4 py-10">
      <NoTabBar />
      <Suspense fallback={<div className="h-80 w-full max-w-xl animate-pulse rounded-2xl bg-surface" />}>
        <Gate searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function Gate({ searchParams }: { searchParams: PageProps<"/bienvenida">["searchParams"] }) {
  const user = await getCurrentUser();
  if (!user || user.demo) redirect("/registro");
  const sp = await searchParams;
  const next = safeNext(typeof sp.next === "string" ? sp.next : null, "/");
  const current = (await getUserInterests(user.id)) ?? [];
  return <InterestPicker name={user.name} initial={current} next={next} />;
}
