import "../styles/IndexStyle.css";
import "../styles/Equipos.css";
import { useState, useEffect } from "react";
import { FiUsers, FiPlus } from "react-icons/fi";
import { apiFetch } from "../utils/api.js";
import { Button, TextField, Card, Alert } from "../components/ui";
import EquipoInfo from "../components/EquipoInfo.jsx";

function Equipos() {
  const [jugador, setJugador] = useState(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [nombreEquipo, setNombreEquipo] = useState("");
  const [colorPrimario, setColorPrimario] = useState("#ffffff");
  const [colorSecundario, setColorSecundario] = useState("#000000");
  const [descripcion, setDescripcion] = useState("");
  const [crearFeedback, setCrearFeedback] = useState(null);

  // === Cargar jugador logueado ===
  useEffect(() => {
    try {
      const jugadorGuardado = JSON.parse(localStorage.getItem("jugador"));
      if (jugadorGuardado) {
        setJugador(jugadorGuardado);
      }
    } catch (error) {
      console.error("Error al cargar jugador desde localStorage:", error);
      setJugador(null);
    }
  }, []);

  const handleSubmitEquipo = async (e) => {
    e.preventDefault();

    if (!nombreEquipo || !colorPrimario || !colorSecundario) {
      setCrearFeedback({ variant: "error", text: "Completá todos los campos." });
      return;
    }

    if (!jugador || !jugador.id) {
      setCrearFeedback({
        variant: "error",
        text: "No hay jugador logueado. Iniciá sesión nuevamente.",
      });
      return;
    }

    try {
      const response = await apiFetch("/equipos", {
        method: "POST",
        body: JSON.stringify({
          nombreEquipo,
          colorPrimario,
          colorSecundario,
          descripcion,
          idJugador: jugador.id,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Error al crear equipo");

      const jugadorActualizado = {
        ...jugador,
        equipo: data.data,
        esCapitan: true,
      };

      localStorage.setItem("jugador", JSON.stringify(jugadorActualizado));
      setJugador(jugadorActualizado);
      setNombreEquipo("");
      setColorPrimario("#ffffff");
      setColorSecundario("#000000");
      setDescripcion("");
      setMostrarFormulario(false);
      setCrearFeedback({ variant: "success", text: "Equipo creado con éxito." });
    } catch (error) {
      console.error("Error:", error);
      setCrearFeedback({ variant: "error", text: "Error al crear equipo: " + error.message });
    }
  };

  // === Seguridad adicional: render condicional si no hay jugador cargado ===
  if (!jugador) {
    return (
      <main className="subpagina-container">
        <Alert variant="info">No se encontró información del jugador. Iniciá sesión nuevamente.</Alert>
      </main>
    );
  }

  // Ya tiene equipo: mostrar directamente toda la info de SU equipo, sin el
  // paso intermedio de una card + botón "Ver mi equipo". El título principal
  // de la página pasa a ser el nombre del equipo (lo resuelve EquipoInfo).
  if (jugador.equipo?.id) {
    return (
      <main className="subpagina-container">
        <EquipoInfo equipoId={jugador.equipo.id} showVolver={false} />
      </main>
    );
  }

  // Sin equipo: solo se puede crear uno nuevo. Hoy no existe en el backend
  // ningún flujo de autoservicio para "unirse a un equipo existente" — la
  // única forma de sumarse a un equipo es que un capitán te agregue desde su
  // propio buscador de reclutamiento (dentro de EquipoInfo).
  return (
    <main className="subpagina-container">
      <section className="page-header">
        <h1>
          <FiUsers /> Gestión de Equipos
        </h1>
        <p>Creá tu equipo para empezar a jugar</p>
      </section>

      <Card as="section" className="crear-equipo-card">
        <h2>Crear Nuevo Equipo</h2>
        <p>Formá tu propio equipo. Una vez creado, vas a poder sumar jugadores desde acá.</p>
        <Button icon={<FiPlus />} onClick={() => setMostrarFormulario(true)}>
          Crear Equipo
        </Button>

        {crearFeedback && !mostrarFormulario && (
          <div className="feedback-box">
            <Alert variant={crearFeedback.variant}>{crearFeedback.text}</Alert>
          </div>
        )}

        {mostrarFormulario && (
          <div className="modal-crear-equipo">
            <form className="formulario-crear-equipo" onSubmit={handleSubmitEquipo}>
              <h3>Nuevo Equipo</h3>

              <TextField
                label="Nombre del Equipo"
                value={nombreEquipo}
                onChange={(e) => setNombreEquipo(e.target.value)}
                required
              />

              <div className="color-pickers-grupo">
                <div className="color-picker-item">
                  <label>Color Primario</label>
                  <input
                    type="color"
                    value={colorPrimario}
                    onChange={(e) => setColorPrimario(e.target.value)}
                  />
                </div>
                <div className="color-picker-item">
                  <label>Color Secundario</label>
                  <input
                    type="color"
                    value={colorSecundario}
                    onChange={(e) => setColorSecundario(e.target.value)}
                  />
                </div>
              </div>

              <label>Descripción</label>
              <textarea
                placeholder="Ej: Equipo de amigos, buena onda, nos gusta el juego asociado..."
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
              />

              {crearFeedback && <Alert variant={crearFeedback.variant}>{crearFeedback.text}</Alert>}

              <div className="formulario-botones">
                <Button type="submit">Crear</Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setMostrarFormulario(false);
                    setCrearFeedback(null);
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </div>
        )}
      </Card>
    </main>
  );
}

export default Equipos;
