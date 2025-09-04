import "../styles/InicioSesion.css";
import { Link } from 'react-router-dom'
import { useNavigate } from "react-router-dom"

function InicioSesion() {
  const navigate = useNavigate()

  const handleSubmit = (e) => {
    e.preventDefault() // evita recargar
    // acá podrías validar usuario/contraseña
    navigate("/gestorTorneos") // redirige a la otra página
  }

  return (
    <div className="formulario">
      <h1>Inicio de sesión</h1>
      <form onSubmit={handleSubmit} method="post">
        <div className="icons">
          <i className='bx bxl-google'></i>
          <i className='bx bxl-gmail' ></i>
        </div>
        <div className="username">    
          <input type="text" required />
          <label>Nombre de usuario</label>
        </div>
        <div className="contraseña">
          <input type="password" required />
          <label>Contraseña</label>
        </div>
        <div className="recordar">¿Olvido su contraseña?</div>
          <input type="submit" value="Iniciar Sesión" />
        <div className="registrarse">
          <a href="#">Registrarse</a>
        </div>
      </form>
    </div>
  );
}

export default InicioSesion;