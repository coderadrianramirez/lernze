import type { ArtConfig, CoverConfig } from "./types";
import { supabaseUrl } from "./supabase/config";
import { splitTitle } from "./art";

export const COVER_TONES = {
  amber: "#ffb547",
  teal: "#7fd6c8",
  rose: "#ff9ad5",
} as const;
export { sanitizeCover, parseCover } from "./cover-config";
const PATH = /^[0-9a-f-]{36}(?:\/[0-9a-f-]{36})?\/[0-9a-f-]{36}\.webp$/i;

export function coverImageUrl(
  path: string | null | undefined,
): string | undefined {
  return path && PATH.test(path)
    ? supabaseUrl + "/storage/v1/object/public/covers/" + path
    : undefined;
}

export function withCover(
  art: ArtConfig,
  title: string,
  cover: CoverConfig | null | undefined,
): ArtConfig {
  if (!cover) return { ...art, cover: undefined, lines: splitTitle(title) };
  return {
    ...art,
    lines: splitTitle(cover.title || title),
    glow: COVER_TONES[cover.tone],
    cover,
  };
}
