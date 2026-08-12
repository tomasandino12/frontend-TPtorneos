import { useNavigate } from "react-router-dom";
import { FiAward, FiList, FiPlusCircle, FiFlag, FiMapPin, FiUsers, FiLogOut, FiX } from "react-icons/fi";
import Sheet from "./ui/Sheet.jsx";
import "../styles/AdminDrawer.css";

/**
 * Drawer lateral del panel admin (<1024px) — agrupa los 7 destinos con los
 * mismos encabezados que hoy usan los dropdowns de escritorio ("Mis
 * Torneos", "Canchas") más los links directos (Arbitraje, Jugadores), y
 * "Cerrar sesión" al pie. Reemplaza visualmente los dropdowns
 * position:absolute de AdminHeader.jsx en este rango — por encima de 1024px
 * los dropdowns siguen intactos.
 */
export default function AdminDrawer({ open, onClose, onLogout }) {
  const navigate = useNavigate();

  const handleNavigate = (path) => {
    onClose();
    navigate(path);
  };

  return (
    <Sheet open={open} onClose={onClose} position="right" ariaLabel="Menú">
      <div className="admin-drawer-header">
        <span className="admin-drawer-title">Menú</span>
        <button type="button" className="admin-drawer-close" onClick={onClose} aria-label="Cerrar">
          <FiX />
        </button>
      </div>

      <nav className="admin-drawer-nav">
        <div className="admin-drawer-group">
          <span className="admin-drawer-group-label">
            <FiAward /> Mis Torneos
          </span>
          <button type="button" onClick={() => handleNavigate("/admin/torneos")}>
            <FiList /> Mis Torneos
          </button>
          <button type="button" onClick={() => handleNavigate("/admin/torneos/nuevo")}>
            <FiPlusCircle /> Crear Torneo
          </button>
        </div>

        <div className="admin-drawer-group">
          <span className="admin-drawer-group-label">
            <FiMapPin /> Canchas
          </span>
          <button type="button" onClick={() => handleNavigate("/admin/canchas")}>
            <FiList /> Ver canchas
          </button>
          <button type="button" onClick={() => handleNavigate("/admin/canchas/nueva")}>
            <FiPlusCircle /> Nueva cancha
          </button>
        </div>

        <button type="button" className="admin-drawer-link" onClick={() => handleNavigate("/admin/arbitros")}>
          <FiFlag /> Arbitraje
        </button>
        <button type="button" className="admin-drawer-link" onClick={() => handleNavigate("/admin/jugadores")}>
          <FiUsers /> Jugadores
        </button>
      </nav>

      <button type="button" className="admin-drawer-logout" onClick={onLogout}>
        <FiLogOut /> Cerrar sesión
      </button>
    </Sheet>
  );
}
