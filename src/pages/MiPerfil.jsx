import "../styles/IndexStyle.css";
import "../styles/MiPerfil.css";
import { useEffect, useState } from "react";
import { FiUser, FiEdit2, FiLogOut } from "react-icons/fi";
import { apiFetch } from "../utils/api.js";
import { Button, TextField, Alert } from "../components/ui";

function MiPerfil() {
  const [jugador, setJugador] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editando, setEditando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);
  const [salirFeedback, setSalirFeedback] = useState(null);
  const [form, setForm] = useState({
    nombre: "",
    apellido: "",
    fechaNacimiento: "",
    posicion: "",
    email: "",
    descripcion: "",
  });

  useEffect(() => {

    const jugadorGuardado = JSON.parse(localStorage.getItem("jugador"));
    const jugadorId = jugadorGuardado?.id;

    const fetchJugador = async () => {
      try {
        console.log("Obteniendo datos de jugador con ID:", jugadorId);
        const response = await apiFetch(`/jugadores/${jugadorId}`);
        if (!response.ok) throw new Error("Error al obtener los datos del jugador");

        const data = await response.json();
        console.log("Datos del jugador recibidos:", data);


        setJugador(data.data);
      } catch (error) {
        console.error("Error al obtener el jugador:", error);
      } finally {
        setLoading(false);
      }
    };

    if (jugadorId) fetchJugador();
    else setLoading(false);
  }, []);

  const handleSalirEquipo = async () => {
    if (!jugador?.equipo) return;

    const confirmar = window.confirm("¿Estás seguro de que deseas salir de tu equipo?");
    if (!confirmar) return;

    try {
      const response = await apiFetch(`/jugadores/${jugador.id}`, {
        method: "PUT",
        body: JSON.stringify({ ...jugador, equipo: null }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.message || "Error al salir del equipo");

      const actualizado = { ...jugador, equipo: null };
      setJugador(actualizado);
      localStorage.setItem("jugador", JSON.stringify(actualizado));

      if (data.message?.includes("Equipo eliminado")) {
        setSalirFeedback({
          variant: "info",
          text: "El equipo fue eliminado porque se quedó sin jugadores.",
        });
      } else if (data.message?.includes("Nuevo capitán")) {
        setSalirFeedback({
          variant: "info",
          text: "Se asignó un nuevo capitán automáticamente.",
        });
      } else {
        setSalirFeedback({ variant: "success", text: "Has salido del equipo correctamente." });
      }
    } catch (error) {
      console.error("Error al salir del equipo:", error);
      setSalirFeedback({ variant: "error", text: "Ocurrió un error al salir del equipo." });
    }
  };

  const handleEmpezarEdicion = () => {
    setForm({
      nombre: jugador.nombre || "",
      apellido: jugador.apellido || "",
      fechaNacimiento: jugador.fechaNacimiento || "",
      posicion: jugador.posicion || "",
      email: jugador.email || "",
      descripcion: jugador.descripcion || "",
    });
    setError(null);
    setEditando(true);
  };

  const handleCancelarEdicion = () => {
    setEditando(false);
    setError(null);
  };

  const handleChangeForm = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleGuardar = async (e) => {
    e.preventDefault();
    setGuardando(true);
    setError(null);

    try {
      const response = await apiFetch(`/jugadores/${jugador.id}`, {
        method: "PUT",
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          throw new Error(data.message || "Ese email ya está en uso.");
        }
        throw new Error(data.message || "Error al actualizar el perfil.");
      }

      const actualizado = { ...jugador, ...form };
      setJugador(actualizado);
      localStorage.setItem("jugador", JSON.stringify(actualizado));
      setEditando(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  };

  if (loading) {
    return <p style={{ textAlign: "center", marginTop: "50px" }}>Cargando perfil...</p>;
  }

  if (!jugador) {
    return <p style={{ textAlign: "center", marginTop: "50px" }}>No se encontró información del jugador.</p>;
  }

  return (
    <div className="MiPerfil">
      <main className="mi-perfil-container">
        <h1 className="mi-perfil-titulo">
          <FiUser /> Mi Perfil
        </h1>
        <p className="mi-perfil-subtitulo">Gestiona tu información y estadísticas</p>

        <form className="perfil-seccion" onSubmit={handleGuardar}>
          <div className="perfil-seccion-header">
            <div>
              <h2>Información Personal</h2>
              <p>Datos básicos del jugador</p>
            </div>
            {!editando && (
              <Button type="button" variant="secondary" icon={<FiEdit2 />} onClick={handleEmpezarEdicion}>
                Editar perfil
              </Button>
            )}
          </div>

          {error && <Alert variant="error">{error}</Alert>}

          {!editando ? (
            <>
              <div className="perfil-campo">
                <TextField
                  label="Nombre Completo"
                  value={`${jugador.nombre} ${jugador.apellido}`}
                  readOnly
                />
                <TextField
                  label="Fecha de Nacimiento"
                  value={jugador.fechaNacimiento ? new Date(jugador.fechaNacimiento).toLocaleDateString("es-AR") : "—"}
                  readOnly
                />
              </div>

              <div className="perfil-campo">
                <TextField
                  label="Equipo"
                  value={jugador.equipo?.nombreEquipo || "No perteneces a ningún equipo"}
                  readOnly
                  className={!jugador.equipo ? "input-vacio" : ""}
                />
                <TextField label="Posición" value={jugador.posicion || "—"} readOnly />
              </div>

              <div className="perfil-campo">
                <TextField label="Email" value={jugador.email || "—"} readOnly />
              </div>

              <div className="perfil-campo">
                <div className="input-grupo">
                  <label>Descripción</label>
                  <textarea value={jugador.descripcion || "Sin descripción."} readOnly />
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="perfil-campo">
                <TextField
                  label="Nombre"
                  name="nombre"
                  value={form.nombre}
                  onChange={handleChangeForm}
                  required
                />
                <TextField
                  label="Apellido"
                  name="apellido"
                  value={form.apellido}
                  onChange={handleChangeForm}
                  required
                />
              </div>

              <div className="perfil-campo">
                <TextField
                  label="Fecha de Nacimiento"
                  type="date"
                  name="fechaNacimiento"
                  value={form.fechaNacimiento}
                  onChange={handleChangeForm}
                />
                <div className="ui-field">
                  <label className="ui-field-label" htmlFor="posicion">
                    Posición
                  </label>
                  <div className="ui-field-control">
                    <select
                      id="posicion"
                      name="posicion"
                      className="ui-field-input"
                      value={form.posicion}
                      onChange={handleChangeForm}
                    >
                      <option value="">Seleccionar...</option>
                      <option value="Arquero">Arquero</option>
                      <option value="Defensor">Defensor</option>
                      <option value="Mediocampista">Mediocampista</option>
                      <option value="Delantero">Delantero</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="perfil-campo">
                <TextField
                  label="Email"
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChangeForm}
                  required
                />
              </div>

              <div className="perfil-campo">
                <div className="input-grupo">
                  <label>Descripción</label>
                  <textarea
                    name="descripcion"
                    placeholder="Ej: Volante ofensivo por la derecha, prefiero el juego creativo..."
                    value={form.descripcion}
                    onChange={handleChangeForm}
                  />
                </div>
              </div>

              <div className="botones-edicion">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleCancelarEdicion}
                  disabled={guardando}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={guardando}>
                  {guardando ? "Guardando..." : "Guardar cambios"}
                </Button>
              </div>
            </>
          )}

          {salirFeedback && <Alert variant={salirFeedback.variant}>{salirFeedback.text}</Alert>}

          {jugador.equipo && !editando && (
            <div className="boton-salir-container">
              <Button variant="danger" icon={<FiLogOut />} onClick={handleSalirEquipo}>
                Salir del equipo
              </Button>
            </div>
          )}
        </form>
      </main>
    </div>
  );
}

export default MiPerfil;
