import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// Vercel Cron llama a este endpoint una vez por día (ver vercel.json).
// Al hacer una consulta liviana a la base, resetea el contador de
// inactividad de Supabase y evita que el proyecto se pause (se pausa
// solo a partir de ~7 días sin actividad en el plan gratuito).
export async function GET(request) {
  // Si configuraste la variable de entorno CRON_SECRET en Vercel,
  // esto evita que cualquiera pueda golpear el endpoint desde afuera.
  // Si no la configuraste, este chequeo se salta solo y el endpoint
  // sigue funcionando igual.
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
  }

  try {
    const { error } = await supabase.from("escuelas").select("id").limit(1);

    if (error) {
      console.error("Error en keep-alive:", error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, ts: new Date().toISOString() });
  } catch (error) {
    console.error("Error en /api/keep-alive:", error);
    return NextResponse.json({ ok: false, error: "Error interno del servidor" }, { status: 500 });
  }
}
