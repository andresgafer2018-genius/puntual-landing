"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Suspense } from "react";

type Tab = "login" | "registro";

function LoginContent() {
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<Tab>("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [regNombre, setRegNombre] = useState("");
  const [regEscuela, setRegEscuela] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");

  const [showLoginPass, setShowLoginPass] = useState(false);
  const [showRegPass, setShowRegPass] = useState(false);

  // Si venimos de /planes porque el usuario quiso contratar un plan sin
  // estar logueado, estos parámetros nos dicen a qué plan volver después.
  const redirectTo = searchParams.get("redirect");
  const planPendiente = searchParams.get("plan");

  useEffect(() => {
    const msg = searchParams.get("msg");
    const tabParam = searchParams.get("tab");
    if (msg === "confirmado") {
      setTab("login");
      setSuccess("✅ ¡Email confirmado! Ahora iniciá sesión para acceder a la app.");
    } else if (msg === "error") {
      setTab("login");
      setError("El link de confirmación no es válido o ya expiró. Intentá iniciar sesión o registrarte de nuevo.");
    } else if (tabParam === "registro") {
      setTab("registro");
    } else if (redirectTo === "planes" && planPendiente) {
      setTab("login");
      setSuccess("Iniciá sesión para continuar con la compra de tu plan.");
    }
    // Limpiar el hash que Supabase agrega (#error=access_denied&...) para que no interfiera
    if (window.location.hash) {
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error: authError } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: loginPassword,
    });

    if (authError) {
      setLoading(false);
      setError("Email o contraseña incorrectos.");
      return;
    }

    // Si veníamos de /planes con un plan pendiente, volvemos ahí para
    // que el pago se dispare solo en lugar de perder la selección.
    if (redirectTo === "planes" && planPendiente) {
      window.location.href = `/planes?autopago=${encodeURIComponent(planPendiente)}`;
      return;
    }

    // La app (horario-escolar-14.html) decide con initPlan() qué mostrar
    // según el plan del usuario: banner de trial, redirect a /planes si venció, etc.
    window.location.href = "/horario-escolar-14.html";
  }

  async function handleRegistro(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (regPassword.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    setLoading(true);

    // Crea el usuario en Supabase Auth y manda email de confirmación.
    // El nombre de la escuela se guarda en user_metadata para que el callback lo use.
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: regEmail,
      password: regPassword,
      options: {
        data: { nombre: regNombre, nombre_escuela: regEscuela },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (authError || !authData.user) {
      setLoading(false);
      setError(authError?.message || "Error al crear la cuenta.");
      return;
    }

    // Email de bienvenida en segundo plano (no bloquea el flujo)
    fetch("/api/email/bienvenida", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre: regNombre, escuelaNombre: regEscuela, email: regEmail }),
    }).catch(err => console.error("Error email bienvenida:", err));

    setLoading(false);

    // La fila en 'escuelas' se crea en /auth/callback después de confirmar el email,
    // cuando hay sesión activa y RLS permite el INSERT.
    setSuccess("¡Cuenta creada! Revisá tu email y hacé clic en el link para ingresar a la app.");
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0c0f1a",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'DM Sans', sans-serif",
      padding: "24px",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input { outline: none; }
        input:-webkit-autofill {
          -webkit-box-shadow: 0 0 0 1000px #1a1f35 inset;
          -webkit-text-fill-color: #e8eaf2;
        }
      `}</style>

      <div style={{ width: "100%", maxWidth: 420 }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <a href="/" style={{ display: "inline-block" }}>
            <img src="/logopuntual.png" alt="Puntual" style={{ height: 52, width: "auto" }} />
          </a>
        </div>

        <div style={{
          background: "#131827",
          border: "1px solid #1e2642",
          borderRadius: 20,
          padding: "36px 32px",
          boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
        }}>
          <div style={{
            display: "flex",
            background: "#0c0f1a",
            borderRadius: 10,
            padding: 4,
            marginBottom: 28,
          }}>
            {(["login", "registro"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setError(""); setSuccess(""); }}
                style={{
                  flex: 1, padding: "9px 0", borderRadius: 8, border: "none",
                  cursor: "pointer", fontSize: 14, fontWeight: 600,
                  fontFamily: "'DM Sans', sans-serif", transition: "all .2s",
                  background: tab === t ? "#4f8ef7" : "transparent",
                  color: tab === t ? "#fff" : "#4a5578",
                }}
              >
                {t === "login" ? "Iniciar sesión" : "Crear cuenta"}
              </button>
            ))}
          </div>

          {error && (
            <div style={{
              background: "rgba(247,79,106,.12)", border: "1px solid rgba(247,79,106,.3)",
              borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#f74f6a", marginBottom: 20,
            }}>{error}</div>
          )}
          {success && (
            <div style={{
              background: "rgba(79,247,168,.12)", border: "1px solid rgba(79,247,168,.3)",
              borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#4ff7a8", marginBottom: 20,
            }}>{success}</div>
          )}

          {tab === "login" && (
            <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ fontSize: 13, color: "#8892b0", fontWeight: 500, display: "block", marginBottom: 6 }}>Email</label>
                <input type="email" required value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} placeholder="director@escuela.edu.ar" style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 13, color: "#8892b0", fontWeight: 500, display: "block", marginBottom: 6 }}>Contraseña</label>
                <div style={{ position: "relative" }}>
                  <input type={showLoginPass ? "text" : "password"} required value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} placeholder="••••••••" style={{ ...inputStyle, paddingRight: 44 }} />
                  <PassToggle shown={showLoginPass} onToggle={() => setShowLoginPass(!showLoginPass)} />
                </div>
              </div>
              <button type="submit" disabled={loading} style={btnStyle(loading)}>
                {loading ? "Ingresando..." : "Iniciar sesión →"}
              </button>
            </form>
          )}

          {tab === "registro" && (
            <form onSubmit={handleRegistro} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ fontSize: 13, color: "#8892b0", fontWeight: 500, display: "block", marginBottom: 6 }}>Tu nombre</label>
                <input type="text" required value={regNombre} onChange={(e) => setRegNombre(e.target.value)} placeholder="Ej: María González" style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 13, color: "#8892b0", fontWeight: 500, display: "block", marginBottom: 6 }}>Nombre de tu escuela</label>
                <input type="text" required value={regEscuela} onChange={(e) => setRegEscuela(e.target.value)} placeholder="Ej: Escuela Secundaria N°14" style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 13, color: "#8892b0", fontWeight: 500, display: "block", marginBottom: 6 }}>Email</label>
                <input type="email" required value={regEmail} onChange={(e) => setRegEmail(e.target.value)} placeholder="director@escuela.edu.ar" style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 13, color: "#8892b0", fontWeight: 500, display: "block", marginBottom: 6 }}>Contraseña</label>
                <div style={{ position: "relative" }}>
                  <input type={showRegPass ? "text" : "password"} required value={regPassword} onChange={(e) => setRegPassword(e.target.value)} placeholder="Mínimo 6 caracteres" style={{ ...inputStyle, paddingRight: 44 }} />
                  <PassToggle shown={showRegPass} onToggle={() => setShowRegPass(!showRegPass)} />
                </div>
              </div>
              <button type="submit" disabled={loading} style={btnStyle(loading)}>
                {loading ? "Creando cuenta..." : "Crear cuenta gratis →"}
              </button>
              <p style={{ fontSize: 12, color: "#4a5578", textAlign: "center", lineHeight: 1.6 }}>
                Al registrarte aceptás nuestros{" "}
                <a href="/terminos" target="_blank" style={{ color: "#4f8ef7", textDecoration: "none" }}>
                  Términos de uso
                </a>
              </p>
            </form>
          )}
        </div>

        <p style={{ textAlign: "center", marginTop: 24, fontSize: 13, color: "#4a5578" }}>
          <a href="/" style={{ color: "#4f8ef7", textDecoration: "none" }}>← Volver al inicio</a>
        </p>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", background: "#1a1f35", border: "1px solid #2a3050",
  borderRadius: 10, padding: "11px 14px", fontSize: 14, color: "#e8eaf2",
  fontFamily: "'DM Sans', sans-serif", transition: "border-color .2s",
};

function btnStyle(loading: boolean): React.CSSProperties {
  return {
    width: "100%", background: loading ? "#3a5aaa" : "#4f8ef7",
    color: "#fff", border: "none", borderRadius: 10, padding: "13px",
    fontSize: 15, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
    fontFamily: "'DM Sans', sans-serif", transition: "background .2s", marginTop: 4,
  };
}

function PassToggle({ shown, onToggle }: { shown: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={shown ? "Ocultar contraseña" : "Mostrar contraseña"}
      style={{
        position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
        background: "none", border: "none", cursor: "pointer", padding: 4,
        color: "#8892b0", display: "flex", alignItems: "center",
      }}
    >
      {shown ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
      )}
    </button>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}
