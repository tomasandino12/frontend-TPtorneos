import { useState, useEffect, useMemo } from "react";
import "../styles/FixtureTorneo.css";
import "../styles/IndexStyle.css";
import { FiCalendar, FiClock, FiMapPin } from "react-icons/fi";
import { apiFetch } from "../utils/api.js";
import { Alert, PageShell, PageHero } from "../components/ui";

function FixtureTorneo() {
  const [partidos, setPartidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [jornadaSeleccionada, setJornadaSeleccionada] = useState("todas");

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
        const resEquipo = await apiFetch(`/equipos/${equipoId}`);
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
          return typeof t === "object" && t.estado === "en_curso";
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
        const response = await apiFetch(`/partidos/torneo/${torneoId}`);
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

  const jornadasDisponibles = useMemo(
    () => [...new Set(partidos.map((p) => p.jornada))].sort((a, b) => a - b),
    [partidos]
  );

  const partidosFiltrados = useMemo(
    () =>
      jornadaSeleccionada === "todas"
        ? partidos
        : partidos.filter((p) => p.jornada === Number(jornadaSeleccionada)),
    [partidos, jornadaSeleccionada]
  );

  return (
    <PageShell>
      <PageHero icon={<FiCalendar />} title="Fixture del Torneo" subtitle="Próximos partidos a disputarse en el torneo">
      <section className="fixture-lista">
        <h2>Próximos Partidos</h2>
        <p className="fixture-sub">Calendario de encuentros programados</p>

        {!loading && !error && jornadasDisponibles.length > 0 && (
          <div className="fixture-filtro">
            <label htmlFor="filtro-jornada">Filtrar por jornada</label>
            <select
              id="filtro-jornada"
              className="fixture-filtro-select"
              value={jornadaSeleccionada}
              onChange={(e) => setJornadaSeleccionada(e.target.value)}
            >
              <option value="todas">Todas las jornadas</option>
              {jornadasDisponibles.map((j) => (
                <option key={j} value={j}>
                  Jornada {j}
                </option>
              ))}
            </select>
          </div>
        )}

        {loading && <p className="mensaje-info">Cargando partidos...</p>}

        {error && (
          <Alert variant="error">
            <strong>No perteneces a un equipo o tu equipo no tiene un torneo activo</strong>
            <p>
              Uníte o creá un equipo, o participá de un torneo activo para
              visualizar los próximos encuentros.
            </p>
          </Alert>
        )}

        {!loading && !error && partidos.length === 0 && (
          <Alert variant="info">No hay partidos programados actualmente.</Alert>
        )}

        {!loading &&
          !error &&
          partidos.length > 0 &&
          partidosFiltrados.length === 0 && (
            <Alert variant="info">No hay partidos programados para esa jornada.</Alert>
          )}

        {!loading &&
          !error &&
          partidosFiltrados.map((partido) => (
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
                  <FiCalendar /> {new Date(partido.fecha_partido).toLocaleDateString()}
                </p>
                <p>
                  <FiClock /> {partido.hora_partido}
                </p>
                <p>
                  <FiMapPin /> {partido.cancha?.nombre || "Cancha"}
                </p>
              </div>
            </div>
          ))}
      </section>
      </PageHero>
    </PageShell>
  );
}

export default FixtureTorneo;
