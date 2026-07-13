import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiArrowLeft, FiEdit2, FiUpload, FiBarChart2, FiSearch, FiSend, FiLogOut, FiX, FiRepeat, FiCheckCircle, FiUserX, FiPlus } from "react-icons/fi";
import { apiFetch, apiFetchFormData, ASSETS_URL } from "../utils/api.js";
import { Button, TextField, Alert, PageHero, Tabs, Modal } from "./ui";
import Convocatoria from "./Convocatoria.jsx";

/**
 * Contenido de "detalle de un equipo" (header con escudo, descripción,
 * plantel + reclutamiento). Reutilizado por:
 * - EquipoDetalle.jsx (ruta /equipo/:id, para ver CUALQUIER equipo —
 *   ej. desde un click en Tabla de Posiciones — de solo lectura si no sos
 *   el capitán de ese equipo).
 * - Equipos.jsx, cuando el jugador logueado ya tiene equipo: se renderiza
 *   directo para su propio equipo, sin el paso intermedio de "Ver mi equipo".
 *
 * Los controles de edición (escudo, descripción, agregar jugadores) solo
 * se renderizan si el jugador logueado es capitán de ESTE equipo — si no,
 * no aparecen (no alcanza con deshabilitarlos). Ese gating es de UI: no
 * reemplaza ninguna validación que deba existir del lado del servidor.
 */
const POSICION_LABELS = {
  Delantero: "Delanteros",
  Mediocampista: "Mediocampistas",
  Defensor: "Defensores",
  Arquero: "Arqueros",
};

// Orden fijo en el que se muestran los grupos del plantel — no depende de
// en qué orden vengan los jugadores del backend.
const ORDEN_POSICIONES = ["Arquero", "Defensor", "Mediocampista", "Delantero"];

const JUGADORES_SIN_EQUIPO_PAGE_SIZE = 10;
const MAX_JUGADORES_PLANTEL = 26;
const DESCRIPCION_MAX_LENGTH = 300;

