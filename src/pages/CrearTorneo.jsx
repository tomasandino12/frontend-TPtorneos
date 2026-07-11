import "../styles/IndexStyle.css";
import "../styles/MenuAdmin.css";
import "../styles/CrearTorneo.css";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiAward, FiTag } from "react-icons/fi";
import AdminHeader from "../components/AdminHeader.jsx";
import { adminApiFetch } from "../utils/api.js";
import { Button, TextField, Card, Alert, PageShell, PageHero } from "../components/ui";

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
  });

  const upd = (key, val) => setForm((prev) => ({ ...prev, [key]: val }));

  const partidos = calcularPartidos(form.cantEquipos, form.formato);

  const handleLogout = () => {
    localStorage.removeItem("admin");
    localStorage.removeItem("adminToken");
    navigate("/admin");
  };

  // estado del torneo al crearlo: 'borrador' (queda sin publicar, se termina
  // después desde "Mis Torneos") o 'inscripcion' (ya acepta equipos — ver
  // src/torneo/torneo.entity.ts en el backend para el resto del ciclo de
  // vida — así que "Crear Torneo" pasa directo a inscribir equipos).
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

      <PageShell bare>
        {/* Hero */}
        <PageHero
          layout="left"
          icon={<FiAward />}
          title="Crear Torneo"
          subtitle="Configurá el nuevo certamen y armá el fixture en minutos."
        >
        <section className="ct-main">
          {/* ── Formulario ──────────────────────────────────────────────── */}
          <Card className="ct-form-card">
            <div className="ct-form-header">
              <div>
                <h2>Datos del Torneo</h2>
                <p>Información general que se mostrará a los clubes</p>
              </div>
              <span className="ct-borrador-badge">● Borrador</span>
            </div>

            <div className="ct-form-body">

              <TextField
                label="Nombre del Torneo"
                value={form.nombre}
                onChange={(e) => upd("nombre", e.target.value)}
                placeholder="Ej: Apertura 2025"
              />

              {/* Fechas */}
              <div className="ct-field-row ct-field-row-2">
                <TextField
                  label="Fecha de inicio"
                  type="date"
                  value={form.fechaInicio}
                  onChange={(e) => upd("fechaInicio", e.target.value)}
                />
                <TextField
                  label="Fecha de fin"
                  type="date"
                  value={form.fechaFin}
                  min={form.fechaInicio || undefined}
                  onChange={(e) => upd("fechaFin", e.target.value)}
                />
              </div>

              {/* Categoría / Equipos */}
              <div className="ct-field-row">
                <div className="ui-field">
                  <label className="ui-field-label" htmlFor="ct-categoria">Categoría</label>
                  <div className="ui-field-control">
                    <FiTag className="ui-field-icon" />
                    <select
                      id="ct-categoria"
                      className="ui-field-input"
                      value={form.categoria}
                      onChange={(e) => upd("categoria", e.target.value)}
                    >
                      {CATEGORIAS.map((c) => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <TextField
                    label="Cantidad de equipos"
                    type="number"
                    min={2}
                    max={30}
                    value={form.cantEquipos}
                    onChange={(e) => upd("cantEquipos", e.target.value)}
                    error={Number(form.cantEquipos) > 30 ? "El máximo permitido es 30 equipos." : ""}
                  />
                </div>
              </div>

              {/* Formato */}
              <div className="ct-field">
                <label>Formato de juego</label>
                <div className="ct-pill-group">
                  {FORMATOS.map((f) => (
                    <button
                      key={f}
                      type="button"
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
                <TextField
                  label="Puntos por victoria"
                  type="number" min={0} max={10} value={form.puntosVictoria}
                  onChange={(e) => upd("puntosVictoria", Number(e.target.value))}
                />
                <TextField
                  label="Puntos por empate"
                  type="number" min={0} max={10} value={form.puntosEmpate}
                  onChange={(e) => upd("puntosEmpate", Number(e.target.value))}
                />
                <TextField
                  label="Puntos por derrota"
                  type="number" min={0} max={10} value={form.puntosDerrota}
                  onChange={(e) => upd("puntosDerrota", Number(e.target.value))}
                />
              </div>

              {error && <Alert variant="error">{error}</Alert>}

              {/* Botones */}
              <div className="ct-actions">
                <Button
                  type="button"
                  variant="secondary"
                  disabled={loading}
                  onClick={() => submitTorneo("borrador")}
                >
                  {loading ? "Guardando..." : "Guardar borrador"}
                </Button>
                <Button
                  type="button"
                  disabled={loading}
                  onClick={() => submitTorneo("inscripcion")}
                  className="ct-btn-crear"
                >
                  {loading ? "Creando..." : "+ Crear Torneo"}
                </Button>
              </div>

            </div>
          </Card>

          {/* ── Resumen ─────────────────────────────────────────────────── */}
          <Card className="ct-summary-card">
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

            <Alert variant="warning" className="ct-warning">
              Vas a generar <strong>{partidos} partidos</strong> en formato{" "}
              <strong>{form.formato.toLowerCase()}</strong>. Después de crear el torneo
              podrás inscribir equipos y generar el fixture.
            </Alert>
          </Card>
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
