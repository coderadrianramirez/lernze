"use client";
import { useActionState, useId, useRef, useState } from "react";
import {
  changePasswordAction,
  sendPasswordCodeAction,
  type SettingsState,
} from "./actions";
import { requestRecoveryAction } from "../recuperar-contrasena/actions";
const field =
  "mt-1.5 w-full rounded-xl border border-line bg-surface-2 px-3.5 py-3 text-sm text-fg focus:border-accent focus:outline-none";
const button =
  "cursor-pointer rounded-xl bg-accent px-4 py-3 text-sm font-bold text-accent-ink disabled:opacity-50";
function Message({ state }: { state: SettingsState }) {
  return (
    <>
      {state.error && (
        <p role="alert" className="mt-3 text-sm text-bad">
          {state.error}
        </p>
      )}
      {state.notice && (
        <p role="status" className="mt-3 text-sm text-good">
          {state.notice}
        </p>
      )}
    </>
  );
}
export function PasswordSettings({
  hasPassword,
  email,
}: {
  hasPassword: boolean | null;
  email: string;
}) {
  const [editing, setEditing] = useState(false),
    [notice, setNotice] = useState("");
  const trigger = useRef<HTMLButtonElement>(null);
  const id = useId();
  const close = () => {
    setEditing(false);
    requestAnimationFrame(() => trigger.current?.focus());
  };
  return (
    <section className="min-w-0 rounded-2xl border border-line bg-surface p-4 sm:p-6">
      <h2 className="font-display text-xl font-bold">Contraseña</h2>
      <p className="mt-2 text-sm text-muted">
        {hasPassword === null
          ? "No pudimos comprobar el acceso a tu cuenta. Recarga la página para intentarlo de nuevo."
          : hasPassword
            ? "Tu cuenta tiene una contraseña configurada."
            : "Tu cuenta usa un acceso externo, como Google. Puedes añadir una contraseña para entrar también con tu correo."}
      </p>
      <button
        ref={trigger}
        type="button"
        disabled={hasPassword === null}
        hidden={editing}
        aria-expanded={editing}
        aria-controls={editing ? id : undefined}
        onClick={() => {
          setNotice("");
          setEditing(true);
        }}
        className="mt-4 cursor-pointer rounded-xl border border-line px-4 py-3 text-sm font-semibold disabled:opacity-50"
      >
        {hasPassword ? "Cambiar contraseña" : "Crear contraseña"}
      </button>
      {editing &&
        (hasPassword ? (
          <PasswordForm
            id={id}
            onCancel={close}
            onSaved={(message) => {
              setNotice(message);
              close();
            }}
          />
        ) : (
          <CreatePassword id={id} email={email} onCancel={close} />
        ))}
      {notice && <Message state={{ notice }} />}
    </section>
  );
}
function CreatePassword({
  id,
  email,
  onCancel,
}: {
  id: string;
  email: string;
  onCancel: () => void;
}) {
  const [state, action, pending] = useActionState(requestRecoveryAction, {});
  return (
    <form id={id} action={action} className="mt-5 border-t border-line pt-5">
      <input type="hidden" name="email" value={email} />
      <input type="hidden" name="next" value="/configuracion" />
      <p className="mb-4 text-sm text-muted">
        Primero confirma que el correo es tuyo. Abre el enlace en este mismo
        navegador para crear tu contraseña de forma segura.
      </p>
      {!state.saved && (
        <button autoFocus disabled={pending} className={button}>
          {pending ? "Enviando…" : "Enviar enlace a mi correo"}
        </button>
      )}
      <button
        type="button"
        disabled={pending}
        onClick={onCancel}
        className="ml-3 cursor-pointer rounded-xl border border-line px-4 py-3 text-sm"
      >
        {state.saved ? "Cerrar" : "Cancelar"}
      </button>
      <Message state={state} />
    </form>
  );
}
function PasswordForm({
  id,
  onCancel,
  onSaved,
}: {
  id: string;
  onCancel: () => void;
  onSaved: (message: string) => void;
}) {
  const [state, action, pending] = useActionState(
    async (prev: SettingsState, form: FormData) => {
      const result = await changePasswordAction(prev, form);
      if (result.saved) onSaved(result.notice ?? "Contraseña actualizada.");
      return result;
    },
    {},
  );
  const [code, setCode] = useState<SettingsState>({}),
    [sending, setSending] = useState(false);
  return (
    <form id={id} action={action} className="mt-5 border-t border-line pt-5">
      <label className="block text-sm font-medium" htmlFor={id + "-current"}>
        Contraseña actual
        <input
          autoFocus
          id={id + "-current"}
          type="password"
          name="currentPassword"
          autoComplete="current-password"
          required
          disabled={pending}
          className={field}
        />
      </label>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium" htmlFor={id + "-new"}>
          Nueva contraseña
          <input
            id={id + "-new"}
            type="password"
            name="password"
            autoComplete="new-password"
            minLength={8}
            maxLength={128}
            required
            disabled={pending}
            className={field}
          />
        </label>
        <label className="text-sm font-medium" htmlFor={id + "-confirm"}>
          Repite la nueva contraseña
          <input
            id={id + "-confirm"}
            type="password"
            name="confirmPassword"
            autoComplete="new-password"
            required
            disabled={pending}
            className={field}
          />
        </label>
      </div>
      <p className="mt-2 text-xs text-muted">Usa al menos 8 caracteres.</p>
      <details className="mt-4 rounded-xl border border-line p-3">
        <summary className="cursor-pointer text-sm text-muted">
          Verificación por correo (si se solicita)
        </summary>
        <button
          type="button"
          disabled={sending || pending}
          onClick={() => {
            setSending(true);
            void sendPasswordCodeAction()
              .then(setCode)
              .finally(() => setSending(false));
          }}
          className="mt-3 cursor-pointer text-sm font-semibold text-accent"
        >
          {sending ? "Enviando…" : "Enviar código a mi correo"}
        </button>
        <label className="mt-3 block text-sm" htmlFor={id + "-code"}>
          Código de verificación
          <input
            id={id + "-code"}
            name="nonce"
            autoComplete="one-time-code"
            inputMode="numeric"
            maxLength={12}
            disabled={pending}
            className={field}
          />
        </label>
        <Message state={code} />
      </details>
      <div className="mt-5 flex flex-wrap gap-2">
        <button disabled={pending || sending} className={button}>
          {pending ? "Guardando…" : "Actualizar contraseña"}
        </button>
        <button
          type="button"
          disabled={pending || sending}
          onClick={onCancel}
          className="cursor-pointer rounded-xl border border-line px-4 py-3 text-sm"
        >
          Cancelar
        </button>
      </div>
      <Message state={state} />
    </form>
  );
}
