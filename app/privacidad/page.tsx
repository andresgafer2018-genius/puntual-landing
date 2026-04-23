export default function PrivacidadPage() {
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
        <span style={{ color: "#94A3B8", fontSize: "14px" }}>Política de Privacidad</span>
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
          Política de Privacidad
        </h1>
        <p style={{ color: "#64748B", fontSize: "14px", marginBottom: "48px" }}>
          Última actualización: abril de 2025
        </p>

        <Section title="1. ¿Quiénes somos?">
          <p>
            Puntual es una aplicación web de gestión de horarios escolares desarrollada en Argentina. El responsable del tratamiento de datos es el titular del servicio, contactable en{" "}
            <a href="mailto:puntualhorarios@gmail.com" style={{ color: "#4F8EF7" }}>
              puntualhorarios@gmail.com
            </a>.
          </p>
        </Section>

        <Section title="2. ¿Qué datos recolectamos?">
          <p>Al registrarte y utilizar Puntual, podemos recolectar los siguientes datos:</p>
          <ul>
            <li><strong>Datos de cuenta:</strong> nombre completo y dirección de correo electrónico.</li>
            <li><strong>Datos de la institución:</strong> nombre de la escuela, cursos, materias y profesores que cargás en la aplicación.</li>
            <li><strong>Datos de uso:</strong> información técnica como dirección IP, tipo de navegador, y páginas visitadas, con fines de diagnóstico y mejora del servicio.</li>
          </ul>
        </Section>

        <Section title="3. ¿Para qué usamos tus datos?">
          <p>Utilizamos los datos recolectados para:</p>
          <ul>
            <li>Crear y gestionar tu cuenta de usuario.</li>
            <li>Brindarte el servicio de generación y gestión de horarios escolares.</li>
            <li>Enviarte confirmaciones de registro y comunicaciones relacionadas con el servicio.</li>
            <li>Gestionar tu plan de suscripción (trial, Estándar o Completo).</li>
            <li>Mejorar el funcionamiento de la plataforma.</li>
          </ul>
          <p>No utilizamos tus datos para publicidad de terceros ni los vendemos bajo ninguna circunstancia.</p>
        </Section>

        <Section title="4. ¿Con quién compartimos tus datos?">
          <p>
            Para operar el servicio, utilizamos los siguientes proveedores de confianza que pueden procesar tus datos en nuestra representación:
          </p>
          <ul>
            <li>
              <strong>Supabase</strong> — base de datos y autenticación. Tus datos se almacenan de forma segura en sus servidores. Podés consultar su política en{" "}
              <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" style={{ color: "#4F8EF7" }}>
                supabase.com/privacy
              </a>.
            </li>
            <li>
              <strong>Resend</strong> — envío de correos transaccionales (confirmación de cuenta, etc.). Podés consultar su política en{" "}
              <a href="https://resend.com/privacy" target="_blank" rel="noopener noreferrer" style={{ color: "#4F8EF7" }}>
                resend.com/privacy
              </a>.
            </li>
            <li>
              <strong>Vercel</strong> — infraestructura de hosting. Podés consultar su política en{" "}
              <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" style={{ color: "#4F8EF7" }}>
                vercel.com/legal/privacy-policy
              </a>.
            </li>
          </ul>
          <p>No compartimos tus datos con ningún otro tercero sin tu consentimiento explícito.</p>
        </Section>

        <Section title="5. ¿Por cuánto tiempo guardamos tus datos?">
          <p>
            Conservamos tus datos mientras tu cuenta esté activa. Si solicitás la eliminación de tu cuenta, borraremos tus datos personales y los de tu institución en un plazo de 30 días, salvo que estemos obligados a conservarlos por razones legales.
          </p>
        </Section>

        <Section title="6. Tus derechos">
          <p>Tenés derecho a:</p>
          <ul>
            <li><strong>Acceder</strong> a los datos que tenemos sobre vos.</li>
            <li><strong>Rectificar</strong> datos incorrectos o desactualizados.</li>
            <li><strong>Eliminar</strong> tu cuenta y los datos asociados.</li>
            <li><strong>Oponerte</strong> al procesamiento de tus datos en determinadas circunstancias.</li>
          </ul>
          <p>
            Para ejercer cualquiera de estos derechos, escribinos a{" "}
            <a href="mailto:puntualhorarios@gmail.com" style={{ color: "#4F8EF7" }}>
              puntualhorarios@gmail.com
            </a>.
          </p>
        </Section>

        <Section title="7. Seguridad">
          <p>
            Tomamos medidas técnicas y organizativas razonables para proteger tus datos contra accesos no autorizados, pérdida o alteración. La autenticación se realiza a través de Supabase con cifrado estándar de la industria. Sin embargo, ningún sistema es completamente infalible, y no podemos garantizar seguridad absoluta.
          </p>
        </Section>

        <Section title="8. Cookies y almacenamiento local">
          <p>
            Puntual puede utilizar el almacenamiento local del navegador (localStorage) para guardar preferencias de sesión y datos de la aplicación. No utilizamos cookies de rastreo ni publicidad.
          </p>
        </Section>

        <Section title="9. Cambios en esta política">
          <p>
            Podemos actualizar esta Política de Privacidad ocasionalmente. Cuando lo hagamos, actualizaremos la fecha al inicio de este documento. Te recomendamos revisarla periódicamente. Si los cambios son significativos, te notificaremos por email.
          </p>
        </Section>

        <Section title="10. Contacto">
          <p>
            Para cualquier consulta relacionada con tu privacidad o el tratamiento de tus datos, escribinos a{" "}
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
