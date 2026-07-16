import "../styles/InicioSesion.css";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { FiMail, FiLock, FiCreditCard, FiCalendar, FiFlag } from "react-icons/fi";
import { GoogleLogin } from "@react-oauth/google";
import { apiFetch } from "../utils/api.js";
import { Button, TextField, Card, Alert, Modal } from "../components/ui";

// Lee el payload de un JWT sin verificar su firma (eso lo hace el backend).
// Alcanza con base64url→JSON nativo del browser — no hace falta ninguna
// librería como jwt-decode solo para leer un par de campos públicos.
function decodificarPayloadJWT(token) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}

function InicioSesion() {
  const navigate = useNavigate();

  const [usuario, setUsuario] = useState("");
  const [contraseña, setContraseña] = useState("");
  const [recordar, setRecordar] = useState(false);
  const [error, setError] = useState("");
  const [bienvenida, setBienvenida] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Login con Google
  const [googleError, setGoogleError] = useState("");
  const [enviandoGoogle, setEnviandoGoogle] = useState(false);
  const [credentialPendiente, setCredentialPendiente] = useState(null);
  const [datosGooglePendiente, setDatosGooglePendiente] = useState(null);
  const [datosFaltantes, setDatosFaltantes] = useState({ dni: "", fechaNacimiento: "", posicion: "" });
  const [datosFaltantesError, setDatosFaltantesError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/jugadores/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: usuario,
          contraseña: contraseña
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al iniciar sesión");
      }

      const data = await response.json();
      localStorage.setItem("token", data.token);

      const jugadorResp = await apiFetch(
        `/jugadores/by-email?email=${encodeURIComponent(usuario)}`
      );

      if (!jugadorResp.ok) {
        const err = await jugadorResp.json();
        throw new Error(err.message || "No se pudo obtener el jugador");
      }

      const jugadorJson = await jugadorResp.json();
      const jugador = jugadorJson.data;

      localStorage.removeItem("jugador");
      localStorage.setItem("jugador", JSON.stringify(jugador));

      if (recordar) localStorage.setItem("rememberEmail", usuario);
      else localStorage.removeItem("rememberEmail");

      setBienvenida(`Bienvenido ${jugador.nombre}!`);
      setTimeout(() => navigate("/gestorTorneos/inicio"), 900);
    } catch (err) {
      console.error("Error en inicio de sesión:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // credential: el id_token que devuelve Google (GoogleLogin), sin verificar
  // acá — la verificación real la hace el backend. datosExtra son dni/
  // fechaNacimiento/posicion, solo cuando se está completando un registro
  // nuevo (ver el modal más abajo).
  const enviarGoogleLogin = async (credential, datosExtra) => {
    setEnviandoGoogle(true);
    setGoogleError("");
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/jugadores/google-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential, ...datosExtra }),
      });
      const data = await response.json();

      if (response.status === 400 && /dni|fechaNacimiento|posicion/i.test(data.message || "")) {
        // Jugador nuevo — el backend necesita 3 campos más para completar el alta.
        // Se guarda el credential para reenviarlo junto con esos campos.
        setCredentialPendiente(credential);
        setDatosGooglePendiente(decodificarPayloadJWT(credential));
        return;
      }

      if (response.status === 401) {
        throw new Error("No pudimos verificar tu cuenta de Google. Probá de nuevo.");
      }

      if (!response.ok) {
        throw new Error(data.message || "Error al iniciar sesión con Google.");
      }

      localStorage.setItem("token", data.token);

      // El 201 (registro) trae el id directo; el 200 (login) solo trae el
      // token, así que el id sale de ahí — es el mismo JWT que emite el login
      // tradicional (mismo shape), y ya lo tenemos en localStorage recién
      // guardado, así que leerlo acá es leer nuestro propio token, no el de
      // Google.
      const idJugador = data.id ?? decodificarPayloadJWT(data.token)?.id;
      const jugadorResp = await apiFetch(`/jugadores/${idJugador}`);
      if (!jugadorResp.ok) {
        const err = await jugadorResp.json();
        throw new Error(err.message || "No se pudo obtener el jugador");
      }
      const jugadorJson = await jugadorResp.json();
      const jugador = jugadorJson.data;

      localStorage.removeItem("jugador");
      localStorage.setItem("jugador", JSON.stringify(jugador));

      setCredentialPendiente(null);
      setDatosGooglePendiente(null);
      setBienvenida(`Bienvenido ${jugador.nombre}!`);
      setTimeout(() => navigate("/gestorTorneos/inicio"), 900);
    } catch (err) {
      console.error("Error en login con Google:", err);
      setGoogleError(err.message);
    } finally {
      setEnviandoGoogle(false);
    }
  };

  const handleGoogleSuccess = (credentialResponse) => {
    enviarGoogleLogin(credentialResponse.credential);
  };

  const handleGoogleError = () => {
    setGoogleError("No pudimos conectar con Google. Probá de nuevo.");
  };

  const handleCompletarRegistroGoogle = (e) => {
    e.preventDefault();
    setDatosFaltantesError("");

    if (!/^\d{7,9}$/.test(datosFaltantes.dni)) {
      setDatosFaltantesError("El DNI debe tener entre 7 y 9 dígitos.");
      return;
    }
    if (!datosFaltantes.fechaNacimiento) {
      setDatosFaltantesError("Ingresá tu fecha de nacimiento.");
      return;
    }
    if (!datosFaltantes.posicion) {
      setDatosFaltantesError("Elegí tu posición.");
      return;
    }

    enviarGoogleLogin(credentialPendiente, datosFaltantes);
  };

  useEffect(() => {
    const remembered = localStorage.getItem("rememberEmail");
    if (remembered) {
      setUsuario(remembered);
      setRecordar(true);
    }
  }, []);

  return (
    <div className="auth-page">
      <Card className="auth-card">
        <div className="auth-header">
          <h1 className="auth-brand">
            Gestor<span>Torneos</span>
          </h1>
          <h2 className="auth-title">Bienvenido de vuelta!</h2>
          <p className="auth-subtitle">
            Ingresá tus datos para acceder a los datos del torneo
          </p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <TextField
            label="Email"
            type="email"
            icon={<FiMail />}
            placeholder="juanperez@email.com"
            value={usuario}
            onChange={(e) => setUsuario(e.target.value)}
            required
          />

          <TextField
            label="Contraseña"
            type="password"
            icon={<FiLock />}
            placeholder="••••••••"
            value={contraseña}
            onChange={(e) => setContraseña(e.target.value)}
            required
          />

          <div className="auth-row-between">
            <label className="auth-check">
              <input
                type="checkbox"
                checked={recordar}
                onChange={(e) => setRecordar(e.target.checked)}
              />
              <span>Recordar</span>
            </label>

            <button
              type="button"
              className="auth-link"
              onClick={() => navigate("/olvide-password")}
            >
              Olvidé mi contraseña
            </button>
          </div>

          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Entrando..." : "Entrar"}
          </Button>

          {error && <Alert variant="error">{error}</Alert>}
          {bienvenida && <Alert variant="success">{bienvenida}</Alert>}

          <div className="auth-divider">
            <span>o</span>
          </div>

          {googleError && <Alert variant="error">{googleError}</Alert>}

          <div className="auth-social">
            {/* El botón visible es el del sistema de diseño (mismo look que
                el resto de la app); el botón real de Google (obligatorio
                para poder emitir un credential/id_token) se renderiza
                encima, invisible, así el click cae sobre el de Google de
                verdad — ver .google-btn-overlay en InicioSesion.css. */}
            <div className="google-btn-wrapper">
              <Button type="button" variant="secondary" disabled={enviandoGoogle}>
                {enviandoGoogle ? "Conectando con Google..." : "Continuar con Google"}
              </Button>
              <div className="google-btn-overlay">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  width="320"
                />
              </div>
            </div>
          </div>

          <p className="auth-bottom-text">
            No tenés una cuenta?{" "}
            <Link to="/registro" className="auth-link">
              Registrarse
            </Link>
          </p>

          <p className="auth-bottom-text">
            Sos administrador de un torneo?{" "}
            <button type="button" className="auth-link" onClick={() => navigate("/admin")}>
              Ingresar como Admin
            </button>
          </p>
        </form>
      </Card>

      {/* Datos faltantes para completar el alta de un jugador nuevo vía
          Google — el credential ya se validó una vez contra el backend
          (por eso llegamos acá), se reenvía junto con estos 3 campos. */}
      <Modal
        open={!!credentialPendiente}
        onClose={() => {
          setCredentialPendiente(null);
          setDatosGooglePendiente(null);
          setDatosFaltantesError("");
        }}
        title="Completá tu registro"
      >
        <p className="auth-subtitle">
          {datosGooglePendiente?.email
            ? `Estás por crear tu cuenta como ${datosGooglePendiente.name || datosGooglePendiente.email} (${datosGooglePendiente.email}). `
            : ""}
          Necesitamos estos datos para terminar de crear tu cuenta.
        </p>

        <form className="auth-form" onSubmit={handleCompletarRegistroGoogle}>
          <TextField
            label="DNI"
            icon={<FiCreditCard />}
            value={datosFaltantes.dni}
            onChange={(e) => setDatosFaltantes({ ...datosFaltantes, dni: e.target.value })}
            placeholder="40111222"
            required
          />

          <TextField
            label="Fecha de nacimiento"
            type="date"
            icon={<FiCalendar />}
            value={datosFaltantes.fechaNacimiento}
            onChange={(e) => setDatosFaltantes({ ...datosFaltantes, fechaNacimiento: e.target.value })}
            required
          />

          <div className="ui-field">
            <label className="ui-field-label" htmlFor="posicion-google">
              Posición
            </label>
            <div className="ui-field-control">
              <FiFlag className="ui-field-icon" />
              <select
                id="posicion-google"
                className="ui-field-input"
                value={datosFaltantes.posicion}
                onChange={(e) => setDatosFaltantes({ ...datosFaltantes, posicion: e.target.value })}
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

          {datosFaltantesError && <Alert variant="error">{datosFaltantesError}</Alert>}
          {googleError && <Alert variant="error">{googleError}</Alert>}

          <Button type="submit" disabled={enviandoGoogle}>
            {enviandoGoogle ? "Creando cuenta..." : "Confirmar y crear cuenta"}
          </Button>
        </form>
      </Modal>
    </div>
  );
}

export default InicioSesion;
