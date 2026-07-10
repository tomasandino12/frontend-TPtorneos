import "../styles/IndexStyle.css";
import "../styles/MenuAdmin.css";
import "../styles/CrearTorneo.css";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminHeader from "../components/AdminHeader.jsx";
import { adminApiFetch } from "../utils/api.js";

const FORMATOS = ["Solo ida", "Ida y vuelta"];

const CATEGORIAS = [
  { value: "sub15",     label: "Sub-15" },
  { value: "sub17",     label: "Sub-17" },
  { value: "mayores",   label: "Mayores (+18)" },
  { value: "veteranos", label: "Veteranos" },
  { value: "femenino",  label: "Femenino" },
];

function calcularPartidos(n, formato) {
  const eq = Math.max(0, parseInt(n) || 0);
  if (eq < 2) return 0;
  if (formato === "Solo ida")     return (eq * (eq - 1)) / 2;
  if (formato === "Ida y vuelta") return eq * (eq - 1);
  return 0;
}

export default function CrearTorneo() {
  const navigate = useNavigate();
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("admin");
    if (!stored) { navigate("/admin"); return; }
    try { setAdmin(JSON.parse(stored)); }
    catch { navigate("/admin"); }
  }, [navigate]);

  const [form, setForm] = useState({
    nombre:         "",
    fechaInicio:    "",
    fechaFin:       "",
    categoria:      "sub15",
    cantEquipos:    8,
    formato:        "Solo ida",
    puntosVictoria: 3,
    puntosEmpate:   1,
    puntosDerrota:  0,
    generarFixture: false,
  });

  const upd = (key, val) => setForm((prev) => ({ ...prev, [key]: val }));

  const partidos = calcularPartidos(form.cantEquipos, form.formato);

  const handleLogout = () => {
    localStorage.removeItem("admin");
    localStorage.removeItem("adminToken");
    navigate("/admin");
  };

  async function submitTorneo(estado) {
    setError("");

    if (!form.nombre.trim()) { setError("El nombre del torneo es obligatorio."); return; }
    if (!form.fechaInicio)   { setError("La fecha de inicio es obligatoria."); return; }
    if (!form.fechaFin)      { setError("La fecha de fin es obligatoria."); return; }
    if (Number(form.cantEquipos) < 2) { setError("Se necesitan al menos 2 equipos."); return; }

    setLoading(true);
    try {
      const body = {
        nombreTorneo:    form.nombre.trim(),
        fechaInicio:     form.fechaInicio,
        fechaFin:        form.fechaFin,
        estado,
        categoria:       form.categoria,
        cantidadEquipos: Number(form.cantEquipos),
        formato:         form.formato === "Ida y vuelta" ? "idayvuelta" : "ida",
        adminTorneo:     admin.id,
      };

      const res = await adminApiFetch("/torneo", {
        method: "POST",
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error al crear el torneo");

      const torneoId = data.data?.id;

      if (estado === "borrador") {
        navigate("/admin/torneos");
      } else {
        // Ir a inscribir equipos
        navigate(`/admin/torneos/${torneoId}/equipos`);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  if (!admin) return null;

  return (
    <div className="layout">
      <AdminHeader admin={admin} onLogout={handleLogout} />

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
        </section>

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
                  onChange={(e) => upd("nombre", e.target.value)}
                  placeholder="Ej: Apertura 2025"
                />
              </div>

              {/* Fechas */}
              <div className="ct-field-row ct-field-row-2">
                <div className="ct-field">
                  <label>Fecha de inicio</label>
                  <input
                    type="date"
                    value={form.fechaInicio}
                    onChange={(e) => upd("fechaInicio", e.target.value)}
                  />
                </div>
                <div className="ct-field">
                  <label>Fecha de fin</label>
                  <input
                    type="date"
                    value={form.fechaFin}
                    min={form.fechaInicio || undefined}
                    onChange={(e) => upd("fechaFin", e.target.value)}
                  />
                </div>
              </div>

              {/* Categoría / Equipos */}
              <div className="ct-field-row">
                <div className="ct-field">
                  <label>Categoría</label>
                  <select value={form.categoria} onChange={(e) => upd("categoria", e.target.value)}>
                    {CATEGORIAS.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div className="ct-field">
                  <label>Cantidad de equipos</label>
                  <input
                    type="number"
                    min={2}
                    max={30}
                    value={form.cantEquipos}
                    onChange={(e) => upd("cantEquipos", e.target.value)}
                    className={Number(form.cantEquipos) > 30 ? "ct-input-error" : ""}
                  />
                  {Number(form.cantEquipos) > 30 && (
                    <div className="ct-field-warning">
                      <i className="bx bx-error-circle"></i> El máximo permitido es 30 equipos.
                    </div>
                  )}
                </div>
              </div>

              {/* Formato */}
              <div className="ct-field">
                <label>Formato de juego</label>
                <div className="ct-pill-group">
                  {FORMATOS.map((f) => (
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

              {/* Puntos */}
              <div className="ct-field-row">
                <div className="ct-field">
                  <label>Puntos por victoria</label>
                  <input type="number" min={0} max={10} value={form.puntosVictoria}
                    onChange={(e) => upd("puntosVictoria", Number(e.target.value))} />
                </div>
                <div className="ct-field">
                  <label>Puntos por empate</label>
                  <input type="number" min={0} max={10} value={form.puntosEmpate}
                    onChange={(e) => upd("puntosEmpate", Number(e.target.value))} />
                </div>
                <div className="ct-field">
                  <label>Puntos por derrota</label>
                  <input type="number" min={0} max={10} value={form.puntosDerrota}
                    onChange={(e) => upd("puntosDerrota", Number(e.target.value))} />
                </div>
              </div>

              {error && (
                <div style={{ color: "#dc2626", background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: "8px", padding: "0.75rem 1rem", fontSize: "0.9rem" }}>
                  {error}
                </div>
              )}

              {/* Botones */}
              <div className="ct-actions">
                <button
                  className="ct-btn-outline"
                  disabled={loading}
                  onClick={() => submitTorneo("borrador")}
                >
                  {loading ? "Guardando..." : "Guardar borrador"}
                </button>
                <button
                  className="ct-btn-primary"
                  disabled={loading}
                  onClick={() => submitTorneo("borrador")}
                >
                  {loading ? "Creando..." : "+ Crear Torneo"}
                </button>
              </div>

            </div>
          </div>

          {/* ── Resumen ─────────────────────────────────────────────────── */}
          <div className="ct-summary-card">
            <h3 className="ct-summary-title">Resumen</h3>
            <div className="ct-summary-rows">
              {[
                { label: "Nombre",            value: form.nombre || "—" },
                { label: "Categoría",         value: CATEGORIAS.find(c => c.value === form.categoria)?.label ?? form.categoria },
                { label: "Equipos",           value: form.cantEquipos },
                { label: "Formato",           value: form.formato },
                { label: "Inicio",            value: form.fechaInicio || "—" },
                { label: "Fin",               value: form.fechaFin || "—" },
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
                Vas a generar <strong>{partidos} partidos</strong> en formato{" "}
                <strong>{form.formato.toLowerCase()}</strong>. Después de crear el torneo
                podrás inscribir equipos y generar el fixture.
              </p>
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
