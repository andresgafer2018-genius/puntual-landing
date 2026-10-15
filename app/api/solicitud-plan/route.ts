import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { supabase } from "@/lib/supabase";

// Pedido de plan pago SIN cobro automático.
// Mientras no esté listo el cobro (Mercado Pago / facturación), cuando una escuela
// toca "Contratar plan" en /planes llega acá: se guarda el pedido en la tabla leads
// y se manda un aviso por mail a Puntual para contactarla a mano.

const resend = new Resend(process.env.RESEND_API_KEY);
const AVISO_A = "puntualhorarios@gmail.com";

const PLANES: Record<string, { nombre: string; precio: string }> = {
  "estandar-1mes": { nombre: "Plan Estándar", precio: "USD 99 / mes" },
  "completo-1mes": { nombre: "Plan Completo", precio: "USD 119 / mes" },
};

function esc(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}

export async function POST(req: NextRequest) {
  try {
    const { planId } = await req.json();
    const plan = PLANES[planId];
    if (!plan) {
      return NextResponse.json({ error: "Plan no válido" }, { status: 400 });
    }

    // Identificamos al usuario con su sesión (no confiamos en datos que mande el navegador)
    const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
    if (!token) {
      return NextResponse.json({ error: "Sesión requerida" }, { status: 401 });
    }
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user?.email) {
      return NextResponse.json({ error: "Sesión inválida" }, { status: 401 });
    }

    const email   = user.email;
    const escuela = String(user.user_metadata?.nombre_escuela || "Sin nombre de escuela");
    const fecha   = new Date().toLocaleString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" });

    let guardado = false;
    let avisado  = false;

    // 1) Guardar el pedido en leads
    const { error: dbError } = await supabase.from("leads").insert([{
      nombre: escuela,
      email,
      origen: `solicitud_${planId}`,
      created_at: new Date().toISOString(),
    }]);
    if (dbError) console.error("solicitud-plan: error guardando en leads", dbError);
    else guardado = true;

    // 2) Aviso a Puntual (responder el mail le contesta directo a la escuela)
    const aviso = await resend.emails.send({
      from: "Puntual <horarios@send.puntualhorarios.com>",
      to: AVISO_A,
      replyTo: email,
      subject: `🔔 Pedido de ${plan.nombre} — ${escuela}`,
      html: `
        <div style="font-family: Arial, sans-serif; font-size: 15px; color: #1a1f35; line-height: 1.6;">
          <h2 style="margin: 0 0 12px;">Nuevo pedido de plan</h2>
          <p style="margin: 0 0 4px;"><strong>Escuela:</strong> ${esc(escuela)}</p>
          <p style="margin: 0 0 4px;"><strong>Email:</strong> ${esc(email)}</p>
          <p style="margin: 0 0 4px;"><strong>Plan:</strong> ${plan.nombre} (${plan.precio})</p>
          <p style="margin: 0 0 16px;"><strong>Fecha:</strong> ${fecha}</p>
          <p style="margin: 0; color: #4a5578;">Respondé este mail para escribirle directamente a la escuela.</p>
        </div>`,
    });
    if (aviso.error) console.error("solicitud-plan: error mandando aviso", aviso.error);
    else avisado = true;

    // 3) Confirmación a la escuela (si falla, no corta el pedido)
    const confirmacion = await resend.emails.send({
      from: "Puntual <horarios@send.puntualhorarios.com>",
      to: email,
      replyTo: AVISO_A,
      subject: `Recibimos tu pedido del ${plan.nombre}`,
      html: `
        <div style="font-family: Arial, sans-serif; font-size: 15px; color: #1a1f35; line-height: 1.6; max-width: 520px;">
          <p>¡Hola! Gracias por elegir Puntual.</p>
          <p>Recibimos tu pedido del <strong>${plan.nombre}</strong> (${plan.precio}) para <strong>${esc(escuela)}</strong>.</p>
          <p>En menos de 24 horas hábiles te escribimos a este mail para coordinar el pago y la activación. Mientras tanto, podés seguir usando Puntual con tu cuenta.</p>
          <p>Si tenés alguna duda, respondé este mail.</p>
          <p>Saludos,<br>Equipo Puntual</p>
        </div>`,
    });
    if (confirmacion.error) console.error("solicitud-plan: error mandando confirmación", confirmacion.error);

    if (!guardado && !avisado) {
      return NextResponse.json({ error: "No se pudo registrar el pedido" }, { status: 500 });
    }
    return NextResponse.json({ ok: true });

  } catch (err) {
    console.error("solicitud-plan error:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
