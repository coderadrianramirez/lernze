"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { followCreatorAction } from "./actions";

type Props = { creatorId: string; creatorName: string; followers: number; following: boolean; signedIn: boolean; own: boolean; ready: boolean; demo?: boolean };

export function FollowButton({ creatorId, creatorName, followers, following: initial, signedIn, own, ready, demo }: Props) {
  const [following, setFollowing] = useState(initial);
  const [count, setCount] = useState(followers);
  const [error, setError] = useState("");
  const [loginNeeded, setLoginNeeded] = useState(false);
  const [pending, start] = useTransition();
  const router = useRouter();
  const login = `/entrar?next=${encodeURIComponent(`/creador/${creatorId}`)}`;
  const cls = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent";

  function toggle() {
    start(async () => {
      setError("");
      try {
        const result = await followCreatorAction(creatorId, !following);
        if (result.error) { setError(result.error); setLoginNeeded(Boolean(result.requiresSignIn)); return; }
        setFollowing(result.following ?? false);
        setCount(result.followers ?? count);
        router.refresh();
      } catch { setError("No pudimos conectar. Vuelve a intentarlo."); }
    });
  }

  return (
    <div className="flex max-w-full flex-col items-start gap-2 sm:items-end">
      {own ? <Link href="/configuracion" className={`${cls} border border-line bg-surface hover:border-accent`}>Editar mi perfil</Link>
        : !ready ? <p className="text-sm text-muted">{demo ? "Este perfil de ejemplo no admite seguimiento." : "El seguimiento estará disponible en breve."}</p>
        : !signedIn ? <Link href={login} className={`${cls} bg-accent text-accent-ink hover:brightness-110`}>Seguir</Link>
        : <button type="button" disabled={pending} aria-pressed={following} aria-label={following ? `Siguiendo a ${creatorName}. Dejar de seguir` : `Seguir a ${creatorName}`} onClick={toggle} className={`${cls} disabled:cursor-wait disabled:opacity-60 ${following ? "border border-line bg-surface hover:border-accent" : "bg-accent text-accent-ink hover:brightness-110"}`}>{pending ? "Guardando…" : following ? "✓ Siguiendo" : "+ Seguir"}</button>}
      {ready && <p className="text-sm text-muted" aria-live="polite">{count.toLocaleString("es")} {count === 1 ? "seguidor" : "seguidores"}</p>}
      {error && <p role="alert" className="max-w-[32ch] text-sm text-bad">{error} {loginNeeded && <Link href={login} className="underline">Entrar</Link>}</p>}
    </div>
  );
}
