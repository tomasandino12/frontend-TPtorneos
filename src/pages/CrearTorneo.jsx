import "../styles/IndexStyle.css";
import "../styles/MenuAdmin.css";
import "../styles/CrearTorneo.css";
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FiAward, FiTag } from "react-icons/fi";
import AdminHeader from "../components/AdminHeader.jsx";
import { adminApiFetch } from "../utils/api.js";
import { Button, TextField, Card, Alert, PageShell, PageHero, Modal } from "../components/ui";

const FORMATOS = ["Solo ida", "Ida y vuelta"];

// Exportado: es la misma lista de categorías del dominio (equipos y torneos
// comparten el mismo enum) que reutiliza Equipos.jsx para el <select> de
// categoría al crear un equipo — evita una tercera copia de estos 5 valores.
export const CATEGORIAS = [
  { value: "sub15",     label: "Sub-15" },
  { value: "sub17",     label: "Sub-17" },
  { value: "mayores",   label: "Mayores (+18)" },
  { value: "veteranos", label: "Veteranos" },
  { value: "femenino",  label: "Femenino" },
];

const ESTADO_LABEL = {
  borrador: "Borrador",
  inscripcion: "Inscripción",
  en_curso: "En curso",
  finalizado: "Finalizado",
};

function calcularPartidos(n, formato) {
  const eq = Math.max(0, parseInt(n) || 0);
  if (eq < 2) return 0;
  if (formato === "Solo ida")     return (eq * (eq - 1)) / 2;
  if (formato === "Ida y vuelta") return eq * (eq - 1);
  return 0;
}

const FORM_VACIO = {
  nombre:         "",
  fechaInicio:    "",
  fechaFin:       "",
  categoria:      "sub15",
  cantEquipos:    8,
  formato:        "Solo ida",
  puntosVictoria: 3,
  puntosEmpate:   1,
  puntosDerrota:  0,
};

