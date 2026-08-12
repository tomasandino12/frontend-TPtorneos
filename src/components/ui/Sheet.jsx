import { useEffect } from "react";
import "./Sheet.css";

/**
 * Overlay + panel deslizable genérico — mismo patrón de apertura/cierre que
 * Modal.jsx (click afuera / Escape), pero para paneles anclados a un borde
 * de la pantalla en vez de centrados (hoja de cuenta, drawer admin, panel de
 * notificaciones en mobile).
 *
 * open/onClose: igual que Modal. No maneja devolución de foco: cada llamador
 * conoce su propio disparador (avatar, hamburguesa, campana) y se lo devuelve
 * en su propio onClose.
 * position: "bottom" (hoja inferior) | "right" (drawer lateral).
 */
export default function Sheet({ open, onClose, position = "bottom", ariaLabel, children, className = "" }) {
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
    <div className="ui-sheet-overlay" onClick={handleOverlayClick}>
      <div
        className={`ui-sheet ui-sheet-${position} ${className}`.trim()}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
      >
        {children}
      </div>
    </div>
  );
}
