import "../styles/InicioSesion.css";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

function InicioSesion() {
  const navigate = useNavigate();

  const [usuario, setUsuario] = useState("");
  const [contraseña, setContraseña] = useState("");
  const [mostrarPass, setMostrarPass] = useState(false);
  const [recordar, setRecordar] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    document.body.classList.add("bg-login");
    return () => document.body.classList.remove("bg-login");
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:3000/api/jugadores/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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

      if (recordar) localStorage.setItem("rememberEmail", usuario);
      else localStorage.removeItem("rememberEmail");

      alert(`✅ Bienvenido ${jugador.nombre}!`);
      navigate("/gestorTorneos/inicio");
    } catch (err) {
      console.error("Error en inicio de sesión:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const remembered = localStorage.getItem("rememberEmail");
    if (remembered) {
      setUsuario(remembered);
      setRecordar(true);
    }
  }, []);

  return (
    <div className="login-wrap">
      <div className="login-card">
        <div className="login-header">
          <h1 className="login-brand">
            Gestor<span>Torneos</span>
          </h1>
          <h2 className="login-title">Bienvenido de vuelta!</h2>
          <p className="login-subtitle">
            Ingrese sus datos para acceder a los datos del torneo
          </p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="field">
            <label className="field-label" htmlFor="email">
              Email
            </label>
            <div className="field-control">
              <i className="bx bx-envelope field-icon"></i>
              <input
                id="email"
                type="email"
                placeholder="juanperez@email.com"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="field">
            <label className="field-label" htmlFor="password">
              Contraseña
            </label>
            <div className="field-control">
              <i className="bx bx-lock-alt field-icon"></i>
              <input
                id="password"
                type={mostrarPass ? "text" : "password"}
                placeholder="••••••••"
                value={contraseña}
                onChange={(e) => setContraseña(e.target.value)}
                required
              />
              <button
                type="button"
                className="field-action"
                onClick={() => setMostrarPass(!mostrarPass)}
                aria-label={mostrarPass ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                <i className={`bx ${mostrarPass ? "bx-hide" : "bx-show"}`}></i>
              </button>
            </div>
          </div>

          <div className="row-between">
            <label className="check">
              <input
                type="checkbox"
                checked={recordar}
                onChange={(e) => setRecordar(e.target.checked)}
              />
              <span>Recordar</span>
            </label>

            <button type="button" className="link-green">
              Olvidé mi contraseña
            </button>
          </div>

          <button className="btn-primary" type="submit" disabled={isLoading}>
            {isLoading ? "Entrando..." : "Entrar"}
          </button>

          {error && <p className="login-error">{error}</p>}

          <div className="divider">
            <span>o</span>
          </div>

          <div className="social">
            <button type="button" className="btn-outline">
              <span className="social-ico">G</span>
              Continuar con Google
            </button>

            <button type="button" className="btn-outline">
              <span className="social-ico">f</span>
              Continuar con Facebook
            </button>
          </div>

          <p className="bottom-text">
            No tenes una cuenta?{" "}
            <Link to="/registro" className="link-green">
              Registrarse
            </Link>
          </p>

          <p className="bottom-text bottom-admin">
                Sos administrador de un torneo?{" "}
                <span
                 className="link-green"
                  onClick={() => navigate("/admin")}
                                                      >
                  Ingresar como Admin
                </span>
          </p>
        </form>
      </div>
    </div>
  );
}

export default InicioSesion;
