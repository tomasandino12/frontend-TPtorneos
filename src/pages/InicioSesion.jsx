import "../styles/InicioSesion.css";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { FiMail, FiLock } from "react-icons/fi";
import { apiFetch } from "../utils/api.js";
import { Button, TextField, Card, Alert } from "../components/ui";

function InicioSesion() {
  const navigate = useNavigate();

  const [usuario, setUsuario] = useState("");
  const [contraseña, setContraseña] = useState("");
  const [recordar, setRecordar] = useState(false);
  const [error, setError] = useState("");
  const [bienvenida, setBienvenida] = useState("");
  const [isLoading, setIsLoading] = useState(false);

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

      const jugadorResp = await apiFetch(
        `/jugadores/by-email?email=${encodeURIComponent(usuario)}`
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

      setBienvenida(`Bienvenido ${jugador.nombre}!`);
      setTimeout(() => navigate("/gestorTorneos/inicio"), 900);
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
    <div className="auth-page">
      <Card className="auth-card">
        <div className="auth-header">
          <h1 className="auth-brand">
            Gestor<span>Torneos</span>
          </h1>
          <h2 className="auth-title">Bienvenido de vuelta!</h2>
          <p className="auth-subtitle">
            Ingresá tus datos para acceder a los datos del torneo
          </p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <TextField
            label="Email"
            type="email"
            icon={<FiMail />}
            placeholder="juanperez@email.com"
            value={usuario}
            onChange={(e) => setUsuario(e.target.value)}
            required
          />

          <TextField
            label="Contraseña"
            type="password"
            icon={<FiLock />}
            placeholder="••••••••"
            value={contraseña}
            onChange={(e) => setContraseña(e.target.value)}
            required
          />

          <div className="auth-row-between">
            <label className="auth-check">
              <input
                type="checkbox"
                checked={recordar}
                onChange={(e) => setRecordar(e.target.checked)}
              />
              <span>Recordar</span>
            </label>

            <button
              type="button"
              className="auth-link"
              onClick={() => navigate("/olvide-password")}
            >
              Olvidé mi contraseña
            </button>
          </div>

          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Entrando..." : "Entrar"}
          </Button>

          {error && <Alert variant="error">{error}</Alert>}
          {bienvenida && <Alert variant="success">{bienvenida}</Alert>}

          <div className="auth-divider">
            <span>o</span>
          </div>

          <div className="auth-social">
            <Button type="button" variant="secondary">
              Continuar con Google
            </Button>
          </div>

          <p className="auth-bottom-text">
            No tenés una cuenta?{" "}
            <Link to="/registro" className="auth-link">
              Registrarse
            </Link>
          </p>

          <p className="auth-bottom-text">
            Sos administrador de un torneo?{" "}
            <button type="button" className="auth-link" onClick={() => navigate("/admin")}>
              Ingresar como Admin
            </button>
          </p>
        </form>
      </Card>
    </div>
  );
}

export default InicioSesion;
