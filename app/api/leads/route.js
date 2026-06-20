import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request) {
  try {
    const { nombre, email } = await request.json();

    if (!nombre) {
      return NextResponse.json({ error: "Nombre requerido" }, { status: 400 });
    }

    const { error } = await supabase.from("leads").insert([
      {
        nombre,
        email: email || null,
        origen: "widget_landing",
        created_at: new Date().toISOString(),
      },
    ]);

    if (error) {
      console.error("Error guardando lead en Supabase:", error);
      return NextResponse.json({ error: "Error guardando lead" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error en /api/leads:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
