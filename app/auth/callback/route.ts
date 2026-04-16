import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const errorCode = searchParams.get("error_code");

  // Si Supabase mandó un error explícito
  if (error) {
    // otp_expired/otp_already_used = link ya usado → el email YA estaba confirmado
    if (errorCode === "otp_expired" || errorCode === "otp_already_used") {
      return NextResponse.redirect(`${origin}/login?msg=confirmado`);
    }
    return NextResponse.redirect(`${origin}/login?msg=error`);
  }

  // Flujo normal con code (PKCE)
  if (code) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (!exchangeError) {
      // Confirmación exitosa → va directo a la app
      return NextResponse.redirect(`${origin}/horario-escolar-14.html`);
    }
  }

  // Sin code y sin error → confirmación exitosa por hash (Supabase implicit flow)
  // El usuario ya está autenticado en el cliente, solo necesita el aviso
  return NextResponse.redirect(`${origin}/login?msg=confirmado`);
}
