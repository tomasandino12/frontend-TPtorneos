import "../styles/InicioSesion.css";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useState } from "react";
import { FiLock } from "react-icons/fi";
import { Button, TextField, Card, Alert } from "../components/ui";

function RestablecerPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const [nuevaContraseña, setNuevaContraseña] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [exito, setExito] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("El enlace no es válido. Solicitá uno nuevo.");
      return;
    }

    if (nuevaContraseña.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    if (nuevaContraseña !== confirmar) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setGuardando(true);
    try {
      const response = await fetch("http://localhost:3000/api/jugadores/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, nuevaContraseña }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "No se pudo restablecer la contraseña");

      setExito(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="auth-page">
      <Card className="auth-card">
        <div className="auth-header">
          <h1 className="auth-brand">
            Gestor<span>Torneos</span>
          </h1>
          <h2 className="auth-title">Elegí una nueva contraseña</h2>
        </div>

        {exito ? (
          <div className="auth-form">
            <Alert variant="success">Tu contraseña fue actualizada correctamente.</Alert>
            <Button type="button" onClick={() => navigate("/")}>
              Ir a iniciar sesión
            </Button>
          </div>
        ) : (
          <form className="auth-form" onSubmit={handleSubmit}>
            <TextField
              label="Nueva contraseña"
              type="password"
              icon={<FiLock />}
              placeholder="••••••••"
              value={nuevaContraseña}
              onChange={(e) => setNuevaContraseña(e.target.value)}
              required
            />

            <TextField
              label="Confirmar contraseña"
              type="password"
              icon={<FiLock />}
              placeholder="••••••••"
              value={confirmar}
              onChange={(e) => setConfirmar(e.target.value)}
              required
            />

            {error && <Alert variant="error">{error}</Alert>}

            <Button type="submit" disabled={guardando}>
              {guardando ? "Guardando..." : "Guardar nueva contraseña"}
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

export default RestablecerPassword;
