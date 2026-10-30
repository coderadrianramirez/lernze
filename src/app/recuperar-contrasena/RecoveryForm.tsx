"use client";
import Link from "next/link";
import { useActionState } from "react";
import { requestRecoveryAction, resetPasswordAction } from "./actions";
const field =
  "mt-1.5 w-full rounded-xl border border-line bg-surface-2 px-3.5 py-3 text-fg focus:border-accent focus:outline-none";
export function RecoveryForm({
  reset = false,
  next = "/",
}: {
  reset?: boolean;
  next?: string;
}) {
  const [state, action, pending] = useActionState(
    reset ? resetPasswordAction : requestRecoveryAction,
    {},
  );
  return (
    <form action={action} className="mt-6 grid gap-4">
      <input type="hidden" name="next" value={next} />
      {!state.saved &&
        (reset ? (
          <>
            <label className="text-sm" htmlFor="recovery-password">
              Nueva contraseña
              <input
                id="recovery-password"
                name="password"
                type="password"
                autoComplete="new-password"
                minLength={8}
                maxLength={128}
                required
                className={field}
              />
            </label>
            <label className="text-sm" htmlFor="recovery-confirm">
              Repite la nueva contraseña
              <input
                id="recovery-confirm"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                className={field}
              />
            </label>
            <p className="text-xs text-muted">Usa al menos 8 caracteres.</p>
          </>
        ) : (
          <label className="text-sm" htmlFor="recovery-email">
            Correo de tu cuenta
            <input
              id="recovery-email"
              name="email"
              type="email"
              autoComplete="email"
              maxLength={254}
              required
              className={field}
            />
          </label>
        ))}
      {state.error && (
        <p role="alert" className="text-sm text-bad">
          {state.error}
        </p>
      )}
      {state.notice && (
        <p
          role="status"
          className="rounded-xl border border-line bg-surface p-4 text-sm text-fg"
        >
          {state.notice}
        </p>
      )}
      {!state.saved && (
        <button
          disabled={pending}
          className="cursor-pointer rounded-xl bg-accent px-5 py-3 font-bold text-accent-ink disabled:opacity-50"
        >
          {pending
            ? "Un momento…"
            : reset
              ? "Guardar contraseña"
              : "Enviar enlace"}
        </button>
      )}
      {reset && !state.saved && (
        <Link href="/recuperar-contrasena" className="text-sm text-accent">
          Solicitar otro enlace
        </Link>
      )}
      <Link
        href={"/entrar?next=" + encodeURIComponent(next)}
        className="text-sm font-semibold text-accent"
      >
        Volver a iniciar sesión
      </Link>
    </form>
  );
}
