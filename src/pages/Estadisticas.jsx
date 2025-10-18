import { useEffect, useState } from "react";
import "../styles/IndexStyle.css";
import "../styles/Estadisticas.css";

function Estadisticas() {
  const [equipo, setEquipo] = useState(null);
  const [partidos, setPartidos] = useState([]);
  const [jugadores, setJugadores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [jugador, setJugador] = useState(null);

  useEffect(() => {
  const fetchData = async () => {
    try {
      const jugadorLogueado = JSON.parse(localStorage.getItem("jugador"));
      if (!jugadorLogueado || !jugadorLogueado.equipo) {
        setError("No se encontró equipo asociado al jugador.");
        setLoading(false);
        return;
      }

      setJugador(jugadorLogueado);

      // 1) findOne del equipo
      const equipoRes = await fetch(
        `http://localhost:3000/api/equipos/${jugadorLogueado.equipo.id}`
      );
      const equipoJson = await equipoRes.json();
      const equipoData = equipoJson?.data ?? equipoJson;
      console.log("Datos del equipo obtenidos:", equipoData);
      console.log("Participaciones completas del equipo:", equipoData.participaciones);
      if (equipoData.participaciones?.length > 0) {
        console.log("Primer partido local ejemplo:", equipoData.participaciones[0].partidosLocal[0]);
        console.log("Primer partido visitante ejemplo:", equipoData.participaciones[0].partidosVisitante[0]);
      }

      // 2) estadísticas
      const estadisticasRes = await fetch(
        `http://localhost:3000/api/equipos/${jugadorLogueado.equipo.id}/estadisticas`
      );
      const estadisticasJson = await estadisticasRes.json();
      const estad =
        estadisticasJson?.estadisticas ??
        estadisticasJson?.data ??
        estadisticasJson;

      // Validaciones
      if (!equipoRes.ok) {
        setError("Error al cargar los datos del equipo (findOne).");
        setLoading(false);
        return;
      }

      // --- Setear equipo (con estadísticas) ---
      setEquipo({
        nombreEquipo:
          equipoData?.nombreEquipo ??
          jugadorLogueado.equipo?.nombreEquipo ??
          "",
        colorCamiseta: equipoData?.colorCamiseta ?? "",
        victorias: estad?.victorias ?? 0,
        empates: estad?.empates ?? 0,
        derrotas: estad?.derrotas ?? 0,
      });

      // --- Jugadores ---
      setJugadores(equipoData?.jugadores ?? []);

      // --- Partidos ---
      const participaciones = equipoData?.participaciones ?? [];

      const todos = participaciones.flatMap((p) => {
        const idParticipacionActual = p.id;

        // Locales
        const locales = (p.partidosLocal ?? []).map((partido) => ({
          rival: partido.visitante?.equipo?.nombreEquipo ?? "Rival desconocido",
          local: true,
          fecha: partido.fecha_partido,
          hora: partido.hora_partido,
          estado_partido: partido.estado_partido,
          goles_local: partido.goles_local,
          goles_visitante: partido.goles_visitante,
          resultado:
            partido.estado_partido === "Finalizado"
              ? `${partido.goles_local}-${partido.goles_visitante}`
              : "–",
        }));

          // Visitantes
        const visitantes = (p.partidosVisitante ?? []).map((partido) => ({
          rival: partido.local?.equipo?.nombreEquipo ?? "Rival desconocido",
          local: false,
          fecha: partido.fecha_partido,
          hora: partido.hora_partido,
          estado_partido: partido.estado_partido,
          goles_local: partido.goles_local,
          goles_visitante: partido.goles_visitante,
          resultado:
            partido.estado_partido === "Finalizado"
              ? `${partido.goles_local}-${partido.goles_visitante}`
              : "–",
        }));

        return [...locales, ...visitantes];
      });

    // opcional: ordenar por fecha
      const ordenados = todos.slice().sort((a, b) => {
        const fa = a.fecha ? new Date(a.fecha).getTime() : 0;
        const fb = b.fecha ? new Date(b.fecha).getTime() : 0;
        return fb - fa;
      });

      setPartidos(ordenados);
    } catch (err) {
      console.error("Error al obtener datos:", err);
      setError("No se pudieron cargar los datos.");
    } finally {
      setLoading(false);
    }
  };

  fetchData();
}, []);

  // --- UI States ---
  if (loading) return <p>Cargando estadísticas...</p>;
  if (error) return <p>{error}</p>;
  if (!equipo) return <p>No se encontraron datos del equipo.</p>;

  // --- Lógica de render ---
  const jugadoresPorPosicion = (jugadores || []).reduce((acc, jugador) => {
    const pos = jugador.posicion ?? "Sin posición";
    if (!acc[pos]) acc[pos] = [];
    acc[pos].push(jugador);
    return acc;
  }, {});

  const traducciones = {
    Arquero: "ARQUEROS",
    Defensor: "DEFENSORES",
    Mediocampista: "MEDIOCAMPISTAS",
    Delantero: "DELANTEROS",
  };

  const getResultadoColor = (resultado, estado) => {
  if (estado === "Programado") return "gris";
  if (resultado === "-") return "gris";
  const [g1, g2] = resultado.split("-").map(Number);
  if (g1 === g2) return "amarillo";
  return g1 > g2 ? "verde" : "rojo";
};

  return (
    <main className="subpagina-container">
      <header className="estadisticas-header">
        {/* header usa el jugador almacenado para mostrar el nombre tal como lo tenías */}
        <h1>{jugador?.equipo?.nombreEquipo ?? equipo.nombreEquipo}</h1>
        <p>Estadísticas del equipo y plantilla de jugadores</p>
      </header>

      <section className="resumen-boxes">
        <div className="resumen-box verde">
          <span>{equipo.victorias ?? 0}</span>
          <p>Victorias</p>
        </div>
        <div className="resumen-box gris">
          <span>{equipo.empates ?? 0}</span>
          <p>Empates</p>
        </div>
        <div className="resumen-box rojo">
          <span>{equipo.derrotas ?? 0}</span>
          <p>Derrotas</p>
        </div>
        <div className="resumen-box azul">
          <span>{(equipo.victorias ?? 0) + (equipo.empates ?? 0) + (equipo.derrotas ?? 0)}</span>
          <p>Partidos Jugados</p>
        </div>
      </section>

      <div className="estadisticas-contenido">
        <section className="partidos-jugados">
          <h2><i className="bx bx-calendar"></i> Partidos Jugados</h2>
          <p>Historial de encuentros del equipo</p>

          {equipo.participaciones?.length > 0 ? (
            equipo.participaciones.map((p) => (
              <div key={p.id}>
                {[...(p.partidosLocal || []), ...(p.partidosVisitante || [])].map((partido) => {
                  const esLocal = partido.equipoLocal === p.id;
                  const idRival = esLocal ? partido.equipoVisitante : partido.equipoLocal;

                  // Buscar el nombre del rival a partir de las participaciones cargadas
                  const participacionRival = equipo.participaciones.find(
                    (par) => par.id === idRival
                  );
                  const nombreRival = participacionRival
                    ? participacionRival.equipo?.nombreEquipo || "Rival"
                    : "Sin rival";

                  const esProgramado = partido.estado_partido === "Programado";

                  // Colores según el estado del partido
                  const colorClass = esProgramado
                    ? "gris"
                    : partido.goles_local === partido.goles_visitante
                    ? "amarillo"
                    : (esLocal && partido.goles_local > partido.goles_visitante) ||
                      (!esLocal && partido.goles_local < partido.goles_visitante)
                    ? "verde"
                    : "rojo";

                  // Formateo de fecha (opcional)
                  const fechaFormateada = new Date(partido.fecha_partido).toLocaleDateString("es-AR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  });

                  return (
                    <div className={`partido-card ${getResultadoColor(p.resultado, p.estado_partido)}`} key={idx}>
                      <div className="partido-vs">vs {p.rival}</div>
                      <div className="partido-fecha">{p.fecha}</div>
                      <div className="partido-resultado">{p.resultado}</div>
                    </div>
                  );
                })}
              </div>
            ))
          ) : (
            <p>No se encontraron partidos.</p>
          )}
        </section>

        <section className="plantilla-jugadores">
          <h2><i className="bx bx-group"></i> Plantel del equipo</h2>
          <p>Jugadores</p>

          {Object.keys(jugadoresPorPosicion).length === 0 ? (
            <p>No hay jugadores cargados.</p>
          ) : (
            Object.keys(jugadoresPorPosicion).map((pos) => (
              <div className="bloque-posicion" key={pos}>
                <h3>{traducciones[pos] || pos.toUpperCase() + "S"}</h3>
                {jugadoresPorPosicion[pos].map((j, i) => (
                  <div className="jugador-card" key={i}>
                    <div>
                      <strong>{j.nombre} {j.apellido ?? ""}</strong>
                      <p className="jugador-pos">{j.posicion}</p>
                    </div>
                    <div className="jugador-edad">
                      {/* si tenés fechaNacimiento, podés calcular edad; si no, muestro '-' */}
                      {j.fechaNacimiento ? (new Date().getFullYear() - new Date(j.fechaNacimiento).getFullYear()) : (j.edad ?? "-")} años
                    </div>
                  </div>
                ))}
              </div>
            ))
          )}
        </section>
      </div>
    </main>
  );
}

export default Estadisticas;