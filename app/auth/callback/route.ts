import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

// Aviso a Puntual cada vez que una escuela nueva confirma su cuenta y arranca la prueba
const AVISO_A = "puntualhorarios@gmail.com";

function esc(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}

async function avisarNuevaEscuela(datos: { escuela: string; nombre: string; email: string; vence: Date }) {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const zona = { timeZone: "America/Argentina/Buenos_Aires" } as const;
    const fecha = new Date().toLocaleString("es-AR", zona);
    const vence = datos.vence.toLocaleDateString("es-AR", zona);
    const { error } = await resend.emails.send({
      from: "Puntual <horarios@send.puntualhorarios.com>",
      to: AVISO_A,
      replyTo: datos.email,
      subject: `🎉 Nueva escuela en prueba — ${datos.escuela}`,
      html: `
        <div style="font-family: Arial, sans-serif; font-size: 15px; color: #1a1f35; line-height: 1.6;">
          <h2 style="margin: 0 0 12px;">Una escuela nueva empezó la prueba gratuita</h2>
          <p style="margin: 0 0 4px;"><strong>Escuela:</strong> ${esc(datos.escuela)}</p>
          <p style="margin: 0 0 4px;"><strong>Contacto:</strong> ${esc(datos.nombre)}</p>
          <p style="margin: 0 0 4px;"><strong>Email:</strong> ${esc(datos.email)}</p>
          <p style="margin: 0 0 4px;"><strong>Se registró:</strong> ${fecha}</p>
          <p style="margin: 0 0 16px;"><strong>La prueba vence:</strong> ${vence}</p>
          <p style="margin: 0; color: #4a5578;">Respondé este mail para escribirle directamente y ofrecerle ayuda para cargar los datos.</p>
        </div>`,
    });
    if (error) console.error("❌ [CALLBACK] Error mandando aviso de nueva escuela:", error);
  } catch (err) {
    console.error("❌ [CALLBACK] Error mandando aviso de nueva escuela:", err);
  }
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const errorCode = searchParams.get("error_code");

  // Si Supabase mandó un error explícito
  if (error) {
    // otp_expired/otp_already_used = link vencido o ya usado. No sabemos si la
    // cuenta quedó confirmada, así que no decimos "confirmado": el login avisa
    // y, si falta confirmar, ofrece reenviar el mail.
    if (errorCode === "otp_expired" || errorCode === "otp_already_used") {
      return NextResponse.redirect(`${origin}/login?msg=link_usado`);
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
          // Aviso a Puntual (si falla, no afecta el ingreso de la escuela)
          await avisarNuevaEscuela({
            escuela: nombreEscuela,
            nombre: user.user_metadata?.nombre || "(sin nombre)",
            email: user.email || "(sin email)",
            vence,
          });
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

