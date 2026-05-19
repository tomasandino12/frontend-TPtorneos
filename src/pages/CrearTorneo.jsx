import { useState } from "react";
import {
  Trophy, Users, MapPin, Calendar, Shield,
  Save, Eye, Plus, Download, Edit2, X, Check,
} from "lucide-react";

// ── Datos estáticos ────────────────────────────────────────────────────────
const CANCHAS_LIST = [
  "Cancha Central",
  "Cancha 2 Sintética",
  "Cancha Auxiliar",
  "Cancha 4 Techada",
  "Cancha 5",
];

const FORMATOS = ["Solo ida", "Ida y vuelta", "Eliminación directa"];

const TORNEOS_RECIENTES = [
  { id: 1, nombre: "Apertura 2025",  categoria: "Mayores",  equipos: 12, proximaFecha: "22 Jun", estado: "En curso" },
  { id: 2, nombre: "Femenino 2025",  categoria: "Femenino", equipos: 8,  proximaFecha: "23 Jun", estado: "En curso" },
  { id: 3, nombre: "Sub-17 Verano",  categoria: "Sub-17",   equipos: 10, proximaFecha: "—",      estado: "Cerrado" },
];

// ── Helpers ────────────────────────────────────────────────────────────────
function calcularPartidos(n, formato) {
  const equipos = Math.max(0, parseInt(n) || 0);
  if (equipos < 2) return 0;
  if (formato === "Solo ida")          return (equipos * (equipos - 1)) / 2;
  if (formato === "Ida y vuelta")      return equipos * (equipos - 1);
  if (formato === "Eliminación directa") return equipos - 1;
  return 0;
}

// ── Componentes pequeños ───────────────────────────────────────────────────

