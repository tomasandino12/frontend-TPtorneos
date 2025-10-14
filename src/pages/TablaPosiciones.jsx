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
        // Obtener torneo del usuario (asumiendo que está en localStorage)
        const jugador = JSON.parse(localStorage.getItem("jugador"));
        if (!jugador?.equipo?.participaciones?.length) {
          setError("No se encontró torneo activo para el usuario.");
          setLoading(false);
          return;
        }

        // Tomar el primer torneo de las participaciones
        const torneoId = jugador.equipo.participaciones[0].torneo.id;

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
  if (error) return <p>Error: {error}</p>;

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
