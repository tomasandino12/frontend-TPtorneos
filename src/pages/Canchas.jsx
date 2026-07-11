import "../styles/IndexStyle.css";
import "../styles/MenuAdmin.css";
import "../styles/Canchas.css";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiMapPin,
  FiSearch,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiCheckCircle,
  FiDollarSign,
  FiTool,
} from "react-icons/fi";
import AdminHeader from "../components/AdminHeader.jsx";
import { adminApiFetch } from "../utils/api.js";
import { Button, TextField, Card, Alert, PageShell, PageHero } from "../components/ui";

const ESTADOS = [
  { value: "activa", label: "Activa" },
  { value: "mantenimiento", label: "En mantenimiento" },
  { value: "inactiva", label: "Inactiva" },
];

const ESTADO_CONFIG = {
  activa: { label: "Activa", bg: "var(--color-success-bg)", color: "var(--color-pitch)" },
  mantenimiento: { label: "En mantenimiento", bg: "var(--color-warning-bg)", color: "var(--color-warning-text)" },
  inactiva: { label: "Inactiva", bg: "var(--color-error-bg)", color: "var(--color-error-text)" },
};

const FORM_VACIO = {
  nombre: "",
  direccion: "",
  tipoSuperficie: "",
  capacidad: "",
  estado: "activa",
  precioPorHora: "",
  iluminacion: false,
};

function formatoPrecio(valor) {
  return `$${Math.round(valor || 0).toLocaleString("es-AR")}`;
}

// Ilustración genérica de cancha de fútbol (vista aérea) — no hay ningún
// asset de imagen en el proyecto para esto, así que es un SVG inline en vez
// de depender de un archivo/CDN externo.
function CanchaIlustracion() {
  return (
    <svg viewBox="0 0 300 170" className="cn-card-svg" role="img" aria-hidden="true">
      <rect x="0" y="0" width="300" height="170" fill="var(--color-turf)" />
      <rect x="10" y="10" width="280" height="150" fill="none" stroke="white" strokeWidth="3" />
      <line x1="150" y1="10" x2="150" y2="160" stroke="white" strokeWidth="3" />
      <circle cx="150" cy="85" r="28" fill="none" stroke="white" strokeWidth="3" />
      <circle cx="150" cy="85" r="3" fill="white" />
      <rect x="10" y="55" width="35" height="60" fill="none" stroke="white" strokeWidth="3" />
      <rect x="255" y="55" width="35" height="60" fill="none" stroke="white" strokeWidth="3" />
    </svg>
  );
}

