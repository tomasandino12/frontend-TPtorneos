import "../styles/IndexStyle.css";
import "../styles/MenuAdmin.css";
import "../styles/MisTorneos.css";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminHeader from "../components/AdminHeader.jsx";

const TORNEOS = [
  {
    id: 1,
    nombre: "Apertura 2025",
    estado: "En curso",
    categoria: "Mayores",
    tipo: "Liga",
    inicio: "9 ago 2025",
    equipos: { actual: 12, total: 12 },
    partidos: { actual: 48, total: 132 },
    proximaFecha: "Sáb 24/05",
    progreso: { label: "8 de 22", pct: 36 },
  },
  {
    id: 2,
    nombre: "Femenino 2025",
    estado: "En curso",
    categoria: "Femenino",
    tipo: "Liga",
    inicio: "15 mar 2025",
    equipos: { actual: 8, total: 8 },
    partidos: { actual: 44, total: 56 },
    proximaFecha: "Dom 25/05",
    progreso: { label: "14 de 14", pct: 78 },
  },
  {
    id: 3,
    nombre: "Copa Invierno Sub-17",
    estado: "Borrador",
    categoria: "Sub-17",
    tipo: "Mixto",
    inicio: "2 jun 2025",
    equipos: { actual: 10, total: 16 },
    partidos: { actual: 0, total: null },
    proximaFecha: null,
    progreso: { label: "Sin iniciar", pct: 0 },
  },
  {
    id: 4,
    nombre: "Sub-17 Verano",
    estado: "Finalizado",
    categoria: "Sub-17",
    tipo: "Eliminación",
    inicio: "12 ene 2025",
    equipos: { actual: 6, total: 6 },
    partidos: { actual: 14, total: 14 },
    proximaFecha: null,
    progreso: { label: "Finalizado", pct: 100 },
  },
  {
    id: 5,
    nombre: "Veteranos Apertura",
    estado: "Borrador",
    categoria: "Veteranos",
    tipo: "Liga",
    inicio: null,
    equipos: { actual: 7, total: 10 },
    partidos: { actual: 0, total: null },
    proximaFecha: null,
    progreso: { label: "Sin iniciar", pct: 0 },
  },
  {
    id: 6,
    nombre: "Clausura 2024",
    estado: "Finalizado",
    categoria: "Mayores",
    tipo: "Liga",
    inicio: "4 ago 2024",
    equipos: { actual: 10, total: 10 },
    partidos: { actual: 90, total: 90 },
    proximaFecha: null,
    progreso: { label: "Finalizado", pct: 100 },
  },
];

const ESTADO_CONFIG = {
  "En curso":   { color: "#16a34a", badgeBg: "#dcfce7", badgeColor: "#166534" },
  "Borrador":   { color: "#d97706", badgeBg: "#fef9c3", badgeColor: "#92400e" },
  "Finalizado": { color: "#2563eb", badgeBg: "#dbeafe", badgeColor: "#1e40af" },
};

const TABS = ["Todos", "En curso", "Borradores", "Finalizados"];

const COUNTS = {
  "Todos":      TORNEOS.length,
  "En curso":   TORNEOS.filter(t => t.estado === "En curso").length,
  "Borradores": TORNEOS.filter(t => t.estado === "Borrador").length,
  "Finalizados":TORNEOS.filter(t => t.estado === "Finalizado").length,
};

