import { supabaseUrl } from "./supabase/config";
export function avatarUrl(path: unknown): string | null {
  return typeof path === "string" &&
    /^[0-9a-f-]{36}\/[0-9a-f-]{36}\.webp$/i.test(path)
    ? `${supabaseUrl}/storage/v1/object/public/avatars/${path}`
    : null;
}
