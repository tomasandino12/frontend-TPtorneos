import "../styles/IndexStyle.css";
import "../styles/Equipos.css";
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiFetch, apiFetchFormData, ASSETS_URL } from "../utils/api.js";

function EquipoDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [equipo, setEquipo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editandoDescripcion, setEditandoDescripcion] = useState(false);
  const [descripcionForm, setDescripcionForm] = useState("");
  const [guardandoDescripcion, setGuardandoDescripcion] = useState(false);
  const [subiendoEscudo, setSubiendoEscudo] = useState(false);

  const jugadorLogueado = JSON.parse(localStorage.getItem("jugador") || "null");
  const esCapitanDeEsteEquipo =
    !!jugadorLogueado?.esCapitan &&
    jugadorLogueado?.equipo?.id === Number(id);

  useEffect(() => {
    const fetchEquipo = async () => {
      try {
        const response = await apiFetch(`/equipos/${id}`);
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

  const handleEmpezarEdicionDescripcion = () => {
    setDescripcionForm(equipo.descripcion || "");
    setEditandoDescripcion(true);
  };

  const handleGuardarDescripcion = async (e) => {
    e.preventDefault();
    setGuardandoDescripcion(true);
    try {
      const response = await apiFetch(`/equipos/${id}`, {
        method: "PUT",
        body: JSON.stringify({ descripcion: descripcionForm }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Error al guardar la descripción");
      setEquipo({ ...equipo, descripcion: descripcionForm });
      setEditandoDescripcion(false);
    } catch (err) {
      alert("❌ " + err.message);
    } finally {
      setGuardandoDescripcion(false);
    }
  };

  const handleSubirEscudo = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "image/jpeg") {
      alert("❌ El escudo debe ser un archivo .jpg o .jpeg.");
      return;
    }

    const formData = new FormData();
    formData.append("escudo", file);

    setSubiendoEscudo(true);
    try {
      const response = await apiFetchFormData(`/equipos/${id}/escudo`, formData);
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Error al subir el escudo");
      setEquipo({ ...equipo, escudoUrl: data.data.escudoUrl });
    } catch (err) {
      alert("❌ " + err.message);
    } finally {
      setSubiendoEscudo(false);
      e.target.value = "";
    }
  };

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
            {equipo.escudoUrl ? (
              <img
                src={`${ASSETS_URL}${equipo.escudoUrl}`}
                alt={`Escudo de ${equipo.nombreEquipo}`}
                className="escudo-img"
              />
            ) : (
              <span
                className="escudo-fallback-dot"
                style={{ backgroundColor: equipo.colorPrimario || "#e5e7eb" }}
              />
            )}{" "}
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

        {esCapitanDeEsteEquipo && (
          <div className="escudo-upload">
            <label htmlFor="escudo-input">Escudo del equipo (.jpg):</label>
            <input
              id="escudo-input"
              type="file"
              accept=".jpg,.jpeg,image/jpeg"
              onChange={handleSubirEscudo}
              disabled={subiendoEscudo}
            />
            {subiendoEscudo && <span>Subiendo...</span>}
          </div>
        )}
      </section>

      {/* Sobre el equipo */}
      <section className="detalle-seccion">
        <h2 className="titulo-seccion">Sobre el equipo</h2>
        <div className="descripcion-seccion">
          {!editandoDescripcion ? (
            <>
              <p>{equipo.descripcion || "Este equipo todavía no tiene descripción."}</p>
              {esCapitanDeEsteEquipo && (
                <button
                  className="btn-editar-descripcion"
                  onClick={handleEmpezarEdicionDescripcion}
                >
                  ✏️ Editar descripción
                </button>
              )}
            </>
          ) : (
            <form onSubmit={handleGuardarDescripcion}>
              <textarea
                value={descripcionForm}
                onChange={(e) => setDescripcionForm(e.target.value)}
                placeholder="Ej: Equipo de amigos, buena onda, nos gusta el juego asociado..."
              />
              <div className="descripcion-botones">
                <button
                  type="button"
                  onClick={() => setEditandoDescripcion(false)}
                  disabled={guardandoDescripcion}
                >
                  Cancelar
                </button>
                <button type="submit" disabled={guardandoDescripcion}>
                  {guardandoDescripcion ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </form>
          )}
        </div>
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
