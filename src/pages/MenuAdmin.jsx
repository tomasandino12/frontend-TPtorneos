import "../styles/IndexStyle.css";
import "../styles/MenuAdmin.css";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaSignOutAlt } from "react-icons/fa";

const ADMIN_NAV = [
  { label: "Crear Torneo", icon: "bx-trophy"   },
  { label: "Arbitraje",    icon: "bx-whistle"  },
  { label: "Canchas",      icon: "bx-football" },
  { label: "Jugadores",    icon: "bx-group"    },
];

function MenuAdmin() {
  const navigate = useNavigate();
  const [admin, setAdmin] = useState(null);
  const [activeItem, setActiveItem] = useState("Crear Torneo");

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
            {ADMIN_NAV.map(({ label, icon }) => (
              <li key={label}>
                <button
                  className={`admin-nav-btn${activeItem === label ? " active" : ""}`}
                  onClick={() => {
                    if (label === "Crear Torneo") {
                      navigate("/admin/torneos");
                    } else {
                      setActiveItem(label);
                    }
                  }}
                >
                  <i className={`bx ${icon}`}></i>
                  {label}
                </button>
              </li>
            ))}
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

      {/* ── Contenido ───────────────────────────────────────────────────── */}
      <main className="admin-main-content">

        <div className="admin-welcome">
          <h1>
            Bienvenido,{" "}
            <span className="admin-welcome-name">
              {admin.nombre} {admin.apellido}
            </span>
          </h1>
          <p>Panel de administración · {admin.email}</p>
        </div>

        <div className="admin-grid">
          {ADMIN_NAV.map(({ label, icon }) => (
            <div
              key={label}
              className={`admin-card${activeItem === label ? " admin-card-active" : ""}`}
              onClick={() => {
                if (label === "Crear Torneo") navigate("/admin/torneos");
                else setActiveItem(label);
              }}
            >
              <div className="admin-card-icon">
                <i className={`bx ${icon}`}></i>
              </div>
              <h3>{label}</h3>
              <p>Gestionar {label.toLowerCase()}</p>
            </div>
          ))}
        </div>

      </main>
    </div>
  );
}

export default MenuAdmin;
