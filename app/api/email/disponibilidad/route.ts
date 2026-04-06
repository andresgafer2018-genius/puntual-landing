import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  try {
    const { profesorNombre, profesorEmail, escuelaNombre, anio, adjuntoBase64, adjuntoNombre } = await req.json()

    if (!profesorEmail || !adjuntoBase64) {
      return NextResponse.json({ error: 'Faltan datos requeridos' }, { status: 400 })
    }

    const { data, error } = await resend.emails.send({
      from: 'Puntual <onboarding@resend.dev>',
      to: profesorEmail,
      subject: `Formulario de Disponibilidad ${anio || ''} – ${escuelaNombre}`,
      html: `
        <div style="font-family: 'DM Sans', Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #f7f8fc; padding: 32px 16px;">
          <div style="background: #fff; border-radius: 16px; padding: 36px 32px; box-shadow: 0 2px 12px rgba(0,0,0,0.06);">

            <div style="text-align: center; margin-bottom: 28px;">
              <span style="font-size: 28px; font-weight: 800; color: #1a1f35; letter-spacing: -0.5px;">Puntual</span>
            </div>

            <h2 style="font-size: 20px; font-weight: 700; color: #1a1f35; margin: 0 0 8px;">
              Hola, ${profesorNombre} 👋
            </h2>
            <p style="font-size: 15px; color: #4a5578; line-height: 1.6; margin: 0 0 24px;">
              <strong>${escuelaNombre}</strong> te envía el formulario de disponibilidad horaria 
              para el año <strong>${anio || 'próximo'}</strong>.
            </p>

            <div style="background: #f0f4ff; border-radius: 10px; padding: 16px 20px; margin-bottom: 16px;">
              <p style="font-size: 13px; color: #4f8ef7; font-weight: 600; margin: 0 0 4px;">📋 Instrucciones</p>
              <ol style="font-size: 14px; color: #1a1f35; margin: 0; padding-left: 18px; line-height: 1.8;">
                <li>Abrí el archivo adjunto en tu navegador</li>
                <li>Hacé clic en los módulos en que estés disponible</li>
                <li>Enviá el resultado a la secretaría de la escuela</li>
              </ol>
            </div>

            <div style="background: #f0f4ff; border-radius: 10px; padding: 16px 20px; margin-bottom: 24px;">
              <p style="font-size: 13px; color: #4f8ef7; font-weight: 600; margin: 0 0 4px;">📎 Archivo adjunto</p>
              <p style="font-size: 14px; color: #1a1f35; margin: 0;">${adjuntoNombre || 'disponibilidad.html'}</p>
            </div>

            <hr style="border: none; border-top: 1px solid #e8eaf2; margin: 24px 0;" />

            <p style="font-size: 12px; color: #8892b0; text-align: center; margin: 0;">
              Este email fue enviado por <strong>${escuelaNombre}</strong> usando Puntual.<br/>
              Si creés que recibiste este mensaje por error, ignoralo.
            </p>
          </div>
        </div>
      `,
      attachments: [
        {
          filename: adjuntoNombre || 'disponibilidad.html',
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
    console.error('Error en /api/email/disponibilidad:', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
