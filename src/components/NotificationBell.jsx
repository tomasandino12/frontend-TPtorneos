import { useEffect, useRef, useState } from "react";
import { FiBell, FiUserX, FiAlertTriangle, FiUserCheck, FiGrid } from "react-icons/fi";
import { apiFetch } from "../utils/api.js";
import { Alert } from "./ui";
import "../styles/NotificationBell.css";

// Ícono según el tipo de notificación (los 4 tipos reales que hoy emite el
// backend — ver Notificacion.tipo) — con un fallback (FiBell) para
// cualquier tipo que no esté en este mapeo, así el componente no se rompe
// si el backend agrega un tipo nuevo que todavía no contemplamos acá.
const TIPO_ICONOS = {
  expulsion: FiUserX,
  suspension: FiAlertTriangle,
  habilitacion: FiUserCheck,
  formacion_actualizada: FiGrid,
};

function tiempoRelativo(fechaIso) {
  const diffMs = Date.now() - new Date(fechaIso).getTime();
  const minutos = Math.floor(diffMs / 60000);
  if (minutos < 1) return "recién";
  if (minutos < 60) return `hace ${minutos} minuto${minutos === 1 ? "" : "s"}`;
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `hace ${horas} hora${horas === 1 ? "" : "s"}`;
  const dias = Math.floor(horas / 24);
  if (dias < 30) return `hace ${dias} día${dias === 1 ? "" : "s"}`;
  const meses = Math.floor(dias / 30);
  return `hace ${meses} mes${meses === 1 ? "" : "es"}`;
}

// GET /notificaciones — todas las notificaciones del jugador autenticado,
// cualquier tipo, leídas y no leídas.
async function fetchNotificaciones() {
  const response = await apiFetch("/notificaciones");
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Error al cargar las notificaciones");
  return data.data;
}

/**
 * Campanita de notificaciones del Navbar — genérica, no atada a un solo tipo
 * de notificación (expulsión, suspensión/habilitación, formación
 * actualizada, o cualquier tipo nuevo que se agregue después).
 */
export default function NotificationBell() {
  const [notificaciones, setNotificaciones] = useState([]);
  const [error, setError] = useState(null);
  const [abierto, setAbierto] = useState(false);
  const contenedorRef = useRef(null);

  useEffect(() => {
    fetchNotificaciones()
      .then((data) => {
        setNotificaciones([...data].sort((a, b) => new Date(b.fecha) - new Date(a.fecha)));
        setError(null);
      })
      .catch((err) => setError(err.message));
  }, []);

  // Cerrar al clickear afuera o con Escape — patrón estándar de dropdown,
  // necesario porque este panel no usa el overlay de ui/Modal (no es un
  // diálogo modal, es un desplegable anclado a la campanita).
  useEffect(() => {
    if (!abierto) return;
    const handleClickAfuera = (e) => {
      if (contenedorRef.current && !contenedorRef.current.contains(e.target)) setAbierto(false);
    };
    const handleEscape = (e) => {
      if (e.key === "Escape") setAbierto(false);
    };
    document.addEventListener("mousedown", handleClickAfuera);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickAfuera);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [abierto]);

  const noLeidas = notificaciones.filter((n) => !n.leida).length;
  const badgeTexto = noLeidas > 9 ? "9+" : String(noLeidas);

  const handleMarcarLeida = async (id) => {
    const notificacion = notificaciones.find((n) => n.id === id);
    if (!notificacion || notificacion.leida) return;

    try {
      const response = await apiFetch(`/notificaciones/${id}/leida`, { method: "PATCH" });
      if (!response.ok) throw new Error("Error al marcar como leída");
      setNotificaciones((prev) => prev.map((n) => (n.id === id ? { ...n, leida: true } : n)));
    } catch (err) {
      console.error("Error marcando notificación como leída:", err);
    }
  };

  return (
    <div className="notif-bell" ref={contenedorRef}>
      <button
        type="button"
        className="notif-bell-btn"
        onClick={() => setAbierto((prev) => !prev)}
        aria-label={`Notificaciones${noLeidas > 0 ? ` (${noLeidas} sin leer)` : ""}`}
        aria-expanded={abierto}
      >
        <FiBell />
        {noLeidas > 0 && <span className="notif-bell-badge">{badgeTexto}</span>}
      </button>

      {abierto && (
        <div className="notif-panel" role="menu">
          <div className="notif-panel-header">Notificaciones</div>
          {error ? (
            <div className="notif-panel-error">
              <Alert variant="error">No se pudieron cargar las notificaciones.</Alert>
            </div>
          ) : notificaciones.length === 0 ? (
            <p className="notif-panel-vacio">No tenés notificaciones.</p>
          ) : (
            <ul className="notif-panel-lista">
              {notificaciones.map((n) => {
                const Icono = TIPO_ICONOS[n.tipo] ?? FiBell;
                return (
                  <li key={n.id}>
                    <button
                      type="button"
                      className={`notif-item${n.leida ? "" : " notif-item-no-leida"}`}
                      onClick={() => handleMarcarLeida(n.id)}
                    >
                      <span className="notif-item-icono">
                        <Icono />
                      </span>
                      <span className="notif-item-texto">
                        <span className="notif-item-mensaje">{n.mensaje}</span>
                        <span className="notif-item-tiempo">{tiempoRelativo(n.fecha)}</span>
                      </span>
                      {!n.leida && <span className="notif-item-punto" aria-hidden="true" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
