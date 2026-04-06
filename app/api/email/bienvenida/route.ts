import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  try {
    const { nombre, escuelaNombre, email } = await req.json()

    if (!email || !nombre) {
      return NextResponse.json({ error: 'Faltan datos requeridos' }, { status: 400 })
    }

    const { data, error } = await resend.emails.send({
      from: 'Puntual <onboarding@resend.dev>',
      to: email,
      subject: `¡Bienvenido/a a Puntual, ${nombre}!`,
      html: `
        <div style="font-family: 'DM Sans', Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #f7f8fc; padding: 32px 16px;">
          <div style="background: #fff; border-radius: 16px; padding: 36px 32px; box-shadow: 0 2px 12px rgba(0,0,0,0.06);">

            <div style="text-align: center; margin-bottom: 28px;">
              <span style="font-size: 28px; font-weight: 800; color: #1a1f35; letter-spacing: -0.5px;">Puntual</span>
            </div>

            <h2 style="font-size: 22px; font-weight: 700; color: #1a1f35; margin: 0 0 12px;">
              ¡Bienvenido/a, ${nombre}! 🎉
            </h2>
            <p style="font-size: 15px; color: #4a5578; line-height: 1.6; margin: 0 0 24px;">
              Tu cuenta para <strong>${escuelaNombre}</strong> fue creada exitosamente. 
              Ya podés empezar a armar los horarios de tu escuela.
            </p>

            <div style="background: #f0f4ff; border-radius: 10px; padding: 20px 24px; margin-bottom: 28px;">
              <p style="font-size: 14px; font-weight: 700; color: #1a1f35; margin: 0 0 12px;">¿Por dónde empezar?</p>
              <ol style="font-size: 14px; color: #4a5578; margin: 0; padding-left: 18px; line-height: 2;">
                <li>Confirmá tu email haciendo clic en el link que te enviamos</li>
                <li>Ingresá a la app y configurá los módulos horarios</li>
                <li>Cargá tus docentes y materias</li>
                <li>¡Generá el horario automáticamente!</li>
              </ol>
            </div>

            <div style="text-align: center; margin-bottom: 28px;">
              <a href="https://puntual-landing.vercel.app/login" 
                 style="display: inline-block; background: #4f8ef7; color: #fff; text-decoration: none; 
                        padding: 14px 32px; border-radius: 10px; font-size: 15px; font-weight: 700;">
                Ir a la app →
              </a>
            </div>

            <hr style="border: none; border-top: 1px solid #e8eaf2; margin: 24px 0;" />

            <p style="font-size: 12px; color: #8892b0; text-align: center; margin: 0;">
              Si no creaste esta cuenta, podés ignorar este email.<br/>
              <strong>Puntual</strong> · El orden que tu escuela necesita
            </p>
          </div>
        </div>
      `,
    })

    if (error) {
      console.error('Resend error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, id: data?.id })
  } catch (err: any) {
    console.error('Error en /api/email/bienvenida:', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
