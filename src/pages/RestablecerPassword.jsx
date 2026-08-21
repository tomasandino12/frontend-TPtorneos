import "../styles/InicioSesion.css";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FiLock } from "react-icons/fi";
import { Button, TextField, Card, Alert } from "../components/ui";

const restablecerSchema = z
  .object({
    nuevaContraseña: z.string().min(6, "La contraseña debe tener al menos 6 caracteres."),
    confirmar: z.string(),
  })
  .refine((data) => data.nuevaContraseña === data.confirmar, {
    message: "Las contraseñas no coinciden.",
    path: ["confirmar"],
  });

function RestablecerPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [exito, setExito] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(restablecerSchema),
    defaultValues: { nuevaContraseña: "", confirmar: "" },
  });

  // Mismo Alert genérico único que antes (no por campo) — cubre tanto la
  // validación de zod como el chequeo de token, que no es un campo del form.
  const mensajeValidacion = errors.nuevaContraseña?.message || errors.confirmar?.message;

  const onSubmit = async ({ nuevaContraseña }) => {
    setError("");

    if (!token) {
      setError("El enlace no es válido. Solicitá uno nuevo.");
      return;
    }

    setGuardando(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/jugadores/reset-password`, {
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
          <form className="auth-form" onSubmit={handleSubmit(onSubmit)} noValidate>
            <TextField
              label="Nueva contraseña"
              type="password"
              icon={<FiLock />}
              placeholder="••••••••"
              {...register("nuevaContraseña")}
            />

            <TextField
              label="Confirmar contraseña"
              type="password"
              icon={<FiLock />}
              placeholder="••••••••"
              {...register("confirmar")}
            />

            {(error || mensajeValidacion) && <Alert variant="error">{error || mensajeValidacion}</Alert>}

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
