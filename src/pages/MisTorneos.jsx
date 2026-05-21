import "../styles/IndexStyle.css";
import "../styles/MenuAdmin.css";
import "../styles/MisTorneos.css";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminHeader from "../components/AdminHeader.jsx";
import { adminApiFetch } from "../utils/api.js";

// estado backend → etiqueta UI
const ESTADO_LABEL = {
  en_curso: "En curso",
  borrador: "Borrador",
  finalizado: "Finalizado",
};

const ESTADO_CONFIG = {
  "En curso":   { color: "#16a34a", badgeBg: "#dcfce7", badgeColor: "#166534" },
  "Borrador":   { color: "#d97706", badgeBg: "#fef9c3", badgeColor: "#92400e" },
  "Finalizado": { color: "#2563eb", badgeBg: "#dbeafe", badgeColor: "#1e40af" },
};

const TABS = ["Todos", "En curso", "Borradores", "Finalizados"];

function mapTorneo(t) {
  const estadoLabel = ESTADO_LABEL[t.estado] ?? t.estado;
  const equiposActual = Array.isArray(t.participaciones) ? t.participaciones.length : 0;
  const partidosActual = Array.isArray(t.partidos) ? t.partidos.length : 0;
  const pct = t.cantidadEquipos > 0
    ? Math.round((equiposActual / t.cantidadEquipos) * 100)
    : (estadoLabel === "Finalizado" ? 100 : 0);

  return {
    id: t.id,
    nombre: t.nombreTorneo,
    estado: estadoLabel,
    categoria: t.categoria ?? "—",
    tipo: t.formato === "idayvuelta" ? "Ida y vuelta" : "Solo ida",
    inicio: t.fechaInicio ? new Date(t.fechaInicio).toLocaleDateString("es-AR") : null,
    equipos: { actual: equiposActual, total: t.cantidadEquipos ?? "—" },
    partidos: { actual: partidosActual, total: null },
    progreso: {
      label: estadoLabel === "Finalizado" ? "Finalizado" : estadoLabel === "Borrador" ? "Sin iniciar" : `${equiposActual} equipos`,
      pct,
    },
  };
}

