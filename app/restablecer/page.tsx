"use client";

// Página a la que llega el link del mail "¿Olvidaste tu contraseña?".
// Supabase abre esta página con una sesión temporal de recuperación
// (en el #hash o como ?code=); acá la persona elige la contraseña nueva.

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Estado = "verificando" | "listo" | "invalido" | "guardado";

export default function RestablecerPage() {
  const [estado, setEstado] = useState<Estado>("verificando");
  const [pass1, setPass1] = useState("");
  const [pass2, setPass2] = useState("");
  const [mostrar, setMostrar] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelado = false;

    async function verificar() {
      const url = new URL(window.location.href);
      const hash = new URLSearchParams(url.hash.replace(/^#/, ""));

      // Supabase avisa en la URL si el link venció o ya se usó
      if (url.searchParams.get("error") || hash.get("error")) {
        if (!cancelado) setEstado("invalido");
        return;
      }

      // Variante con ?code= (PKCE)
      const code = url.searchParams.get("code");
      if (code) {
        const { error: exErr } = await supabase.auth.exchangeCodeForSession(code);
        if (exErr) console.error("exchangeCodeForSession:", exErr);
      }

      // Variante con #access_token (la lee el cliente de Supabase solo)
      const { data: { session } } = await supabase.auth.getSession();
      if (cancelado) return;
      if (session) {
        setEstado("listo");
        // Sacar los tokens de la barra de direcciones
        window.history.replaceState(null, "", "/restablecer");
      } else {
        setEstado("invalido");
      }
    }

    // Por si la sesión llega un instante después de cargar la página
    const { data: sub } = supabase.auth.onAuthStateChange((evento, session) => {
      if (!cancelado && session && (evento === "PASSWORD_RECOVERY" || evento === "SIGNED_IN")) {
        setEstado("listo");
      }
    });

    verificar();
    return () => { cancelado = true; sub.subscription.unsubscribe(); };
  }, []);

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (pass1.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (pass1 !== pass2) {
      setError("Las dos contraseñas no coinciden.");
      return;
    }
    setLoading(true);
    const { error: upErr } = await supabase.auth.updateUser({ password: pass1 });
    setLoading(false);

    if (upErr) {
      if (upErr.code === "same_password") {
        setError("Elegí una contraseña distinta a la anterior.");
      } else if (upErr.code === "weak_password") {
        setError("Esa contraseña es muy débil. Probá con una más larga.");
      } else {
        setError("No se pudo guardar la contraseña. Pedí un link nuevo e intentá otra vez.");
        console.error("updateUser:", upErr);
      }
      return;
    }

    setEstado("guardado");
    setTimeout(() => { window.location.href = "/horario-escolar-14.html"; }, 2500);
  }

  return (
    <div style={{
      minHeight: "100vh", background: "#0c0f1a", display: "flex",
      alignItems: "center", justifyContent: "center",
      fontFamily: "'DM Sans', sans-serif", padding: "24px",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input { outline: none; }
      `}</style>

      <div style={{ width: "100%", maxWidth: 420 }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <a href="/" style={{ display: "inline-block" }}>
            <img src="/logopuntual.png" alt="Puntual" style={{ height: 52, width: "auto" }} />
          </a>
        </div>

        <div style={{
          background: "#131827", border: "1px solid #1e2642", borderRadius: 20,
          padding: "36px 32px", boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
        }}>
          <h1 style={{ fontSize: 20, color: "#e8eaf2", fontWeight: 700, marginBottom: 20 }}>
            Elegí una contraseña nueva
          </h1>

          {estado === "verificando" && (
            <p style={{ fontSize: 14, color: "#8892b0" }}>Verificando el link…</p>
          )}

          {estado === "invalido" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={cajaError}>
                El link venció o ya se usó. Los links para cambiar la contraseña sirven una sola vez y duran poco tiempo.
              </div>
              <a href="/login?tab=olvide" style={{ ...btnStyle(false), textAlign: "center", textDecoration: "none" }}>
                Pedir un link nuevo →
              </a>
            </div>
          )}

          {estado === "listo" && (
            <form onSubmit={guardar} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {error && <div style={cajaError}>{error}</div>}
              <div>
                <label style={labelStyle}>Contraseña nueva</label>
                <input type={mostrar ? "text" : "password"} required value={pass1}
                  onChange={(e) => setPass1(e.target.value)} placeholder="Mínimo 6 caracteres"
                  autoComplete="new-password" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Repetí la contraseña</label>
                <input type={mostrar ? "text" : "password"} required value={pass2}
                  onChange={(e) => setPass2(e.target.value)} placeholder="Escribila de nuevo"
                  autoComplete="new-password" style={inputStyle} />
              </div>
              <label style={{ fontSize: 13, color: "#8892b0", display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                <input type="checkbox" checked={mostrar} onChange={(e) => setMostrar(e.target.checked)} />
                Mostrar contraseñas
              </label>
              <button type="submit" disabled={loading} style={btnStyle(loading)}>
                {loading ? "Guardando..." : "Guardar contraseña →"}
              </button>
            </form>
          )}

          {estado === "guardado" && (
            <div style={{
              background: "rgba(79,247,168,.12)", border: "1px solid rgba(79,247,168,.3)",
              borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#4ff7a8",
            }}>
              ✅ Listo, tu contraseña quedó cambiada. Te llevamos a la app…
            </div>
          )}
        </div>

        <p style={{ textAlign: "center", marginTop: 24, fontSize: 13 }}>
          <a href="/login" style={{ color: "#4f8ef7", textDecoration: "none" }}>← Volver a iniciar sesión</a>
        </p>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  fontSize: 13, color: "#8892b0", fontWeight: 500, display: "block", marginBottom: 6,
};

const inputStyle: React.CSSProperties = {
  width: "100%", background: "#1a1f35", border: "1px solid #2a3050",
  borderRadius: 10, padding: "11px 14px", fontSize: 14, color: "#e8eaf2",
  fontFamily: "'DM Sans', sans-serif",
};

const cajaError: React.CSSProperties = {
  background: "rgba(247,79,106,.12)", border: "1px solid rgba(247,79,106,.3)",
  borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#f74f6a", lineHeight: 1.5,
};

function btnStyle(loading: boolean): React.CSSProperties {
  return {
    width: "100%", background: loading ? "#3a5aaa" : "#4f8ef7",
    color: "#fff", border: "none", borderRadius: 10, padding: "13px",
    fontSize: 15, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
    fontFamily: "'DM Sans', sans-serif", display: "block",
  };
}
