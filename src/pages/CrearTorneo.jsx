import "../styles/IndexStyle.css";
import "../styles/MenuAdmin.css";
import "../styles/CrearTorneo.css";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaSignOutAlt } from "react-icons/fa";

// ── Config ─────────────────────────────────────────────────────────────────

const ADMIN_NAV = [
  { label: "Crear Torneo", icon: "bx-trophy"   },
  { label: "Arbitraje",    icon: "bx-whistle"  },
  { label: "Canchas",      icon: "bx-football" },
  { label: "Jugadores",    icon: "bx-group"    },
];

const CANCHAS_INIT = [
  { nombre: "Cancha Central",      activa: true  },
  { nombre: "Cancha 2 - Sintética", activa: true  },
  { nombre: "Cancha Auxiliar",     activa: true  },
  { nombre: "Cancha 4 - Techada",  activa: false },
  { nombre: "Cancha 5",            activa: false },
];

const FORMATOS = ["Solo ida", "Ida y vuelta", "Eliminación directa"];

function calcularPartidos(n, formato) {
  const eq = Math.max(0, parseInt(n) || 0);
  if (eq < 2) return 0;
  if (formato === "Solo ida")              return (eq * (eq - 1)) / 2;
  if (formato === "Ida y vuelta")          return eq * (eq - 1);
  if (formato === "Eliminación directa")   return eq - 1;
  return 0;
}

// ── Componente ─────────────────────────────────────────────────────────────

