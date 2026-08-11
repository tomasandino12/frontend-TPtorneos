import "../styles/IndexStyle.css";
import "../styles/MenuAdmin.css";
import "../styles/CrearTorneo.css";
import "../styles/InscribirEquipos.css";
import { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FiAward, FiTag, FiUser, FiMapPin, FiCalendar, FiClock, FiZap, FiEdit2 } from "react-icons/fi";
import AdminHeader from "../components/AdminHeader.jsx";
import { adminApiFetch } from "../utils/api.js";
import { Button, TextField, Card, Alert, PageShell, PageHero, Modal, Toast } from "../components/ui";

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

export default function CrearTorneo() {
  const navigate = useNavigate();
  const { id } = useParams();
  const modoEdicion = Boolean(id);

  const [admin, setAdmin] = useState(null);
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
  const [resultados, setResultados] = useState({}); // { [partidoId]: { goles_local, goles_visitante } }
  const [guardandoResultadoId, setGuardandoResultadoId] = useState(null);
  const [errorPartidos, setErrorPartidos] = useState("");
  const [jornadaFiltro, setJornadaFiltro] = useState("todas");
  const [partidoAReeditar, setPartidoAReeditar] = useState(null);
  const [editandoProgramacionId, setEditandoProgramacionId] = useState(null); // id del partido con el editor de fecha/hora abierto
  const [programacion, setProgramacion] = useState({}); // { [partidoId]: { fecha_partido, hora_partido } }
  const [guardandoProgramacionId, setGuardandoProgramacionId] = useState(null);
  const [errorProgramacion, setErrorProgramacion] = useState("");
  const [toastMsg, setToastMsg] = useState(null); // confirmación de resultado guardado
  const [fechaBase, setFechaBase] = useState("");
  const [horaBase, setHoraBase] = useState("15:00");
  const [diasEntreJornadas, setDiasEntreJornadas] = useState(7);
  const [loadingFixture, setLoadingFixture] = useState(false);
  const [errorFixture, setErrorFixture] = useState("");
  const [okFixture, setOkFixture] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("admin");
    if (!stored) { navigate("/admin"); return; }
    try { setAdmin(JSON.parse(stored)); }
    catch { navigate("/admin"); }
  }, [navigate]);

  const [form, setForm] = useState(FORM_VACIO);

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
        setForm({
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

        if (t.fechaInicio) setFechaBase(t.fechaInicio.slice(0, 10));
      } catch (e) {
        setError(e.message);
      } finally {
        setLoadingInicial(false);
      }
    })();
  }, [admin, modoEdicion, id]);

  const upd = (key, val) => setForm((prev) => ({ ...prev, [key]: val }));

  const partidosEstimados = calcularPartidos(form.cantEquipos, form.formato);
  const estadoEnCurso = modoEdicion && torneoOriginal?.estado === "en_curso";

  const handleLogout = () => {
    localStorage.removeItem("admin");
    localStorage.removeItem("adminToken");
    navigate("/admin");
  };

  // estado del torneo al crearlo: 'borrador' (queda sin publicar, se termina
  // después desde "Mis Torneos") o 'inscripcion' (ya acepta equipos — ver
  // src/torneo/torneo.entity.ts en el backend para el resto del ciclo de
  // vida — así que "Crear Torneo" pasa directo a inscribir equipos).
  async function submitTorneo(estado) {
    setError("");

    if (!form.nombre.trim()) { setError("El nombre del torneo es obligatorio."); return; }
    if (!form.fechaInicio)   { setError("La fecha de inicio es obligatoria."); return; }
    if (!form.fechaFin)      { setError("La fecha de fin es obligatoria."); return; }
    if (Number(form.cantEquipos) < 2) { setError("Se necesitan al menos 2 equipos."); return; }

    setLoading(true);
    try {
      const body = {
        nombreTorneo:    form.nombre.trim(),
        fechaInicio:     form.fechaInicio,
        fechaFin:        form.fechaFin,
        estado,
        categoria:       form.categoria,
        cantidadEquipos: Number(form.cantEquipos),
        formato:         form.formato === "Ida y vuelta" ? "idayvuelta" : "ida",
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
  async function guardarCambiosNormal() {
    setError("");
    if (!form.nombre.trim()) { setError("El nombre del torneo es obligatorio."); return; }
    if (!form.fechaInicio)   { setError("La fecha de inicio es obligatoria."); return; }
    if (!form.fechaFin)      { setError("La fecha de fin es obligatoria."); return; }
    if (Number(form.cantEquipos) < 2) { setError("Se necesitan al menos 2 equipos."); return; }

    setLoading(true);
    try {
      const body = {
        nombreTorneo:    form.nombre.trim(),
        fechaInicio:     form.fechaInicio,
        fechaFin:        form.fechaFin,
        categoria:       form.categoria,
        cantidadEquipos: Number(form.cantEquipos),
        formato:         form.formato === "Ida y vuelta" ? "idayvuelta" : "ida",
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
  async function guardarCambiosEnCurso() {
    setError("");
    setLoading(true);
    try {
      if (form.nombre.trim() !== torneoOriginal.nombreTorneo) {
        const res = await adminApiFetch(`/torneo/${id}`, {
          method: "PATCH",
          body: JSON.stringify({ nombreTorneo: form.nombre.trim() }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "No se pudo actualizar el nombre.");
      }

      const fechaFinOriginal = (torneoOriginal.fechaFin || "").slice(0, 10);
      if (form.fechaFin === fechaFinOriginal) {
        navigate("/admin/torneos");
        return;
      }

      const resPreview = await adminApiFetch(`/torneo/${id}/fecha-fin/preview`, {
        method: "POST",
        body: JSON.stringify({ fechaFin: form.fechaFin }),
      });
      const dataPreview = await resPreview.json();
      if (!resPreview.ok) throw new Error(dataPreview.message || "No se pudo validar la nueva fecha fin.");

      const conflictos = dataPreview.data?.conflictos ?? [];
      if (conflictos.length === 0) {
        await aplicarFechaFin(form.fechaFin, false);
        navigate("/admin/torneos");
        return;
      }

      // Hay conflictos: no se aplica nada todavía, se le pide confirmación al admin.
      setFechaFinPendiente(form.fechaFin);
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

  function guardarCambios() {
    return estadoEnCurso ? guardarCambiosEnCurso() : guardarCambiosNormal();
  }

  // ── Árbitros / Canchas / Partidos (movido tal cual desde InscribirEquipos.jsx) ──

  const totalInscriptosTorneo = torneoOriginal?.participaciones?.length ?? 0;
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

  async function handleGenerarFixture() {
    setErrorFixture("");
    setOkFixture("");

    if (!fechaBase) { setErrorFixture("Ingresá la fecha de inicio del fixture."); return; }
    if (!horaBase)  { setErrorFixture("Ingresá la hora de inicio."); return; }
    if (arbitrosTorneoIds.size === 0 || canchasTorneoIds.size === 0) {
      setErrorFixture("Asigná al menos un árbitro y una cancha desde las tarjetas correspondientes.");
      return;
    }

    setLoadingFixture(true);
    try {
      const res = await adminApiFetch(`/torneo/${id}/generar-fixture`, {
        method: "POST",
        body: JSON.stringify({
          fechaBase,
          horaBase,
          diasEntreJornadas: Number(diasEntreJornadas),
        }),
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

  function actualizarResultadoLocal(partidoId, campo, valor) {
    setResultados((prev) => ({
      ...prev,
      [partidoId]: { ...(prev[partidoId] ?? {}), [campo]: valor },
    }));
  }

  async function guardarResultado(partidoId, confirmarReedicion = false) {
    const partidoActual = partidos.find((p) => p.id === partidoId);
    const r = resultados[partidoId] ?? {
      goles_local: partidoActual?.goles_local ?? 0,
      goles_visitante: partidoActual?.goles_visitante ?? 0,
    };

    setErrorPartidos("");
    setGuardandoResultadoId(partidoId);
    try {
      const res = await adminApiFetch(`/partidos/${partidoId}/resultado`, {
        method: "PATCH",
        body: JSON.stringify({
          goles_local: Number(r.goles_local),
          goles_visitante: Number(r.goles_visitante),
          confirmarReedicion,
        }),
      });
      const data = await res.json();

      // El partido ya tenía un resultado y todavía no se confirmó la
      // sobreescritura (pudo pasar si el estado del frontend quedó
      // desactualizado) — el flujo normal ya abre el modal antes de llegar
      // acá (ver handleClickGuardar), esto es solo la defensa de respaldo.
      if (res.status === 409) {
        setPartidoAReeditar(partidoActual);
        return;
      }
      if (!res.ok) throw new Error(data.message || "No se pudo guardar el resultado.");

      setPartidos((prev) =>
        prev.map((p) =>
          p.id === partidoId
            ? { ...p, goles_local: data.data.goles_local, goles_visitante: data.data.goles_visitante, estado_partido: data.data.estado_partido, walkover: false }
            : p
        )
      );
      const nombreLocal = partidoActual?.local?.equipo?.nombreEquipo ?? "Local";
      const nombreVisitante = partidoActual?.visitante?.equipo?.nombreEquipo ?? "Visitante";
      setToastMsg(`Resultado actualizado: ${nombreLocal} ${data.data.goles_local} - ${data.data.goles_visitante} ${nombreVisitante}`);
      setPartidoAReeditar(null);
    } catch (e) {
      setErrorPartidos(e.message);
    } finally {
      setGuardandoResultadoId(null);
    }
  }

  // Si el partido ya tiene un resultado cargado, primero pide confirmación
  // (mismo criterio que el backend, ver actualizarResultado en
  // partido.controler.ts) — evita sobreescribir sin querer.
  function handleClickGuardar(partido) {
    if (partido.estado_partido === "finalizado") {
      setPartidoAReeditar(partido);
      return;
    }
    guardarResultado(partido.id);
  }

  function abrirEdicionProgramacion(partido) {
    setErrorProgramacion("");
    setProgramacion((prev) => ({
      ...prev,
      [partido.id]: {
        fecha_partido: partido.fecha_partido ? partido.fecha_partido.slice(0, 10) : "",
        hora_partido: partido.hora_partido ?? "",
      },
    }));
    setEditandoProgramacionId(partido.id);
  }

  function cancelarEdicionProgramacion() {
    setEditandoProgramacionId(null);
    setErrorProgramacion("");
  }

  function actualizarProgramacionLocal(partidoId, campo, valor) {
    setProgramacion((prev) => ({
      ...prev,
      [partidoId]: { ...(prev[partidoId] ?? {}), [campo]: valor },
    }));
  }

  async function guardarProgramacion(partidoId) {
    const p = programacion[partidoId];
    if (!p?.fecha_partido || !p?.hora_partido) {
      setErrorProgramacion("Completá fecha y horario.");
      return;
    }

    setErrorProgramacion("");
    setGuardandoProgramacionId(partidoId);
    try {
      const res = await adminApiFetch(`/partidos/${partidoId}/programacion`, {
        method: "PATCH",
        body: JSON.stringify({ fecha_partido: p.fecha_partido, hora_partido: p.hora_partido }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "No se pudo actualizar la fecha y el horario.");

      setPartidos((prev) =>
        prev.map((partido) =>
          partido.id === partidoId
            ? { ...partido, fecha_partido: data.data.fecha_partido, hora_partido: data.data.hora_partido }
            : partido
        )
      );
      setEditandoProgramacionId(null);
    } catch (e) {
      setErrorProgramacion(e.message);
    } finally {
      setGuardandoProgramacionId(null);
    }
  }

  if (!admin) return null;

  if (modoEdicion && loadingInicial) {
    return (
      <div className="layout">
        <AdminHeader admin={admin} onLogout={handleLogout} />
        <PageShell bare>
          <Card className="ct-form-card">Cargando torneo...</Card>
        </PageShell>
      </div>
    );
  }

  return (
    <div className="layout">
      <AdminHeader admin={admin} onLogout={handleLogout} />

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
                      <>
                        <TextField
                          label="Fecha de inicio"
                          type="date"
                          value={fechaBase}
                          onChange={(e) => setFechaBase(e.target.value)}
                          className="ie-fixture-field"
                        />
                        <TextField
                          label="Hora de los partidos"
                          type="time"
                          value={horaBase}
                          onChange={(e) => setHoraBase(e.target.value)}
                          className="ie-fixture-field"
                        />
                        <TextField
                          label="Días entre jornadas"
                          type="number" min={1} max={30}
                          value={diasEntreJornadas}
                          onChange={(e) => setDiasEntreJornadas(e.target.value)}
                          className="ie-fixture-field"
                        />

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
                          className="ie-btn-block"
                          icon={<FiZap />}
                          disabled={
                            totalInscriptosTorneo < 2 ||
                            loadingFixture ||
                            arbitrosTorneoIds.size === 0 ||
                            canchasTorneoIds.size === 0
                          }
                          onClick={handleGenerarFixture}
                        >
                          {loadingFixture
                            ? "Generando..."
                            : totalInscriptosTorneo < 2
                            ? "Inscribí al menos 2 equipos"
                            : "Generar fixture"}
                        </Button>
                      </>
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
                                const r = resultados[p.id] ?? {
                                  goles_local: p.goles_local ?? 0,
                                  goles_visitante: p.goles_visitante ?? 0,
                                };
                                // La programación (fecha/hora/árbitro/cancha) se bloquea si el partido ya
                                // está finalizado O si su fecha+hora ya pasó — cualquiera de las dos, no
                                // una en reemplazo de la otra (un finalizado con fecha futura por algún
                                // motivo igual queda bloqueado: ya se jugó en los hechos). El resultado,
                                // en cambio, siempre es editable (ver guardarResultado/handleClickGuardar).
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
                                      <div className="ie-programacion-editor">
                                        <input
                                          type="date"
                                          className="ie-programacion-input"
                                          value={programacion[p.id]?.fecha_partido ?? ""}
                                          onChange={(e) => actualizarProgramacionLocal(p.id, "fecha_partido", e.target.value)}
                                          aria-label="Nueva fecha del partido"
                                        />
                                        <input
                                          type="time"
                                          className="ie-programacion-input"
                                          value={programacion[p.id]?.hora_partido ?? ""}
                                          onChange={(e) => actualizarProgramacionLocal(p.id, "hora_partido", e.target.value)}
                                          aria-label="Nuevo horario del partido"
                                        />
                                        <Button
                                          variant="secondary"
                                          disabled={guardandoProgramacionId === p.id}
                                          onClick={() => guardarProgramacion(p.id)}
                                        >
                                          {guardandoProgramacionId === p.id ? "Guardando..." : "Guardar"}
                                        </Button>
                                        <Button variant="ghost" onClick={cancelarEdicionProgramacion}>
                                          Cancelar
                                        </Button>
                                        {errorProgramacion && (
                                          <Alert variant="error" className="ie-alert ie-programacion-error">{errorProgramacion}</Alert>
                                        )}
                                      </div>
                                    )}

                                    <div className="ie-partido-resultado">
                                      <input
                                        type="number"
                                        min={0}
                                        className="ie-partido-goles"
                                        value={r.goles_local}
                                        onChange={(e) => actualizarResultadoLocal(p.id, "goles_local", e.target.value)}
                                        aria-label={`Goles de ${p.local?.equipo?.nombreEquipo ?? "local"}`}
                                      />
                                      <span className="ie-partido-guion">–</span>
                                      <input
                                        type="number"
                                        min={0}
                                        className="ie-partido-goles"
                                        value={r.goles_visitante}
                                        onChange={(e) => actualizarResultadoLocal(p.id, "goles_visitante", e.target.value)}
                                        aria-label={`Goles de ${p.visitante?.equipo?.nombreEquipo ?? "visitante"}`}
                                      />
                                      <Button
                                        variant="secondary"
                                        disabled={guardandoResultadoId === p.id}
                                        onClick={() => handleClickGuardar(p)}
                                      >
                                        {guardandoResultadoId === p.id ? "Guardando..." : "Guardar"}
                                      </Button>
                                    </div>
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

            <div className="ct-form-body">

              {estadoEnCurso && (
                <Alert variant="info">
                  Este torneo está en curso: solo se pueden editar el nombre y la fecha de fin.
                </Alert>
              )}

              <TextField
                label="Nombre del Torneo"
                value={form.nombre}
                onChange={(e) => upd("nombre", e.target.value)}
                placeholder="Ej: Apertura 2025"
              />

              {/* Fechas */}
              <div className="ct-field-row ct-field-row-2">
                <TextField
                  label="Fecha de inicio"
                  type="date"
                  value={form.fechaInicio}
                  onChange={(e) => upd("fechaInicio", e.target.value)}
                  disabled={estadoEnCurso}
                />
                <TextField
                  label="Fecha de fin"
                  type="date"
                  value={form.fechaFin}
                  min={form.fechaInicio || undefined}
                  onChange={(e) => upd("fechaFin", e.target.value)}
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
                      value={form.categoria}
                      onChange={(e) => upd("categoria", e.target.value)}
                      disabled={estadoEnCurso}
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
                    value={form.cantEquipos}
                    onChange={(e) => upd("cantEquipos", e.target.value)}
                    error={Number(form.cantEquipos) > 30 ? "El máximo permitido es 30 equipos." : ""}
                    disabled={estadoEnCurso}
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
                      className={`ct-pill${form.formato === f ? " active" : ""}`}
                      onClick={() => !estadoEnCurso && upd("formato", f)}
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
                  type="number" min={0} max={10} value={form.puntosVictoria}
                  onChange={(e) => upd("puntosVictoria", Number(e.target.value))}
                />
                <TextField
                  label="Puntos por empate"
                  type="number" min={0} max={10} value={form.puntosEmpate}
                  onChange={(e) => upd("puntosEmpate", Number(e.target.value))}
                />
                <TextField
                  label="Puntos por derrota"
                  type="number" min={0} max={10} value={form.puntosDerrota}
                  onChange={(e) => upd("puntosDerrota", Number(e.target.value))}
                />
              </div>

              {error && <Alert variant="error">{error}</Alert>}

              {/* Botones */}
              <div className="ct-actions">
                {modoEdicion ? (
                  <>
                    <Button type="button" variant="secondary" disabled={loading} onClick={() => navigate("/admin/torneos")}>
                      Cancelar
                    </Button>
                    <Button type="button" disabled={loading} onClick={guardarCambios} className="ct-btn-crear">
                      {loading ? "Guardando..." : "Guardar cambios"}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={loading}
                      onClick={() => submitTorneo("borrador")}
                    >
                      {loading ? "Guardando..." : "Guardar borrador"}
                    </Button>
                    <Button
                      type="button"
                      disabled={loading}
                      onClick={() => submitTorneo("inscripcion")}
                      className="ct-btn-crear"
                    >
                      {loading ? "Creando..." : "+ Crear Torneo"}
                    </Button>
                  </>
                )}
              </div>

            </div>
          </Card>

          {/* ── Resumen ─────────────────────────────────────────────────── */}
          <Card className="ct-summary-card">
            <h3 className="ct-summary-title">Resumen</h3>
            <div className="ct-summary-rows">
              {[
                { label: "Nombre",            value: form.nombre || "—" },
                { label: "Categoría",         value: CATEGORIAS.find(c => c.value === form.categoria)?.label ?? form.categoria },
                { label: "Equipos",           value: form.cantEquipos },
                { label: "Formato",           value: form.formato },
                { label: "Inicio",            value: form.fechaInicio || "—" },
                { label: "Fin",               value: form.fechaFin || "—" },
                { label: "Partidos estimados", value: partidosEstimados },
                { label: "Puntos (V/E/D)",    value: `${form.puntosVictoria} / ${form.puntosEmpate} / ${form.puntosDerrota}` },
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
                <strong>{form.formato.toLowerCase()}</strong>. Después de crear el torneo
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
          <Button variant="secondary" onClick={() => setPartidoAReeditar(null)}>Cancelar</Button>
          <Button onClick={() => guardarResultado(partidoAReeditar.id, true)}>Sobreescribir</Button>
        </div>
      </Modal>

      <Toast message={toastMsg} onClose={() => setToastMsg(null)} />

      <footer className="footer">
        <h5>
          © 2025 - Gestor de Torneos · Panel del Administrador · Para mas información o
          problemas con la página contactate a: 341 6173297 o a nuestra cuenta de
          instagram @todotorneos
        </h5>
      </footer>
    </div>
  );
}
