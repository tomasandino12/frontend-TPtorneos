import "../styles/IndexStyle.css";
import "../styles/MenuAdmin.css";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminHeader from "../components/AdminHeader.jsx";

function MenuAdmin() {
  const navigate = useNavigate();
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

  return (
    <div className="layout">

      <AdminHeader admin={admin} onLogout={handleLogout} />

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
          {[
            { label: "Mis Torneos",  icon: "bx-trophy",   path: "/admin/torneos" },
            { label: "Arbitraje",    icon: "bx-whistle",  path: null },
            { label: "Canchas",      icon: "bx-football", path: null },
            { label: "Jugadores",    icon: "bx-group",    path: null },
          ].map(({ label, icon, path }) => (
            <div
              key={label}
              className="admin-card"
              onClick={() => path && navigate(path)}
              style={path ? { cursor: "pointer" } : { cursor: "default", opacity: 0.6 }}
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
