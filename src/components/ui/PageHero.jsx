import "./PageHero.css";

/**
 * Recuadro "hero" compartido (ícono + título + subtítulo + acciones
 * opcionales) — reemplaza .page-header, .equipo-detalle-header,
 * .admin-hero e .ie-hero, que reimplementaban el mismo patrón visual por
 * separado en distintos archivos y ya driftearon 3 veces (la última, en
 * código nuevo sin relación a los intentos anteriores). Si una pantalla
 * puntual necesita verse distinta, la diferencia tiene que quedar acá,
 * como prop explícita — nunca como una clase CSS paralela que nadie más ve.
 *
 * layout:
 *   "center" (default) — ícono+título centrados, subtítulo debajo, acciones
 *     debajo de eso (patrón ex .page-header: Equipos, Estadísticas, Fixture).
 *   "split" — título a la izquierda, acciones a la derecha, en una fila que
 *     rompe en mobile (patrón ex .equipo-detalle-header: EquipoInfo).
 *   "left" — ícono+título alineados a la izquierda, apilado, ancho acotado
 *     (patrón ex .admin-hero / .ie-hero: panel admin).
 *
 * background: "grass" (default) | "paper" | "surface".
 * flush: true quita el recuadro flotante (radio/margen/sombra) y lo deja a
 * todo el ancho con un borde inferior — lo usa Inscribir Equipos, que hoy
 * tiene un hero "banner" pegado arriba en vez de una card flotante.
 * children: el resto del contenido de la pantalla (filtros, listas, formularios,
 * acciones) — el recuadro tiene que envolver visualmente TODA la información
 * de la sección, no solo el título (si el contenido queda afuera, sin un
 * recuadro que lo agrupe, las cards blancas quedan flotando sueltas sobre el
 * fondo marfil en vez de leerse como una sección cohesiva). Se renderiza en un
 * wrapper con `text-align: left` fijo — el `layout` centra o alinea el título,
 * pero el contenido anidado (formularios, tablas, listas) siempre se lee de
 * izquierda a derecha, sin heredar el centrado del título.
 */
export default function PageHero({
  icon,
  title,
  subtitle,
  actions,
  layout = "center",
  background = "grass",
  flush = false,
  className = "",
  children,
  as,
  ...rest
}) {
  const Tag = as || "section";
  return (
    <Tag
      className={`ui-page-hero ui-page-hero-${layout} ui-page-hero-bg-${background}${
        flush ? " ui-page-hero-flush" : ""
      } ${className}`.trim()}
      {...rest}
    >
      <div className="ui-page-hero-top">
        <div className="ui-page-hero-titleblock">
          {(icon || title) && (
            <h1 className="ui-page-hero-title">
              {icon && <span className="ui-page-hero-icon">{icon}</span>}
              {title}
            </h1>
          )}
          {subtitle && <p className="ui-page-hero-subtitle">{subtitle}</p>}
        </div>
        {actions && <div className="ui-page-hero-actions">{actions}</div>}
      </div>
      {children && <div className="ui-page-hero-body">{children}</div>}
    </Tag>
  );
}
