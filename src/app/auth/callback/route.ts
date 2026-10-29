import { NextResponse, type NextRequest } from "next/server";
import { safeNext } from "@/lib/auth";
import { createSessionClient } from "@/lib/supabase/server";

/** Destino del enlace del correo de confirmación: cambia el código por una sesión. */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = safeNext(searchParams.get("next"), "/");

  if (code) {
    const supabase = await createSessionClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data.user) {
      // Si el usuario nunca completó el onboarding, mandarlo ahí primero
      const { data: profile } = await supabase
        .from("profiles")
        .select("onboarding_done")
        .eq("id", data.user.id)
        .maybeSingle();
      const destination = profile?.onboarding_done === false ? "/bienvenida" : next;
      return NextResponse.redirect(`${origin}${destination}`);
    }
  }
  return NextResponse.redirect(`${origin}/entrar?error=enlace`);
}
