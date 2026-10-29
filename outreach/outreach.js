/**
 * PUNTUAL — Outreach automático a escuelas secundarias
 *
 * Lee las escuelas pendientes de la tabla `escuelas_outreach` (Supabase),
 * arma el mail eligiendo al azar una de 4 versiones de texto y lo envía por Gmail.
 * Corre en GitHub Actions (.github/workflows/outreach.yml), una vez por hora en días hábiles,
 * mandando como máximo 1 mail por corrida (hasta MAX_EMAILS_POR_DIA por día).
 * Antes de cada envío verifica por DNS que el dominio del mail exista y reciba correo;
 * si no, marca la escuela con error "dominio inválido" y pasa a la siguiente sin mandar.
 *
 * SEGUIMIENTO: a las escuelas que recibieron el primer mail hace DIAS_SEGUIMIENTO días o más
 * se les manda un segundo mail corto, una sola vez. Comparte el tope diario con los mails nuevos:
 * como máximo MAX_SEGUIMIENTOS_POR_DIA seguimientos por día (3 de 5), intercalados con los nuevos.
 * Si un día no hay seguimientos vencidos, todos los mails del día son nuevos. No se manda a las que tienen no_seguir = true (contestaron
 * o pidieron BAJA; eso se marca a mano en Supabase) ni a las que tienen algún error.
 *
 * Variables de entorno (GitHub Secrets / Variables):
 *   GMAIL_USER, GMAIL_APP_PASSWORD, SUPABASE_URL, SUPABASE_SERVICE_KEY  (secrets)
 *   MAX_EMAILS_POR_DIA  (variable) → tope diario total, por defecto 5 (en GitHub está en 7)
 *   EMAIL_PRUEBA  (opcional) → modo prueba: manda las 4 versiones + el seguimiento a esta dirección, no toca la base
 *   CANTIDAD      (opcional) → corrida manual: cuántos mails mandar ahora (saltea los controles de horario)
 */

const { createClient } = require("@supabase/supabase-js");
const nodemailer = require("nodemailer");
const dns = require("dns").promises;

// ─── CONFIGURACIÓN ───────────────────────────────────────────────────────────

const TABLA = "escuelas_outreach";
const LIMITE_MAXIMO = 20; // tope de seguridad por corrida manual
const SEPARACION_MINIMA_MIN = 55; // no mandar si el último mail salió hace menos de esto (55 y no 60: las corridas son cada hora y pueden atrasarse unos segundos)
const HORA_INICIO_AR = 8; // corridas programadas: no mandar antes de las 8 h de Argentina
const HORA_FIN_AR = 19; // ni a partir de las 19 h de Argentina
const ESPERA_MIN_MS = 2 * 60 * 1000; // en corridas manuales de varios mails: 2 a 4 min entre mails
const ESPERA_MAX_MS = 4 * 60 * 1000;
const CANDIDATOS_EXTRA = 15; // escuelas de reserva por si algunas tienen el dominio inválido
const DIAS_SEGUIMIENTO = 7; // el seguimiento sale a partir de estos días después del primer mail
const MAX_SEGUIMIENTOS_POR_DIA = 3; // de los mails del día, como máximo estos son seguimientos (el resto, nuevos)

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
    cuerpo: `Hola, equipo ${equipo}, ¿cómo están?

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

// ─── TEXTO DEL SEGUIMIENTO (segundo mail, una sola vez) ──────────────────────

// "del Instituto X" → "en el Instituto X"; "de la Escuela X" → "en la Escuela X"; "de X" → "en X"
function conEn(conArt) {
  if (conArt.startsWith("del ")) return "en el " + conArt.slice(4);
  if (conArt.startsWith("de la ")) return "en la " + conArt.slice(6);
  return "en " + conArt.replace(/^de /, "");
}

function armarSeguimiento(escuela) {
  const nombre = capitalizar(escuela.nombre);
  const equipo = conArticulo(nombre);
  return {
    version: "seguimiento",
    asunto: `¿Quién arma el horario ${conEn(equipo)}?`,
    cuerpo: `Hola, equipo ${equipo}:

Les escribí hace unos días por Puntual, la herramienta que genera automáticamente el horario semanal de la escuela, sin cruces entre profesores.

Sé que es una época con mucho trabajo, así que voy al grano con una sola pregunta: ¿quién se encarga de armar el horario? Si me pasan su contacto, le escribo directamente a esa persona.

Y si prefieren verlo por su cuenta, se puede probar gratis 15 días con los datos de la escuela: www.puntualhorarios.com

Gracias y saludos,
Andy — Puntual

