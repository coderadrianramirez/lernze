"use client";

import { useActionState } from "react";
import { subscribeAction, type NewsletterState } from "@/app/actions/newsletter";

export function NewsletterForm() {
  const [state, action, pending] = useActionState<NewsletterState, FormData>(subscribeAction, {});

  if (state.ok) {
    return (
      <p role="status" className="flex items-center gap-2 rounded-xl bg-good/12 px-4 py-3.5 text-sm text-good">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M3 8.5l3 3 7-7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {state.ok}
      </p>
    );
  }

  return (
    <form action={action} noValidate>
      <div className="flex gap-2 rounded-xl border border-line bg-ink p-1.5 transition-colors focus-within:border-accent">
        <label htmlFor="newsletter-email" className="sr-only">
          Tu correo
        </label>
        <input
          id="newsletter-email"
          type="email"
          name="email"
          required
          autoComplete="email"
          placeholder="tu@correo.com"
          aria-invalid={state.error ? true : undefined}
          aria-describedby={state.error ? "newsletter-error" : undefined}
          className="min-w-0 flex-1 bg-transparent px-3 text-sm text-fg placeholder:text-muted/60 focus:outline-none"
        />
        <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
        <button
          disabled={pending}
          className="shrink-0 cursor-pointer rounded-lg bg-accent px-4 py-2.5 text-sm font-bold text-accent-ink transition hover:brightness-110 disabled:opacity-60"
        >
          {pending ? "Enviando…" : "Suscribirme"}
        </button>
      </div>
      {state.error && (
        <p id="newsletter-error" role="alert" className="mt-2 text-xs text-bad">
          {state.error}
        </p>
      )}
    </form>
  );
}
