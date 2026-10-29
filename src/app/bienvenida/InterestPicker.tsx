"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CATEGORIES, type Category } from "@/lib/types";
import { saveInterestsAction } from "./actions";

const CATEGORY_ICONS: Record<Category, string> = {
  Negocios: "💼",
  Idiomas: "🌐",
  Oficios: "🔧",
  Marketing: "📣",
  Inversión: "📈",
};

const CATEGORY_DESC: Record<Category, string> = {
  Negocios: "Emprender, ventas y gestión",
  Idiomas: "Inglés, comunicación y coaching",
  Oficios: "Habilidades prácticas y técnicas",
  Marketing: "Redes sociales, marca y contenido",
  Inversión: "Finanzas personales y ahorro",
};

export function InterestPicker({ userId, name }: { userId: string; name: string }) {
  const [selected, setSelected] = useState<Set<Category>>(new Set());
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const toggle = (cat: Category) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });

  const submit = () => {
    startTransition(async () => {
      await saveInterestsAction(userId, [...selected]);
      router.push("/");
      router.refresh();
    });
  };

  const skip = () => {
    startTransition(async () => {
      await saveInterestsAction(userId, []);
      router.push("/");
    });
  };

  return (
    <div className="w-full max-w-xl">
      {/* Cabecera */}
      <div className="mb-8 text-center">
        <p className="mb-1 text-sm text-muted">Hola, {name} 👋</p>
        <h1 className="font-display text-3xl font-extrabold tracking-tight">
          ¿Qué te interesa aprender?
        </h1>
        <p className="mt-2 text-sm text-muted">
          Elegí uno o varios temas y personalizamos tu feed al instante.
        </p>
      </div>

      {/* Grid de categorías */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {CATEGORIES.map((cat) => {
          const on = selected.has(cat);
          return (
            <button
              key={cat}
              onClick={() => toggle(cat)}
              className={`flex items-center gap-4 rounded-2xl border px-5 py-4 text-left transition-all ${
                on
                  ? "border-accent bg-accent/10 text-fg shadow-[0_0_0_1px_var(--color-accent)]"
                  : "border-line bg-surface text-fg hover:border-fg/20 hover:bg-surface-2"
              }`}
            >
              <span className="text-2xl">{CATEGORY_ICONS[cat]}</span>
              <div>
                <p className="font-semibold">{cat}</p>
                <p className="text-xs text-muted">{CATEGORY_DESC[cat]}</p>
              </div>
              {/* Check */}
              <div className={`ml-auto flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors ${on ? "border-accent bg-accent" : "border-line"}`}>
                {on && (
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4l3 3 5-6" stroke="#1a1204" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Acciones */}
      <div className="mt-8 flex flex-col items-center gap-3">
        <button
          onClick={submit}
          disabled={pending || selected.size === 0}
          className="w-full rounded-xl bg-accent px-6 py-3.5 font-bold text-accent-ink transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {pending ? "Guardando…" : `Personalizar mi feed${selected.size > 0 ? ` · ${selected.size} ${selected.size === 1 ? "tema" : "temas"}` : ""}`}
        </button>
        <button
          onClick={skip}
          disabled={pending}
          className="text-sm text-muted transition-colors hover:text-fg"
        >
          Saltar por ahora
        </button>
      </div>
    </div>
  );
}
