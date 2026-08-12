import "./ScrollableTable.css";

/**
 * Envoltorio compartido para las 4 tablas del proyecto — dos contenedores
 * anidados obligatorios (ver docs/frontend): el externo (esta misma raíz,
 * clase pasada por `className`) recorta las esquinas redondeadas con
 * `overflow: hidden`; el interno agrega el scroll horizontal, el foco por
 * teclado y los atributos de accesibilidad. Separarlos en dos elementos es
 * necesario porque `overflow-x: auto` en el mismo elemento que el
 * `border-radius` fuerza el eje Y a `auto` y rompe el recorte de esquinas.
 *
 * className: clase(s) del contenedor externo — normalmente la clase que ya
 * traía la tabla (ej. "ar-table-wrap") para conservar su fondo/borde/radio
 * existentes tal cual.
 * ariaLabel: descripción de la tabla para el `role="region"` del scroll.
 */
export default function ScrollableTable({ children, ariaLabel, className = "" }) {
  return (
    <div className={`ui-scrollable-table ${className}`.trim()}>
      <div className="ui-scrollable-table-scroll" tabIndex={0} role="region" aria-label={ariaLabel}>
        {children}
      </div>
    </div>
  );
}
