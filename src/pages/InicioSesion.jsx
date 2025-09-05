import "../styles/InicioSesion.css";
import { Link, useNavigate } from "react-router-dom";
import { useEffect } from "react";

function InicioSesion() {
  const navigate = useNavigate();

  useEffect(() => {
    // aplica fondo al body solo en esta vista
    document.body.classList.add("bg-login");
    return () => document.body.classList.remove("bg-login");
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    navigate("/gestorTorneos");
  };

  return (
    <div className="pagina-fondo-verde">
      <div className="formulario">
        <h1>Inicio de sesión</h1>

        <form onSubmit={handleSubmit} method="post">
          <div className="icons">
            <i className="bx bxl-google"></i>
            <i className="bx bxl-gmail"></i>
          </div>

          <div className="username">
            <input type="text" name="usuario" required />
            <label>Nombre de usuario</label>
            <span></span>
          </div>

          <div className="contraseña">
            <input type="password" name="contraseña" required />
            <label>Contraseña</label>
            <span></span>
          </div>

          <div className="recordar">¿Olvidó su contraseña?</div>

          <input type="submit" value="Iniciar Sesión" />

          <div className="registrarse">
            <Link to="/registro">Registrarse</Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default InicioSesion;
