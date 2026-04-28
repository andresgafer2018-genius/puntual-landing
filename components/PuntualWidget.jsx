"use client";

import { useState, useRef, useEffect } from "react";

const SYSTEM_PROMPT = `Sos el agente de ventas oficial de "Puntual", una app web argentina que genera horarios escolares automáticamente. Tu objetivo es convertir interesados en clientes con un tono comercial, cálido y directo.

SOBRE PUNTUAL:
Sitio: https://puntual-landing.vercel.app
Resuelve el dolor de armar horarios a mano: tarda días, genera conflictos y es un caos cada inicio de ciclo. Con Puntual se genera en minutos, sin conflictos, con total flexibilidad.

CARACTERÍSTICAS:
- Generación automática de horarios completos
- Sin conflictos (aulas, docentes, materias)
- Edición en tiempo real
- Franjas horarias flexibles
- Gestión de disponibilidades docentes
- Exportación a PDF y Excel
- Válido para primaria, secundaria y terciaria

PLANES:
1. PRUEBA GRATUITA — $0 · 15 días · Sin tarjeta de crédito
   Hasta 5 cursos y 15 docentes. Ideal para conocer la plataforma.
2. PLAN ESTÁNDAR — USD 99/mes
   Hasta 12 cursos, docentes ilimitados. Para instituciones medianas.
3. PLAN COMPLETO — USD 119/mes
   Cursos y docentes ilimitados. Para instituciones grandes.

REGLAS:
- Siempre empujá hacia la prueba gratuita como primer paso.
- Si preguntan por precio, convertilo también a ARS aproximado (multiplicá USD por ~1400).
- Respondé en máximo 3 oraciones. Sé concreto.
- Si muestran interés en contratar, dales el link: https://puntual-landing.vercel.app
- No inventes funcionalidades que no están en esta lista.`;

// ⚠️ Reemplazá con tu Anthropic API key
const API_KEY = "TU_API_KEY_AQUI";

const QUICK_REPLIES = [
  "¿Qué es Puntual?",
  "Planes y precios",
  "Prueba gratuita",
  "¿Cómo empiezo?",
];

