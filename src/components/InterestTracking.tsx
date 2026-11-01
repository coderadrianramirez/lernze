"use client";

import { markRecommendationsDirty } from "@/lib/recommendation-refresh";
import { useEffect, useRef } from "react";
import {
  interestSignalAction,
  searchInterestAction,
} from "@/app/actions/recommendations";

/** Espera una búsqueda estable; no ejecuta acciones durante el render o la precarga. */
export function SearchInterest({ query }: { query: string }) {
  useEffect(() => {
    if (query.length < 3) return;
    const timer = window.setTimeout(() => {
      if (document.visibilityState === "visible")
        void searchInterestAction(query)
          .then((r) => {
            if (r?.saved) markRecommendationsDirty();
          })
          .catch(() => {});
    }, 1500);
    return () => window.clearTimeout(timer);
  }, [query]);
  return null;
}

/** Una visita sostenida al perfil aporta una señal débil, repartida entre sus temas. */
export function CreatorInterest({ courseIds }: { courseIds: string[] }) {
  const marker = useRef<HTMLSpanElement>(null);
  const ids = courseIds.slice(0, 3).join(",");
  useEffect(() => {
    const el = marker.current;
    if (!el || !ids) return;
    let visible = false,
      seconds = 0,
      sent = false;
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    observer.observe(el);
    const timer = window.setInterval(() => {
      if (
        !sent &&
        visible &&
        document.visibilityState === "visible" &&
        ++seconds >= 6
      ) {
        sent = true;
        for (const id of ids.split(","))
          void interestSignalAction(id, "creator")
            .then((r) => {
              if (r.saved) markRecommendationsDirty();
            })
            .catch(() => {});
      }
    }, 1000);
    return () => {
      observer.disconnect();
      window.clearInterval(timer);
    };
  }, [ids]);
  return <span ref={marker} aria-hidden className="block h-px" />;
}
