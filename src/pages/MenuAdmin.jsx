import "../styles/IndexStyle.css";
import "../styles/MenuAdmin.css";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiAward, FiFlag, FiMapPin, FiUsers } from "react-icons/fi";
import AdminHeader from "../components/AdminHeader.jsx";
import { Card, PageShell } from "../components/ui";

const ADMIN_CARDS = [
  { label: "Mis Torneos", icon: FiAward, path: "/admin/torneos" },
  { label: "Arbitraje", icon: FiFlag, path: "/admin/arbitros" },
  { label: "Canchas", icon: FiMapPin, path: null },
  { label: "Jugadores", icon: FiUsers, path: null },
];

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
      <PageShell bare>

        <Card className="admin-welcome">
          <h1>
            Bienvenido,{" "}
            <span className="admin-welcome-name">
              {admin.nombre} {admin.apellido}
            </span>
          </h1>
          <p>Panel de administración · {admin.email}</p>
        </Card>

        <div className="admin-grid">
          {ADMIN_CARDS.map((item) => {
            const Icon = item.icon;
            return (
              <Card
                key={item.label}
                className={`admin-card${!item.path ? " admin-card-disabled" : ""}`}
                onClick={() => item.path && navigate(item.path)}
              >
                <div className="admin-card-icon">
                  <Icon />
                </div>
                <h3>{item.label}</h3>
                <p>Gestionar {item.label.toLowerCase()}</p>
              </Card>
            );
          })}
        </div>

      </PageShell>
    </div>
  );
}

export default MenuAdmin;
