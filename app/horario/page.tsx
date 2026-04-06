"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function HorarioPage() {
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        window.location.href = "/login";
      } else {
        // Redirige al HTML de la app
        window.location.href = "/horario-app.html";
      }
    });
  }, []);

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0c0f1a",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'DM Sans', sans-serif",
      color: "#8892b0",
      fontSize: 15,
    }}>
      <div style={{ textAlign: "center" }}>
        <div style={{
          width: 40, height: 40, border: "3px solid #4f8ef7",
          borderTopColor: "transparent", borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
          margin: "0 auto 20px",
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        Cargando tu escuela...
      </div>
    </div>
  );
}
