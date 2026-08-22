import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'
import './App.css'
import { AdminProvider, useAdmin } from "./context/AdminContext.jsx"

import InicioSesion from "./pages/InicioSesion.jsx"
import Registro from "./pages/Registro.jsx"
import GestorTorneos from "./pages/GestorTorneos.jsx"
import TablaPosiciones from "./pages/TablaPosiciones.jsx"
import Estadisticas from "./pages/Estadisticas.jsx"
import FixtureTorneo from "./pages/FixtureTorneo.jsx"
import Equipos from "./pages/Equipos.jsx"
import MiPerfil from "./pages/MiPerfil.jsx"
import EquipoDetalle from "./pages/EquipoDetalle.jsx"
import InicioSesionAdmin from "./pages/InicioSesionAdmin.jsx"
import AdminLayout from "./pages/AdminLayout.jsx"
import MenuAdmin from "./pages/MenuAdmin.jsx"
import Inicio from "./pages/Inicio.jsx"
import MisTorneos from "./pages/MisTorneos.jsx"
import CrearTorneo from "./pages/CrearTorneo.jsx"
import InscribirEquipos from "./pages/InscribirEquipos.jsx"
import Arbitros from "./pages/Arbitros.jsx"
import Canchas from "./pages/Canchas.jsx"
import CrearCancha from "./pages/CrearCancha.jsx"
import Jugadores from "./pages/Jugadores.jsx"
import RegistroSanciones from "./pages/RegistroSanciones.jsx"
import OlvidePassword from "./pages/OlvidePassword.jsx"
import RestablecerPassword from "./pages/RestablecerPassword.jsx"

function PrivateRoute({ children }) {
  const token = localStorage.getItem("token");
  if (!token) return <Navigate to="/" replace />;
  return children;
}

function AdminRoute({ children }) {
  const { loading, admin, isAdmin } = useAdmin();
  if (loading) return null;
  if (!admin || !isAdmin) return <Navigate to="/admin" replace />;
  return children;
}

function App() {
  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
    <AdminProvider>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<InicioSesion />} />
        <Route path="/registro" element={<Registro />} />
        <Route path="/olvide-password" element={<OlvidePassword />} />
        <Route path="/restablecer-password" element={<RestablecerPassword />} />
        <Route path="/admin" element={<InicioSesionAdmin />} />

        {/* 📂 Sección con layout: panel de Administrador — AdminHeader y footer
            se dibujan una sola vez en AdminLayout, cada ruta hija solo pone su
            contenido (mismo patrón que /gestorTorneos más abajo). */}
        <Route element={<AdminRoute><AdminLayout /></AdminRoute>}>
          <Route path="/menu-admin" element={<MenuAdmin />} />
          <Route path="/admin/torneos" element={<MisTorneos />} />
          <Route path="/admin/torneos/nuevo" element={<CrearTorneo />} />
          <Route path="/admin/torneos/:id/editar" element={<CrearTorneo />} />
          <Route path="/admin/torneos/:id/equipos" element={<InscribirEquipos />} />
          <Route path="/admin/arbitros" element={<Arbitros />} />
          <Route path="/admin/canchas" element={<Canchas />} />
          <Route path="/admin/canchas/nueva" element={<CrearCancha />} />
          <Route path="/admin/jugadores" element={<Jugadores />} />
          <Route path="/admin/sanciones" element={<RegistroSanciones />} />
        </Route>

        {/* 📂 Sección con layout: Gestor de Torneos */}
        <Route path="/gestorTorneos" element={<PrivateRoute><GestorTorneos /></PrivateRoute>}>
          <Route index element={<TablaPosiciones />} />
          <Route path="estadisticas" element={<Estadisticas />} />
          <Route path="fixture" element={<FixtureTorneo />} />
          <Route path="equipos" element={<Equipos />} />
          <Route path="miPerfil" element={<MiPerfil />} />
          <Route path="inicio" element={<Inicio />} />
        </Route>

        {/* Ruta para detalle de equipo */}
        <Route path="/equipo/:id" element={<PrivateRoute><EquipoDetalle /></PrivateRoute>} />
      </Routes>
    </BrowserRouter>
    </AdminProvider>
    </GoogleOAuthProvider>
  )
}

export default App
