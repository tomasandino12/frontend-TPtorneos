import "../styles/IndexStyle.css";
import "../styles/MenuAdmin.css";
import "../styles/RegistroSanciones.css";
import { useEffect, useState } from "react";
import { FiAlertTriangle, FiSearch, FiTrash2 } from "react-icons/fi";
import { adminApiFetch } from "../utils/api.js";
import { Button, TextField, Card, PageShell, PageHero, Modal, Alert, ScrollableTable } from "../components/ui";
import { Jugador } from "../models";

const ESTADO_CONFIG = {
  Activa: { badgeBg: "var(--color-success-bg)", badgeColor: "var(--color-pitch)" },
  Levantada: { badgeBg: "var(--color-surface-muted)", badgeColor: "var(--color-ink)" },
};

const TABS = ["Activas", "Levantadas", "Todas"];

export default function RegistroSanciones() {
  const [suspensiones, setSuspensiones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("Activas");
  const [search, setSearch] = useState("");
  const [accionandoId, setAccionandoId] = useState(null);
  const [suspensionAEliminar, setSuspensionAEliminar] = useState(null);
  const [eliminando, setEliminando] = useState(false);
  const [errorEliminar, setErrorEliminar] = useState("");

  useEffect(() => {
    fetchSuspensiones();
  }, []);

  async function fetchSuspensiones() {
    try {
      setLoading(true);
      setError("");
      const res = await adminApiFetch("/suspensiones");
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error al cargar las sanciones");
      setSuspensiones(data.data || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const counts = {
    Activas: suspensiones.filter((s) => s.activa).length,
    Levantadas: suspensiones.filter((s) => !s.activa).length,
    Todas: suspensiones.length,
  };

  const busquedaNormalizada = search.trim().toLowerCase();
  const filtradas = suspensiones.filter((s) => {
    const matchTab =
      activeTab === "Todas" ||
      (activeTab === "Activas" && s.activa) ||
      (activeTab === "Levantadas" && !s.activa);
    // Jugador.nombreCompleto (src/models/Jugador.ts) en vez de concatenar
    // nombre/apellido a mano.
    const texto = (s.jugador ? new Jugador(s.jugador).nombreCompleto : "").toLowerCase();
    const matchSearch = !busquedaNormalizada || texto.includes(busquedaNormalizada);
    return matchTab && matchSearch;
  });

  async function handleLevantar(suspension) {
    setAccionandoId(suspension.id);
    setError("");
    try {
      const res = await adminApiFetch(`/jugadores/${suspension.jugador.id}/habilitar`, {
        method: "PATCH",
        body: JSON.stringify({ idSuspension: suspension.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error al levantar la suspensión");
      setSuspensiones((prev) => prev.map((s) => (s.id === suspension.id ? data.data : s)));
    } catch (e) {
      setError(e.message);
    } finally {
      setAccionandoId(null);
    }
  }

  function cerrarModalEliminar() {
    setSuspensionAEliminar(null);
    setErrorEliminar("");
  }

  async function confirmarEliminar() {
    if (!suspensionAEliminar) return;
    setEliminando(true);
    setErrorEliminar("");
    try {
      const res = await adminApiFetch(`/suspensiones/${suspensionAEliminar.id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "No se pudo eliminar la sanción. Intentá de nuevo.");
      setSuspensiones((prev) => prev.filter((s) => s.id !== suspensionAEliminar.id));
      setSuspensionAEliminar(null);
    } catch (e) {
      setErrorEliminar(e.message);
    } finally {
      setEliminando(false);
    }
  }

  return (
    <>
      <PageShell bare>
        <PageHero
          layout="left"
          icon={<FiAlertTriangle />}
          title="Registro de Sanciones"
          subtitle="Historial de suspensiones aplicadas en tus torneos."
        >
          <section className="rs-list">
            <div className="rs-tabs">
              {TABS.map((tab) => (
                <button
                  key={tab}
                  className={`rs-tab${activeTab === tab ? " active" : ""}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab}
                  <span className="rs-tab-count">{counts[tab]}</span>
                </button>
              ))}
            </div>

            <div className="rs-controls">
              <TextField
                icon={<FiSearch />}
                placeholder="Buscar por jugador..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="rs-search"
              />
            </div>

            {error && <Alert variant="error">{error}</Alert>}
            {loading && <Card className="rs-status-card">Cargando sanciones...</Card>}

            {!loading && (
              <ScrollableTable className="rs-table-wrap" ariaLabel="Tabla de sanciones">
                <table className="rs-table">
                  <thead>
                    <tr>
                      <th>Jugador</th>
                      <th>Torneo</th>
                      <th>Motivo</th>
                      <th>Fecha</th>
                      <th>Estado</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {filtradas.map((s) => {
                      const estado = s.activa ? "Activa" : "Levantada";
                      const cfg = ESTADO_CONFIG[estado];
                      return (
                        <tr key={s.id}>
                          <td>{s.jugador ? new Jugador(s.jugador).nombreCompleto : "—"}</td>
                          <td>{s.torneo?.nombreTorneo ?? "—"}</td>
                          <td>{s.motivo}</td>
                          <td>{new Date(s.fecha).toLocaleDateString("es-AR")}</td>
                          <td>
                            <span className="rs-badge" style={{ background: cfg.badgeBg, color: cfg.badgeColor }}>
                              {estado}
                            </span>
                          </td>
                          <td className="rs-table-acciones">
                            {s.activa && (
                              <Button
                                variant="secondary"
                                onClick={() => handleLevantar(s)}
                                disabled={accionandoId === s.id}
                              >
                                {accionandoId === s.id ? "Levantando..." : "Levantar"}
                              </Button>
                            )}
                            <Button
                              variant="danger"
                              icon={<FiTrash2 />}
                              onClick={() => setSuspensionAEliminar(s)}
                            >
                              Eliminar
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                    {filtradas.length === 0 && (
                      <tr>
                        <td colSpan={6} className="rs-table-vacio">
                          No hay sanciones que coincidan.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </ScrollableTable>
            )}
          </section>
        </PageHero>
      </PageShell>

      <Modal open={!!suspensionAEliminar} onClose={cerrarModalEliminar} title="Eliminar sanción">
        {suspensionAEliminar && (
          <div className="rs-modal-eliminar">
            <p>
              ¿Eliminar la sanción de &quot;
              {suspensionAEliminar.jugador ? new Jugador(suspensionAEliminar.jugador).nombreCompleto : ""}
              &quot; en el torneo &quot;
              {suspensionAEliminar.torneo?.nombreTorneo}&quot;? Esta acción no se puede deshacer.
            </p>
            {errorEliminar && <Alert variant="error">{errorEliminar}</Alert>}
            <div className="rs-modal-eliminar-actions">
              <Button variant="secondary" onClick={cerrarModalEliminar} disabled={eliminando}>
                Cancelar
              </Button>
              <Button variant="danger" onClick={confirmarEliminar} disabled={eliminando}>
                {eliminando ? "Eliminando..." : "Eliminar definitivamente"}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
