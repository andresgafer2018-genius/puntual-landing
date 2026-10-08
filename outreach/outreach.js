/**
 * PUNTUAL — Outreach automático a escuelas secundarias
 *
 * Lee las escuelas pendientes de la tabla `escuelas_outreach` (Supabase),
 * arma el mail eligiendo al azar una de 4 versiones de texto y lo envía por Gmail.
 * Corre en GitHub Actions (.github/workflows/outreach.yml), 5 veces por día hábil,
 * mandando 1 mail por corrida.
 *
 * Variables de entorno (GitHub Secrets / Variables):
 *   GMAIL_USER, GMAIL_APP_PASSWORD, SUPABASE_URL, SUPABASE_SERVICE_KEY  (secrets)
 *   MAX_EMAILS_POR_DIA  (variable) → tope diario total, por defecto 5
 *   EMAIL_PRUEBA  (opcional) → modo prueba: manda las 4 versiones a esta dirección, no toca la base
 *   CANTIDAD      (opcional) → corrida manual: cuántos mails mandar ahora (saltea los controles de horario)
 */

const { createClient } = require("@supabase/supabase-js");
const nodemailer = require("nodemailer");

// ─── CONFIGURACIÓN ───────────────────────────────────────────────────────────

const TABLA = "escuelas_outreach";
const LIMITE_MAXIMO = 20; // tope de seguridad por corrida manual
const SEPARACION_MINIMA_MIN = 90; // no mandar si el último mail salió hace menos de esto
const ESPERA_MIN_MS = 2 * 60 * 1000; // en corridas manuales de varios mails: 2 a 4 min entre mails
const ESPERA_MAX_MS = 4 * 60 * 1000;

const requeridas = ["GMAIL_USER", "GMAIL_APP_PASSWORD", "SUPABASE_URL", "SUPABASE_SERVICE_KEY"];
const faltantes = requeridas.filter((v) => !process.env[v]);
if (faltantes.length) {
  console.error(`❌ Faltan estas variables de entorno: ${faltantes.join(", ")}`);
  console.error("   Revisá Settings → Secrets and variables → Actions en GitHub.");
  process.exit(1);
}

const EMAIL_PRUEBA = (process.env.EMAIL_PRUEBA || "").trim();
const MODO_PRUEBA = EMAIL_PRUEBA !== "";
const cantidadManual = parseInt(process.env.CANTIDAD || "", 10);
const ES_MANUAL = Number.isFinite(cantidadManual) && cantidadManual > 0;
const CANTIDAD = ES_MANUAL ? Math.min(cantidadManual, LIMITE_MAXIMO) : 1;
const topeDiario = parseInt(process.env.MAX_EMAILS_POR_DIA || "5", 10);
const MAX_POR_DIA = Number.isFinite(topeDiario) && topeDiario > 0 ? topeDiario : 5;

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

// ─── NOMBRE DE LA ESCUELA ────────────────────────────────────────────────────

const ABREVIATURAS = { "inst.": "Instituto", "esc.": "Escuela", "col.": "Colegio", "coleg.": "Colegio" };
const MINUSCULAS = ["de", "del", "la", "las", "los", "el", "y", "e", "en", "a"];