export default function CrearTorneo() {
  const navigate = useNavigate();
  const { id } = useParams();
  const modoEdicion = Boolean(id);

  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Solo en modo edición: el torneo tal cual vino del backend (para saber su
  // estado real y detectar qué campos cambiaron), y el loading de esa carga.
  const [torneoOriginal, setTorneoOriginal] = useState(null);
  const [loadingInicial, setLoadingInicial] = useState(modoEdicion);

  // Modal de confirmación cuando extender fecha fin (torneo en_curso) deja
  // equipos en conflicto con otros torneos — null = modal cerrado.
  const [conflictosFechaFin, setConflictosFechaFin] = useState(null);
  const [fechaFinPendiente, setFechaFinPendiente] = useState(null);
  const [aplicandoFechaFin, setAplicandoFechaFin] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("admin");
    if (!stored) { navigate("/admin"); return; }
    try { setAdmin(JSON.parse(stored)); }
    catch { navigate("/admin"); }
  }, [navigate]);

  const [form, setForm] = useState(FORM_VACIO);

  // En modo edición, carga el torneo existente y precarga el formulario.
  useEffect(() => {
    if (!admin || !modoEdicion) return;
    (async () => {
      setLoadingInicial(true);
      setError("");
      try {
        const res = await adminApiFetch(`/torneo/${id}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Error al cargar el torneo");
        const t = data.data;
        setTorneoOriginal(t);
        setForm({
          nombre:         t.nombreTorneo ?? "",
          fechaInicio:    t.fechaInicio ? t.fechaInicio.slice(0, 10) : "",
          fechaFin:       t.fechaFin ? t.fechaFin.slice(0, 10) : "",
          categoria:      t.categoria ?? "sub15",
          cantEquipos:    t.cantidadEquipos ?? 8,
          formato:        t.formato === "idayvuelta" ? "Ida y vuelta" : "Solo ida",
          puntosVictoria: 3,
          puntosEmpate:   1,
          puntosDerrota:  0,
        });
      } catch (e) {
        setError(e.message);
      } finally {
        setLoadingInicial(false);
      }
    })();
  }, [admin, modoEdicion, id]);

  const upd = (key, val) => setForm((prev) => ({ ...prev, [key]: val }));

  const partidos = calcularPartidos(form.cantEquipos, form.formato);
  const estadoEnCurso = modoEdicion && torneoOriginal?.estado === "en_curso";

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

  // Guardar cambios — torneo NO en_curso: todos los campos son editables por
  // el PATCH genérico, igual que antes se creaba (sin tocar `estado`).
  async function guardarCambiosNormal() {
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
        categoria:       form.categoria,
        cantidadEquipos: Number(form.cantEquipos),
        formato:         form.formato === "Ida y vuelta" ? "idayvuelta" : "ida",
      };
      const res = await adminApiFetch(`/torneo/${id}`, { method: "PATCH", body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error al guardar los cambios");
      navigate("/admin/torneos");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function aplicarFechaFin(fechaFin, confirmarCascada) {
    const res = await adminApiFetch(`/torneo/${id}/fecha-fin`, {
      method: "PATCH",
      body: JSON.stringify({ fechaFin, confirmarCascada }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "No se pudo extender la fecha fin.");
    return data;
  }

  // Guardar cambios — torneo en_curso: solo nombre y fechaFin son editables.
  // El nombre se aplica directo (no tiene efectos secundarios); fechaFin pasa
  // primero por el preview de conflictos antes de aplicarse.
  async function guardarCambiosEnCurso() {
    setError("");
    setLoading(true);
    try {
      if (form.nombre.trim() !== torneoOriginal.nombreTorneo) {
        const res = await adminApiFetch(`/torneo/${id}`, {
          method: "PATCH",
          body: JSON.stringify({ nombreTorneo: form.nombre.trim() }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "No se pudo actualizar el nombre.");
      }

      const fechaFinOriginal = (torneoOriginal.fechaFin || "").slice(0, 10);
      if (form.fechaFin === fechaFinOriginal) {
        navigate("/admin/torneos");
        return;
      }

      const resPreview = await adminApiFetch(`/torneo/${id}/fecha-fin/preview`, {
        method: "POST",
        body: JSON.stringify({ fechaFin: form.fechaFin }),
      });
      const dataPreview = await resPreview.json();
      if (!resPreview.ok) throw new Error(dataPreview.message || "No se pudo validar la nueva fecha fin.");

      const conflictos = dataPreview.data?.conflictos ?? [];
      if (conflictos.length === 0) {
        await aplicarFechaFin(form.fechaFin, false);
        navigate("/admin/torneos");
        return;
      }

      // Hay conflictos: no se aplica nada todavía, se le pide confirmación al admin.
      setFechaFinPendiente(form.fechaFin);
      setConflictosFechaFin(conflictos);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function confirmarCascadaFechaFin() {
    setAplicandoFechaFin(true);
    try {
      await aplicarFechaFin(fechaFinPendiente, true);
      setConflictosFechaFin(null);
      setFechaFinPendiente(null);
      navigate("/admin/torneos");
    } catch (e) {
      setConflictosFechaFin(null);
      setError(e.message);
    } finally {
      setAplicandoFechaFin(false);
    }
  }

  function cancelarCascadaFechaFin() {
    setConflictosFechaFin(null);
    setFechaFinPendiente(null);
  }

  function guardarCambios() {
    return estadoEnCurso ? guardarCambiosEnCurso() : guardarCambiosNormal();
  }

  if (!admin) return null;

  if (modoEdicion && loadingInicial) {
    return (
      <div className="layout">
        <AdminHeader admin={admin} onLogout={handleLogout} />
        <PageShell bare>
          <Card className="ct-form-card">Cargando torneo...</Card>
        </PageShell>
      </div>
    );
  }

  return (
    <div className="layout">
      <AdminHeader admin={admin} onLogout={handleLogout} />

      <PageShell bare>
        {/* Hero */}
        <PageHero
          layout="left"
          icon={<FiAward />}
          title={modoEdicion ? "Editar Torneo" : "Crear Torneo"}
          subtitle={modoEdicion
            ? "Actualizá los datos del torneo. Con el torneo en curso, solo se puede editar el nombre y la fecha de fin."
            : "Configurá el nuevo certamen y armá el fixture en minutos."}
        >
        <section className="ct-main">
          {/* ── Formulario ──────────────────────────────────────────────── */}
          <Card className="ct-form-card">
            <div className="ct-form-header">
              <div>
                <h2>Datos del Torneo</h2>
                <p>Información general que se mostrará a los clubes</p>
              </div>
              <span className="ct-borrador-badge">
                ● {modoEdicion ? (ESTADO_LABEL[torneoOriginal?.estado] ?? torneoOriginal?.estado) : "Borrador"}
              </span>
            </div>

            <div className="ct-form-body">

              {estadoEnCurso && (
                <Alert variant="info">
                  Este torneo está en curso: solo se pueden editar el nombre y la fecha de fin.
                </Alert>
              )}

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
                  disabled={estadoEnCurso}
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
                      disabled={estadoEnCurso}
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
                    disabled={estadoEnCurso}
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
                      onClick={() => !estadoEnCurso && upd("formato", f)}
                      disabled={estadoEnCurso}
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
                {modoEdicion ? (
                  <>
                    <Button type="button" variant="secondary" disabled={loading} onClick={() => navigate("/admin/torneos")}>
                      Cancelar
                    </Button>
                    <Button type="button" disabled={loading} onClick={guardarCambios} className="ct-btn-crear">
                      {loading ? "Guardando..." : "Guardar cambios"}
                    </Button>
                  </>
                ) : (
                  <>
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
                  </>
                )}
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

            {!modoEdicion && (
              <Alert variant="warning" className="ct-warning">
                Vas a generar <strong>{partidos} partidos</strong> en formato{" "}
                <strong>{form.formato.toLowerCase()}</strong>. Después de crear el torneo
                podrás inscribir equipos y generar el fixture.
              </Alert>
            )}
          </Card>
        </section>
        </PageHero>
      </PageShell>

      <Modal open={conflictosFechaFin !== null} onClose={cancelarCascadaFechaFin} title="Confirmar extensión de fecha fin">
        {conflictosFechaFin && (
          <div className="ct-modal-cascada">
            <p>
              Extender la fecha fin hará que {conflictosFechaFin.length} equipo(s) sean removidos
              automáticamente de otros torneos por superposición de fechas:
            </p>
            <ul className="ct-modal-cascada-lista">
              {conflictosFechaFin.map((c) => (
                <li key={c.participacionId}>
                  {c.equipoNombre} (de &quot;{c.torneoConflictoNombre}&quot;)
                </li>
              ))}
            </ul>
            <p className="ct-modal-cascada-warning">Esta acción no se puede deshacer.</p>
            <div className="ct-modal-cascada-actions">
              <Button variant="secondary" onClick={cancelarCascadaFechaFin} disabled={aplicandoFechaFin}>
                Cancelar
              </Button>
              <Button variant="danger" onClick={confirmarCascadaFechaFin} disabled={aplicandoFechaFin}>
                {aplicandoFechaFin ? "Aplicando..." : "Confirmar y extender"}
              </Button>
            </div>
          </div>
        )}
      </Modal>

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
