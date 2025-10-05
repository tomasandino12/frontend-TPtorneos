import "../styles/IndexStyle.css";
import "../styles/MiPerfil.css";
import { useState } from "react";
import { Link } from "react-router-dom";

function MiPerfil() {
  const [equipo, setEquipo] = useState("Los Gladiadores FC"); // simulación

  const handleSalirEquipo = () => {
    if (window.confirm("¿Estás seguro que deseas salir de tu equipo?")) {
      setEquipo(""); // simulamos salir
    }
  };

  return (
    <div className="MiPerfil">
      <main className="mi-perfil-container">
        <h1 className="mi-perfil-titulo">👤 Mi Perfil</h1>
        <p className="mi-perfil-subtitulo">Gestiona tu información y estadísticas</p>

        <div className="perfil-seccion">
          <button className="boton-editar">✏️ Editar</button>

          <h2>Información Personal</h2>
          <p>Datos básicos del jugador</p>

          <div className="perfil-campo">
            <div className="input-grupo">
              <label>Nombre Completo</label>
              <input type="text" value="Juan Carlos Pérez" readOnly />
            </div>
            <div className="input-grupo">
              <label>Edad</label>
              <input type="text" value="25" readOnly />
            </div>
          </div>

          <div className="perfil-campo">
            <div className="input-grupo">
              <label>Equipo</label>
              <input
                type="text"
                value={equipo ? equipo : "No perteneces a ninguno"}
                readOnly
                className={!equipo ? "input-vacio" : ""}
              />
            </div>
            <div className="input-grupo">
              <label>Posición</label>
              <input type="text" value="Mediocampista Central" readOnly />
            </div>
          </div>

          {equipo && (
            <div className="boton-salir-container">
              <button className="boton-salir-equipo" onClick={handleSalirEquipo}>
                🚪 Salir del equipo
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default MiPerfil;