export default function CrearTorneo() {
  const navigate = useNavigate();
  const [admin, setAdmin] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem("admin");
    if (!stored) { navigate("/admin"); return; }
    try { setAdmin(JSON.parse(stored)); }
    catch { navigate("/admin"); }
  }, [navigate]);

  // ── Form state ────────────────────────────────────────────────────────────
  const [form, setForm] = useState({
    nombre:          "Apertura 2025",
    fechaInicio:     "2025-08-09",
    tipo:            "Liga (todos contra todos)",
    categoria:       "Mayores",
    cantEquipos:     12,
    formato:         "Ida y vuelta",
    puntosVictoria:  3,
    puntosEmpate:    1,
    puntosDerrota:   0,
    permitirDescarga: true,
    generarFixture:   true,
  });
  const [canchas, setCanchas] = useState(CANCHAS_INIT);

  const upd = (key, val) => setForm(prev => ({ ...prev, [key]: val }));
  const toggleCancha = i => setCanchas(prev => prev.map((c, j) => j === i ? { ...c, activa: !c.activa } : c));

  const canchasActivas = canchas.filter(c => c.activa);
  const partidos = calcularPartidos(form.cantEquipos, form.formato);

  const handleLogout = () => {
    localStorage.removeItem("admin");
    navigate("/admin");
  };

  if (!admin) return null;

  const initials = `${admin.nombre?.[0] ?? ""}${admin.apellido?.[0] ?? ""}`.toUpperCase();

  return (
    <div className="layout">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <nav className="navbar">
        <div className="navdiv">

          <div className="logo">
            <div className="logo-admin-wrap">
              <span className="logo-admin-text">Gestor de Torneos</span>
              <span className="admin-badge">ADMIN</span>
            </div>
          </div>

          <ul className="navlinks">
            {ADMIN_NAV.map(({ label, icon }) => (
              <li key={label}>
                <button
                  className={`admin-nav-btn${label === "Crear Torneo" ? " active" : ""}`}
                  onClick={() =>
                    label === "Crear Torneo"
                      ? navigate("/admin/torneos")
                      : navigate("/menu-admin")
                  }
                >
                  <i className={`bx ${icon}`}></i>
                  {label}
                </button>
              </li>
            ))}
          </ul>

          <div className="nav-actions">
            <div className="admin-user-info">
              <div className="admin-avatar">{initials}</div>
              <div className="admin-user-text">
                <span className="admin-user-name">{admin.nombre} {admin.apellido}</span>
                <span className="admin-user-role">Administrador</span>
              </div>
              <button className="btn-logout" onClick={handleLogout}>
                <FaSignOutAlt />
                Cerrar sesión
              </button>
            </div>
          </div>

        </div>
      </nav>

      {/* ── Main ──────────────────────────────────────────────────────────── */}
      <main style={{ backgroundColor: "#f9fafb" }}>

        {/* Hero */}
        <section className="ct-hero">
          <div className="ct-hero-title">
            <i className="bx bx-trophy ct-trophy-icon"></i>
            <h1>Crear Torneo</h1>
          </div>
          <p className="ct-hero-subtitle">
            Configurá el nuevo certamen y armá el fixture en minutos.
          </p>
          <div className="ct-metrics">
            <div className="ct-metric-card">
              <i className="bx bx-trophy"></i>
              <div><span className="ct-metric-value">3</span><span className="ct-metric-label">Torneos activos</span></div>
            </div>
            <div className="ct-metric-card">
              <i className="bx bx-group"></i>
              <div><span className="ct-metric-value">36</span><span className="ct-metric-label">Equipos inscriptos</span></div>
            </div>
            <div className="ct-metric-card">
              <i className="bx bx-football"></i>
              <div><span className="ct-metric-value">4</span><span className="ct-metric-label">Canchas disponibles</span></div>
            </div>
            <div className="ct-metric-card">
              <i className="bx bx-calendar"></i>
              <div><span className="ct-metric-value">14</span><span className="ct-metric-label">Partidos esta semana</span></div>
            </div>
          </div>
        </section>

        {/* Form + Summary */}
        <section className="ct-main">

          {/* ── Formulario ──────────────────────────────────────────────── */}
          <div className="ct-form-card">
            <div className="ct-form-header">
              <div>
                <h2>Datos del Torneo</h2>
                <p>Información general que se mostrará a los clubes</p>
              </div>
              <span className="ct-borrador-badge">● Borrador</span>
            </div>

            <div className="ct-form-body">

              {/* Nombre */}
              <div className="ct-field">
                <label>Nombre del Torneo</label>
                <input
                  type="text"
                  value={form.nombre}
                  onChange={e => upd("nombre", e.target.value)}
                  placeholder="Ej: Apertura 2025"
                />
              </div>

              {/* Fecha */}
              <div className="ct-field">
                <label>Fecha de inicio</label>
                <input
                  type="date"
                  value={form.fechaInicio}
                  onChange={e => upd("fechaInicio", e.target.value)}
                />
              </div>

              {/* Tipo / Categoría / Equipos */}
              <div className="ct-field-row">
                <div className="ct-field">
                  <label>Tipo de torneo</label>
                  <select value={form.tipo} onChange={e => upd("tipo", e.target.value)}>
                    <option>Liga (todos contra todos)</option>
                    <option>Eliminación directa</option>
                  </select>
                </div>
                <div className="ct-field">
                  <label>Categoría</label>
                  <select value={form.categoria} onChange={e => upd("categoria", e.target.value)}>
                    <option>Mayores</option>
                    <option>Sub-17</option>
                    <option>Femenino</option>
                  </select>
                </div>
                <div className="ct-field">
                  <label>Cantidad de equipos</label>
                  <input
                    type="number"
                    min={2}
                    max={64}
                    value={form.cantEquipos}
                    onChange={e => upd("cantEquipos", e.target.value)}
                  />
                </div>
              </div>

              {/* Formato */}
              <div className="ct-field">
                <label>Formato de juego</label>
                <div className="ct-pill-group">
                  {FORMATOS.map(f => (
                    <button
                      key={f}
                      className={`ct-pill${form.formato === f ? " active" : ""}`}
                      onClick={() => upd("formato", f)}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              {/* Canchas */}
              <div className="ct-field">
                <label>
                  Canchas habilitadas{" "}
                  <small>tocá para activar/desactivar</small>
                </label>
                <div className="ct-canchas">
                  {canchas.map((c, i) => (
                    <button
                      key={i}
                      className={`ct-cancha-chip${c.activa ? " active" : ""}`}
                      onClick={() => toggleCancha(i)}
                    >
                      {c.activa ? "✓ " : ""}{c.nombre}
                    </button>
                  ))}
                </div>
              </div>

              {/* Puntos */}
              <div className="ct-field-row">
                <div className="ct-field">
                  <label>Puntos por victoria</label>
                  <input
                    type="number" min={0} max={10}
                    value={form.puntosVictoria}
                    onChange={e => upd("puntosVictoria", Number(e.target.value))}
                  />
                </div>
                <div className="ct-field">
                  <label>Puntos por empate</label>
                  <input
                    type="number" min={0} max={10}
                    value={form.puntosEmpate}
                    onChange={e => upd("puntosEmpate", Number(e.target.value))}
                  />
                </div>
                <div className="ct-field">
                  <label>Puntos por derrota</label>
                  <input
                    type="number" min={0} max={10}
                    value={form.puntosDerrota}
                    onChange={e => upd("puntosDerrota", Number(e.target.value))}
                  />
                </div>
              </div>

              {/* Toggles */}
              <div className="ct-toggles">
                {[
                  {
                    key: "permitirDescarga",
                    label: "Permitir descargar planteles",
                    desc: "Los usuarios pueden exportar listas de jugadores",
                  },
                  {
                    key: "generarFixture",
                    label: "Generar fixture automático",
                    desc: "Se creará el calendario de partidos al confirmar",
                  },
                ].map(({ key, label, desc }) => (
                  <div
                    key={key}
                    className={`ct-toggle-row${form[key] ? " active" : ""}`}
                    onClick={() => upd(key, !form[key])}
                  >
                    <div className="ct-toggle-info">
                      <span>{label}</span>
                      <small>{desc}</small>
                    </div>
                    <div className={`ct-toggle-switch${form[key] ? " on" : ""}`} />
                  </div>
                ))}
              </div>

              {/* Botones */}
              <div className="ct-actions">
                <button className="ct-btn-outline">Guardar borrador</button>
                <button className="ct-btn-outline-green">Vista previa</button>
                <button className="ct-btn-primary">+ Crear Torneo</button>
              </div>

            </div>
          </div>

          {/* ── Resumen ─────────────────────────────────────────────────── */}
          <div className="ct-summary-card">
            <h3 className="ct-summary-title">Resumen</h3>

            <div className="ct-summary-rows">
              {[
                { label: "Nombre",            value: form.nombre || "—" },
                { label: "Tipo",              value: form.tipo.replace(" (todos contra todos)", "") },
                { label: "Categoría",         value: form.categoria.toLowerCase() },
                { label: "Equipos",           value: form.cantEquipos },
                { label: "Formato",           value: form.formato },
                { label: "Canchas",           value: `${canchasActivas.length} habilitadas` },
                { label: "Inicio",            value: form.fechaInicio || "—" },
                { label: "Partidos estimados", value: partidos },
                { label: "Puntos (V/E/D)",    value: `${form.puntosVictoria} / ${form.puntosEmpate} / ${form.puntosDerrota}` },
              ].map(({ label, value }) => (
                <div key={label} className="ct-summary-row">
                  <span className="ct-summary-label">{label}</span>
                  <span className="ct-summary-value">{String(value)}</span>
                </div>
              ))}
            </div>

            <div className="ct-warning">
              <i className="bx bx-error-circle ct-warning-icon"></i>
              <p>
                Vas a generar <strong>{partidos} partidos</strong> distribuidos en{" "}
                <strong>{canchasActivas.length} cancha(s)</strong>. Revisá la
                disponibilidad antes de confirmar.
              </p>
            </div>
          </div>

        </section>
      </main>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
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