export default function PuntualWidget() {
  const [open, setOpen] = useState(false);
  const [leadDone, setLeadDone] = useState(false);
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [messages, setMessages] = useState([]);
  const [history, setHistory] = useState([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [showBadge, setShowBadge] = useState(false);
  const [showQuick, setShowQuick] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => { if (!open) setShowBadge(true); }, 3000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  function toggle() {
    setOpen((v) => !v);
    setShowBadge(false);
  }

  function saveLead(nombre, email) {
    // Opción A: tu propio endpoint
    // fetch("/api/leads", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ nombre, email }) });
    console.log("Lead capturado:", { nombre, email, timestamp: new Date().toISOString() });
  }

  function startChat(skip = false) {
    if (!skip && !nombre.trim()) return;
    if (!skip) saveLead(nombre.trim(), email.trim());
    setLeadDone(true);
    const greeting = nombre
      ? `¡Hola, ${nombre}! Soy el asistente de <strong>Puntual</strong>. ¿En qué te puedo ayudar?`
      : "¡Hola! Soy el asistente de <strong>Puntual</strong>. ¿En qué te puedo ayudar?";
    setMessages([{ role: "agent", html: greeting }]);
  }

  async function askAgent(text, currentHistory) {
    const newHistory = [...currentHistory, { role: "user", content: text }];
    setHistory(newHistory);
    setTyping(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": API_KEY,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 400,
          system: SYSTEM_PROMPT,
          messages: newHistory,
        }),
      });
      const data = await res.json();
      const reply = data.content?.[0]?.text || "Hubo un problema. ¿Podés intentar de nuevo?";
      setHistory((h) => [...h, { role: "assistant", content: reply }]);
      setMessages((m) => [...m, { role: "agent", html: reply }]);
    } catch {
      setMessages((m) => [...m, { role: "agent", html: "Ups, hubo un problema de conexión. ¿Podés intentar de nuevo?" }]);
    }
    setTyping(false);
  }

  function send(text) {
    const msg = text || input.trim();
    if (!msg || typing) return;
    setInput("");
    setShowQuick(false);
    setMessages((m) => [...m, { role: "user", html: msg }]);
    askAgent(msg, history);
  }

  const s = {
    fab: {
      position: "fixed", bottom: 28, right: 28, zIndex: 9999,
      width: 60, height: 60, borderRadius: "50%",
      background: "#534AB7", border: "none", cursor: "pointer",
      boxShadow: "0 4px 20px rgba(83,74,183,0.45)",
      display: "flex", alignItems: "center", justifyContent: "center",
      transition: "transform 0.2s, box-shadow 0.2s",
    },
    badge: {
      position: "fixed", bottom: 84, right: 28, zIndex: 9999,
      background: "#D85A30", color: "#fff", borderRadius: 12,
      fontSize: 11, fontWeight: 600, padding: "3px 8px",
      pointerEvents: "none",
    },
    panel: {
      position: "fixed", bottom: 104, right: 28, zIndex: 9998,
      width: 360, height: 560,
      background: "#fff", borderRadius: 18,
      boxShadow: "0 8px 40px rgba(0,0,0,0.18)",
      display: "flex", flexDirection: "column", overflow: "hidden",
      opacity: open ? 1 : 0,
      transform: open ? "translateY(0) scale(1)" : "translateY(20px) scale(0.97)",
      pointerEvents: open ? "all" : "none",
      transition: "opacity 0.25s, transform 0.25s",
    },
    header: {
      padding: "14px 16px", background: "#534AB7",
      display: "flex", alignItems: "center", gap: 10, flexShrink: 0,
    },
    avatar: {
      width: 36, height: 36, borderRadius: "50%",
      background: "#CECBF6", display: "flex", alignItems: "center",
      justifyContent: "center", fontSize: 15, fontWeight: 700,
      color: "#3C3489", flexShrink: 0,
    },
  };

  return (
    <>
      {/* Badge */}
      {showBadge && !open && <div style={s.badge}>1</div>}

      {/* Panel */}
      <div style={s.panel}>
        {/* Header */}
        <div style={s.header}>
          <div style={s.avatar}>P</div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: "#fff", margin: 0 }}>Puntual · Asistente</p>
            <span style={{ fontSize: 11, color: "#CECBF6" }}>Horarios escolares automáticos</span>
          </div>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#5DCAA5" }} />
        </div>

        {/* Lead form */}
        {!leadDone && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "28px 24px", gap: 12 }}>
            <div style={{ width: 52, height: 52, borderRadius: "50%", background: "#EEEDFE", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 700, color: "#534AB7" }}>P</div>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: "#26215C", textAlign: "center", margin: 0 }}>¡Hola! Soy el asistente de Puntual</h3>
            <p style={{ fontSize: 13, color: "#888780", textAlign: "center", lineHeight: 1.5, margin: 0 }}>Antes de empezar, ¿me dejás tu nombre y email? Así puedo ayudarte mejor.</p>
            <input
              type="text" placeholder="Tu nombre" value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && startChat()}
              style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid #D3D1C7", fontSize: 14, outline: "none" }}
            />
            <input
              type="email" placeholder="Tu email (opcional)" value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && startChat()}
              style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid #D3D1C7", fontSize: 14, outline: "none" }}
            />
            <button
              onClick={() => startChat()}
              style={{ width: "100%", padding: 11, borderRadius: 10, background: "#534AB7", border: "none", cursor: "pointer", fontSize: 14, fontWeight: 600, color: "#fff" }}
            >
              Empezar chat →
            </button>
            <span onClick={() => startChat(true)} style={{ fontSize: 12, color: "#B4B2A9", cursor: "pointer", textDecoration: "underline" }}>
              Continuar sin datos
            </span>
          </div>
        )}

        {/* Chat */}
        {leadDone && (
          <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
            {/* Messages */}
            <div style={{ flex: 1, overflowY: "auto", padding: "14px 14px 8px", display: "flex", flexDirection: "column", gap: 10 }}>
              {messages.map((m, i) => (
                <div key={i} style={{ display: "flex", gap: 8, flexDirection: m.role === "user" ? "row-reverse" : "row" }}>
                  {m.role === "agent" && (
                    <div style={{ width: 26, height: 26, borderRadius: "50%", background: "#CECBF6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#3C3489", flexShrink: 0, marginTop: 2 }}>P</div>
                  )}
                  <div
                    style={{
                      padding: "9px 13px", borderRadius: 14, fontSize: 13, lineHeight: 1.5, maxWidth: "82%",
                      background: m.role === "agent" ? "#F1EFE8" : "#534AB7",
                      color: m.role === "agent" ? "#2C2C2A" : "#fff",
                      borderRadius: m.role === "agent" ? "4px 14px 14px 14px" : "14px 4px 14px 14px",
                    }}
                    dangerouslySetInnerHTML={{ __html: m.html }}
                  />
                </div>
              ))}
              {typing && (
                <div style={{ display: "flex", gap: 8 }}>
                  <div style={{ width: 26, height: 26, borderRadius: "50%", background: "#CECBF6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#3C3489", flexShrink: 0 }}>P</div>
                  <div style={{ padding: "9px 13px", borderRadius: "4px 14px 14px 14px", background: "#F1EFE8", display: "flex", gap: 4, alignItems: "center" }}>
                    {[0, 0.2, 0.4].map((d, i) => (
                      <span key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: "#B4B2A9", display: "inline-block", animation: `pwbounce 1.2s ${d}s infinite` }} />
                    ))}
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick replies */}
            {showQuick && (
              <div style={{ padding: "6px 14px", display: "flex", gap: 6, flexWrap: "wrap", flexShrink: 0 }}>
                {QUICK_REPLIES.map((q) => (
                  <button key={q} onClick={() => send(q)} style={{ padding: "5px 10px", borderRadius: 20, fontSize: 11.5, border: "1.5px solid #7F77DD", color: "#534AB7", background: "#fff", cursor: "pointer", whiteSpace: "nowrap" }}>
                    {q}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div style={{ display: "flex", gap: 8, padding: "10px 12px 14px", borderTop: "1px solid #F1EFE8", flexShrink: 0 }}>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                placeholder="Escribí tu consulta…"
                style={{ flex: 1, padding: "9px 13px", borderRadius: 22, fontSize: 13, border: "1.5px solid #D3D1C7", outline: "none" }}
              />
              <button onClick={() => send()} style={{ width: 38, height: 38, borderRadius: "50%", background: "#534AB7", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="white"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" /></svg>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* FAB */}
      <button onClick={toggle} style={s.fab} aria-label="Abrir chat de Puntual">
        {open ? (
          <svg viewBox="0 0 24 24" width="22" height="22" fill="white"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" /></svg>
        ) : (
          <svg viewBox="0 0 24 24" width="26" height="26" fill="white"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" /></svg>
        )}
      </button>

      <style>{`@keyframes pwbounce { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-6px)} }`}</style>
    </>
  );
}