export default function Canchas() {
  const navigate = useNavigate();
  const [admin, setAdmin] = useState(null);
  const [canchas, setCanchas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [canchaEditando, setCanchaEditando] = useState(null);
  const [form, setForm] = useState(FORM_VACIO);
  const [guardando, setGuardando] = useState(false);
  const [errorForm, setErrorForm] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("admin");
    if (!stored) {
      navigate("/admin");
      return;
    }
    try {
      setAdmin(JSON.parse(stored));
      fetchCanchas();
    } catch {
      navigate("/admin");
    }
  }, [navigate]);

  async function fetchCanchas() {
    try {
      setLoading(true);
      const res = await adminApiFetch("/canchas");
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error al cargar canchas");
      setCanchas(data.data || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("admin");
    localStorage.removeItem("adminToken");
    navigate("/admin");
  };

  const handleAbrirEditar = (cancha) => {
    setCanchaEditando(cancha);
    setForm({
      nombre: cancha.nombre || "",
      direccion: cancha.direccion || "",
      tipoSuperficie: cancha.tipoSuperficie || "",
      capacidad: cancha.capacidad ?? "",
      estado: cancha.estado || "activa",
      precioPorHora: cancha.precioPorHora ?? "",
      iluminacion: !!cancha.iluminacion,
    });
    setErrorForm("");
    setMostrarFormulario(true);
  };

  const handleCerrarFormulario = () => {
    setMostrarFormulario(false);
    setCanchaEditando(null);
  };

  const handleChangeForm = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleGuardar = async (e) => {
    e.preventDefault();
    setGuardando(true);
    setErrorForm("");

    try {
      const res = await adminApiFetch(`/canchas/${canchaEditando.id}`, {
        method: "PUT",
        body: JSON.stringify({
          ...form,
          capacidad: Number(form.capacidad),
          precioPorHora: Number(form.precioPorHora),
          iluminacion: !!form.iluminacion,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error al guardar la cancha");

      setCanchas((prev) => prev.map((c) => (c.id === canchaEditando.id ? data.data : c)));
      setMostrarFormulario(false);
      setCanchaEditando(null);
    } catch (err) {
      setErrorForm(err.message);
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminar = async (cancha) => {
    if (!confirm(`¿Seguro que querés eliminar la cancha "${cancha.nombre}"?`)) return;
    try {
      const res = await adminApiFetch(`/canchas/${cancha.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Error al eliminar");
      }
      setCanchas((prev) => prev.filter((c) => c.id !== cancha.id));
    } catch (e) {
      alert(e.message);
    }
  };

  if (!admin) return null;

  const filtradas = canchas.filter((c) => {
    const texto = `${c.nombre} ${c.direccion} ${c.tipoSuperficie}`.toLowerCase();
    return texto.includes(search.toLowerCase());
  });

  const activas = canchas.filter((c) => c.estado === "activa").length;
  const enMantenimiento = canchas.filter((c) => c.estado === "mantenimiento").length;
  const precioPromedio =
    canchas.length > 0 ? canchas.reduce((acc, c) => acc + (c.precioPorHora || 0), 0) / canchas.length : 0;

  return (
    <div className="layout">
      <AdminHeader admin={admin} onLogout={handleLogout} />

      <PageShell bare>
        <PageHero
          layout="left"
          icon={<FiMapPin />}
          title="Canchas"
          subtitle="Administrá las sedes, tipo de superficie y capacidad de cada cancha. Todas son de Fútbol 11."
        >
          <div className="cn-metrics">
            <div className="cn-metric-card">
              <FiMapPin />
              <div>
                <span className="cn-metric-value">{canchas.length}</span>
                <span className="cn-metric-label">Canchas registradas</span>
              </div>
            </div>
            <div className="cn-metric-card">
              <FiCheckCircle />
              <div>
                <span className="cn-metric-value">{activas}</span>
                <span className="cn-metric-label">Activas</span>
              </div>
            </div>
            <div className="cn-metric-card">
              <FiDollarSign />
              <div>
                <span className="cn-metric-value">{formatoPrecio(precioPromedio)}</span>
                <span className="cn-metric-label">Precio promedio / hora</span>
              </div>
            </div>
            <div className="cn-metric-card">
              <FiTool />
              <div>
                <span className="cn-metric-value">{enMantenimiento}</span>
                <span className="cn-metric-label">En mantenimiento</span>
              </div>
            </div>
          </div>
        </PageHero>

        <section className="cn-inventario">
          <div className="cn-inventario-header">
            <div>
              <h2>Inventario de canchas</h2>
              <p>Tocá una tarjeta para editar sus datos.</p>
            </div>
            <div className="cn-inventario-controls">
              <TextField
                icon={<FiSearch />}
                placeholder="Buscar cancha o sede..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="cn-search"
              />
              <Button icon={<FiPlus />} onClick={() => navigate("/admin/canchas/nueva")}>
                Nueva cancha
              </Button>
            </div>
          </div>

          {loading && <Card className="cn-status-card">Cargando canchas...</Card>}
          {error && <Card className="cn-status-card cn-status-error">{error}</Card>}

          {!loading && !error && (
            <>
              {filtradas.length === 0 && (
                <Alert variant="info">No hay canchas que coincidan con la búsqueda.</Alert>
              )}

              <div className="cn-grid">
                {filtradas.map((cancha) => {
                  const cfg = ESTADO_CONFIG[cancha.estado] ?? ESTADO_CONFIG.activa;
                  return (
                    <div key={cancha.id} className="cn-card" onClick={() => handleAbrirEditar(cancha)}>
                      <div className="cn-card-imagen">
                        <CanchaIlustracion />
                      </div>

                      <div className="cn-card-body">
                        <div className="cn-card-header">
                          <h3>{cancha.nombre}</h3>
                          <span className="cn-badge" style={{ background: cfg.bg, color: cfg.color }}>
                            {cfg.label}
                          </span>
                        </div>

                        <p className="cn-card-direccion">
                          <FiMapPin /> {cancha.direccion}
                        </p>

                        <span className="cn-badge-futbol">Fútbol 11</span>

                        <p className="cn-card-detalle">
                          {cancha.tipoSuperficie} · {cancha.capacidad} personas
                        </p>
                        <p className="cn-card-detalle">Iluminación: {cancha.iluminacion ? "Sí" : "No"}</p>

                        <p className="cn-card-precio">{formatoPrecio(cancha.precioPorHora)} / hora</p>

                        <div className="cn-card-acciones" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="secondary"
                            className="cn-btn-disponibilidad"
                            onClick={() => alert("Disponibilidad: próximamente")}
                          >
                            Disponibilidad
                          </Button>
                          <button className="cn-btn-icon" onClick={() => handleAbrirEditar(cancha)}>
                            <FiEdit2 />
                          </button>
                          <button
                            className="cn-btn-icon cn-btn-icon-danger"
                            onClick={() => handleEliminar(cancha)}
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}

                <div className="cn-card-new" onClick={() => navigate("/admin/canchas/nueva")}>
                  <div className="cn-card-new-icon">
                    <FiPlus />
                  </div>
                  <span className="cn-card-new-label">Agregar nueva cancha</span>
                </div>
              </div>
            </>
          )}
        </section>
      </PageShell>

      {mostrarFormulario && (
        <div className="cn-modal-overlay">
          <form className="cn-modal" onSubmit={handleGuardar}>
            <h3>Editar cancha</h3>

            {errorForm && <Alert variant="error">{errorForm}</Alert>}

            <TextField
              label="Nombre"
              name="nombre"
              value={form.nombre}
              onChange={handleChangeForm}
              required
            />
            <TextField
              label="Dirección"
              name="direccion"
              value={form.direccion}
              onChange={handleChangeForm}
              required
            />
            <TextField
              label="Tipo de superficie"
              name="tipoSuperficie"
              value={form.tipoSuperficie}
              onChange={handleChangeForm}
              required
            />
            <TextField
              label="Capacidad"
              type="number"
              name="capacidad"
              min={0}
              value={form.capacidad}
              onChange={handleChangeForm}
              required
            />

            <div className="ui-field">
              <label className="ui-field-label" htmlFor="cn-estado">Estado</label>
              <div className="ui-field-control">
                <select
                  id="cn-estado"
                  className="ui-field-input"
                  name="estado"
                  value={form.estado}
                  onChange={handleChangeForm}
                >
                  {ESTADOS.map((e) => (
                    <option key={e.value} value={e.value}>{e.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <TextField
              label="Precio por hora"
              type="number"
              name="precioPorHora"
              min={0}
              value={form.precioPorHora}
              onChange={handleChangeForm}
              required
            />

            <label className="cn-checkbox-label">
              <input
                type="checkbox"
                checked={form.iluminacion}
                onChange={(e) => setForm({ ...form, iluminacion: e.target.checked })}
              />
              Tiene iluminación
            </label>

            <div className="cn-modal-botones">
              <Button type="button" variant="secondary" onClick={handleCerrarFormulario} disabled={guardando}>
                Cancelar
              </Button>
              <Button type="submit" disabled={guardando}>
                {guardando ? "Guardando..." : "Guardar"}
              </Button>
            </div>
          </form>
        </div>
      )}

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
