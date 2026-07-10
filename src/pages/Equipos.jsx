import "../styles/IndexStyle.css";
import "../styles/Equipos.css";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../utils/api.js";

function Equipos() {
  const navigate = useNavigate();
  const [jugadores, setJugadores] = useState([]);
  const [jugador, setJugador] = useState(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [nombreEquipo, setNombreEquipo] = useState("");
  const [colorPrimario, setColorPrimario] = useState("#ffffff");
  const [colorSecundario, setColorSecundario] = useState("#000000");
  const [descripcion, setDescripcion] = useState("");

  // 👇 nuevos estados para la búsqueda de jugadores sin equipo
  const [jugadoresSinEquipo, setJugadoresSinEquipo] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [filtrados, setFiltrados] = useState([]);

  // === Cargar jugador logueado ===
  useEffect(() => {
    try {
      const jugadorGuardado = JSON.parse(localStorage.getItem("jugador"));
      if (jugadorGuardado) {
        setJugador(jugadorGuardado);
      }
    } catch (error) {
      console.error("Error al cargar jugador desde localStorage:", error);
      setJugador(null);
    }
  }, []);

  // === Crear equipo ===
  const handleCrearEquipoClick = () => {
    if (jugador?.equipo) {
      alert("⚠️ Ya perteneces a un equipo.");
    } else {
      setMostrarFormulario(true);
    }
  };

  const handleSubmitEquipo = async (e) => {
    e.preventDefault();

    if (!nombreEquipo || !colorPrimario || !colorSecundario) {
      alert("Completá todos los campos.");
      return;
    }

    if (!jugador || !jugador.id) {
      alert("⚠️ No hay jugador logueado. Iniciá sesión nuevamente.");
      return;
    }

    try {
      const response = await apiFetch("/equipos", {
        method: "POST",
        body: JSON.stringify({
          nombreEquipo,
          colorPrimario,
          colorSecundario,
          descripcion,
          idJugador: jugador.id,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Error al crear equipo");

      alert("✅ Equipo creado con éxito");

      const jugadorActualizado = {
        ...jugador,
        equipo: data.data,
        esCapitan: true,
      };

      localStorage.setItem("jugador", JSON.stringify(jugadorActualizado));
      setJugador(jugadorActualizado);
      setNombreEquipo("");
      setColorPrimario("#ffffff");
      setColorSecundario("#000000");
      setDescripcion("");
      setMostrarFormulario(false);
    } catch (error) {
      console.error("Error:", error);
      alert("❌ Error al crear equipo: " + error.message);
    }
  };

  // === Cargar jugadores sin equipo (solo si es capitán) ===
  useEffect(() => {
    if (jugador?.esCapitan) {
      apiFetch("/jugadores/sin-equipo")
        .then((res) => res.json())
        .then((data) => {
          // 🔒 validamos que sea un array
          if (Array.isArray(data.data)) {
            setJugadoresSinEquipo(data.data);
            setFiltrados(data.data);
          }
        })
        .catch((err) =>
          console.error("Error cargando jugadores sin equipo:", err)
        );
    }
  }, [jugador]);

  // === Filtrar jugadores sin equipo ===
  useEffect(() => {
    const resultado = jugadoresSinEquipo.filter((j) => {
      const nombreCompleto = `${j.nombre} ${j.apellido}`.toLowerCase();
      return nombreCompleto.includes(busqueda.toLowerCase());
    });
    setFiltrados(resultado);
  }, [busqueda, jugadoresSinEquipo]);

  // === Agregar jugador al equipo ===
  const handleAgregar = async (idJugador) => {
    if (!jugador?.equipo?.id) {
      alert("⚠️ No se puede agregar jugadores: no hay equipo activo.");
      return;
    }

    try {
      const response = await apiFetch(`/jugadores/${idJugador}`, {
        method: "PUT",
        body: JSON.stringify({
          equipo: jugador.equipo.id,
          esCapitan: false,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Error al agregar jugador");

      alert("✅ Jugador agregado con éxito");

      // actualizar listas locales
      setJugadores([...jugadores, filtrados.find((j) => j.id === idJugador)]);
      setJugadoresSinEquipo(jugadoresSinEquipo.filter((j) => j.id !== idJugador));
    } catch (error) {
      console.error("Error agregando jugador:", error);
      alert("❌ Error al agregar jugador: " + error.message);
    }
  };

  // === Seguridad adicional: render condicional si no hay jugador cargado ===
  if (!jugador) {
    return (
      <main className="subpagina-container">
        <p style={{ textAlign: "center", marginTop: "2rem" }}>
          ⚠️ No se encontró información del jugador. Iniciá sesión nuevamente.
        </p>
      </main>
    );
  }

  return (
    <main className="subpagina-container">
      <section className="equipos-header">
        <h1><i className="bx bx-group"></i> Gestión de Equipos</h1>
        <p>Crea tu equipo o únete a uno existente</p>
      </section>

      {/* === Crear equipo === */}
      {!jugador?.equipo && (
        <section className="crear-equipo-card">
          <h2>Crear Nuevo Equipo</h2>
          <p>Forma tu propio equipo e invita jugadores</p>
          <button className="btn-crear-equipo" onClick={handleCrearEquipoClick}>
            <i className="bx bx-plus"></i> Crear Equipo
          </button>

          {mostrarFormulario && (
            <div className="modal-crear-equipo">
              <form className="formulario-crear-equipo" onSubmit={handleSubmitEquipo}>
                <h3>Nuevo Equipo</h3>
                <label>Nombre del Equipo</label>
                <input
                  type="text"
                  value={nombreEquipo}
                  onChange={(e) => setNombreEquipo(e.target.value)}
                  required
                />
                <div className="color-pickers-grupo">
                  <div className="color-picker-item">
                    <label>Color Primario</label>
                    <input
                      type="color"
                      value={colorPrimario}
                      onChange={(e) => setColorPrimario(e.target.value)}
                    />
                  </div>
                  <div className="color-picker-item">
                    <label>Color Secundario</label>
                    <input
                      type="color"
                      value={colorSecundario}
                      onChange={(e) => setColorSecundario(e.target.value)}
                    />
                  </div>
                </div>
                <label>Descripción</label>
                <textarea
                  placeholder="Ej: Equipo de amigos, buena onda, nos gusta el juego asociado..."
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                />
                <div className="formulario-botones">
                  <button type="submit">Crear</button>
                  <button type="button" onClick={() => setMostrarFormulario(false)}>Cancelar</button>
                </div>
              </form>
            </div>
          )}
        </section>
      )}

      {/* === Ver mi equipo (siempre visible si ya pertenece a uno) === */}
      {jugador?.equipo?.id && (
        <section className="crear-equipo-card">
          <h2>{jugador.equipo.nombreEquipo}</h2>
          <p>Descripción, escudo, jugadores e historial de tu equipo</p>
          <button
            className="btn-crear-equipo"
            onClick={() => navigate(`/equipo/${jugador.equipo.id}`)}
          >
            <i className="bx bx-shield"></i> Ver mi equipo
          </button>
        </section>
      )}

      {/* === Agregar jugadores (solo si es capitán) === */}
      {jugador?.equipo?.id && jugador?.esCapitan && (
        <section className="agregar-jugadores">
          <p className="subtexto-busqueda">¿Necesitás encontrar jugadores para tu equipo?</p>
          <h3>Buscar jugadores sin equipo</h3>

          <input
            type="text"
            placeholder="Buscar por nombre o apellido"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />

          {filtrados.length > 0 ? (
            <ul className="lista-jugadores">
              {filtrados.map((j) => (
                <li key={j.id}>
                  {j.nombre} {j.apellido}
                  <button
                    className="btn-agregar"
                    onClick={() => handleAgregar(j.id)}
                  >
                    ➕ Agregar
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p>No se encontraron jugadores sin equipo.</p>
          )}
        </section>
      )}

      {/* === Mensaje para jugadores no capitanes === */}
      {jugador?.equipo?.id && !jugador?.esCapitan && (
        <section className="agregar-jugadores">
          <p>⚽ Ya perteneces a un equipo. Solo el capitán puede agregar jugadores.</p>
        </section>
      )}
    </main>
  );
}

export default Equipos;
