import { NextRequest, NextResponse } from "next/server";

const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN!;
const SUPABASE_URL = "https://ictemkwmsqgktpxvvxjg.supabase.co";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (body.type !== "payment") {
      return NextResponse.json({ received: true });
    }

    const paymentId = body.data?.id;
    if (!paymentId) {
      return NextResponse.json({ received: true });
    }

    // Verificar el pago con MP
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

    // Calcular fechas
    const ahora     = new Date();
    const planVence = new Date(ahora);
    planVence.setMonth(planVence.getMonth() + Number(meses));

    // Actualizar Supabase via REST API directamente
    const sbRes = await fetch(
      `${SUPABASE_URL}/rest/v1/escuelas?owner_id=eq.${userId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "apikey": SUPABASE_SERVICE_KEY,
          "Authorization": `Bearer ${SUPABASE_SERVICE_KEY}`,
          "Prefer": "return=minimal",
        },
        body: JSON.stringify({
          plan: planKey,
          plan_inicio: ahora.toISOString(),
          plan_vence: planVence.toISOString(),
          mp_payment_id: String(paymentId),
        }),
      }
    );

    if (!sbRes.ok) {
      const err = await sbRes.text();
      console.error("Supabase error:", err);
      return NextResponse.json({ error: "DB error" }, { status: 500 });
    }

    console.log(`✅ Plan actualizado: user=${userId} plan=${planKey} vence=${planVence.toISOString()}`);
    return NextResponse.json({ ok: true });

  } catch (err) {
    console.error("Webhook error:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true });
}
