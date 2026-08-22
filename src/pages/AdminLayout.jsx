import { Outlet, useNavigate } from "react-router-dom";
import "../styles/IndexStyle.css";
import AdminHeader from "../components/AdminHeader.jsx";
import { useAdmin } from "../context/AdminContext.jsx";

// Layout compartido por toda la sección /admin: dibuja el AdminHeader y el
// footer una sola vez acá, en vez de que cada página admin repita los dos
// (como sí hace GestorTorneos.jsx para el lado jugador) — ver Outlet más abajo.
function AdminLayout() {
  const navigate = useNavigate();
  const { admin, logout } = useAdmin();

  const handleLogout = () => {
    logout();
    navigate("/admin");
  };

  return (
    <div className="layout">
      <AdminHeader admin={admin} onLogout={handleLogout} />

      <Outlet />

      <footer className="footer">
        <h5>
          © 2025 - Gestor de Torneos · Panel del Administrador · Para mas información o
          problemas con la página contactate a: 341 6173297 o a nuestra cuenta de
          instagram @todotorneos
        </h5>
      </footer>
    </div>
  );
}

export default AdminLayout;
