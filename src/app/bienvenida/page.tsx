import { redirect } from "next/navigation";
import { Suspense } from "react";
import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { InterestPicker } from "./InterestPicker";
import { NoTabBar } from "@/components/MobileTabBar";

export const metadata: Metadata = { title: "¿Qué te interesa aprender?" };

export default function BienvenidaPage() {
  return (
    <main className="flex min-h-[calc(100vh-64px)] items-center justify-center px-4 py-12">
      <NoTabBar />
      <Suspense fallback={<div className="h-80 w-full max-w-xl animate-pulse rounded-2xl bg-surface" />}>
        <Gate />
      </Suspense>
    </main>
  );
}

async function Gate() {
  const user = await getCurrentUser();
  if (!user || user.demo) redirect("/registro");
  return <InterestPicker userId={user.id} name={user.name} />;
}
