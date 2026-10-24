import { createServerClient } from "@supabase/ssr";
import { createClient as createPublicClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { supabaseKey, supabaseUrl } from "./config";

/** Cliente con la sesión de quien hace la petición. Úsalo para escribir y para saber quién es. */
export async function createSessionClient() {
  const cookieStore = await cookies();
  return createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll(list) {
        try {
          list.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Se llamó desde un Server Component: el proxy ya refresca la sesión.
        }
      },
    },
  });
}

/** Cliente anónimo sin cookies, para lecturas públicas (cursos publicados). */
export function createPublicReadClient() {
  return createPublicClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
