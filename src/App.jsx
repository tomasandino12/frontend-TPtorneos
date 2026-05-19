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
        <Route path="/admin" element={<InicioSesionAdmin />} />
        <Route path="/menu-admin" element={<MenuAdmin />} />

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
