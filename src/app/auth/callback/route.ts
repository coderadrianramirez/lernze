import { NextResponse, type NextRequest } from "next/server";
import { isRecoverySession } from "@/lib/password-recovery";
import { safeNext } from "@/lib/auth";
import { createSessionClient } from "@/lib/supabase/server";

/** Destino del enlace del correo de confirmación: cambia el código por una sesión. */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = safeNext(searchParams.get("next"), "/");

  if (code) {
    const supabase = await createSessionClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(
      code,
      searchParams.get("sb_flow_id")
        ? { flowId: searchParams.get("sb_flow_id")! }
        : undefined,
    );
    if (!error && data.user) {
      const claims = await supabase.auth.getClaims();
      if (
        !claims.error &&
        isRecoverySession(claims.data?.claims, data.user.id)
      ) {
        const destination = next.startsWith("/restablecer-contrasena?")
          ? next
          : "/restablecer-contrasena";
        return NextResponse.redirect(`${origin}${destination}`);
      }
      // Si el usuario nunca completó el onboarding, mandarlo ahí primero
      const { data: profile } = await supabase
        .from("profiles")
        .select("onboarding_done")
        .eq("id", data.user.id)
        .maybeSingle();
      const destination =
        profile?.onboarding_done === false ? "/bienvenida" : next;
      return NextResponse.redirect(`${origin}${destination}`);
    }
  }
  return NextResponse.redirect(
    `${origin}${next.startsWith("/restablecer-contrasena") ? "/recuperar-contrasena" : "/entrar"}?error=enlace`,
  );
}
