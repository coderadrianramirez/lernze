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
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }
  return NextResponse.redirect(`${origin}/entrar?error=enlace`);
}
