import { Outlet, NavLink, useNavigate } from "react-router-dom";
import "../styles/IndexStyle.css"; // si querés, después podés mover esto a GestorTorneos.css
import { FaTrophy, FaChartBar, FaCalendarAlt, FaUsers, FaUser, FaSignOutAlt } from "react-icons/fa";

function GestorTorneos() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("jugador");
    navigate("/");
  };

  return (
    <div className="layout">
      <nav className="navbar">
        <div className="navdiv">
          <div className="logo">
            <NavLink to="/gestorTorneos/inicio">Gestor de Torneos</NavLink>
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
          <div className="nav-actions">
            <button className="btn-logout" onClick={handleLogout}>
              <FaSignOutAlt />
              Cerrar sesión
            </button>
          </div>
        </div>
      </nav>

      <main className="content">
        <Outlet />
      </main>

      <footer className="footer">
        <h5>© 2025 - Gestor de Torneos -Para mas información o problemas con la página contactate a: 341 6173297 o a nuestra cuenta de instagram @todotorneos</h5>
      </footer>
    </div>
  );
}

export default GestorTorneos;
