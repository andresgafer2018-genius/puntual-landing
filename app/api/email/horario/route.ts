import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import * as XLSX from 'xlsx'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  try {
    const {
      profesorNombre,
      profesorEmail,
      escuelaNombre,
      icsBase64,
      icsNombre,
      htmlCuerpo,
      xlsxData,
      xlsxNombre,
    } = await req.json()

    if (!profesorEmail) {
      return NextResponse.json({ error: 'Faltan datos requeridos' }, { status: 400 })
    }

    const attachments: any[] = []

    // Excel generado en el servidor — no viaja como base64 desde el cliente
    if (xlsxData && xlsxData.length > 0) {
      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.json_to_sheet(xlsxData)
      XLSX.utils.book_append_sheet(wb, ws, 'Horario')
      const excelBase64 = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' })
      attachments.push({
        filename: xlsxNombre || `${profesorNombre}.xlsx`,
        content: excelBase64,
      })
    }

    if (icsBase64 && icsNombre) {
      attachments.push({
        filename: icsNombre,
        content: icsBase64,
      })
    }

    const { data, error } = await resend.emails.send({
      from: 'Puntual <onboarding@resend.dev>',
      to: profesorEmail,
      subject: `Tu horario semanal – ${escuelaNombre}`,
      html: htmlCuerpo || `<p>Hola ${profesorNombre}, adjuntamos tu horario semanal de ${escuelaNombre}.</p>`,
      attachments,
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
