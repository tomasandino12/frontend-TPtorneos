import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FiAward, FiChevronDown, FiList, FiPlusCircle, FiFlag, FiMapPin, FiUsers, FiLogOut } from "react-icons/fi";
import "../styles/IndexStyle.css";
import "../styles/MenuAdmin.css";

const OTHER_NAV = [
  { label: "Arbitraje", icon: FiFlag, path: "/admin/arbitros" },
  { label: "Canchas", icon: FiMapPin, path: null },
  { label: "Jugadores", icon: FiUsers, path: null },
];

export default function AdminHeader({ admin, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [dropOpen, setDropOpen] = useState(false);
  const wrapRef = useRef(null);
  const triggerRef = useRef(null);

  // Click para abrir/cerrar (en vez de hover + setTimeout): evita el bug de
  // que el dropdown se cierre si el mouse se mueve en diagonal antes de
  // llegar a él, y es accesible por teclado (Enter/Espacio en el trigger).
  useEffect(() => {
    if (!dropOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setDropOpen(false);
        triggerRef.current?.focus();
      }
    };
    const handleClickOutside = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setDropOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropOpen]);

  const handleBlur = (e) => {
    if (!wrapRef.current?.contains(e.relatedTarget)) {
      setDropOpen(false);
    }
  };

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
          <li className="admin-dropdown-wrap" ref={wrapRef} onBlur={handleBlur}>
            <button
              ref={triggerRef}
              className={`admin-nav-btn${isTorneos ? " active" : ""}`}
              onClick={() => setDropOpen((v) => !v)}
              aria-haspopup="true"
              aria-expanded={dropOpen}
            >
              <FiAward />
              Mis Torneos
              <FiChevronDown className="admin-nav-chevron" />
            </button>

            {dropOpen && (
              <div className="admin-dropdown">
                <button
                  className="admin-dropdown-item"
                  onClick={() => { navigate("/admin/torneos"); setDropOpen(false); }}
                >
                  <div className="admin-dropdown-icon">
                    <FiList />
                  </div>
                  <div>
                    <span className="admin-dropdown-label">Mis Torneos</span>
                    <span className="admin-dropdown-desc">Listá, editá o eliminá tus torneos</span>
                  </div>
                </button>
                <button
                  className="admin-dropdown-item"
                  onClick={() => { navigate("/admin/torneos/nuevo"); setDropOpen(false); }}
                >
                  <div className="admin-dropdown-icon">
                    <FiPlusCircle />
                  </div>
                  <div>
                    <span className="admin-dropdown-label">Crear Torneo</span>
                    <span className="admin-dropdown-desc">Nuevo certamen desde cero</span>
                  </div>
                </button>
              </div>
            )}
          </li>

          {OTHER_NAV.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.label}>
                <button
                  className="admin-nav-btn"
                  onClick={() => navigate(item.path ?? "/menu-admin")}
                >
                  <Icon />
                  {item.label}
                </button>
              </li>
            );
          })}
        </ul>

        <div className="nav-actions">
          <div className="admin-user-info">
            <div className="admin-avatar">{initials}</div>
            <div className="admin-user-text">
              <span className="admin-user-name">{admin.nombre} {admin.apellido}</span>
              <span className="admin-user-role">Administrador</span>
            </div>
            <button className="btn-logout" onClick={onLogout}>
              <FiLogOut />
              Cerrar sesión
            </button>
          </div>
        </div>

      </div>
    </nav>
  );
}
