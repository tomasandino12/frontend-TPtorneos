import { FiCheckCircle, FiXCircle, FiAlertTriangle, FiInfo } from "react-icons/fi";
import "./Alert.css";

/**
 * Mensaje semántico único para toda la app (reemplaza los alert()/confirm() nativos
 * y las cajas de error "a mano" copiadas por pantalla).
 *
 * variant: "success" | "error" | "warning" | "info" — determina color e ícono, así que
 * es estructuralmente imposible renderizar un mensaje informativo con pinta de error
 * (ese fue el bug confirmado en la auditoría: una caja roja usada para un aviso neutral).
 */
const CONFIG = {
  success: { icon: FiCheckCircle, className: "ui-alert-success" },
  error: { icon: FiXCircle, className: "ui-alert-error" },
  warning: { icon: FiAlertTriangle, className: "ui-alert-warning" },
  info: { icon: FiInfo, className: "ui-alert-info" },
};

export default function Alert({ variant = "info", children, className = "", ...rest }) {
  const { icon: Icon, className: variantClass } = CONFIG[variant] ?? CONFIG.info;

  return (
    <div
      className={`ui-alert ${variantClass} ${className}`.trim()}
      role={variant === "error" ? "alert" : "status"}
      {...rest}
    >
      <Icon className="ui-alert-icon" aria-hidden="true" />
      <div className="ui-alert-content">{children}</div>
    </div>
  );
}
