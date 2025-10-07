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

  useEffect(() => {
    document.body.classList.add("bg-login");
    return () => document.body.classList.remove("bg-login");
  }, []);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const valido =
    form.nombre.trim().length >= 2 &&
    form.apellido.trim().length >= 2 &&
    /^\d{7,9}$/.test(form.dni) &&
    /\S+@\S+\.\S+/.test(form.email) &&
    form.fecha_nacimiento !== "" &&
    form.posicion.trim().length >= 2 &&
    form.contraseña.length >= 6;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = await fetch("http://localhost:3000/api/jugadores/registro", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
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
      const token = data.token;

      localStorage.setItem("token", token);

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
                <input
                  type="text"
                  name="nombre"
                  value={form.nombre}
                  onChange={handleChange}
                  required
                />
                <label>Nombre</label>
                <span></span>
              </div>

              <div className="campo">
                <input
                  type="text"
                  name="apellido"
                  value={form.apellido}
                  onChange={handleChange}
                  required
                />
                <label>Apellido</label>
                <span></span>
              </div>

              <div className="campo">
                <input
                  type="text"
                  name="dni"
                  value={form.dni}
                  onChange={handleChange}
                  required
                />
                <label>DNI</label>
                <span></span>
              </div>

              <div className="campo">
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                />
                <label>Email</label>
                <span></span>
              </div>
            </div>

            <div className="columna">
              <div className="campo">
                <input
                  type="date"
                  name="fecha_nacimiento"
                  value={form.fecha_nacimiento}
                  onChange={handleChange}
                  required
                />
                <label>Fecha de nacimiento</label>
                <span></span>
              </div>

              <div className="campo">
                <input
                  type="text"
                  name="posicion"
                  value={form.posicion}
                  onChange={handleChange}
                  required
                />
                <label>Posición</label>
                <span></span>
              </div>

              <div className="campo">
                <input
                  type="password"
                  name="contraseña"
                  value={form.contraseña}
                  onChange={handleChange}
                  required
                />
                <label>Contraseña</label>
                <span></span>
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
              marginTop: "20px"
            }}
          />

          {error && <p style={{ color: "red", marginTop: "10px" }}>{error}</p>}

          <div className="registrarse">
            <Link to="/InicioSesion">Volver al inicio</Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Registro;
