import "../styles/IndexStyle.css";
import "../styles/MenuAdmin.css";
import "../styles/CrearTorneo.css";
import "../styles/InscribirEquipos.css";
import { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FiAward, FiTag, FiUser, FiMapPin, FiCalendar, FiClock, FiZap, FiEdit2 } from "react-icons/fi";
import { adminApiFetch } from "../utils/api.js";
import { Button, TextField, Card, Alert, PageShell, PageHero, Modal, Toast } from "../components/ui";
import { useAdmin } from "../context/AdminContext.jsx";

const FORMATOS = ["Solo ida", "Ida y vuelta"];

// Espejo del mínimo que ya exige el backend (torneo.controler.ts,
// MIN_ARBITROS_TORNEO/MIN_CANCHAS_TORNEO) — acá solo es refuerzo de UX
// (deshabilitar la casilla antes de intentar guardar), la validación real
// sigue siendo del servidor.
const MIN_ARBITROS_CANCHAS = 3;

// Exportado: es la misma lista de categorías del dominio (equipos y torneos
// comparten el mismo enum) que reutiliza Equipos.jsx para el <select> de
// categoría al crear un equipo — evita una tercera copia de estos 5 valores.
export const CATEGORIAS = [
  { value: "sub15",     label: "Sub-15" },
  { value: "sub17",     label: "Sub-17" },
  { value: "mayores",   label: "Mayores (+18)" },
  { value: "veteranos", label: "Veteranos" },
  { value: "femenino",  label: "Femenino" },
];

const ESTADO_LABEL = {
  borrador: "Borrador",
  inscripcion: "Inscripción",
  en_curso: "En curso",
  finalizado: "Finalizado",
};

// Mismo criterio que combinarFechaHora en partido.controler.ts (backend) —
// junta la fecha del partido con su hora en un único Date comparable.
function combinarFechaHora(fecha, hora) {
  const [horas, minutos] = (hora ?? "00:00").split(":").map(Number);
  const combinado = new Date(fecha);
  combinado.setHours(horas, minutos, 0, 0);
  return combinado;
}

function calcularPartidos(n, formato) {
  const eq = Math.max(0, parseInt(n) || 0);
  if (eq < 2) return 0;
  if (formato === "Solo ida")     return (eq * (eq - 1)) / 2;
  if (formato === "Ida y vuelta") return eq * (eq - 1);
  return 0;
}

// Espejo del mínimo entre jornadas que ya exige el backend (shared/constants.ts,
// DIAS_MIN_ENTRE_JORNADAS) — Regla 3.
const DIAS_MIN_ENTRE_JORNADAS = 4;

// Mismo cálculo round-robin que generarRondas()/calcularCantidadJornadas()
// en el backend (torneo.controler.ts): con cantidad de equipos impar se
// completa con un "bye", entonces son (N par - 1) jornadas de ida,
// duplicado si es "idayvuelta". `formato` acá es el valor de backend
// ('ida' | 'idayvuelta'), no la etiqueta de UI ("Solo ida"/"Ida y vuelta").
function calcularJornadas(cantidadEquipos, formatoBackend) {
  const eq = Math.max(0, parseInt(cantidadEquipos) || 0);
  if (eq < 2) return 0;
  const par = eq % 2 !== 0 ? eq + 1 : eq;
  const jornadasIda = par - 1;
  return formatoBackend === "idayvuelta" ? jornadasIda * 2 : jornadasIda;
}

// Regla 3: duración mínima = (cantidad de jornadas - 1) × DIAS_MIN_ENTRE_JORNADAS.
function calcularDuracionMinimaDias(cantidadEquipos, formatoBackend) {
  const jornadas = calcularJornadas(cantidadEquipos, formatoBackend);
  return Math.max(0, jornadas - 1) * DIAS_MIN_ENTRE_JORNADAS;
}

const fixtureSchema = z.object({
  fechaBase: z.string().min(1, "Ingresá la fecha de inicio del fixture."),
  horaBase: z.string().min(1, "Ingresá la hora de inicio."),
});

const programacionSchema = z.object({
  fecha_partido: z.string().min(1, "Completá fecha y horario."),
  hora_partido: z.string().min(1, "Completá fecha y horario."),
});

// Antes esto solo lo bloqueaba el min=0 nativo del <input> (tooltip en
// inglés, ver noValidate más abajo) — sin mensaje propio, porque el chequeo
// nunca se mostraba en ningún lado más que ese tooltip. Con noValidate hay
// que darle un mensaje en español acá, que ahora sí se muestra (ver
// PartidoResultadoForm, onErrorValidacion → reutiliza el Alert de errorPartidos).
const resultadoSchema = z.object({
  goles_local: z.coerce.number({ error: "Ingresá un número válido de goles." }).min(0, "Los goles no pueden ser negativos."),
  goles_visitante: z.coerce.number({ error: "Ingresá un número válido de goles." }).min(0, "Los goles no pueden ser negativos."),
});

// Puntos por victoria/empate/derrota: siempre editables, en los 3 modos (a
// diferencia del resto de los campos, nunca quedan `disabled`) — nunca se
// mandan al backend ni se validaban antes (ni con JS ni con el `error` de
// TextField), solo con el min/max nativo del HTML. z.coerce.number() acepta
// tanto el string que tipea el usuario como el number con el que arranca
// FORM_VACIO, evitando el mismatch de tipos del bug de cantEquipos (ver
// abajo). "Ingresá un número válido." cubre el caso de que llegue algo no
// numérico — sin esto, un valor no numérico haría fallar el chequeo interno
// de tipo de zod y mostraría su mensaje en inglés por default.
const puntosSchema = {
  puntosVictoria: z.coerce
    .number({ error: "Ingresá un número válido." })
    .min(0, "Los puntos deben estar entre 0 y 10.")
    .max(10, "Los puntos deben estar entre 0 y 10."),
  puntosEmpate: z.coerce
    .number({ error: "Ingresá un número válido." })
    .min(0, "Los puntos deben estar entre 0 y 10.")
    .max(10, "Los puntos deben estar entre 0 y 10."),
  puntosDerrota: z.coerce
    .number({ error: "Ingresá un número válido." })
    .min(0, "Los puntos deben estar entre 0 y 10.")
    .max(10, "Los puntos deben estar entre 0 y 10."),
};

const MSG_FECHA_FIN_ANTERIOR = "La fecha de fin no puede ser anterior a la fecha de inicio.";

