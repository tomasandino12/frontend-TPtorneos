import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './App.css'

import InicioSesion from "./pages/InicioSesion.jsx"
import Registro from "./pages/Registro.jsx"
import GestorTorneos from "./pages/GestorTorneos.jsx"
import TablaPosiciones from "./pages/TablaPosiciones.jsx"
import Estadisticas from "./pages/Estadisticas.jsx"
import FixtureTorneo from "./pages/FixtureTorneo.jsx"
import Equipos from "./pages/Equipos.jsx"
import MiPerfil from "./pages/MiPerfil.jsx"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<InicioSesion />} />
        <Route path="/registro" element={<Registro />} />

        {/* 📂 Sección con layout: Gestor de Torneos */}
        <Route path="/gestorTorneos" element={<GestorTorneos />}>
          <Route index element={<TablaPosiciones />} /> {/* /gestorTorneos */}
          <Route path="estadisticas" element={<Estadisticas />} /> {/* /gestorTorneos/estadisticas */}
          <Route path="fixture" element={<FixtureTorneo />} />
          <Route path="equipos" element={<Equipos />} />
          <Route path="miPerfil" element={<MiPerfil />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
