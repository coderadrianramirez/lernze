"use client";

import { useState } from "react";

export function ShareButtons({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);

  const open = (build: (url: string, text: string) => string) => {
    const url = window.location.href.split("?")[0];
    window.open(build(encodeURIComponent(url), encodeURIComponent(title)), "_blank", "noopener,noreferrer");
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href.split("?")[0]);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {}
  };

  const btn =
    "flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-line bg-surface-2 text-muted transition-colors hover:border-accent hover:text-accent";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button className={btn} aria-label="Compartir por WhatsApp" onClick={() => open((u, t) => `https://wa.me/?text=${t}%20${u}`)}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18a8 8 0 0 1-4.1-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8 8 0 1 1 12 20Zm4.4-5.9c-.2-.1-1.4-.7-1.6-.8s-.4-.1-.5.1-.6.8-.7.9-.3.2-.5.1a6.6 6.6 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.7-1.7c-.2-.5-.4-.4-.5-.4h-.5a.9.9 0 0 0-.7.3 2.8 2.8 0 0 0-.9 2.1 4.9 4.9 0 0 0 1 2.6 11.2 11.2 0 0 0 4.3 3.8c1.6.7 2.2.7 3 .6a2.6 2.6 0 0 0 1.7-1.2 2.1 2.1 0 0 0 .2-1.2c-.1-.1-.2-.2-.5-.3Z" />
        </svg>
      </button>
      <button className={btn} aria-label="Compartir en X" onClick={() => open((u, t) => `https://x.com/intent/post?url=${u}&text=${t}`)}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M17.8 3h3.1l-6.8 7.7L22 21h-6.2l-4.9-6.4L5.3 21H2.2l7.2-8.3L2 3h6.4l4.4 5.8L17.8 3Zm-1.1 16.2h1.7L7.4 4.7H5.6l11.1 14.5Z" />
        </svg>
      </button>
      <button className={btn} aria-label="Compartir en Facebook" onClick={() => open((u) => `https://www.facebook.com/sharer/sharer.php?u=${u}`)}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M14 8h3V4h-3a4 4 0 0 0-4 4v2H8v4h2v8h4v-8h3l1-4h-4V8Z" />
        </svg>
      </button>
      <button className={btn} aria-label="Copiar enlace" onClick={copy}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
          <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" />
          <path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />
        </svg>
      </button>
      <span role="status" className={`text-xs text-accent transition-opacity ${copied ? "opacity-100" : "opacity-0"}`}>
        Enlace copiado
      </span>
    </div>
  );
}
