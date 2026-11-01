"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { interestSignalAction } from "@/app/actions/recommendations";

export function DismissProgram({
  courseId,
  onHidden,
}: {
  courseId: string;
  onHidden: () => void;
}) {
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <div className="mt-3">
      <button
        disabled={pending}
        type="button"
        className="min-h-11 text-xs text-muted underline underline-offset-4 hover:text-fg disabled:opacity-50"
        onClick={() =>
          start(async () => {
            setError("");
            try {
              const result = await interestSignalAction(courseId, "dismiss");
              if (!result.saved) {
                setError(result.error ?? "Vuelve a intentarlo.");
                return;
              }
              onHidden();
              router.refresh();
            } catch {
              setError("No pudimos conectar. Inténtalo de nuevo.");
            }
          })
        }
      >
        {pending ? "Guardando…" : "No me interesa este programa"}
      </button>
      {error && (
        <p role="alert" className="max-w-[40ch] text-xs text-bad">
          {error}
        </p>
      )}
    </div>
  );
}
