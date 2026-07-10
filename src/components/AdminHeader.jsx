import { useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FaSignOutAlt } from "react-icons/fa";
import "../styles/IndexStyle.css";
import "../styles/MenuAdmin.css";

const OTHER_NAV = [
  { label: "Arbitraje", icon: "bx-whistle",  path: "/admin/arbitros" },
  { label: "Canchas",   icon: "bx-football", path: null },
  { label: "Jugadores", icon: "bx-group",    path: null },
];

export default function AdminHeader({ admin, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [dropOpen, setDropOpen] = useState(false);
  const closeTimer = useRef(null);

  const openDrop  = () => { clearTimeout(closeTimer.current); setDropOpen(true); };
  const closeDrop = () => { closeTimer.current = setTimeout(() => setDropOpen(false), 120); };

  const isTorneos = location.pathname.startsWith("/admin/torneos");
  const initials = `${admin.nombre?.[0] ?? ""}${admin.apellido?.[0] ?? ""}`.toUpperCase();

  return (
    <nav className="navbar">
      <div className="navdiv">

        <div className="logo">
          <div
            className="logo-admin-wrap"
            onClick={() => navigate("/menu-admin")}
            style={{ cursor: "pointer" }}
          >
            <span className="logo-admin-text">Gestor de Torneos</span>
            <span className="admin-badge">ADMIN</span>
          </div>
        </div>

        <ul className="navlinks">
          {/* Dropdown: Mis Torneos */}
          <li
            style={{ position: "relative" }}
            onMouseEnter={openDrop}
            onMouseLeave={closeDrop}
          >
            <button className={`admin-nav-btn${isTorneos ? " active" : ""}`}>
              <i className="bx bx-trophy"></i>
              Mis Torneos
              <i className="bx bx-chevron-down admin-nav-chevron"></i>
            </button>

            {dropOpen && (
              <div className="admin-dropdown" onMouseEnter={openDrop} onMouseLeave={closeDrop}>
                <button
                  className="admin-dropdown-item"
                  onClick={() => { navigate("/admin/torneos"); setDropOpen(false); }}
                >
                  <div className="admin-dropdown-icon">
                    <i className="bx bx-list-ul"></i>
                  </div>
                  <div>
                    <span className="admin-dropdown-label">📋 Mis Torneos</span>
                    <span className="admin-dropdown-desc">Listá, editá o eliminá tus torneos</span>
                  </div>
                </button>
                <button
                  className="admin-dropdown-item"
                  onClick={() => { navigate("/admin/torneos/nuevo"); setDropOpen(false); }}
                >
                  <div className="admin-dropdown-icon">
                    <i className="bx bx-plus-circle"></i>
                  </div>
                  <div>
                    <span className="admin-dropdown-label">➕ Crear Torneo</span>
                    <span className="admin-dropdown-desc">Nuevo certamen desde cero</span>
                  </div>
                </button>
              </div>
            )}
          </li>

          {OTHER_NAV.map(({ label, icon, path }) => (
            <li key={label}>
              <button
                className="admin-nav-btn"
                onClick={() => navigate(path ?? "/menu-admin")}
              >
                <i className={`bx ${icon}`}></i>
                {label}
              </button>
            </li>
          ))}
        </ul>

        <div className="nav-actions">
          <div className="admin-user-info">
            <div className="admin-avatar">{initials}</div>
            <div className="admin-user-text">
              <span className="admin-user-name">{admin.nombre} {admin.apellido}</span>
              <span className="admin-user-role">Administrador</span>
            </div>
            <button className="btn-logout" onClick={onLogout}>
              <FaSignOutAlt />
              Cerrar sesión
            </button>
          </div>
        </div>

      </div>
    </nav>
  );
}