// "Datos del Torneo" — el shape cambia según el modo, igual que antes
// cambiaba qué if corría en cada handler:
// - crear: todo obligatorio + Regla 3 (nunca se validaba en edición).
// - editar sin en_curso: los mismos campos, pero SIN Regla 3 (esta pantalla
//   jamás la chequeó del lado edición — el backend la valida ahí distinto,
//   contra participaciones reales, no contra el cupo declarado).
// - editar con en_curso: solo nombre/fechaFin importan (el resto queda
//   disabled en el form) — categoria/cantEquipos/formato ni se incluyen en
//   el shape, zod los descarta solos (comportamiento "strip" por default).
//
// `fechaInicioOriginal` (solo se usa en modo en_curso, donde fechaInicio no
// es un campo del form): es la fecha de inicio ya persistida, para poder
// seguir bloqueando "fecha de fin anterior a la de inicio" ahí también —
// antes lo hacía el atributo `min` nativo del <input date>, que dejamos de
// usar para validar (ver noValidate en el <form>, bug de tooltips en inglés).
function crearTorneoSchema(modoEdicion, estadoEnCurso, fechaInicioOriginal) {
  if (modoEdicion && estadoEnCurso) {
    return z
      .object({
        nombre: z.string().refine((v) => v.trim().length > 0, "El nombre del torneo es obligatorio."),
        fechaFin: z.string().min(1, "La fecha de fin es obligatoria."),
        ...puntosSchema,
      })
      .superRefine((data, ctx) => {
        if (fechaInicioOriginal && data.fechaFin && data.fechaFin < fechaInicioOriginal) {
          ctx.addIssue({ code: "custom", path: ["fechaFin"], message: MSG_FECHA_FIN_ANTERIOR });
        }
      });
  }

  // cantEquipos: z.coerce.number() (antes era z.string()) — con el schema
  // como string, el primer submit en modo edición fallaba con el mensaje
  // crudo de zod "Invalid input: expected string, received number", porque
  // resetTorneo() carga t.cantidadEquipos tal cual viene del backend (number),
  // y ese valor nunca pasaba por el onChange del input (que sí da string) si
  // el usuario no tocaba el campo. z.coerce.number() acepta los dos tipos por
  // igual, así que ya no importa de dónde vino el valor.
  const base = z
    .object({
      nombre: z.string().refine((v) => v.trim().length > 0, "El nombre del torneo es obligatorio."),
      fechaInicio: z.string().min(1, "La fecha de inicio es obligatoria."),
      fechaFin: z.string().min(1, "La fecha de fin es obligatoria."),
      categoria: z.string(),
      cantEquipos: z.coerce
        .number({ error: "Ingresá un número válido de equipos." })
        .min(2, "Se necesitan al menos 2 equipos.")
        .max(30, "El máximo permitido es 30 equipos."),
      formato: z.string(),
      ...puntosSchema,
    })
    .superRefine((data, ctx) => {
      if (data.fechaInicio && data.fechaFin && data.fechaFin < data.fechaInicio) {
        ctx.addIssue({ code: "custom", path: ["fechaFin"], message: MSG_FECHA_FIN_ANTERIOR });
      }
    });

  if (modoEdicion) return base;

  // Crear: además, Regla 3 — misma fórmula y mismo mensaje que ya arma
  // calcularJornadas()/calcularDuracionMinimaDias() más arriba en este
  // archivo (espejo de torneo.controler.ts, validarDuracionMinima). Se
  // adjunta al path de fechaFin: si fechaFin es anterior a fechaInicio, el
  // superRefine de arriba ya dejó su propio mensaje (más claro) en ese mismo
  // path — igual corre este cálculo, pero con fechaFin-fechaInicio negativo
  // el `if` de abajo también dispara, así que puede haber dos issues en el
  // mismo path; zodResolver se queda con la primera, que es la más clara.
  return base.superRefine((data, ctx) => {
    const formatoBackend = data.formato === "Ida y vuelta" ? "idayvuelta" : "ida";
    const diasDuracion = Math.round(
      (new Date(data.fechaFin).getTime() - new Date(data.fechaInicio).getTime()) / (24 * 60 * 60 * 1000)
    );
    const jornadas = calcularJornadas(data.cantEquipos, formatoBackend);
    const minimoRequerido = calcularDuracionMinimaDias(data.cantEquipos, formatoBackend);
    if (diasDuracion < minimoRequerido) {
      const formatoLabel = formatoBackend === "idayvuelta" ? "ida y vuelta" : "solo ida";
      ctx.addIssue({
        code: "custom",
        path: ["fechaFin"],
        message:
          `Este torneo necesita al menos ${jornadas} jornada(s) para ${data.cantEquipos} equipos (formato ${formatoLabel}). `
          + `Con un mínimo de ${DIAS_MIN_ENTRE_JORNADAS} días entre jornadas, la duración mínima requerida es de ${minimoRequerido} días. `
          + `La duración actual es de ${diasDuracion} días.`,
      });
    }
  });
}

const FORM_VACIO = {
  nombre:         "",
  fechaInicio:    "",
  fechaFin:       "",
  categoria:      "sub15",
  cantEquipos:    8,
  formato:        "Solo ida",
  puntosVictoria: 3,
  puntosEmpate:   1,
  puntosDerrota:  0,
};

// Carga de resultado de UN partido — se renderiza una vez por fila dentro de
// un .map(), y cada fila necesita su propia instancia de useForm (todas las
// filas están visibles y son editables a la vez, a diferencia del editor de
// programación de arriba, donde solo hay uno abierto por vez) — por regla de
// los hooks, eso significa que esta lógica no puede vivir como más useForm()
// sueltos dentro del .map() de CrearTorneo, tiene que ser su propio componente.
function PartidoResultadoForm({ partido, onGuardar, onAbrirReedicion, onErrorValidacion }) {
  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm({
    resolver: zodResolver(resultadoSchema),
    defaultValues: {
      goles_local: partido.goles_local ?? 0,
      goles_visitante: partido.goles_visitante ?? 0,
    },
  });

  // Si el partido ya está finalizado, no se guarda directo — se le pide
  // confirmación al admin antes de sobreescribir (mismo criterio que valida
  // el backend, ver actualizarResultado en partido.controler.ts; ver acá el
  // modal "Sobreescribir resultado").
  const onSubmit = async (data) => {
    if (partido.estado_partido === "finalizado") {
      onAbrirReedicion(partido, data);
      return;
    }
    await onGuardar(partido, data.goles_local, data.goles_visitante, false);
  };

  // Sin Alert propio en esta fila — reusa el mismo cartel de errorPartidos
  // que ya se muestra arriba de la lista (backend), así un valor negativo no
  // se queda sin feedback ahora que noValidate apaga el tooltip nativo.
  const onInvalid = (erroresCampos) => {
    onErrorValidacion(erroresCampos.goles_local?.message || erroresCampos.goles_visitante?.message || "");
  };

  return (
    <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="ie-partido-resultado" noValidate>
      <input
        type="number"
        min={0}
        className="ie-partido-goles"
        {...register("goles_local")}
        aria-label={`Goles de ${partido.local?.equipo?.nombreEquipo ?? "local"}`}
      />
      <span className="ie-partido-guion">–</span>
      <input
        type="number"
        min={0}
        className="ie-partido-goles"
        {...register("goles_visitante")}
        aria-label={`Goles de ${partido.visitante?.equipo?.nombreEquipo ?? "visitante"}`}
      />
      <Button type="submit" variant="secondary" disabled={isSubmitting}>
        {isSubmitting ? "Guardando..." : "Guardar"}
      </Button>
    </form>
  );
}

