import "../styles/IndexStyle.css";
import "../styles/Equipos.css";
import { useState } from "react";

function Equipos() {
  const [jugadores, setJugadores] = useState([]);
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [equipo, setEquipo] = useState(""); // ← simulamos que no tiene equipo

  // Nueva lógica para crear equipo
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [nombreEquipo, setNombreEquipo] = useState("");
  const [colorCamiseta, setColorCamiseta] = useState("");

  const handleAgregar = (e) => {
    e.preventDefault();
    if (nombre && apellido) {
      setJugadores([...jugadores, { nombre, apellido }]);
      setNombre("");
      setApellido("");
    }
  };

  const handleCrearEquipoClick = () => {
    if (equipo) {
      alert("Ya perteneces a un equipo.");
    } else {
      setMostrarFormulario(true);
    }
  };

  const handleSubmitEquipo = (e) => {
    e.preventDefault();
    if (nombreEquipo && colorCamiseta) {
      // Simulamos creación
      alert("✅ Equipo creado con éxito");
      setEquipo(nombreEquipo); // seteamos el nombre como si se hubiera creado
      setMostrarFormulario(false);
      // limpiar campos
      setNombreEquipo("");
      setColorCamiseta("");
    }
  };

  return (
    <div className="equipos-page">
      <section className="equipos-header">
        <h1><i className="bx bx-group"></i> Gestión de Equipos</h1>
        <p>Crea tu equipo o únete a uno existente</p>
      </section>

      <section className="crear-equipo-card">
        <h2>Crear Nuevo Equipo</h2>
        <p>Forma tu propio equipo e invita jugadores</p>
        <button className="btn-crear-equipo" onClick={handleCrearEquipoClick}>
          <i className="bx bx-plus"></i> Crear Equipo
        </button>

        {/* MINI FORMULARIO FLOTANTE */}
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
    </div>
  );
}

export default Equipos;
