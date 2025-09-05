import "../styles/InicioSesion.css"; // o el CSS que estés usando
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

function Registro() {
  const navigate = useNavigate();

  useEffect(() => {
    document.body.classList.add("bg-login");
    return () => document.body.classList.remove("bg-login");
  }, []);

  const [form, setForm] = useState({
    nombreUsuario: "",
    email: "",
    password: "",
    confirmar: "",
  });

  const valido =
    form.nombreUsuario.trim().length >= 3 &&
    /\S+@\S+\.\S+/.test(form.email) &&
    form.password.length >= 6 &&
    form.password === form.confirmar;

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!valido) return;
    // TODO: enviar al backend
    navigate("/gestorTorneos");
  };

  return (
    <div className="pagina-fondo-verde">
      <div className="formulario">
        <h1>Registrarse</h1>
        <form onSubmit={handleSubmit}>
          <div className="username">
            <input
              type="text"
              name="nombreUsuario"
              value={form.nombreUsuario}
              onChange={handleChange}
              required
            />
            <label>Nombre de usuario</label>
            <span></span>
          </div>

          <div className="username">
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

          <div className="contraseña">
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
            />
            <label>Contraseña</label>
            <span></span>
          </div>

          <div className="contraseña">
            <input
              type="password"
              name="confirmar"
              value={form.confirmar}
              onChange={handleChange}
              required
            />
            <label>Confirmar contraseña</label>
            <span></span>
          </div>

          <input
            type="submit"
            value="Registrarse"
            disabled={!valido}
            style={{ opacity: valido ? 1 : 0.5, cursor: valido ? "pointer" : "not-allowed" }}
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
