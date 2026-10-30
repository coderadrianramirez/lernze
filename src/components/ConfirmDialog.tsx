"use client";
import { useEffect, useId, useRef, type ReactNode } from "react";

export function ConfirmDialog({
  open,
  title,
  children,
  onClose,
  busy = false,
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
  busy?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = ref.current;
    if (open && !dialog?.open) dialog?.showModal();
    else if (!open && dialog?.open) dialog.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault();
        if (!busy) onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !busy) onClose();
      }}
      className="m-auto max-h-[90svh] w-[calc(100%_-_32px)] max-w-md overflow-y-auto rounded-2xl border border-line bg-surface p-5 text-fg shadow-2xl backdrop:bg-black/75 sm:p-6"
    >
      <h2 id={titleId} className="font-display text-xl font-bold">
        {title}
      </h2>
      <div className="mt-3">{children}</div>
    </dialog>
  );
}
