import "../styles/InicioSesion.css";
import "../styles/Registro.css";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { FiUser, FiCreditCard, FiMail, FiCalendar, FiFlag, FiLock } from "react-icons/fi";
import { Button, TextField, Card, Alert } from "../components/ui";

function Registro() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    nombre: "",
    apellido: "",
    dni: "",
    email: "",
    fecha_nacimiento: "",
    posicion: "",
    contraseña: "",
    confirmarContraseña: "",
  });

  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [confirmarError, setConfirmarError] = useState("");
  const [exito, setExito] = useState("");

  const handleChange = (e) => {
    const updated = { ...form, [e.target.name]: e.target.value };
    setForm(updated);
    if (e.target.name === "email") {
      if (!/\S+@\S+\.\S+/.test(e.target.value)) setEmailError("El email no es válido");
      else setEmailError("");
    }
    if (e.target.name === "contraseña" || e.target.name === "confirmarContraseña") {
      const nueva = e.target.name === "contraseña" ? e.target.value : updated.contraseña;
      const confirmar = e.target.name === "confirmarContraseña" ? e.target.value : updated.confirmarContraseña;
      if (confirmar && nueva !== confirmar) setConfirmarError("Las contraseñas no coinciden");
      else setConfirmarError("");
    }
  };

  const valido =
    form.nombre.trim().length >= 2 &&
    form.apellido.trim().length >= 2 &&
    /^\d{7,9}$/.test(form.dni) &&
    /\S+@\S+\.\S+/.test(form.email) &&
    form.fecha_nacimiento !== "" &&
    form.posicion !== "" &&
    form.contraseña.length >= 6 &&
    form.confirmarContraseña === form.contraseña &&
    form.confirmarContraseña !== "";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/jugadores/registro`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: form.nombre,
          apellido: form.apellido,
          dni: form.dni,
          email: form.email,
          fechaNacimiento: form.fecha_nacimiento,
          posicion: form.posicion,
          contraseña: form.contraseña,
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
        nombre: form.nombre,
        apellido: form.apellido,
        email: form.email,
        posicion: form.posicion,
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

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-grid-2">
            <TextField
              label="Nombre"
              icon={<FiUser />}
              name="nombre"
              value={form.nombre}
              onChange={handleChange}
              placeholder="Juan"
              required
            />

            <TextField
              label="Apellido"
              icon={<FiUser />}
              name="apellido"
              value={form.apellido}
              onChange={handleChange}
              placeholder="Pérez"
              required
            />

            <TextField
              label="DNI"
              icon={<FiCreditCard />}
              name="dni"
              value={form.dni}
              onChange={handleChange}
              placeholder="40111222"
              required
            />

            <TextField
              label="Email"
              type="email"
              icon={<FiMail />}
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="juanperez@email.com"
              error={emailError}
              required
            />

            <TextField
              label="Fecha de nacimiento"
              type="date"
              icon={<FiCalendar />}
              name="fecha_nacimiento"
              value={form.fecha_nacimiento}
              onChange={handleChange}
              required
            />

            <div className="ui-field">
              <label className="ui-field-label" htmlFor="posicion">
                Posición
              </label>
              <div className="ui-field-control">
                <FiFlag className="ui-field-icon" />
                <select
                  id="posicion"
                  name="posicion"
                  className="ui-field-input"
                  value={form.posicion}
                  onChange={handleChange}
                  required
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

            <TextField
              label="Contraseña"
              type="password"
              icon={<FiLock />}
              name="contraseña"
              value={form.contraseña}
              onChange={handleChange}
              placeholder="••••••••"
              className="auth-field-full"
              required
            />

            <TextField
              label="Confirmar contraseña"
              type="password"
              icon={<FiLock />}
              name="confirmarContraseña"
              value={form.confirmarContraseña}
              onChange={handleChange}
              placeholder="••••••••"
              error={confirmarError}
              className="auth-field-full"
              required
            />
          </div>

          <Button type="submit" disabled={!valido}>
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