// "INSTITUTO INDUSTRIAL LUIS A.HUERGO" → "Instituto Industrial Luis A.Huergo"
function capitalizar(texto) {
  return String(texto || "")
    .trim()
    .split(/\s+/)
    .map((palabra, i) => {
      const min = palabra.toLowerCase();
      if (ABREVIATURAS[min]) return ABREVIATURAS[min];
      if (/^\([A-ZÁÉÍÓÚÑ.]{2,}\)$/.test(palabra)) return palabra; // siglas: (IADES)
      if (/^[IVX]{1,5}$/.test(palabra)) return palabra; // números romanos
      if (/^(S\.?A\.?|S\.?R\.?L\.?)$/i.test(palabra)) return palabra.toUpperCase();
      if (i > 0 && MINUSCULAS.includes(min)) return min;
      return min.replace(/(^|[.\-('"])(\p{L})/gu, (_, sep, letra) => sep + letra.toUpperCase());
    })
    .join(" ");
}

// "Instituto San José" → "del Instituto San José"; "Escuela X" → "de la Escuela X"
function conArticulo(nombre) {
  const primera = nombre.split(" ")[0].toLowerCase();
  const femeninas = ["escuela", "comunidad", "fundación", "fundacion", "asociación", "asociacion",
    "academia", "unidad", "casa", "obra", "sociedad", "congregación", "congregacion"];
  const masculinas = ["instituto", "colegio", "liceo", "centro", "jardín", "jardin", "complejo",
    "bachillerato", "seminario", "hogar"];
  if (femeninas.includes(primera)) return `de la ${nombre}`;
  if (masculinas.includes(primera)) return `del ${nombre}`;
  return `de ${nombre}`;
}

// ─── TEXTOS DEL MAIL (4 versiones, se elige una al azar) ─────────────────────

const PIE_BAJA = `—
Si no querés recibir más correos de Puntual, respondé este mensaje con la palabra BAJA.`;

const VERSIONES = [
  // Versión 1 — original de Andy
  (equipo) => ({
    asunto: "Una forma más simple de organizar el horario escolar",
    cuerpo: `Hola, equipo ${equipo}:

Te escribo porque desarrollé Puntual, una herramienta que arma automáticamente el horario semanal de una escuela a partir de las materias, los profesores y sus disponibilidades — evitando los cruces de horarios que suelen aparecer al hacerlo a mano.

Además, cada profesor puede recibir su horario actualizado por mail con un clic, así el equipo directivo no tiene que reenviar planillas ni responder consultas una por una. Y las disponibilidades también se cargan solas: cada profesor completa un formulario que le llega por mail, lo envía a la escuela y entra directo al sistema, sin que nadie tenga que cargarlas a mano.

Hoy en Puntual podés probar cómo funciona gratuitamente: cargás los datos de tu escuela y lo probás vos mismo sin costo ni compromiso. En la página también hay un video paso a paso de cómo se usa, por si preferís verlo primero.

Podés conocerlo acá: www.puntualhorarios.com

Cualquier consulta, quedo a disposición.

Saludos,
Andy
Puntual — puntualhorarios@gmail.com

${PIE_BAJA}`,
  }),

  // Versión 2 — más corta y directa
  (equipo) => ({
    asunto: "Horarios escolares sin cruces, armados en minutos",
    cuerpo: `Estimado equipo ${equipo}:

Me llamo Andy y desarrollé Puntual, una herramienta pensada para escuelas secundarias que arma el horario semanal de forma automática, sin superposiciones entre profesores.

Cada docente completa un formulario con su disponibilidad y lo envía por mail; del lado de la escuela, esos datos se incorporan al sistema automáticamente, sin cargar nada a mano. Y cuando el horario está listo, cada profesor lo recibe actualizado con un clic.

Se puede probar gratis, sin compromiso, cargando los datos de la escuela. En la página hay un video corto que muestra cómo funciona: www.puntualhorarios.com

Si les interesa, con gusto respondo cualquier duda.

Saludos,
Andy — Puntual

${PIE_BAJA}`,
  }),

  // Versión 3 — empieza por el problema
  (equipo) => ({
    asunto: "¿Cuánto tiempo les lleva armar el horario cada año?",
    cuerpo: `Hola, equipo ${equipo}:

Armar el horario de una secundaria suele llevar días: cruzar materias, disponibilidades de cada profesor y evitar superposiciones, todo a mano.

Para eso hice Puntual. Con las materias, los cursos y los profesores cargados, el sistema genera el horario completo automáticamente. Los docentes envían su disponibilidad por mail completando un formulario, esa información entra al sistema sin que nadie la tenga que transcribir, y después cada uno recibe su horario final de la misma forma.

Hay una prueba gratuita para que lo vean con los datos de su propia escuela: www.puntualhorarios.com

Quedo a disposición para lo que necesiten.

Saludos,
Andy
Puntual

${PIE_BAJA}`,
  }),

  // Versión 4 — más personal
  (equipo) => ({
    asunto: "Una herramienta argentina para el horario de su escuela",
    cuerpo: `Hola, ¿cómo están? Les escribo al equipo ${equipo}.

Soy Andy, desarrollador, y hace un tiempo armé Puntual, una aplicación hecha en Argentina para que las escuelas secundarias generen su horario semanal sin cruces y sin tener que resolverlo a mano.

La idea es simplificarle el trabajo a quien arma el horario: los profesores envían su disponibilidad por mail completando un formulario, se incorpora al sistema automáticamente, y después cada uno recibe su horario actualizado sin que nadie tenga que reenviar planillas.

Pueden probarlo gratis cuando quieran en www.puntualhorarios.com (hay un video paso a paso en la página).

Cualquier consulta, me escriben.

Un saludo,
Andy — Puntual

${PIE_BAJA}`,
  }),
];

function armarMail(escuela, indiceVersion) {
  const equipo = conArticulo(capitalizar(escuela.nombre));
  const i = indiceVersion ?? azar(0, VERSIONES.length);
  return { version: i + 1, ...VERSIONES[i](equipo) };
}

// ─── CONTROLES (solo corridas programadas) ───────────────────────────────────

// Medianoche de hoy en Argentina (UTC-3), expresada en UTC
function inicioDelDiaArgentina() {
  const ahoraAR = new Date(Date.now() - 3 * 60 * 60 * 1000);
  const fecha = ahoraAR.toISOString().slice(0, 10);
  return new Date(`${fecha}T03:00:00.000Z`).toISOString();
}

async function puedeEnviarAhora() {
  const { count, error: errCount } = await supabase
    .from(TABLA)
    .select("id", { count: "exact", head: true })
    .eq("enviado", true)
    .gte("fecha_envio", inicioDelDiaArgentina());
  if (errCount) throw new Error(`No se pudo contar los envíos de hoy: ${errCount.message}`);
  if (count >= MAX_POR_DIA) {
    console.log(`⏸️ Hoy ya salieron ${count} mails (tope ${MAX_POR_DIA}). No mando nada en esta corrida.`);
    return false;
  }

  const { data: ultimo, error: errUlt } = await supabase
    .from(TABLA)
    .select("fecha_envio")
    .eq("enviado", true)
    .not("fecha_envio", "is", null)
    .order("fecha_envio", { ascending: false })
    .limit(1);
  if (errUlt) throw new Error(`No se pudo leer el último envío: ${errUlt.message}`);
  if (ultimo && ultimo.length) {
    const minutos = (Date.now() - new Date(ultimo[0].fecha_envio).getTime()) / 60000;
    if (minutos < SEPARACION_MINIMA_MIN) {
      console.log(`⏸️ El último mail salió hace ${Math.round(minutos)} min (mínimo ${SEPARACION_MINIMA_MIN}). No mando nada en esta corrida.`);
      return false;
    }
  }

  console.log(`✅ Hoy van ${count} de ${MAX_POR_DIA}. Se puede enviar.`);
  return true;
}

// ─── ENVÍO ───────────────────────────────────────────────────────────────────

function esRechazoDelDestinatario(err) {
  // 5xx = el servidor rechazó la dirección (no existe, dominio inválido, etc.)
  const codigo = err && err.responseCode;
  return typeof codigo === "number" && codigo >= 500 && codigo < 600;
}

async function conectarGmail() {
  try {
    await transporter.verify();
    console.log(`✅ Gmail conectado (${process.env.GMAIL_USER})`);
  } catch (err) {
    console.error("❌ No se pudo conectar a Gmail. Revisá GMAIL_USER y GMAIL_APP_PASSWORD.");
    console.error(`   Detalle: ${err.message}`);
    process.exit(1);
  }
}

async function modoPrueba() {
  console.log(`🧪 MODO PRUEBA → se mandan las ${VERSIONES.length} versiones a ${EMAIL_PRUEBA}`);
  await conectarGmail();
  const ejemplo = { nombre: "INSTITUTO SANTA ROSA" };
  for (let i = 0; i < VERSIONES.length; i++) {
    const mail = armarMail(ejemplo, i);
    await transporter.sendMail({
      from: `"Puntual" <${process.env.GMAIL_USER}>`,
      to: EMAIL_PRUEBA,
      replyTo: process.env.GMAIL_USER,
      subject: `[PRUEBA v${mail.version}] ${mail.asunto}`,
      text: mail.cuerpo,
    });
    console.log(`   ✅ Versión ${mail.version} enviada`);
    if (i < VERSIONES.length - 1) await esperar(30 * 1000);
  }
}

async function main() {
  if (MODO_PRUEBA) return modoPrueba();

  console.log(ES_MANUAL ? `📨 Corrida manual → hasta ${CANTIDAD} mails` : "📨 Corrida programada → 1 mail");

  if (!ES_MANUAL && !(await puedeEnviarAhora())) return;

  await conectarGmail();

  const { data: escuelas, error } = await supabase
    .from(TABLA)
    .select("id, nombre, email")
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
    const mail = armarMail(escuela);
    console.log(`\n[${i + 1}/${escuelas.length}] ${escuela.nombre} → ${escuela.email} (versión ${mail.version})`);

    try {
      await transporter.sendMail({
        from: `"Puntual" <${process.env.GMAIL_USER}>`,
        to: escuela.email,
        replyTo: process.env.GMAIL_USER,
        subject: mail.asunto,
        text: mail.cuerpo,
      });
      enviados++;
      console.log("   ✅ Enviado");

      const { error: errUpd } = await supabase
        .from(TABLA)
        .update({ enviado: true, fecha_envio: new Date().toISOString(), error: null })
        .eq("id", escuela.id);
      if (errUpd) console.warn(`   ⚠️ Enviado, pero no se pudo marcar en Supabase: ${errUpd.message}`);
    } catch (err) {
      if (err.code === "EAUTH") {
        console.error("❌ Gmail rechazó el usuario o la contraseña. Corto la corrida.");
        process.exit(1);
      }
      if (esRechazoDelDestinatario(err)) {
        rechazados++;
        console.warn(`   🚫 Dirección rechazada (${err.responseCode}): ${err.message}`);
        await supabase
          .from(TABLA)
          .update({ error: `${err.responseCode}: ${String(err.message).slice(0, 300)}` })
          .eq("id", escuela.id);
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
