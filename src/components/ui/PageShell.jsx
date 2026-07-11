import "./PageShell.css";

/**
 * Fondo de página compartido — reemplaza las ~8 clases casi idénticas que
 * cada pantalla reimplementaba por su cuenta (.subpagina-container,
 * .MiPerfil/.mi-perfil-container, .admin-main-content, .tabla-wrapper...).
 * "Todos los fondos son el mismo color" deja de ser una convención a
 * recordar en 10 archivos y pasa a ser una garantía estructural: todos
 * importan este componente.
 *
 * background: "paper" (default, marfil — el 100% de los casos actuales
 * salvo excepción explícita) | "grass" | cualquier otro nombre de token.
 * bare: true quita el recuadro flotante (max-width/radio/sombra) y deja
 * solo el color de fondo a ancho completo — lo usan las pantallas del
 * panel admin y Tabla de Posiciones, que no tienen el patrón de "card
 * centrada" del lado jugador.
 */
export default function PageShell({
  background = "paper",
  bare = false,
  className = "",
  children,
  as,
  ...rest
}) {
  const Tag = as || "main";
  return (
    <Tag
      className={`ui-page-shell ui-page-shell-bg-${background}${bare ? " ui-page-shell-bare" : ""} ${className}`.trim()}
      {...rest}
    >
      {children}
    </Tag>
  );
}
