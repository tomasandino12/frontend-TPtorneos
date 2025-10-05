import "../styles/IndexStyle.css";
import "../styles/Estadisticas.css";

function Estadisticas() {
  const equipo = {
    nombre: "Los Tigres FC",
    victorias: 3,
    empates: 1,
    derrotas: 1,
  };

  const partidos = [
    { rival: "Águilas United", local: true, fecha: "15/03/2024", resultado: "3-2" },
    { rival: "Leones Dorados", local: false, fecha: "22/03/2024", resultado: "1-1" },
    { rival: "Halcones FC", local: true, fecha: "29/03/2024", resultado: "2-0" },
    { rival: "Lobos Grises", local: true, fecha: "12/04/2024", resultado: "4-1" },
  ];

  const jugadores = [
    { nombre: "Juan Pérez", posicion: "Arquero", edad: 28 },
    { nombre: "Carlos Mendoza", posicion: "Arquero", edad: 25 },
    { nombre: "Roberto Fernández", posicion: "Defensor", edad: 29 },
    { nombre: "Diego Martínez", posicion: "Defensor", edad: 27 },
    { nombre: "Andrés López", posicion: "Mediocampista", edad: 23 },
    { nombre: "Fernando Sánchez", posicion: "Mediocampista", edad: 25 },
    { nombre: "Pablo Ramírez", posicion: "Mediocampista", edad: 26 },
    { nombre: "Javier Torres", posicion: "Mediocampista", edad: 24 },
    { nombre: "Carlos Rodríguez", posicion: "Delantero", edad: 27 },
    { nombre: "Alejandro Vargas", posicion: "Delantero", edad: 22 },
  ];

  const jugadoresPorPosicion = jugadores.reduce((acc, jugador) => {
    if (!acc[jugador.posicion]) acc[jugador.posicion] = [];
    acc[jugador.posicion].push(jugador);
    return acc;
  }, {});

  const traducciones = {
    Arquero: "ARQUEROS",
    Defensor: "DEFENSORES",
    Mediocampista: "MEDIOCAMPISTAS",
    Delantero: "DELANTEROS",
  };

  const getResultadoColor = (resultado, local) => {
    const [golesEquipo, golesRival] = resultado.split("-").map(Number);
    const victoria = (local && golesEquipo > golesRival) || (!local && golesEquipo < golesRival);
    const empate = golesEquipo === golesRival;

    if (empate) return "amarillo";
    if (victoria) return "verde";
    return "rojo";
  };

  return (
    <main className="subpagina-container">
      <header className="estadisticas-header">
        <h1>{equipo.nombre}</h1>
        <p>Estadísticas del equipo y plantilla de jugadores</p>
      </header>

      <section className="resumen-boxes">
        <div className="resumen-box verde">
          <span>{equipo.victorias}</span>
          <p>Victorias</p>
        </div>
        <div className="resumen-box gris">
          <span>{equipo.empates}</span>
          <p>Empates</p>
        </div>
        <div className="resumen-box rojo">
          <span>{equipo.derrotas}</span>
          <p>Derrotas</p>
        </div>
        <div className="resumen-box azul">
          <span>{equipo.victorias + equipo.empates + equipo.derrotas}</span>
          <p>Partidos Jugados</p>
        </div>
      </section>

      <div className="estadisticas-contenido">
        <section className="partidos-jugados">
          <h2><i className="bx bx-calendar"></i> Partidos Jugados</h2>
          <p>Historial de encuentros del equipo</p>

          {partidos.map((p, idx) => (
            <div className={`partido-card ${getResultadoColor(p.resultado, p.local)}`} key={idx}>
              <div className="partido-vs">{p.local ? "vs" : "@"} {p.rival}</div>
              <div className="partido-fecha">{p.fecha}</div>
              <div className="partido-resultado">{p.resultado}</div>
            </div>
          ))}
        </section>

        <section className="plantilla-jugadores">
          <h2><i className="bx bx-group"></i> Plantel del equipo</h2>
          <p>Jugadores</p>

          {Object.keys(jugadoresPorPosicion).map((pos) => (
            <div className="bloque-posicion" key={pos}>
              <h3>{traducciones[pos] || pos.toUpperCase() + "S"}</h3>
              {jugadoresPorPosicion[pos].map((j, i) => (
                <div className="jugador-card" key={i}>
                  <div>
                    <strong>{j.nombre}</strong>
                    <p className="jugador-pos">{j.posicion}</p>
                  </div>
                  <div className="jugador-edad">{j.edad} años</div>
                </div>
              ))}
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}

export default Estadisticas;
