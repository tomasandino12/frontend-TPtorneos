import "../styles/IndexStyle.css";
import "../styles/MenuAdmin.css";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { FaSignOutAlt } from "react-icons/fa";

const ADMIN_NAV = [
  { label: "Crear Torneo", icon: "bx-trophy",   path: "/menu-admin"             },
  { label: "Arbitraje",    icon: "bx-whistle",  path: "/menu-admin/arbitraje"   },
  { label: "Canchas",      icon: "bx-football", path: "/menu-admin/canchas"     },
  { label: "Jugadores",    icon: "bx-group",    path: "/menu-admin/jugadores"   },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [admin, setAdmin] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem("admin");
    if (!stored) {
      navigate("/admin");
      return;
    }
    try {
      setAdmin(JSON.parse(stored));
    } catch {
      navigate("/admin");
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("admin");
    navigate("/admin");
  };

  if (!admin) return null;

  const initials = `${admin.nombre?.[0] ?? ""}${admin.apellido?.[0] ?? ""}`.toUpperCase();

  return (
    <div className="layout">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <nav className="navbar">
        <div className="navdiv">

          {/* IZQUIERDA: Logo + badge ADMIN */}
          <div className="logo">
            <div className="logo-admin-wrap">
              <span className="logo-admin-text">Gestor de Torneos</span>
              <span className="admin-badge">ADMIN</span>
            </div>
          </div>

          {/* CENTRO: Nav links */}
          <ul className="navlinks">
            {ADMIN_NAV.map(({ label, icon, path }) => {
              const active = location.pathname === path;
              return (
                <li key={label}>
                  <button
                    className={`admin-nav-btn${active ? " active" : ""}`}
                    onClick={() => navigate(path)}
                  >
                    <i className={`bx ${icon}`}></i>
                    {label}
                  </button>
                </li>
              );
            })}
          </ul>

          {/* DERECHA: Avatar + nombre + logout */}
          <div className="nav-actions">
            <div className="admin-user-info">
              <div className="admin-avatar">{initials}</div>
              <div className="admin-user-text">
                <span className="admin-user-name">
                  {admin.nombre} {admin.apellido}
                </span>
                <span className="admin-user-role">Administrador</span>
              </div>
              <button className="btn-logout" onClick={handleLogout}>
                <FaSignOutAlt />
                Cerrar sesión
              </button>
            </div>
          </div>

        </div>
      </nav>

      {/* ── Contenido de la página activa ───────────────────────────────── */}
      <main className="admin-main-content">
        <Outlet />
      </main>

    </div>
  );
}
