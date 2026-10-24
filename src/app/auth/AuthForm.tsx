"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signInAction, signUpAction, type AuthState } from "./actions";

const field =
  "w-full rounded-xl border border-line bg-surface-2 px-3.5 py-3 text-fg placeholder:text-muted/70";

export function AuthForm({ mode, next, notice }: { mode: "signin" | "signup"; next: string; notice?: string }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(
    mode === "signin" ? signInAction : signUpAction,
    {},
  );
  const signup = mode === "signup";
  const other = signup ? "/entrar" : "/registro";
  const otherHref = next === "/" ? other : `${other}?next=${encodeURIComponent(next)}`;

  return (
    <form action={action} className="grid gap-4" noValidate>
      <input type="hidden" name="next" value={next} />
      {signup && (
        <div>
          <label htmlFor="name" className="mb-1.5 block text-sm">Tu nombre</label>
          <input id="name" name="name" autoComplete="name" className={field} />
        </div>
      )}
      <div>
        <label htmlFor="email" className="mb-1.5 block text-sm">Correo</label>
        <input id="email" name="email" type="email" autoComplete="email" className={field} placeholder="tu@correo.com" />
      </div>
      <div>
        <label htmlFor="password" className="mb-1.5 block text-sm">Contraseña</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete={signup ? "new-password" : "current-password"}
          className={field}
          placeholder={signup ? "Al menos 8 caracteres" : ""}
        />
      </div>

      <div role="status" aria-live="polite" className="min-h-5 text-sm">
        {(state.error || notice) && <span className="text-bad">{state.error ?? notice}</span>}
        {state.notice && <span className="text-good">{state.notice}</span>}
      </div>

      <button
        disabled={pending}
        className="cursor-pointer rounded-xl bg-accent px-5 py-3 font-bold text-accent-ink disabled:cursor-default disabled:opacity-60"
      >
        {pending ? "Un momento..." : signup ? "Crear cuenta" : "Entrar"}
      </button>

      <p className="text-sm text-muted">
        {signup ? "¿Ya tienes cuenta? " : "¿Aún no tienes cuenta? "}
        <Link href={otherHref} className="font-bold text-accent">
          {signup ? "Inicia sesión" : "Regístrate"}
        </Link>
      </p>
    </form>
  );
}
