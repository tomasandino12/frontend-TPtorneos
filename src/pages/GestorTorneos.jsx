import "../styles/IndexStyle.css";
import { Link, NavLink } from "react-router-dom";

function GestorTorneos() {
  return (
    <div className="IndexPage">
        <main>
            <p>Este es un párrafo para probar cosas como la <b>negrita</b> o la <i>inclinada</i> y la <small>chiquita</small> </p>
            <h3>Ingresar nombre del equipo</h3>
            <form>
                <input type="" name="Nombre de equipo" required="" />
                <input type="submit" />
            </form>
        </main>
        <footer>
            <h5> © 2025 - Gestor de Torneos -Para mas información o problemas con la página contactate a: 341 6173297 o a nuestra cuenta de instagram @todotorneos </h5>
        </footer>
    </div>
  );
}

export default GestorTorneos;