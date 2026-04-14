"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

const DEMO_VIDEO_URL = null; // ← reemplazá null por la URL de YouTube cuando tengas el video

const NAV_LINKS = ["Funciones", "Cómo funciona", "Precios", "Contacto"];

const FEATURES = [
  {
    icon: "⚡",
    title: "Generación automática",
    desc: "El algoritmo asigna materias, docentes y aulas en segundos, respetando todas las restricciones de tu escuela.",
    color: "#4f8ef7",
  },
  {
    icon: "🔒",
    title: "Sin conflictos garantizados",
    desc: "Detecta y elimina superposiciones de docentes, aulas y cursos antes de publicar el horario.",
    color: "#4ff7a8",
  },
  {
    icon: "✏️",
    title: "Edición en tiempo real",
    desc: "Ajustá cualquier celda manualmente y el sistema recalcula automáticamente los posibles conflictos.",
    color: "#f7854f",
  },
  {
    icon: "📅",
    title: "Franjas horarias flexibles",
    desc: "Configurá módulos, recreos y almuerzos con duración personalizada para cada turno o nivel.",
    color: "#c97ef7",
  },
  {
    icon: "👨‍🏫",
    title: "Gestión de disponibilidades",
    desc: "Cada docente carga sus días y horarios disponibles. El algoritmo los respeta al armar el horario.",
    color: "#f7d04f",
  },
  {
    icon: "📤",
    title: "Exportación instantánea",
    desc: "Descargá el horario en PDF o Excel para distribuir a docentes, alumnos y familias.",
    color: "#f74f6a",
  },
];

const STEPS = [
  {
    num: "01",
    title: "Cargá tu escuela",
    desc: "Ingresá los cursos, docentes, materias y la carga horaria semanal de cada uno.",
  },
  {
    num: "02",
    title: "Configurá las franjas",
    desc: "Definí el inicio, los recreos y la duración de los módulos para cada turno.",
  },
  {
    num: "03",
    title: "Generá el horario",
    desc: "Con un clic, Puntual arma el horario completo sin conflictos para todos los cursos.",
  },
  {
    num: "04",
    title: "Publicá y distribuí",
    desc: "Ajustá lo que necesites, exportá y compartí el horario con toda la comunidad educativa.",
  },
];

const PLANS = [
  {
    name: "Básico",
    price: "$0",
    period: "para siempre",
    desc: "Ideal para escuelas pequeñas que empiezan.",
    features: [
      "Hasta 5 cursos",
      "Hasta 15 docentes",
      "Generación automática",
      "Exportación PDF",
    ],
    cta: "Empezar gratis",
    highlight: false,
  },
  {
    name: "Estándar",
    price: "A consultar",
    period: "",
    desc: "Para instituciones en crecimiento que necesitan más control.",
    features: [
      "Hasta 12 cursos",
      "Hasta 180 alumnos",
      "Docentes ilimitados",
      "Un solo nivel",
      "Exportación PDF y Excel",
      "Soporte prioritario",
    ],
    cta: "Probar gratis",
    highlight: true,
  },
  {
    name: "Institucional",
    price: "A consultar",
    period: "",
    desc: "Para todo tipo de escuelas y organismos educativos.",
    features: [
      "Cursos ilimitados",
      "Docentes ilimitados",
      "Multi-sede",
      "Multi-nivel",
      "Onboarding personalizado",
      "SLA garantizado",
    ],
    cta: "Contactar",
    highlight: false,
  },
];

const TESTIMONIALS = [
  {
    quote:
      "Antes tardábamos  semanas en armar el horario. Con Puntual lo resolvemos en una tarde, sin errores.",
    name: "Lic. Graciela Montero",
    role: "Directora — Escuela Secundaria N°14",
    initials: "GM",
  },
  {
    quote:
      "Por fin una herramienta pensada para la realidad de las escuelas argentinas. Simple, clara y que funciona.",
    name: "Prof. Hernán Ibáñez",
    role: "Rector — Colegio San Martín",
    initials: "HI",
  },
  {
    quote:
      "La detección de conflictos nos salvó varias veces. Ya no hay que revisar todo manualmente.",
    name: "Prof. Sebastián Perez",
    role: "Secretaria Académica — Colegio San Patricio",
    initials: "SP",
  },
];

function useInView(threshold = 0.15) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setInView(true); },
      { threshold }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return [ref, inView];
}

