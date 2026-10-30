import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ShowFooterOnMobile } from "@/components/Footer";
import { NoTabBar } from "@/components/MobileTabBar";
import { getCurrentUser } from "@/lib/auth";
import { getUserInterests } from "@/lib/data";
import { createSessionClient } from "@/lib/supabase/server";
import { SettingsForms } from "./SettingsForms";

export const metadata = { title: "Configuración" };
export default function SettingsPage() {
  return (
    <main className="mx-auto max-w-[760px] px-4 pt-6 pb-16 md:pt-10">
      <NoTabBar />
      <ShowFooterOnMobile />
      <Link
        href="/dashboard"
        className="text-sm font-semibold text-muted hover:text-fg"
      >
        ← Mi cuenta
      </Link>
      <h1 className="mt-5 font-display text-3xl font-extrabold tracking-tight">
        Configuración
      </h1>
      <p className="mt-2 mb-7 text-sm text-muted">
        Tu perfil, tus preferencias y el acceso a tu cuenta.
      </p>
      <Suspense
        fallback={<div className="h-96 animate-pulse rounded-2xl bg-surface" />}
      >
        <Settings />
      </Suspense>
    </main>
  );
}
async function Settings() {
  const user = await getCurrentUser();
  if (!user || user.demo) redirect("/entrar?next=/configuracion");
  const db = await createSessionClient();
  const [profile, ready, interests, auth] = await Promise.all([
    db.from("profiles").select("*").eq("id", user.id).single(),
    db.rpc("account_settings_ready"),
    getUserInterests(user.id),
    db.auth.getUser(),
  ]);
  return (
    <SettingsForms
      user={user}
      avatarPath={profile.data?.avatar_path ?? null}
      ready={!ready.error && ready.data === true}
      interests={interests ?? []}
      pendingEmail={auth.data.user?.new_email ?? null}
      hasPassword={
        !!auth.data.user?.identities?.some((i) => i.provider === "email")
      }
    />
  );
}
