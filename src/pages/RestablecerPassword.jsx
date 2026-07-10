import "../styles/InicioSesion.css";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";

function RestablecerPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const [nuevaContraseña, setNuevaContraseña] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [mostrarPass, setMostrarPass] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [exito, setExito] = useState(false);

  useEffect(() => {
    document.body.classList.add("bg-login");
    return () => document.body.classList.remove("bg-login");
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("El enlace no es válido. Solicitá uno nuevo.");
      return;
    }

    if (nuevaContraseña.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    if (nuevaContraseña !== confirmar) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setGuardando(true);
    try {
      const response = await fetch("http://localhost:3000/api/jugadores/reset-password", {
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
    <div className="login-wrap">
      <div className="login-card">
        <div className="login-header">
          <h1 className="login-brand">
            Gestor<span>Torneos</span>
          </h1>
          <h2 className="login-title">Elegí una nueva contraseña</h2>
        </div>

        {exito ? (
          <div className="login-form">
            <p className="bottom-text">✅ Tu contraseña fue actualizada correctamente.</p>
            <button className="btn-primary" type="button" onClick={() => navigate("/")}>
              Ir a iniciar sesión
            </button>
          </div>
        ) : (
          <form className="login-form" onSubmit={handleSubmit}>
            <div className="field">
              <label className="field-label" htmlFor="nuevaContraseña">
                Nueva contraseña
              </label>
              <div className="field-control">
                <i className="bx bx-lock-alt field-icon"></i>
                <input
                  id="nuevaContraseña"
                  type={mostrarPass ? "text" : "password"}
                  placeholder="••••••••"
                  value={nuevaContraseña}
                  onChange={(e) => setNuevaContraseña(e.target.value)}
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

            <div className="field">
              <label className="field-label" htmlFor="confirmar">
                Confirmar contraseña
              </label>
              <div className="field-control">
                <i className="bx bx-lock-alt field-icon"></i>
                <input
                  id="confirmar"
                  type={mostrarPass ? "text" : "password"}
                  placeholder="••••••••"
                  value={confirmar}
                  onChange={(e) => setConfirmar(e.target.value)}
                  style={{ textAlign: "left" }}
                  required
                />
              </div>
            </div>

            <button className="btn-primary" type="submit" disabled={guardando}>
              {guardando ? "Guardando..." : "Guardar nueva contraseña"}
            </button>

            {error && <p className="login-error">{error}</p>}

            <p className="bottom-text">
              <Link to="/" className="link-green">
                Volver al inicio de sesión
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

export default RestablecerPassword;
