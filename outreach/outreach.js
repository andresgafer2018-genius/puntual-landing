/**
 * PUNTUAL — Outreach automático a escuelas secundarias
 *
 * Lee las escuelas pendientes de la tabla `escuelas_outreach` (Supabase),
 * redacta un mail personalizado para cada una con Claude y lo envía por Gmail.
 * Corre en GitHub Actions (.github/workflows/outreach.yml).
 *
 * Variables de entorno (GitHub Secrets / Variables):
 *   ANTHROPIC_API_KEY, GMAIL_USER, GMAIL_APP_PASSWORD,
 *   SUPABASE_URL, SUPABASE_SERVICE_KEY   (secrets)
 *   MAX_EMAILS_POR_DIA                   (variable, por defecto 10)
 *   EMAIL_PRUEBA  (opcional) → modo prueba: 1 mail a esta dirección, no toca la base
 *   CANTIDAD      (opcional) → pisa MAX_EMAILS_POR_DIA en una corrida manual
 */

const Anthropic = require("@anthropic-ai/sdk");
const { createClient } = require("@supabase/supabase-js");
const nodemailer = require("nodemailer");

// ─── CONFIGURACIÓN ───────────────────────────────────────────────────────────

const TABLA = "escuelas_outreach";
const MODELO = "claude-haiku-4-5-20251001";
const LIMITE_MAXIMO = 100; // tope de seguridad por corrida
const ESPERA_MIN_MS = 2 * 60 * 1000; // entre mails: 2 a 4 minutos al azar
const ESPERA_MAX_MS = 4 * 60 * 1000;
const WEB = "https://puntualhorarios.com";

const requeridas = [
  "ANTHROPIC_API_KEY",
  "GMAIL_USER",
  "GMAIL_APP_PASSWORD",
  "SUPABASE_URL",
  "SUPABASE_SERVICE_KEY",
];
const faltantes = requeridas.filter((v) => !process.env[v]);
if (faltantes.length) {
  console.error(`❌ Faltan estas variables de entorno: ${faltantes.join(", ")}`);
  console.error("   Revisá Settings → Secrets and variables → Actions en GitHub.");
  process.exit(1);
}

const EMAIL_PRUEBA = (process.env.EMAIL_PRUEBA || "").trim();
const MODO_PRUEBA = EMAIL_PRUEBA !== "";
const cantidadPedida = parseInt(process.env.CANTIDAD || process.env.MAX_EMAILS_POR_DIA || "10", 10);
const CANTIDAD = MODO_PRUEBA
  ? 1
  : Math.min(Number.isFinite(cantidadPedida) && cantidadPedida > 0 ? cantidadPedida : 10, LIMITE_MAXIMO);

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false },
});
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD.replace(/\s+/g, ""),
  },
});

const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
const azar = (min, max) => Math.floor(min + Math.random() * (max - min));

// Pasa "INSTITUTO SAN JOSE" a "Instituto San Jose" para que el mail no grite
function capitalizar(texto) {
  const minusculas = ["de", "del", "la", "las", "los", "el", "y", "e"];
  return String(texto || "")
    .toLowerCase()
    .split(/\s+/)
    .map((p, i) => (i > 0 && minusculas.includes(p) ? p : p.charAt(0).toUpperCase() + p.slice(1)))
    .join(" ");
}

// ─── REDACCIÓN DEL MAIL ──────────────────────────────────────────────────────

const PIE = `\n\n—\nSi no desea recibir más correos de Puntual, responda a este mensaje con la palabra BAJA.`;

function plantillaRespaldo(escuela) {
  const nombre = capitalizar(escuela.nombre);
  return {
    asunto: `Horarios escolares sin conflictos para ${nombre}`,
    cuerpo:
      `Estimado equipo directivo de ${nombre}:\n\n` +
      `Me comunico para presentarles Puntual, una herramienta argentina que genera automáticamente ` +
      `los horarios del colegio, sin superposiciones de docentes ni de aulas. Contempla la disponibilidad ` +
      `de cada profesor, permite editar en tiempo real y exportar a PDF y Excel.\n\n` +
      `Pueden probarla gratis durante 15 días, sin compromiso: ${WEB}\n\n` +
      `Si les interesa, con gusto les muestro cómo funciona en una llamada breve.\n\n` +
      `Saludos cordiales,\nAndy\nPuntual — ${WEB}`,
  };
}

async function redactarMail(escuela) {
  const nombre = capitalizar(escuela.nombre);
  const lugar =
    escuela.provincia === "CABA"
      ? "la Ciudad de Buenos Aires"
      : `${capitalizar(escuela.localidad)}, provincia de Buenos Aires`;

  const prompt = `Redactá un email comercial breve, en español rioplatense formal (tratar de "ustedes"), dirigido al equipo directivo de una escuela secundaria privada argentina.

Escuela: ${nombre}
Ubicación: ${lugar}

Producto: Puntual (${WEB}), software argentino que genera automáticamente los horarios escolares.
Funciones reales (no inventes otras):
- Generación automática de horarios sin conflictos de docentes ni aulas
- Gestión de la disponibilidad de cada docente
- Franjas horarias flexibles
- Edición en tiempo real
- Exportación a PDF y Excel
Oferta: prueba gratuita de 15 días, sin compromiso.

Reglas:
- Máximo 130 palabras en el cuerpo. Tono cálido y profesional, nada exagerado.
- Mencioná el nombre de la escuela de forma natural. Podés aludir a lo que cuesta armar horarios a principio de año o cuando cambian docentes.
- NO inventes datos: ni cantidad de clientes, ni testimonios, ni precios, ni porcentajes.
- Llamada a la acción: probarlo gratis en ${WEB} o responder el mail para coordinar una demo breve.
- Firma exactamente así, en dos líneas: "Andy" y "Puntual — ${WEB}".
- Texto plano, sin markdown, sin emojis.
- Asunto: corto (menos de 60 caracteres), sin mayúsculas sostenidas, que no suene a spam.

Respondé SOLO con un JSON válido, sin texto adicional ni backticks:
{"asunto": "...", "cuerpo": "..."}`;

  const respuesta = await anthropic.messages.create({
    model: MODELO,
    max_tokens: 800,
    messages: [{ role: "user", content: prompt }],
  });

  const texto = respuesta.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("")
    .replace(/```json|```/g, "")
    .trim();

  const datos = JSON.parse(texto);
  if (!datos.asunto || !datos.cuerpo) throw new Error("JSON sin asunto o cuerpo");
  return { asunto: String(datos.asunto).trim(), cuerpo: String(datos.cuerpo).trim() };
}

