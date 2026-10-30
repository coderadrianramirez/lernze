"use client";
import Link from "next/link";
import {
  startTransition,
  useActionState,
  useRef,
  useState,
  useEffect,
} from "react";
import { Avatar } from "@/components/Avatar";
import type { CurrentUser } from "@/lib/auth";
import { avatarUrl } from "@/lib/profile";
import { imageBlob } from "@/lib/browser-image";
import {
  changeEmailAction,
  changePasswordAction,
  createPhotoUploadAction,
  discardPhotosAction,
  saveProfileAction,
  sendPasswordCodeAction,
  type SettingsState,
} from "./actions";

const field =
  "mt-1.5 w-full rounded-xl border border-line bg-surface-2 px-3.5 py-3 text-sm text-fg focus:border-accent focus:outline-none";
const button =
  "cursor-pointer rounded-xl bg-accent px-4 py-3 text-sm font-bold text-accent-ink disabled:cursor-default disabled:opacity-50";
const panel = "min-w-0 rounded-2xl border border-line bg-surface p-4 sm:p-6";
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

export function SettingsForms({
  user,
  avatarPath,
  ready,
  interests,
  pendingEmail,
  hasPassword,
}: {
  user: CurrentUser;
  avatarPath: string | null;
  ready: boolean;
  interests: string[];
  pendingEmail: string | null;
  hasPassword: boolean;
}) {
  const [profile, saveProfile, profilePending] = useActionState(
    saveProfileAction,
    {},
  );
  const [emailState, saveEmail, emailPending] = useActionState(
    changeEmailAction,
    {},
  );
  const [passwordState, savePassword, passwordPending] = useActionState(
    changePasswordAction,
    {},
  );
  const [name, setName] = useState(user.name);
  const [photo, setPhoto] = useState(avatarPath);
  const [email, setEmail] = useState("");
  const [uploading, setUploading] = useState(false);
  const [photoError, setPhotoError] = useState("");
  const [codeState, setCodeState] = useState<SettingsState>({});
  const [sending, setSending] = useState(false);
  const passwordForm = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (passwordState.saved) passwordForm.current?.reset();
  }, [passwordState]);
  const files = useRef<string[]>([]);
  const input = useRef<HTMLInputElement>(null);
  async function upload(file: File | undefined) {
    if (!file) return;
    setPhotoError("");
    if (
      !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
      file.size > 8 * 1024 * 1024
    ) {
      setPhotoError("Elige una imagen JPG, PNG o WebP de hasta 8 MB.");
      return;
    }
    setUploading(true);
    try {
      const blob = await imageBlob(file, 512);
      const ticket = await createPhotoUploadAction();
      if (ticket.error || !ticket.path || !ticket.signedUrl)
        throw Error(ticket.error || "No pudimos subir tu foto.");
      const body = new FormData();
      body.append("", blob, "perfil.webp");
      const response = await fetch(ticket.signedUrl, {
        method: "PUT",
        headers: { "x-upsert": "false" },
        body,
      });
      if (!response.ok)
        throw Error("No pudimos subir la foto. Inténtalo de nuevo.");
      files.current.push(ticket.path);
      setPhoto(ticket.path);
    } catch (e) {
      setPhotoError((e as Error).message);
    } finally {
      setUploading(false);
      if (input.current) input.current.value = "";
    }
  }
  return (
    <div className="grid gap-5">
      <form
        className={panel}
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          fd.set("photoUploads", JSON.stringify(files.current));
          startTransition(() => saveProfile(fd));
        }}
      >
        <h2 className="font-display text-xl font-bold">Perfil público</h2>
        <p className="mt-1 text-sm text-muted">
          Así te identificarán en Lernze.
        </p>
        {!ready && (
          <p
            role="status"
            className="mt-4 rounded-xl border border-line p-3 text-sm text-muted"
          >
            La edición de foto y nombre estará disponible en breve.
          </p>
        )}
        <div className="mt-5 flex flex-wrap items-center gap-4">
          <Avatar
            name={name || user.name}
            src={avatarUrl(photo)}
            className="h-20 w-20 text-2xl"
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={!ready || uploading || profilePending}
              onClick={() => input.current?.click()}
              className="cursor-pointer rounded-xl border border-line px-3 py-2.5 text-sm font-semibold disabled:opacity-40"
            >
              {uploading ? "Subiendo…" : "Cambiar foto"}
            </button>
            {photo && (
              <button
                type="button"
                disabled={uploading || profilePending || !ready}
                onClick={() => setPhoto(null)}
                className="cursor-pointer px-3 py-2.5 text-sm text-muted"
              >
                Quitar foto
              </button>
            )}
          </div>
        </div>
        <input
          ref={input}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          aria-label="Selecciona tu foto de perfil"
          className="sr-only"
          tabIndex={-1}
          onChange={(e) => void upload(e.target.files?.[0])}
        />
        <input type="hidden" name="avatarPath" value={photo ?? ""} />
        {photoError && (
          <p role="alert" className="mt-2 text-sm text-bad">
            {photoError}
          </p>
        )}
        <label className="mt-5 block text-sm font-medium" htmlFor="public-name">
          Nombre público del creador
          <input
            id="public-name"
            name="name"
            autoComplete="nickname"
            maxLength={120}
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={!ready}
            className={field}
          />
        </label>
        <p className="mt-2 text-xs text-muted">
          Se mostrará en todos tus programas y servirá para encontrarlos en el
          buscador. No tiene que ser único.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <button
            disabled={!ready || uploading || profilePending}
            className={button}
          >
            {profilePending ? "Guardando…" : "Guardar perfil"}
          </button>
          <button
            type="button"
            disabled={uploading || profilePending}
            onClick={() => {
              void discardPhotosAction(files.current).then((result) => {
                if (result.error) setPhotoError(result.error);
                else {
                  setPhoto(avatarPath);
                  setName(user.name);
                  files.current = [];
                  setPhotoError("");
                }
              });
            }}
            className="cursor-pointer rounded-xl border border-line px-4 py-3 text-sm"
          >
            Cancelar cambios
          </button>
        </div>
        <Message state={profile} />
      </form>
      <section className={panel}>
        <h2 className="font-display text-xl font-bold">Temas de tu feed</h2>
        <p className="mt-2 text-sm text-muted">
          {interests.length
            ? interests.join(" · ")
            : "Aún no elegiste tus temas."}
        </p>
        <Link
          href="/bienvenida?next=/configuracion"
          className="mt-4 inline-block rounded-xl border border-line px-4 py-3 text-sm font-semibold"
        >
          Cambiar temas →
        </Link>
      </section>
      <form
        className={panel}
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          startTransition(() => saveEmail(fd));
        }}
      >
        <h2 className="font-display text-xl font-bold">Correo electrónico</h2>
        <p className="mt-2 break-all text-sm text-muted">
          Correo actual: <span className="text-fg">{user.email}</span>
        </p>
        {pendingEmail && (
          <p className="mt-2 break-all text-xs text-accent">
            Pendiente de confirmación: {pendingEmail}
          </p>
        )}
        <label className="mt-5 block text-sm font-medium" htmlFor="new-email">
          Nuevo correo
          <input
            type="email"
            autoComplete="email"
            id="new-email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className={field}
          />
        </label>
        <p className="mt-2 text-xs text-muted">
          Te indicaremos cómo confirmar el cambio antes de usar el nuevo correo.
        </p>
        <button disabled={emailPending} className={button + " mt-5"}>
          {emailPending ? "Solicitando…" : "Solicitar cambio de correo"}
        </button>
        <Message state={emailState} />
      </form>
      <form
        ref={passwordForm}
        className={panel}
        onSubmit={(e) => {
          e.preventDefault();
          const form = e.currentTarget;
          const fd = new FormData(form);
          startTransition(async () => {
            await savePassword(fd);
          });
        }}
      >
        <h2 className="font-display text-xl font-bold">
          {hasPassword ? "Cambiar contraseña" : "Crear contraseña"}
        </h2>
        {!hasPassword && (
          <p className="mt-2 text-sm text-muted">
            Tu cuenta usa un acceso externo. Solicita un código por correo para
            añadir una contraseña.
          </p>
        )}
        {hasPassword && (
          <label
            className="mt-5 block text-sm font-medium"
            htmlFor="current-password"
          >
            Contraseña actual
            <input
              id="current-password"
              type="password"
              name="currentPassword"
              autoComplete="current-password"
              required
              className={field}
            />
          </label>
        )}
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium" htmlFor="new-password">
            Nueva contraseña
            <input
              id="new-password"
              type="password"
              name="password"
              autoComplete="new-password"
              minLength={8}
              maxLength={128}
              required
              className={field}
            />
          </label>
          <label className="text-sm font-medium" htmlFor="confirm-password">
            Repite la nueva contraseña
            <input
              id="confirm-password"
              type="password"
              name="confirmPassword"
              autoComplete="new-password"
              required
              className={field}
            />
          </label>
        </div>
        <p className="mt-2 text-xs text-muted">Usa al menos 8 caracteres.</p>
        <details
          className="mt-4 rounded-xl border border-line p-3"
          open={!hasPassword}
        >
          <summary className="cursor-pointer text-sm text-muted">
            Verificación por correo {hasPassword ? "(si se solicita)" : ""}
          </summary>
          <button
            type="button"
            disabled={sending || passwordPending}
            onClick={() => {
              setSending(true);
              void sendPasswordCodeAction()
                .then(setCodeState)
                .finally(() => setSending(false));
            }}
            className="mt-3 cursor-pointer text-sm font-semibold text-accent"
          >
            {sending ? "Enviando…" : "Enviar código a mi correo"}
          </button>
          <label className="mt-3 block text-sm" htmlFor="password-code">
            Código de verificación
            <input
              id="password-code"
              name="nonce"
              autoComplete="one-time-code"
              inputMode="numeric"
              maxLength={12}
              className={field}
            />
          </label>
          <Message state={codeState} />
        </details>
        <button disabled={passwordPending} className={button + " mt-5"}>
          {passwordPending
            ? "Guardando…"
            : hasPassword
              ? "Actualizar contraseña"
              : "Crear contraseña"}
        </button>
        <Message state={passwordState} />
      </form>
    </div>
  );
}
