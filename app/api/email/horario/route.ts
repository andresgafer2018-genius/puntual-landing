import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
const resend = new Resend(process.env.RESEND_API_KEY)
export async function POST(req: NextRequest) {
  try {
    const { profesorNombre, profesorEmail, escuelaNombre, adjuntoBase64, adjuntoNombre, htmlCuerpo } = await req.json()
    if (!profesorEmail || !adjuntoBase64) {
      return NextResponse.json({ error: 'Faltan datos requeridos' }, { status: 400 })
    }
    const { data, error } = await resend.emails.send({
      from: 'Puntual <onboarding@resend.dev>',
      to: profesorEmail,
      subject: `Tu horario semanal – ${escuelaNombre}`,
      html: htmlCuerpo || `<p>Hola ${profesorNombre}, adjuntamos tu horario semanal de ${escuelaNombre}.</p>`,
      attachments: [
        {
          filename: adjuntoNombre || 'horario.xlsx',
          content: adjuntoBase64,
        },
      ],
    })
    if (error) {
      console.error('Resend error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ success: true, id: data?.id })
  } catch (err: any) {
    console.error('Error en /api/email/horario:', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
