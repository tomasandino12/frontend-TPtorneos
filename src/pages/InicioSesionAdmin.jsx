import "../styles/InicioSesion.css";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FiMail, FiLock } from "react-icons/fi";
import { Button, TextField, Card, Alert } from "../components/ui";
import { useAdmin } from "../context/AdminContext.jsx";

// Email: mismo regex/mensaje que Registro.jsx (reusado).
// Contraseña: es un LOGIN, no una alta — acá solo se valida "no vacía",
// nunca un largo mínimo. Poner un mínimo de caracteres rechazaría a un
// usuario real cuya contraseña ya existente sea más corta que ese mínimo
// (el backend es quien decide si las credenciales son válidas o no, esto
// solo evita mandar el form vacío).
const loginAdminSchema = z.object({
  email: z.string().regex(/\S+@\S+\.\S+/, "El email no es válido"),
  contrasena: z.string().min(1, "La contraseña es obligatoria."),
});

function InicioSesionAdmin() {
  const navigate = useNavigate();
  const { login } = useAdmin();

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginAdminSchema),
    defaultValues: { email: "", contrasena: "" },
  });

  const onSubmit = async ({ email, contrasena }) => {
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

      login(data.admin, data.token);

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

        <form className="auth-form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <TextField
            label="Email"
            type="email"
            icon={<FiMail />}
            placeholder="admin@email.com"
            error={errors.email?.message}
            {...register("email")}
          />

          <TextField
            label="Contraseña"
            type="password"
            icon={<FiLock />}
            placeholder="********"
            error={errors.contrasena?.message}
            {...register("contrasena")}
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
