import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './App.css'

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
import MenuAdmin from "./pages/MenuAdmin.jsx"
import Inicio from "./pages/Inicio.jsx"
import MisTorneos from "./pages/MisTorneos.jsx"
import CrearTorneo from "./pages/CrearTorneo.jsx"
import InscribirEquipos from "./pages/InscribirEquipos.jsx"
import Arbitros from "./pages/Arbitros.jsx"
import OlvidePassword from "./pages/OlvidePassword.jsx"
import RestablecerPassword from "./pages/RestablecerPassword.jsx"

function PrivateRoute({ children }) {
  const token = localStorage.getItem("token");
  if (!token) return <Navigate to="/" replace />;
  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<InicioSesion />} />
        <Route path="/registro" element={<Registro />} />
        <Route path="/olvide-password" element={<OlvidePassword />} />
        <Route path="/restablecer-password" element={<RestablecerPassword />} />
        <Route path="/admin" element={<InicioSesionAdmin />} />
        <Route path="/menu-admin" element={<MenuAdmin />} />
        <Route path="/admin/torneos" element={<MisTorneos />} />
        <Route path="/admin/torneos/nuevo" element={<CrearTorneo />} />
        <Route path="/admin/torneos/:id/equipos" element={<InscribirEquipos />} />
        <Route path="/admin/arbitros" element={<Arbitros />} />

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
  )
}

export default App