${PIE_BAJA}`,
  };
}

// ─── CONTROLES (solo corridas programadas) ───────────────────────────────────

// Hora actual en Argentina (UTC-3), de 0 a 23
function horaArgentina() {
  return (new Date().getUTCHours() + 21) % 24;
}

// Medianoche de hoy en Argentina (UTC-3), expresada en UTC
function inicioDelDiaArgentina() {
  const ahoraAR = new Date(Date.now() - 3 * 60 * 60 * 1000);
  const fecha = ahoraAR.toISOString().slice(0, 10);
  return new Date(`${fecha}T03:00:00.000Z`).toISOString();
}

// Cuántos mails nuevos y cuántos seguimientos salieron hoy (día de Argentina)
async function contarEnviosDeHoy() {
  const hoy = inicioDelDiaArgentina();
  const { count: nuevosHoy, error: errCount } = await supabase
    .from(TABLA)
    .select("id", { count: "exact", head: true })
    .eq("enviado", true)
    .gte("fecha_envio", hoy);
  if (errCount) throw new Error(`No se pudo contar los envíos de hoy: ${errCount.message}`);
  const { count: seguimientosHoy, error: errCountSeg } = await supabase
    .from(TABLA)
    .select("id", { count: "exact", head: true })
    .eq("seguimiento_enviado", true)
    .gte("fecha_seguimiento", hoy);
  if (errCountSeg) throw new Error(`No se pudo contar los seguimientos de hoy: ${errCountSeg.message}`);
  return { nuevosHoy: nuevosHoy || 0, seguimientosHoy: seguimientosHoy || 0 };
}

async function puedeEnviarAhora() {
  const hora = horaArgentina();
  if (hora < HORA_INICIO_AR || hora >= HORA_FIN_AR) {
    console.log(`⏸️ Son las ${hora} h en Argentina, fuera del horario de envío (${HORA_INICIO_AR} a ${HORA_FIN_AR} h). No mando nada en esta corrida.`);
    return false;
  }

  // Envíos de hoy = primeros mails + seguimientos (comparten el mismo tope)
  const { nuevosHoy, seguimientosHoy } = await contarEnviosDeHoy();
  const count = nuevosHoy + seguimientosHoy;
  if (count >= MAX_POR_DIA) {
    console.log(`⏸️ Hoy ya salieron ${count} mails (tope ${MAX_POR_DIA}). No mando nada en esta corrida.`);
    return false;
  }

  // Último mail que salió, sea primero o seguimiento
  const fechas = [];
  for (const columna of ["fecha_envio", "fecha_seguimiento"]) {
    const { data, error: errUlt } = await supabase
      .from(TABLA)
      .select(columna)
      .not(columna, "is", null)
      .order(columna, { ascending: false })
      .limit(1);
    if (errUlt) throw new Error(`No se pudo leer el último envío: ${errUlt.message}`);
    if (data && data.length) fechas.push(new Date(data[0][columna]).getTime());
  }
  if (fechas.length) {
    const minutos = (Date.now() - Math.max(...fechas)) / 60000;
    if (minutos < SEPARACION_MINIMA_MIN) {
      console.log(`⏸️ El último mail salió hace ${Math.round(minutos)} min (mínimo ${SEPARACION_MINIMA_MIN}). No mando nada en esta corrida.`);
      return false;
    }
  }

  console.log(`✅ Son las ${hora} h en Argentina. Hoy van ${count} de ${MAX_POR_DIA}. Se puede enviar.`);
  return true;
}

// ─── VALIDACIÓN DE LA DIRECCIÓN (antes de mandar) ────────────────────────────

const FORMATO_EMAIL = /^[^\s@]+@([a-z0-9-]+\.)+[a-z]{2,}$/i;
const ERRORES_DNS_DEFINITIVOS = ["ENOTFOUND", "ENODATA", "ENONAME", "NXDOMAIN"];

/**
 * Revisa si el dominio del mail existe y puede recibir correo.
 * Devuelve:
 *   { ok: true }                          → se puede mandar
 *   { ok: false, definitivo: true, motivo } → dirección inválida: se marca en Supabase y no se manda nunca
 *   { ok: false, definitivo: false, motivo } → falla temporal del DNS: se saltea y se reintenta otro día
 */
async function validarEmail(email) {
  const dir = String(email || "").trim().toLowerCase();
  if (!FORMATO_EMAIL.test(dir)) {
    return { ok: false, definitivo: true, motivo: `formato inválido: "${dir}"` };
  }
  const dominio = dir.split("@")[1];

  try {
    const mx = await dns.resolveMx(dominio);
    if (mx && mx.some((r) => r.exchange && r.exchange !== ".")) return { ok: true };
    return { ok: false, definitivo: true, motivo: `el dominio ${dominio} no acepta correo` };
  } catch (err) {
    if (!ERRORES_DNS_DEFINITIVOS.includes(err.code)) {
      return { ok: false, definitivo: false, motivo: `DNS no respondió (${err.code})` };
    }
    // Sin registro MX: algunos dominios igual reciben correo en su propia IP
    try {
      const ips = await dns.resolve4(dominio);
      if (ips && ips.length) return { ok: true };
    } catch (_) { /* sigue abajo */ }
    return { ok: false, definitivo: true, motivo: `el dominio ${dominio} no existe` };
  }
}

// Control de seguridad: si ni siquiera gmail.com resuelve, el DNS está caído
// y no hay que marcar ninguna escuela como inválida.
async function dnsFunciona() {
  try {
    const mx = await dns.resolveMx("gmail.com");
    return Array.isArray(mx) && mx.length > 0;
  } catch (_) {
    return false;
  }
}

// ─── ENVÍO ───────────────────────────────────────────────────────────────────

function esRechazoDelDestinatario(err) {
  // 5xx = el servidor rechazó la dirección (no existe, dominio inválido, etc.)
  const codigo = err && err.responseCode;
  return typeof codigo === "number" && codigo >= 500 && codigo < 600;
}

// Errores de conexión con Gmail (corte, timeout): conviene esperar y reintentar
const ERRORES_CONEXION = ["ECONNECTION", "ETIMEDOUT", "ESOCKET", "ECONNRESET"];
const REINTENTOS = 2;
const ESPERA_REINTENTO_MS = 45 * 1000;

async function enviarConReintento(mensaje) {
  for (let intento = 0; ; intento++) {
    try {
      return await transporter.sendMail(mensaje);
    } catch (err) {
      const esCorte = ERRORES_CONEXION.includes(err.code) || /connection closed/i.test(err.message || "");
      if (!esCorte || intento >= REINTENTOS) throw err;
      console.warn(`   🔁 Gmail cortó la conexión (${err.code || err.message}). Reintento en ${ESPERA_REINTENTO_MS / 1000} s...`);
      await esperar(ESPERA_REINTENTO_MS);
    }
  }
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
  console.log(`🧪 MODO PRUEBA → se mandan las ${VERSIONES.length} versiones + el seguimiento a ${EMAIL_PRUEBA}`);
  await conectarGmail();
  const ejemplo = { nombre: "INSTITUTO SANTA ROSA" };
  const mails = VERSIONES.map((_, i) => armarMail(ejemplo, i));
  mails.push(armarSeguimiento(ejemplo));
  for (let i = 0; i < mails.length; i++) {
    const mail = mails[i];
    const etiqueta = mail.version === "seguimiento" ? "seguimiento" : `v${mail.version}`;
    await enviarConReintento({
      from: `"Puntual" <${process.env.GMAIL_USER}>`,
      to: EMAIL_PRUEBA,
      replyTo: process.env.GMAIL_USER,
      subject: `[PRUEBA ${etiqueta}] ${mail.asunto}`,
      text: mail.cuerpo,
    });
    console.log(`   ✅ ${etiqueta} enviado`);
    if (i < mails.length - 1) await esperar(60 * 1000);
  }
}

async function main() {
  if (MODO_PRUEBA) return modoPrueba();

  console.log(ES_MANUAL ? `📨 Corrida manual → hasta ${CANTIDAD} mails` : "📨 Corrida programada → 1 mail");

  if (!ES_MANUAL && !(await puedeEnviarAhora())) return;

  await conectarGmail();

  if (!(await dnsFunciona())) {
    console.error("❌ El DNS no responde (no se pudo verificar ni gmail.com). No mando ni marco nada; se reintenta en la próxima corrida.");
    process.exit(1);
  }

  const { data: escuelas, error } = await supabase
    .from(TABLA)
    .select("id, nombre, email")
    .eq("enviado", false)
    .is("error", null)
    .order("id", { ascending: true })
    .limit(CANTIDAD + CANDIDATOS_EXTRA);

  if (error) {
    console.error("❌ Error leyendo Supabase. Revisá SUPABASE_URL y SUPABASE_SERVICE_KEY.");
    console.error(`   Detalle: ${error.message}`);
    process.exit(1);
  }
  // Cupo de seguimientos que queda hoy (máximo MAX_SEGUIMIENTOS_POR_DIA por día)
  const delDia = await contarEnviosDeHoy();
  let segHoy = delDia.seguimientosHoy;
  let nuevosHoy = delDia.nuevosHoy;
  const segDisponibles = Math.max(0, MAX_SEGUIMIENTOS_POR_DIA - segHoy);
  console.log(`📅 Hoy van ${nuevosHoy} nuevos y ${segHoy} seguimientos (cupo de seguimientos: ${MAX_SEGUIMIENTOS_POR_DIA}).`);

  // Seguimientos vencidos: primer mail hace DIAS_SEGUIMIENTO días o más, sin seguimiento,
  // sin no_seguir y sin errores. Van primero (los más viejos antes).
  const limiteFecha = new Date(Date.now() - DIAS_SEGUIMIENTO * 24 * 60 * 60 * 1000).toISOString();
  const { data: seguimientos, error: errSeg } = await supabase
    .from(TABLA)
    .select("id, nombre, email")
    .eq("enviado", true)
    .eq("seguimiento_enviado", false)
    .eq("no_seguir", false)
    .is("error", null)
    .lte("fecha_envio", limiteFecha)
    .order("fecha_envio", { ascending: true })
    .limit(Math.max(1, Math.min(CANTIDAD, segDisponibles)));
  if (errSeg) {
    console.error("❌ Error leyendo los seguimientos pendientes en Supabase.");
    console.error(`   Detalle: ${errSeg.message}`);
    process.exit(1);
  }

  const colaSeg = segDisponibles > 0 ? (seguimientos || []).map((e) => ({ ...e, seguimiento: true })) : [];
  const colaNuevos = (escuelas || []).map((e) => ({ ...e, seguimiento: false }));
  console.log(`📋 Seguimientos vencidos disponibles en esta tanda: ${colaSeg.length}`);

  // Elige la próxima escuela intercalando: seguimiento si queda cupo y no va adelante de los nuevos
  // (orden del día: seguimiento, nuevo, seguimiento, nuevo, seguimiento). Si una cola se vacía, usa la otra
  // (pero nunca pasa el cupo diario de seguimientos).
  function siguiente() {
    const hayCupoSeg = segHoy < MAX_SEGUIMIENTOS_POR_DIA && colaSeg.length > 0;
    if (hayCupoSeg && (segHoy <= nuevosHoy || colaNuevos.length === 0)) return colaSeg.shift();
    if (colaNuevos.length > 0) return colaNuevos.shift();
    return hayCupoSeg ? colaSeg.shift() : null;
  }

  if (colaSeg.length === 0 && colaNuevos.length === 0) {
    console.log("🎉 No quedan escuelas pendientes ni seguimientos. ¡Lista completa!");
    return;
  }

  let enviados = 0;
  let rechazados = 0;
  let fallidos = 0;
  let descartados = 0;
  let intentos = 0;

  while (intentos < CANTIDAD) {
    const escuela = siguiente();
    if (!escuela) break;

    // Chequeo previo (primeros mails y seguimientos: las escuelas de las tandas de antes
    // del 14/10 nunca pasaron por este control). Si el dominio no existe, se marca y se pasa a la siguiente sin mandar
    const chequeo = await validarEmail(escuela.email);
    if (!chequeo.ok) {
      console.log(`\n⛔ ${escuela.nombre} → ${escuela.email}: ${chequeo.motivo}`);
      if (chequeo.definitivo) {
        descartados++;
        const { error: errMarca } = await supabase
          .from(TABLA)
          .update({ error: `dominio inválido: ${chequeo.motivo}` })
          .eq("id", escuela.id);
        if (errMarca) console.warn(`   ⚠️ No se pudo marcar en Supabase: ${errMarca.message}`);
        else console.log("   Marcada en Supabase, no se le va a mandar nunca.");
      } else {
        console.log("   La salteo por hoy, se reintenta en otra corrida.");
      }
      continue;
    }

    if (intentos > 0) {
      const ms = azar(ESPERA_MIN_MS, ESPERA_MAX_MS);
      console.log(`   ⏳ Espero ${Math.round(ms / 1000)} s antes del próximo...`);
      await esperar(ms);
    }
    intentos++;

    const mail = escuela.seguimiento ? armarSeguimiento(escuela) : armarMail(escuela);
    const tipo = escuela.seguimiento ? "SEGUIMIENTO" : `versión ${mail.version}`;
    console.log(`\n[${intentos}/${CANTIDAD}] ${escuela.nombre} → ${escuela.email} (${tipo})`);

    try {
      await enviarConReintento({
        from: `"Puntual" <${process.env.GMAIL_USER}>`,
        to: escuela.email,
        replyTo: process.env.GMAIL_USER,
        subject: mail.asunto,
        text: mail.cuerpo,
      });
      enviados++;
      if (escuela.seguimiento) segHoy++; else nuevosHoy++;
      console.log("   ✅ Enviado");

      const marca = escuela.seguimiento
        ? { seguimiento_enviado: true, fecha_seguimiento: new Date().toISOString() }
        : { enviado: true, fecha_envio: new Date().toISOString(), error: null };
      const { error: errUpd } = await supabase.from(TABLA).update(marca).eq("id", escuela.id);
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
  }

  console.log(`\n📊 Resumen: ${enviados} enviados, ${rechazados} rechazados, ${fallidos} con error temporal, ${descartados} descartadas por dominio inexistente.`);
  if (enviados === 0) process.exit(1); // la corrida queda en rojo si no salió ninguno
}

main().catch((err) => {
  console.error("❌ Error inesperado:", err);
  process.exit(1);
});
