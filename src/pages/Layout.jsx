import { Outlet, NavLink } from "react-router-dom";

export default function Layout() {
  return (
    <div id="root">
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
        © 2025 - Gestor de Torneos -Para mas información o problemas con la página contactate a: 341 6173297 o a nuestra cuenta de instagram @todotorneos
      </footer>
    </div>
  );
}

