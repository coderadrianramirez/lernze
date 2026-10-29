"use client";

import { useEffect } from "react";
import { trackViewAction } from "./actions";

/** Registra la visita al montarse la página (no en precargas de enlaces). */
export function TrackView({ courseId }: { courseId: string }) {
  useEffect(() => {
    trackViewAction(courseId).catch(() => {});
  }, [courseId]);
  return null;
}
