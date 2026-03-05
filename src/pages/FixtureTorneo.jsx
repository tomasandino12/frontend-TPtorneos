import { useState, useEffect } from "react";
import "../styles/FixtureTorneo.css";
import "../styles/IndexStyle.css";

function FixtureTorneo() {
  const [partidos, setPartidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPartidos = async () => {
      try {
        // 1️⃣ Obtener jugador del localStorage
        const jugador = JSON.parse(localStorage.getItem("jugador"));

        // 2️⃣ Validar equipo (puede venir como número o como objeto)
        const tieneEquipo =
          !!jugador?.equipo &&
          (typeof jugador.equipo === "number" ||
            (typeof jugador.equipo === "object" && !!jugador.equipo.id));

        if (!tieneEquipo) {
          setError(
            "No perteneces a un equipo o tu equipo no tiene un torneo activo."
          );
          setLoading(false);
          return;
        }

        const equipoId =
          typeof jugador.equipo === "object"
            ? jugador.equipo.id
            : jugador.equipo;

        // 3️⃣ Obtener el equipo con sus participaciones
        const resEquipo = await fetch(
          `http://localhost:3000/api/equipos/${equipoId}`
        );
        const equipoJson = await resEquipo.json();
        if (!resEquipo.ok)
          throw new Error(equipoJson.message || "Error al obtener el equipo.");

        const participaciones = equipoJson.data?.participaciones || [];
        if (participaciones.length === 0) {
          setError(
            "No perteneces a un equipo o tu equipo no tiene un torneo activo."
          );
          setLoading(false);
          return;
        }

        // 4️⃣ Buscar torneo activo
        const participacionActiva = participaciones.find((p) => {
          const t = p.torneo;
          return typeof t === "object" && t.estado === "activo";
        });

        if (!participacionActiva) {
          setError(
            "No perteneces a un equipo o tu equipo no tiene un torneo activo."
          );
          setLoading(false);
          return;
        }

        const torneo = participacionActiva.torneo;
        const torneoId =
          typeof torneo === "object" ? torneo.id : Number(torneo);
        if (!torneoId || Number.isNaN(torneoId)) {
          setError(
            "No perteneces a un equipo o tu equipo no tiene un torneo activo."
          );
          setLoading(false);
          return;
        }

        // 5️⃣ Traer partidos del torneo y filtrar programados
        const response = await fetch(
          `http://localhost:3000/api/partidos/torneo/${torneoId}`
        );
        const data = await response.json();
        if (!response.ok)
          throw new Error(data.message || "Error al cargar los partidos.");

        const partidosProgramados = (data.data || []).filter(
          (p) => p.estado_partido === "programado"
        );

        setPartidos(partidosProgramados);
      } catch {
        // Cualquier error cae en el mensaje genérico pedido
        setError(
          "No perteneces a un equipo o tu equipo no tiene un torneo activo."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchPartidos();
  }, []);

  return (
    <main className="subpagina-container">
      <section className="fixture-header">
        <h1>
          <i className="bx bx-calendar"></i> Fixture del Torneo
        </h1>
        <p>Próximos partidos a disputarse en el torneo</p>
      </section>

      <section className="fixture-lista">
        <h2>Próximos Partidos</h2>
        <p className="fixture-sub">Calendario de encuentros programados</p>

        {loading && <p className="mensaje-info">Cargando partidos...</p>}

        {error && (
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
        )}

        {!loading && !error && partidos.length === 0 && (
          <p className="mensaje-info">
            No hay partidos programados actualmente.
          </p>
        )}

        {!loading &&
          !error &&
          partidos.map((partido) => (
            <div className="fixture-card" key={partido.id}>
              <div className="fixture-card-estado">
                <span className="jornada">Jornada {partido.jornada}</span>
                <span className={`estado ${partido.estado_partido}`}>
                  {partido.estado_partido}
                </span>
              </div>

              <h3>
                {partido.local?.equipo?.nombreEquipo || "Equipo Local"} vs{" "}
                {partido.visitante?.equipo?.nombreEquipo || "Equipo Visitante"}
              </h3>

              <div className="fixture-detalles">
                <p>
                  <i className="bx bx-calendar"></i>{" "}
                  {new Date(partido.fecha_partido).toLocaleDateString()}
                </p>
                <p>
                  <i className="bx bx-time"></i> {partido.hora_partido}
                </p>
                <p>
                  <i className="bx bx-map"></i>{" "}
                  {partido.cancha?.nombre || "Cancha"}
                </p>
              </div>
            </div>
          ))}
      </section>
    </main>
  );
}

export default FixtureTorneo;
