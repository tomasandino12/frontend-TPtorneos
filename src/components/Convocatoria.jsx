import { useState } from "react";
import { FiEdit2 } from "react-icons/fi";
import { apiFetch } from "../utils/api.js";
import { Button, Alert, Modal } from "./ui";
import Cancha from "./Cancha.jsx";

const ORDEN_POSICIONES = ["Arquero", "Defensor", "Mediocampista", "Delantero"];
const LABEL_PLURAL = {
  Arquero: "arqueros",
  Defensor: "defensores",
  Mediocampista: "mediocampistas",
  Delantero: "delanteros",
};

// Cupos por posición de cada formación — coordinado con el backend (ver
// contrato en la tarea). No hay sub-distinción entre, por ejemplo, volante
// defensivo/ofensivo: el plantel solo guarda una categoría "Mediocampista".
const FORMACIONES = {
  "4-3-3": { Arquero: 1, Defensor: 4, Mediocampista: 3, Delantero: 3 },
  "4-4-2": { Arquero: 1, Defensor: 4, Mediocampista: 4, Delantero: 2 },
  "4-2-3-1": { Arquero: 1, Defensor: 4, Mediocampista: 5, Delantero: 1 },
  "5-3-2": { Arquero: 1, Defensor: 5, Mediocampista: 3, Delantero: 2 },
};

// Posición vertical (0-100) de cada fila en la cancha — arquero cerca del
// arco propio (abajo), delanteros cerca del arco rival (arriba).
const FILA_Y = { Arquero: 90, Defensor: 68, Mediocampista: 42, Delantero: 14 };

const MIN_JUGADORES_CONVOCATORIA = 11;
const NOTAS_MAX_LENGTH = 500;

const PASOS = ["Elegir formación", "Armar el 11 titular", "Banco de suplentes", "Notas y confirmar"];

function filaHorizontal(categoria, indices, y) {
  return indices.map((_, i) => ({
    id: `${categoria}-${indices[i]}`,
    categoria,
    x: (100 / (indices.length + 1)) * (i + 1),
    y,
  }));
}

function generarPuntos(formacionKey) {
  const conteos = FORMACIONES[formacionKey];
  const puntos = [];
  ORDEN_POSICIONES.forEach((categoria) => {
    const cantidad = conteos[categoria];
    // El 4-2-3-1 es el único esquema con 5 mediocampistas, y no van todos en
    // una sola línea: 2 volantes de contención más retrasados y 3 enganches
    // más adelantados, detrás del delantero central — sin este caso especial
    // quedaban los 5 amontonados en una fila que no representa la formación.
    if (categoria === "Mediocampista" && cantidad === 5) {
      puntos.push(...filaHorizontal(categoria, [0, 1], FILA_Y[categoria] + 12));
      puntos.push(...filaHorizontal(categoria, [2, 3, 4], FILA_Y[categoria] - 12));
      return;
    }
    puntos.push(...filaHorizontal(categoria, Array.from({ length: cantidad }, (_, i) => i), FILA_Y[categoria]));
  });
  return puntos;
}

// GET/PUT /formaciones no toman equipoId: el backend siempre resuelve "mi
// equipo" a partir del jugador autenticado (token) — GET lo puede pedir
// cualquier miembro, PUT solo el capitán (403 si no lo es). El GET inicial
// vive en EquipoInfo.jsx (useEffect de "formación de convocatoria"), no acá,
// para sobrevivir a que Tabs desmonte esta pestaña al cambiar a otra.
function capitalizar(categoria) {
  return categoria.charAt(0).toUpperCase() + categoria.slice(1);
}

/**
 * Pestaña "Convocatoria" de EquipoInfo — asistente de 4 pasos para que el
 * capitán arme la formación del próximo partido, con vista de solo lectura
 * (para cualquier miembro) una vez que hay una formación guardada.
 */
