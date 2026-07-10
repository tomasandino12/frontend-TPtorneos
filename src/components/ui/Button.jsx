import "./Button.css";

const VARIANTS = ["primary", "secondary", "danger", "ghost"];

/**
 * Botón base del sistema de diseño.
 * variant: "primary" | "secondary" | "danger" | "ghost"
 * icon: nodo de react-icons opcional (izquierda por defecto, iconPosition="right" para cambiarlo)
 * Cualquier otra prop (onClick, type, disabled, aria-label, ...) se pasa directo al <button>.
 */
export default function Button({
  variant = "primary",
  icon = null,
  iconPosition = "left",
  className = "",
  children,
  ...rest
}) {
  const variantClass = VARIANTS.includes(variant) ? variant : "primary";

  return (
    <button className={`ui-btn ui-btn-${variantClass} ${className}`.trim()} {...rest}>
      {icon && iconPosition === "left" && <span className="ui-btn-icon">{icon}</span>}
      {children && <span className="ui-btn-label">{children}</span>}
      {icon && iconPosition === "right" && <span className="ui-btn-icon">{icon}</span>}
    </button>
  );
}
