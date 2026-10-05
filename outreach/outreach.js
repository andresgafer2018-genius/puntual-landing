/**
 * PUNTUAL — Outreach automático a escuelas secundarias
 *
 * Lee las escuelas pendientes de la tabla `escuelas_outreach` (Supabase),
 * arma el mail (plantilla fija con el nombre de cada escuela) y lo envía por Gmail.
 * Corre en GitHub Actions (.github/workflows/outreach.yml).
 *
 * Variables de entorno (GitHub Secrets / Variables):
 *   GMAIL_USER, GMAIL_APP_PASSWORD, SUPABASE_URL, SUPABASE_SERVICE_KEY  (secrets)
 *   MAX_EMAILS_POR_DIA  (variable, por defecto 10)
 *   EMAIL_PRUEBA  (opcional) → modo prueba: 1 mail a esta dirección, no toca la base
 *   CANTIDAD      (opcional) → pisa MAX_EMAILS_POR_DIA en una corrida manual
 */

const { createClient } = require("@supabase/supabase-js");
const nodemailer = require("nodemailer");

// ─── CONFIGURACIÓN ───────────────────────────────────────────────────────────

const TABLA = "escuelas_outreach";
const LIMITE_MAXIMO = 100; // tope de seguridad por corrida
const ESPERA_MIN_MS = 2 * 60 * 1000; // entre mails: 2 a 4 minutos al azar
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
const cantidadPedida = parseInt(process.env.CANTIDAD || process.env.MAX_EMAILS_POR_DIA || "10", 10);
const CANTIDAD = MODO_PRUEBA
  ? 1
  : Math.min(Number.isFinite(cantidadPedida) && cantidadPedida > 0 ? cantidadPedida : 10, LIMITE_MAXIMO);

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

const ABREVIATURAS = { "inst.": "Instituto", "esc.": "Escuela", "col.": "Colegio" };
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

// ─── TEXTO DEL MAIL (plantilla fija) ─────────────────────────────────────────

const ASUNTO = "Una forma más simple de organizar el horario escolar";

function armarMail(escuela) {
  const saludo = `Hola, equipo ${conArticulo(capitalizar(escuela.nombre))}:`;
  const cuerpo = `${saludo}

Te escribo porque desarrollé Puntual, una herramienta que arma automáticamente el horario semanal de una escuela a partir de las materias, los profesores y sus disponibilidades — evitando los cruces de horarios que suelen aparecer al hacerlo a mano.

Además, cada profesor puede recibir su horario actualizado por mail con un clic, así el equipo directivo no tiene que reenviar planillas ni responder consultas una por una. Y las disponibilidades también se cargan solas: cada profesor completa un formulario que le llega por mail, lo envía a la escuela y entra directo al sistema, sin que nadie tenga que cargarlas a mano.

Hoy en Puntual podés probar cómo funciona gratuitamente: cargás los datos de tu escuela y lo probás vos mismo sin costo ni compromiso. En la página también hay un video paso a paso de cómo se usa, por si preferís verlo primero.

Podés conocerlo acá: www.puntualhorarios.com

Cualquier consulta, quedo a disposición.

Saludos,
Andy
Puntual — puntualhorarios@gmail.com

—
Si no querés recibir más correos de Puntual, respondé este mensaje con la palabra BAJA.`;
  return { asunto: ASUNTO, cuerpo };
}

// ─── ENVÍO ───────────────────────────────────────────────────────────────────

function esRechazoDelDestinatario(err) {
  // 5xx = el servidor rechazó la dirección (no existe, dominio inválido, etc.)
  const codigo = err && err.responseCode;
  return typeof codigo === "number" && codigo >= 500 && codigo < 600;
}

async function main() {
  console.log(MODO_PRUEBA ? `🧪 MODO PRUEBA → se envía 1 mail a ${EMAIL_PRUEBA}` : `📨 Envío real → hasta ${CANTIDAD} mails`);

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
    const destino = MODO_PRUEBA ? EMAIL_PRUEBA : escuela.email;
    const mail = armarMail(escuela);
    console.log(`\n[${i + 1}/${escuelas.length}] ${escuela.nombre} → ${destino}`);

    try {
      await transporter.sendMail({
        from: `"Puntual" <${process.env.GMAIL_USER}>`,
        to: destino,
        replyTo: process.env.GMAIL_USER,
        subject: MODO_PRUEBA ? `[PRUEBA] ${mail.asunto}` : mail.asunto,
        text: mail.cuerpo,
      });
      enviados++;
      console.log("   ✅ Enviado");

      if (MODO_PRUEBA) {
        console.log("\n--- Vista previa del mail ---\n" + mail.cuerpo + "\n-----------------------------");
      } else {
        const { error: errUpd } = await supabase
          .from(TABLA)
          .update({ enviado: true, fecha_envio: new Date().toISOString(), error: null })
          .eq("id", escuela.id);
        if (errUpd) console.warn(`   ⚠️ Enviado, pero no se pudo marcar en Supabase: ${errUpd.message}`);
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
