import "../styles/IndexStyle.css";
import "../styles/MenuAdmin.css";
import { useNavigate } from "react-router-dom";
import { FiAward, FiFlag, FiMapPin, FiAlertTriangle } from "react-icons/fi";
import { Card, PageShell } from "../components/ui";
import { useAdmin } from "../context/AdminContext.jsx";

const ADMIN_CARDS = [
  { label: "Mis Torneos", icon: FiAward, path: "/admin/torneos" },
  { label: "Arbitraje", icon: FiFlag, path: "/admin/arbitros" },
  { label: "Canchas", icon: FiMapPin, path: "/admin/canchas" },
  { label: "Sanciones", icon: FiAlertTriangle, path: "/admin/sanciones" },
];

function MenuAdmin() {
  const navigate = useNavigate();
  const { admin } = useAdmin();

  return (
    <>
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
    </>
  );
}

export default MenuAdmin;
