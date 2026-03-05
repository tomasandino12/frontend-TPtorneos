import "../styles/InicioSesion.css";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

function InicioSesion() {
  const navigate = useNavigate();

  const [usuario, setUsuario] = useState("");
  const [contraseña, setContraseña] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    document.body.classList.add("bg-login");
    return () => document.body.classList.remove("bg-login");
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = await fetch("http://localhost:3000/api/jugadores/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: usuario,
          contraseña: contraseña
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al iniciar sesión");
      }

      const data = await response.json();

      
      localStorage.setItem("token", data.token);

      
      const jugadorResp = await fetch(
        `http://localhost:3000/api/jugadores/by-email?email=${encodeURIComponent(usuario)}`
        );


      if (!jugadorResp.ok) {
     const err = await jugadorResp.json();
      throw new Error(err.message || "No se pudo obtener el jugador");
        }

          const jugadorJson = await jugadorResp.json();
          const jugador = jugadorJson.data;

          
          localStorage.removeItem("jugador");
          localStorage.setItem("jugador", JSON.stringify(jugador));

          alert(`✅ Bienvenido ${jugador.nombre}!`);
          navigate("/gestorTorneos");


    } catch (err) {
      console.error("Error en inicio de sesión:", err);
      setError(err.message);
    }
  };

  return (
    <div className="pagina-fondo-verde">
      <div className="formulario">
        <h1>Inicio de sesión</h1>

        <form onSubmit={handleSubmit}>
          <div className="icons">
            <i className="bx bxl-google"></i>
            <i className="bx bxl-gmail"></i>
          </div>

          <div className="username">
            <input
              type="text"
              name="usuario"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              required
            />
            <label>Email del jugador</label>
            <span></span>
          </div>

          <div className="contraseña">
            <input
              type="password"
              name="contraseña"
              value={contraseña}
              onChange={(e) => setContraseña(e.target.value)}
              required
            />
            <label>Contraseña</label>
            <span></span>
          </div>

          <div className="recordar">¿Olvidó su contraseña?</div>

          <input type="submit" value="Iniciar Sesión" />

          {error && <p style={{ color: "red" }}>{error}</p>}

          <div className="links-abajo">
            <Link to="/registro">Registrarse</Link>
            <Link to="/admin/login">Administrar Torneos</Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default InicioSesion;
