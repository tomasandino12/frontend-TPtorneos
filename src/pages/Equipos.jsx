import "../styles/IndexStyle.css";
import "../styles/Equipos.css";
import { useState} from "react";

function Equipos() {
  const [jugadores, setJugadores] = useState([]);
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");

  // ⚠️ Simulación por ahora (después se reemplaza con fetch al backend)
  const [tieneEquipo] = useState(true);
 // ← cambiá a false para testear

  const handleAgregar = (e) => {
    e.preventDefault();
    if (nombre && apellido) {
      setJugadores([...jugadores, { nombre, apellido }]);
      setNombre("");
      setApellido("");
    }
  };

  const handleCrearEquipo = () => {
    if (tieneEquipo) {
      alert("Ya perteneces a un equipo.");
    } else {
      console.log("Abrir formulario de creación de equipo...");
      // Acá podrías abrir un modal, redirigir, etc.
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
        <button className="btn-crear-equipo" onClick={handleCrearEquipo}>
          <i className="bx bx-plus"></i> Crear Equipo
        </button>
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
