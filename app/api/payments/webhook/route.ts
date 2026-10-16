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

    if (planKey !== "estandar" && planKey !== "completo") {
      console.error("Webhook: plan_key desconocido", planKey);
      return NextResponse.json({ received: true });
    }

    const sbHeaders = {
      "Content-Type": "application/json",
      "apikey": SUPABASE_SERVICE_KEY,
      "Authorization": `Bearer ${SUPABASE_SERVICE_KEY}`,
    };
    const filtro = `owner_id=eq.${encodeURIComponent(String(userId))}`;

    // Estado actual de la escuela
    const actualRes = await fetch(
      `${SUPABASE_URL}/rest/v1/escuelas?${filtro}&select=plan,plan_vence,mp_payment_id`,
      { headers: sbHeaders }
    );
    const [escuela] = actualRes.ok ? await actualRes.json() : [];

    // Mercado Pago avisa varias veces el mismo pago: si ya se aplicó, no sumar de nuevo
    if (escuela?.mp_payment_id === String(paymentId)) {
      return NextResponse.json({ received: true, ya_aplicado: true });
    }

    // Renovación: si tiene un plan pago todavía vigente, los meses se suman
    // desde su vencimiento; si no, desde hoy.
    const ahora = new Date();
    const venceActual = escuela?.plan_vence ? new Date(escuela.plan_vence) : null;
    const esPagoVigente =
      ["estandar", "completo", "paid"].includes(escuela?.plan) && venceActual && venceActual > ahora;
    const desde = esPagoVigente ? venceActual! : ahora;
    const planVence = new Date(desde);
    planVence.setMonth(planVence.getMonth() + Number(meses));

    // Actualizar Supabase via REST API directamente
    const sbRes = await fetch(
      `${SUPABASE_URL}/rest/v1/escuelas?${filtro}`,
      {
        method: "PATCH",
        headers: { ...sbHeaders, "Prefer": "return=minimal" },
        body: JSON.stringify({
          plan: planKey,
          ...(esPagoVigente ? {} : { plan_inicio: ahora.toISOString() }),
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
