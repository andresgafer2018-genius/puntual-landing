import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'

// Primer ingreso de una escuela nueva.
// La llama /login apenas el usuario inicia sesión. Si es la primera vez
// (todavía no tiene la marca bienvenida_enviada en su perfil), manda:
//   1) el mail de bienvenida a la escuela
//   2) un aviso a Puntual para contactarla
// Después el login marca bienvenida_enviada = true para no repetirlo.
//
// La fila en 'escuelas' la crea Supabase solo (trigger on_auth_user_created)
// al registrarse; este aviso sale recién cuando la escuela ya confirmó y entró.

const resend = new Resend(process.env.RESEND_API_KEY)
const AVISO_A = 'puntualhorarios@gmail.com'
const SUPABASE_URL = 'https://ictemkwmsqgktpxvvxjg.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_dD9nCSBl1xsl9rckxvfbMA_HmukQoBc'

// Cuentas creadas antes de esta fecha no reciben bienvenida ni aviso
// (son cuentas viejas o de prueba que ya existían antes de este cambio).
const DESDE = new Date('2026-10-20T00:00:00-03:00')

function esc(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!))
}

export async function POST(req: NextRequest) {
  try {
    const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '')
    if (!token) return NextResponse.json({ error: 'Sin sesión' }, { status: 401 })

    // Cliente con la sesión del usuario: solo ve su propia escuela (RLS)
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false },
    })

    const { data: userData, error: userError } = await supabase.auth.getUser(token)
    const user = userData?.user
    if (userError || !user) return NextResponse.json({ error: 'Sesión inválida' }, { status: 401 })

    // Ya se mandó antes → nada que hacer
    if (user.user_metadata?.bienvenida_enviada) {
      return NextResponse.json({ enviado: false, marcar: false })
    }
    // Cuenta vieja → no mandar, pero marcar para no volver a preguntar
    if (new Date(user.created_at) < DESDE) {
      return NextResponse.json({ enviado: false, marcar: true })
    }

    const { data: escuela } = await supabase
      .from('escuelas')
      .select('nombre, plan_vence')
      .eq('owner_id', user.id)
      .maybeSingle()

    const nombre: string = user.user_metadata?.nombre || ''
    const escuelaNombre: string = escuela?.nombre || user.user_metadata?.nombre_escuela || 'tu escuela'
    const email = user.email || ''
    const zona = { timeZone: 'America/Argentina/Buenos_Aires' } as const
    const registro = new Date(user.created_at).toLocaleString('es-AR', zona)
    const vence = escuela?.plan_vence ? new Date(escuela.plan_vence).toLocaleDateString('es-AR', zona) : '—'

    // 1) Bienvenida a la escuela (ya confirmó y está entrando a la app)
    const bienvenida = await resend.emails.send({
      from: 'Puntual <horarios@send.puntualhorarios.com>',
      replyTo: AVISO_A,
      to: email,
      subject: `¡Bienvenido/a a Puntual${nombre ? `, ${nombre}` : ''}!`,
      html: `
        <div style="font-family: 'DM Sans', Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #f7f8fc; padding: 32px 16px;">
          <div style="background: #fff; border-radius: 16px; padding: 36px 32px; box-shadow: 0 2px 12px rgba(0,0,0,0.06);">

            <div style="text-align: center; margin-bottom: 28px;">
              <span style="font-size: 28px; font-weight: 800; color: #1a1f35; letter-spacing: -0.5px;">Puntual</span>
            </div>

            <h2 style="font-size: 22px; font-weight: 700; color: #1a1f35; margin: 0 0 12px;">
              ¡Bienvenido/a${nombre ? `, ${esc(nombre)}` : ''}! 🎉
            </h2>
            <p style="font-size: 15px; color: #4a5578; line-height: 1.6; margin: 0 0 24px;">
              Tu cuenta para <strong>${esc(escuelaNombre)}</strong> ya está activa y tenés
              <strong>15 días de prueba gratis</strong>${vence !== '—' ? ` (hasta el ${vence})` : ''}.
              Ya podés empezar a armar los horarios de tu escuela.
            </p>

            <div style="background: #f0f4ff; border-radius: 10px; padding: 20px 24px; margin-bottom: 28px;">
              <p style="font-size: 14px; font-weight: 700; color: #1a1f35; margin: 0 0 12px;">¿Por dónde empezar?</p>
              <ol style="font-size: 14px; color: #4a5578; margin: 0; padding-left: 18px; line-height: 2;">
                <li>Configurá los módulos horarios de tu escuela</li>
                <li>Cargá tus docentes y materias</li>
                <li>¡Generá el horario automáticamente!</li>
              </ol>
            </div>

            <div style="text-align: center; margin-bottom: 28px;">
              <a href="https://puntualhorarios.com/login"
                 style="display: inline-block; background: #4f8ef7; color: #fff; text-decoration: none;
                        padding: 14px 32px; border-radius: 10px; font-size: 15px; font-weight: 700;">
                Ir a la app →
              </a>
            </div>

            <p style="font-size: 14px; color: #4a5578; line-height: 1.6; margin: 0 0 8px;">
              ¿Alguna duda para cargar los datos? Respondé este mail y te ayudo.
            </p>

            <hr style="border: none; border-top: 1px solid #e8eaf2; margin: 24px 0;" />

            <p style="font-size: 12px; color: #8892b0; text-align: center; margin: 0;">
              <strong>Puntual</strong> · El orden que tu escuela necesita
            </p>
          </div>
        </div>
      `,
    })
    if (bienvenida.error) console.error('bienvenida: error mandando mail a la escuela', bienvenida.error)

    // 2) Aviso a Puntual (responder el mail le escribe directo a la escuela)
    const aviso = await resend.emails.send({
      from: 'Puntual <horarios@send.puntualhorarios.com>',
      to: AVISO_A,
      replyTo: email,
      subject: `🎉 Nueva escuela en prueba — ${escuelaNombre}`,
      html: `
        <div style="font-family: Arial, sans-serif; font-size: 15px; color: #1a1f35; line-height: 1.6;">
          <h2 style="margin: 0 0 12px;">Una escuela nueva entró a Puntual por primera vez</h2>
          <p style="margin: 0 0 4px;"><strong>Escuela:</strong> ${esc(escuelaNombre)}</p>
          <p style="margin: 0 0 4px;"><strong>Contacto:</strong> ${esc(nombre || '(sin nombre)')}</p>
          <p style="margin: 0 0 4px;"><strong>Email:</strong> ${esc(email)}</p>
          <p style="margin: 0 0 4px;"><strong>Se registró:</strong> ${registro}</p>
          <p style="margin: 0 0 16px;"><strong>La prueba vence:</strong> ${vence}</p>
          <p style="margin: 0; color: #4a5578;">Respondé este mail para escribirle directamente y ofrecerle ayuda para cargar los datos.</p>
        </div>`,
    })
    if (aviso.error) console.error('bienvenida: error mandando aviso a Puntual', aviso.error)

    // Se marca solo si salió al menos uno; si fallaron los dos, se reintenta en el próximo ingreso
    const salio = !bienvenida.error || !aviso.error
    return NextResponse.json({ enviado: salio, marcar: salio })
  } catch (err: any) {
    console.error('Error en /api/email/bienvenida:', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
