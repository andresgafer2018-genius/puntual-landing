"use client";

export default function PlanesPage() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "#0c0f1a",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'DM Sans', sans-serif",
      padding: "24px",
      color: "#e8eaf2",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
      `}</style>

      <div style={{ textAlign: "center", maxWidth: 480 }}>

        {/* Logo */}
        <a href="/" style={{ display: "inline-block", marginBottom: 40 }}>
          <img src="/logopuntual.png" alt="Puntual" style={{ height: 52, width: "auto" }} />
        </a>

        {/* Card */}
        <div style={{
          background: "#131827",
          border: "1px solid #1e2642",
          borderRadius: 20,
          padding: "48px 36px",
          boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
        }}>
          <div style={{ fontSize: 48, marginBottom: 20 }}>🚀</div>

          <h1 style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: 28,
            marginBottom: 16,
            lineHeight: 1.2,
          }}>
            Activá tu suscripción
          </h1>

          <p style={{ fontSize: 15, color: "#8892b0", lineHeight: 1.7, marginBottom: 32 }}>
            Para acceder a la aplicación necesitás activar un plan. 
            Próximamente vas a poder hacerlo directamente desde acá.
          </p>

          {/* Badge "próximamente" */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "rgba(79,142,247,.12)", color: "#4f8ef7",
            border: "1px solid rgba(79,142,247,.25)", borderRadius: 100,
            fontSize: 13, fontWeight: 600, padding: "6px 16px",
            marginBottom: 32,
          }}>
            ⏳ Pagos online — próximamente
          </div>

          <p style={{ fontSize: 14, color: "#8892b0", marginBottom: 24 }}>
            Por ahora escribinos y te activamos la cuenta manualmente:
          </p>

          <a
            href="mailto:puntualhorarios@gmail.com?subject=Quiero activar mi suscripción"
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: "#4f8ef7", color: "#fff", borderRadius: 10,
              padding: "13px 28px", fontSize: 15, fontWeight: 700,
              textDecoration: "none", transition: "background .2s",
            }}
          >
            📧 Contactar para activar
          </a>

          <p style={{ marginTop: 16, fontSize: 13, color: "#4a5578" }}>
            puntualhorarios@gmail.com
          </p>
        </div>

        <p style={{ marginTop: 24, fontSize: 13, color: "#4a5578" }}>
          <a href="/" style={{ color: "#4f8ef7", textDecoration: "none" }}>
            ← Volver al inicio
          </a>
        </p>
      </div>
    </div>
  );
}
