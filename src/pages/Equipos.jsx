import "../styles/IndexStyle.css";
import "../styles/Equipos.css";
import { useState, useEffect } from "react";

function Equipos() {
  const [jugadores, setJugadores] = useState([]);
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");

  const [jugador, setJugador] = useState(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [nombreEquipo, setNombreEquipo] = useState("");
  const [colorCamiseta, setColorCamiseta] = useState("");

  // 👇 nuevos estados para la búsqueda de jugadores sin equipo
  const [jugadoresSinEquipo, setJugadoresSinEquipo] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [filtrados, setFiltrados] = useState([]);

  // Cargar el jugador logueado desde localStorage
  useEffect(() => {
    const jugadorGuardado = JSON.parse(localStorage.getItem("jugador"));
    if (jugadorGuardado) setJugador(jugadorGuardado);
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

  if (!nombreEquipo || !colorCamiseta) {
    alert("Completá todos los campos.");
    return;
  }

  if (!jugador || !jugador.id) {
    alert("⚠️ No hay jugador logueado. Iniciá sesión nuevamente.");
    return;
  }

  try {
      const response = await fetch("http://localhost:3000/api/equipos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nombreEquipo,
        colorCamiseta,
        idJugador: jugador.id,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Error al crear equipo");
    }

    const data = await response.json();
    alert("✅ Equipo creado con éxito");

    const jugadorActualizado = {
      ...jugador,
      equipo: data.data,
      esCapitan: true,
    };

    localStorage.setItem("jugador", JSON.stringify(jugadorActualizado));
    setJugador(jugadorActualizado);

    setNombreEquipo("");
    setColorCamiseta("");
    setMostrarFormulario(false);
  } catch (error) {
    console.error("Error:", error);
    alert("❌ Error al crear equipo: " + error.message);
  }
};


   // === Cargar jugadores sin equipo (solo si es capitán) ===
  useEffect(() => {
    if (jugador?.esCapitan) {
      fetch("http://localhost:3000/api/jugadores/sin-equipo")
        .then((res) => res.json())
        .then((data) => {
          setJugadoresSinEquipo(data);
          setFiltrados(data);
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
  try {
    const response = await fetch(`http://localhost:3000/api/jugadores/${idJugador}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        equipo: jugador.equipo.id,
        esCapitan: false,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Error al agregar jugador");
    }

    alert("✅ Jugador agregado con éxito");

    // actualizar las listas locales
    setJugadores([...jugadores, filtrados.find((j) => j.id === idJugador)]);
    setJugadoresSinEquipo(jugadoresSinEquipo.filter((j) => j.id !== idJugador));
  } catch (error) {
    console.error("Error agregando jugador:", error);
    alert("❌ Error al agregar jugador: " + error.message);
  }
};

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
                <label>Color de Camiseta</label>
                <input
                  type="text"
                  value={colorCamiseta}
                  onChange={(e) => setColorCamiseta(e.target.value)}
                  required
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

      {/* === Agregar jugadores (solo si es capitán) === */}
      {jugador?.esCapitan && (
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
      {jugador?.equipo && !jugador?.esCapitan && (
        <section className="agregar-jugadores">
          <p>⚽ Ya perteneces a un equipo. Solo el capitán puede agregar jugadores.</p>
        </section>
      )}
    </main>
  );
}

export default Equipos;