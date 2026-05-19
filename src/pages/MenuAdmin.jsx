import "../styles/MenuAdmin.css";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const NAV_ITEMS = [
  { label: "Torneos",    icon: "bx-trophy"   },
  { label: "Jugadores",  icon: "bx-user"      },
  { label: "Partidos",   icon: "bx-football"  },
  { label: "Árbitros",   icon: "bx-whistle"   },
];

function MenuAdmin() {
  const navigate = useNavigate();
  const [admin, setAdmin] = useState(null);
  const [activeItem, setActiveItem] = useState("Torneos");

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

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          Gestor<span>Torneos</span>
        </div>
        <span className="admin-role-badge">Administrador</span>
        <div className="admin-sep" />

        <nav className="admin-nav">
          {NAV_ITEMS.map(({ label, icon }) => (
            <button
              key={label}
              className={`admin-nav-btn${activeItem === label ? " active" : ""}`}
              onClick={() => setActiveItem(label)}
            >
              <i className={`bx ${icon}`}></i>
              {label}
            </button>
          ))}
        </nav>

        <button className="admin-logout" onClick={handleLogout}>
          <i className="bx bx-log-out"></i>
          Cerrar sesión
        </button>
      </aside>

      <main className="admin-main">
        <div className="admin-welcome-card">
          <h1>
            Bienvenido, <span>{admin.nombre} {admin.apellido}</span>
          </h1>
          <p>Panel de administración · {admin.email}</p>
        </div>

        <div className="admin-grid">
          {NAV_ITEMS.map(({ label, icon }) => (
            <div
              key={label}
              className="admin-card"
              onClick={() => setActiveItem(label)}
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
