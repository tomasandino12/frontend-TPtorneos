import "../styles/IndexStyle.css";
import "../styles/MenuAdmin.css";
import "../styles/Canchas.css";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiMapPin, FiSearch, FiPlus, FiEdit2, FiTrash2 } from "react-icons/fi";
import AdminHeader from "../components/AdminHeader.jsx";
import { adminApiFetch } from "../utils/api.js";
import { Button, TextField, Card, Alert } from "../components/ui";

const FORM_VACIO = { nombre: "", direccion: "", tipoSuperficie: "", capacidad: "" };

export default function Canchas() {
  const navigate = useNavigate();
  const [admin, setAdmin] = useState(null);
  const [canchas, setCanchas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [canchaEditando, setCanchaEditando] = useState(null);
  const [form, setForm] = useState(FORM_VACIO);
  const [guardando, setGuardando] = useState(false);
  const [errorForm, setErrorForm] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("admin");
    if (!stored) {
      navigate("/admin");
      return;
    }
    try {
      setAdmin(JSON.parse(stored));
      fetchCanchas();
    } catch {
      navigate("/admin");
    }
  }, [navigate]);

  async function fetchCanchas() {
    try {
      setLoading(true);
      const res = await adminApiFetch("/canchas");
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error al cargar canchas");
      setCanchas(data.data || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("admin");
    localStorage.removeItem("adminToken");
    navigate("/admin");
  };

  const handleAbrirEditar = (cancha) => {
    setCanchaEditando(cancha);
    setForm({
      nombre: cancha.nombre || "",
      direccion: cancha.direccion || "",
      tipoSuperficie: cancha.tipoSuperficie || "",
      capacidad: cancha.capacidad ?? "",
    });
    setErrorForm("");
    setMostrarFormulario(true);
  };

  const handleCerrarFormulario = () => {
    setMostrarFormulario(false);
    setCanchaEditando(null);
  };

  const handleChangeForm = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleGuardar = async (e) => {
    e.preventDefault();
    setGuardando(true);
    setErrorForm("");

    try {
      const res = await adminApiFetch(`/canchas/${canchaEditando.id}`, {
        method: "PUT",
        body: JSON.stringify({ ...form, capacidad: Number(form.capacidad) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error al guardar la cancha");

      setCanchas((prev) => prev.map((c) => (c.id === canchaEditando.id ? data.data : c)));
      setMostrarFormulario(false);
      setCanchaEditando(null);
    } catch (err) {
      setErrorForm(err.message);
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminar = async (cancha) => {
    if (!confirm(`¿Seguro que querés eliminar la cancha "${cancha.nombre}"?`)) return;
    try {
      const res = await adminApiFetch(`/canchas/${cancha.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Error al eliminar");
      }
      setCanchas((prev) => prev.filter((c) => c.id !== cancha.id));
    } catch (e) {
      alert(e.message);
    }
  };

  if (!admin) return null;

  const filtradas = canchas.filter((c) => {
    const texto = `${c.nombre} ${c.direccion} ${c.tipoSuperficie}`.toLowerCase();
    return texto.includes(search.toLowerCase());
  });

  return (
    <div className="layout">
      <AdminHeader admin={admin} onLogout={handleLogout} />

      <main>
        <section className="admin-hero">
          <div className="admin-hero-title">
            <FiMapPin className="admin-hero-icon" />
            <h1>Canchas</h1>
          </div>
          <p className="admin-hero-subtitle">
            Gestioná las canchas disponibles para asignar a los partidos.
          </p>
        </section>

        <section className="cn-list">
          <div className="cn-controls">
            <TextField
              icon={<FiSearch />}
              placeholder="Buscar por nombre, dirección o superficie..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="cn-search"
            />
            <Button icon={<FiPlus />} onClick={() => navigate("/admin/canchas/nueva")}>
              Nueva cancha
            </Button>
          </div>

          {loading && <Card className="cn-status-card">Cargando canchas...</Card>}
          {error && <Card className="cn-status-card cn-status-error">{error}</Card>}

          {!loading && !error && (
            <div className="cn-table-wrap">
              <table className="cn-table">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Dirección</th>
                    <th>Superficie</th>
                    <th>Capacidad</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filtradas.map((cancha) => (
                    <tr key={cancha.id}>
                      <td>{cancha.nombre}</td>
                      <td>{cancha.direccion}</td>
                      <td>{cancha.tipoSuperficie}</td>
                      <td>{cancha.capacidad}</td>
                      <td className="cn-table-acciones">
                        <button className="cn-btn-icon" onClick={() => handleAbrirEditar(cancha)}>
                          <FiEdit2 />
                        </button>
                        <button className="cn-btn-icon cn-btn-icon-danger" onClick={() => handleEliminar(cancha)}>
                          <FiTrash2 />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filtradas.length === 0 && (
                    <tr>
                      <td colSpan={5} className="cn-table-vacio">
                        No hay canchas que coincidan con la búsqueda.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      {mostrarFormulario && (
        <div className="cn-modal-overlay">
          <form className="cn-modal" onSubmit={handleGuardar}>
            <h3>Editar cancha</h3>

            {errorForm && <Alert variant="error">{errorForm}</Alert>}

            <TextField
              label="Nombre"
              name="nombre"
              value={form.nombre}
              onChange={handleChangeForm}
              required
            />
            <TextField
              label="Dirección"
              name="direccion"
              value={form.direccion}
              onChange={handleChangeForm}
              required
            />
            <TextField
              label="Tipo de superficie"
              name="tipoSuperficie"
              value={form.tipoSuperficie}
              onChange={handleChangeForm}
              required
            />
            <TextField
              label="Capacidad"
              type="number"
              name="capacidad"
              min={0}
              value={form.capacidad}
              onChange={handleChangeForm}
              required
            />

            <div className="cn-modal-botones">
              <Button type="button" variant="secondary" onClick={handleCerrarFormulario} disabled={guardando}>
                Cancelar
              </Button>
              <Button type="submit" disabled={guardando}>
                {guardando ? "Guardando..." : "Guardar"}
              </Button>
            </div>
          </form>
        </div>
      )}

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