// ─── ENVÍO ───────────────────────────────────────────────────────────────────

function esRechazoDelDestinatario(err) {
  // 5xx = el servidor rechazó la dirección (no existe, buzón lleno definitivo, etc.)
  const codigo = err && err.responseCode;
  return typeof codigo === "number" && codigo >= 500 && codigo < 600;
}

async function main() {
  console.log(MODO_PRUEBA ? `🧪 MODO PRUEBA → se envía 1 mail a ${EMAIL_PRUEBA}` : `📨 Envío real → hasta ${CANTIDAD} mails`);

  // Verifica Gmail antes de empezar
  try {
    await transporter.verify();
    console.log(`✅ Gmail conectado (${process.env.GMAIL_USER})`);
  } catch (err) {
    console.error("❌ No se pudo conectar a Gmail. Revisá GMAIL_USER y GMAIL_APP_PASSWORD.");
    console.error(`   Detalle: ${err.message}`);
    process.exit(1);
  }

  const { data: escuelas, error } = await supabase
    .from(TABLA)
    .select("id, nombre, email, provincia, partido, localidad")
    .eq("enviado", false)
    .is("error", null)
    .order("id", { ascending: true })
    .limit(CANTIDAD);

  if (error) {
    console.error("❌ Error leyendo Supabase. Revisá SUPABASE_URL y SUPABASE_SERVICE_KEY.");
    console.error(`   Detalle: ${error.message}`);
    process.exit(1);
  }
  if (!escuelas || escuelas.length === 0) {
    console.log("🎉 No quedan escuelas pendientes. ¡Lista completa!");
    return;
  }

  let enviados = 0;
  let rechazados = 0;
  let fallidos = 0;

  for (let i = 0; i < escuelas.length; i++) {
    const escuela = escuelas[i];
    const destino = MODO_PRUEBA ? EMAIL_PRUEBA : escuela.email;
    console.log(`\n[${i + 1}/${escuelas.length}] ${escuela.nombre} → ${destino}`);

    let mail;
    try {
      mail = await redactarMail(escuela);
    } catch (err) {
      console.warn(`   ⚠️ No se pudo redactar con IA (${err.message}). Uso la plantilla de respaldo.`);
      mail = plantillaRespaldo(escuela);
    }

    try {
      await transporter.sendMail({
        from: `"Puntual" <${process.env.GMAIL_USER}>`,
        to: destino,
        replyTo: process.env.GMAIL_USER,
        subject: MODO_PRUEBA ? `[PRUEBA] ${mail.asunto}` : mail.asunto,
        text: mail.cuerpo + PIE,
      });
      enviados++;
      console.log(`   ✅ Enviado — Asunto: "${mail.asunto}"`);

      if (!MODO_PRUEBA) {
        const { error: errUpd } = await supabase
          .from(TABLA)
          .update({ enviado: true, fecha_envio: new Date().toISOString(), error: null })
          .eq("id", escuela.id);
        if (errUpd) console.warn(`   ⚠️ Enviado, pero no se pudo marcar en Supabase: ${errUpd.message}`);
      } else {
        console.log("\n--- Vista previa del mail ---\n" + mail.cuerpo + PIE + "\n-----------------------------");
      }
    } catch (err) {
      if (err.code === "EAUTH") {
        console.error("❌ Gmail rechazó el usuario o la contraseña. Corto la corrida.");
        process.exit(1);
      }
      if (esRechazoDelDestinatario(err)) {
        rechazados++;
        console.warn(`   🚫 Dirección rechazada (${err.responseCode}): ${err.message}`);
        if (!MODO_PRUEBA) {
          await supabase
            .from(TABLA)
            .update({ error: `${err.responseCode}: ${String(err.message).slice(0, 300)}` })
            .eq("id", escuela.id);
        }
      } else {
        fallidos++;
        console.warn(`   ⚠️ Falló el envío (se reintenta en otra corrida): ${err.message}`);
      }
    }

    if (i < escuelas.length - 1) {
      const ms = azar(ESPERA_MIN_MS, ESPERA_MAX_MS);
      console.log(`   ⏳ Espero ${Math.round(ms / 1000)} s antes del próximo...`);
      await esperar(ms);
    }
  }

  console.log(`\n📊 Resumen: ${enviados} enviados, ${rechazados} rechazados, ${fallidos} con error temporal.`);
  if (enviados === 0) process.exit(1); // la corrida queda en rojo si no salió ninguno
}

main().catch((err) => {
  console.error("❌ Error inesperado:", err);
  process.exit(1);
});
