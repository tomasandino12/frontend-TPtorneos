import { FiX } from "react-icons/fi";

const ABREVIATURA_CATEGORIA = {
  Arquero: "AR",
  Defensor: "DF",
  Mediocampista: "MC",
  Delantero: "DL",
};

// El color del equipo es arbitrario (elegido por el capitán, o el default
// del backend al crear el equipo, que hoy es blanco) — no se puede asumir
// que el texto blanco de la etiqueta siempre contraste bien contra él. Se
// elige negro o blanco según la luminancia del color de fondo real.
function colorTextoLegible(hex) {
  if (typeof hex !== "string") return "#fff";
  const limpio = hex.replace("#", "");
  if (![3, 6].includes(limpio.length)) return "#fff";
  const completo = limpio.length === 3 ? limpio.split("").map((c) => c + c).join("") : limpio;
  const r = parseInt(completo.slice(0, 2), 16);
  const g = parseInt(completo.slice(2, 4), 16);
  const b = parseInt(completo.slice(4, 6), 16);
  const luminancia = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminancia > 0.6 ? "#16241B" : "#fff";
}

/**
 * Cancha simplificada (SVG + puntos posicionados por porcentaje) para mostrar
 * los 11 puntos de una formación. La usan tanto el asistente de convocatoria
 * (editable, paso 2) como la vista de la formación ya guardada (solo lectura).
 *
 * `puntos`: [{ id, categoria, x, y }], x/y en 0-100 — el SVG de fondo usa
 * viewBox="0 0 100 100" con preserveAspectRatio="none", así que 1 unidad de
 * viewBox equivale a 1% del ancho/alto renderizado y los puntos (posicionados
 * por % en CSS) caen exactamente donde los dibujó el SVG sin duplicar lógica
 * de escala en dos sistemas de coordenadas distintos.
 */
export default function Cancha({
  puntos,
  asignaciones,
  jugadoresPorId,
  colorEquipo,
  editable = false,
  onClickPunto,
}) {
  const color = colorEquipo || "#1F5233";
  const colorTexto = colorTextoLegible(color);

  return (
    <div className="cancha-wrapper">
      <svg className="cancha-svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <rect x="0" y="0" width="100" height="100" className="cancha-fondo" />
        <rect x="3" y="3" width="94" height="94" className="cancha-linea" />
        <line x1="3" y1="50" x2="97" y2="50" className="cancha-linea" />
        <circle cx="50" cy="50" r="9" className="cancha-linea" />
        <rect x="27" y="3" width="46" height="13" className="cancha-linea" />
        <rect x="27" y="84" width="46" height="13" className="cancha-linea" />
      </svg>

      {puntos.map((punto) => {
        const idJugador = asignaciones[punto.id];
        const jugador = idJugador ? jugadoresPorId[idJugador] : null;
        const vacio = !jugador;
        const clase = `cancha-punto${vacio ? " cancha-punto-vacio" : " cancha-punto-asignado"}${
          editable ? " cancha-punto-editable" : ""
        }`;
        const estilo = vacio
          ? { left: `${punto.x}%`, top: `${punto.y}%` }
          : {
              left: `${punto.x}%`,
              top: `${punto.y}%`,
              "--cancha-punto-color": color,
              "--cancha-punto-texto": colorTexto,
            };
        const etiqueta = jugador ? jugador.apellido : ABREVIATURA_CATEGORIA[punto.categoria] ?? "?";
        const tituloVacio = jugador
          ? `${jugador.nombre} ${jugador.apellido}${jugador.esCapitan ? " (Capitán)" : ""}`
          : punto.categoria;

        if (!editable) {
          return (
            <div key={punto.id} className={clase} style={estilo} title={tituloVacio}>
              <span className="cancha-punto-nombre">{etiqueta}</span>
            </div>
          );
        }

        return (
          <button
            key={punto.id}
            type="button"
            className={clase}
            style={estilo}
            onClick={() => onClickPunto(punto)}
            title={jugador ? `${tituloVacio} — tocá para quitar` : `Asignar ${punto.categoria.toLowerCase()}`}
          >
            <span className="cancha-punto-nombre">{etiqueta}</span>
            {!vacio && <FiX className="cancha-punto-quitar" />}
          </button>
        );
      })}
    </div>
  );
}
