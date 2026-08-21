import "../styles/InicioSesion.css";
import "../styles/Registro.css";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FiUser, FiCreditCard, FiMail, FiCalendar, FiFlag, FiLock } from "react-icons/fi";
import { Button, TextField, Card, Alert } from "../components/ui";

// nombre/apellido/dni/posicion/genero/contraseña nunca mostraron un mensaje
// propio (solo alimentaban el booleano `valido` para deshabilitar el botón)
// — esos mensajes existen acá porque zod los pide, pero no se conectan a
// ningún TextField. email/fecha_nacimiento/confirmarContraseña sí mostraban
// texto, y son los únicos con `error=` en el JSX.
const registroSchema = z
  .object({
    // .refine en vez de z.string().trim() como transform: el chequeo original
    // usa el nombre recortado, pero lo que se manda al backend es el valor
    // tal cual se tipeó (sin recortar) — no hay que alterar el valor acá.
    nombre: z.string().refine((v) => v.trim().length >= 2, "El nombre debe tener al menos 2 caracteres."),
    apellido: z.string().refine((v) => v.trim().length >= 2, "El apellido debe tener al menos 2 caracteres."),
    dni: z.string().regex(/^\d{7,9}$/, "El DNI no es válido."),
    email: z.string().regex(/\S+@\S+\.\S+/, "El email no es válido"),
    fecha_nacimiento: z.string(),
    posicion: z.string().min(1, "Elegí tu posición."),
    genero: z.string().min(1, "Elegí tu género."),
    contraseña: z.string().min(6, "La contraseña debe tener al menos 6 caracteres."),
    confirmarContraseña: z.string(),
  })
  // fecha_nacimiento y confirmarContraseña necesitan mirar el resto del
  // objeto (validarFechaNacimiento no depende de otros campos, pero se
  // valida acá igual por consistencia) — un campo vacío nunca mostró texto
  // (mensaje "", TextField no lo pinta), solo bloqueaba el submit vía
  // `valido`; con datos, sí se valida y se muestra el mensaje real.
  .superRefine((data, ctx) => {
    if (data.fecha_nacimiento === "") {
      ctx.addIssue({ code: "custom", message: "", path: ["fecha_nacimiento"] });
    } else {
      const fecha = new Date(data.fecha_nacimiento);
      if (Number.isNaN(fecha.getTime())) {
        ctx.addIssue({ code: "custom", message: "La fecha de nacimiento no es válida", path: ["fecha_nacimiento"] });
      } else if (fecha.getTime() > Date.now()) {
        ctx.addIssue({ code: "custom", message: "La fecha de nacimiento no puede ser una fecha futura", path: ["fecha_nacimiento"] });
      } else {
        const hoy = new Date();
        let edad = hoy.getFullYear() - fecha.getFullYear();
        const mesDiff = hoy.getMonth() - fecha.getMonth();
        if (mesDiff < 0 || (mesDiff === 0 && hoy.getDate() < fecha.getDate())) edad--;
        if (edad < 5 || edad > 100) {
          ctx.addIssue({ code: "custom", message: "La edad resultante está fuera de un rango razonable", path: ["fecha_nacimiento"] });
        }
      }
    }

    if (data.confirmarContraseña === "") {
      ctx.addIssue({ code: "custom", message: "", path: ["confirmarContraseña"] });
    } else if (data.confirmarContraseña !== data.contraseña) {
      ctx.addIssue({ code: "custom", message: "Las contraseñas no coinciden", path: ["confirmarContraseña"] });
    }
  });

