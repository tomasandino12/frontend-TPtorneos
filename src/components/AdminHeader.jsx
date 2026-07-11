import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FiAward, FiChevronDown, FiList, FiPlusCircle, FiFlag, FiMapPin, FiUsers, FiLogOut } from "react-icons/fi";
import "../styles/IndexStyle.css";
import "../styles/MenuAdmin.css";

const OTHER_NAV = [
  { label: "Arbitraje", icon: FiFlag, path: "/admin/arbitros" },
  { label: "Jugadores", icon: FiUsers, path: "/admin/jugadores" },
];

export default function AdminHeader({ admin, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  // Un solo estado indica cuál de los dos dropdowns ('torneos' | 'canchas')
  // está abierto — abrir uno cierra el otro, como en cualquier navbar.
  const [openMenu, setOpenMenu] = useState(null);
  const wrapRefTorneos = useRef(null);
  const triggerRefTorneos = useRef(null);
  const wrapRefCanchas = useRef(null);
  const triggerRefCanchas = useRef(null);

  // Click para abrir/cerrar (en vez de hover + setTimeout): evita el bug de
  // que el dropdown se cierre si el mouse se mueve en diagonal antes de
  // llegar a él, y es accesible por teclado (Enter/Espacio en el trigger).
  useEffect(() => {
    if (!openMenu) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setOpenMenu(null);
        (openMenu === "torneos" ? triggerRefTorneos : triggerRefCanchas).current?.focus();
      }
    };
    const handleClickOutside = (e) => {
      const dentroDeAlguno =
        wrapRefTorneos.current?.contains(e.target) || wrapRefCanchas.current?.contains(e.target);
      if (!dentroDeAlguno) {
        setOpenMenu(null);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openMenu]);

  const handleBlur = (wrapRef) => (e) => {
    if (!wrapRef.current?.contains(e.relatedTarget)) {
      setOpenMenu(null);
    }
  };

  const isTorneos = location.pathname.startsWith("/admin/torneos");
  const isCanchas = location.pathname.startsWith("/admin/canchas");
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
          <li className="admin-dropdown-wrap" ref={wrapRefTorneos} onBlur={handleBlur(wrapRefTorneos)}>
            <button
              ref={triggerRefTorneos}
              className={`admin-nav-btn${isTorneos ? " active" : ""}`}
              onClick={() => setOpenMenu((v) => (v === "torneos" ? null : "torneos"))}
              aria-haspopup="true"
              aria-expanded={openMenu === "torneos"}
            >
              <FiAward />
              Mis Torneos
              <FiChevronDown className="admin-nav-chevron" />
            </button>

            {openMenu === "torneos" && (
              <div className="admin-dropdown">
                <button
                  className="admin-dropdown-item"
                  onClick={() => { navigate("/admin/torneos"); setOpenMenu(null); }}
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
                  onClick={() => { navigate("/admin/torneos/nuevo"); setOpenMenu(null); }}
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

          {/* Dropdown: Canchas — mismo patrón que Mis Torneos */}
          <li className="admin-dropdown-wrap" ref={wrapRefCanchas} onBlur={handleBlur(wrapRefCanchas)}>
            <button
              ref={triggerRefCanchas}
              className={`admin-nav-btn${isCanchas ? " active" : ""}`}
              onClick={() => setOpenMenu((v) => (v === "canchas" ? null : "canchas"))}
              aria-haspopup="true"
              aria-expanded={openMenu === "canchas"}
            >
              <FiMapPin />
              Canchas
              <FiChevronDown className="admin-nav-chevron" />
            </button>

            {openMenu === "canchas" && (
              <div className="admin-dropdown">
                <button
                  className="admin-dropdown-item"
                  onClick={() => { navigate("/admin/canchas"); setOpenMenu(null); }}
                >
                  <div className="admin-dropdown-icon">
                    <FiList />
                  </div>
                  <div>
                    <span className="admin-dropdown-label">Ver canchas</span>
                    <span className="admin-dropdown-desc">Listá, editá o eliminá canchas</span>
                  </div>
                </button>
                <button
                  className="admin-dropdown-item"
                  onClick={() => { navigate("/admin/canchas/nueva"); setOpenMenu(null); }}
                >
                  <div className="admin-dropdown-icon">
                    <FiPlusCircle />
                  </div>
                  <div>
                    <span className="admin-dropdown-label">Nueva cancha</span>
                    <span className="admin-dropdown-desc">Agregar una cancha nueva</span>
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