function FadeIn({ children, delay = 0, className = "" }) {
  const [ref, inView] = useInView();
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? "translateY(0)" : "translateY(28px)",
        transition: `opacity 0.65s ease ${delay}ms, transform 0.65s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

export default function PuntualLanding() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [demoOpen, setDemoOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMenuOpen(false);
  };

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: "#0c0f1a", color: "#e8eaf2", minHeight: "100vh", overflowX: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::selection { background: #4f8ef7; color: #fff; }
        html { scroll-behavior: smooth; }
        a { text-decoration: none; color: inherit; }

        .nav-link {
          font-size: 14px; font-weight: 500; color: #8892b0;
          transition: color .2s; cursor: pointer; background: none; border: none;
        }
        .nav-link:hover { color: #e8eaf2; }

        .btn-primary {
          background: #4f8ef7; color: #fff; border: none; border-radius: 10px;
          padding: 12px 26px; font-size: 14px; font-weight: 700;
          cursor: pointer; transition: background .2s, transform .15s;
          font-family: 'DM Sans', sans-serif; display: inline-flex; align-items: center; gap: 8px;
        }
        .btn-primary:hover { background: #3a7aee; transform: translateY(-1px); }

        .btn-outline {
          background: transparent; color: #e8eaf2; border: 1px solid #2a3050;
          border-radius: 10px; padding: 12px 26px; font-size: 14px; font-weight: 600;
          cursor: pointer; transition: background .2s, border-color .2s;
          font-family: 'DM Sans', sans-serif;
        }
        .btn-outline:hover { background: rgba(255,255,255,.06); border-color: #4a5578; }

        .feature-card {
          background: #131827; border: 1px solid #1e2642;
          border-radius: 16px; padding: 28px;
          transition: border-color .25s, transform .25s;
        }
        .feature-card:hover { border-color: #4f8ef7; transform: translateY(-3px); }

        .plan-card {
          background: #131827; border: 1px solid #1e2642;
          border-radius: 18px; padding: 32px; position: relative;
          transition: transform .25s;
        }
        .plan-card:hover { transform: translateY(-4px); }
        .plan-card.highlight { border-color: #4f8ef7; background: #131e35; }

        .testimonial-card {
          background: #131827; border: 1px solid #1e2642;
          border-radius: 16px; padding: 28px 32px;
        }

        .grid-features { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; }
        .grid-plans { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 20px; }
        .grid-testimonials { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 20px; }

        .step-line { position: absolute; left: 19px; top: 44px; bottom: -32px; width: 2px; background: linear-gradient(to bottom, #2a3a6a, transparent); }

        .noise {
          position: absolute; inset: 0; pointer-events: none; opacity: .03;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          background-size: 200px 200px;
        }

        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
        .float { animation: float 5s ease-in-out infinite; }

        @keyframes pulse-ring { 0%{opacity:.4;transform:scale(1)} 100%{opacity:0;transform:scale(1.6)} }

        .badge {
          display: inline-flex; align-items: center; gap: 6px;
          background: rgba(79,142,247,.12); color: #4f8ef7;
          border: 1px solid rgba(79,142,247,.25); border-radius: 100px;
          font-size: 12px; font-weight: 600; padding: 5px 14px;
          letter-spacing: .3px;
        }

        .section { padding: 96px 24px; max-width: 1120px; margin: 0 auto; }
        .section-title { font-family: 'DM Serif Display', serif; font-size: clamp(30px, 5vw, 48px); line-height: 1.1; margin-bottom: 14px; }
        .section-sub { color: #8892b0; font-size: 17px; line-height: 1.65; max-width: 540px; }

        @media (max-width: 640px) {
          .hero-ctas { flex-direction: column; }
          .hero-ctas button { width: 100%; justify-content: center; }
          .grid-plans { grid-template-columns: 1fr; }
        }
      `}</style>

      {/* NAV */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 200,
        background: scrolled ? "rgba(12,15,26,.92)" : "transparent",
        backdropFilter: scrolled ? "blur(16px)" : "none",
        borderBottom: scrolled ? "1px solid #1e2642" : "1px solid transparent",
        transition: "all .3s",
        padding: "0 24px", height: 68,
        display: "flex", alignItems: "center", gap: 16,
      }}>
        <img src="logopuntual.png" alt="Puntual" style={{ height: 44, width: "auto", display: "block", flexShrink: 0 }} />

        <div style={{ display: "flex", gap: 28, marginLeft: 32, flex: 1 }} className="desktop-nav">
          {NAV_LINKS.map((l) => (
            <button key={l} className="nav-link" onClick={() => scrollTo(l.toLowerCase().replace(/\s/g, "-").replace("ó", "o").replace("ú", "u").replace("é", "e"))}>
              {l}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: 10, marginLeft: "auto" }}>
          <button className="btn-outline" style={{ padding: "8px 18px", fontSize: 13 }} onClick={() => router.push("/login")}>Iniciar sesión</button>
          <button className="btn-primary" style={{ padding: "8px 18px", fontSize: 13 }} onClick={() => router.push("/login")}>Empezar gratis</button>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ position: "relative", minHeight: "100vh", display: "flex", alignItems: "center", overflow: "hidden" }}>
        <div className="noise" />

        {/* Glow blobs */}
        <div style={{ position: "absolute", top: "10%", right: "8%", width: 480, height: 480, borderRadius: "50%", background: "radial-gradient(circle, rgba(79,142,247,.14) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: "15%", left: "5%", width: 340, height: 340, borderRadius: "50%", background: "radial-gradient(circle, rgba(247,133,79,.1) 0%, transparent 70%)", pointerEvents: "none" }} />

        <div style={{ maxWidth: 1120, margin: "0 auto", padding: "120px 24px 80px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "center" }}>

          {/* Left */}
          <div>
            <div className="badge" style={{ marginBottom: 28 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ff7a8", display: "inline-block" }} />
              Ya usado en +80 escuelas de Argentina
            </div>

            <h1 style={{
              fontFamily: "'DM Serif Display', serif",
              fontSize: "clamp(38px, 5.5vw, 68px)",
              lineHeight: 1.06,
              marginBottom: 24,
              letterSpacing: "-1px",
            }}>
              El horario escolar<br />
              <em style={{ color: "#4f8ef7", fontStyle: "italic" }}>que se arma solo.</em>
            </h1>

            <p style={{ fontSize: 18, color: "#8892b0", lineHeight: 1.7, marginBottom: 40, maxWidth: 460 }}>
              Puntual genera horarios sin conflictos para toda tu institución en segundos. Más tiempo para enseñar, menos horas perdidas organizando.
            </p>

            <div className="hero-ctas" style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <button className="btn-primary" style={{ fontSize: 15, padding: "14px 30px" }} onClick={() => router.push("/login")}>
                Empezar gratis →
              </button>
              <button className="btn-outline" style={{ fontSize: 15, padding: "14px 30px" }} onClick={() => setDemoOpen(true)}>
                Ver demo
              </button>
            </div>

            <p style={{ fontSize: 12, color: "#4a5578", marginTop: 16 }}>
              Sin tarjeta de crédito · Configuración en menos de 10 minutos
            </p>
          </div>

          {/* Right — screenshot real */}
          <div className="float" style={{ position: "relative" }}>
            <div style={{
              background: "#131827", border: "1px solid #1e2642", borderRadius: 20,
              overflow: "hidden", boxShadow: "0 40px 80px rgba(0,0,0,.5)",
            }}>
              <img
                src="/screenshot-horario.png"
                alt="Horario generado en Puntual"
                style={{ width: "100%", display: "block", borderRadius: 20 }}
              />
            </div>

            {/* Floating chips */}
            <div style={{ position: "absolute", top: -16, right: -20, background: "#1e2642", border: "1px solid #2a3a6a", borderRadius: 10, padding: "8px 14px", fontSize: 12, fontWeight: 600, color: "#4f8ef7" }}>
              ⚡ Generado en 24 segundos
            </div>
            <div style={{ position: "absolute", bottom: -14, left: -18, background: "#1e2642", border: "1px solid #2a3a6a", borderRadius: 10, padding: "8px 14px", fontSize: 12, fontWeight: 600, color: "#4ff7a8" }}>
              0 conflictos detectados
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="funciones" style={{ background: "#0f1220" }}>
        <div className="section">
          <FadeIn>
            <div className="badge" style={{ marginBottom: 20 }}>Funciones</div>
            <h2 className="section-title">Todo lo que tu escuela necesita,<br />nada de lo que no.</h2>
            <p className="section-sub" style={{ marginBottom: 56 }}>
              Diseñado con directivos, rectores y secretarías académicas de Argentina.
            </p>
          </FadeIn>

          <div className="grid-features">
            {FEATURES.map((f, i) => (
              <FadeIn key={i} delay={i * 80}>
                <div className="feature-card">
                  <div style={{ fontSize: 28, marginBottom: 16 }}>{f.icon}</div>
                  <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 10, color: f.color }}>{f.title}</h3>
                  <p style={{ fontSize: 14, color: "#8892b0", lineHeight: 1.65 }}>{f.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="como-funciona" style={{ background: "#0c0f1a" }}>
        <div className="section" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "start" }}>
          <FadeIn>
            <div className="badge" style={{ marginBottom: 20 }}>Cómo funciona</div>
            <h2 className="section-title">De cero a horario publicado<br /><em style={{ color: "#4f8ef7", fontStyle: "italic" }}>en una tarde.</em></h2>
            <p className="section-sub" style={{ marginTop: 16 }}>
              Sin capacitaciones largas. Sin consultoras. Puntual está pensado para que cualquier persona de la institución lo pueda usar.
            </p>
          </FadeIn>

          <div style={{ position: "relative" }}>
            {STEPS.map((s, i) => (
              <FadeIn key={i} delay={i * 100}>
                <div style={{ display: "flex", gap: 24, marginBottom: 40, position: "relative" }}>
                  <div style={{ position: "relative", flexShrink: 0 }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: "50%",
                      background: "rgba(79,142,247,.15)", border: "1px solid rgba(79,142,247,.3)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontFamily: "'DM Serif Display', serif", fontSize: 15, color: "#4f8ef7",
                    }}>
                      {s.num}
                    </div>
                    {i < STEPS.length - 1 && <div className="step-line" />}
                  </div>
                  <div style={{ paddingTop: 8 }}>
                    <h4 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>{s.title}</h4>
                    <p style={{ fontSize: 14, color: "#8892b0", lineHeight: 1.65 }}>{s.desc}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section style={{ background: "#0f1220" }}>
        <div className="section">
          <FadeIn>
            <div style={{ textAlign: "center", marginBottom: 56 }}>
              <div className="badge" style={{ marginBottom: 20 }}>Testimonios</div>
              <h2 className="section-title">Lo que dicen quienes<br />ya usan Puntual</h2>
            </div>
          </FadeIn>

          <div className="grid-testimonials">
            {TESTIMONIALS.map((t, i) => (
              <FadeIn key={i} delay={i * 100}>
                <div className="testimonial-card">
                  <p style={{ fontSize: 15, color: "#c8cce0", lineHeight: 1.75, marginBottom: 24, fontStyle: "italic" }}>
                    "{t.quote}"
                  </p>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{
                      width: 38, height: 38, borderRadius: "50%",
                      background: "rgba(79,142,247,.2)", border: "1px solid rgba(79,142,247,.3)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 12, fontWeight: 700, color: "#4f8ef7",
                    }}>
                      {t.initials}
                    </div>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 700 }}>{t.name}</p>
                      <p style={{ fontSize: 12, color: "#4a5578" }}>{t.role}</p>
                    </div>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="precios" style={{ background: "#0c0f1a" }}>
        <div className="section">
          <FadeIn>
            <div style={{ textAlign: "center", marginBottom: 56 }}>
              <div className="badge" style={{ marginBottom: 20 }}>Precios</div>
              <h2 className="section-title">Elegí el plan de tu institución</h2>
              <p className="section-sub" style={{ margin: "14px auto 0", textAlign: "center" }}>
                Todos los planes incluyen generación automática y soporte por mail.
              </p>
            </div>
          </FadeIn>

          <div className="grid-plans">
            {PLANS.map((p, i) => (
              <FadeIn key={i} delay={i * 100}>
                <div className={`plan-card ${p.highlight ? "highlight" : ""}`}>
                  {p.highlight && (
                    <div style={{
                      position: "absolute", top: -13, left: "50%", transform: "translateX(-50%)",
                      background: "#4f8ef7", color: "#fff", fontSize: 11, fontWeight: 700,
                      padding: "4px 16px", borderRadius: 100, whiteSpace: "nowrap",
                    }}>
                      MÁS ELEGIDO
                    </div>
                  )}

                  <h3 style={{ fontSize: 15, fontWeight: 700, color: "#8892b0", marginBottom: 12 }}>{p.name}</h3>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 6 }}>
                    <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 40, color: "#e8eaf2" }}>{p.price}</span>
                    {p.period && <span style={{ fontSize: 13, color: "#4a5578" }}>{p.period}</span>}
                  </div>
                  <p style={{ fontSize: 13, color: "#4a5578", marginBottom: 24 }}>{p.desc}</p>

                  <ul style={{ listStyle: "none", marginBottom: 28 }}>
                    {p.features.map((feat, fi) => (
                      <li key={fi} style={{ fontSize: 14, color: "#8892b0", padding: "7px 0", borderBottom: "1px solid #1a2040", display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ color: "#4ff7a8", fontWeight: 700 }}>✓</span>
                        {feat}
                      </li>
                    ))}
                  </ul>

                  <button
                    className={p.highlight ? "btn-primary" : "btn-outline"}
                    style={{ width: "100%", justifyContent: "center", fontSize: 14 }}
                    onClick={() => router.push("/login")}
                  >
                    {p.cta}
                  </button>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section id="contacto" style={{ background: "#0f1220", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(79,142,247,.1) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div className="section" style={{ textAlign: "center", position: "relative" }}>
          <FadeIn>
            <h2 className="section-title" style={{ maxWidth: 600, margin: "0 auto 20px" }}>
              Empezá a usar Puntual<br />
              <em style={{ color: "#4f8ef7", fontStyle: "italic" }}>hoy mismo.</em>
            </h2>
            <p style={{ fontSize: 17, color: "#8892b0", marginBottom: 40 }}>
              Gratis, sin tarjeta de crédito, sin letra chica.
            </p>
            <button className="btn-primary" style={{ fontSize: 16, padding: "16px 40px" }} onClick={() => router.push("/login")}>
              Crear cuenta gratuita →
            </button>
            <p style={{ marginTop: 20, fontSize: 13, color: "#4a5578" }}>
              ¿Tenés dudas? Escribinos a{" "}
              <span style={{ color: "#4f8ef7" }}>puntualhorarios@gmail.com</span>
            </p>
          </FadeIn>
        </div>
      </section>

      {/* MODAL DEMO */}
      {demoOpen && (
        <div
          onClick={() => setDemoOpen(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 999,
            background: "rgba(0,0,0,.75)", display: "flex",
            alignItems: "center", justifyContent: "center", padding: 24,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#131827", border: "1px solid #1e2642", borderRadius: 20,
              padding: 40, maxWidth: 560, width: "100%", textAlign: "center", position: "relative",
            }}
          >
            <button
              onClick={() => setDemoOpen(false)}
              style={{ position: "absolute", top: 16, right: 16, background: "none", border: "none", color: "#4a5578", fontSize: 22, cursor: "pointer" }}
            >✕</button>
            {DEMO_VIDEO_URL ? (
              <iframe
                width="100%" height="315"
                src={DEMO_VIDEO_URL.replace("watch?v=", "embed/")}
                title="Demo Puntual"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{ borderRadius: 12 }}
              />
            ) : (
              <>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🎬</div>
                <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 24, marginBottom: 12 }}>Video próximamente</h3>
                <p style={{ color: "#8892b0", fontSize: 15, lineHeight: 1.65, marginBottom: 28 }}>
                  Estamos preparando el video demo. Mientras tanto, podés empezar gratis y explorar la app por tu cuenta.
                </p>
                <button className="btn-primary" style={{ fontSize: 15, padding: "12px 28px" }} onClick={() => { setDemoOpen(false); router.push("/login"); }}>
                  Empezar gratis →
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer style={{ background: "#090b14", borderTop: "1px solid #1a2040", padding: "32px 24px" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 18, color: "#4f8ef7" }}>
            Puntual<span style={{ color: "#f7854f" }}>.</span>
          </span>
          <p style={{ fontSize: 13, color: "#2a3050" }}>© 2025 Puntual · Hecho con ♥ en Argentina</p>
          <div style={{ display: "flex", gap: 24 }}>
            {["Privacidad", "Términos", "Contacto"].map((l) => (
              <span key={l} style={{ fontSize: 13, color: "#4a5578", cursor: "pointer" }}>{l}</span>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
