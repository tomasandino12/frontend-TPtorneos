import "../styles/IndexStyle.css";
import "../styles/TablaPosiciones.css";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiAward } from "react-icons/fi";
import { apiFetch } from "../utils/api.js";
import { Alert, PageShell, ScrollableTable } from "../components/ui";

// Hash determinístico a partir del nombre — respaldo SOLO para el caso
// (no esperado, pero posible) de que colorPrimario venga null para algún
// equipo. Desde que getEstadisticasTorneo devuelve colorPrimario (color
// real de camiseta), este hash dejó de ser la fuente principal del color.
function colorPorEquipo(nombre) {
  let hash = 0;
  for (let i = 0; i < nombre.length; i++) {
    hash = nombre.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 62%, 45%)`;
}

// Desglose en palabras de PG/PE/PP para el aria-label de la columna
// "récord" (Fase 10) — singular solo cuando la cantidad es exactamente 1,
// plural en cualquier otro caso (incluido 0: "0 empatados").
function pluralizar(cantidad, singular, plural) {
  return `${cantidad} ${cantidad === 1 ? singular : plural}`;
}

function TablaPosiciones() {
  const [estadisticas, setEstadisticas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

useEffect(() => {
  const fetchEstadisticas = async () => {
    try {
      const jugador = JSON.parse(localStorage.getItem("jugador"));
      if (!jugador?.equipo?.id) {
        setError("El jugador no pertenece a ningún equipo.");
        setLoading(false);
        return;
      }

      // Traemos el equipo completo desde el backend (con participaciones)
      const resEquipo = await apiFetch(`/equipos/${jugador.equipo.id}`);
      const equipoJson = await resEquipo.json();
      if (!resEquipo.ok) throw new Error(equipoJson.message || "Error al obtener el equipo.");

      const participaciones = equipoJson.data.participaciones || [];
      if (participaciones.length === 0) {
        setError("El equipo no está participando en ningún torneo.");
        setLoading(false);
        return;
      }

      // Buscamos el torneo activo
      const participacionActiva = participaciones.find((p) => {
        const torneo = p.torneo;
        // torneo puede ser id o un objeto { id, estado }
        return typeof torneo === "object" ? torneo.estado === "en_curso" : false;
      });

      if (!participacionActiva) {
        setError("No se encontró un torneo activo para el equipo.");
        setLoading(false);
        return;
      }

      const torneo = participacionActiva.torneo;
      const torneoId = typeof torneo === "object" ? torneo.id : Number(torneo);
      if (!torneoId || Number.isNaN(torneoId)) {
        setError("torneoId inválido en la participación del equipo.");
        setLoading(false);
        return;
      }

      // Pedimos estadísticas solo del torneo activo
      const response = await apiFetch(`/equipos/estadisticas/${torneoId}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Error al cargar estadísticas");

      setEstadisticas(data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  fetchEstadisticas();
}, []);

  const handleEquipoClick = (equipoId) => {
    navigate(`/equipo/${equipoId}`);
  };

  if (loading) return <p>Cargando tabla de posiciones...</p>;
  if (error)
    return (
      <Alert variant="error">
        <strong>No perteneces a un equipo o tu equipo no tiene un torneo activo</strong>
        <p>
          Uníte o creá un equipo, o participá de un torneo activo para
          visualizar los próximos encuentros.
        </p>
      </Alert>
    );

  return (
    <PageShell bare className="tabla-shell">
      <div className="tabla-container">
        <h2 className="tabla-titulo">
          <FiAward /> Tabla de Posiciones
        </h2>
        <p className="tabla-subtitulo">Tabla de Posiciones - Temporada Regular</p>

        <ScrollableTable ariaLabel="Tabla de posiciones">
          <table className="tabla-posiciones">
            <thead>
              <tr>
                <th>Pos</th>
                <th>Equipo</th>
                <th className="tabla-col-chica"><abbr title="Partidos jugados">PJ</abbr></th>
                <th className="tabla-col-chica tabla-col-desktop"><abbr title="Partidos ganados">PG</abbr></th>
                <th className="tabla-col-chica tabla-col-desktop"><abbr title="Partidos empatados">PE</abbr></th>
                <th className="tabla-col-chica tabla-col-desktop"><abbr title="Partidos perdidos">PP</abbr></th>
                <th className="tabla-col-chica tabla-col-mobile">
                  <abbr title="Ganados-Empatados-Perdidos">G-E-P</abbr>
                </th>
                <th className="tabla-col-chica"><abbr title="Diferencia de gol">DG</abbr></th>
                <th><abbr title="Puntos">Pts</abbr></th>
              </tr>
            </thead>
            <tbody>
              {estadisticas.map((est) => (
                <tr key={est.id} onClick={() => handleEquipoClick(est.id)} className="fila-clickeable">
                  <td className="stat-numeral">{est.posicion}</td>
                  <td>
                    <span className="tabla-equipo-nombre">
                      <span
                        className="tabla-equipo-color"
                        style={{ backgroundColor: est.colorPrimario || colorPorEquipo(est.nombreEquipo) }}
                        aria-hidden="true"
                      />
                      <span className="tabla-equipo-texto" title={est.nombreEquipo}>
                        {est.nombreEquipo}
                      </span>
                    </span>
                    {est.estadoParticipacion === "dado_de_baja" && (
                      <span className="tabla-baja-tag"> (Baja)</span>
                    )}
                  </td>
                  <td className="stat-numeral tabla-col-chica">{est.pj}</td>
                  <td className="stat-numeral positivo tabla-col-chica tabla-col-desktop">{est.pg}</td>
                  <td className="stat-numeral tabla-col-chica tabla-col-desktop">{est.pe}</td>
                  <td className="stat-numeral negativo tabla-col-chica tabla-col-desktop">{est.pp}</td>
                  <td
                    className="stat-numeral tabla-col-chica tabla-col-mobile"
                    aria-label={`${pluralizar(est.pg, "ganado", "ganados")}, ${pluralizar(est.pe, "empatado", "empatados")}, ${pluralizar(est.pp, "perdido", "perdidos")}`}
                  >
                    {est.pg}-{est.pe}-{est.pp}
                  </td>
                  <td className={`stat-numeral tabla-col-chica ${est.dg >= 0 ? "positivo" : "negativo"}`}>
                    {est.dg > 0 ? "+" : ""}{est.dg}
                  </td>
                  <td className="stat-numeral puntos">{est.pts}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </ScrollableTable>
      </div>
    </PageShell>
  );
}

export default TablaPosiciones;
