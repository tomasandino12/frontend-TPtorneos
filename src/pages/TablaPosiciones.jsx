import "../styles/IndexStyle.css";
import "../styles/TablaPosiciones.css";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

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
      const resEquipo = await fetch(`http://localhost:3000/api/equipos/${jugador.equipo.id}`);
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
        return typeof torneo === "object" ? torneo.estado === "activo" : false;
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
      const response = await fetch(`http://localhost:3000/api/equipos/estadisticas/${torneoId}`);
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
  if (error) return (
    <div className="mensaje-error">
      <i className="bx bx-error-circle"></i>
      <h3>
        No perteneces a un equipo o tu equipo no tiene un torneo activo
      </h3>
      <p>
        Uníte o creá un equipo, o participá de un torneo activo para
        visualizar los próximos encuentros.
      </p>
    </div>
  );

  return (
    <div className="tabla-container">
      <h2 className="tabla-titulo">🏆 Tabla de Posiciones</h2>
      <p className="tabla-subtitulo">Tabla de Posiciones - Temporada Regular</p>

      <table className="tabla-posiciones">
        <thead>
          <tr>
            <th>Pos</th>
            <th>Equipo</th>
            <th>PJ</th>
            <th>PG</th>
            <th>PE</th>
            <th>PP</th>
            <th>DG</th>
            <th>Pts</th>
          </tr>
        </thead>
        <tbody>
          {estadisticas.map((est) => (
            <tr key={est.id} onClick={() => handleEquipoClick(est.id)} style={{ cursor: "pointer" }}>
              <td>{est.posicion}</td>
              <td>{est.nombreEquipo}</td>
              <td>{est.pj}</td>
              <td className="positivo">{est.pg}</td>
              <td>{est.pe}</td>
              <td className="negativo">{est.pp}</td>
              <td className={est.dg >= 0 ? "positivo" : "negativo"}>
                {est.dg > 0 ? "+" : ""}{est.dg}
              </td>
              <td className="puntos">{est.pts}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default TablaPosiciones;
