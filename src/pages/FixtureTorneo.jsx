import { useState, useEffect } from "react";
import "../styles/FixtureTorneo.css";
import "../styles/IndexStyle.css"; // Importa estilos globales por si no lo tenías

function FixtureTorneo() {
  const [partidos, setPartidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPartidos = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/partidos/programados');
        if (!response.ok) {
          throw new Error('Error al cargar los partidos');
        }
        const data = await response.json();
        setPartidos(data.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPartidos();
  }, []);

  return (
    <main className="subpagina-container">
      <section className="fixture-header">
        <h1><i className="bx bx-calendar"></i> Fixture del Torneo</h1>
        <p>Próximos partidos y resultados recientes</p>
      </section>

      <section className="fixture-lista">
        <h2>Próximos Partidos</h2>
        <p className="fixture-sub">Calendario de encuentros programados</p>

        {loading && <p>Cargando partidos...</p>}
        {error && <p>Error: {error}</p>}
        {!loading && !error && partidos.length === 0 && <p>No hay partidos programados.</p>}

        {partidos.map((partido) => (
          <div className="fixture-card" key={partido.id}>
            <div className="fixture-card-estado">
              <span className="jornada">Jornada {partido.jornada}</span>
              <span className={`estado ${partido.estado_partido}`}>{partido.estado_partido}</span>
            </div>
            <h3>{partido.local?.equipo?.nombreEquipo || 'Equipo Local'} vs {partido.visitante?.equipo?.nombreEquipo || 'Equipo Visitante'}</h3>
            <div className="fixture-detalles">
              <p><i className="bx bx-calendar"></i> {new Date(partido.fecha_partido).toLocaleDateString()}</p>
              <p><i className="bx bx-time"></i> {partido.hora_partido}</p>
              <p><i className="bx bx-map"></i> {partido.cancha?.nombre || 'Cancha'}</p>
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}

export default FixtureTorneo;
