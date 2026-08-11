import "../styles/IndexStyle.css";
import "../styles/MenuAdmin.css";
import "../styles/InscribirEquipos.css";
import { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FiUsers, FiSearch, FiArrowLeft, FiZap, FiCheck, FiMapPin, FiUser } from "react-icons/fi";
import AdminHeader from "../components/AdminHeader.jsx";
import { adminApiFetch, ASSETS_URL } from "../utils/api.js";
import { Button, TextField, Alert, Modal, PageShell, PageHero } from "../components/ui";

// Espejo del mínimo que ya exige el backend (torneo.controler.ts,
// MIN_ARBITROS_TORNEO/MIN_CANCHAS_TORNEO) — acá solo es refuerzo de UX
// (deshabilitar la casilla antes de intentar guardar), la validación real
// sigue siendo del servidor.
const MIN_ARBITROS_CANCHAS = 3;

const LABEL_CATEGORIA = {
  sub15:     "Sub-15",
  sub17:     "Sub-17",
  mayores:   "Mayores (+18)",
  veteranos: "Veteranos",
  femenino:  "Femenino",
};

export default function InscribirEquipos() {
  const { id: torneoId } = useParams();
  const navigate = useNavigate();

  const [admin, setAdmin] = useState(null);
  const [torneo, setTorneo] = useState(null);
  const [equipos, setEquipos] = useState([]);       // todos los equipos de la categoría
  const [inscriptos, setInscriptos] = useState([]); // IDs ya inscriptos
  const [seleccionados, setSeleccionados] = useState(new Set());
  const [search, setSearch] = useState("");

  // Tabs: 'equipos' | 'arbitros' | 'canchas' | 'partidos'
  const [tabActiva, setTabActiva] = useState("equipos");

  // Partidos del torneo (tab "Partidos") y edición de resultado en curso.
  const [partidos, setPartidos] = useState([]);
  const [resultados, setResultados] = useState({}); // { [partidoId]: { goles_local, goles_visitante } }
  const [guardandoResultadoId, setGuardandoResultadoId] = useState(null);
  const [errorPartidos, setErrorPartidos] = useState("");
  const [okPartidos, setOkPartidos] = useState("");
  const [jornadaFiltro, setJornadaFiltro] = useState("todas");
  const [partidoAReeditar, setPartidoAReeditar] = useState(null); // partido finalizado pendiente de confirmar sobreescritura

  // Árbitros/canchas del sistema (para elegir) y los ya asignados a ESTE torneo
  const [canchas, setCanchas] = useState([]);
  const [arbitros, setArbitros] = useState([]);
  const [canchasTorneoIds, setCanchasTorneoIds] = useState(new Set()); // persistido (TorneoCancha)
  const [arbitrosTorneoIds, setArbitrosTorneoIds] = useState(new Set()); // persistido (TorneoArbitro)
  const [canchasSelec, setCanchasSelec] = useState(new Set()); // selección en edición dentro del tab
  const [arbitrosSelec, setArbitrosSelec] = useState(new Set());
  const [fechaBase, setFechaBase] = useState("");
  const [horaBase, setHoraBase] = useState("15:00");
  const [diasEntreJornadas, setDiasEntreJornadas] = useState(7);

  // Feedback
  const [loadingInscripcion, setLoadingInscripcion] = useState(false);
  const [loadingFixture, setLoadingFixture] = useState(false);
  const [errorInscripcion, setErrorInscripcion] = useState("");
  const [okInscripcion, setOkInscripcion] = useState("");
  const [errorFixture, setErrorFixture] = useState("");
  const [okFixture, setOkFixture] = useState("");
  const [guardandoArbitros, setGuardandoArbitros] = useState(false);
  const [errorArbitros, setErrorArbitros] = useState("");
  const [okArbitros, setOkArbitros] = useState("");
  const [guardandoCanchas, setGuardandoCanchas] = useState(false);
  const [errorCanchas, setErrorCanchas] = useState("");
  const [okCanchas, setOkCanchas] = useState("");
  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("admin");
    if (!stored) { navigate("/admin"); return; }
    try { setAdmin(JSON.parse(stored)); }
    catch { navigate("/admin"); return; }
  }, [navigate]);

  useEffect(() => {
    if (!torneoId) return;
    loadData();
  }, [torneoId]);

  async function loadData() {
    setPageLoading(true);
    setPageError("");
    try {
      const [resTorneo, resEquipos, resCanchas, resArbitros, resCanchasTorneo, resArbitrosTorneo, resPartidos] = await Promise.all([
        adminApiFetch(`/torneo/${torneoId}`),
        adminApiFetch("/equipos"),
        adminApiFetch("/canchas"),
        adminApiFetch("/arbitros"),
        adminApiFetch(`/torneo/${torneoId}/canchas`),
        adminApiFetch(`/torneo/${torneoId}/arbitros`),
        adminApiFetch(`/partidos/torneo/${torneoId}`),
      ]);

      const [dTorneo, dEquipos, dCanchas, dArbitros, dCanchasTorneo, dArbitrosTorneo, dPartidos] = await Promise.all([
        resTorneo.json(),
        resEquipos.json(),
        resCanchas.json(),
        resArbitros.json(),
        resCanchasTorneo.json(),
        resArbitrosTorneo.json(),
        resPartidos.json(),
      ]);

      if (!resTorneo.ok) throw new Error(dTorneo.message || "Error al cargar el torneo");

      const torneoData = dTorneo.data;
      setTorneo(torneoData);

      // IDs de equipos ya inscriptos en este torneo
      const inscriptosIds = new Set(
        (torneoData.participaciones || []).map((p) =>
          typeof p.equipo === "object" ? p.equipo?.id : p.equipo
        )
      );
      setInscriptos(inscriptosIds);

      // Solo mostrar equipos de la misma categoría
      const equiposFiltrados = (dEquipos.data || []).filter(
        (e) => e.categoria === torneoData.categoria
      );
      setEquipos(equiposFiltrados);

      setCanchas(dCanchas.data || []);
      setArbitros(dArbitros.data || []);
      setPartidos(dPartidos.data || []);

      // Preseleccionar lo que ya esté asignado a este torneo (no todo el sistema)
      const idsCanchasAsignadas = new Set((dCanchasTorneo.data || []).map((c) => c.id));
      const idsArbitrosAsignados = new Set((dArbitrosTorneo.data || []).map((a) => a.id));
      setCanchasTorneoIds(idsCanchasAsignadas);
      setArbitrosTorneoIds(idsArbitrosAsignados);
      setCanchasSelec(new Set(idsCanchasAsignadas));
      setArbitrosSelec(new Set(idsArbitrosAsignados));

      if (torneoData.fechaInicio) {
        setFechaBase(torneoData.fechaInicio.slice(0, 10));
      }
    } catch (e) {
      setPageError(e.message);
    } finally {
      setPageLoading(false);
    }
  }

  const equiposFiltrados = useMemo(
    () => equipos.filter((e) => e.nombreEquipo.toLowerCase().includes(search.toLowerCase())),
    [equipos, search]
  );

  // Mismo patrón que FixtureTorneo.jsx (vista del jugador) — acá además se
  // agrupan las filas por jornada para no mostrar la "lista eterna" de todos
  // los partidos apilados sin ninguna separación visual.
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

  function toggleEquipo(id) {
    if (inscriptos.has(id)) return;
    setSeleccionados((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleCancha(id) {
    setCanchasSelec((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleArbitro(id) {
    setArbitrosSelec((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function handleInscribir() {
    if (seleccionados.size === 0) { setErrorInscripcion("Seleccioná al menos un equipo."); return; }
    setErrorInscripcion("");
    setOkInscripcion("");
    setLoadingInscripcion(true);

    const hoy = new Date().toISOString().slice(0, 10);
    const errores = [];
    const exitosos = [];

    for (const equipoId of seleccionados) {
      const res = await adminApiFetch("/participacion", {
        method: "POST",
        body: JSON.stringify({ equipo: equipoId, torneo: Number(torneoId), fecha_inscripcion: hoy }),
      });
      const data = await res.json();
      if (!res.ok) {
        const equipo = equipos.find((e) => e.id === equipoId);
        errores.push(`${equipo?.nombreEquipo ?? equipoId}: ${data.message}`);
      } else {
        exitosos.push(equipoId);
      }
    }

    setInscriptos((prev) => new Set([...prev, ...exitosos]));
    setSeleccionados(new Set());
    setLoadingInscripcion(false);

    if (errores.length > 0) {
      setErrorInscripcion(errores.join(" · "));
    }
    if (exitosos.length > 0) {
      setOkInscripcion(`${exitosos.length} equipo(s) inscripto(s) correctamente.`);
      // Recargar torneo para actualizar el conteo
      const res = await adminApiFetch(`/torneo/${torneoId}`);
      const data = await res.json();
      if (res.ok) setTorneo(data.data);
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
    setOkPartidos("");
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
      setOkPartidos(`Resultado de "${nombreLocal} vs ${nombreVisitante}" guardado.`);
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

  // Después de reasignar árbitro/cancha en partidos existentes, refresca la
  // lista de partidos para que la pestaña "Partidos" muestre el cambio sin
  // recargar la página.
  async function refrescarPartidos() {
    const res = await adminApiFetch(`/partidos/torneo/${torneoId}`);
    const data = await res.json();
    if (res.ok) setPartidos(data.data || []);
  }

  async function handleGuardarArbitros() {
    setErrorArbitros("");
    setOkArbitros("");
    setGuardandoArbitros(true);
    try {
      const res = await adminApiFetch(`/torneo/${torneoId}/arbitros`, {
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
      const res = await adminApiFetch(`/torneo/${torneoId}/canchas`, {
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
      setErrorFixture("Asigná al menos un árbitro y una cancha desde las pestañas correspondientes.");
      return;
    }

    setLoadingFixture(true);
    try {
      const res = await adminApiFetch(`/torneo/${torneoId}/generar-fixture`, {
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
      const resTorneo = await adminApiFetch(`/torneo/${torneoId}`);
      const dTorneo = await resTorneo.json();
      if (resTorneo.ok) setTorneo(dTorneo.data);
    } catch (e) {
      setErrorFixture(e.message);
    } finally {
      setLoadingFixture(false);
    }
  }

  if (!admin) return null;

  if (pageLoading) return (
    <div className="layout">
      <AdminHeader admin={admin} onLogout={() => { localStorage.removeItem("admin"); navigate("/admin"); }} />
      <main className="ie-page-status">Cargando...</main>
    </div>
  );

  if (pageError) return (
    <div className="layout">
      <AdminHeader admin={admin} onLogout={() => { localStorage.removeItem("admin"); navigate("/admin"); }} />
      <main className="ie-page-status ie-page-status-error">{pageError}</main>
    </div>
  );

  const totalInscriptos = torneo?.participaciones?.length ?? inscriptos.size;
  const cuposRestantes = torneo ? (torneo.cantidadEquipos - totalInscriptos) : "—";
  const categoriaLabel = LABEL_CATEGORIA[torneo?.categoria] ?? torneo?.categoria ?? "—";
  // Antes usaba torneo?.estado === "en_curso" — un torneo puede llegar a
  // en_curso sin tener partidos (ver validación agregada en update() del
  // backend), así que la única fuente confiable es si hay Partidos de verdad.
  const fixtureYaGenerado = partidos.length > 0;

  return (
    <div className="layout">
      <AdminHeader
        admin={admin}
        onLogout={() => { localStorage.removeItem("admin"); localStorage.removeItem("adminToken"); navigate("/admin"); }}
      />

      <PageShell bare>
        {/* Hero */}
        <PageHero
          layout="left"
          background="surface"
          flush
          icon={<FiUsers />}
          title="Inscribir Equipos"
          subtitle={
            <>
              {torneo?.nombreTorneo} — solo se muestran equipos de la categoría{" "}
              <strong>{categoriaLabel}</strong>.
            </>
          }
        >
          <div className="ie-hero-meta">
            <div className="ie-meta-chip">Categoría: <span>{categoriaLabel}</span></div>
            <div className="ie-meta-chip">Formato: <span>{torneo?.formato === "idayvuelta" ? "Ida y vuelta" : "Solo ida"}</span></div>
            <div className="ie-meta-chip">Inscriptos: <span>{totalInscriptos}/{torneo?.cantidadEquipos ?? "—"}</span></div>
            <div className="ie-meta-chip">Estado: <span>{torneo?.estado}</span></div>
          </div>

        <section className="ie-main">
          {/* ── Panel principal (tabs) ───────────────────────────────────── */}
          <div className="ie-panel">
            <div className="ie-tabs">
              {[
                { key: "equipos", label: "Equipos" },
                { key: "arbitros", label: "Árbitros" },
                { key: "canchas", label: "Canchas" },
                { key: "partidos", label: "Partidos" },
              ].map((t) => (
                <button
                  key={t.key}
                  type="button"
                  className={`ie-tab${tabActiva === t.key ? " active" : ""}`}
                  onClick={() => setTabActiva(t.key)}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {tabActiva === "equipos" && (
              <>
            <div className="ie-panel-header">
              <div>
                <h2>Equipos disponibles</h2>
                <p>Seleccioná los que querés inscribir en este torneo</p>
              </div>
              <span className="ie-badge-count">{seleccionados.size} seleccionado(s)</span>
            </div>

            <TextField
              icon={<FiSearch />}
              placeholder="Buscar equipo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            {equiposFiltrados.length === 0 && (
              <p className="ie-list-empty">
                No hay equipos de categoría <strong>{categoriaLabel}</strong> disponibles.
              </p>
            )}

            <div className="ie-list">
              {equiposFiltrados.map((equipo) => {
                const yaInscripto = inscriptos.has(equipo.id);
                const seleccionado = seleccionados.has(equipo.id);
                return (
                  <div
                    key={equipo.id}
                    className={`ie-equipo-row${yaInscripto ? " inscripto" : ""}`}
                    onClick={() => toggleEquipo(equipo.id)}
                  >
                    <input
                      type="checkbox"
                      readOnly
                      checked={yaInscripto || seleccionado}
                      disabled={yaInscripto}
                    />
                    {equipo.escudoUrl ? (
                      <img
                        src={`${ASSETS_URL}${equipo.escudoUrl}`}
                        alt={`Escudo de ${equipo.nombreEquipo}`}
                        className="ie-color-dot"
                        style={{ objectFit: "cover" }}
                      />
                    ) : (
                      <div
                        className="ie-color-dot"
                        style={{ backgroundColor: equipo.colorPrimario || "#e5e7eb" }}
                      />
                    )}
                    <div className="ie-equipo-info">
                      <div className="ie-equipo-nombre">{equipo.nombreEquipo}</div>
                      <div className="ie-equipo-sub">
                        {equipo.jugadores?.length ?? 0} jugador(es)
                        {equipo.colorSecundario && ` · ${equipo.colorPrimario}/${equipo.colorSecundario}`}
                      </div>
                    </div>
                    {yaInscripto && (
                      <span className="ie-tag-inscripto">
                        <FiCheck /> Inscripto
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
              </>
            )}

            {tabActiva === "arbitros" && (
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

                <Button
                  className="ie-btn-block"
                  disabled={guardandoArbitros}
                  onClick={handleGuardarArbitros}
                >
                  {guardandoArbitros ? "Guardando..." : "Guardar árbitros"}
                </Button>
              </>
            )}

            {tabActiva === "canchas" && (() => {
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

                  <Button
                    className="ie-btn-block"
                    disabled={guardandoCanchas}
                    onClick={handleGuardarCanchas}
                  >
                    {guardandoCanchas ? "Guardando..." : "Guardar canchas"}
                  </Button>
                </>
              );
            })()}

            {tabActiva === "partidos" && (() => {
              const torneoEnCurso = torneo?.estado === "en_curso";
              return (
              <>
                <div className="ie-panel-header">
                  <div>
                    <h2>Partidos</h2>
                    <p>Cargá el resultado de cada partido jugado</p>
                  </div>
                  <span className="ie-badge-count">{partidos.length} partido(s)</span>
                </div>

                {!torneoEnCurso && partidos.length > 0 && (
                  <Alert variant="warning" className="ie-alert">
                    Solo se pueden cargar resultados mientras el torneo está en curso.
                  </Alert>
                )}
                {errorPartidos && <Alert variant="error" className="ie-alert">{errorPartidos}</Alert>}
                {okPartidos && <Alert variant="success" className="ie-alert">{okPartidos}</Alert>}

                {partidos.length === 0 ? (
                  <p className="ie-list-empty">
                    Todavía no se generó el fixture de este torneo — no hay partidos para cargar resultado.
                  </p>
                ) : (
                  <>
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
                            const aunNoJugado = new Date(p.fecha_partido) > new Date();
                            const bloqueado = !torneoEnCurso || aunNoJugado;
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
                                  <span><FiMapPin /> {p.cancha?.nombre ?? "Sin cancha"}</span>
                                  <span><FiUser /> {p.arbitro ? `${p.arbitro.nombre} ${p.arbitro.apellido}` : "Sin árbitro"}</span>
                                </div>
                                <div className="ie-partido-resultado">
                                  <input
                                    type="number"
                                    min={0}
                                    className="ie-partido-goles"
                                    value={r.goles_local}
                                    disabled={bloqueado}
                                    onChange={(e) => actualizarResultadoLocal(p.id, "goles_local", e.target.value)}
                                    aria-label={`Goles de ${p.local?.equipo?.nombreEquipo ?? "local"}`}
                                  />
                                  <span className="ie-partido-guion">–</span>
                                  <input
                                    type="number"
                                    min={0}
                                    className="ie-partido-goles"
                                    value={r.goles_visitante}
                                    disabled={bloqueado}
                                    onChange={(e) => actualizarResultadoLocal(p.id, "goles_visitante", e.target.value)}
                                    aria-label={`Goles de ${p.visitante?.equipo?.nombreEquipo ?? "visitante"}`}
                                  />
                                  <Button
                                    variant="secondary"
                                    disabled={bloqueado || guardandoResultadoId === p.id}
                                    title={aunNoJugado ? "Este partido todavía no se jugó" : undefined}
                                    onClick={() => handleClickGuardar(p)}
                                  >
                                    {guardandoResultadoId === p.id ? "Guardando..." : "Guardar"}
                                  </Button>
                                </div>
                                {aunNoJugado && <p className="ie-partido-nota">Aún no jugado.</p>}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </>
              );
            })()}
          </div>

          {/* ── Sidebar ────────────────────────────────────────────────── */}
          <div className="ie-sidebar">

            {/* Resumen + botón inscribir */}
            <div className="ie-summary-card">
              <h3>Inscripción</h3>
              <div className="ie-summary-rows">
                {[
                  { label: "Torneo",         value: torneo?.nombreTorneo },
                  { label: "Categoría",      value: categoriaLabel },
                  { label: "Ya inscriptos",  value: totalInscriptos },
                  { label: "Cupos restantes",value: cuposRestantes },
                  { label: "Para inscribir", value: seleccionados.size },
                ].map(({ label, value }) => (
                  <div key={label} className="ie-summary-row">
                    <span className="ie-summary-label">{label}</span>
                    <span className="ie-summary-value">{value ?? "—"}</span>
                  </div>
                ))}
              </div>

              {errorInscripcion && <Alert variant="error" className="ie-alert">{errorInscripcion}</Alert>}
              {okInscripcion && <Alert variant="success" className="ie-alert">{okInscripcion}</Alert>}

              <Button
                className="ie-btn-block"
                disabled={seleccionados.size === 0 || loadingInscripcion}
                onClick={handleInscribir}
              >
                {loadingInscripcion ? "Inscribiendo..." : `Inscribir ${seleccionados.size > 0 ? seleccionados.size : ""} equipo(s)`}
              </Button>

              <Button
                variant="secondary"
                className="ie-btn-block"
                icon={<FiArrowLeft />}
                onClick={() => navigate("/admin/torneos")}
              >
                Volver a mis torneos
              </Button>
            </div>

            {/* Generar fixture */}
            <div className="ie-fixture-card">
              <h3>Generar Fixture</h3>

              {fixtureYaGenerado ? (
                <Alert variant="success">
                  El fixture ya fue generado. El torneo está en curso.
                </Alert>
              ) : (
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
                      Asigná al menos un árbitro y una cancha desde las pestañas "Árbitros" y "Canchas" antes de generar el fixture.
                    </Alert>
                  )}

                  {errorFixture && <Alert variant="error" className="ie-alert">{errorFixture}</Alert>}
                  {okFixture && <Alert variant="success" className="ie-alert">{okFixture}</Alert>}

                  <Button
                    className="ie-btn-block"
                    icon={<FiZap />}
                    disabled={
                      totalInscriptos < 2 ||
                      loadingFixture ||
                      arbitrosTorneoIds.size === 0 ||
                      canchasTorneoIds.size === 0
                    }
                    onClick={handleGenerarFixture}
                  >
                    {loadingFixture
                      ? "Generando..."
                      : totalInscriptos < 2
                      ? "Inscribí al menos 2 equipos"
                      : "Generar fixture"}
                  </Button>
                </>
              )}
            </div>
          </div>
        </section>

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
        </PageHero>
      </PageShell>

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