export default function EquipoInfo({ equipoId, showVolver = true, onEquipoLeft }) {
  const navigate = useNavigate();
  const [equipo, setEquipo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editandoDescripcion, setEditandoDescripcion] = useState(false);
  const [descripcionForm, setDescripcionForm] = useState("");
  const [guardandoDescripcion, setGuardandoDescripcion] = useState(false);
  const [descripcionFeedback, setDescripcionFeedback] = useState(null);
  const [subiendoEscudo, setSubiendoEscudo] = useState(false);
  const [escudoFeedback, setEscudoFeedback] = useState(null);

  // Reclutamiento (solo capitán)
  const [jugadoresSinEquipo, setJugadoresSinEquipo] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [filtrados, setFiltrados] = useState([]);
  const [agregarFeedback, setAgregarFeedback] = useState(null);
  const [verTodosSinEquipo, setVerTodosSinEquipo] = useState(false);
  const [invitadosIds, setInvitadosIds] = useState([]);

  // Notificaciones de invitaciones ya resueltas por el jugador (solo capitán)
  const [notificaciones, setNotificaciones] = useState([]);

  // Notificaciones personales (suspensión/habilitación) — cualquier miembro del plantel
  const [notificacionesJugador, setNotificacionesJugador] = useState([]);

  // Salir del equipo (cualquier miembro, no solo el capitán)
  const [saliendoEquipo, setSaliendoEquipo] = useState(false);
  const [salirFeedback, setSalirFeedback] = useState(null);

  // Transferencia de capitanía — el mismo modal sirve para dos flujos:
  // "salirDespuesDeTransferir=true" (paso previo obligatorio antes de salir, si hay más jugadores)
  // o "false" (el nuevo botón "Asignar capitanía", que transfiere sin salir del equipo).
  const [mostrarTransferirCapitania, setMostrarTransferirCapitania] = useState(false);
  const [salirDespuesDeTransferir, setSalirDespuesDeTransferir] = useState(false);
  const [nuevoCapitanId, setNuevoCapitanId] = useState(null);
  const [transfiriendo, setTransfiriendo] = useState(false);
  const [transferFeedback, setTransferFeedback] = useState(null);
  const [capitaniaFeedback, setCapitaniaFeedback] = useState(null);

  // Agregar jugador — ahora vive en un modal; la búsqueda/invitación es la
  // misma lógica de siempre (ver los useEffect/handlers más abajo), solo
  // cambia dónde se muestra.
  const [mostrarAgregarJugador, setMostrarAgregarJugador] = useState(false);

  // Echar jugador del plantel
  const [jugadorAExpulsar, setJugadorAExpulsar] = useState(null);
  const [motivoExpulsion, setMotivoExpulsion] = useState("");
  const [expulsando, setExpulsando] = useState(false);
  const [expulsarError, setExpulsarError] = useState(null);
  const [expulsionFeedback, setExpulsionFeedback] = useState(null);

  // Convocatoria — la formación guardada vive acá (no adentro de
  // Convocatoria.jsx) porque Tabs desmonta el contenido de la pestaña
  // inactiva: si viviera en el propio componente, se perdería cada vez que
  // el capitán se va a "Plantel" y vuelve a "Convocatoria".
  const [convocatoriaGuardada, setConvocatoriaGuardada] = useState(null);
  const [convocatoriaFeedback, setConvocatoriaFeedback] = useState(null);

  const jugadorLogueado = JSON.parse(localStorage.getItem("jugador") || "null");
  const esMiEquipo = jugadorLogueado?.equipo?.id === Number(equipoId);
  const esCapitanDeEsteEquipo = !!jugadorLogueado?.esCapitan && esMiEquipo;

  useEffect(() => {
    const fetchEquipo = async () => {
      try {
        const response = await apiFetch(`/equipos/${equipoId}`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Error al cargar equipo");
        setEquipo(data.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (equipoId) fetchEquipo();
  }, [equipoId]);

  // Jugadores sin equipo, solo si el jugador logueado es capitán de este equipo
  useEffect(() => {
    if (!esCapitanDeEsteEquipo) return;
    apiFetch("/jugadores/sin-equipo")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.data)) {
          setJugadoresSinEquipo(data.data);
          setFiltrados(data.data);
        }
      })
      .catch((err) => console.error("Error cargando jugadores sin equipo:", err));
  }, [esCapitanDeEsteEquipo]);

  // Invitaciones ya enviadas por este equipo y todavía pendientes (para no
  // dejar invitar dos veces al mismo jugador desde el buscador)
  useEffect(() => {
    if (!esCapitanDeEsteEquipo) return;
    apiFetch(`/invitaciones/equipo/${equipoId}?estado=pendiente`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.data)) {
          setInvitadosIds(data.data.map((inv) => inv.jugador.id));
        }
      })
      .catch((err) => console.error("Error cargando invitaciones pendientes:", err));
  }, [esCapitanDeEsteEquipo, equipoId]);

  // Invitaciones resueltas (aceptadas o rechazadas) que el capitán todavía no vio
  useEffect(() => {
    if (!esCapitanDeEsteEquipo) return;
    apiFetch(`/invitaciones/equipo/${equipoId}?estado=aceptada,rechazada&vistaPorCapitan=false`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.data)) setNotificaciones(data.data);
      })
      .catch((err) => console.error("Error cargando notificaciones de invitaciones:", err));
  }, [esCapitanDeEsteEquipo, equipoId]);

  // Notificaciones personales del jugador logueado (suspensión/habilitación) —
  // visibles para cualquier miembro del plantel, no solo el capitán.
  useEffect(() => {
    if (!esMiEquipo || !jugadorLogueado?.id) return;
    apiFetch(`/notificacion/jugador/${jugadorLogueado.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.data)) setNotificacionesJugador(data.data);
      })
      .catch((err) => console.error("Error cargando notificaciones del jugador:", err));
  }, [esMiEquipo, jugadorLogueado?.id]);

  // Formación de convocatoria — GET /formaciones no toma equipoId: siempre
  // devuelve la formación del EQUIPO PROPIO del token (o null si no hay
  // ninguna guardada todavía). Por eso solo tiene sentido pedirla cuando
  // esMiEquipo, que es justo cuando la pestaña Convocatoria existe.
  useEffect(() => {
    if (!esMiEquipo) return;
    apiFetch("/formaciones")
      .then((res) => res.json())
      .then((data) => setConvocatoriaGuardada(data.data ?? null))
      .catch((err) => console.error("Error cargando la formación del equipo:", err));
  }, [esMiEquipo, equipoId]);

  useEffect(() => {
    const resultado = jugadoresSinEquipo.filter((j) => {
      const nombreCompleto = `${j.nombre} ${j.apellido}`.toLowerCase();
      return nombreCompleto.includes(busqueda.toLowerCase());
    });
    setFiltrados(resultado);
    setVerTodosSinEquipo(false);
  }, [busqueda, jugadoresSinEquipo]);

  const handleInvitar = async (idJugador) => {
    try {
      const response = await apiFetch("/invitaciones", {
        method: "POST",
        body: JSON.stringify({ idJugador }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Error al enviar la invitación");

      setAgregarFeedback({ variant: "success", text: "Invitación enviada." });
      setInvitadosIds((prev) => [...prev, idJugador]);
    } catch (error) {
      console.error("Error enviando invitación:", error);
      setAgregarFeedback({ variant: "error", text: "Error al enviar la invitación: " + error.message });
    }
  };

  const handleMarcarVista = async (idInvitacion) => {
    try {
      const response = await apiFetch(`/invitaciones/${idInvitacion}/vista`, { method: "PATCH" });
      if (!response.ok) throw new Error("Error al descartar la notificación");
      setNotificaciones((prev) => prev.filter((n) => n.id !== idInvitacion));
    } catch (error) {
      console.error("Error marcando invitación como vista:", error);
    }
  };

  const handleMarcarNotificacionJugadorLeida = async (idNotificacion) => {
    try {
      const response = await apiFetch(`/notificacion/${idNotificacion}/leida`, { method: "PATCH" });
      if (!response.ok) throw new Error("Error al descartar la notificación");
      setNotificacionesJugador((prev) => prev.filter((n) => n.id !== idNotificacion));
    } catch (error) {
      console.error("Error marcando notificación como leída:", error);
    }
  };

  const handleEmpezarEdicionDescripcion = () => {
    setDescripcionForm(equipo.descripcion || "");
    setDescripcionFeedback(null);
    setEditandoDescripcion(true);
  };

  const handleGuardarDescripcion = async (e) => {
    e.preventDefault();
    setGuardandoDescripcion(true);
    try {
      const response = await apiFetch(`/equipos/${equipoId}`, {
        method: "PUT",
        body: JSON.stringify({ descripcion: descripcionForm }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Error al guardar la descripción");
      setEquipo({ ...equipo, descripcion: descripcionForm });
      setEditandoDescripcion(false);
    } catch (err) {
      setDescripcionFeedback({ variant: "error", text: err.message });
    } finally {
      setGuardandoDescripcion(false);
    }
  };

  const handleSubirEscudo = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "image/jpeg") {
      setEscudoFeedback({ variant: "error", text: "El escudo debe ser un archivo .jpg o .jpeg." });
      return;
    }

    const formData = new FormData();
    formData.append("escudo", file);

    setSubiendoEscudo(true);
    setEscudoFeedback(null);
    try {
      const response = await apiFetchFormData(`/equipos/${equipoId}/escudo`, formData);
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Error al subir el escudo");
      setEquipo({ ...equipo, escudoUrl: data.data.escudoUrl });
    } catch (err) {
      setEscudoFeedback({ variant: "error", text: err.message });
    } finally {
      setSubiendoEscudo(false);
      e.target.value = "";
    }
  };

  // Ejecuta la salida real (PUT equipo:null) — se usa tanto para el jugador
  // raso como para el capitán, una vez que ya transfirió la cinta (o no hace
  // falta porque es el único jugador del plantel).
  const ejecutarSalida = async () => {
    setSaliendoEquipo(true);
    try {
      const response = await apiFetch(`/jugadores/${jugadorLogueado.id}`, {
        method: "PUT",
        body: JSON.stringify({ ...jugadorLogueado, equipo: null }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Error al salir del equipo");

      const actualizado = { ...jugadorLogueado, equipo: null };
      localStorage.setItem("jugador", JSON.stringify(actualizado));

      let feedback;
      if (data.message?.includes("Equipo eliminado")) {
        feedback = { variant: "info", text: "El equipo fue eliminado porque se quedó sin jugadores." };
      } else if (data.message?.includes("Nuevo capitán")) {
        feedback = { variant: "info", text: "Se asignó un nuevo capitán automáticamente." };
      } else {
        feedback = { variant: "success", text: "Has salido del equipo correctamente." };
      }

      if (onEquipoLeft) {
        onEquipoLeft(actualizado, feedback);
      } else {
        navigate("/gestorTorneos/equipos");
      }
    } catch (error) {
      console.error("Error al salir del equipo:", error);
      setSalirFeedback({ variant: "error", text: "Ocurrió un error al salir del equipo." });
    } finally {
      setSaliendoEquipo(false);
    }
  };

  const handleSalirEquipo = () => {
    if (!jugadorLogueado?.equipo) return;

    if (jugadorLogueado.esCapitan) {
      const companeros = equipo.jugadores.filter((j) => j.id !== jugadorLogueado.id);

      if (companeros.length === 0) {
        const confirmar = window.confirm(
          "Sos el único jugador del equipo. Si salís, el equipo quedará sin capitán (y se eliminará). ¿Querés salir igual?"
        );
        if (confirmar) ejecutarSalida();
        return;
      }

      setNuevoCapitanId(null);
      setTransferFeedback(null);
      setSalirDespuesDeTransferir(true);
      setMostrarTransferirCapitania(true);
      return;
    }

    const confirmar = window.confirm("¿Estás seguro de que deseas salir de tu equipo?");
    if (confirmar) ejecutarSalida();
  };

  // Abre el mismo modal de transferencia, pero sin salir del equipo después —
  // botón "Asignar capitanía" disponible en todo momento para el capitán.
  const handleAbrirAsignarCapitania = () => {
    setNuevoCapitanId(null);
    setTransferFeedback(null);
    setCapitaniaFeedback(null);
    setSalirDespuesDeTransferir(false);
    setMostrarTransferirCapitania(true);
  };

  const handleConfirmarTransferencia = async () => {
    if (!nuevoCapitanId) {
      setTransferFeedback({ variant: "error", text: "Elegí un jugador para transferirle la capitanía." });
      return;
    }

    setTransfiriendo(true);
    try {
      const response = await apiFetch(`/jugadores/${jugadorLogueado.id}/transferir-capitania`, {
        method: "PATCH",
        body: JSON.stringify({ idNuevoCapitan: nuevoCapitanId }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Error al transferir la capitanía");

      setMostrarTransferirCapitania(false);

      if (salirDespuesDeTransferir) {
        await ejecutarSalida();
        return;
      }

      // Transferencia sin salir: el jugador logueado deja de ser capitán —
      // hay que reflejarlo en localStorage y refrescar el equipo para que
      // los controles de capitán (agregar jugadores, notificaciones, etc.)
      // desaparezcan sin necesidad de recargar la página.
      const actualizado = { ...jugadorLogueado, esCapitan: false };
      localStorage.setItem("jugador", JSON.stringify(actualizado));

      const res = await apiFetch(`/equipos/${equipoId}`);
      const dataEquipo = await res.json();
      if (res.ok) setEquipo(dataEquipo.data);

      setCapitaniaFeedback({ variant: "success", text: "Capitanía transferida correctamente." });
    } catch (error) {
      console.error("Error al transferir la capitanía:", error);
      setTransferFeedback({ variant: "error", text: error.message });
    } finally {
      setTransfiriendo(false);
    }
  };

  const handleAbrirExpulsar = (jugador) => {
    setMotivoExpulsion("");
    setExpulsarError(null);
    setJugadorAExpulsar(jugador);
  };

  const handleCerrarExpulsar = () => {
    setJugadorAExpulsar(null);
    setMotivoExpulsion("");
    setExpulsarError(null);
  };

  const motivoExpulsionValido = motivoExpulsion.trim().length >= 5;

  const handleConfirmarExpulsion = async () => {
    if (!motivoExpulsionValido) return;

    setExpulsando(true);
    setExpulsarError(null);
    try {
      const response = await apiFetch(`/jugadores/${jugadorAExpulsar.id}/expulsar`, {
        method: "PATCH",
        body: JSON.stringify({ motivo: motivoExpulsion.trim() }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Error al expulsar al jugador");

      const expulsado = jugadorAExpulsar;
      setEquipo({ ...equipo, jugadores: equipo.jugadores.filter((j) => j.id !== expulsado.id) });
      handleCerrarExpulsar();
      setExpulsionFeedback({
        variant: "success",
        text: `${expulsado.nombre} ${expulsado.apellido} fue expulsado del equipo.`,
      });
    } catch (error) {
      setExpulsarError(error.message);
    } finally {
      setExpulsando(false);
    }
  };

  if (loading) return <p>Cargando...</p>;
  if (error) return <Alert variant="error">{error}</Alert>;
  if (!equipo) return <Alert variant="info">Equipo no encontrado.</Alert>;

  // Agrupar jugadores por posición, en el orden fijo de ORDEN_POSICIONES
  // (Arqueros → Defensores → Mediocampistas → Delanteros) — ya no en el
  // orden en que vengan del backend. El orden de los jugadores DENTRO de
  // cada grupo se mantiene tal cual llegan.
  const gruposPorPosicionMap = new Map();
  equipo.jugadores.forEach((jugador) => {
    const posicion = jugador.posicion ?? jugador.Posicion ?? "Sin posición";
    if (!gruposPorPosicionMap.has(posicion)) gruposPorPosicionMap.set(posicion, []);
    gruposPorPosicionMap.get(posicion).push(jugador);
  });
  const posicionesOrdenadas = [
    ...ORDEN_POSICIONES.filter((p) => gruposPorPosicionMap.has(p)),
    ...[...gruposPorPosicionMap.keys()].filter((p) => !ORDEN_POSICIONES.includes(p)),
  ];
  const gruposPorPosicion = posicionesOrdenadas.map((posicion) => ({
    posicion,
    jugadores: gruposPorPosicionMap.get(posicion),
  }));

  const plantelCompleto = equipo.jugadores.length >= MAX_JUGADORES_PLANTEL;

  // Historial de partidos — solo tiene sentido para un equipo ajeno (para el
  // propio, "Ver estadísticas del equipo" ya cubre esto). El backend solo
  // resuelve el nombre del RIVAL en local/visitante, así que el lado que
  // corresponde a ESTE equipo se completa con equipo.nombreEquipo (si no, la
  // columna del propio equipo queda en "N/A" — bug ya corregido en una fase
  // anterior, se mantiene acá). Los `?? []` son la única adición sobre la
  // lógica original: una guarda mínima para no romper la pantalla si el
  // shape de la respuesta no trae participaciones, no un cambio de lógica.
  let partidosUnicos = [];
  if (!esMiEquipo) {
    const allPartidos = [];
    (equipo.participaciones ?? []).forEach((participacion) => {
      (participacion.partidosLocal ?? []).forEach((partido) =>
        allPartidos.push({ ...partido, esteEquipoEsLocal: true })
      );
      (participacion.partidosVisitante ?? []).forEach((partido) =>
        allPartidos.push({ ...partido, esteEquipoEsLocal: false })
      );
    });
    partidosUnicos = allPartidos.filter(
      (partido, index, self) =>
        index === self.findIndex((p) => p.id === partido.id) &&
        partido.estado_partido === "finalizado"
    );
  }

  const plantelTabContent = (
    <>
      <div className="plantel-cupo">
        <span className="plantel-cupo-numero stat-numeral">
          {equipo.jugadores.length}/{MAX_JUGADORES_PLANTEL}
        </span>
        <span className="plantel-cupo-label">jugadores en el plantel</span>
      </div>

      {equipo.jugadores.length > 0 ? (
        gruposPorPosicion.map((grupo) => (
          <div key={grupo.posicion} className="grupo-posicion">
            <h3 className="subtitulo-posicion">
              {POSICION_LABELS[grupo.posicion] ?? grupo.posicion} · {grupo.jugadores.length}
            </h3>
            <ul className="lista-plantel">
              {grupo.jugadores.map((jugador) => {
                const fechaNacimiento =
                  jugador.fechaNacimiento ??
                  jugador.fecha_nacimiento ??
                  jugador.fechaNac ??
                  jugador.FechaNacimiento ??
                  "";
                const edad = fechaNacimiento
                  ? new Date().getFullYear() - new Date(fechaNacimiento).getFullYear()
                  : null;

                return (
                  <li
                    key={jugador.id}
                    className={`jugador-plantel-item${jugador.suspendido ? " jugador-plantel-item-suspendido" : ""}`}
                  >
                    <div className="jugador-plantel-nombre">
                      <strong>
                        {jugador.nombre} {jugador.apellido}{" "}
                        {jugador.esCapitan ? "(Capitán)" : ""}
                      </strong>
                      {jugador.suspendido && <span className="badge-suspendido">Suspendido</span>}
                    </div>
                    <div className="jugador-plantel-acciones">
                      {edad !== null && <div className="jugador-edad stat-numeral">{edad} años</div>}
                      {esCapitanDeEsteEquipo && (
                        <button
                          type="button"
                          className="jugador-expulsar-btn"
                          onClick={() => handleAbrirExpulsar(jugador)}
                          aria-label={`Echar a ${jugador.nombre} ${jugador.apellido}`}
                          title="Echar del equipo"
                          disabled={jugador.id === jugadorLogueado.id}
                          style={jugador.id === jugadorLogueado.id ? { visibility: "hidden" } : undefined}
                        >
                          <FiUserX />
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        ))
      ) : (
        <Alert variant="info">No hay jugadores registrados.</Alert>
      )}

      {/* Notificaciones de invitaciones respondidas — solo el capitán de este equipo */}
      {esCapitanDeEsteEquipo && notificaciones.length > 0 && (
        <section className="detalle-seccion notificaciones-invitaciones">
          <h3 className="subtitulo-posicion">Notificaciones</h3>
          {notificaciones.map((n) => (
            <Alert key={n.id} variant={n.estado === "aceptada" ? "success" : "warning"}>
              <div className="notificacion-invitacion-content">
                <span>
                  {n.jugador.nombre} {n.jugador.apellido}{" "}
                  {n.estado === "aceptada" ? "aceptó" : "rechazó"} tu invitación.
                </span>
                <Button variant="ghost" onClick={() => handleMarcarVista(n.id)}>
                  Descartar
                </Button>
              </div>
            </Alert>
          ))}
        </section>
      )}

      {esCapitanDeEsteEquipo && (
        <div className="detalle-seccion plantel-acciones-equipo">
          <Button variant="secondary" icon={<FiRepeat />} onClick={handleAbrirAsignarCapitania}>
            Asignar capitanía
          </Button>
          <Button icon={<FiPlus />} onClick={() => setMostrarAgregarJugador(true)}>
            Agregar jugador
          </Button>
        </div>
      )}
      {capitaniaFeedback && <Alert variant={capitaniaFeedback.variant}>{capitaniaFeedback.text}</Alert>}
      {expulsionFeedback && <Alert variant={expulsionFeedback.variant}>{expulsionFeedback.text}</Alert>}

      {/* Salir del equipo — cualquier miembro, no solo el capitán */}
      {esMiEquipo && (
        <section className="detalle-seccion salir-equipo-seccion">
          {salirFeedback && <Alert variant={salirFeedback.variant}>{salirFeedback.text}</Alert>}
          <Button
            variant="danger"
            icon={<FiLogOut />}
            onClick={handleSalirEquipo}
            disabled={saliendoEquipo}
          >
            {saliendoEquipo ? "Saliendo..." : "Salir del equipo"}
          </Button>
        </section>
      )}

      {/* Agregar jugadores — modal nuevo, misma lógica de búsqueda/invitación de siempre, solo movida acá adentro */}
      <Modal
        open={mostrarAgregarJugador}
        onClose={() => setMostrarAgregarJugador(false)}
        title="Agregar jugadores"
        size="lg"
      >
        {plantelCompleto ? (
          <Alert variant="warning">
            Tu plantel está completo ({MAX_JUGADORES_PLANTEL}/{MAX_JUGADORES_PLANTEL} jugadores). No
            podés agregar más jugadores hasta que alguno salga del equipo.
          </Alert>
        ) : (
          <Alert variant="info">¿Necesitás encontrar jugadores para tu equipo?</Alert>
        )}

        <TextField
          icon={<FiSearch />}
          placeholder="Buscar por nombre o apellido"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />

        {agregarFeedback && (
          <div className="feedback-box">
            <Alert variant={agregarFeedback.variant}>{agregarFeedback.text}</Alert>
          </div>
        )}

        {filtrados.length > 0 ? (
          <>
            <ul className="lista-jugadores">
              {(verTodosSinEquipo
                ? filtrados
                : filtrados.slice(0, JUGADORES_SIN_EQUIPO_PAGE_SIZE)
              ).map((j) => (
                <li key={j.id}>
                  {j.nombre} {j.apellido}
                  {invitadosIds.includes(j.id) ? (
                    <Button variant="secondary" icon={<FiSend />} disabled>
                      Invitación enviada
                    </Button>
                  ) : (
                    <Button icon={<FiSend />} onClick={() => handleInvitar(j.id)} disabled={plantelCompleto}>
                      Enviar invitación
                    </Button>
                  )}
                </li>
              ))}
            </ul>
            {!verTodosSinEquipo && filtrados.length > JUGADORES_SIN_EQUIPO_PAGE_SIZE && (
              <Button variant="secondary" onClick={() => setVerTodosSinEquipo(true)}>
                Ver más ({filtrados.length - JUGADORES_SIN_EQUIPO_PAGE_SIZE} más)
              </Button>
            )}
          </>
        ) : (
          <Alert variant="info">No se encontraron jugadores sin equipo.</Alert>
        )}
      </Modal>
    </>
  );

  const historialTabContent = (
    <section className="detalle-seccion historial-seccion">
      {partidosUnicos.length > 0 ? (
        <table className="tabla-partidos">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Local</th>
              <th>Resultado</th>
              <th>Visitante</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {partidosUnicos.map((partido) => (
              <tr key={partido.id}>
                <td>{new Date(partido.fecha_partido).toLocaleDateString("es-AR")}</td>
                <td>
                  {partido.esteEquipoEsLocal
                    ? equipo.nombreEquipo
                    : partido.local?.equipo?.nombreEquipo || "N/A"}
                </td>
                <td className="stat-numeral">
                  {partido.goles_local} - {partido.goles_visitante}
                </td>
                <td>
                  {partido.esteEquipoEsLocal
                    ? partido.visitante?.equipo?.nombreEquipo || "N/A"
                    : equipo.nombreEquipo}
                </td>
                <td>{partido.estado_partido}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <Alert variant="info">No hay partidos finalizados.</Alert>
      )}
    </section>
  );

  const convocatoriaTabContent = (
    <Convocatoria
      equipo={equipo}
      esCapitanDeEsteEquipo={esCapitanDeEsteEquipo}
      formacionGuardada={convocatoriaGuardada}
      onGuardarFormacion={setConvocatoriaGuardada}
      feedback={convocatoriaFeedback}
      onFeedback={setConvocatoriaFeedback}
    />
  );

  const tabsConfig = [
    { id: "plantel", label: "Plantel", content: plantelTabContent },
    { id: "historial", label: "Historial", content: historialTabContent, hidden: esMiEquipo },
    { id: "convocatoria", label: "Estrategia", content: convocatoriaTabContent, hidden: !esMiEquipo },
  ];

  return (
    <>
      <PageHero
        layout="split"
        icon={
          equipo.escudoUrl ? (
            <img
              src={`${ASSETS_URL}${equipo.escudoUrl}`}
              alt={`Escudo de ${equipo.nombreEquipo}`}
              className="escudo-preview"
            />
          ) : (
            <span
              className="escudo-preview escudo-preview-empty"
              style={{ backgroundColor: equipo.colorPrimario || "#e5e7eb" }}
            />
          )
        }
        title={equipo.nombreEquipo}
        subtitle="Gestión del equipo"
        actions={
          <>
            {esMiEquipo && (
              <Button
                variant="secondary"
                icon={<FiBarChart2 />}
                onClick={() => navigate("/gestorTorneos/estadisticas")}
              >
                Ver estadísticas del equipo
              </Button>
            )}
            {showVolver && (
              <Button variant="ghost" icon={<FiArrowLeft />} onClick={() => navigate("/gestorTorneos")}>
                Volver al menú
              </Button>
            )}
          </>
        }
      >
        {esCapitanDeEsteEquipo && (
          <div className="escudo-upload">
            <input
              id="escudo-input"
              type="file"
              accept=".jpg,.jpeg,image/jpeg"
              onChange={handleSubirEscudo}
              disabled={subiendoEscudo}
              className="escudo-input-hidden"
            />
            <label htmlFor="escudo-input" className="ui-btn ui-btn-secondary escudo-upload-btn">
              <FiUpload /> {subiendoEscudo ? "Subiendo..." : "Cambiar escudo (.jpg)"}
            </label>
            <span className="escudo-upload-hint">Se muestra arriba, junto al nombre del equipo</span>
          </div>
        )}
        {escudoFeedback && <Alert variant={escudoFeedback.variant}>{escudoFeedback.text}</Alert>}

      {/* Sobre el equipo — siempre visible, fuera de las pestañas */}
      <section className="detalle-seccion">
        <h2 className="titulo-seccion">Sobre el equipo</h2>
        <div className="descripcion-seccion">
          {!editandoDescripcion ? (
            <>
              <p>{equipo.descripcion || "Este equipo todavía no tiene descripción."}</p>
              {esCapitanDeEsteEquipo && (
                <Button
                  variant="secondary"
                  icon={<FiEdit2 />}
                  onClick={handleEmpezarEdicionDescripcion}
                >
                  Editar descripción
                </Button>
              )}
            </>
          ) : (
            <form onSubmit={handleGuardarDescripcion}>
              <textarea
                value={descripcionForm}
                onChange={(e) => setDescripcionForm(e.target.value)}
                placeholder="Ej: Equipo de amigos, buena onda, nos gusta el juego asociado..."
                maxLength={DESCRIPCION_MAX_LENGTH}
              />
              <span className="descripcion-contador">
                {descripcionForm.length}/{DESCRIPCION_MAX_LENGTH}
              </span>
              {descripcionFeedback && (
                <Alert variant={descripcionFeedback.variant}>{descripcionFeedback.text}</Alert>
              )}
              <div className="descripcion-botones">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setEditandoDescripcion(false)}
                  disabled={guardandoDescripcion}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={guardandoDescripcion}>
                  {guardandoDescripcion ? "Guardando..." : "Guardar"}
                </Button>
              </div>
            </form>
          )}
        </div>
      </section>

      {/* Notificaciones personales (suspensión/habilitación) — cualquier miembro,
          siempre visible (no depende de en qué pestaña esté parado) */}
      {esMiEquipo && notificacionesJugador.length > 0 && (
        <section className="detalle-seccion notificaciones-invitaciones">
          <h2 className="titulo-seccion">Notificaciones</h2>
          {notificacionesJugador.map((n) => (
            <Alert key={n.id} variant={n.tipo === "suspension" ? "warning" : "success"}>
              <div className="notificacion-invitacion-content">
                <span>{n.mensaje}</span>
                <Button variant="ghost" onClick={() => handleMarcarNotificacionJugadorLeida(n.id)}>
                  Descartar
                </Button>
              </div>
            </Alert>
          ))}
        </section>
      )}

      <Tabs tabs={tabsConfig} className="detalle-seccion" />
      </PageHero>

      {/* Transferencia de capitanía — paso obligatorio antes de que el capitán salga, si hay más jugadores (modal, queda fuera del hero) */}
      {mostrarTransferirCapitania && (
        <div className="transferir-capitania-overlay">
          <div className="transferir-capitania-modal">
            <button
              type="button"
              className="transferir-capitania-cerrar"
              onClick={() => setMostrarTransferirCapitania(false)}
              aria-label="Cerrar"
            >
              <FiX />
            </button>

            <h3 className="transferir-capitania-titulo">
              {salirDespuesDeTransferir ? "Asigná un capitán para el equipo" : "Asigná un nuevo capitán"}
            </h3>
            <p className="transferir-capitania-subtitulo">
              {salirDespuesDeTransferir
                ? "Sos el capitán del equipo. Antes de irte, elegí quién va a tomar la capitanía."
                : "Vas a dejar de ser capitán — el jugador que elijas pasará a serlo."}
            </p>

            <ul className="transferir-capitania-lista">
              {equipo.jugadores
                .filter((j) => j.id !== jugadorLogueado.id)
                .map((j) => {
                  const seleccionado = nuevoCapitanId === j.id;
                  return (
                    <li key={j.id}>
                      <label
                        className={`transferir-capitania-card${seleccionado ? " seleccionado" : ""}`}
                      >
                        <input
                          type="radio"
                          name="nuevo-capitan"
                          value={j.id}
                          checked={seleccionado}
                          onChange={() => setNuevoCapitanId(j.id)}
                        />
                        {j.nombre} {j.apellido}
                        {seleccionado && <FiCheckCircle className="transferir-capitania-check" />}
                      </label>
                    </li>
                  );
                })}
            </ul>

            {transferFeedback && <Alert variant={transferFeedback.variant}>{transferFeedback.text}</Alert>}

            <Button
              type="button"
              className="transferir-capitania-confirmar"
              onClick={handleConfirmarTransferencia}
              disabled={transfiriendo || !nuevoCapitanId}
            >
              {transfiriendo
                ? "Confirmando..."
                : salirDespuesDeTransferir
                ? "Confirmar y salir del equipo"
                : "Confirmar"}
            </Button>
          </div>
        </div>
      )}

      {/* Echar jugador del plantel */}
      <Modal
        open={!!jugadorAExpulsar}
        onClose={handleCerrarExpulsar}
        title={jugadorAExpulsar ? `Echar a ${jugadorAExpulsar.nombre} ${jugadorAExpulsar.apellido}` : ""}
      >
        <p className="expulsar-aviso">
          Esta acción saca al jugador del equipo. Contanos el motivo antes de confirmar.
        </p>
        <div className="ui-field">
          <label className="ui-field-label" htmlFor="motivo-expulsion">
            Motivo
          </label>
          <textarea
            id="motivo-expulsion"
            className="expulsar-motivo"
            value={motivoExpulsion}
            onChange={(e) => setMotivoExpulsion(e.target.value)}
            placeholder="Ej: inasistencias reiteradas, conducta antideportiva..."
          />
        </div>

        {expulsarError && <Alert variant="error">{expulsarError}</Alert>}

        <div className="descripcion-botones">
          <Button type="button" variant="secondary" onClick={handleCerrarExpulsar}>
            Cancelar
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={handleConfirmarExpulsion}
            disabled={!motivoExpulsionValido || expulsando}
          >
            {expulsando ? "Expulsando..." : "Confirmar"}
          </Button>
        </div>
      </Modal>
    </>
  );
}
