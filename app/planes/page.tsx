"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function PlanesPage() {
  const searchParams = useSearchParams();
  const motivo = searchParams.get("motivo");

  const AHORRO_ANUAL = Math.round((1 - 1440 / (150 * 12)) * 100); // 20%

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0c0f1a",
      fontFamily: "'DM Sans', sans-serif",
      color: "#e8eaf2",
      padding: "24px",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .plan-card {
          background: #131827; border: 1px solid #1e2642;
          border-radius: 20px; padding: 36px 28px; position: relative;
          transition: transform .25s, border-color .25s;
          display: flex; flex-direction: column;
        }
        .plan-card:hover { transform: translateY(-4px); }
        .plan-card.highlight { border-color: #4f8ef7; background: #131e35; }
        .feat-item { display: flex; align-items: center; gap: 10px; padding: 8px 0; border-bottom: 1px solid #1a2040; font-size: 14px; color: #8892b0; }
        .feat-item:last-child { border-bottom: none; }
        .btn-primary { background: #4f8ef7; color: #fff; border: none; border-radius: 10px; padding: 13px 28px; font-size: 15px; font-weight: 700; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: background .2s; width: 100%; margin-top: auto; }
        .btn-primary:hover { background: #3a7aee; }
        .btn-outline { background: transparent; color: #e8eaf2; border: 1px solid #2a3050; border-radius: 10px; padding: 13px 28px; font-size: 15px; font-weight: 600; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all .2s; width: 100%; margin-top: auto; }
        .btn-outline:hover { background: rgba(255,255,255,.06); border-color: #4a5578; }
        @media (max-width: 768px) { .plans-grid { grid-template-columns: 1fr !important; } }
      `}</style>

      <div style={{ maxWidth: 980, margin: "0 auto" }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 48, paddingTop: 32 }}>
          <a href="/" style={{ display: "inline-block" }}>
            <img src="/logopuntual.png" alt="Puntual" style={{ height: 52, width: "auto" }} />
          </a>
        </div>

        {/* Aviso de vencimiento */}
        {motivo === "vencido" && (
          <div style={{
            background: "rgba(247,79,106,.12)", border: "1px solid rgba(247,79,106,.3)",
            borderRadius: 12, padding: "16px 20px", marginBottom: 32,
            fontSize: 14, color: "#f74f6a", textAlign: "center",
          }}>
            ⏰ Tu período de acceso venció. Elegí un plan para seguir usando Puntual.
          </div>
        )}

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(28px, 5vw, 44px)", marginBottom: 14 }}>
            Elegí el plan de tu institución
          </h1>
          <p style={{ fontSize: 16, color: "#8892b0" }}>
            Todos los planes incluyen generación automática y soporte por mail.
          </p>
        </div>

        {/* Cards */}
        <div className="plans-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24, alignItems: "start" }}>

          {/* PLAN GRATUITO */}
          <div className="plan-card">
            <div style={{ marginBottom: 24 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#8892b0", marginBottom: 10, textTransform: "uppercase", letterSpacing: 1 }}>Prueba gratuita</p>
              <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 4 }}>
                <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 44, color: "#e8eaf2" }}>$0</span>
              </div>
              <p style={{ fontSize: 13, color: "#4a5578", marginBottom: 4 }}>15 días · Solo una vez</p>
              <p style={{ fontSize: 13, color: "#8892b0", lineHeight: 1.6 }}>Para conocer la plataforma antes de comprometerte.</p>
            </div>

            <ul style={{ listStyle: "none", marginBottom: 28, flex: 1 }}>
              {[
                "15 días de acceso completo",
                "Hasta 5 cursos",
                "Hasta 15 docentes",
                "Generación automática",
                "Exportación PDF y Excel",
              ].map((f, i) => (
                <li key={i} className="feat-item">
                  <span style={{ color: "#4ff7a8", fontWeight: 700, flexShrink: 0 }}>✓</span>{f}
                </li>
              ))}
              <li className="feat-item" style={{ color: "#4a5578" }}>
                <span style={{ flexShrink: 0 }}>✗</span>Sin soporte prioritario
              </li>
            </ul>

            <a
              href="mailto:puntualhorarios@gmail.com?subject=Quiero activar mi prueba gratuita"
              className="btn-outline"
              style={{ textDecoration: "none", textAlign: "center", display: "block" }}
            >
              Activar prueba gratis
            </a>
          </div>

          {/* PLAN ANUAL — destacado */}
          <div className="plan-card highlight" style={{ marginTop: -12 }}>
            <div style={{
              position: "absolute", top: -14, left: "50%", transform: "translateX(-50%)",
              background: "#4f8ef7", color: "#fff", fontSize: 11, fontWeight: 700,
              padding: "5px 18px", borderRadius: 100, whiteSpace: "nowrap",
            }}>
              ⭐ MÁS ELEGIDO
            </div>

            <div style={{ marginBottom: 24 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#8892b0", marginBottom: 10, textTransform: "uppercase", letterSpacing: 1 }}>Plan Anual</p>
              <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 4 }}>
                <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 44, color: "#e8eaf2" }}>$120</span>
                <span style={{ fontSize: 14, color: "#4a5578" }}>/mes</span>
              </div>
              <p style={{ fontSize: 13, color: "#4a5578", marginBottom: 8 }}>$1.440 facturado anualmente</p>
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                background: "rgba(79,247,168,.12)", color: "#4ff7a8",
                border: "1px solid rgba(79,247,168,.25)", borderRadius: 100,
                fontSize: 12, fontWeight: 700, padding: "4px 12px",
              }}>
                🎉 Ahorrás {AHORRO_ANUAL}% vs mensual
              </div>
            </div>

            <ul style={{ listStyle: "none", marginBottom: 28, flex: 1 }}>
              {[
                "12 meses de acceso",
                "Cursos ilimitados",
                "Docentes ilimitados",
                "Generación automática",
                "Exportación PDF y Excel",
                "Soporte prioritario",
                "Actualizaciones incluidas",
              ].map((f, i) => (
                <li key={i} className="feat-item">
                  <span style={{ color: "#4ff7a8", fontWeight: 700, flexShrink: 0 }}>✓</span>{f}
                </li>
              ))}
            </ul>

            {/* PREPARADO PARA PAGO ONLINE — descomentar cuando integres el servicio */}
            {/* <button className="btn-primary" onClick={() => iniciarPago("anual")}>
              Contratar plan anual →
            </button> */}

            <a
              href="mailto:puntualhorarios@gmail.com?subject=Quiero contratar el plan anual"
              className="btn-primary"
              style={{ textDecoration: "none", textAlign: "center", display: "block" }}
            >
              Contratar plan anual →
            </a>
          </div>

          {/* PLAN MENSUAL */}
          <div className="plan-card">
            <div style={{ marginBottom: 24 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#8892b0", marginBottom: 10, textTransform: "uppercase", letterSpacing: 1 }}>Plan Mensual</p>
              <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 4 }}>
                <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 44, color: "#e8eaf2" }}>$150</span>
                <span style={{ fontSize: 14, color: "#4a5578" }}>/mes</span>
              </div>
              <p style={{ fontSize: 13, color: "#4a5578", marginBottom: 4 }}>Facturado mensualmente</p>
              <p style={{ fontSize: 13, color: "#8892b0", lineHeight: 1.6 }}>Flexibilidad total, cancelá cuando quieras.</p>
            </div>

            <ul style={{ listStyle: "none", marginBottom: 28, flex: 1 }}>
              {[
                "Acceso mes a mes",
                "Cursos ilimitados",
                "Docentes ilimitados",
                "Generación automática",
                "Exportación PDF y Excel",
                "Soporte prioritario",
              ].map((f, i) => (
                <li key={i} className="feat-item">
                  <span style={{ color: "#4ff7a8", fontWeight: 700, flexShrink: 0 }}>✓</span>{f}
                </li>
              ))}
            </ul>

            {/* PREPARADO PARA PAGO ONLINE — descomentar cuando integres el servicio */}
            {/* <button className="btn-outline" onClick={() => iniciarPago("mensual")}>
              Contratar plan mensual →
            </button> */}

            <a
              href="mailto:puntualhorarios@gmail.com?subject=Quiero contratar el plan mensual"
              className="btn-outline"
              style={{ textDecoration: "none", textAlign: "center", display: "block" }}
            >
              Contratar plan mensual →
            </a>
          </div>
        </div>

        {/* Footer note */}
        <p style={{ textAlign: "center", marginTop: 40, fontSize: 13, color: "#4a5578" }}>
          ¿Tenés dudas? Escribinos a{" "}
          <a href="mailto:puntualhorarios@gmail.com" style={{ color: "#4f8ef7", textDecoration: "none" }}>
            puntualhorarios@gmail.com
          </a>
        </p>

        <p style={{ textAlign: "center", marginTop: 16, fontSize: 13, color: "#4a5578" }}>
          <a href="/" style={{ color: "#4f8ef7", textDecoration: "none" }}>← Volver al inicio</a>
        </p>

      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   FUNCIÓN PREPARADA PARA PAGO ONLINE
   Descomentá esto cuando integres MercadoPago o Stripe:

async function iniciarPago(plan: "anual" | "mensual") {
  const res = await fetch("/api/pagos/crear-sesion", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ plan }),
  });
  const { url } = await res.json();
  window.location.href = url;
}
───────────────────────────────────────────────────────────── */
