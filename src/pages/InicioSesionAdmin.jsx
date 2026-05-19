import "../styles/InicioSesionAdmin.css";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

function MenuAdmin() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [mostrarPass, setMostrarPass] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    document.body.classList.add("bg-login");
    return () => document.body.classList.remove("bg-login");
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:3000/api/adminTorneo/login", {
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

      localStorage.setItem("admin", JSON.stringify(data.admin));
      localStorage.setItem("adminToken", data.token);

      navigate("/menu-admin");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-wrap">
      <div className="login-card">
        
        <div className="login-header">
          <h1 className="login-brand">
            Gestor<span>Torneos</span>
          </h1>
          <h2 className="login-title">Ingreso como Administrador</h2>
          <p className="login-subtitle">
            Accedé al panel de gestión de torneos
          </p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          
          <div className="field">
            <label className="field-label">Email</label>
            <div className="field-control">
              <span className="field-icon">📧</span>
              <input
                type="email"
                placeholder="admin@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="field">
            <label className="field-label">Contraseña</label>
            <div className="field-control">
              <span className="field-icon">🔒</span>
              <input
                type={mostrarPass ? "text" : "password"}
                placeholder="********"
                value={contrasena}
                onChange={(e) => setContrasena(e.target.value)}
                style={{ textAlign: "left" }}
                required
              />
              <button
                type="button"
                className="field-action"
                onClick={() => setMostrarPass(!mostrarPass)}
              >
                👁
              </button>
            </div>
          </div>

          {error && <p className="login-error">{error}</p>}

          <button className="btn-primary" disabled={isLoading}>
            {isLoading ? "Ingresando..." : "Entrar como Admin"}
          </button>

          <p className="bottom-text">
            Volver al inicio{" "}
            <span
              className="link-green"
              onClick={() => navigate("/")}
            >
              Usuario
            </span>
          </p>
        </form>
      </div>
    </div>
  );
}

export default MenuAdmin;