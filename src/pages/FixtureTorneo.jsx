import "../styles/FixtureTorneo.css";
import "../styles/IndexStyle.css"; // Importa estilos globales por si no lo tenías

function FixtureTorneo() {
  const partidos = [
    {
      id: 1,
      jornada: 9,
      estado: "programado",
      fecha: "2024-03-14",
      hora: "16:00",
      equipoLocal: "Los Tigres FC",
      equipoVisitante: "Águilas United",
      golesLocal: null,
      golesVisitante: null,
      cancha: "Estadio Municipal",
    },
    {
      id: 2,
      jornada: 9,
      estado: "programado",
      fecha: "2024-03-14",
      hora: "18:00",
      equipoLocal: "Leones Dorados",
      equipoVisitante: "Halcones FC",
      golesLocal: null,
      golesVisitante: null,
      cancha: "Campo Deportivo Norte",
    },
  ];

  return (
    <main className="subpagina-container">
      <section className="fixture-header">
        <h1><i className="bx bx-calendar"></i> Fixture del Torneo</h1>
        <p>Próximos partidos y resultados recientes</p>
      </section>

      <section className="fixture-lista">
        <h2>Próximos Partidos</h2>
        <p className="fixture-sub">Calendario de encuentros programados</p>

        {partidos.map((partido) => (
          <div className="fixture-card" key={partido.id}>
            <div className="fixture-card-estado">
              <span className="jornada">Jornada {partido.jornada}</span>
              <span className={`estado ${partido.estado}`}>{partido.estado}</span>
            </div>
            <h3>{partido.equipoLocal} vs {partido.equipoVisitante}</h3>
            <div className="fixture-detalles">
              <p><i className="bx bx-calendar"></i> {partido.fecha}</p>
              <p><i className="bx bx-time"></i> {partido.hora}</p>
              <p><i className="bx bx-map"></i> {partido.cancha}</p>
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}

export default FixtureTorneo;
