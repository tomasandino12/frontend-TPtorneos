import { useEffect, useState } from "react";
import "../styles/IndexStyle.css";
import "../styles/Estadisticas.css";

function Estadisticas() {
  const [equipo, setEquipo] = useState(null);
  const [partidos, setPartidos] = useState([]);
  const [jugadores, setJugadores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const jugadorLogueado = JSON.parse(localStorage.getItem("jugador"));
        if (!jugadorLogueado || !jugadorLogueado.equipo) {
          setError("No se encontró equipo asociado al jugador.");
          setLoading(false);
          return;
        }

        // === 1️⃣ Traer datos del equipo completo (jugadores + participaciones)
        const equipoRes = await fetch(
          `http://localhost:3000/api/equipos/${jugadorLogueado.equipo.id}`
        );
        const equipoJson = await equipoRes.json();
        const equipoData = equipoJson?.data ?? equipoJson;

        // 👇 Agregá esta línea para ver cómo llegan los jugadores
console.log("📦 Jugadores desde el backend:", equipoData?.jugadores);

        // === 2️⃣ Traer estadísticas del equipo
        const estadisticasRes = await fetch(
          `http://localhost:3000/api/equipos/${jugadorLogueado.equipo.id}/estadisticas`
        );
        const estadisticasJson = await estadisticasRes.json();
        const estad =
          estadisticasJson?.estadisticas ??
          estadisticasJson?.data ??
          estadisticasJson;

        // === Datos generales del equipo
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

        // === Normalizar jugadores ===
          const jugadoresData = (equipoData?.jugadores || []).map((j) => ({
            id: j.id,
            nombre: j.nombre ?? j.nombreJugador ?? j.Nombre ?? "",
            apellido: j.apellido ?? j.apellidoJugador ?? j.Apellido ?? "",
            posicion: j.posicion ?? j.Posicion ?? "Sin posición",
            fechaNacimiento:
              j.fechaNacimiento ??
              j.fecha_nacimiento ??
              j.fechaNac ??
              j.FechaNacimiento ??
              "",
            esCapitan: j.esCapitan ?? j.EsCapitan ?? false,
          }));


        // Ordenar por posición: Arquero → Defensor → Mediocampista → Delantero
        const jugadoresOrdenados = jugadoresData.sort((a, b) => {
          const orden = ["Arquero", "Defensor", "Mediocampista", "Delantero"];
          return orden.indexOf(a.posicion) - orden.indexOf(b.posicion);
        });
        setJugadores(jugadoresOrdenados);

        // === Partidos ===
        const participaciones = equipoData?.participaciones ?? [];
        const todos = participaciones.flatMap((p) => {
          const locales = (p.partidosLocal ?? []).map((partido) => ({
            rival: partido.visitante?.equipo?.nombreEquipo ?? "Rival desconocido",
            local: true,
            fecha: partido.fecha_partido,
            hora: partido.hora_partido,
            estado_partido: partido.estado_partido,
            goles_local: partido.goles_local,
            goles_visitante: partido.goles_visitante,
            resultado:
              partido.estado_partido?.toLowerCase() === "finalizado"
                ? `${partido.goles_local}-${partido.goles_visitante}`
                : "–",
          }));

          const visitantes = (p.partidosVisitante ?? []).map((partido) => ({
            rival: partido.local?.equipo?.nombreEquipo ?? "Rival desconocido",
            local: false,
            fecha: partido.fecha_partido,
            hora: partido.hora_partido,
            estado_partido: partido.estado_partido,
            goles_local: partido.goles_local,
            goles_visitante: partido.goles_visitante,
            resultado:
              partido.estado_partido?.toLowerCase() === "finalizado"
                ? `${partido.goles_local}-${partido.goles_visitante}`
                : "–",
          }));

          return [...locales, ...visitantes];
        });

        // Ordenar partidos (últimos primero)
        const ordenados = todos.slice().sort((a, b) => {
          const fa = new Date(a.fecha).getTime();
          const fb = new Date(b.fecha).getTime();
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

  // === Estados de UI ===
  if (loading) return <p>Cargando estadísticas...</p>;
  if (error) return <p>{error}</p>;
  if (!equipo) return <p>No se encontraron datos del equipo.</p>;

  // === Agrupar jugadores por posición ===
  const jugadoresPorPosicion = jugadores.reduce((acc, jugador) => {
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

  // === Colores de resultado ===
  const getResultadoColor = (resultado, estado, local) => {
    if (estado?.toLowerCase() !== "finalizado") return "gris";
    const [g1, g2] = resultado.split("-").map(Number);
    if (g1 === g2) return "amarillo";
    const gano = local ? g1 > g2 : g2 > g1;
    return gano ? "verde" : "rojo";
  };

  return (
    <main className="subpagina-container">
      <header className="estadisticas-header">
        <h1>{equipo.nombreEquipo}</h1>
        <p>Estadísticas del equipo y plantilla de jugadores</p>
      </header>

      {/* === RESUMEN === */}
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
          <span>
            {(equipo.victorias ?? 0) +
              (equipo.empates ?? 0) +
              (equipo.derrotas ?? 0)}
          </span>
          <p>Partidos Jugados</p>
        </div>
      </section>

      <div className="estadisticas-contenido">
        {/* === PARTIDOS JUGADOS === */}
        <section className="partidos-jugados">
          <h2><i className="bx bx-calendar"></i> Partidos Jugados</h2>
          <p>Últimos encuentros del equipo</p>

          {partidos.length === 0 ? (
            <p>No se encontraron partidos.</p>
          ) : (
            partidos.map((p, idx) => (
              <div
                key={idx}
                className={`partido-card ${getResultadoColor(
                  p.resultado,
                  p.estado_partido,
                  p.local
                )}`}
              >
                <div className="partido-vs">
                  {p.local ? "vs " + p.rival : "vs " + p.rival + " (Visitante)"}
                </div>
                <div className="partido-fecha">
                  {new Date(p.fecha).toLocaleDateString("es-AR")}
                </div>
                <div className="partido-resultado">{p.resultado}</div>
              </div>
            ))
          )}
        </section>

        {/* === PLANTEL === */}
        <section className="plantilla-jugadores">
          <h2><i className="bx bx-group"></i> Plantel del equipo</h2>

          {Object.keys(jugadoresPorPosicion).length === 0 ? (
            <p>No hay jugadores cargados.</p>
          ) : (
            ["Arquero", "Defensor", "Mediocampista", "Delantero"].map(
              (pos) =>
                jugadoresPorPosicion[pos] && (
                  <div className="bloque-posicion" key={pos}>
                    <h3>{traducciones[pos]}</h3>
                    {jugadoresPorPosicion[pos].map((j, i) => (
                      <div className="jugador-card" key={i}>
                        <div>
                          <strong>
                            {j.nombre} {j.apellido}
                          </strong>
                          <p className="jugador-pos">{j.posicion}</p>
                        </div>
                        <div className="jugador-edad">
                          {j.fechaNacimiento
                            ? new Date().getFullYear() -
                              new Date(j.fechaNacimiento).getFullYear()
                            : "-"}{" "}
                          años
                        </div>
                      </div>
                    ))}
                  </div>
                )
            )
          )}
        </section>
      </div>
    </main>
  );
}

export default Estadisticas;
