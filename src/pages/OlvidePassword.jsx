import "../styles/InicioSesion.css";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

function OlvidePassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    document.body.classList.add("bg-login");
    return () => document.body.classList.remove("bg-login");
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setEnviando(true);

    try {
      const response = await fetch("http://localhost:3000/api/jugadores/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Error al procesar la solicitud");
      }

      setEnviado(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="login-wrap">
      <div className="login-card">
        <div className="login-header">
          <h1 className="login-brand">
            Gestor<span>Torneos</span>
          </h1>
          <h2 className="login-title">Recuperar contraseña</h2>
          <p className="login-subtitle">
            Ingresá tu email y te enviaremos instrucciones para restablecer tu contraseña.
          </p>
        </div>

        {enviado ? (
          <div className="login-form">
            <p className="bottom-text">
              Si el email existe en nuestro sistema, vas a recibir un correo con las
              instrucciones para restablecer tu contraseña.
            </p>
            <button className="btn-primary" type="button" onClick={() => navigate("/")}>
              Volver al inicio de sesión
            </button>
          </div>
        ) : (
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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <button className="btn-primary" type="submit" disabled={enviando}>
              {enviando ? "Enviando..." : "Enviar instrucciones"}
            </button>

            {error && <p className="login-error">{error}</p>}

            <p className="bottom-text">
              <Link to="/" className="link-green">
                Volver al inicio de sesión
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

export default OlvidePassword;
