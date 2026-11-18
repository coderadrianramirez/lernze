import { createServerClient } from "@supabase/ssr";
import { NextResponse, userAgent, type NextRequest } from "next/server";
import { isSupabaseConfigured, supabaseKey, supabaseUrl } from "@/lib/supabase/config";

/** Refresca la sesión de Supabase y manda a /entrar a quien no la tenga en rutas privadas. */
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (request.method === "GET" && pathname === "/" && !search && userAgent(request).device.type === "mobile") {
    const destination = request.nextUrl.clone();
    destination.pathname = "/descubrir";
    const redirect = NextResponse.redirect(destination);
    redirect.headers.set("Cache-Control", "private, no-store");
    return redirect;
  }

  if (!isSupabaseConfigured) return NextResponse.next();

  let response = NextResponse.next({ request });
  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(list) {
        list.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const { data } = await supabase.auth.getClaims();


  if (!data?.claims && pathname.startsWith("/crear")) {
    const url = request.nextUrl.clone();
    url.pathname = "/entrar";
    url.search = `?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(url);
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
