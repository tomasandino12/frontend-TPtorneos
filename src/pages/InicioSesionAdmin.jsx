import "../styles/InicioSesion.css";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { FiMail, FiLock } from "react-icons/fi";
import { Button, TextField, Card, Alert } from "../components/ui";

function InicioSesionAdmin() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/adminTorneo/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          contrasena,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Error al iniciar sesión");
      }

      localStorage.setItem("admin", JSON.stringify(data.admin));
      localStorage.setItem("adminToken", data.token);

      navigate("/menu-admin");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <Card className="auth-card">
        <div className="auth-header">
          <span className="auth-badge">Acceso Administrador</span>
          <h1 className="auth-brand">
            Gestor<span>Torneos</span>
          </h1>
          <h2 className="auth-title">Ingreso como Administrador</h2>
          <p className="auth-subtitle">Accedé al panel de gestión de torneos</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <TextField
            label="Email"
            type="email"
            icon={<FiMail />}
            placeholder="admin@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <TextField
            label="Contraseña"
            type="password"
            icon={<FiLock />}
            placeholder="********"
            value={contrasena}
            onChange={(e) => setContrasena(e.target.value)}
            required
          />

          {error && <Alert variant="error">{error}</Alert>}

          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Ingresando..." : "Entrar como Admin"}
          </Button>

          <p className="auth-bottom-text">
            Volver al inicio como{" "}
            <button type="button" className="auth-link" onClick={() => navigate("/")}>
              Usuario
            </button>
          </p>
        </form>
      </Card>
    </div>
  );
}

export default InicioSesionAdmin;
