import "../styles/IndexStyle.css";
import "../styles/MiPerfil.css";
import { Link } from "react-router-dom";

function MiPerfil() {
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
  <div className="input-espaciado" /> {/* espacio vacío */}
  <div className="input-grupo">
    <label>Posición</label>
    <input type="text" value="Mediocampista Central" readOnly />
  </div>
</div>
</div>

      </main>
    </div>
  );
}

export default MiPerfil;
