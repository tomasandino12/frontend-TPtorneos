import { useId, useState } from "react";
import { FiEye, FiEyeOff } from "react-icons/fi";
import "./TextField.css";

/**
 * Campo de formulario único para toda la app (texto, email, número, password, etc.).
 *
 * - icon: nodo de react-icons opcional, a la izquierda del input.
 * - error: string opcional; si viene seteado, pinta el borde e imprime el mensaje debajo.
 * - type="password": SIEMPRE agrega el botón de mostrar/ocultar y SIEMPRE alterna su ícono
 *   según el estado interno — no depende de que cada pantalla lo implemente a mano, que es
 *   justo el bug detectado en la auditoría (un campo sin el botón, otro que no alternaba el ícono).
 * - Cualquier otra prop (value, onChange, name, placeholder, required, disabled, autoComplete,
 *   aria-label, ...) se pasa directo al <input>.
 */
export default function TextField({
  label,
  type = "text",
  icon = null,
  error = "",
  id,
  className = "",
  ...rest
}) {
  const autoId = useId();
  const inputId = id || autoId;
  const isPassword = type === "password";
  const [visible, setVisible] = useState(false);
  const resolvedType = isPassword ? (visible ? "text" : "password") : type;

  return (
    <div className={`ui-field ${error ? "ui-field-error" : ""} ${className}`.trim()}>
      {label && (
        <label className="ui-field-label" htmlFor={inputId}>
          {label}
        </label>
      )}

      <div className="ui-field-control">
        {icon && <span className="ui-field-icon">{icon}</span>}

        <input id={inputId} type={resolvedType} className="ui-field-input" {...rest} />

        {isPassword && (
          <button
            type="button"
            className="ui-field-action"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
          >
            {visible ? <FiEyeOff /> : <FiEye />}
          </button>
        )}
      </div>

      {error && (
        <p className="ui-field-error-text" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
