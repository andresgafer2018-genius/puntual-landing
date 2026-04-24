"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

function PlanesContent() {
  const searchParams = useSearchParams();
  const motivo = searchParams.get("motivo");
  const pago   = searchParams.get("pago");
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  async function handlePago(planId: string) {
    setLoadingPlan(planId);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = "/login";
        return;
      }

      const res = await fetch("/api/payments/create-preference", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, userId: user.id }),
      });

      const data = await res.json();
      if (data.sandbox_init_point) {
        window.location.href = data.sandbox_init_point; // sandbox
        // En producción usar: data.init_point
      } else {
        alert("Error al iniciar el pago. Intentá de nuevo.");
      }
    } catch (err) {
      console.error(err);
      alert("Error al iniciar el pago.");
    } finally {
      setLoadingPlan(null);
    }
  }

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
        .plan-card { background: #131827; border: 1px solid #1e2642; border-radius: 20px; padding: 36px 28px; position: relative; transition: transform .25s, border-color .25s; display: flex; flex-direction: column; }
        .plan-card:hover { transform: translateY(-4px); }
        .plan-card.highlight { border-color: #4f8ef7; background: #131e35; }
        .feat-item { display: flex; align-items: center; gap: 10px; padding: 8px 0; border-bottom: 1px solid #1a2040; font-size: 14px; color: #8892b0; }
        .feat-item:last-child { border-bottom: none; }
        .btn-primary { background: #4f8ef7; color: #fff; border: none; border-radius: 10px; padding: 13px 28px; font-size: 15px; font-weight: 700; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: background .2s; width: 100%; }
        .btn-primary:hover:not(:disabled) { background: #3a7aee; }
        .btn-primary:disabled { opacity: .6; cursor: not-allowed; }
        .btn-outline { background: transparent; color: #e8eaf2; border: 1px solid #2a3050; border-radius: 10px; padding: 13px 28px; font-size: 15px; font-weight: 600; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all .2s; width: 100%; }
        .btn-outline:hover:not(:disabled) { background: rgba(255,255,255,.06); border-color: #4a5578; }
        .btn-outline:disabled { opacity: .6; cursor: not-allowed; }
        .price-option { background: rgba(255,255,255,.04); border: 1px solid #1e2642; border-radius: 10px; padding: 12px 16px; margin-bottom: 10px; }
        .price-option:last-child { margin-bottom: 0; }
        .plan-buttons { display: flex; flex-direction: column; gap: 10px; margin-top: auto; }
        @media (max-width: 768px) { .plans-grid { grid-template-columns: 1fr !important; } }
      `}</style>

      <div style={{ maxWidth: 980, margin: "0 auto" }}>

        <div style={{ textAlign: "center", marginBottom: 48, paddingTop: 32 }}>
          <a href="/" style={{ display: "inline-block" }}>
            <img src="/logopuntual.png" alt="Puntual" style={{ height: 52, width: "auto" }} />
          </a>
        </div>

        {motivo === "vencido" && (
          <div style={{ background: "rgba(247,79,106,.12)", border: "1px solid rgba(247,79,106,.3)", borderRadius: 12, padding: "16px 20px", marginBottom: 32, fontSize: 14, color: "#f74f6a", textAlign: "center" }}>
            ⏰ Tu período de acceso venció. Elegí un plan para seguir usando Puntual.
          </div>
        )}

        {pago === "exitoso" && (
          <div style={{ background: "rgba(79,247,168,.12)", border: "1px solid rgba(79,247,168,.3)", borderRadius: 12, padding: "16px 20px", marginBottom: 32, fontSize: 14, color: "#4ff7a8", textAlign: "center" }}>
            🎉 ¡Pago recibido! Tu plan se activará en unos segundos. Podés ingresar a la app.
            <br />
            <a href="/horario-escolar-14.html" style={{ color: "#4ff7a8", fontWeight: 700, marginTop: 8, display: "inline-block" }}>
              Ir a la app →
            </a>
          </div>
        )}

        {pago === "fallido" && (
          <div style={{ background: "rgba(247,79,106,.12)", border: "1px solid rgba(247,79,106,.3)", borderRadius: 12, padding: "16px 20px", marginBottom: 32, fontSize: 14, color: "#f74f6a", textAlign: "center" }}>
            ❌ El pago no se pudo completar. Podés intentarlo de nuevo.
          </div>
        )}

        {pago === "pendiente" && (
          <div style={{ background: "rgba(255,193,7,.12)", border: "1px solid rgba(255,193,7,.3)", borderRadius: 12, padding: "16px 20px", marginBottom: 32, fontSize: 14, color: "#ffc107", textAlign: "center" }}>
            ⏳ Tu pago está siendo procesado. Te avisaremos por email cuando se confirme.
          </div>
        )}

        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(28px, 5vw, 44px)", marginBottom: 14 }}>
            Elegí el plan de tu institución
          </h1>
          <p style={{ fontSize: 16, color: "#8892b0" }}>
            Todos los planes incluyen generación automática y soporte por mail.
          </p>
        </div>

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
              {["15 días de acceso completo","Hasta 5 cursos","Hasta 15 docentes","Generación automática","Exportación PDF y Excel"].map((f, i) => (
                <li key={i} className="feat-item"><span style={{ color: "#4ff7a8", fontWeight: 700, flexShrink: 0 }}>✓</span>{f}</li>
              ))}
              <li className="feat-item" style={{ color: "#4a5578" }}><span style={{ flexShrink: 0 }}>✗</span>Sin soporte prioritario</li>
            </ul>
            <a href="mailto:puntualhorarios@gmail.com?subject=Quiero activar mi prueba gratuita" className="btn-outline" style={{ textDecoration: "none", textAlign: "center", display: "block" }}>
              Activar prueba gratis
            </a>
          </div>

          {/* PLAN ESTÁNDAR */}
          <div className="plan-card highlight" style={{ marginTop: -12 }}>
            <div style={{ position: "absolute", top: -14, left: "50%", transform: "translateX(-50%)", background: "#4f8ef7", color: "#fff", fontSize: 11, fontWeight: 700, padding: "5px 18px", borderRadius: 100, whiteSpace: "nowrap" }}>
              ⭐ MÁS ELEGIDO
            </div>
            <div style={{ marginBottom: 24 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#8892b0", marginBottom: 10, textTransform: "uppercase", letterSpacing: 1 }}>Plan Estándar</p>
              <p style={{ fontSize: 13, color: "#8892b0", lineHeight: 1.6, marginBottom: 16 }}>Para escuelas en crecimiento. Hasta 12 cursos, docentes ilimitados.</p>
              <div className="price-option">
                <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 2 }}>
                  <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 36, color: "#e8eaf2" }}>$199</span>
                  <span style={{ fontSize: 13, color: "#4a5578" }}>/ 1 mes</span>
                </div>
              </div>
              <div className="price-option">
                <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 2 }}>
                  <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 36, color: "#e8eaf2" }}>$299</span>
                  <span style={{ fontSize: 13, color: "#4a5578" }}>/ 2 meses</span>
                </div>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(79,247,168,.12)", color: "#4ff7a8", border: "1px solid rgba(79,247,168,.25)", borderRadius: 100, fontSize: 11, fontWeight: 700, padding: "3px 10px", marginTop: 4 }}>
                  🎉 Ahorrás $99
                </div>
              </div>
            </div>
            <ul style={{ listStyle: "none", marginBottom: 28, flex: 1 }}>
              {["Hasta 12 cursos","Docentes ilimitados","Generación automática","Exportación PDF y Excel","Soporte prioritario","Actualizaciones incluidas"].map((f, i) => (
                <li key={i} className="feat-item"><span style={{ color: "#4ff7a8", fontWeight: 700, flexShrink: 0 }}>✓</span>{f}</li>
              ))}
            </ul>
            <div className="plan-buttons">
              <button className="btn-primary" disabled={!!loadingPlan} onClick={() => handlePago("estandar-1mes")}>
                {loadingPlan === "estandar-1mes" ? "Redirigiendo..." : "Pagar 1 mes ($199) →"}
              </button>
              <button className="btn-outline" disabled={!!loadingPlan} onClick={() => handlePago("estandar-2meses")}>
                {loadingPlan === "estandar-2meses" ? "Redirigiendo..." : "Pagar 2 meses ($299) →"}
              </button>
            </div>
          </div>

          {/* PLAN COMPLETO */}
          <div className="plan-card">
            <div style={{ marginBottom: 24 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#8892b0", marginBottom: 10, textTransform: "uppercase", letterSpacing: 1 }}>Plan Completo</p>
              <p style={{ fontSize: 13, color: "#8892b0", lineHeight: 1.6, marginBottom: 16 }}>Sin límites de cursos ni docentes. Para instituciones de cualquier tamaño.</p>
              <div className="price-option">
                <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 2 }}>
                  <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 36, color: "#e8eaf2" }}>$299</span>
                  <span style={{ fontSize: 13, color: "#4a5578" }}>/ 1 mes</span>
                </div>
              </div>
              <div className="price-option">
                <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 2 }}>
                  <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 36, color: "#e8eaf2" }}>$400</span>
                  <span style={{ fontSize: 13, color: "#4a5578" }}>/ 2 meses</span>
                </div>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(79,247,168,.12)", color: "#4ff7a8", border: "1px solid rgba(79,247,168,.25)", borderRadius: 100, fontSize: 11, fontWeight: 700, padding: "3px 10px", marginTop: 4 }}>
                  🎉 Ahorrás $198
                </div>
              </div>
            </div>
            <ul style={{ listStyle: "none", marginBottom: 28, flex: 1 }}>
              {["Cursos ilimitados","Docentes ilimitados","Generación automática","Exportación PDF y Excel","Soporte prioritario","Actualizaciones incluidas"].map((f, i) => (
                <li key={i} className="feat-item"><span style={{ color: "#4ff7a8", fontWeight: 700, flexShrink: 0 }}>✓</span>{f}</li>
              ))}
            </ul>
            <div className="plan-buttons">
              <button className="btn-primary" disabled={!!loadingPlan} onClick={() => handlePago("completo-1mes")}>
                {loadingPlan === "completo-1mes" ? "Redirigiendo..." : "Pagar 1 mes ($299) →"}
              </button>
              <button className="btn-outline" disabled={!!loadingPlan} onClick={() => handlePago("completo-2meses")}>
                {loadingPlan === "completo-2meses" ? "Redirigiendo..." : "Pagar 2 meses ($400) →"}
              </button>
            </div>
          </div>

        </div>

        <p style={{ textAlign: "center", marginTop: 40, fontSize: 13, color: "#4a5578" }}>
          ¿Tenés dudas? Escribinos a{" "}
          <a href="mailto:puntualhorarios@gmail.com" style={{ color: "#4f8ef7", textDecoration: "none" }}>puntualhorarios@gmail.com</a>
        </p>
        <p style={{ textAlign: "center", marginTop: 16, fontSize: 13, color: "#4a5578" }}>
          <a href="/" style={{ color: "#4f8ef7", textDecoration: "none" }}>← Volver al inicio</a>
        </p>
      </div>
    </div>
  );
}

export default function PlanesPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "#0c0f1a" }} />}>
      <PlanesContent />
    </Suspense>
  );
}