function Toggle({ value, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none ${
        value ? "bg-green-700" : "bg-gray-300"
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
          value ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

function StatCard({ label, value, icon, bg }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center gap-4">
      <div className={`${bg} rounded-lg p-2.5`}>{icon}</div>
      <div>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
        <p className="text-xs text-gray-500">{label}</p>
      </div>
    </div>
  );
}

// ── Pantalla principal ─────────────────────────────────────────────────────

export default function CrearTorneo() {
  const [form, setForm] = useState({
    nombre:          "",
    fechaInicio:     "",
    tipo:            "Liga",
    categoria:       "Mayores",
    cantEquipos:     8,
    formato:         "Solo ida",
    canchas:         ["Cancha Central", "Cancha 2 Sintética"],
    puntosVictoria:  3,
    puntosEmpate:    1,
    puntosDerrota:   0,
    permitirDescarga: false,
    generarFixture:  true,
    estado:          "Borrador",
  });

  const [showModal, setShowModal] = useState(false);

  const update = (key, val) => setForm((prev) => ({ ...prev, [key]: val }));

  const toggleCancha = (c) =>
    update(
      "canchas",
      form.canchas.includes(c)
        ? form.canchas.filter((x) => x !== c)
        : [...form.canchas, c]
    );

  const partidosEstimados = calcularPartidos(form.cantEquipos, form.formato);

  const handleConfirmar = () => {
    setShowModal(false);
    // TODO: POST /api/torneos
    // await fetch("/api/torneos", {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify(form),
    // });
    alert("¡Torneo creado correctamente!");
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">

      {/* ── HEADER ────────────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-4 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-2 font-bold text-green-800 text-lg">
          <Trophy size={20} />
          Gestor de Torneos
          <span className="ml-1 text-xs font-bold bg-green-800 text-white px-2 py-0.5 rounded-full tracking-wide">
            ADMIN
          </span>
        </div>

        <nav className="flex items-center gap-1 flex-1 justify-center">
          {[
            { icon: <Trophy size={16} />,  label: "Torneos"   },
            { icon: <Shield size={16} />,  label: "Árbitros"  },
            { icon: <MapPin size={16} />,  label: "Canchas"   },
            { icon: <Users size={16} />,   label: "Jugadores" },
          ].map(({ icon, label }) => (
            <button
              key={label}
              className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-green-800 hover:bg-green-50 px-3 py-2 rounded-lg transition-colors"
            >
              {icon} {label}
            </button>
          ))}
        </nav>

        <div className="w-9 h-9 rounded-full bg-green-800 text-white flex items-center justify-center text-sm font-bold select-none">
          MR
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-6">

        {/* ── STAT CARDS ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard label="Torneos activos"     value={3}  bg="bg-green-50"  icon={<Trophy   size={20} className="text-green-700"  />} />
          <StatCard label="Equipos inscriptos"  value={36} bg="bg-blue-50"   icon={<Users    size={20} className="text-blue-600"   />} />
          <StatCard label="Canchas disponibles" value={4}  bg="bg-orange-50" icon={<MapPin   size={20} className="text-orange-500" />} />
          <StatCard label="Partidos esta semana" value={14} bg="bg-purple-50" icon={<Calendar size={20} className="text-purple-600" />} />
        </div>

        {/* ── MAIN: FORMULARIO + RESUMEN ──────────────────────────────────── */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">

          {/* ── FORMULARIO (60%) ────────────────────────────────────────── */}
          <div className="flex-[3] bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-gray-800">Datos del Torneo</h2>
              <button
                type="button"
                onClick={() => update("estado", form.estado === "Borrador" ? "Activo" : "Borrador")}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
                  form.estado === "Activo"
                    ? "bg-green-100 text-green-800 border-green-300"
                    : "bg-gray-100 text-gray-500 border-gray-300"
                }`}
              >
                {form.estado}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Nombre */}
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del torneo
                </label>
                <input
                  type="text"
                  value={form.nombre}
                  onChange={(e) => update("nombre", e.target.value)}
                  placeholder="Ej: Apertura 2025"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-700 focus:border-transparent transition"
                />
              </div>

              {/* Fecha */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha de inicio
                </label>
                <input
                  type="date"
                  value={form.fechaInicio}
                  onChange={(e) => update("fechaInicio", e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-700 transition"
                />
              </div>

              {/* Tipo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de torneo
                </label>
                <select
                  value={form.tipo}
                  onChange={(e) => update("tipo", e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-700 transition"
                >
                  <option>Liga</option>
                  <option>Eliminación directa</option>
                </select>
              </div>

              {/* Categoría */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categoría
                </label>
                <select
                  value={form.categoria}
                  onChange={(e) => update("categoria", e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-700 transition"
                >
                  {["Mayores", "Sub-17", "Sub-15", "Sub-13", "Femenino", "Mixto"].map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Cantidad de equipos */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cantidad de equipos
                </label>
                <input
                  type="number"
                  min={2}
                  max={64}
                  value={form.cantEquipos}
                  onChange={(e) => update("cantEquipos", e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-700 transition"
                />
              </div>
            </div>

            {/* Formato de juego */}
            <div className="mt-5">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Formato de juego
              </label>
              <div className="flex gap-2">
                {FORMATOS.map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => update("formato", f)}
                    className={`flex-1 py-2 text-sm font-medium rounded-lg border transition-colors ${
                      form.formato === f
                        ? "bg-green-800 text-white border-green-800"
                        : "bg-white text-gray-600 border-gray-200 hover:border-green-500"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Canchas habilitadas */}
            <div className="mt-5">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Canchas habilitadas
              </label>
              <div className="flex flex-wrap gap-2">
                {CANCHAS_LIST.map((c) => {
                  const active = form.canchas.includes(c);
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => toggleCancha(c)}
                      className={`px-3 py-1.5 text-sm rounded-full border font-medium transition-colors ${
                        active
                          ? "bg-green-100 text-green-800 border-green-400"
                          : "bg-gray-50 text-gray-500 border-gray-200 hover:border-gray-400"
                      }`}
                    >
                      {c}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Puntos por resultado */}
            <div className="mt-5">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Puntos por resultado
              </label>
              <div className="flex gap-3">
                {[
                  { key: "puntosVictoria", label: "Victoria" },
                  { key: "puntosEmpate",   label: "Empate"   },
                  { key: "puntosDerrota",  label: "Derrota"  },
                ].map(({ key, label }) => (
                  <div key={key} className="flex-1">
                    <label className="block text-xs text-gray-400 mb-1 text-center">
                      {label}
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={10}
                      value={form[key]}
                      onChange={(e) => update(key, parseInt(e.target.value) || 0)}
                      className="w-full border border-gray-200 rounded-lg px-2 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-green-700 transition"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Toggles */}
            <div className="mt-5 space-y-2">
              {[
                {
                  key:   "permitirDescarga",
                  label: "Permitir descargar planteles",
                  desc:  "Los usuarios pueden exportar listas de jugadores",
                },
                {
                  key:   "generarFixture",
                  label: "Generar fixture automático",
                  desc:  "Se creará el calendario de partidos al confirmar",
                },
              ].map(({ key, label, desc }) => (
                <div
                  key={key}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-700">{label}</p>
                    <p className="text-xs text-gray-400">{desc}</p>
                  </div>
                  <Toggle value={form[key]} onChange={(v) => update(key, v)} />
                </div>
              ))}
            </div>

            {/* Botones de acción */}
            <div className="mt-6 flex flex-wrap gap-2">
              <button
                type="button"
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Save size={14} /> Guardar borrador
              </button>
              <button
                type="button"
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Eye size={14} /> Vista previa
              </button>
              <button
                type="button"
                onClick={() => setShowModal(true)}
                className="flex items-center gap-1.5 px-5 py-2 text-sm font-semibold bg-green-800 text-white rounded-lg hover:bg-green-700 transition-colors ml-auto"
              >
                <Plus size={14} /> Crear Torneo
              </button>
            </div>
          </div>

          {/* ── PANEL RESUMEN (40%) ──────────────────────────────────────── */}
          <div className="flex-[2] bg-white rounded-2xl shadow-sm border border-gray-100 p-6 lg:sticky lg:top-20">
            <h3 className="text-base font-bold text-gray-800 mb-4">Resumen</h3>

            <div className="space-y-0.5 text-sm">
              {[
                { label: "Nombre",            value: form.nombre || "—" },
                { label: "Tipo",              value: form.tipo },
                { label: "Categoría",         value: form.categoria },
                { label: "Equipos",           value: form.cantEquipos },
                { label: "Formato",           value: form.formato },
                { label: "Canchas habilitadas", value: `${form.canchas.length} de ${CANCHAS_LIST.length}` },
                { label: "Fecha de inicio",   value: form.fechaInicio || "—" },
                { label: "Partidos estimados", value: partidosEstimados },
                { label: "Puntos V / E / D",  value: `${form.puntosVictoria} / ${form.puntosEmpate} / ${form.puntosDerrota}` },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  className="flex justify-between items-center py-2.5 border-b border-gray-50 last:border-0"
                >
                  <span className="text-gray-400">{label}</span>
                  <span className="font-semibold text-gray-800 text-right max-w-[55%] truncate">
                    {String(value)}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-4 bg-green-50 border border-green-100 rounded-xl p-3 text-xs text-green-800 leading-relaxed">
              Se generarán <strong>{partidosEstimados} partido(s)</strong> distribuidos en{" "}
              <strong>{form.canchas.length} cancha(s)</strong> habilitada(s).
            </div>
          </div>
        </div>

        {/* ── TORNEOS RECIENTES ────────────────────────────────────────────── */}
        <div className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-gray-800">Torneos recientes</h3>
            <button
              type="button"
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-green-800 border border-gray-200 hover:border-green-400 rounded-lg px-3 py-1.5 transition-colors"
            >
              <Download size={14} /> Exportar
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-400 text-xs uppercase tracking-wide border-b border-gray-100">
                  {["Torneo", "Categoría", "Equipos", "Próxima Fecha", "Estado", "Acción"].map((h) => (
                    <th key={h} className="pb-3 font-semibold pr-4">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TORNEOS_RECIENTES.map((t) => (
                  <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="py-3 pr-4 font-medium text-gray-800">{t.nombre}</td>
                    <td className="py-3 pr-4 text-gray-500">{t.categoria}</td>
                    <td className="py-3 pr-4 text-gray-500">{t.equipos}</td>
                    <td className="py-3 pr-4 text-gray-500">{t.proximaFecha}</td>
                    <td className="py-3 pr-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                          t.estado === "En curso"
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {t.estado}
                      </span>
                    </td>
                    <td className="py-3">
                      <button
                        type="button"
                        className="flex items-center gap-1 text-xs text-gray-600 hover:text-green-800 border border-gray-200 hover:border-green-400 rounded-lg px-2.5 py-1.5 transition-colors"
                      >
                        <Edit2 size={11} /> Editar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── MODAL DE CONFIRMACIÓN ────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800">Confirmar creación</h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <p className="text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-xl p-3 mb-4 leading-relaxed">
              Vas a generar <strong>{partidosEstimados} partidos</strong> distribuidos en{" "}
              <strong>{form.canchas.length} cancha(s)</strong>. Revisá la disponibilidad
              antes de confirmar.
            </p>

            <div className="space-y-2 text-sm mb-5 border border-gray-100 rounded-xl p-4 bg-gray-50">
              {[
                { label: "Torneo",    val: form.nombre || "Sin nombre"   },
                { label: "Tipo",      val: form.tipo                      },
                { label: "Categoría", val: form.categoria                 },
                { label: "Equipos",   val: form.cantEquipos               },
                { label: "Formato",   val: form.formato                   },
                { label: "Inicio",    val: form.fechaInicio || "Sin fecha" },
              ].map(({ label, val }) => (
                <div key={label} className="flex justify-between">
                  <span className="text-gray-400">{label}</span>
                  <span className="font-medium text-gray-800">{String(val)}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="flex-1 py-2 text-sm font-medium border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmar}
                className="flex-1 py-2 text-sm font-semibold bg-green-800 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
              >
                <Check size={14} /> Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
