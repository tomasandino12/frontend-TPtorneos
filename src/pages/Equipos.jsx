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
        <footer>
            <h5> © 2025 - Gestor de Torneos -Para mas información o problemas con la página contactate a: 341 6173297 o a nuestra cuenta de instagram @todotorneos </h5>
        </footer>
    </div>
  );
}

export default Equipos;
