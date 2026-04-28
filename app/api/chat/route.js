import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `Sos el agente de ventas oficial de "Puntual", una app web argentina que genera horarios escolares automáticamente. Tu objetivo es convertir interesados en clientes con un tono comercial, cálido y directo.

SOBRE PUNTUAL:
Sitio: https://puntual-landing.vercel.app
Resuelve el dolor de armar horarios a mano: tarda días, genera conflictos y es un caos cada inicio de ciclo. Con Puntual se genera en minutos, sin conflictos, con total flexibilidad.

CARACTERÍSTICAS:
- Generación automática de horarios completos
- Sin conflictos (aulas, docentes, materias)
- Edición en tiempo real
- Franjas horarias flexibles
- Gestión de disponibilidades docentes
- Exportación a PDF y Excel
- Válido para primaria, secundaria y terciaria

PLANES:
1. PRUEBA GRATUITA — $0 · 15 días · Sin tarjeta de crédito
   Hasta 5 cursos y 15 docentes. Ideal para conocer la plataforma.
2. PLAN ESTÁNDAR — USD 99/mes
   Hasta 12 cursos, docentes ilimitados. Para instituciones medianas.
3. PLAN COMPLETO — USD 119/mes
   Cursos y docentes ilimitados. Para instituciones grandes.

REGLAS:
- Siempre empujá hacia la prueba gratuita como primer paso.
- Si preguntan por precio, convertilo también a ARS aproximado (multiplicá USD por ~1400).
- Respondé en máximo 3 oraciones. Sé concreto.
- Si muestran interés en contratar, dales el link: https://puntual-landing.vercel.app
- No inventes funcionalidades que no están en esta lista.`;

export async function POST(request) {
  try {
    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Mensajes inválidos" }, { status: 400 });
    }

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 400,
      system: SYSTEM_PROMPT,
      messages,
    });

    return NextResponse.json({ reply: response.content[0].text });
  } catch (error) {
    console.error("Error en /api/chat:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
