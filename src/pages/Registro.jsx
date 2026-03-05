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
  });

  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState("");

  useEffect(() => {
    document.body.classList.add("bg-login");
    return () => document.body.classList.remove("bg-login");
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (e.target.name === "email") {
      if (!/\S+@\S+\.\S+/.test(e.target.value)) {
        setEmailError("El email no es válido");
      } else {
        setEmailError("");
      }
    }
  };

  const valido =
    form.nombre.trim().length >= 2 &&
    form.apellido.trim().length >= 2 &&
    /^\d{7,9}$/.test(form.dni) &&
    /\S+@\S+\.\S+/.test(form.email) &&
    form.fecha_nacimiento !== "" &&
    form.posicion !== "" &&
    form.contraseña.length >= 6;

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
    <div className="pagina-fondo-verde">
      <div className="formulario">
        <h1>Registro de Jugador</h1>
        <form onSubmit={handleSubmit}>
          <div className="form-columns">
            <div className="columna">
              <div className="campo">
                <label>Nombre</label>
                <input type="text" name="nombre" value={form.nombre} onChange={handleChange} required />
              </div>

              <div className="campo">
                <label>Apellido</label>
                <input type="text" name="apellido" value={form.apellido} onChange={handleChange} required />
              </div>

              <div className="campo">
                <label>DNI</label>
                <input type="text" name="dni" value={form.dni} onChange={handleChange} required />
              </div>

              <div className="campo">
                <label>Email</label>
                <input type="email" name="email" value={form.email} onChange={handleChange} required />
                {emailError && <p className="error-msg">{emailError}</p>}
              </div>
            </div>

            <div className="columna">
              <div className="campo">
                <label>Fecha de nacimiento</label>
                <input
                  type="date"
                  name="fecha_nacimiento"
                  value={form.fecha_nacimiento}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="campo">
                <label>Posición</label>
                <select
                  name="posicion"
                  value={form.posicion}
                  onChange={handleChange}
                  required
                >
                  <option value="">— Seleccionar posición —</option>
                  <option value="Arquero">Arquero</option>
                  <option value="Defensor">Defensor</option>
                  <option value="Mediocampista">Mediocampista</option>
                  <option value="Delantero">Delantero</option>
                </select>
              </div>

              <div className="campo">
                <label>Contraseña</label>
                <input
                  type="password"
                  name="contraseña"
                  value={form.contraseña}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          </div>

          <input
            type="submit"
            value="Registrarse"
            disabled={!valido}
            style={{
              opacity: valido ? 1 : 0.5,
              cursor: valido ? "pointer" : "not-allowed",
              marginTop: "25px",
            }}
          />

          {error && <p className="error-msg">{error}</p>}

          <div className="registrarse">
            <Link to="/">Volver al inicio</Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Registro;
