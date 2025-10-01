import { Outlet, NavLink } from "react-router-dom";
import "../styles/IndexStyle.css"; // si querés, después podés mover esto a GestorTorneos.css
import { FaTrophy, FaChartBar, FaCalendarAlt, FaUsers, FaUser } from "react-icons/fa";

function GestorTorneos() {
  return (
    <div className="IndexPage">
      <nav className="navbar">
        <div className="navdiv">
          <div className="logo">
            <NavLink to="/gestorTorneos" end>Gestor de Torneos</NavLink>
          </div>
          <ul className="navlinks">
            <li>
              <NavLink to="/gestorTorneos" end>
                <FaTrophy />
                Tabla de Posiciones
              </NavLink>
            </li>
            <li>
              <NavLink to="/gestorTorneos/estadisticas">
                <FaChartBar />
                Estadísticas
              </NavLink>
            </li>
            <li>
              <NavLink to="/gestorTorneos/fixture">
                <FaCalendarAlt />
                Fixture
              </NavLink>
            </li>
            <li>
              <NavLink to="/gestorTorneos/equipos">
                <FaUsers />
                Equipos
              </NavLink>
            </li>
            <li>
              <NavLink to="/gestorTorneos/miPerfil">
                <FaUser />
                Mi Perfil
              </NavLink>
            </li>
          </ul>
        </div>
      </nav>

      <main>
        <Outlet />
      </main>

      <footer>
        <h5>© 2025 - Gestor de Torneos...</h5>
      </footer>
    </div>
  );
}

export default GestorTorneos;
