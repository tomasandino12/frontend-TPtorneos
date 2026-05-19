import "../styles/Registro.css";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

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
  const [mostrarPass, setMostrarPass] = useState(false);
  const [mostrarConfirmar, setMostrarConfirmar] = useState(false);

  useEffect(() => {
    document.body.classList.add("bg-login");
    return () => document.body.classList.remove("bg-login");
  }, []);

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
      const response = await fetch("http://localhost:3000/api/jugadores/registro", {
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

      alert("✅ Registro exitoso. ¡Bienvenido!");
      navigate("/gestorTorneos");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="auth-wrap">
      <div className="auth-card auth-card--wide">
        <div className="auth-header">
          <h1 className="auth-brand">
            Gestor<span>Torneos</span>
          </h1>
          <div className="auth-sep"></div>
          <h2 className="auth-title">Registro de Jugador</h2>
          <p className="auth-subtitle">Completá tus datos para crear tu cuenta</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="grid-2">
            <div className="field">
              <label className="field-label" htmlFor="nombre">Nombre</label>
              <div className="field-control">
                <i className="bx bx-user field-icon"></i>
                <input
                  id="nombre"
                  type="text"
                  name="nombre"
                  value={form.nombre}
                  onChange={handleChange}
                  placeholder="Juan"
                  required
                />
              </div>
            </div>

            <div className="field">
              <label className="field-label" htmlFor="apellido">Apellido</label>
              <div className="field-control">
                <i className="bx bx-user field-icon"></i>
                <input
                  id="apellido"
                  type="text"
                  name="apellido"
                  value={form.apellido}
                  onChange={handleChange}
                  placeholder="Pérez"
                  required
                />
              </div>
            </div>

            <div className="field">
              <label className="field-label" htmlFor="dni">DNI</label>
              <div className="field-control">
                <i className="bx bx-id-card field-icon"></i>
                <input
                  id="dni"
                  type="text"
                  name="dni"
                  value={form.dni}
                  onChange={handleChange}
                  placeholder="40111222"
                  required
                />
              </div>
            </div>

            <div className="field">
              <label className="field-label" htmlFor="email">Email</label>
              <div className="field-control">
                <i className="bx bx-envelope field-icon"></i>
                <input
                  id="email"
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="juanperez@email.com"
                  required
                />
              </div>
              {emailError && <p className="auth-error">{emailError}</p>}
            </div>

            <div className="field">
              <label className="field-label" htmlFor="fecha_nacimiento">Fecha de nacimiento</label>
              <div className="field-control">
                <i className="bx bx-calendar field-icon"></i>
                <input
                  id="fecha_nacimiento"
                  type="date"
                  name="fecha_nacimiento"
                  value={form.fecha_nacimiento}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="field">
              <label className="field-label" htmlFor="posicion">Posición</label>
              <div className="field-control">
                <i className="bx bx-football field-icon"></i>
                <select
                  id="posicion"
                  name="posicion"
                  value={form.posicion}
                  onChange={handleChange}
                  required
                >
                  <option value="" disabled>— Seleccionar posición —</option>
                  <option value="Arquero">Arquero</option>
                  <option value="Defensor">Defensor</option>
                  <option value="Mediocampista">Mediocampista</option>
                  <option value="Delantero">Delantero</option>
                </select>
              </div>
            </div>

            <div className="field field-full">
              <label className="field-label" htmlFor="contraseña">Contraseña</label>
              <div className="field-control">
                <i className="bx bx-lock-alt field-icon"></i>
                <input
                  id="contraseña"
                  type={mostrarPass ? "text" : "password"}
                  name="contraseña"
                  value={form.contraseña}
                  onChange={handleChange}
                  placeholder="••••••••"
                  style={{ textAlign: "left" }}
                  required
                />
                <button
                  type="button"
                  className="field-action"
                  onClick={() => setMostrarPass(!mostrarPass)}
                  aria-label={mostrarPass ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  <i className={`bx ${mostrarPass ? "bx-hide" : "bx-show"}`}></i>
                </button>
              </div>
            </div>

            <div className="field field-full">
              <label className="field-label" htmlFor="confirmarContraseña">Confirmar contraseña</label>
              <div className="field-control">
                <i className="bx bx-lock field-icon"></i>
                <input
                  id="confirmarContraseña"
                  type={mostrarConfirmar ? "text" : "password"}
                  name="confirmarContraseña"
                  value={form.confirmarContraseña}
                  onChange={handleChange}
                  placeholder="••••••••"
                  style={{ textAlign: "left" }}
                  required
                />
                <button
                  type="button"
                  className="field-action"
                  onClick={() => setMostrarConfirmar(!mostrarConfirmar)}
                  aria-label={mostrarConfirmar ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  <i className={`bx ${mostrarConfirmar ? "bx-hide" : "bx-show"}`}></i>
                </button>
              </div>
              {confirmarError && <p className="auth-error">{confirmarError}</p>}
            </div>
          </div>

          <button
            className="btn-primary"
            type="submit"
            disabled={!valido}
            style={{
              opacity: valido ? 1 : 0.6,
              cursor: valido ? "pointer" : "not-allowed",
            }}
          >
            Registrarse
          </button>

          {error && <p className="auth-error">{error}</p>}

          <p className="bottom-text">
            <Link to="/" className="link-green">
              Volver al inicio
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default Registro;
