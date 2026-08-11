import { useEffect } from "react";
import { FiCheckCircle, FiXCircle, FiAlertTriangle, FiInfo, FiX } from "react-icons/fi";
import "./Toast.css";

/**
 * Notificación de confirmación flotante — esquina inferior derecha, se
 * autooculta sola y también se puede cerrar a mano. Genérico y reutilizable:
 * no asume de qué pantalla viene ni qué texto muestra.
 *
 * variant: "success" | "error" | "warning" | "info" (mismo criterio que Alert).
 * El padre es dueño del estado (`message`, típicamente `useState(null)`) —
 * este componente no se guarda nada, solo dispara `onClose` cuando corresponde.
 */
const CONFIG = {
  success: { icon: FiCheckCircle, className: "ui-toast-success" },
  error: { icon: FiXCircle, className: "ui-toast-error" },
  warning: { icon: FiAlertTriangle, className: "ui-toast-warning" },
  info: { icon: FiInfo, className: "ui-toast-info" },
};

export default function Toast({ message, variant = "success", duration = 4000, onClose }) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => onClose?.(), duration);
    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message) return null;

  const { icon: Icon, className } = CONFIG[variant] ?? CONFIG.success;

  return (
    <div className={`ui-toast ${className}`} role="status">
      <Icon className="ui-toast-icon" aria-hidden="true" />
      <span className="ui-toast-text">{message}</span>
      <button type="button" className="ui-toast-close" onClick={onClose} aria-label="Cerrar notificación">
        <FiX />
      </button>
    </div>
  );
}
