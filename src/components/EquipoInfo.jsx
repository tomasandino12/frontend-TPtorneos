import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiUsers, FiArrowLeft, FiEdit2, FiUpload, FiBarChart2, FiSearch, FiPlus } from "react-icons/fi";
import { apiFetch, apiFetchFormData, ASSETS_URL } from "../utils/api.js";
import { Button, TextField, Alert } from "./ui";

/**
 * Contenido de "detalle de un equipo" (header con escudo, descripción,
 * plantel + reclutamiento, historial de partidos). Reutilizado por:
 * - EquipoDetalle.jsx (ruta /equipo/:id, para ver CUALQUIER equipo —
 *   ej. desde un click en Tabla de Posiciones — de solo lectura si no sos
 *   el capitán de ese equipo).
 * - Equipos.jsx, cuando el jugador logueado ya tiene equipo: se renderiza
 *   directo para su propio equipo, sin el paso intermedio de "Ver mi equipo".
 *
 * Los controles de edición (escudo, descripción, agregar jugadores) solo
 * se renderizan si el jugador logueado es capitán de ESTE equipo — si no,
 * no aparecen (no alcanza con deshabilitarlos). Ese gating es de UI: no
 * reemplaza ninguna validación que deba existir del lado del servidor.
 */
export default function EquipoInfo({ equipoId, showVolver = true }) {
  const navigate = useNavigate();
  const [equipo, setEquipo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editandoDescripcion, setEditandoDescripcion] = useState(false);
  const [descripcionForm, setDescripcionForm] = useState("");
  const [guardandoDescripcion, setGuardandoDescripcion] = useState(false);
  const [descripcionFeedback, setDescripcionFeedback] = useState(null);
  const [subiendoEscudo, setSubiendoEscudo] = useState(false);
  const [escudoFeedback, setEscudoFeedback] = useState(null);

  // Reclutamiento (solo capitán)
  const [jugadoresSinEquipo, setJugadoresSinEquipo] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [filtrados, setFiltrados] = useState([]);
  const [agregarFeedback, setAgregarFeedback] = useState(null);

  const jugadorLogueado = JSON.parse(localStorage.getItem("jugador") || "null");
  const esMiEquipo = jugadorLogueado?.equipo?.id === Number(equipoId);
  const esCapitanDeEsteEquipo = !!jugadorLogueado?.esCapitan && esMiEquipo;

  useEffect(() => {
    const fetchEquipo = async () => {
      try {
        const response = await apiFetch(`/equipos/${equipoId}`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Error al cargar equipo");
        setEquipo(data.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (equipoId) fetchEquipo();
  }, [equipoId]);

  // Jugadores sin equipo, solo si el jugador logueado es capitán de este equipo
  useEffect(() => {
    if (!esCapitanDeEsteEquipo) return;
    apiFetch("/jugadores/sin-equipo")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.data)) {
          setJugadoresSinEquipo(data.data);
          setFiltrados(data.data);
        }
      })
      .catch((err) => console.error("Error cargando jugadores sin equipo:", err));
  }, [esCapitanDeEsteEquipo]);

  useEffect(() => {
    const resultado = jugadoresSinEquipo.filter((j) => {
      const nombreCompleto = `${j.nombre} ${j.apellido}`.toLowerCase();
      return nombreCompleto.includes(busqueda.toLowerCase());
    });
    setFiltrados(resultado);
  }, [busqueda, jugadoresSinEquipo]);

  const handleAgregar = async (idJugador) => {
    try {
      const response = await apiFetch(`/jugadores/${idJugador}`, {
        method: "PUT",
        body: JSON.stringify({
          equipo: equipoId,
          esCapitan: false,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Error al agregar jugador");

      setAgregarFeedback({ variant: "success", text: "Jugador agregado con éxito." });
      setJugadoresSinEquipo((prev) => prev.filter((j) => j.id !== idJugador));

      // Refrescar el equipo para que la lista de jugadores incluya al nuevo
      const res = await apiFetch(`/equipos/${equipoId}`);
      const dataEquipo = await res.json();
      if (res.ok) setEquipo(dataEquipo.data);
    } catch (error) {
      console.error("Error agregando jugador:", error);
      setAgregarFeedback({ variant: "error", text: "Error al agregar jugador: " + error.message });
    }
  };

  const handleEmpezarEdicionDescripcion = () => {
    setDescripcionForm(equipo.descripcion || "");
    setDescripcionFeedback(null);
    setEditandoDescripcion(true);
  };

  const handleGuardarDescripcion = async (e) => {
    e.preventDefault();
    setGuardandoDescripcion(true);
    try {
      const response = await apiFetch(`/equipos/${equipoId}`, {
        method: "PUT",
        body: JSON.stringify({ descripcion: descripcionForm }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Error al guardar la descripción");
      setEquipo({ ...equipo, descripcion: descripcionForm });
      setEditandoDescripcion(false);
    } catch (err) {
      setDescripcionFeedback({ variant: "error", text: err.message });
    } finally {
      setGuardandoDescripcion(false);
    }
  };

  const handleSubirEscudo = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "image/jpeg") {
      setEscudoFeedback({ variant: "error", text: "El escudo debe ser un archivo .jpg o .jpeg." });
      return;
    }

    const formData = new FormData();
    formData.append("escudo", file);

    setSubiendoEscudo(true);
    setEscudoFeedback(null);
    try {
      const response = await apiFetchFormData(`/equipos/${equipoId}/escudo`, formData);
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Error al subir el escudo");
      setEquipo({ ...equipo, escudoUrl: data.data.escudoUrl });
    } catch (err) {
      setEscudoFeedback({ variant: "error", text: err.message });
    } finally {
      setSubiendoEscudo(false);
      e.target.value = "";
    }
  };

  if (loading) return <p>Cargando...</p>;
  if (error) return <Alert variant="error">{error}</Alert>;
  if (!equipo) return <Alert variant="info">Equipo no encontrado.</Alert>;

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
    <>
      <section className="page-header equipo-detalle-header">
        <div>
          <h1 className="equipo-detalle-titulo">
            {equipo.escudoUrl ? (
              <img
                src={`${ASSETS_URL}${equipo.escudoUrl}`}
                alt={`Escudo de ${equipo.nombreEquipo}`}
                className="escudo-preview"
              />
            ) : (
              <span
                className="escudo-preview escudo-preview-empty"
                style={{ backgroundColor: equipo.colorPrimario || "#e5e7eb" }}
              />
            )}
            <FiUsers /> {equipo.nombreEquipo}
          </h1>
          <p>Gestión del equipo</p>
        </div>

        <div className="detalle-seccion-header">
          {esMiEquipo && (
            <Button
              variant="secondary"
              icon={<FiBarChart2 />}
              onClick={() => navigate("/gestorTorneos/estadisticas")}
              className="equipo-cross-link"
            >
              Ver estadísticas del equipo
            </Button>
          )}
          {showVolver && (
            <Button variant="ghost" icon={<FiArrowLeft />} onClick={() => navigate("/gestorTorneos")}>
              Volver al menú
            </Button>
          )}
        </div>

        {esCapitanDeEsteEquipo && (
          <div className="escudo-upload">
            <input
              id="escudo-input"
              type="file"
              accept=".jpg,.jpeg,image/jpeg"
              onChange={handleSubirEscudo}
              disabled={subiendoEscudo}
              className="escudo-input-hidden"
            />
            <label htmlFor="escudo-input" className="ui-btn ui-btn-secondary escudo-upload-btn">
              <FiUpload /> {subiendoEscudo ? "Subiendo..." : "Cambiar escudo (.jpg)"}
            </label>
            <span className="escudo-upload-hint">Se muestra arriba, junto al nombre del equipo</span>
          </div>
        )}
        {escudoFeedback && <Alert variant={escudoFeedback.variant}>{escudoFeedback.text}</Alert>}
      </section>

      {/* Sobre el equipo */}
      <section className="detalle-seccion">
        <h2 className="titulo-seccion">Sobre el equipo</h2>
        <div className="descripcion-seccion">
          {!editandoDescripcion ? (
            <>
              <p>{equipo.descripcion || "Este equipo todavía no tiene descripción."}</p>
              {esCapitanDeEsteEquipo && (
                <Button
                  variant="secondary"
                  icon={<FiEdit2 />}
                  onClick={handleEmpezarEdicionDescripcion}
                >
                  Editar descripción
                </Button>
              )}
            </>
          ) : (
            <form onSubmit={handleGuardarDescripcion}>
              <textarea
                value={descripcionForm}
                onChange={(e) => setDescripcionForm(e.target.value)}
                placeholder="Ej: Equipo de amigos, buena onda, nos gusta el juego asociado..."
              />
              {descripcionFeedback && (
                <Alert variant={descripcionFeedback.variant}>{descripcionFeedback.text}</Alert>
              )}
              <div className="descripcion-botones">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setEditandoDescripcion(false)}
                  disabled={guardandoDescripcion}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={guardandoDescripcion}>
                  {guardandoDescripcion ? "Guardando..." : "Guardar"}
                </Button>
              </div>
            </form>
          )}
        </div>
      </section>

      {/* Jugadores */}
      <section className="detalle-seccion">
        <h2 className="titulo-seccion">Jugadores</h2>
        {equipo.jugadores.length > 0 ? (
          <ul className="lista-plantel">
            {equipo.jugadores.map((jugador) => {
              const posicion = jugador.posicion ?? jugador.Posicion ?? "Sin posición";
              const fechaNacimiento =
                jugador.fechaNacimiento ??
                jugador.fecha_nacimiento ??
                jugador.fechaNac ??
                jugador.FechaNacimiento ??
                "";
              const edad = fechaNacimiento
                ? new Date().getFullYear() - new Date(fechaNacimiento).getFullYear()
                : null;

              return (
                <li key={jugador.id} className="jugador-plantel-item">
                  <div>
                    <strong>
                      {jugador.nombre} {jugador.apellido}{" "}
                      {jugador.esCapitan ? "(Capitán)" : ""}
                    </strong>
                    <p className="jugador-pos">{posicion}</p>
                  </div>
                  {edad !== null && <div className="jugador-edad stat-numeral">{edad} años</div>}
                </li>
              );
            })}
          </ul>
        ) : (
          <Alert variant="info">No hay jugadores registrados.</Alert>
        )}
      </section>

      {/* Agregar jugadores — solo el capitán de este equipo */}
      {esCapitanDeEsteEquipo && (
        <section className="detalle-seccion agregar-jugadores">
          <h2 className="titulo-seccion">Agregar jugadores</h2>
          <Alert variant="info">¿Necesitás encontrar jugadores para tu equipo?</Alert>

          <TextField
            icon={<FiSearch />}
            placeholder="Buscar por nombre o apellido"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />

          {agregarFeedback && (
            <div className="feedback-box">
              <Alert variant={agregarFeedback.variant}>{agregarFeedback.text}</Alert>
            </div>
          )}

          {filtrados.length > 0 ? (
            <ul className="lista-jugadores">
              {filtrados.map((j) => (
                <li key={j.id}>
                  {j.nombre} {j.apellido}
                  <Button icon={<FiPlus />} onClick={() => handleAgregar(j.id)}>
                    Agregar
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <Alert variant="info">No se encontraron jugadores sin equipo.</Alert>
          )}
        </section>
      )}

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
                  <td className="stat-numeral">
                    {partido.goles_local} - {partido.goles_visitante}
                  </td>
                  <td>{partido.visitante?.equipo?.nombreEquipo || "N/A"}</td>
                  <td>{partido.estado_partido}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <Alert variant="info">No hay partidos finalizados.</Alert>
        )}
      </section>
    </>
  );
}
