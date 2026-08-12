import { FiLogOut, FiX } from "react-icons/fi";
import Sheet from "./ui/Sheet.jsx";
import "../styles/AccountSheet.css";

/**
 * Hoja de cuenta abierta desde el avatar del Navbar (mobile, <768px) — junta
 * lo que en escritorio ya se ve en el header (nombre, email) más la acción
 * de cerrar sesión que en mobile se saca del header (ver Navbar.jsx).
 */
export default function AccountSheet({ open, onClose, jugador, onLogout }) {
  if (!jugador) return null;
  const initials = `${jugador.nombre?.[0] ?? ""}${jugador.apellido?.[0] ?? ""}`.toUpperCase();

  return (
    <Sheet open={open} onClose={onClose} position="bottom" ariaLabel="Cuenta">
      <div className="account-sheet-header">
        <span className="account-sheet-avatar">{initials}</span>
        <span className="account-sheet-info">
          <span className="account-sheet-name">
            {jugador.nombre} {jugador.apellido}
          </span>
          {jugador.email && <span className="account-sheet-email">{jugador.email}</span>}
        </span>
        <button type="button" className="account-sheet-close" onClick={onClose} aria-label="Cerrar">
          <FiX />
        </button>
      </div>
      <button type="button" className="account-sheet-logout" onClick={onLogout}>
        <FiLogOut />
        Cerrar sesión
      </button>
    </Sheet>
  );
}
