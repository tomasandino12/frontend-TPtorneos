import "../styles/IndexStyle.css";
import "../styles/MenuAdmin.css";
import "../styles/MisTorneos.css";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiAward, FiEdit2, FiCheckCircle, FiUsers, FiSearch, FiPlus, FiTrash2 } from "react-icons/fi";
import AdminHeader from "../components/AdminHeader.jsx";
import { adminApiFetch } from "../utils/api.js";
import { Button, TextField, Card, PageShell, PageHero } from "../components/ui";

// estado backend → etiqueta UI
const ESTADO_LABEL = {
  en_curso: "En curso",
  borrador: "Borrador",
  finalizado: "Finalizado",
};

// "En curso" es el único estado que amerita resaltarse (activo/en progreso);
// "Borrador" y "Finalizado" son estados neutrales/inactivos — antes Borrador
// usaba el color de advertencia (--color-whistle), que la app reserva para
// alertas reales, no para un estado neutral.
const ESTADO_CONFIG = {
  "En curso":   { color: "var(--color-turf)",  badgeBg: "var(--color-success-bg)",  badgeColor: "var(--color-pitch)" },
  "Borrador":   { color: "var(--color-muted)", badgeBg: "var(--color-surface-muted)", badgeColor: "var(--color-ink)" },
  "Finalizado": { color: "var(--color-muted)", badgeBg: "var(--color-surface-muted)", badgeColor: "var(--color-ink)" },
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

      <PageShell bare>
        {/* ── Hero ────────────────────────────────────────────────────────── */}
        <PageHero
          layout="left"
          icon={<FiAward />}
          title="Mis Torneos"
          subtitle="Todos los torneos que creaste · editá, sumá equipos o eliminá los que ya no necesités."
        >
          <div className="mt-metrics">
            <div className="mt-metric-card">
              <FiAward />
              <div><span className="mt-metric-value">{counts["En curso"]}</span><span className="mt-metric-label">En curso</span></div>
            </div>
            <div className="mt-metric-card">
              <FiEdit2 />
              <div><span className="mt-metric-value">{counts["Borradores"]}</span><span className="mt-metric-label">Borradores</span></div>
            </div>
            <div className="mt-metric-card">
              <FiCheckCircle />
              <div><span className="mt-metric-value">{counts["Finalizados"]}</span><span className="mt-metric-label">Finalizados</span></div>
            </div>
            <div className="mt-metric-card">
              <FiUsers />
              <div>
                <span className="mt-metric-value">
                  {torneos.reduce((acc, t) => acc + t.equipos.actual, 0)}
                </span>
                <span className="mt-metric-label">Equipos en juego</span>
              </div>
            </div>
          </div>
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
            <TextField
              icon={<FiSearch />}
              placeholder="Buscar torneo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="mt-search"
            />
            <Button icon={<FiPlus />} onClick={() => navigate("/admin/torneos/nuevo")}>
              Nuevo torneo
            </Button>
          </div>

          {loading && <Card className="mt-status-card">Cargando torneos...</Card>}
          {error && <Card className="mt-status-card mt-status-error">{error}</Card>}

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
                          <Button
                            variant="secondary"
                            className="mt-btn-full"
                            icon={<FiUsers />}
                            onClick={() => navigate(`/admin/torneos/${torneo.id}/equipos`)}
                          >
                            Equipos
                          </Button>
                          <button className="mt-btn-trash" onClick={() => handleEliminar(torneo.id)}>
                            <FiTrash2 />
                          </button>
                        </>
                      )}
                      {torneo.estado === "Borrador" && (
                        <>
                          <Button
                            className="mt-btn-full"
                            icon={<FiUsers />}
                            onClick={() => navigate(`/admin/torneos/${torneo.id}/equipos`)}
                          >
                            Agregar equipos
                          </Button>
                          <button className="mt-btn-trash" onClick={() => handleEliminar(torneo.id)}>
                            <FiTrash2 />
                          </button>
                        </>
                      )}
                      {torneo.estado === "Finalizado" && (
                        <>
                          <Button
                            variant="secondary"
                            className="mt-btn-full"
                            icon={<FiAward />}
                            onClick={() => navigate(`/admin/torneos/${torneo.id}/equipos`)}
                          >
                            Ver resumen
                          </Button>
                          <button className="mt-btn-trash" onClick={() => handleEliminar(torneo.id)}>
                            <FiTrash2 />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}

              {/*
                .mt-card-new + el botón "Nuevo torneo" de arriba: revisado — no es
                una duplicación accidental, es el patrón habitual de "tile para
                agregar" al final de una grilla de cards, complementario al CTA
                del toolbar (se deja tal cual, ambos apuntan a la misma acción
                por caminos de descubrimiento distintos).
              */}
              <div className="mt-card-new" onClick={() => navigate("/admin/torneos/nuevo")}>
                <div className="mt-card-new-icon"><FiPlus /></div>
                <span className="mt-card-new-label">Crear nuevo torneo</span>
                <span className="mt-card-new-sub">Comenzá la próxima competencia</span>
              </div>
            </div>
          )}
        </section>
        </PageHero>
      </PageShell>

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
