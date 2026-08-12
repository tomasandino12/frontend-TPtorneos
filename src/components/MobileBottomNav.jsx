import { NavLink } from "react-router-dom";
import { NAV_ITEMS } from "./Navbar.jsx";
import "../styles/MobileBottomNav.css";

/**
 * Barra de navegación inferior — solo visible por debajo de 768px (ver
 * MobileBottomNav.css). Consume la misma NAV_ITEMS que el Navbar de
 * escritorio: son exactamente los mismos 5 destinos, sin duplicar la lista.
 */
export default function MobileBottomNav() {
  return (
    <nav className="gt-bottomnav" aria-label="Navegación principal">
      <ul className="gt-bottomnav-list">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.end}
                className={({ isActive }) => `gt-bottomnav-link${isActive ? " active" : ""}`}
              >
                <Icon className="gt-bottomnav-icon" />
                <span className="gt-bottomnav-label">{item.shortLabel ?? item.label}</span>
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