export default function MisTorneos() {
  const navigate = useNavigate();
  const [admin, setAdmin] = useState(null);
  const [activeTab, setActiveTab] = useState("Todos");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("admin");
    if (!stored) { navigate("/admin"); return; }
    try { setAdmin(JSON.parse(stored)); }
    catch { navigate("/admin"); }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("admin");
    navigate("/admin");
  };

  if (!admin) return null;

  const filtered = TORNEOS.filter(t => {
    const matchTab =
      activeTab === "Todos" ||
      (activeTab === "En curso"    && t.estado === "En curso")   ||
      (activeTab === "Borradores"  && t.estado === "Borrador")   ||
      (activeTab === "Finalizados" && t.estado === "Finalizado");
    const matchSearch = t.nombre.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  return (
    <div className="layout">

      <AdminHeader admin={admin} onLogout={handleLogout} />

      <main style={{ backgroundColor: "#f9fafb" }}>

        {/* ── Hero ────────────────────────────────────────────────────────── */}
        <section className="mt-hero">
          <div className="mt-hero-title">
            <i className="bx bx-trophy mt-trophy-icon"></i>
            <h1>Mis Torneos</h1>
          </div>
          <p className="mt-hero-subtitle">
            Todos los torneos que creaste · editá, sumá equipos o eliminá los que ya no necesités.
          </p>
          <div className="mt-metrics">
            <div className="mt-metric-card">
              <i className="bx bx-trophy"></i>
              <div><span className="mt-metric-value">2</span><span className="mt-metric-label">En curso</span></div>
            </div>
            <div className="mt-metric-card">
              <i className="bx bx-edit"></i>
              <div><span className="mt-metric-value">2</span><span className="mt-metric-label">Borradores</span></div>
            </div>
            <div className="mt-metric-card">
              <i className="bx bx-check-circle"></i>
              <div><span className="mt-metric-value">2</span><span className="mt-metric-label">Finalizados</span></div>
            </div>
            <div className="mt-metric-card">
              <i className="bx bx-group"></i>
              <div><span className="mt-metric-value">53</span><span className="mt-metric-label">Equipos en juego</span></div>
            </div>
          </div>
        </section>

        {/* ── Lista ───────────────────────────────────────────────────────── */}
        <section className="mt-list">

          {/* Tabs */}
          <div className="mt-tabs">
            {TABS.map(tab => (
              <button
                key={tab}
                className={`mt-tab${activeTab === tab ? " active" : ""}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
                <span className="mt-tab-count">{COUNTS[tab]}</span>
              </button>
            ))}
          </div>

          {/* Search + New */}
          <div className="mt-controls">
            <div className="mt-search">
              <i className="bx bx-search"></i>
              <input
                type="text"
                placeholder="Buscar torneo..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <button className="mt-btn-new" onClick={() => navigate("/admin/torneos/nuevo")}>
              + Nuevo torneo
            </button>
          </div>

          {/* Grid */}
          <div className="mt-grid">
            {filtered.map(torneo => {
              const cfg = ESTADO_CONFIG[torneo.estado];
              return (
                <div
                  key={torneo.id}
                  className="mt-card"
                  style={{ borderLeftColor: cfg.color }}
                >
                  {/* Header */}
                  <div className="mt-card-header">
                    <h2 className="mt-card-name">{torneo.nombre}</h2>
                    <span
                      className="mt-badge"
                      style={{ background: cfg.badgeBg, color: cfg.badgeColor }}
                    >
                      ● {torneo.estado}
                    </span>
                  </div>

                  {/* Subtitle */}
                  <p className="mt-card-sub">
                    {torneo.categoria} · {torneo.tipo} · Inicio: {torneo.inicio ?? "—"}
                  </p>

                  {/* Metrics */}
                  <div className="mt-card-metrics">
                    <div className="mt-card-metric">
                      <span className="mt-card-metric-val">{torneo.equipos.actual}/{torneo.equipos.total}</span>
                      <span className="mt-card-metric-lab">EQUIPOS</span>
                    </div>
                    <div className="mt-card-metric-sep" />
                    <div className="mt-card-metric">
                      <span className="mt-card-metric-val">
                        {torneo.partidos.actual}/{torneo.partidos.total ?? "—"}
                      </span>
                      <span className="mt-card-metric-lab">PARTIDOS</span>
                    </div>
                    <div className="mt-card-metric-sep" />
                    <div className="mt-card-metric">
                      <span className="mt-card-metric-val">{torneo.proximaFecha ?? "—"}</span>
                      <span className="mt-card-metric-lab">PRÓXIMA FECHA</span>
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="mt-progress-wrap">
                    <div className="mt-progress-bar-bg">
                      <div
                        className="mt-progress-bar-fill"
                        style={{ width: `${torneo.progreso.pct}%`, background: cfg.color }}
                      />
                    </div>
                    <span className="mt-progress-label">
                      {torneo.progreso.label} · {torneo.progreso.pct}%
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="mt-card-actions">
                    {torneo.estado === "En curso" && (
                      <>
                        <button className="mt-btn-outline">Editar</button>
                        <button className="mt-btn-trash"><i className="bx bx-trash"></i></button>
                      </>
                    )}
                    {torneo.estado === "Borrador" && (
                      <>
                        <button className="mt-btn-add">👥 Agregar equipos</button>
                        <button className="mt-btn-outline">Editar</button>
                        <button className="mt-btn-trash"><i className="bx bx-trash"></i></button>
                      </>
                    )}
                    {torneo.estado === "Finalizado" && (
                      <>
                        <button className="mt-btn-outline mt-btn-full">🏆 Ver resumen</button>
                        <button className="mt-btn-trash"><i className="bx bx-trash"></i></button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Create new card */}
            <div className="mt-card-new" onClick={() => navigate("/admin/torneos/nuevo")}>
              <div className="mt-card-new-icon">
                <i className="bx bx-plus"></i>
              </div>
              <span className="mt-card-new-label">Crear nuevo torneo</span>
              <span className="mt-card-new-sub">Comenzá la próxima competencia</span>
            </div>
          </div>

        </section>
      </main>

      <footer className="footer">
        <h5>
          © 2025 - Gestor de Torneos · Panel del Administrador · Para mas información o
          problemas con la página contactate a: 341 6173297 o a nuestra cuenta de
          instagram @todotorneos
        </h5>
      </footer>

    </div>
  );
}
