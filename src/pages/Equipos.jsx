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

  // === Agregar jugadores (solo si es capitán) ===
  const handleAgregar = (e) => {
    e.preventDefault();
    if (nombre && apellido) {
      setJugadores([...jugadores, { nombre, apellido }]);
      setNombre("");
      setApellido("");
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

      {/* === Agregar jugadores === */}
      {jugador?.esCapitan && (
        <section className="agregar-jugadores">
          <p className="subtexto-busqueda">¿Necesitás encontrar jugadores para tu equipo?</p>
          <h3>Ingresar nombre del Jugador que desea agregar a su Equipo</h3>
          <form id="form-jugador" onSubmit={handleAgregar}>
            <input
              type="text"
              placeholder="Nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
            />
            <input
              type="text"
              placeholder="Apellido"
              value={apellido}
              onChange={(e) => setApellido(e.target.value)}
              required
            />
            <button type="submit">Agregar</button>
          </form>

          {jugadores.length > 0 && (
            <>
              <h2>Jugadores del Equipo</h2>
              <ul id="lista-jugadores">
                {jugadores.map((j, index) => (
                  <li key={index}>{j.nombre} {j.apellido}</li>
                ))}
              </ul>
            </>
          )}
        </section>
      )}

      {/* Mensaje para quienes no son capitanes */}
      {jugador?.equipo && !jugador?.esCapitan && (
        <section className="agregar-jugadores">
          <p>⚽ Ya perteneces a un equipo. Solo el capitán puede agregar jugadores.</p>
        </section>
      )}
    </main>
  );
}

export default Equipos;
