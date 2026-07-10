import "../styles/IndexStyle.css";
import "../styles/MiPerfil.css";
import { useEffect, useState } from "react";
import { apiFetch } from "../utils/api.js";

function MiPerfil() {
  const [jugador, setJugador] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editando, setEditando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);
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
      alert("⚠️ El equipo fue eliminado porque se quedó sin jugadores.");
    } else if (data.message?.includes("Nuevo capitán")) {
      alert("👑 Se asignó un nuevo capitán automáticamente.");
    } else {
      alert("Has salido del equipo correctamente.");
    }


    window.location.reload();

  } catch (error) {
    console.error("Error al salir del equipo:", error);
    alert("Ocurrió un error al salir del equipo.");
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
        <h1 className="mi-perfil-titulo">👤 Mi Perfil</h1>
        <p className="mi-perfil-subtitulo">Gestiona tu información y estadísticas</p>

        <form className="perfil-seccion" onSubmit={handleGuardar}>
          {!editando && (
            <button
              type="button"
              className="boton-editar"
              onClick={handleEmpezarEdicion}
            >
              ✏️ Editar perfil
            </button>
          )}

          <h2>Información Personal</h2>
          <p>Datos básicos del jugador</p>

          {error && <p className="perfil-error">{error}</p>}

          {!editando ? (
            <>
              <div className="perfil-campo">
                <div className="input-grupo">
                  <label>Nombre Completo</label>
                  <input
                    type="text"
                    value={`${jugador.nombre} ${jugador.apellido}`}
                    readOnly
                  />
                </div>
                <div className="input-grupo">
                  <label>Fecha de Nacimiento</label>
                  <input type="text" value={jugador.fechaNacimiento || "—"} readOnly />
                </div>
              </div>

              <div className="perfil-campo">
                <div className="input-grupo">
                  <label>Equipo</label>
                  <input
                    type="text"
                    value={jugador.equipo?.nombreEquipo || "No perteneces a ningún equipo"}
                    readOnly
                    className={!jugador.equipo ? "input-vacio" : ""}
                  />
                </div>
                <div className="input-grupo">
                  <label>Posición</label>
                  <input type="text" value={jugador.posicion || "—"} readOnly />
                </div>
              </div>

              <div className="perfil-campo">
                <div className="input-grupo">
                  <label>Email</label>
                  <input type="text" value={jugador.email || "—"} readOnly />
                </div>
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
                <div className="input-grupo">
                  <label>Nombre</label>
                  <input
                    type="text"
                    name="nombre"
                    value={form.nombre}
                    onChange={handleChangeForm}
                    required
                  />
                </div>
                <div className="input-grupo">
                  <label>Apellido</label>
                  <input
                    type="text"
                    name="apellido"
                    value={form.apellido}
                    onChange={handleChangeForm}
                    required
                  />
                </div>
              </div>

              <div className="perfil-campo">
                <div className="input-grupo">
                  <label>Fecha de Nacimiento</label>
                  <input
                    type="date"
                    name="fechaNacimiento"
                    value={form.fechaNacimiento}
                    onChange={handleChangeForm}
                  />
                </div>
                <div className="input-grupo">
                  <label>Posición</label>
                  <select name="posicion" value={form.posicion} onChange={handleChangeForm}>
                    <option value="">Seleccionar...</option>
                    <option value="Arquero">Arquero</option>
                    <option value="Defensor">Defensor</option>
                    <option value="Mediocampista">Mediocampista</option>
                    <option value="Delantero">Delantero</option>
                  </select>
                </div>
              </div>

              <div className="perfil-campo">
                <div className="input-grupo">
                  <label>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChangeForm}
                    required
                  />
                </div>
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
                <button
                  type="button"
                  className="boton-cancelar"
                  onClick={handleCancelarEdicion}
                  disabled={guardando}
                >
                  Cancelar
                </button>
                <button type="submit" className="boton-guardar" disabled={guardando}>
                  {guardando ? "Guardando..." : "Guardar cambios"}
                </button>
              </div>
            </>
          )}

          {jugador.equipo && !editando && (
            <div className="boton-salir-container">
              <button
                type="button"
                className="boton-salir-equipo"
                onClick={handleSalirEquipo}
              >
                🚪 Salir del equipo
              </button>
            </div>
          )}
        </form>
      </main>
    </div>
  );
}

export default MiPerfil;
