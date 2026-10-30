"use client";

import {
  startTransition,
  useActionState,
  useId,
  useRef,
  useState,
} from "react";
import { changeEmailAction, type SettingsState } from "./actions";

export function EmailSettings({
  email,
  pendingEmail,
}: {
  email: string;
  pendingEmail: string | null;
}) {
  const [editing, setEditing] = useState(false);
  const [notice, setNotice] = useState("");
  const trigger = useRef<HTMLButtonElement>(null);
  const id = useId();

  function close() {
    setEditing(false);
    requestAnimationFrame(() => trigger.current?.focus());
  }

  return (
    <section className="min-w-0 rounded-2xl border border-line bg-surface p-4 sm:p-6">
      <h2 className="font-display text-xl font-bold">Correo electrónico</h2>
      <p className="mt-2 break-all text-sm text-muted">
        Correo actual: <span className="text-fg">{email}</span>
      </p>
      {pendingEmail && (
        <p className="mt-2 break-all text-xs text-accent">
          Pendiente de confirmación: {pendingEmail}
        </p>
      )}
      <button
        ref={trigger}
        type="button"
        aria-expanded={editing}
        aria-controls={editing ? id : undefined}
        onClick={() => {
          setNotice("");
          setEditing(true);
        }}
        hidden={editing}
        className="mt-4 cursor-pointer rounded-xl border border-line px-4 py-3 text-sm font-semibold"
      >
        Cambiar correo
      </button>
      {editing && (
        <EmailChangeForm
          id={id}
          onCancel={close}
          onSaved={(message) => {
            setNotice(message);
            close();
          }}
        />
      )}
      {notice && (
        <p role="status" className="mt-3 text-sm text-good">
          {notice}
        </p>
      )}
    </section>
  );
}

function EmailChangeForm({
  id,
  onCancel,
  onSaved,
}: {
  id: string;
  onCancel: () => void;
  onSaved: (message: string) => void;
}) {
  const [value, setValue] = useState("");
  const [state, save, pending] = useActionState(
    async (previous: SettingsState, form: FormData) => {
      const result = await changeEmailAction(previous, form);
      if (result.saved) onSaved(result.notice ?? "Solicitud enviada.");
      return result;
    },
    {},
  );

  return (
    <form
      id={id}
      className="mt-5 border-t border-line pt-5"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        startTransition(() => save(form));
      }}
    >
      <label className="block text-sm font-medium" htmlFor={id + "-email"}>
        Nuevo correo
      </label>
      <input
        autoFocus
        type="email"
        autoComplete="email"
        id={id + "-email"}
        name="email"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        required
        disabled={pending}
        aria-invalid={!!state.error}
        aria-describedby={
          id + "-help" + (state.error ? " " + id + "-error" : "")
        }
        className="mt-1.5 w-full rounded-xl border border-line bg-surface-2 px-3.5 py-3 text-sm text-fg focus:border-accent focus:outline-none"
      />
      <p id={id + "-help"} className="mt-2 text-xs text-muted">
        Te indicaremos cómo confirmar el cambio antes de usar el nuevo correo.
      </p>
      {state.error && (
        <p id={id + "-error"} role="alert" className="mt-3 text-sm text-bad">
          {state.error}
        </p>
      )}
      <div className="mt-5 flex flex-wrap gap-2">
        <button
          disabled={pending}
          className="cursor-pointer rounded-xl bg-accent px-4 py-3 text-sm font-bold text-accent-ink disabled:opacity-50"
        >
          {pending ? "Solicitando…" : "Solicitar cambio de correo"}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={onCancel}
          className="cursor-pointer rounded-xl border border-line px-4 py-3 text-sm font-semibold disabled:opacity-50"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