export default function MisTorneos() {
  const navigate = useNavigate();
  const [admin, setAdmin] = useState(null);
  const [torneos, setTorneos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("Todos");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("admin");
    if (!stored) { navigate("/admin"); return; }
    try {
      const adminData = JSON.parse(stored);
      setAdmin(adminData);
      fetchTorneos(adminData.id);
    } catch {
      navigate("/admin");
    }
  }, [navigate]);

  async function fetchTorneos(adminId) {
    try {
      setLoading(true);
      const res = await adminApiFetch("/torneo");
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error al cargar torneos");

      // Filtrar solo los torneos del admin logueado
      const misTorneos = (data.data || []).filter(
        (t) => t.adminTorneo?.id === adminId || t.adminTorneo === adminId
      );
      setTorneos(misTorneos.map(mapTorneo));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleEliminar(torneoId) {
    if (!confirm("¿Seguro que querés eliminar este torneo?")) return;
    try {
      const res = await adminApiFetch(`/torneo/${torneoId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Error al eliminar");
      }
      setTorneos((prev) => prev.filter((t) => t.id !== torneoId));
    } catch (e) {
      alert(e.message);
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("admin");
    localStorage.removeItem("adminToken");
    navigate("/admin");
  };

  if (!admin) return null;

  const filtered = torneos.filter((t) => {
    const matchTab =
      activeTab === "Todos" ||
      (activeTab === "En curso"    && t.estado === "En curso")   ||
      (activeTab === "Borradores"  && t.estado === "Borrador")   ||
      (activeTab === "Finalizados" && t.estado === "Finalizado");
    const matchSearch = t.nombre.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  const counts = {
    "Todos":       torneos.length,
    "En curso":    torneos.filter((t) => t.estado === "En curso").length,
    "Borradores":  torneos.filter((t) => t.estado === "Borrador").length,
    "Finalizados": torneos.filter((t) => t.estado === "Finalizado").length,
  };

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
              <div><span className="mt-metric-value">{counts["En curso"]}</span><span className="mt-metric-label">En curso</span></div>
            </div>
            <div className="mt-metric-card">
              <i className="bx bx-edit"></i>
              <div><span className="mt-metric-value">{counts["Borradores"]}</span><span className="mt-metric-label">Borradores</span></div>
            </div>
            <div className="mt-metric-card">
              <i className="bx bx-check-circle"></i>
              <div><span className="mt-metric-value">{counts["Finalizados"]}</span><span className="mt-metric-label">Finalizados</span></div>
            </div>
            <div className="mt-metric-card">
              <i className="bx bx-group"></i>
              <div>
                <span className="mt-metric-value">
                  {torneos.reduce((acc, t) => acc + t.equipos.actual, 0)}
                </span>
                <span className="mt-metric-label">Equipos en juego</span>
              </div>
            </div>
          </div>
        </section>

        {/* ── Lista ───────────────────────────────────────────────────────── */}
        <section className="mt-list">
          <div className="mt-tabs">
            {TABS.map((tab) => (
              <button
                key={tab}
                className={`mt-tab${activeTab === tab ? " active" : ""}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
                <span className="mt-tab-count">{counts[tab]}</span>
              </button>
            ))}
          </div>

          <div className="mt-controls">
            <div className="mt-search">
              <i className="bx bx-search"></i>
              <input
                type="text"
                placeholder="Buscar torneo..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button className="mt-btn-new" onClick={() => navigate("/admin/torneos/nuevo")}>
              + Nuevo torneo
            </button>
          </div>

          {loading && <p style={{ padding: "2rem", textAlign: "center", color: "#6b7280" }}>Cargando torneos...</p>}
          {error && <p style={{ padding: "2rem", textAlign: "center", color: "#dc2626" }}>{error}</p>}

          {!loading && !error && (
            <div className="mt-grid">
              {filtered.map((torneo) => {
                const cfg = ESTADO_CONFIG[torneo.estado] ?? ESTADO_CONFIG["Borrador"];
                return (
                  <div key={torneo.id} className="mt-card" style={{ borderLeftColor: cfg.color }}>
                    <div className="mt-card-header">
                      <h2 className="mt-card-name">{torneo.nombre}</h2>
                      <span className="mt-badge" style={{ background: cfg.badgeBg, color: cfg.badgeColor }}>
                        ● {torneo.estado}
                      </span>
                    </div>

                    <p className="mt-card-sub">
                      {torneo.categoria} · {torneo.tipo} · Inicio: {torneo.inicio ?? "—"}
                    </p>

                    <div className="mt-card-metrics">
                      <div className="mt-card-metric">
                        <span className="mt-card-metric-val">{torneo.equipos.actual}/{torneo.equipos.total}</span>
                        <span className="mt-card-metric-lab">EQUIPOS</span>
                      </div>
                      <div className="mt-card-metric-sep" />
                      <div className="mt-card-metric">
                        <span className="mt-card-metric-val">{torneo.partidos.actual}/{torneo.partidos.total ?? "—"}</span>
                        <span className="mt-card-metric-lab">PARTIDOS</span>
                      </div>
                      <div className="mt-card-metric-sep" />
                      <div className="mt-card-metric">
                        <span className="mt-card-metric-val">{torneo.progreso.pct}%</span>
                        <span className="mt-card-metric-lab">PROGRESO</span>
                      </div>
                    </div>

                    <div className="mt-progress-wrap">
                      <div className="mt-progress-bar-bg">
                        <div className="mt-progress-bar-fill" style={{ width: `${torneo.progreso.pct}%`, background: cfg.color }} />
                      </div>
                      <span className="mt-progress-label">{torneo.progreso.label} · {torneo.progreso.pct}%</span>
                    </div>

                    <div className="mt-card-actions">
                      {torneo.estado === "En curso" && (
                        <>
                          <button className="mt-btn-outline" onClick={() => navigate(`/admin/torneos/${torneo.id}/equipos`)}>👥 Equipos</button>
                          <button className="mt-btn-trash" onClick={() => handleEliminar(torneo.id)}><i className="bx bx-trash"></i></button>
                        </>
                      )}
                      {torneo.estado === "Borrador" && (
                        <>
                          <button className="mt-btn-add" onClick={() => navigate(`/admin/torneos/${torneo.id}/equipos`)}>👥 Agregar equipos</button>
                          <button className="mt-btn-trash" onClick={() => handleEliminar(torneo.id)}><i className="bx bx-trash"></i></button>
                        </>
                      )}
                      {torneo.estado === "Finalizado" && (
                        <>
                          <button className="mt-btn-outline mt-btn-full">🏆 Ver resumen</button>
                          <button className="mt-btn-trash" onClick={() => handleEliminar(torneo.id)}><i className="bx bx-trash"></i></button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}

              <div className="mt-card-new" onClick={() => navigate("/admin/torneos/nuevo")}>
                <div className="mt-card-new-icon"><i className="bx bx-plus"></i></div>
                <span className="mt-card-new-label">Crear nuevo torneo</span>
                <span className="mt-card-new-sub">Comenzá la próxima competencia</span>
              </div>
            </div>
          )}
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
