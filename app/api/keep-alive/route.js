import { NextResponse } from "next/server";
import { Resend } from "resend";
import { supabase } from "@/lib/supabase";

// Vercel Cron llama a este endpoint una vez por día (ver vercel.json).
// 1) Keep-alive: una consulta liviana resetea el contador de inactividad de
//    Supabase y evita que el proyecto se pause en el plan gratuito.
// 2) Backup diario: junta los datos de todas las cuentas (tabla datos_usuario
//    + plan de la tabla escuelas + email) y los manda por mail como adjunto
//    a BACKUP_EMAIL. Si el backup falla, el keep-alive igual cuenta como hecho.

const SUPABASE_URL = "https://ictemkwmsqgktpxvvxjg.supabase.co";
const BACKUP_EMAIL = "puntualhorarios@gmail.com";

async function leerTabla(path, serviceKey) {
  const res = await fetch(`${SUPABASE_URL}${path}`, {
    headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`${path} → ${res.status} ${await res.text()}`);
  return res.json();
}

function escaparHtml(t) {
  return String(t ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}

async function hacerBackup() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) throw new Error("Falta SUPABASE_SERVICE_ROLE_KEY en Vercel");
  if (!process.env.RESEND_API_KEY) throw new Error("Falta RESEND_API_KEY en Vercel");

  const [datos, escuelas, usuarios] = await Promise.all([
    leerTabla("/rest/v1/datos_usuario?select=*", serviceKey),
    leerTabla("/rest/v1/escuelas?select=*", serviceKey),
    leerTabla("/auth/v1/admin/users?per_page=1000", serviceKey),
  ]);

  const emailDe = {};
  for (const u of usuarios.users || []) emailDe[u.id] = u.email;
  const escuelaDe = {};
  for (const e of escuelas) if (e.owner_id) escuelaDe[e.owner_id] = e;

  const cuentas = datos.map((fila) => {
    const d = fila.datos || {};
    const esc = escuelaDe[fila.owner_id] || null;
    return {
      owner_id: fila.owner_id,
      email: emailDe[fila.owner_id] || null,
      escuela: esc ? esc.nombre : (d.config && d.config.nombreEscuela) || null,
      plan: esc ? esc.plan : null,
      updated_at: fila.updated_at,
      datos: d,
    };
  });

  const fecha = new Date().toLocaleDateString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" });
  const fechaArchivo = new Date().toISOString().slice(0, 10);
  const contenido = JSON.stringify({ generado: new Date().toISOString(), cuentas, escuelas }, null, 1);

  const filas = cuentas
    .map((c) => {
      const d = c.datos || {};
      return `<tr>
        <td style="padding:6px 10px;border-bottom:1px solid #eee;">${escaparHtml(c.email || c.owner_id)}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #eee;">${escaparHtml(c.escuela || "—")}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #eee;">${escaparHtml(c.plan || "—")}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #eee;text-align:center;">${(d.profesores || []).length}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #eee;text-align:center;">${(d.cursos || []).length}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #eee;">${escaparHtml(new Date(c.updated_at).toLocaleString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" }))}</td>
      </tr>`;
    })
    .join("");

  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error } = await resend.emails.send({
    from: "Puntual <horarios@send.puntualhorarios.com>",
    to: BACKUP_EMAIL,
    subject: `Backup Puntual — ${fecha} — ${cuentas.length} cuenta${cuentas.length === 1 ? "" : "s"}`,
    html: `<div style="font-family:Arial,sans-serif;font-size:14px;color:#1a1f35;">
      <p><strong>Backup diario de Puntual</strong> — ${escaparHtml(fecha)}</p>
      <p>El archivo adjunto tiene los datos completos de todas las cuentas. Guardalo: sirve para restaurar un colegio si algo se pierde.</p>
      <table style="border-collapse:collapse;font-size:13px;">
        <tr style="background:#f0f4ff;text-align:left;">
          <th style="padding:6px 10px;">Cuenta</th><th style="padding:6px 10px;">Escuela</th><th style="padding:6px 10px;">Plan</th>
          <th style="padding:6px 10px;">Profesores</th><th style="padding:6px 10px;">Cursos</th><th style="padding:6px 10px;">Último guardado</th>
        </tr>${filas}
      </table>
    </div>`,
    attachments: [{ filename: `backup-puntual-${fechaArchivo}.json`, content: Buffer.from(contenido, "utf-8") }],
  });
  if (error) throw new Error(`Resend: ${JSON.stringify(error)}`);
  return { cuentas: cuentas.length, bytes: contenido.length };
}

export async function GET(request) {
  // Si configuraste la variable de entorno CRON_SECRET en Vercel,
  // esto evita que cualquiera pueda golpear el endpoint desde afuera.
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
  } catch (error) {
    console.error("Error en /api/keep-alive:", error);
    return NextResponse.json({ ok: false, error: "Error interno del servidor" }, { status: 500 });
  }

  let backup;
  try {
    backup = { ok: true, ...(await hacerBackup()) };
  } catch (error) {
    console.error("Error en el backup diario:", error);
    backup = { ok: false, error: String(error.message || error) };
  }

  return NextResponse.json({ ok: true, ts: new Date().toISOString(), backup });
}
