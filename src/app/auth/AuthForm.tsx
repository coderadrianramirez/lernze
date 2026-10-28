"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signInAction, signUpAction, type AuthState } from "./actions";

const field =
  "w-full rounded-xl border border-line bg-surface-2 px-3.5 py-3 text-fg placeholder:text-muted/70";

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
    </svg>
  );
}

export function AuthForm({ mode, next, notice }: { mode: "signin" | "signup"; next: string; notice?: string }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(
    mode === "signin" ? signInAction : signUpAction,
    {},
  );
  const signup = mode === "signup";
  const other = signup ? "/entrar" : "/registro";
  const otherHref = next === "/" ? other : `${other}?next=${encodeURIComponent(next)}`;
  const googleHref = next === "/" ? "/auth/google" : `/auth/google?next=${encodeURIComponent(next)}`;

  return (
    <div className="grid gap-4">
      <a
        href={googleHref}
        className="flex items-center justify-center gap-3 rounded-xl border border-line bg-surface-2 px-5 py-3 text-sm font-medium text-fg transition-colors hover:bg-surface"
      >
        <GoogleIcon />
        Continuar con Google
      </a>

      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-line" />
        <span className="text-xs text-muted">o</span>
        <span className="h-px flex-1 bg-line" />
      </div>

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
    </div>
  );
}
