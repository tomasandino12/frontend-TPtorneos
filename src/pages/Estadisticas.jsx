import "../styles/IndexStyle.css";
import { Link } from "react-router-dom";

function Estadisticas() {
  return (
    <div className="Estadisticas">
        <main>
            <p>ESTA ES LA PARTE DE ESTADISTICAS </p>
            <h3>Ingresar nombre del equipo</h3>
            <form>
                <input type="" name="Nombre de equipo" required="" />
                <input type="submit" />
            </form>
        </main>
    </div>
  );
}

export default Estadisticas;