export default function CrearTorneo() {
  const navigate = useNavigate();
  const { id } = useParams();
  const modoEdicion = Boolean(id);

  const { admin } = useAdmin();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Solo en modo edición: el torneo tal cual vino del backend (para saber su
  // estado real y detectar qué campos cambiaron), y el loading de esa carga.
  const [torneoOriginal, setTorneoOriginal] = useState(null);
  const [loadingInicial, setLoadingInicial] = useState(modoEdicion);

  // Modal de confirmación cuando extender fecha fin (torneo en_curso) deja
  // equipos en conflicto con otros torneos — null = modal cerrado.
  const [conflictosFechaFin, setConflictosFechaFin] = useState(null);
  const [fechaFinPendiente, setFechaFinPendiente] = useState(null);
  const [aplicandoFechaFin, setAplicandoFechaFin] = useState(false);

  // ── Gestión del torneo (Árbitros/Canchas/Partidos) — solo en modoEdicion.
  // Antes vivía como tabs en InscribirEquipos.jsx; se movió acá para que
  // tenga más jerarquía visual que un tab chico. Misma lógica, mismos
  // endpoints, solo cambió el componente que la monta.
  const [seccionAbierta, setSeccionAbierta] = useState(null); // null | 'arbitros' | 'canchas' | 'partidos'

  const [canchas, setCanchas] = useState([]);
  const [arbitros, setArbitros] = useState([]);
  const [canchasTorneoIds, setCanchasTorneoIds] = useState(new Set());
  const [arbitrosTorneoIds, setArbitrosTorneoIds] = useState(new Set());
  const [canchasSelec, setCanchasSelec] = useState(new Set());
  const [arbitrosSelec, setArbitrosSelec] = useState(new Set());
  const [guardandoArbitros, setGuardandoArbitros] = useState(false);
  const [errorArbitros, setErrorArbitros] = useState("");
  const [okArbitros, setOkArbitros] = useState("");
  const [guardandoCanchas, setGuardandoCanchas] = useState(false);
  const [errorCanchas, setErrorCanchas] = useState("");
  const [okCanchas, setOkCanchas] = useState("");

  const [partidos, setPartidos] = useState([]);
  const [errorPartidos, setErrorPartidos] = useState("");
  const [jornadaFiltro, setJornadaFiltro] = useState("todas");
  // Reedición de un resultado ya cargado: además del partido, hace falta
  // guardar los goles que se tipearon en el momento del click (mismos valores
  // que se reenvían con confirmarReedicion:true al confirmar "Sobreescribir").
  const [partidoAReeditar, setPartidoAReeditar] = useState(null);
  const [golesPendientesReedicion, setGolesPendientesReedicion] = useState(null);
  const [editandoProgramacionId, setEditandoProgramacionId] = useState(null); // id del partido con el editor de fecha/hora abierto
  const [errorProgramacion, setErrorProgramacion] = useState("");
  const [toastMsg, setToastMsg] = useState(null); // confirmación de resultado guardado
  const [loadingFixture, setLoadingFixture] = useState(false);
  const [errorFixture, setErrorFixture] = useState("");
  const [okFixture, setOkFixture] = useState("");

  // El resolver se resuelve en cada validación contra el modo/estado ACTUAL
  // (estadoEnCurso puede cambiar en vivo dentro de la misma carga de página,
  // si se genera el fixture mientras esta sección sigue montada) — por eso es
  // una función que arma el schema on-the-fly, no un schema fijo.
  const {
    register: registerTorneo,
    handleSubmit: handleSubmitTorneo,
    watch: watchTorneo,
    setValue: setValueTorneo,
    reset: resetTorneo,
    formState: { errors: erroresTorneo },
  } = useForm({
    resolver: (values, context, options) =>
      zodResolver(
        crearTorneoSchema(
          modoEdicion,
          modoEdicion && torneoOriginal?.estado === "en_curso",
          torneoOriginal?.fechaInicio ? torneoOriginal.fechaInicio.slice(0, 10) : undefined
        )
      )(values, context, options),
    defaultValues: FORM_VACIO,
  });

  const {
    register: registerFixture,
    handleSubmit: handleSubmitFixture,
    reset: resetFixture,
    formState: { errors: erroresFixture },
  } = useForm({
    resolver: zodResolver(fixtureSchema),
    defaultValues: { fechaBase: "", horaBase: "15:00" },
  });

  const {
    register: registerProgramacion,
    handleSubmit: handleSubmitProgramacion,
    reset: resetProgramacion,
    formState: { errors: erroresProgramacion, isSubmitting: guardandoProgramacion },
  } = useForm({
    resolver: zodResolver(programacionSchema),
    defaultValues: { fecha_partido: "", hora_partido: "" },
  });

  // En modo edición, carga el torneo existente + todo lo necesario para
  // gestionar Árbitros/Canchas/Partidos (antes vivía en InscribirEquipos.jsx).
  useEffect(() => {
    if (!admin || !modoEdicion) return;
    (async () => {
      setLoadingInicial(true);
      setError("");
      try {
        const [resTorneo, resCanchas, resArbitros, resCanchasTorneo, resArbitrosTorneo, resPartidos] = await Promise.all([
          adminApiFetch(`/torneo/${id}`),
          adminApiFetch("/canchas"),
          adminApiFetch("/arbitros"),
          adminApiFetch(`/torneo/${id}/canchas`),
          adminApiFetch(`/torneo/${id}/arbitros`),
          adminApiFetch(`/partidos/torneo/${id}`),
        ]);
        const [data, dCanchas, dArbitros, dCanchasTorneo, dArbitrosTorneo, dPartidos] = await Promise.all([
          resTorneo.json(),
          resCanchas.json(),
          resArbitros.json(),
          resCanchasTorneo.json(),
          resArbitrosTorneo.json(),
          resPartidos.json(),
        ]);
        if (!resTorneo.ok) throw new Error(data.message || "Error al cargar el torneo");
        const t = data.data;
        setTorneoOriginal(t);
        resetTorneo({
          nombre:         t.nombreTorneo ?? "",
          fechaInicio:    t.fechaInicio ? t.fechaInicio.slice(0, 10) : "",
          fechaFin:       t.fechaFin ? t.fechaFin.slice(0, 10) : "",
          categoria:      t.categoria ?? "sub15",
          cantEquipos:    t.cantidadEquipos ?? 8,
          formato:        t.formato === "idayvuelta" ? "Ida y vuelta" : "Solo ida",
          puntosVictoria: 3,
          puntosEmpate:   1,
          puntosDerrota:  0,
        });

        setCanchas(dCanchas.data || []);
        setArbitros(dArbitros.data || []);
        setPartidos(dPartidos.data || []);

        const idsCanchasAsignadas = new Set((dCanchasTorneo.data || []).map((c) => c.id));
        const idsArbitrosAsignados = new Set((dArbitrosTorneo.data || []).map((a) => a.id));
        setCanchasTorneoIds(idsCanchasAsignadas);
        setArbitrosTorneoIds(idsArbitrosAsignados);
        setCanchasSelec(new Set(idsCanchasAsignadas));
        setArbitrosSelec(new Set(idsArbitrosAsignados));

        if (t.fechaInicio) resetFixture({ fechaBase: t.fechaInicio.slice(0, 10), horaBase: "15:00" });
      } catch (e) {
        setError(e.message);
      } finally {
        setLoadingInicial(false);
      }
    })();
  }, [admin, modoEdicion, id]);

  // Valores en vivo del form (no solo al submit): hacen falta para el resumen
  // reactivo, el máx/mín cruzado entre fechas, y el estado "active" de los
  // pills de formato — cosas de UI, no de validación (eso lo maneja el
  // resolver de arriba).
  const valoresTorneo = watchTorneo();
  const partidosEstimados = calcularPartidos(valoresTorneo.cantEquipos, valoresTorneo.formato);
  const estadoEnCurso = modoEdicion && torneoOriginal?.estado === "en_curso";

  // estado del torneo al crearlo: 'borrador' (queda sin publicar, se termina
  // después desde "Mis Torneos") o 'inscripcion' (ya acepta equipos — ver
  // src/torneo/torneo.entity.ts en el backend para el resto del ciclo de
  // vida — así que "Crear Torneo" pasa directo a inscribir equipos). Ya no
  // valida nada a mano: si llegamos acá es porque crearTorneoSchema ya
  // corrió (incluida la Regla 3) vía handleSubmitTorneo.
  async function submitTorneo(estado, values) {
    setError("");
    setLoading(true);
    try {
      const body = {
        nombreTorneo:    values.nombre.trim(),
        fechaInicio:     values.fechaInicio,
        fechaFin:        values.fechaFin,
        estado,
        categoria:       values.categoria,
        cantidadEquipos: Number(values.cantEquipos),
        formato:         values.formato === "Ida y vuelta" ? "idayvuelta" : "ida",
        adminTorneo:     admin.id,
      };

      const res = await adminApiFetch("/torneo", {
        method: "POST",
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error al crear el torneo");

      const torneoId = data.data?.id;

      if (estado === "borrador") {
        navigate("/admin/torneos");
      } else {
        // Ir a inscribir equipos
        navigate(`/admin/torneos/${torneoId}/equipos`);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  // Guardar cambios — torneo NO en_curso: todos los campos son editables por
  // el PATCH genérico, igual que antes se creaba (sin tocar `estado`).
  async function guardarCambiosNormal(values) {
    setError("");
    setLoading(true);
    try {
      const body = {
        nombreTorneo:    values.nombre.trim(),
        fechaInicio:     values.fechaInicio,
        fechaFin:        values.fechaFin,
        categoria:       values.categoria,
        cantidadEquipos: Number(values.cantEquipos),
        formato:         values.formato === "Ida y vuelta" ? "idayvuelta" : "ida",
      };
      const res = await adminApiFetch(`/torneo/${id}`, { method: "PATCH", body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error al guardar los cambios");
      navigate("/admin/torneos");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function aplicarFechaFin(fechaFin, confirmarCascada) {
    const res = await adminApiFetch(`/torneo/${id}/fecha-fin`, {
      method: "PATCH",
      body: JSON.stringify({ fechaFin, confirmarCascada }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "No se pudo extender la fecha fin.");
    return data;
  }

  // Guardar cambios — torneo en_curso: solo nombre y fechaFin son editables.
  // El nombre se aplica directo (no tiene efectos secundarios); fechaFin pasa
  // primero por el preview de conflictos antes de aplicarse.
  async function guardarCambiosEnCurso(values) {
    setError("");
    setLoading(true);
    try {
      if (values.nombre.trim() !== torneoOriginal.nombreTorneo) {
        const res = await adminApiFetch(`/torneo/${id}`, {
          method: "PATCH",
          body: JSON.stringify({ nombreTorneo: values.nombre.trim() }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "No se pudo actualizar el nombre.");
      }

      const fechaFinOriginal = (torneoOriginal.fechaFin || "").slice(0, 10);
      if (values.fechaFin === fechaFinOriginal) {
        navigate("/admin/torneos");
        return;
      }

      const resPreview = await adminApiFetch(`/torneo/${id}/fecha-fin/preview`, {
        method: "POST",
        body: JSON.stringify({ fechaFin: values.fechaFin }),
      });
      const dataPreview = await resPreview.json();
      if (!resPreview.ok) throw new Error(dataPreview.message || "No se pudo validar la nueva fecha fin.");

      const conflictos = dataPreview.data?.conflictos ?? [];
      if (conflictos.length === 0) {
        await aplicarFechaFin(values.fechaFin, false);
        navigate("/admin/torneos");
        return;
      }

      // Hay conflictos: no se aplica nada todavía, se le pide confirmación al admin.
      setFechaFinPendiente(values.fechaFin);
      setConflictosFechaFin(conflictos);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function confirmarCascadaFechaFin() {
    setAplicandoFechaFin(true);
    try {
      await aplicarFechaFin(fechaFinPendiente, true);
      setConflictosFechaFin(null);
      setFechaFinPendiente(null);
      navigate("/admin/torneos");
    } catch (e) {
      setConflictosFechaFin(null);
      setError(e.message);
    } finally {
      setAplicandoFechaFin(false);
    }
  }

  function cancelarCascadaFechaFin() {
    setConflictosFechaFin(null);
    setFechaFinPendiente(null);
  }

  function guardarCambios(values) {
    return estadoEnCurso ? guardarCambiosEnCurso(values) : guardarCambiosNormal(values);
  }

  // Único onSubmit del <form onSubmit={handleSubmitTorneo(...)}>. En modo
  // edición hay un solo botón (type="submit" normal). En modo creación hay
  // DOS botones "submit" con distinto resultado ("Guardar borrador" /
  // "+ Crear Torneo") — se distinguen por el name/value del <button> que
  // efectivamente disparó el submit (event.nativeEvent.submitter), en vez de
  // separar en dos <form> o duplicar la validación.
  function onSubmitDatosTorneo(values, event) {
    if (modoEdicion) return guardarCambios(values);
    const estado = event?.nativeEvent?.submitter?.value ?? "inscripcion";
    return submitTorneo(estado, values);
  }

  // ── Árbitros / Canchas / Partidos (movido tal cual desde InscribirEquipos.jsx) ──

  const totalInscriptosTorneo = torneoOriginal?.participaciones?.length ?? 0;

  // "Días entre jornadas" ya no lo elige el admin — se muestra como dato
  // informativo, calculado igual que lo hace el backend (generarFixture):
  // la duración real del torneo repartida en partes iguales entre las
  // jornadas que van después de la primera.
  const jornadasTorneo = calcularJornadas(totalInscriptosTorneo, torneoOriginal?.formato);
  const duracionRealTorneoDias = torneoOriginal
    ? Math.round(
        (new Date(torneoOriginal.fechaFin).getTime() - new Date(torneoOriginal.fechaInicio).getTime())
          / (24 * 60 * 60 * 1000)
      )
    : 0;
  const diasEntreJornadasCalculado =
    jornadasTorneo > 1 ? Math.floor(duracionRealTorneoDias / (jornadasTorneo - 1)) : null;
  // Antes usaba torneoOriginal?.estado === "en_curso" — un torneo puede llegar
  // a en_curso sin tener partidos, así que la única fuente confiable es si
  // hay Partidos de verdad.
  const fixtureYaGenerado = partidos.length > 0;

  const jornadasDisponibles = useMemo(
    () => [...new Set(partidos.map((p) => p.jornada))].sort((a, b) => a - b),
    [partidos]
  );
  const partidosFiltrados = useMemo(
    () =>
      jornadaFiltro === "todas"
        ? partidos
        : partidos.filter((p) => p.jornada === Number(jornadaFiltro)),
    [partidos, jornadaFiltro]
  );
  const partidosPorJornada = useMemo(() => {
    const grupos = new Map();
    for (const p of partidosFiltrados) {
      if (!grupos.has(p.jornada)) grupos.set(p.jornada, []);
      grupos.get(p.jornada).push(p);
    }
    return [...grupos.entries()].sort(([a], [b]) => a - b);
  }, [partidosFiltrados]);

  function toggleCancha(canchaId) {
    setCanchasSelec((prev) => {
      const next = new Set(prev);
      next.has(canchaId) ? next.delete(canchaId) : next.add(canchaId);
      return next;
    });
  }

  function toggleArbitro(arbitroId) {
    setArbitrosSelec((prev) => {
      const next = new Set(prev);
      next.has(arbitroId) ? next.delete(arbitroId) : next.add(arbitroId);
      return next;
    });
  }

  async function refrescarPartidos() {
    const res = await adminApiFetch(`/partidos/torneo/${id}`);
    const data = await res.json();
    if (res.ok) setPartidos(data.data || []);
  }

  async function handleGuardarArbitros() {
    setErrorArbitros("");
    setOkArbitros("");
    setGuardandoArbitros(true);
    try {
      const res = await adminApiFetch(`/torneo/${id}/arbitros`, {
        method: "PUT",
        body: JSON.stringify({ arbitroIds: [...arbitrosSelec] }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error al guardar los árbitros");
      setArbitrosTorneoIds(new Set(arbitrosSelec));
      const reasignados = data.data?.partidosReasignados ?? [];
      setOkArbitros(
        reasignados.length > 0
          ? `Árbitros actualizados. Se reasignaron ${reasignados.length} partido(s) que tenían un árbitro removido.`
          : "Árbitros del torneo actualizados."
      );
      if (reasignados.length > 0) await refrescarPartidos();
    } catch (e) {
      setErrorArbitros(e.message);
    } finally {
      setGuardandoArbitros(false);
    }
  }

  async function handleGuardarCanchas() {
    setErrorCanchas("");
    setOkCanchas("");
    setGuardandoCanchas(true);
    try {
      const res = await adminApiFetch(`/torneo/${id}/canchas`, {
        method: "PUT",
        body: JSON.stringify({ canchaIds: [...canchasSelec] }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error al guardar las canchas");
      setCanchasTorneoIds(new Set(canchasSelec));
      const reasignadas = data.data?.partidosReasignados ?? [];
      setOkCanchas(
        reasignadas.length > 0
          ? `Canchas actualizadas. Se reasignaron ${reasignadas.length} partido(s) que tenían una cancha removida.`
          : "Canchas del torneo actualizadas."
      );
      if (reasignadas.length > 0) await refrescarPartidos();
    } catch (e) {
      setErrorCanchas(e.message);
    } finally {
      setGuardandoCanchas(false);
    }
  }

  async function onGenerarFixture({ fechaBase, horaBase }) {
    setErrorFixture("");
    setOkFixture("");

    if (arbitrosTorneoIds.size === 0 || canchasTorneoIds.size === 0) {
      setErrorFixture("Asigná al menos un árbitro y una cancha desde las tarjetas correspondientes.");
      return;
    }

    setLoadingFixture(true);
    try {
      const res = await adminApiFetch(`/torneo/${id}/generar-fixture`, {
        method: "POST",
        body: JSON.stringify({ fechaBase, horaBase }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error al generar el fixture");
      setOkFixture(data.message);
      // Recargar torneo para reflejar estado "en_curso"
      const resTorneo = await adminApiFetch(`/torneo/${id}`);
      const dTorneo = await resTorneo.json();
      if (resTorneo.ok) setTorneoOriginal(dTorneo.data);
      await refrescarPartidos();
    } catch (e) {
      setErrorFixture(e.message);
    } finally {
      setLoadingFixture(false);
    }
  }

  // Guarda el resultado de un partido — lo llaman tanto PartidoResultadoForm
  // (envío normal, confirmarReedicion:false) como el botón "Sobreescribir"
  // del modal de reedición (confirmarReedicion:true, con los goles que ya se
  // habían tipeado cuando se detectó el conflicto).
  async function guardarResultado(partido, golesLocal, golesVisitante, confirmarReedicion = false) {
    setErrorPartidos("");
    try {
      const res = await adminApiFetch(`/partidos/${partido.id}/resultado`, {
        method: "PATCH",
        body: JSON.stringify({
          goles_local: golesLocal,
          goles_visitante: golesVisitante,
          confirmarReedicion,
        }),
      });
      const data = await res.json();

      // El partido ya tenía un resultado y todavía no se confirmó la
      // sobreescritura (pudo pasar si el estado del frontend quedó
      // desactualizado) — el flujo normal ya abre el modal antes de llegar
      // acá (ver PartidoResultadoForm), esto es solo la defensa de respaldo.
      if (res.status === 409) {
        setPartidoAReeditar(partido);
        setGolesPendientesReedicion({ goles_local: golesLocal, goles_visitante: golesVisitante });
        return;
      }
      if (!res.ok) throw new Error(data.message || "No se pudo guardar el resultado.");

      setPartidos((prev) =>
        prev.map((p) =>
          p.id === partido.id
            ? { ...p, goles_local: data.data.goles_local, goles_visitante: data.data.goles_visitante, estado_partido: data.data.estado_partido, walkover: false }
            : p
        )
      );
      const nombreLocal = partido?.local?.equipo?.nombreEquipo ?? "Local";
      const nombreVisitante = partido?.visitante?.equipo?.nombreEquipo ?? "Visitante";
      setToastMsg(`Resultado actualizado: ${nombreLocal} ${data.data.goles_local} - ${data.data.goles_visitante} ${nombreVisitante}`);
      setPartidoAReeditar(null);
      setGolesPendientesReedicion(null);
    } catch (e) {
      setErrorPartidos(e.message);
    }
  }

  // Si el partido ya tiene un resultado cargado, PartidoResultadoForm no
  // llama a guardarResultado directo: pide confirmación primero (mismo
  // criterio que el backend, ver actualizarResultado en partido.controler.ts)
  // — evita sobreescribir sin querer.
  function abrirReedicionResultado(partido, { goles_local, goles_visitante }) {
    setPartidoAReeditar(partido);
    setGolesPendientesReedicion({ goles_local, goles_visitante });
  }

  function abrirEdicionProgramacion(partido) {
    setErrorProgramacion("");
    resetProgramacion({
      fecha_partido: partido.fecha_partido ? partido.fecha_partido.slice(0, 10) : "",
      hora_partido: partido.hora_partido ?? "",
    });
    setEditandoProgramacionId(partido.id);
  }

  function cancelarEdicionProgramacion() {
    setEditandoProgramacionId(null);
    setErrorProgramacion("");
  }

  async function onGuardarProgramacion({ fecha_partido, hora_partido }) {
    setErrorProgramacion("");
    try {
      const res = await adminApiFetch(`/partidos/${editandoProgramacionId}/programacion`, {
        method: "PATCH",
        body: JSON.stringify({ fecha_partido, hora_partido }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "No se pudo actualizar la fecha y el horario.");

      setPartidos((prev) =>
        prev.map((partido) =>
          partido.id === editandoProgramacionId
            ? { ...partido, fecha_partido: data.data.fecha_partido, hora_partido: data.data.hora_partido }
            : partido
        )
      );
      setEditandoProgramacionId(null);
    } catch (e) {
      setErrorProgramacion(e.message);
    }
  }

  if (modoEdicion && loadingInicial) {
    return (
      <PageShell bare>
        <Card className="ct-form-card">Cargando torneo...</Card>
      </PageShell>
    );
  }

  return (
    <>
      <PageShell bare>
        {/* Hero */}
        <PageHero
          layout="left"
          icon={<FiAward />}
          title={modoEdicion ? "Editar Torneo" : "Crear Torneo"}
          subtitle={modoEdicion
            ? "Actualizá los datos del torneo. Con el torneo en curso, solo se puede editar el nombre y la fecha de fin."
            : "Configurá el nuevo certamen y armá el fixture en minutos."}
        >
        {modoEdicion && (
          <section className="ct-gestion">
            <div className="ct-gestion-cards">
              <button
                type="button"
                className={`ct-gestion-card${seccionAbierta === "arbitros" ? " active" : ""}`}
                onClick={() => setSeccionAbierta(seccionAbierta === "arbitros" ? null : "arbitros")}
              >
                <span className="ct-gestion-card-icon"><FiUser /></span>
                <span className="ct-gestion-card-texto">
                  <span className="ct-gestion-card-titulo">Árbitros</span>
                  <span className="ct-gestion-card-desc">{arbitrosTorneoIds.size} asignado(s) a este torneo</span>
                </span>
              </button>

              <button
                type="button"
                className={`ct-gestion-card${seccionAbierta === "canchas" ? " active" : ""}`}
                onClick={() => setSeccionAbierta(seccionAbierta === "canchas" ? null : "canchas")}
              >
                <span className="ct-gestion-card-icon"><FiMapPin /></span>
                <span className="ct-gestion-card-texto">
                  <span className="ct-gestion-card-titulo">Canchas</span>
                  <span className="ct-gestion-card-desc">{canchasTorneoIds.size} asignada(s) a este torneo</span>
                </span>
              </button>

              <button
                type="button"
                className={`ct-gestion-card${seccionAbierta === "partidos" ? " active" : ""}`}
                onClick={() => setSeccionAbierta(seccionAbierta === "partidos" ? null : "partidos")}
              >
                <span className="ct-gestion-card-icon"><FiCalendar /></span>
                <span className="ct-gestion-card-texto">
                  <span className="ct-gestion-card-titulo">Partidos</span>
                  <span className="ct-gestion-card-desc">
                    {fixtureYaGenerado ? `${partidos.length} partido(s) — fixture generado` : "Generar el fixture del torneo"}
                  </span>
                </span>
              </button>
            </div>

            {seccionAbierta && (
              <Card className="ct-gestion-panel">
                {seccionAbierta === "arbitros" && (
                  <>
                    <div className="ie-panel-header">
                      <div>
                        <h2>Árbitros del torneo</h2>
                        <p>Seleccioná los árbitros disponibles para dirigir los partidos de este torneo</p>
                      </div>
                      <span className="ie-badge-count">{arbitrosSelec.size} seleccionado(s)</span>
                    </div>

                    <p className="ie-fixture-asignados">
                      Mínimo {MIN_ARBITROS_CANCHAS} árbitros por torneo — si sacás uno con partidos programados,
                      se reasignan automáticamente a otro de los que queden.
                    </p>

                    {errorArbitros && <Alert variant="error" className="ie-alert">{errorArbitros}</Alert>}
                    {okArbitros && <Alert variant="success" className="ie-alert">{okArbitros}</Alert>}

                    {arbitros.length === 0 ? (
                      <p className="ie-list-empty">No hay árbitros cargados en el sistema.</p>
                    ) : (
                      <div className="ie-check-list ie-check-list-tab">
                        {arbitros.map((a) => {
                          const bloqueado = arbitrosSelec.has(a.id) && arbitrosSelec.size <= MIN_ARBITROS_CANCHAS;
                          return (
                            <label
                              key={a.id}
                              className="ie-check-item"
                              title={bloqueado ? `Un torneo debe tener al menos ${MIN_ARBITROS_CANCHAS} árbitros` : undefined}
                            >
                              <input
                                type="checkbox"
                                checked={arbitrosSelec.has(a.id)}
                                disabled={bloqueado}
                                onChange={() => toggleArbitro(a.id)}
                              />
                              {a.nombre} {a.apellido}
                            </label>
                          );
                        })}
                      </div>
                    )}

                    <Button className="ie-btn-block" disabled={guardandoArbitros} onClick={handleGuardarArbitros}>
                      {guardandoArbitros ? "Guardando..." : "Guardar árbitros"}
                    </Button>
                  </>
                )}

                {seccionAbierta === "canchas" && (() => {
                  const canchasActivas = canchas.filter((c) => c.estado === "activa");
                  return (
                    <>
                      <div className="ie-panel-header">
                        <div>
                          <h2>Canchas del torneo</h2>
                          <p>Seleccioná las canchas disponibles para los partidos de este torneo</p>
                        </div>
                        <span className="ie-badge-count">{canchasSelec.size} seleccionada(s)</span>
                      </div>

                      <p className="ie-fixture-asignados">
                        Mínimo {MIN_ARBITROS_CANCHAS} canchas por torneo — si sacás una con partidos programados,
                        se reasignan automáticamente a otra de las que queden.
                      </p>

                      {errorCanchas && <Alert variant="error" className="ie-alert">{errorCanchas}</Alert>}
                      {okCanchas && <Alert variant="success" className="ie-alert">{okCanchas}</Alert>}

                      {canchasActivas.length === 0 ? (
                        <p className="ie-list-empty">No hay canchas activas disponibles en el sistema.</p>
                      ) : (
                        <div className="ie-check-list ie-check-list-tab">
                          {canchasActivas.map((c) => {
                            const bloqueada = canchasSelec.has(c.id) && canchasSelec.size <= MIN_ARBITROS_CANCHAS;
                            return (
                              <label
                                key={c.id}
                                className="ie-check-item"
                                title={bloqueada ? `Un torneo debe tener al menos ${MIN_ARBITROS_CANCHAS} canchas` : undefined}
                              >
                                <input
                                  type="checkbox"
                                  checked={canchasSelec.has(c.id)}
                                  disabled={bloqueada}
                                  onChange={() => toggleCancha(c.id)}
                                />
                                {c.nombre}
                              </label>
                            );
                          })}
                        </div>
                      )}

                      <Button className="ie-btn-block" disabled={guardandoCanchas} onClick={handleGuardarCanchas}>
                        {guardandoCanchas ? "Guardando..." : "Guardar canchas"}
                      </Button>
                    </>
                  );
                })()}

                {seccionAbierta === "partidos" && (
                  <>
                    <div className="ie-panel-header">
                      <div>
                        <h2>Partidos</h2>
                        <p>{fixtureYaGenerado ? "Cargá el resultado de cada partido jugado" : "Generá el fixture para este torneo"}</p>
                      </div>
                      {fixtureYaGenerado && <span className="ie-badge-count">{partidos.length} partido(s)</span>}
                    </div>

                    {!fixtureYaGenerado ? (
                      <form onSubmit={handleSubmitFixture(onGenerarFixture)} noValidate>
                        <TextField
                          label="Fecha de inicio"
                          type="date"
                          {...registerFixture("fechaBase")}
                          error={erroresFixture.fechaBase?.message}
                          className="ie-fixture-field"
                        />
                        <TextField
                          label="Hora de los partidos"
                          type="time"
                          {...registerFixture("horaBase")}
                          error={erroresFixture.horaBase?.message}
                          className="ie-fixture-field"
                        />
                        <div className="ie-fixture-field">
                          <label>Días entre jornadas</label>
                          <p className="ie-fixture-asignados">
                            {diasEntreJornadasCalculado != null
                              ? `${diasEntreJornadasCalculado} (calculado automáticamente según la duración del torneo)`
                              : "Se calcula automáticamente al generar el fixture"}
                          </p>
                        </div>

                        <p className="ie-fixture-asignados">
                          {arbitrosTorneoIds.size} árbitro(s) y {canchasTorneoIds.size} cancha(s) asignados a este torneo.
                        </p>

                        {(arbitrosTorneoIds.size === 0 || canchasTorneoIds.size === 0) && (
                          <Alert variant="warning" className="ie-alert">
                            Asigná al menos un árbitro y una cancha desde las tarjetas "Árbitros" y "Canchas" antes de generar el fixture.
                          </Alert>
                        )}

                        {errorFixture && <Alert variant="error" className="ie-alert">{errorFixture}</Alert>}
                        {okFixture && <Alert variant="success" className="ie-alert">{okFixture}</Alert>}

                        <Button
                          type="submit"
                          className="ie-btn-block"
                          icon={<FiZap />}
                          disabled={
                            totalInscriptosTorneo < 2 ||
                            loadingFixture ||
                            arbitrosTorneoIds.size === 0 ||
                            canchasTorneoIds.size === 0
                          }
                        >
                          {loadingFixture
                            ? "Generando..."
                            : totalInscriptosTorneo < 2
                            ? "Inscribí al menos 2 equipos"
                            : "Generar fixture"}
                        </Button>
                      </form>
                    ) : (
                      <>
                        {errorPartidos && <Alert variant="error" className="ie-alert">{errorPartidos}</Alert>}

                        <div className="ie-partido-filtro">
                          <label htmlFor="ie-filtro-jornada">Filtrar por jornada</label>
                          <select
                            id="ie-filtro-jornada"
                            className="ie-partido-filtro-select"
                            value={jornadaFiltro}
                            onChange={(e) => setJornadaFiltro(e.target.value)}
                          >
                            <option value="todas">Todas las jornadas</option>
                            {jornadasDisponibles.map((j) => (
                              <option key={j} value={j}>Jornada {j}</option>
                            ))}
                          </select>
                        </div>

                        {partidosFiltrados.length === 0 && (
                          <p className="ie-list-empty">No hay partidos para esa jornada.</p>
                        )}

                        {partidosPorJornada.map(([jornada, partidosDeJornada]) => (
                          <div key={jornada} className="ie-jornada-grupo">
                            {jornadaFiltro === "todas" && <h4 className="ie-jornada-titulo">Jornada {jornada}</h4>}
                            <div className="ie-partidos-list">
                              {partidosDeJornada.map((p) => {
                                // La programación (fecha/hora/árbitro/cancha) se bloquea si el partido ya
                                // está finalizado O si su fecha+hora ya pasó — cualquiera de las dos, no
                                // una en reemplazo de la otra (un finalizado con fecha futura por algún
                                // motivo igual queda bloqueado: ya se jugó en los hechos). El resultado,
                                // en cambio, siempre es editable (ver PartidoResultadoForm/guardarResultado).
                                const yaPaso = combinarFechaHora(p.fecha_partido, p.hora_partido) < new Date();
                                const puedeReprogramar = estadoEnCurso && p.estado_partido !== "finalizado" && !yaPaso;
                                return (
                                  <div key={p.id} className="ie-partido-row">
                                    <div className="ie-partido-info">
                                      <span className="ie-partido-jornada">Jornada {p.jornada}</span>
                                      <span className="ie-partido-equipos">
                                        {p.local?.equipo?.nombreEquipo ?? "Local"}
                                        {p.local?.estado_participacion === "dado_de_baja" && " (Baja)"} vs{" "}
                                        {p.visitante?.equipo?.nombreEquipo ?? "Visitante"}
                                        {p.visitante?.estado_participacion === "dado_de_baja" && " (Baja)"}
                                      </span>
                                      {p.walkover && <span className="ie-partido-wo">W.O.</span>}
                                      <span className={`ie-partido-estado ie-partido-estado-${p.estado_partido}`}>
                                        {p.estado_partido}
                                      </span>
                                    </div>
                                    <div className="ie-partido-detalle">
                                      <span>
                                        <FiCalendar />{" "}
                                        {p.fecha_partido ? new Date(p.fecha_partido).toLocaleDateString("es-AR") : "Sin fecha asignada"}
                                      </span>
                                      <span><FiClock /> {p.hora_partido || "Sin fecha asignada"}</span>
                                      <span><FiMapPin /> {p.cancha?.nombre ?? "Sin cancha"}</span>
                                      <span><FiUser /> {p.arbitro ? `${p.arbitro.nombre} ${p.arbitro.apellido}` : "Sin árbitro"}</span>
                                      {puedeReprogramar && (
                                        <button
                                          type="button"
                                          className="ie-partido-editar-btn"
                                          onClick={() => abrirEdicionProgramacion(p)}
                                          title="Editar fecha y horario"
                                        >
                                          <FiEdit2 />
                                        </button>
                                      )}
                                    </div>

                                    {editandoProgramacionId === p.id && (
                                      <form
                                        onSubmit={handleSubmitProgramacion(onGuardarProgramacion)}
                                        className="ie-programacion-editor"
                                        noValidate
                                      >
                                        <input
                                          type="date"
                                          className="ie-programacion-input"
                                          {...registerProgramacion("fecha_partido")}
                                          aria-label="Nueva fecha del partido"
                                        />
                                        <input
                                          type="time"
                                          className="ie-programacion-input"
                                          {...registerProgramacion("hora_partido")}
                                          aria-label="Nuevo horario del partido"
                                        />
                                        <Button type="submit" variant="secondary" disabled={guardandoProgramacion}>
                                          {guardandoProgramacion ? "Guardando..." : "Guardar"}
                                        </Button>
                                        <Button type="button" variant="ghost" onClick={cancelarEdicionProgramacion}>
                                          Cancelar
                                        </Button>
                                        {(errorProgramacion || erroresProgramacion.fecha_partido || erroresProgramacion.hora_partido) && (
                                          <Alert variant="error" className="ie-alert ie-programacion-error">
                                            {errorProgramacion
                                              || erroresProgramacion.fecha_partido?.message
                                              || erroresProgramacion.hora_partido?.message}
                                          </Alert>
                                        )}
                                      </form>
                                    )}

                                    <PartidoResultadoForm
                                      partido={p}
                                      onGuardar={guardarResultado}
                                      onAbrirReedicion={abrirReedicionResultado}
                                      onErrorValidacion={setErrorPartidos}
                                    />
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </>
                    )}
                  </>
                )}
              </Card>
            )}
          </section>
        )}

        <section className="ct-main">
          {/* ── Formulario ──────────────────────────────────────────────── */}
          <Card className="ct-form-card">
            <div className="ct-form-header">
              <div>
                <h2>Datos del Torneo</h2>
                <p>Información general que se mostrará a los clubes</p>
              </div>
              <span className="ct-borrador-badge">
                ● {modoEdicion ? (ESTADO_LABEL[torneoOriginal?.estado] ?? torneoOriginal?.estado) : "Borrador"}
              </span>
            </div>

            <form
              className="ct-form-body"
              noValidate
              onSubmit={(e) => {
                // Limpia cualquier error de backend de un intento anterior
                // ANTES de re-validar — si no, un intento inválido posterior
                // mostraría ese error viejo en vez del mensaje de validación
                // nuevo (mismo `setError("")` que antes corría primero en
                // cada handler, ahora movido acá porque submitTorneo/
                // guardarCambios* ya no se llaman si la validación falla).
                setError("");
                return handleSubmitTorneo(onSubmitDatosTorneo)(e);
              }}
            >

              {estadoEnCurso && (
                <Alert variant="info">
                  Este torneo está en curso: solo se pueden editar el nombre y la fecha de fin.
                </Alert>
              )}

              <TextField
                label="Nombre del Torneo"
                placeholder="Ej: Apertura 2025"
                {...registerTorneo("nombre")}
              />

              {/* Fechas */}
              <div className="ct-field-row ct-field-row-2">
                <TextField
                  label="Fecha de inicio"
                  type="date"
                  disabled={estadoEnCurso}
                  {...registerTorneo("fechaInicio")}
                />
                <TextField
                  label="Fecha de fin"
                  type="date"
                  min={valoresTorneo.fechaInicio || undefined}
                  {...registerTorneo("fechaFin")}
                />
              </div>

              {/* Categoría / Equipos */}
              <div className="ct-field-row">
                <div className="ui-field">
                  <label className="ui-field-label" htmlFor="ct-categoria">Categoría</label>
                  <div className="ui-field-control">
                    <FiTag className="ui-field-icon" />
                    <select
                      id="ct-categoria"
                      className="ui-field-input"
                      disabled={estadoEnCurso}
                      {...registerTorneo("categoria")}
                    >
                      {CATEGORIAS.map((c) => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <TextField
                    label="Cantidad de equipos"
                    type="number"
                    min={2}
                    max={30}
                    disabled={estadoEnCurso}
                    error={
                      erroresTorneo.cantEquipos?.message === "El máximo permitido es 30 equipos."
                        ? erroresTorneo.cantEquipos.message
                        : ""
                    }
                    {...registerTorneo("cantEquipos")}
                  />
                </div>
              </div>

              {/* Formato */}
              <div className="ct-field">
                <label>Formato de juego</label>
                <div className="ct-pill-group">
                  {FORMATOS.map((f) => (
                    <button
                      key={f}
                      type="button"
                      className={`ct-pill${valoresTorneo.formato === f ? " active" : ""}`}
                      onClick={() => !estadoEnCurso && setValueTorneo("formato", f, { shouldDirty: true })}
                      disabled={estadoEnCurso}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              {/* Puntos */}
              <div className="ct-field-row">
                <TextField
                  label="Puntos por victoria"
                  type="number" min={0} max={10}
                  {...registerTorneo("puntosVictoria")}
                />
                <TextField
                  label="Puntos por empate"
                  type="number" min={0} max={10}
                  {...registerTorneo("puntosEmpate")}
                />
                <TextField
                  label="Puntos por derrota"
                  type="number" min={0} max={10}
                  {...registerTorneo("puntosDerrota")}
                />
              </div>

              {(error
                || erroresTorneo.nombre?.message
                || erroresTorneo.fechaInicio?.message
                || erroresTorneo.fechaFin?.message
                || erroresTorneo.cantEquipos?.message
                || erroresTorneo.puntosVictoria?.message
                || erroresTorneo.puntosEmpate?.message
                || erroresTorneo.puntosDerrota?.message) && (
                <Alert variant="error">
                  {error
                    || erroresTorneo.nombre?.message
                    || erroresTorneo.fechaInicio?.message
                    || erroresTorneo.fechaFin?.message
                    || erroresTorneo.cantEquipos?.message
                    || erroresTorneo.puntosVictoria?.message
                    || erroresTorneo.puntosEmpate?.message
                    || erroresTorneo.puntosDerrota?.message}
                </Alert>
              )}

              {/* Botones */}
              <div className="ct-actions">
                {modoEdicion ? (
                  <>
                    <Button type="button" variant="secondary" disabled={loading} onClick={() => navigate("/admin/torneos")}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={loading} className="ct-btn-crear">
                      {loading ? "Guardando..." : "Guardar cambios"}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      type="submit"
                      name="estado"
                      value="borrador"
                      variant="secondary"
                      disabled={loading}
                    >
                      {loading ? "Guardando..." : "Guardar borrador"}
                    </Button>
                    <Button
                      type="submit"
                      name="estado"
                      value="inscripcion"
                      disabled={loading}
                      className="ct-btn-crear"
                    >
                      {loading ? "Creando..." : "+ Crear Torneo"}
                    </Button>
                  </>
                )}
              </div>

            </form>
          </Card>

          {/* ── Resumen ─────────────────────────────────────────────────── */}
          <Card className="ct-summary-card">
            <h3 className="ct-summary-title">Resumen</h3>
            <div className="ct-summary-rows">
              {[
                { label: "Nombre",            value: valoresTorneo.nombre || "—" },
                { label: "Categoría",         value: CATEGORIAS.find(c => c.value === valoresTorneo.categoria)?.label ?? valoresTorneo.categoria },
                { label: "Equipos",           value: valoresTorneo.cantEquipos },
                { label: "Formato",           value: valoresTorneo.formato },
                { label: "Inicio",            value: valoresTorneo.fechaInicio || "—" },
                { label: "Fin",               value: valoresTorneo.fechaFin || "—" },
                { label: "Partidos estimados", value: partidosEstimados },
                { label: "Puntos (V/E/D)",    value: `${valoresTorneo.puntosVictoria} / ${valoresTorneo.puntosEmpate} / ${valoresTorneo.puntosDerrota}` },
              ].map(({ label, value }) => (
                <div key={label} className="ct-summary-row">
                  <span className="ct-summary-label">{label}</span>
                  <span className="ct-summary-value">{String(value)}</span>
                </div>
              ))}
            </div>

            {!modoEdicion && (
              <Alert variant="warning" className="ct-warning">
                Vas a generar <strong>{partidosEstimados} partidos</strong> en formato{" "}
                <strong>{(valoresTorneo.formato || "").toLowerCase()}</strong>. Después de crear el torneo
                podrás inscribir equipos y generar el fixture.
              </Alert>
            )}
          </Card>
        </section>
        </PageHero>
      </PageShell>

      <Modal open={conflictosFechaFin !== null} onClose={cancelarCascadaFechaFin} title="Confirmar extensión de fecha fin">
        {conflictosFechaFin && (
          <div className="ct-modal-cascada">
            <p>
              Extender la fecha fin hará que {conflictosFechaFin.length} equipo(s) sean removidos
              automáticamente de otros torneos por superposición de fechas:
            </p>
            <ul className="ct-modal-cascada-lista">
              {conflictosFechaFin.map((c) => (
                <li key={c.participacionId}>
                  {c.equipoNombre} (de &quot;{c.torneoConflictoNombre}&quot;)
                </li>
              ))}
            </ul>
            <p className="ct-modal-cascada-warning">Esta acción no se puede deshacer.</p>
            <div className="ct-modal-cascada-actions">
              <Button variant="secondary" onClick={cancelarCascadaFechaFin} disabled={aplicandoFechaFin}>
                Cancelar
              </Button>
              <Button variant="danger" onClick={confirmarCascadaFechaFin} disabled={aplicandoFechaFin}>
                {aplicandoFechaFin ? "Aplicando..." : "Confirmar y extender"}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={!!partidoAReeditar}
        onClose={() => setPartidoAReeditar(null)}
        title="Sobreescribir resultado"
      >
        <p>
          {partidoAReeditar?.local?.equipo?.nombreEquipo ?? "Local"} vs{" "}
          {partidoAReeditar?.visitante?.equipo?.nombreEquipo ?? "Visitante"} ya tiene un resultado cargado
          ({partidoAReeditar?.goles_local}-{partidoAReeditar?.goles_visitante}). ¿Confirmás que querés sobreescribirlo?
        </p>
        <div className="ie-modal-reeditar-actions">
          <Button
            variant="secondary"
            onClick={() => { setPartidoAReeditar(null); setGolesPendientesReedicion(null); }}
          >
            Cancelar
          </Button>
          <Button
            onClick={() => guardarResultado(
              partidoAReeditar,
              golesPendientesReedicion.goles_local,
              golesPendientesReedicion.goles_visitante,
              true
            )}
          >
            Sobreescribir
          </Button>
        </div>
      </Modal>

      <Toast message={toastMsg} onClose={() => setToastMsg(null)} />
    </>
  );
}
