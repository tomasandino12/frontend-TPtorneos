import "../styles/InicioSesion.css";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FiMail } from "react-icons/fi";
import { Button, TextField, Card, Alert } from "../components/ui";

// Mismo regex y mismo mensaje que Registro.jsx (email) — reusado, no inventado.
const olvidePasswordSchema = z.object({
  email: z.string().regex(/\S+@\S+\.\S+/, "El email no es válido"),
});

function OlvidePassword() {
  const navigate = useNavigate();
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(olvidePasswordSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = async ({ email }) => {
    setError("");
    setEnviando(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/jugadores/forgot-password`, {
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
          <form className="auth-form" onSubmit={handleSubmit(onSubmit)} noValidate>
            <TextField
              label="Email"
              type="email"
              icon={<FiMail />}
              placeholder="juanperez@email.com"
              error={errors.email?.message}
              {...register("email")}
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
