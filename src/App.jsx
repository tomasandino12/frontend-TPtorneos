import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css'

import InicioSesion from "./pages/InicioSesion";
import GestorTorneos from './pages/GestorTorneos.jsx';
import Estadisticas from './pages/Estadisticas.jsx';
import FixtureTorneo from './pages/FixtureTorneo.jsx';
import Equipos from './pages/Equipos.jsx';
import MiPerfil from './pages/MiPerfil.jsx';

import "./styles/IndexStyle.css";

function App() {
  const [count, setCount] = useState(0)

  return (
    <Routes>
      <Route path="/" element={<InicioSesion />} />
      <Route path="/gestorTorneos" element={<GestorTorneos />} />
      <Route path="/estadisticas" element={<Estadisticas />} />
      <Route path="/fixture" element={<FixtureTorneo />} />
      <Route path="/equipos" element={<Equipos />} />
      <Route path="/miPerfil" element={<MiPerfil />} />
    </Routes>
  )
}

export default App
