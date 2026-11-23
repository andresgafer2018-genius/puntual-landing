/**
 * PUNTUAL — Detección automática de rebotes
 *
 * Entra por IMAP a la casilla de Gmail del outreach, busca los avisos de
 * "Mail Delivery Subsystem" (mailer-daemon / postmaster) de los últimos DIAS_ATRAS días
 * y, para cada mail que NO se pudo entregar en forma definitiva ("Action: failed"),
 * marca la escuela en `escuelas_outreach`:
 *   - error     = "rebote: <motivo>"   → sale de la cola de nuevos y de seguimientos
 *   - no_seguir = true
 *
 * Los avisos de demora ("Gmail seguirá intentando", "Action: delayed") se ignoran:
 * recién cuenta cuando Gmail se rinde.
 * Es idempotente: solo toca escuelas que todavía no tienen error, así que puede
 * correr en cada corrida sin marcar nada dos veces.
 */

const { ImapFlow } = require("imapflow");

const TABLA = "escuelas_outreach";
const DIAS_ATRAS = 10;

// Saca de un aviso de rebote los destinatarios que fallaron en forma definitiva.
// Devuelve [{ email, motivo }]
function extraerFallidos(fuente) {
  const texto = String(fuente).replace(/\r\n/g, "\n");
  const fallidos = new Map();

  // Formato estándar (RFC 3464): bloques con Final-Recipient / Action / Diagnostic-Code
  const bloques = texto.split(/\n\s*\n/);
  for (const bloque of bloques) {
    // une las líneas que continúan con sangría
    const b = bloque.replace(/\n[ \t]+/g, " ");
    const dest = b.match(/^(?:Final|Original)-Recipient:\s*rfc822;\s*<?([^\s>]+@[^\s>]+)>?/im);
    const accion = b.match(/^Action:\s*(\w+)/im);
    if (!dest || !accion) continue;
    if (accion[1].toLowerCase() !== "failed") continue;
    const diag = b.match(/^Diagnostic-Code:\s*(?:smtp;\s*)?(.+)$/im);
    const estado = b.match(/^Status:\s*([\d.]+)/im);
    const motivo = (diag ? diag[1] : estado ? `status ${estado[1]}` : "no se pudo entregar").trim();
    fallidos.set(dest[1].toLowerCase(), motivo);
  }

  // Respaldo: avisos sin bloque estándar pero con el encabezado X-Failed-Recipients,
  // solo si el aviso es de falla definitiva (no de demora)
  if (fallidos.size === 0 && !/Action:\s*delayed/i.test(texto)) {
    const esFalla = /\(Failure\)|no se envi[oó]|not delivered|Undelivered Mail|returned to sender/i.test(texto);
    const h = texto.match(/^X-Failed-Recipients:\s*(.+)$/im);
    if (esFalla && h) {
      for (const dir of h[1].split(/[,\s]+/).filter((d) => d.includes("@"))) {
        fallidos.set(dir.toLowerCase(), "no se pudo entregar");
      }
    }
  }

  return [...fallidos].map(([email, motivo]) => ({ email, motivo: motivo.replace(/\s+/g, " ").slice(0, 250) }));
}

// Busca la carpeta "Todos" de Gmail (sirve aunque el aviso se haya archivado); si no, Recibidos
async function carpetaTodos(cliente) {
  const carpetas = await cliente.list();
  const todos = carpetas.find((c) => c.specialUse === "\\All");
  return todos ? todos.path : "INBOX";
}

function escaparLike(s) {
  return s.replace(/[\\%_]/g, (c) => "\\" + c);
}

async function revisarRebotes(supabase) {
  const cliente = new ImapFlow({
    host: "imap.gmail.com",
    port: 993,
    secure: true,
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD.replace(/\s+/g, ""),
    },
    logger: false,
  });

  const resumen = { avisos: 0, marcadas: [] };
  await cliente.connect();
  try {
    const carpeta = await carpetaTodos(cliente);
    const lock = await cliente.getMailboxLock(carpeta, { readOnly: true });
    try {
      const uids = await cliente.search(
        { gmraw: `from:(mailer-daemon OR postmaster) newer_than:${DIAS_ATRAS}d` },
        { uid: true }
      );
      resumen.avisos = (uids || []).length;
      if (!resumen.avisos) return resumen;

      const fallidos = new Map();
      for await (const msg of cliente.fetch(uids, { source: true }, { uid: true })) {
        for (const f of extraerFallidos(msg.source)) fallidos.set(f.email, f.motivo);
      }

      for (const [email, motivo] of fallidos) {
        const { data, error } = await supabase
          .from(TABLA)
          .update({ error: `rebote: ${motivo}`, no_seguir: true })
          .ilike("email", escaparLike(email))
          .is("error", null)
          .select("id, nombre");
        if (error) {
          console.warn(`   ⚠️ No se pudo marcar el rebote de ${email}: ${error.message}`);
          continue;
        }
        for (const e of data || []) resumen.marcadas.push({ ...e, email, motivo });
      }
    } finally {
      lock.release();
    }
  } finally {
    await cliente.logout().catch(() => {});
  }
  return resumen;
}

module.exports = { revisarRebotes, extraerFallidos };
