import "../styles/IndexStyle.css";
import "../styles/MenuAdmin.css";
import "../styles/InscribirEquipos.css";
import { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FiUsers, FiSearch, FiArrowLeft, FiZap, FiCheck } from "react-icons/fi";
import AdminHeader from "../components/AdminHeader.jsx";
import { adminApiFetch, ASSETS_URL } from "../utils/api.js";
import { Button, TextField, Alert, PageShell, PageHero } from "../components/ui";

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

  // Tabs: 'equipos' | 'arbitros' | 'canchas'
  const [tabActiva, setTabActiva] = useState("equipos");

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
      const [resTorneo, resEquipos, resCanchas, resArbitros, resCanchasTorneo, resArbitrosTorneo] = await Promise.all([
        adminApiFetch(`/torneo/${torneoId}`),
        adminApiFetch("/equipos"),
        adminApiFetch("/canchas"),
        adminApiFetch("/arbitros"),
        adminApiFetch(`/torneo/${torneoId}/canchas`),
        adminApiFetch(`/torneo/${torneoId}/arbitros`),
      ]);

      const [dTorneo, dEquipos, dCanchas, dArbitros, dCanchasTorneo, dArbitrosTorneo] = await Promise.all([
        resTorneo.json(),
        resEquipos.json(),
        resCanchas.json(),
        resArbitros.json(),
        resCanchasTorneo.json(),
        resArbitrosTorneo.json(),
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
      setOkArbitros("Árbitros del torneo actualizados.");
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
      setOkCanchas("Canchas del torneo actualizadas.");
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
  const fixtureYaGenerado = torneo?.estado === "en_curso";

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
        </PageHero>

        <section className="ie-main">
          {/* ── Panel principal (tabs) ───────────────────────────────────── */}
          <div className="ie-panel">
            <div className="ie-tabs">
              {[
                { key: "equipos", label: "Equipos" },
                { key: "arbitros", label: "Árbitros" },
                { key: "canchas", label: "Canchas" },
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

                {errorArbitros && <Alert variant="error" className="ie-alert">{errorArbitros}</Alert>}
                {okArbitros && <Alert variant="success" className="ie-alert">{okArbitros}</Alert>}

                {arbitros.length === 0 ? (
                  <p className="ie-list-empty">No hay árbitros cargados en el sistema.</p>
                ) : (
                  <div className="ie-check-list ie-check-list-tab">
                    {arbitros.map((a) => (
                      <label key={a.id} className="ie-check-item">
                        <input
                          type="checkbox"
                          checked={arbitrosSelec.has(a.id)}
                          onChange={() => toggleArbitro(a.id)}
                        />
                        {a.nombre} {a.apellido}
                      </label>
                    ))}
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

                  {errorCanchas && <Alert variant="error" className="ie-alert">{errorCanchas}</Alert>}
                  {okCanchas && <Alert variant="success" className="ie-alert">{okCanchas}</Alert>}

                  {canchasActivas.length === 0 ? (
                    <p className="ie-list-empty">No hay canchas activas disponibles en el sistema.</p>
                  ) : (
                    <div className="ie-check-list ie-check-list-tab">
                      {canchasActivas.map((c) => (
                        <label key={c.id} className="ie-check-item">
                          <input
                            type="checkbox"
                            checked={canchasSelec.has(c.id)}
                            onChange={() => toggleCancha(c.id)}
                          />
                          {c.nombre}
                        </label>
                      ))}
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
