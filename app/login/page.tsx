"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

type Tab = "login" | "registro";

export default function LoginPage() {
  const [tab, setTab] = useState<Tab>("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Login fields
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Registro fields
  const [regNombre, setRegNombre] = useState("");
  const [regEscuela, setRegEscuela] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: loginPassword,
    });

    if (authError || !authData.user) {
      setLoading(false);
      setError("Email o contraseña incorrectos.");
      return;
    }

    // Chequear plan de la escuela
    const { data: escuela } = await supabase
      .from("escuelas")
      .select("plan")
      .eq("owner_id", authData.user.id)
      .single();

    setLoading(false);

    if (escuela?.plan === "paid") {
      window.location.href = "/horario";
    } else {
      // plan free o sin escuela → ir a página de planes
      window.location.href = "/planes";
    }
  }

  async function handleRegistro(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (regPassword.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email: regEmail,
      password: regPassword,
      options: {
        data: {
          nombre: regNombre,
          nombre_escuela: regEscuela,
        },
      },
    });

    if (error) {
      setLoading(false);
      setError(error.message);
      return;
    }

    // Enviar email de bienvenida con Resend
    try {
      await fetch("/api/email/bienvenida", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: regNombre,
          escuelaNombre: regEscuela,
          email: regEmail,
        }),
      });
    } catch (err) {
      console.error("Error enviando email de bienvenida:", err);
    }

    setLoading(false);
    setSuccess("¡Cuenta creada! Revisá tu email para confirmar el registro.");
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

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <a href="/" style={{ display: "inline-block" }}>
            <img src="/logopuntual.png" alt="Puntual" style={{ height: 52, width: "auto" }} />
          </a>
        </div>

        {/* Card */}
        <div style={{
          background: "#131827",
          border: "1px solid #1e2642",
          borderRadius: 20,
          padding: "36px 32px",
          boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
        }}>

          {/* Tabs */}
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
                  flex: 1,
                  padding: "9px 0",
                  borderRadius: 8,
                  border: "none",
                  cursor: "pointer",
                  fontSize: 14,
                  fontWeight: 600,
                  fontFamily: "'DM Sans', sans-serif",
                  transition: "all .2s",
                  background: tab === t ? "#4f8ef7" : "transparent",
                  color: tab === t ? "#fff" : "#4a5578",
                }}
              >
                {t === "login" ? "Iniciar sesión" : "Crear cuenta"}
              </button>
            ))}
          </div>

          {/* Error / Success */}
          {error && (
            <div style={{
              background: "rgba(247,79,106,.12)",
              border: "1px solid rgba(247,79,106,.3)",
              borderRadius: 8,
              padding: "10px 14px",
              fontSize: 13,
              color: "#f74f6a",
              marginBottom: 20,
            }}>
              {error}
            </div>
          )}
          {success && (
            <div style={{
              background: "rgba(79,247,168,.12)",
              border: "1px solid rgba(79,247,168,.3)",
              borderRadius: 8,
              padding: "10px 14px",
              fontSize: 13,
              color: "#4ff7a8",
              marginBottom: 20,
            }}>
              {success}
            </div>
          )}

          {/* LOGIN FORM */}
          {tab === "login" && (
            <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ fontSize: 13, color: "#8892b0", fontWeight: 500, display: "block", marginBottom: 6 }}>
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="director@escuela.edu.ar"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={{ fontSize: 13, color: "#8892b0", fontWeight: 500, display: "block", marginBottom: 6 }}>
                  Contraseña
                </label>
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  style={inputStyle}
                />
              </div>
              <button type="submit" disabled={loading} style={btnStyle(loading)}>
                {loading ? "Ingresando..." : "Iniciar sesión →"}
              </button>
            </form>
          )}

          {/* REGISTRO FORM */}
          {tab === "registro" && (
            <form onSubmit={handleRegistro} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ fontSize: 13, color: "#8892b0", fontWeight: 500, display: "block", marginBottom: 6 }}>
                  Tu nombre
                </label>
                <input
                  type="text"
                  required
                  value={regNombre}
                  onChange={(e) => setRegNombre(e.target.value)}
                  placeholder="Ej: María González"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={{ fontSize: 13, color: "#8892b0", fontWeight: 500, display: "block", marginBottom: 6 }}>
                  Nombre de tu escuela
                </label>
                <input
                  type="text"
                  required
                  value={regEscuela}
                  onChange={(e) => setRegEscuela(e.target.value)}
                  placeholder="Ej: Escuela Secundaria N°14"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={{ fontSize: 13, color: "#8892b0", fontWeight: 500, display: "block", marginBottom: 6 }}>
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="director@escuela.edu.ar"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={{ fontSize: 13, color: "#8892b0", fontWeight: 500, display: "block", marginBottom: 6 }}>
                  Contraseña
                </label>
                <input
                  type="password"
                  required
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  style={inputStyle}
                />
              </div>
              <button type="submit" disabled={loading} style={btnStyle(loading)}>
                {loading ? "Creando cuenta..." : "Crear cuenta gratis →"}
              </button>
              <p style={{ fontSize: 12, color: "#4a5578", textAlign: "center", lineHeight: 1.6 }}>
                Al registrarte aceptás nuestros{" "}
                <span style={{ color: "#4f8ef7", cursor: "pointer" }}>Términos de uso</span>
              </p>
            </form>
          )}
        </div>

        {/* Back to landing */}
        <p style={{ textAlign: "center", marginTop: 24, fontSize: 13, color: "#4a5578" }}>
          <a href="/" style={{ color: "#4f8ef7", textDecoration: "none" }}>
            ← Volver al inicio
          </a>
        </p>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "#1a1f35",
  border: "1px solid #2a3050",
  borderRadius: 10,
  padding: "11px 14px",
  fontSize: 14,
  color: "#e8eaf2",
  fontFamily: "'DM Sans', sans-serif",
  transition: "border-color .2s",
};

function btnStyle(loading: boolean): React.CSSProperties {
  return {
    width: "100%",
    background: loading ? "#3a5aaa" : "#4f8ef7",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    padding: "13px",
    fontSize: 15,
    fontWeight: 700,
    cursor: loading ? "not-allowed" : "pointer",
    fontFamily: "'DM Sans', sans-serif",
    transition: "background .2s",
    marginTop: 4,
  };
}
