import { Outlet, NavLink } from "react-router-dom";

export default function Layout() {
  return (
    <>
      <nav className="navbar">
        <div className="navdiv">
          <div className="logo">
            <NavLink to="/gestorTorneos">Gestor de Torneos</NavLink>
          </div>
          <ul className="navlinks">
            <li>
              <NavLink
                to="/gestorTorneos"
                className={({ isActive }) => (isActive ? "active" : "")}
              >
                Tabla de Posiciones
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/estadisticas"
                className={({ isActive }) => (isActive ? "active" : "")}
              >
                Estadísticas
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/fixture"
                className={({ isActive }) => (isActive ? "active" : "")}
              >
                Fixture
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/equipos"
                className={({ isActive }) => (isActive ? "active" : "")}
              >
                Equipos
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/miPerfil"
                className={({ isActive }) => (isActive ? "active" : "")}
              >
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
        <p>© 2025 MiApp - Todos los derechos reservados</p>
      </footer>
    </>
  );
}

