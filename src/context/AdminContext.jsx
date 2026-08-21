import { createContext, useContext, useCallback, useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";

const AdminContext = createContext(undefined);

// Lee "admin" y "adminToken" de localStorage y devuelve la sesión si es
// válida, o null si no hay sesión / está corrupta / el token venció.
// jwtDecode NO verifica la firma del token (para eso hace falta el secret,
// que solo tiene el backend) — esto es una lectura de UX/routing para saber
// qué mostrar, no la barrera de seguridad real. Esa barrera sigue siendo el
// backend rechazando con 401 en cada request (ver src/utils/api.ts).
function leerSesionDesdeStorage() {
  const storedAdmin = localStorage.getItem("admin");
  const storedToken = localStorage.getItem("adminToken");
  if (!storedAdmin || !storedToken) return null;

  try {
    const admin = JSON.parse(storedAdmin);
    const payload = jwtDecode(storedToken);

    // El token dura 8hs (ver jwt.sign en adminTorneo.controler.ts) — si ya
    // venció, se trata como sesión inexistente.
    if (payload.exp && payload.exp * 1000 < Date.now()) return null;

    return { admin, rol: payload.rol };
  } catch {
    // JSON de "admin" corrupto o token que jwtDecode no puede leer: ninguno
    // de los dos casos debe romper la app, se trata como sesión inexistente.
    return null;
  }
}

export function AdminProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [rol, setRol] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sesion = leerSesionDesdeStorage();
    if (!sesion) {
      localStorage.removeItem("admin");
      localStorage.removeItem("adminToken");
    } else {
      setAdmin(sesion.admin);
      setRol(sesion.rol);
    }
    setLoading(false);
  }, []);

  const login = useCallback((adminData, token) => {
    localStorage.setItem("admin", JSON.stringify(adminData));
    localStorage.setItem("adminToken", token);
    const payload = jwtDecode(token);
    setAdmin(adminData);
    setRol(payload.rol);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("admin");
    localStorage.removeItem("adminToken");
    setAdmin(null);
    setRol(null);
  }, []);

  const value = { admin, loading, isAdmin: rol === "admin", login, logout };

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error("useAdmin debe usarse dentro de un AdminProvider");
  }
  return context;
}
