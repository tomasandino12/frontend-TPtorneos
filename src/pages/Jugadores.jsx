import "../styles/IndexStyle.css";
import "../styles/MenuAdmin.css";
import "../styles/Jugadores.css";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiUsers, FiSearch } from "react-icons/fi";
import AdminHeader from "../components/AdminHeader.jsx";
import { adminApiFetch } from "../utils/api.js";
import { Card, TextField, PageShell, PageHero } from "../components/ui";

const MIN_CARACTERES_BUSQUEDA = 3;
const MAX_BUSQUEDAS_RECIENTES = 6;

function recientesKey(adminId) {
  return `jugadoresBusquedasRecientes_${adminId}`;
}

export default function Jugadores() {
  const navigate = useNavigate();
  const [admin, setAdmin] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [recientes, setRecientes] = useState([]);

  // El plantel completo del admin se trae una sola vez, recién cuando el
  // usuario empieza a buscar (no al montar la pantalla) — el filtrado en sí
  // es client-side sobre este cache, así que escribir no vuelve a pegarle
  // al backend en cada tecla.
  const [todosLosJugadores, setTodosLosJugadores] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const fetchedRef = useRef(false);

  useEffect(() => {
    const stored = localStorage.getItem("admin");
    if (!stored) {
      navigate("/admin");
      return;
    }
    try {
      const adminData = JSON.parse(stored);
      setAdmin(adminData);
      const guardadas = localStorage.getItem(recientesKey(adminData.id));
      if (guardadas) setRecientes(JSON.parse(guardadas));
    } catch {
      navigate("/admin");
    }
  }, [navigate]);

  const terminoValido = busqueda.trim().length >= MIN_CARACTERES_BUSQUEDA;

  // Carga perezosa: solo se dispara la primera vez que el término llega al
  // mínimo de caracteres. fetchedRef evita repetir el pedido en cada tecla.
  useEffect(() => {
    if (!admin || !terminoValido || fetchedRef.current) return;
    fetchedRef.current = true;

    setCargando(true);
    setError("");
    adminApiFetch(`/jugadores/por-admin/${admin.id}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Error al cargar jugadores");
        setTodosLosJugadores(data.data || []);
      })
      .catch((e) => {
        setError(e.message);
        fetchedRef.current = false; // permitir reintentar en la próxima búsqueda
      })
      .finally(() => setCargando(false));
  }, [admin, terminoValido]);

  // Guarda el término en "búsquedas frecuentes" (localStorage) con un pequeño
  // debounce, para no ensuciar el historial con cada letra tipeada.
  useEffect(() => {
    if (!admin || !terminoValido) return;
    const termino = busqueda.trim();

    const timeoutId = setTimeout(() => {
      setRecientes((prev) => {
        const sinDuplicado = prev.filter((t) => t.toLowerCase() !== termino.toLowerCase());
        const actualizado = [termino, ...sinDuplicado].slice(0, MAX_BUSQUEDAS_RECIENTES);
        localStorage.setItem(recientesKey(admin.id), JSON.stringify(actualizado));
        return actualizado;
      });
    }, 600);

    return () => clearTimeout(timeoutId);
  }, [busqueda, admin, terminoValido]);

  const handleLogout = () => {
    localStorage.removeItem("admin");
    localStorage.removeItem("adminToken");
    navigate("/admin");
  };

  const handleClickReciente = (termino) => setBusqueda(termino);

  if (!admin) return null;

  const filtrados =
    terminoValido && todosLosJugadores
      ? todosLosJugadores.filter((j) => {
          const texto = `${j.nombre} ${j.apellido} ${j.dni} ${j.id}`.toLowerCase();
          return texto.includes(busqueda.trim().toLowerCase());
        })
      : [];

  return (
    <div className="layout">
      <AdminHeader admin={admin} onLogout={handleLogout} />

      <PageShell bare>
        <PageHero
          icon={<FiUsers />}
          title="Jugadores"
          subtitle="Buscá un jugador por nombre, DNI o ID para ver sus datos."
        >
          <div className="jg-search-block">
            <TextField
              icon={<FiSearch />}
              placeholder="Ej: Forlán, 34221110, JG-00187..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="jg-search"
            />
            <div className="jg-search-meta">
              <span className="jg-search-hint">
                Buscá por nombre, DNI o ID · mínimo {MIN_CARACTERES_BUSQUEDA} caracteres
              </span>
              {terminoValido && !cargando && !error && filtrados.length > 0 && (
                <span className="jg-contador">
                  {filtrados.length} {filtrados.length === 1 ? "jugador registrado" : "jugadores registrados"}
                </span>
              )}
            </div>
          </div>
        </PageHero>

        <section className="jg-list">
          {!terminoValido && (
            <div className="jg-empty-state">
              <div className="jg-empty-icon-wrap">
                <FiSearch className="jg-empty-icon" />
              </div>
              <p className="jg-empty-title">Empezá a escribir para buscar</p>
              <p className="jg-empty-sub">
                Ingresá al menos {MIN_CARACTERES_BUSQUEDA} caracteres. Podés combinar nombre y apellido.
              </p>

              {recientes.length > 0 && (
                <div className="jg-recientes">
                  <span className="jg-recientes-label">Búsquedas frecuentes</span>
                  <div className="jg-recientes-chips">
                    {recientes.map((termino) => (
                      <button
                        key={termino}
                        type="button"
                        className="jg-chip"
                        onClick={() => handleClickReciente(termino)}
                      >
                        {termino}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {terminoValido && cargando && <Card className="jg-status-card">Cargando jugadores...</Card>}
          {terminoValido && error && <Card className="jg-status-card jg-status-error">{error}</Card>}

          {terminoValido && !cargando && !error && (
            <div className="jg-table-wrap">
              <table className="jg-table">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Apellido</th>
                    <th>DNI</th>
                    <th>Equipo</th>
                  </tr>
                </thead>
                <tbody>
                  {filtrados.map((jugador) => (
                    <tr key={jugador.id}>
                      <td>{jugador.nombre}</td>
                      <td>{jugador.apellido}</td>
                      <td>{jugador.dni}</td>
                      <td>{jugador.equipo?.nombreEquipo || "—"}</td>
                    </tr>
                  ))}
                  {filtrados.length === 0 && (
                    <tr>
                      <td colSpan={4} className="jg-table-vacio">
                        No hay jugadores que coincidan con la búsqueda.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
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
