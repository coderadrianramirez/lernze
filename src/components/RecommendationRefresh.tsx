"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { consumeRecommendationUpdate } from "@/lib/recommendation-refresh";

/** Al volver al inicio, actualiza sus datos sin reordenar el vídeo que estás viendo. */
export function RecommendationRefresh() {
  const router = useRouter();
  useEffect(() => {
    if (consumeRecommendationUpdate()) router.refresh();
  }, [router]);
  return null;
}