function Registro() {
  const navigate = useNavigate();

  const [error, setError] = useState("");
  const [exito, setExito] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm({
    resolver: zodResolver(registroSchema),
    mode: "onChange",
    defaultValues: {
      nombre: "",
      apellido: "",
      dni: "",
      email: "",
      fecha_nacimiento: "",
      posicion: "",
      genero: "",
      contraseña: "",
      confirmarContraseña: "",
    },
  });

  const onSubmitRegistro = async (values) => {
    setError("");

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/jugadores/registro`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: values.nombre,
          apellido: values.apellido,
          dni: values.dni,
          email: values.email,
          fechaNacimiento: values.fecha_nacimiento,
          posicion: values.posicion,
          genero: values.genero,
          contraseña: values.contraseña,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al registrarse");
      }

      const data = await response.json();

      localStorage.setItem("token", data.token);
      const nuevoJugador = {
        id: data.id || null,
        nombre: values.nombre,
        apellido: values.apellido,
        email: values.email,
        posicion: values.posicion,
        equipo: null,
        esCapitan: false,
      };
      localStorage.setItem("jugador", JSON.stringify(nuevoJugador));

      setExito("Registro exitoso. ¡Bienvenido!");
      setTimeout(() => navigate("/gestorTorneos"), 900);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="auth-page">
      <Card className="auth-card auth-card-wide">
        <div className="auth-header">
          <h1 className="auth-brand">
            Gestor<span>Torneos</span>
          </h1>
          <h2 className="auth-title">Registro de Jugador</h2>
          <p className="auth-subtitle">Completá tus datos para crear tu cuenta</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit(onSubmitRegistro)} noValidate>
          <div className="auth-grid-2">
            <TextField
              label="Nombre"
              icon={<FiUser />}
              placeholder="Juan"
              {...register("nombre")}
            />

            <TextField
              label="Apellido"
              icon={<FiUser />}
              placeholder="Pérez"
              {...register("apellido")}
            />

            <TextField
              label="DNI"
              icon={<FiCreditCard />}
              placeholder="40111222"
              {...register("dni")}
            />

            <TextField
              label="Email"
              type="email"
              icon={<FiMail />}
              placeholder="juanperez@email.com"
              error={errors.email?.message}
              {...register("email")}
            />

            <TextField
              label="Fecha de nacimiento"
              type="date"
              icon={<FiCalendar />}
              error={errors.fecha_nacimiento?.message}
              {...register("fecha_nacimiento")}
            />

            <div className="ui-field">
              <label className="ui-field-label" htmlFor="posicion">
                Posición
              </label>
              <div className="ui-field-control">
                <FiFlag className="ui-field-icon" />
                <select
                  id="posicion"
                  className="ui-field-input"
                  {...register("posicion")}
                >
                  <option value="" disabled>
                    — Seleccionar posición —
                  </option>
                  <option value="Arquero">Arquero</option>
                  <option value="Defensor">Defensor</option>
                  <option value="Mediocampista">Mediocampista</option>
                  <option value="Delantero">Delantero</option>
                </select>
              </div>
            </div>

            <div className="ui-field">
              <label className="ui-field-label" htmlFor="genero">
                Género
              </label>
              <div className="ui-field-control">
                <FiFlag className="ui-field-icon" />
                <select
                  id="genero"
                  className="ui-field-input"
                  {...register("genero")}
                >
                  <option value="" disabled>
                    — Seleccionar género —
                  </option>
                  <option value="femenino">Femenino</option>
                  <option value="masculino">Masculino</option>
                </select>
              </div>
            </div>

            <TextField
              label="Contraseña"
              type="password"
              icon={<FiLock />}
              placeholder="••••••••"
              className="auth-field-full"
              {...register("contraseña")}
            />

            <TextField
              label="Confirmar contraseña"
              type="password"
              icon={<FiLock />}
              placeholder="••••••••"
              error={errors.confirmarContraseña?.message}
              className="auth-field-full"
              {...register("confirmarContraseña")}
            />
          </div>

          <Button type="submit" disabled={!isValid}>
            Registrarse
          </Button>

          {error && <Alert variant="error">{error}</Alert>}
          {exito && <Alert variant="success">{exito}</Alert>}

          <p className="auth-bottom-text">
            <Link to="/" className="auth-link">
              Volver al inicio
            </Link>
          </p>
        </form>
      </Card>
    </div>
  );
}

export default Registro;
