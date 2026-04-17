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

    const { data: sessionData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error("❌ [CALLBACK] Error al intercambiar code por sesión:", exchangeError);
      return NextResponse.redirect(`${origin}/login?msg=error`);
    }

    // Ya hay sesión activa → podemos insertar en escuelas (RLS lo acepta)
    const user = sessionData?.user;
    if (user) {
      // Chequear si ya tiene escuela (por si hace clic dos veces al link)
      const { data: escuelaExistente } = await supabase
        .from("escuelas")
        .select("id")
        .eq("owner_id", user.id)
        .maybeSingle();

      if (!escuelaExistente) {
        // Leer nombre de escuela del user_metadata (guardado en signUp)
        const nombreEscuela = user.user_metadata?.nombre_escuela || "Mi Escuela";

        const ahora = new Date();
        const vence = new Date(ahora);
        vence.setDate(vence.getDate() + 15);

        const { error: insertError } = await supabase.from("escuelas").insert({
          nombre: nombreEscuela,
          owner_id: user.id,
          plan: "trial",
          plan_inicio: ahora.toISOString(),
          plan_vence: vence.toISOString(),
          trial_usado: true,
        });

        if (insertError) {
          console.error("❌ [CALLBACK] Error al crear fila en escuelas:", insertError);
          // No bloqueamos el flujo: el usuario entra igual a la app, el HTML manejará el caso de escuela faltante
        } else {
          console.log("✅ [CALLBACK] Escuela creada para user:", user.id);
        }
      }

      // Confirmación exitosa → va directo a la app
      return NextResponse.redirect(`${origin}/horario-escolar-14.html`);
    }
  }

  // Sin code y sin error → confirmación exitosa por hash (Supabase implicit flow)
  // El usuario ya está autenticado en el cliente, solo necesita el aviso
  return NextResponse.redirect(`${origin}/login?msg=confirmado`);
}
