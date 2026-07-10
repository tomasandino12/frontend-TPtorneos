import "../styles/InicioSesion.css";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { FiMail } from "react-icons/fi";
import { Button, TextField, Card, Alert } from "../components/ui";

function OlvidePassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState("");

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
    <div className="auth-page">
      <Card className="auth-card">
        <div className="auth-header">
          <h1 className="auth-brand">
            Gestor<span>Torneos</span>
          </h1>
          <h2 className="auth-title">Recuperar contraseña</h2>
          <p className="auth-subtitle">
            Ingresá tu email y te enviaremos instrucciones para restablecer tu contraseña.
          </p>
        </div>

        {enviado ? (
          <div className="auth-form">
            <Alert variant="success">
              Si el email existe en nuestro sistema, vas a recibir un correo con las
              instrucciones para restablecer tu contraseña.
            </Alert>
            <Button type="button" onClick={() => navigate("/")}>
              Volver al inicio de sesión
            </Button>
          </div>
        ) : (
          <form className="auth-form" onSubmit={handleSubmit}>
            <TextField
              label="Email"
              type="email"
              icon={<FiMail />}
              placeholder="juanperez@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            {error && <Alert variant="error">{error}</Alert>}

            <Button type="submit" disabled={enviando}>
              {enviando ? "Enviando..." : "Enviar instrucciones"}
            </Button>

            <p className="auth-bottom-text">
              <Link to="/" className="auth-link">
                Volver al inicio de sesión
              </Link>
            </p>
          </form>
        )}
      </Card>
    </div>
  );
}

export default OlvidePassword;
