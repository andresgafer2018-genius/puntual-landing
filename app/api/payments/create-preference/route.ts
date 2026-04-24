import { NextRequest, NextResponse } from "next/server";

const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN!;

const PLANES: Record<string, { title: string; usd: number; plan_key: string; meses: number }> = {
  "estandar-1mes":   { title: "Plan Estándar 1 mes",   usd: 199, plan_key: "estandar", meses: 1 },
  "estandar-2meses": { title: "Plan Estándar 2 meses", usd: 299, plan_key: "estandar", meses: 2 },
  "completo-1mes":   { title: "Plan Completo 1 mes",   usd: 299, plan_key: "completo", meses: 1 },
  "completo-2meses": { title: "Plan Completo 2 meses", usd: 400, plan_key: "completo", meses: 2 },
};

async function getDolarOficial(): Promise<number> {
  try {
    const res = await fetch("https://dolarapi.com/v1/dolares/oficial", {
      next: { revalidate: 3600 }, // cachear 1 hora
    });
    const data = await res.json();
    // Usar el tipo vendedor (el que paga el comprador)
    return data.venta as number;
  } catch (err) {
    console.error("Error obteniendo tipo de cambio:", err);
    // Fallback: valor aproximado hardcodeado por si falla la API
    return 1000;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { planId, userId } = await req.json();

    if (!planId || !userId) {
      return NextResponse.json({ error: "planId y userId son requeridos" }, { status: 400 });
    }

    const plan = PLANES[planId];
    if (!plan) {
      return NextResponse.json({ error: "Plan no válido" }, { status: 400 });
    }

    // Obtener tipo de cambio oficial
    const tipoCambio = await getDolarOficial();
    const precioARS  = Math.round(plan.usd * tipoCambio);

    console.log(`Tipo cambio oficial: $${tipoCambio} | ${plan.title}: USD ${plan.usd} = ARS ${precioARS}`);

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://puntual-landing.vercel.app";

    const body = {
      items: [{
        title: `${plan.title} (USD ${plan.usd} al tipo de cambio oficial)`,
        quantity: 1,
        currency_id: "ARS",
        unit_price: precioARS,
      }],
      metadata: {
        user_id: userId,
        plan_key: plan.plan_key,
        meses: plan.meses,
        usd_price: plan.usd,
        tipo_cambio: tipoCambio,
      },
      back_urls: {
        success: `${baseUrl}/planes?pago=exitoso`,
        failure: `${baseUrl}/planes?pago=fallido`,
        pending: `${baseUrl}/planes?pago=pendiente`,
      },
      auto_return: "approved",
      notification_url: `${baseUrl}/api/payments/webhook`,
      external_reference: userId,
    };

    const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("MP error:", data);
      return NextResponse.json({ error: "Error creando preferencia" }, { status: 500 });
    }

    return NextResponse.json({
      init_point: data.init_point,
      sandbox_init_point: data.sandbox_init_point,
      tipo_cambio: tipoCambio,
      precio_ars: precioARS,
    });

  } catch (err) {
    console.error("create-preference error:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
