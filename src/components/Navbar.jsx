import { NavLink, useNavigate } from "react-router-dom";
import { FiAward, FiBarChart2, FiCalendar, FiUsers, FiUser, FiLogOut } from "react-icons/fi";
import NotificationBell from "./NotificationBell.jsx";
import "../styles/Navbar.css";

const NAV_ITEMS = [
  { to: "/gestorTorneos", end: true, icon: FiAward, label: "Tabla de Posiciones" },
  { to: "/gestorTorneos/estadisticas", icon: FiBarChart2, label: "Estadísticas" },
  { to: "/gestorTorneos/fixture", icon: FiCalendar, label: "Fixture" },
  { to: "/gestorTorneos/equipos", icon: FiUsers, label: "Equipos" },
  { to: "/gestorTorneos/miPerfil", icon: FiUser, label: "Mi Perfil" },
];

/**
 * Navbar principal de la app (jugador/capitán) — compartida por las 7 pantallas
 * de esta sección. Antes vivía inline dentro de GestorTorneos.jsx y no se
 * renderizaba en absoluto en EquipoDetalle (ruta fuera del layout); ahora es un
 * componente único que ambas usan.
 */
export default function Navbar() {
  const navigate = useNavigate();
  const jugador = JSON.parse(localStorage.getItem("jugador") || "null");
  const initials = jugador
    ? `${jugador.nombre?.[0] ?? ""}${jugador.apellido?.[0] ?? ""}`.toUpperCase()
    : "";

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("jugador");
    navigate("/");
  };

  return (
    <nav className="gt-navbar">
      <div className="gt-navbar-inner">
        <NavLink to="/gestorTorneos/inicio" className="gt-logo">
          Gestor<span>Torneos</span>
        </NavLink>

        <ul className="gt-navlinks">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.to}>
                <NavLink to={item.to} end={item.end}>
                  <Icon />
                  {item.label}
                </NavLink>
              </li>
            );
          })}
        </ul>

        <div className="gt-nav-actions">
          <NotificationBell />
          {jugador && (
            <div className="gt-user-info">
              <div className="gt-avatar">{initials}</div>
              <div className="gt-user-text">
                <span className="gt-user-name">
                  {jugador.nombre} {jugador.apellido}
                </span>
                {jugador.email && <span className="gt-user-email">{jugador.email}</span>}
              </div>
            </div>
          )}
          <button className="gt-logout-btn" onClick={handleLogout}>
            <FiLogOut />
            Cerrar sesión
          </button>
        </div>
      </div>
    </nav>
  );
}