export default function Convocatoria({
  equipo,
  esCapitanDeEsteEquipo,
  formacionGuardada,
  onGuardarFormacion,
  feedback,
  onFeedback,
}) {
  const jugadores = equipo.jugadores;
  const jugadoresPorId = Object.fromEntries(jugadores.map((j) => [j.id, j]));
  // Un jugador suspendido no puede ser convocado — no cuenta para los cupos
  // de una formación (si contara, el capitán podría elegir un esquema que
  // después no puede completar porque el suspendido no es seleccionable).
  const conteoPorCategoria = ORDEN_POSICIONES.reduce((acc, categoria) => {
    acc[categoria] = jugadores.filter(
      (j) => (j.posicion ?? j.Posicion) === categoria && !j.suspendido
    ).length;
    return acc;
  }, {});

  // La formación guardada y su feedback viven en el estado de EquipoInfo
  // (recibidos acá por props) para sobrevivir a que Tabs desmonte esta
  // pestaña al cambiar a otra — ver comentario en EquipoInfo.jsx. El resto
  // del estado del asistente (paso actual, asignaciones en progreso, notas
  // sin confirmar) sí puede vivir y resetearse acá: perder un asistente a
  // medio llenar al cambiar de pestaña es aceptable, perder la formación ya
  // guardada no.
  const [editando, setEditando] = useState(false);

  const [paso, setPaso] = useState(1);
  const [formacionElegida, setFormacionElegida] = useState(null);
  const [asignaciones, setAsignaciones] = useState({});
  const [notas, setNotas] = useState("");
  const [puntoSeleccionado, setPuntoSeleccionado] = useState(null);
  const [intentoSuspendido, setIntentoSuspendido] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [guardarError, setGuardarError] = useState(null);

  const iniciarAsistente = (prellenar) => {
    if (prellenar) {
      setFormacionElegida(prellenar.esquema);
      const mapa = {};
      prellenar.titulares.forEach((t) => {
        mapa[`${capitalizar(t.categoria)}-${t.orden}`] = t.jugadorId;
      });
      setAsignaciones(mapa);
      setNotas(prellenar.notas || "");
    } else {
      setFormacionElegida(null);
      setAsignaciones({});
      setNotas("");
    }
    setPaso(1);
    setGuardarError(null);
    setEditando(true);
  };

  const handleElegirFormacion = (key) => {
    setFormacionElegida(key);
    setAsignaciones({});
  };

  const puntos = formacionElegida ? generarPuntos(formacionElegida) : [];

  const handleClickPunto = (punto) => {
    if (asignaciones[punto.id]) {
      setAsignaciones((prev) => {
        const next = { ...prev };
        delete next[punto.id];
        return next;
      });
      return;
    }
    setIntentoSuspendido(null);
    setPuntoSeleccionado(punto);
  };

  const handleAsignarJugador = (idJugador) => {
    setAsignaciones((prev) => ({ ...prev, [puntoSeleccionado.id]: idJugador }));
    setPuntoSeleccionado(null);
  };

  // Un suspendido se sigue mostrando en la lista (no se saca en silencio,
  // para que el capitán entienda por qué no está disponible), pero tocarlo
  // muestra el motivo en vez de convocarlo.
  const handleClickJugadorLista = (jugador) => {
    if (jugador.suspendido) {
      setIntentoSuspendido(`${jugador.nombre} ${jugador.apellido} está suspendido y no puede ser convocado.`);
      return;
    }
    handleAsignarJugador(jugador.id);
  };

  const idsAsignados = new Set(Object.values(asignaciones));
  const banco = jugadores.filter((j) => !idsAsignados.has(j.id));
  const todosLosPuntosAsignados = puntos.length > 0 && puntos.every((p) => asignaciones[p.id]);

  const handleConfirmar = async () => {
    setGuardando(true);
    setGuardarError(null);
    try {
      const response = await apiFetch("/formaciones", {
        method: "PUT",
        body: JSON.stringify({
          esquema: formacionElegida,
          titulares: Object.values(asignaciones),
          notas: notas.trim() || undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Error al guardar la convocatoria");

      // El PUT solo devuelve { equipoId, esquema, notas } — el resto de la
      // vista (titulares con nombre, suplentes) se arma acá mismo con lo que
      // ya tenemos en memoria, en vez de pedirlo de nuevo con un GET.
      const titulares = puntos.map((p) => {
        const jugador = jugadoresPorId[asignaciones[p.id]];
        return {
          jugadorId: jugador.id,
          nombre: jugador.nombre,
          apellido: jugador.apellido,
          categoria: p.categoria.toLowerCase(),
          orden: Number(p.id.split("-")[1]),
        };
      });
      const suplentes = banco.map((j) => ({
        jugadorId: j.id,
        nombre: j.nombre,
        apellido: j.apellido,
        posicion: j.posicion,
      }));

      onGuardarFormacion({
        equipoId: data.data.equipoId,
        esquema: data.data.esquema,
        notas: data.data.notas,
        fecha: new Date().toISOString(),
        titulares,
        suplentes,
      });
      setEditando(false);
      onFeedback({ variant: "success", text: "Convocatoria guardada correctamente." });
    } catch (error) {
      setGuardarError(error.message);
    } finally {
      setGuardando(false);
    }
  };

  const mostrarAsistente = editando || (!formacionGuardada && esCapitanDeEsteEquipo);

  if (!mostrarAsistente) {
    if (!formacionGuardada) {
      return (
        <div className="convocatoria-gate">
          <Alert variant="info">El capitán todavía no armó la convocatoria para el próximo partido.</Alert>
        </div>
      );
    }

    const puntosGuardados = generarPuntos(formacionGuardada.esquema);
    const asignacionesGuardadas = Object.fromEntries(
      formacionGuardada.titulares.map((t) => [`${capitalizar(t.categoria)}-${t.orden}`, t.jugadorId])
    );
    // Los titulares/suplentes guardados ya traen nombre y apellido — se usan
    // como respaldo para jugadores que ya no están en el plantel actual
    // (expulsados o que salieron después de guardar esta formación), para
    // que la vista no los muestre como un punto "vacío" de forma engañosa.
    const jugadoresPorIdVista = { ...jugadoresPorId };
    formacionGuardada.titulares.forEach((t) => {
      if (!jugadoresPorIdVista[t.jugadorId]) {
        jugadoresPorIdVista[t.jugadorId] = { id: t.jugadorId, nombre: t.nombre, apellido: t.apellido };
      }
    });
    const bancoGuardado = formacionGuardada.suplentes;

    return (
      <div className="convocatoria-vista">
        {feedback && <Alert variant={feedback.variant}>{feedback.text}</Alert>}
        <div className="convocatoria-vista-header">
          <h3 className="subtitulo-posicion">Formación {formacionGuardada.esquema}</h3>
          {esCapitanDeEsteEquipo && (
            <Button variant="secondary" icon={<FiEdit2 />} onClick={() => iniciarAsistente(formacionGuardada)}>
              Editar formación
            </Button>
          )}
        </div>
        <Cancha
          puntos={puntosGuardados}
          asignaciones={asignacionesGuardadas}
          jugadoresPorId={jugadoresPorIdVista}
          colorEquipo={equipo.colorPrimario}
          editable={false}
        />
        <div className="convocatoria-banco">
          <h4 className="subtitulo-posicion">Banco de suplentes · {bancoGuardado.length}</h4>
          {bancoGuardado.length > 0 ? (
            <ul className="convocatoria-banco-lista">
              {bancoGuardado.map((j) => (
                <li key={j.jugadorId}>
                  {j.nombre} {j.apellido}
                </li>
              ))}
            </ul>
          ) : (
            <p className="convocatoria-banco-vacio">No quedaron jugadores en el banco.</p>
          )}
        </div>
        {formacionGuardada.notas && (
          <div className="convocatoria-notas-guardadas">
            <h4 className="subtitulo-posicion">Notas</h4>
            <p>{formacionGuardada.notas}</p>
          </div>
        )}
      </div>
    );
  }

  if (!esCapitanDeEsteEquipo) {
    // No debería alcanzarse en la práctica (solo el capitán dispara
    // editando=true), pero nunca dejar a un jugador raso en el asistente.
    return (
      <div className="convocatoria-gate">
        <Alert variant="info">El capitán todavía no armó la convocatoria para el próximo partido.</Alert>
      </div>
    );
  }

  if (jugadores.length < MIN_JUGADORES_CONVOCATORIA) {
    return (
      <div className="convocatoria-gate">
        <Alert variant="info">
          Hace falta que el plantel llegue a {MIN_JUGADORES_CONVOCATORIA} jugadores para armar la
          convocatoria. Hoy tenés {jugadores.length}.
        </Alert>
      </div>
    );
  }

  return (
    <div className="convocatoria-wizard">
      <ol className="convocatoria-pasos">
        {PASOS.map((titulo, i) => (
          <li
            key={titulo}
            className={`convocatoria-paso-item${paso === i + 1 ? " activo" : ""}${paso > i + 1 ? " completo" : ""}`}
          >
            <span className="convocatoria-paso-numero">{i + 1}</span> {titulo}
          </li>
        ))}
      </ol>

      {paso === 1 && (
        <div className="convocatoria-formaciones">
          {Object.keys(FORMACIONES).map((key) => {
            const conteos = FORMACIONES[key];
            const faltante = ORDEN_POSICIONES.find((cat) => conteoPorCategoria[cat] < conteos[cat]);
            const habilitada = !faltante;
            return (
              <button
                type="button"
                key={key}
                className={`convocatoria-formacion-card${formacionElegida === key ? " seleccionada" : ""}`}
                disabled={!habilitada}
                onClick={() => handleElegirFormacion(key)}
              >
                <span className="convocatoria-formacion-nombre">{key}</span>
                {!habilitada && (
                  <span className="convocatoria-formacion-motivo">
                    Necesitás al menos {conteos[faltante]} {LABEL_PLURAL[faltante]}, tenés{" "}
                    {conteoPorCategoria[faltante]}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {paso === 2 && (
        <>
          <p className="convocatoria-paso-ayuda">
            Tocá un punto vacío para asignar un jugador. Tocá uno ya asignado para quitarlo.
          </p>
          <Cancha
            puntos={puntos}
            asignaciones={asignaciones}
            jugadoresPorId={jugadoresPorId}
            colorEquipo={equipo.colorPrimario}
            editable
            onClickPunto={handleClickPunto}
          />
        </>
      )}

      {paso === 3 && (
        <div className="convocatoria-banco">
          <h4 className="subtitulo-posicion">Banco de suplentes · {banco.length}</h4>
          {banco.length > 0 ? (
            <ul className="convocatoria-banco-lista">
              {banco.map((j) => (
                <li key={j.id}>
                  {j.nombre} {j.apellido}
                </li>
              ))}
            </ul>
          ) : (
            <p className="convocatoria-banco-vacio">Todo el plantel quedó en el 11 titular.</p>
          )}
        </div>
      )}

      {paso === 4 && (
        <div className="convocatoria-notas">
          <label className="ui-field-label" htmlFor="convocatoria-notas-input">
            Notas de estrategia (opcional)
          </label>
          <textarea
            id="convocatoria-notas-input"
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            placeholder="Ej: marca en zona, presión alta, pelota parada a favor de..."
            maxLength={NOTAS_MAX_LENGTH}
          />
          {guardarError && <Alert variant="error">{guardarError}</Alert>}
        </div>
      )}

      <div className="convocatoria-navegacion">
        {formacionGuardada && (
          <Button variant="ghost" onClick={() => setEditando(false)}>
            Cancelar
          </Button>
        )}
        {paso > 1 && (
          <Button variant="secondary" onClick={() => setPaso(paso - 1)}>
            Atrás
          </Button>
        )}
        {paso < 4 && (
          <Button
            onClick={() => setPaso(paso + 1)}
            disabled={(paso === 1 && !formacionElegida) || (paso === 2 && !todosLosPuntosAsignados)}
          >
            Siguiente
          </Button>
        )}
        {paso === 4 && (
          <Button onClick={handleConfirmar} disabled={guardando}>
            {guardando ? "Guardando..." : "Confirmar"}
          </Button>
        )}
      </div>

      <Modal
        open={!!puntoSeleccionado}
        onClose={() => {
          setPuntoSeleccionado(null);
          setIntentoSuspendido(null);
        }}
        title={puntoSeleccionado ? `Elegí un ${puntoSeleccionado.categoria.toLowerCase()}` : ""}
      >
        <ul className="convocatoria-seleccion-lista">
          {puntoSeleccionado &&
            jugadores
              .filter((j) => (j.posicion ?? j.Posicion) === puntoSeleccionado.categoria && !idsAsignados.has(j.id))
              .map((j) => (
                <li key={j.id}>
                  <button
                    type="button"
                    className={`convocatoria-seleccion-item${j.suspendido ? " convocatoria-seleccion-item-suspendido" : ""}`}
                    onClick={() => handleClickJugadorLista(j)}
                  >
                    {j.nombre} {j.apellido}
                    {j.suspendido && <span className="badge-suspendido">Suspendido</span>}
                  </button>
                </li>
              ))}
        </ul>
        {puntoSeleccionado &&
          jugadores.filter((j) => (j.posicion ?? j.Posicion) === puntoSeleccionado.categoria && !idsAsignados.has(j.id))
            .length === 0 && <Alert variant="info">No quedan jugadores disponibles en esta categoría.</Alert>}
        {intentoSuspendido && <Alert variant="warning">{intentoSuspendido}</Alert>}
      </Modal>
    </div>
  );
}
