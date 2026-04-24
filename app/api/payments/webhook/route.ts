import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN!;
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // MP envía diferentes tipos de notificaciones
    if (body.type !== "payment") {
      return NextResponse.json({ received: true });
    }

    const paymentId = body.data?.id;
    if (!paymentId) {
      return NextResponse.json({ received: true });
    }

    // Consultar el pago a MP para verificar estado y metadata
    const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` },
    });
    const payment = await mpRes.json();

    if (payment.status !== "approved") {
      return NextResponse.json({ received: true });
    }

    const userId  = payment.metadata?.user_id;
    const planKey = payment.metadata?.plan_key;
    const meses   = payment.metadata?.meses || 1;

    if (!userId || !planKey) {
      console.error("Webhook: metadata incompleta", payment.metadata);
      return NextResponse.json({ received: true });
    }

    // Calcular nueva fecha de vencimiento desde hoy
    const ahora      = new Date();
    const planInicio = ahora.toISOString();
    const planVence  = new Date(ahora);
    planVence.setMonth(planVence.getMonth() + Number(meses));

    const { error } = await supabase
      .from("escuelas")
      .update({
        plan: planKey,
        plan_inicio: planInicio,
        plan_vence: planVence.toISOString(),
        mp_payment_id: String(paymentId),
      })
      .eq("owner_id", userId);

    if (error) {
      console.error("Supabase update error:", error);
      return NextResponse.json({ error: "DB error" }, { status: 500 });
    }

    console.log(`✅ Plan actualizado: user=${userId} plan=${planKey} vence=${planVence.toISOString()}`);
    return NextResponse.json({ ok: true });

  } catch (err) {
    console.error("Webhook error:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

// MP también hace GET para verificar el endpoint
export async function GET() {
  return NextResponse.json({ ok: true });
}
