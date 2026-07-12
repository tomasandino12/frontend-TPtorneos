import { useEffect } from "react";
import { FiX } from "react-icons/fi";
import "./Modal.css";

/**
 * Overlay + card genéricos para diálogos modales — no reemplaza los modales
 * ya existentes en la app (transferir capitanía, formulario de árbitro), que
 * siguen con su propia implementación; es para los NUEVOS que necesiten este
 * mismo patrón (overlay oscuro, cierre por click afuera / Escape / botón X).
 *
 * open: controla si se renderiza (no hace su propio estado).
 * onClose: se llama al click afuera, Escape, o el botón de cerrar.
 * size: "md" (460px, default) | "lg" (600px, para contenido más denso como
 * una lista con buscador).
 */
export default function Modal({ open, onClose, title, children, size = "md", className = "" }) {
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose?.();
  };

  return (
    <div className="ui-modal-overlay" onClick={handleOverlayClick}>
      <div
        className={`ui-modal ui-modal-${size} ${className}`.trim()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <button type="button" className="ui-modal-cerrar" onClick={onClose} aria-label="Cerrar">
          <FiX />
        </button>
        {title && <h3 className="ui-modal-titulo">{title}</h3>}
        <div className="ui-modal-body">{children}</div>
      </div>
    </div>
  );
}
