import "../styles/IndexStyle.css";
import { Link } from "react-router-dom";

function Equipos() {
  return (
    <div className="Equipos">
        <main>
            <p>ESTA ES LA PARTE DE EQUIPOS </p>
            <h3>Ingresar nombre del Jugador que desea agregar a su Equipo</h3>
            <form id="form-jugador">
                <input type="text" id="nombre" placeholder="Nombre" required />
                <input type="text" id="apellido" placeholder="Apellido" required />
                <button type="submit">Agregar</button>
            </form>
            <h2>Jugadores del Equipo</h2>
            <ul id="lista-jugadores"></ul>
        </main>
    </div>
  );
}

export default Equipos;
