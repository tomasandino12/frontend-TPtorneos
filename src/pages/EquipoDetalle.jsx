import "../styles/IndexStyle.css";
import "../styles/Equipos.css";
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

function EquipoDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [equipo, setEquipo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEquipo = async () => {
      try {
        const response = await fetch(`http://localhost:3000/api/equipos/${id}`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Error al cargar equipo");
        setEquipo(data.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchEquipo();
  }, [id]);

  if (loading) return <p>Cargando...</p>;
  if (error) return <p>Error: {error}</p>;
  if (!equipo) return <p>Equipo no encontrado</p>;

  // Combinar partidos de todas las participaciones
  const allPartidos = [];
  equipo.participaciones.forEach((participacion) => {
    allPartidos.push(...participacion.partidosLocal, ...participacion.partidosVisitante);
  });

  // Filtrar partidos únicos y finalizados
  const partidosUnicos = allPartidos.filter(
    (partido, index, self) =>
      index === self.findIndex((p) => p.id === partido.id) &&
      partido.estado_partido === "finalizado"
  );

  return (
    <main className="subpagina-container">
      <section className="equipos-header">
        <div className="header-detalle">
          <h1>
            <i className="bx bx-group"></i> Detalle del Equipo: {equipo.nombreEquipo}
          </h1>
          <button
            className="btn-volver"
            onClick={() => navigate("/gestorTorneos")}
          >
            ← Volver al menú
          </button>
        </div>
        <p>Información completa del equipo</p>
      </section>

      {/* Jugadores */}
      <section className="detalle-seccion">
        <h2 className="titulo-seccion">Jugadores</h2>
        {equipo.jugadores.length > 0 ? (
          <ul className="lista-jugadores">
            {equipo.jugadores.map((jugador) => (
              <li key={jugador.id}>
                {jugador.nombre} {jugador.apellido}{" "}
                {jugador.esCapitan ? "(Capitán)" : ""}
              </li>
            ))}
          </ul>
        ) : (
          <p>No hay jugadores registrados.</p>
        )}
      </section>

      {/* Historial de Partidos */}
      <section className="detalle-seccion">
        <h2 className="titulo-seccion">Historial de Partidos</h2>
        {partidosUnicos.length > 0 ? (
          <table className="tabla-partidos">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Local</th>
                <th>Resultado</th>
                <th>Visitante</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {partidosUnicos.map((partido) => (
                <tr key={partido.id}>
                  <td>{new Date(partido.fecha_partido).toLocaleDateString("es-AR")}</td>
                  <td>{partido.local?.equipo?.nombreEquipo || "N/A"}</td>
                  <td>
                    {partido.goles_local} - {partido.goles_visitante}
                  </td>
                  <td>{partido.visitante?.equipo?.nombreEquipo || "N/A"}</td>
                  <td>{partido.estado_partido}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No hay partidos finalizados.</p>
        )}
      </section>
    </main>
  );
}

export default EquipoDetalle;
