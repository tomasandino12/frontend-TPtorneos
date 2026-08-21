import "../styles/IndexStyle.css";
import "../styles/MiPerfil.css";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FiUser, FiEdit2 } from "react-icons/fi";
import { apiFetch } from "../utils/api.js";
import { Button, TextField, Alert, PageShell, PageHero } from "../components/ui";

const FORM_VACIO = {
  nombre: "",
  apellido: "",
  fechaNacimiento: "",
  posicion: "",
  email: "",
  descripcion: "",
};

// nombre/apellido: mismo criterio que Registro.jsx (mínimo 2 caracteres).
// email: mismo regex/mensaje que Registro.jsx.
// fechaNacimiento/posicion/descripcion: el HTML original no tenía `required`
// en ninguno de los tres, así que no se agrega ninguna regla nueva ahí — a
// diferencia de nro_matricula (Arbitros) o capacidad/precioPorHora (cancha),
// ninguno de estos es un campo numérico en el backend, así que no hay riesgo
// real de mismatch de tipos y no hace falta z.coerce.string().
const miPerfilSchema = z.object({
  nombre: z.string().refine((v) => v.trim().length >= 2, "El nombre debe tener al menos 2 caracteres."),
  apellido: z.string().refine((v) => v.trim().length >= 2, "El apellido debe tener al menos 2 caracteres."),
  fechaNacimiento: z.string(),
  posicion: z.string(),
  email: z.string().regex(/\S+@\S+\.\S+/, "El email no es válido"),
  descripcion: z.string(),
});

function MiPerfil() {
  const [jugador, setJugador] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editando, setEditando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(miPerfilSchema),
    defaultValues: FORM_VACIO,
  });

  useEffect(() => {

    const jugadorGuardado = JSON.parse(localStorage.getItem("jugador"));
    const jugadorId = jugadorGuardado?.id;

    const fetchJugador = async () => {
      try {
        const response = await apiFetch(`/jugadores/${jugadorId}`);
        if (!response.ok) throw new Error("Error al obtener los datos del jugador");

        const data = await response.json();

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

  const handleEmpezarEdicion = () => {
    reset({
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

  const onGuardar = async (values) => {
    setGuardando(true);
    setError(null);

    try {
      const response = await apiFetch(`/jugadores/${jugador.id}`, {
        method: "PUT",
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          throw new Error(data.message || "Ese email ya está en uso.");
        }
        throw new Error(data.message || "Error al actualizar el perfil.");
      }

      const actualizado = { ...jugador, ...values };
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
    <PageShell>
      <PageHero icon={<FiUser />} title="Mi Perfil" subtitle="Gestiona tu información y estadísticas">
      <form className="perfil-seccion" onSubmit={handleSubmit(onGuardar)} noValidate>
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
                  error={errors.nombre?.message}
                  {...register("nombre")}
                />
                <TextField
                  label="Apellido"
                  error={errors.apellido?.message}
                  {...register("apellido")}
                />
              </div>

              <div className="perfil-campo">
                <TextField
                  label="Fecha de Nacimiento"
                  type="date"
                  error={errors.fechaNacimiento?.message}
                  {...register("fechaNacimiento")}
                />
                <div className="ui-field">
                  <label className="ui-field-label" htmlFor="posicion">
                    Posición
                  </label>
                  <div className="ui-field-control">
                    <select
                      id="posicion"
                      className="ui-field-input"
                      {...register("posicion")}
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
                  error={errors.email?.message}
                  {...register("email")}
                />
              </div>

              <div className="perfil-campo">
                <div className="input-grupo">
                  <label>Descripción</label>
                  <textarea
                    placeholder="Ej: Volante ofensivo por la derecha, prefiero el juego creativo..."
                    {...register("descripcion")}
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
        </form>
      </PageHero>
    </PageShell>
  );
}

export default MiPerfil;
