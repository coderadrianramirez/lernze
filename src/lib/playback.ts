/** Elegir la posición más reciente sin reutilizarla si el creador reemplazó el vídeo. */
export type PlaybackPosition = { seconds: number; updatedAt: string; videoPath: string };

export function resumePosition(server: PlaybackPosition | null, local: unknown, videoPath: string, duration: number): number {
  const candidates = [server, local].filter((entry): entry is PlaybackPosition => {
    if (!entry || typeof entry !== "object") return false;
    const p = entry as PlaybackPosition;
    return p.videoPath === videoPath && Number.isFinite(p.seconds) && p.seconds >= 0 && p.seconds <= 86400 &&
      typeof p.updatedAt === "string" && Number.isFinite(Date.parse(p.updatedAt));
  });
  candidates.sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
  const position = candidates[0]?.seconds ?? 0;
  return Number.isFinite(duration) && duration > 0 ? Math.min(position, Math.max(0, duration - 1)) : position;
}
