import "../styles/InicioSesion.css";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

function Registro() {
  const navigate = useNavigate();

  useEffect(() => {
    document.body.classList.add("bg-login");
    return () => document.body.classList.remove("bg-login");
  }, []);

  const [form, setForm] = useState({
    nombre: "",
    apellido: "",
    dni: "",
    email: "",
    fecha_nacimiento: "",
    posicion: "",
    contraseña: "",
  });

  const valido =
    form.nombre.trim().length >= 2 &&
    form.apellido.trim().length >= 2 &&
    /^\d{9}$/.test(form.dni) &&
    /\S+@\S+\.\S+/.test(form.email) &&
    form.fecha_nacimiento !== "" &&
    form.posicion.trim().length >= 2 &&
    form.contraseña.length >= 6;

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!valido) return;

    // TODO: enviar form al backend
    console.log("Datos del jugador:", form);
    navigate("/gestorTorneos");
  };

  return (
  <div className="pagina-fondo-verde">
    <div className="formulario">
      <h1>Registrarse</h1>
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

        <div className="registrarse">
          <Link to="/">Volver al inicio</Link>
        </div>
      </form>
    </div>
  </div>
);

}

export default Registro;

