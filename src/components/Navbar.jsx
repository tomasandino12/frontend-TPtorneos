import { useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { FiAward, FiBarChart2, FiCalendar, FiUsers, FiUser, FiLogOut } from "react-icons/fi";
import NotificationBell from "./NotificationBell.jsx";
import AccountSheet from "./AccountSheet.jsx";
import "../styles/Navbar.css";

export const NAV_ITEMS = [
  // shortLabel: solo para MobileBottomNav.jsx (una palabra, no se parte en
  // dos líneas en el espacio angosto de la barra inferior). El navbar de
  // escritorio sigue usando `label` completo, que tiene lugar de sobra.
  { to: "/gestorTorneos", end: true, icon: FiAward, label: "Tabla de Posiciones", shortLabel: "Posiciones" },
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
 *
 * Mobile (<768px): header compacto de 56px, solo logo + campana + avatar (ver
 * Navbar.css). Los links pasan a MobileBottomNav y "Cerrar sesión" se muda a
 * la hoja de cuenta que abre el avatar — el botón rojo desaparece del header.
 */
export default function Navbar() {
  const navigate = useNavigate();
  const jugador = JSON.parse(localStorage.getItem("jugador") || "null");
  const initials = jugador
    ? `${jugador.nombre?.[0] ?? ""}${jugador.apellido?.[0] ?? ""}`.toUpperCase()
    : "";

  const [cuentaAbierta, setCuentaAbierta] = useState(false);
  const avatarBtnRef = useRef(null);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("jugador");
    navigate("/");
  };

  const handleCerrarCuenta = () => {
    setCuentaAbierta(false);
    avatarBtnRef.current?.focus();
  };

  return (
    <>
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
                <button
                  type="button"
                  className="gt-avatar-btn"
                  ref={avatarBtnRef}
                  onClick={() => setCuentaAbierta(true)}
                  aria-label="Cuenta"
                >
                  <span className="gt-avatar">{initials}</span>
                </button>
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

      <AccountSheet
        open={cuentaAbierta}
        onClose={handleCerrarCuenta}
        jugador={jugador}
        onLogout={handleLogout}
      />
    </>
  );
}
