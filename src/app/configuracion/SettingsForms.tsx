"use client";
import { PasswordSettings } from "./PasswordSettings";
import { EmailSettings } from "./EmailSettings";
import { startTransition, useActionState, useRef, useState } from "react";
import { Avatar } from "@/components/Avatar";
import type { CurrentUser } from "@/lib/auth";
import { avatarUrl } from "@/lib/profile";
import { imageBlob } from "@/lib/browser-image";
import {
  createPhotoUploadAction,
  discardPhotosAction,
  saveProfileAction,
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
  hasPassword: boolean | null;
}) {
  const [profile, saveProfile, profilePending] = useActionState(
    saveProfileAction,
    {},
  );
  const [name, setName] = useState(user.name);
  const [photo, setPhoto] = useState(avatarPath);
  const [uploading, setUploading] = useState(false);
  const [photoError, setPhotoError] = useState("");
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
        <h2 className="font-display text-xl font-bold">Intereses</h2>
        <p className="mt-2 text-sm text-muted">
          {interests.length
            ? interests.join(" · ")
            : "Explora programas para descubrir lo que te interesa."}
        </p>
        <details className="mt-4">
          <summary className="w-fit cursor-pointer rounded-xl border border-line px-4 py-3 text-sm font-semibold">
            Ver tus intereses
          </summary>
          <div className="mt-4 border-t border-line pt-4">
            <p className="text-sm text-muted">
              Estos son los temas que elegiste al comenzar. Tu actividad también
              ayuda a descubrir programas relacionados con lo que has visto.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {interests.map((interest) => (
                <span
                  key={interest}
                  className="rounded-full border border-line px-3 py-1.5 text-xs"
                >
                  {interest}
                </span>
              ))}
            </div>
          </div>
        </details>
      </section>
      <EmailSettings email={user.email} pendingEmail={pendingEmail} />
      <PasswordSettings hasPassword={hasPassword} email={user.email} />
    </div>
  );
}
