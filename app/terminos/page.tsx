export default function TerminosPage() {
  return (
    <div style={{
      background: "#0F1629",
      minHeight: "100vh",
      color: "#E2E8F0",
      fontFamily: "'DM Sans', sans-serif",
    }}>
      {/* Header */}
      <header style={{
        borderBottom: "1px solid #1E2D4A",
        padding: "16px 24px",
        display: "flex",
        alignItems: "center",
        gap: "12px",
      }}>
        <a href="/" style={{ textDecoration: "none" }}>
          <span style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: "22px",
            color: "#4F8EF7",
            letterSpacing: "-0.5px",
          }}>
            Puntual<span style={{ color: "#60EFBC" }}>.</span>
          </span>
        </a>
        <span style={{ color: "#4A5568", margin: "0 8px" }}>›</span>
        <span style={{ color: "#94A3B8", fontSize: "14px" }}>Términos y Condiciones</span>
      </header>

      {/* Content */}
      <main style={{
        maxWidth: "760px",
        margin: "0 auto",
        padding: "60px 24px 80px",
      }}>
        <h1 style={{
          fontFamily: "'DM Serif Display', serif",
          fontSize: "clamp(32px, 5vw, 48px)",
          color: "#F1F5F9",
          marginBottom: "8px",
          lineHeight: 1.2,
        }}>
          Términos y Condiciones
        </h1>
        <p style={{ color: "#64748B", fontSize: "14px", marginBottom: "48px" }}>
          Última actualización: abril de 2025
        </p>

        <Section title="1. Aceptación de los términos">
          <p>
            Al registrarte y utilizar Puntual, aceptás estos Términos y Condiciones en su totalidad. Si no estás de acuerdo con alguna parte de estos términos, no debés utilizar el servicio. El uso continuado de Puntual constituye la aceptación de cualquier modificación futura.
          </p>
        </Section>

        <Section title="2. Descripción del servicio">
          <p>
            Puntual es una aplicación web que permite a instituciones educativas crear, gestionar y distribuir horarios escolares de manera automatizada. El servicio incluye funcionalidades como la carga de profesores, cursos y materias, la generación automática de horarios, la detección de conflictos y la exportación en distintos formatos.
          </p>
          <p>
            El servicio se presta tal cual está disponible. Nos reservamos el derecho de modificar, suspender o discontinuar funcionalidades en cualquier momento, con o sin previo aviso.
          </p>
        </Section>

        <Section title="3. Registro y cuenta de usuario">
          <p>Para utilizar Puntual debés:</p>
          <ul>
            <li>Registrarte con un correo electrónico válido y confirmarlo.</li>
            <li>Proporcionar información veraz y actualizada.</li>
            <li>Mantener la confidencialidad de tus credenciales de acceso.</li>
          </ul>
          <p>
            Sos responsable de todas las actividades que ocurran bajo tu cuenta. Si detectás un uso no autorizado, debés notificarnos de inmediato a{" "}
            <a href="mailto:puntualhorarios@gmail.com" style={{ color: "#4F8EF7" }}>
              puntualhorarios@gmail.com
            </a>.
          </p>
        </Section>

        <Section title="4. Planes y pagos">
          <p>Puntual ofrece los siguientes planes:</p>
          <ul>
            <li>
              <strong>Trial gratuito:</strong> acceso con límites (hasta 5 cursos y 15 profesores) sin cargo y sin necesidad de tarjeta de crédito, durante 15 días desde el registro.
            </li>
            <li>
              <strong>Plan Estándar:</strong> acceso completo con límites ampliados, con pago mensual o anual según la tarifa vigente.
            </li>
            <li>
              <strong>Plan Completo:</strong> acceso sin restricciones a todas las funcionalidades, con pago mensual o anual según la tarifa vigente.
            </li>
          </ul>
          <p>
            Los precios pueden modificarse con previo aviso de al menos 30 días. Los pagos realizados no son reembolsables salvo que la ley argentina lo exija expresamente.
          </p>
        </Section>

        <Section title="5. Uso aceptable">
          <p>Al utilizar Puntual, te comprometés a no:</p>
          <ul>
            <li>Usar el servicio para fines ilegales o no autorizados.</li>
            <li>Intentar acceder a cuentas de otros usuarios o a partes no autorizadas del sistema.</li>
            <li>Cargar contenido malicioso, spam o información falsa.</li>
            <li>Realizar ingeniería inversa o intentar copiar el código fuente de la aplicación.</li>
            <li>Revender o redistribuir el acceso al servicio sin autorización expresa.</li>
          </ul>
          <p>
            El incumplimiento de estas condiciones puede derivar en la suspensión o cancelación inmediata de tu cuenta.
          </p>
        </Section>

        <Section title="6. Propiedad intelectual">
          <p>
            Todo el contenido, diseño, código y funcionalidades de Puntual son propiedad exclusiva de sus desarrolladores y están protegidos por las leyes de propiedad intelectual aplicables en Argentina.
          </p>
          <p>
            Los datos que cargás en la aplicación (profesores, cursos, horarios, etc.) son de tu propiedad. Puntual no reclama derechos sobre ellos y los usa únicamente para brindarte el servicio.
          </p>
        </Section>

        <Section title="7. Privacidad">
          <p>
            El tratamiento de tus datos personales se rige por nuestra{" "}
            <a href="/privacidad" style={{ color: "#4F8EF7" }}>
              Política de Privacidad
            </a>
            , que forma parte integrante de estos Términos y Condiciones.
          </p>
        </Section>

        <Section title="8. Limitación de responsabilidad">
          <p>
            Puntual se brinda &quot;tal cual está&quot;, sin garantías expresas ni implícitas. En ningún caso seremos responsables por:
          </p>
          <ul>
            <li>Pérdida de datos derivada de errores del usuario o fallos técnicos externos.</li>
            <li>Interrupciones del servicio por causas ajenas a nuestro control (fallos de proveedores, cortes de internet, etc.).</li>
            <li>Decisiones tomadas basándose en los horarios generados por la aplicación.</li>
          </ul>
          <p>
            Recomendamos siempre mantener copias de respaldo de tu información importante.
          </p>
        </Section>

        <Section title="9. Cancelación de cuenta">
          <p>
            Podés cancelar tu cuenta en cualquier momento escribiéndonos a{" "}
            <a href="mailto:puntualhorarios@gmail.com" style={{ color: "#4F8EF7" }}>
              puntualhorarios@gmail.com
            </a>. Tras la cancelación, tus datos serán eliminados conforme a nuestra Política de Privacidad.
          </p>
          <p>
            Nos reservamos el derecho de suspender o cancelar cuentas que violen estos Términos, sin previo aviso ni reembolso.
          </p>
        </Section>

        <Section title="10. Legislación aplicable">
          <p>
            Estos Términos se rigen por las leyes de la República Argentina. Cualquier controversia que surja de su interpretación o aplicación se someterá a la jurisdicción de los tribunales ordinarios de la Ciudad Autónoma de Buenos Aires, con renuncia expresa a cualquier otro fuero que pudiera corresponder.
          </p>
        </Section>

        <Section title="11. Modificaciones">
          <p>
            Podemos actualizar estos Términos en cualquier momento. Los cambios entrarán en vigor a partir de su publicación en esta página. Si continuás usando Puntual después de los cambios, se entenderá que los aceptás.
          </p>
        </Section>

        <Section title="12. Contacto">
          <p>
            Para cualquier consulta sobre estos Términos y Condiciones, escribinos a{" "}
            <a href="mailto:puntualhorarios@gmail.com" style={{ color: "#4F8EF7" }}>
              puntualhorarios@gmail.com
            </a>.
          </p>
        </Section>

        <div style={{ marginTop: "48px", paddingTop: "32px", borderTop: "1px solid #1E2D4A" }}>
          <a href="/" style={{
            color: "#4F8EF7",
            textDecoration: "none",
            fontSize: "14px",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
          }}>
            ← Volver al inicio
          </a>
        </div>
      </main>

      {/* Footer */}
      <footer style={{
        borderTop: "1px solid #1E2D4A",
        padding: "24px",
        textAlign: "center",
        color: "#4A5568",
        fontSize: "13px",
      }}>
        © 2025 Puntual · Hecho con ♥ en Argentina
      </footer>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: "40px" }}>
      <h2 style={{
        fontFamily: "'DM Serif Display', serif",
        fontSize: "20px",
        color: "#F1F5F9",
        marginBottom: "16px",
        paddingBottom: "8px",
        borderBottom: "1px solid #1E2D4A",
      }}>
        {title}
      </h2>
      <div style={{
        color: "#94A3B8",
        lineHeight: "1.8",
        fontSize: "15px",
      }}>
        {children}
      </div>
    </section>
  );
}
