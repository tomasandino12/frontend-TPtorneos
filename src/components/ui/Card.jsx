import "./Card.css";

/**
 * Contenedor de superficie genérico (reemplaza los ~5 "hero"/card casi
 * idénticos duplicados por archivo hoy: .ct-hero, .mt-hero, .ar-hero, etc.).
 * as: permite renderizar como otra etiqueta (ej. "section", "article") sin perder el estilo.
 */
export default function Card({ as, className = "", children, ...rest }) {
  const Tag = as || "div";
  return (
    <Tag className={`ui-card ${className}`.trim()} {...rest}>
      {children}
    </Tag>
  );
}
