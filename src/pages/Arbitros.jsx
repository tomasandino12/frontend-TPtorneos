import "../styles/IndexStyle.css";
import "../styles/MenuAdmin.css";
import "../styles/Arbitros.css";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiFlag, FiSearch, FiEdit2, FiTrash2 } from "react-icons/fi";
import AdminHeader from "../components/AdminHeader.jsx";
import { adminApiFetch } from "../utils/api.js";
import { Button, TextField, Card, Alert, PageShell, PageHero } from "../components/ui";

const FORM_VACIO = { nombre: "", apellido: "", nro_matricula: "", email: "" };

export default function Arbitros() {
  const navigate = useNavigate();
  const [admin, setAdmin] = useState(null);
  const [arbitros, setArbitros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [arbitroEditando, setArbitroEditando] = useState(null);
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
      fetchArbitros();
    } catch {
      navigate("/admin");
    }
  }, [navigate]);

  async function fetchArbitros() {
    try {
      setLoading(true);
      const res = await adminApiFetch("/arbitros");
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error al cargar árbitros");
      setArbitros(data.data || []);
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

  const handleAbrirNuevo = () => {
    setArbitroEditando(null);
    setForm(FORM_VACIO);
    setErrorForm("");
    setMostrarFormulario(true);
  };

  const handleAbrirEditar = (arbitro) => {
    setArbitroEditando(arbitro);
    setForm({
      nombre: arbitro.nombre || "",
      apellido: arbitro.apellido || "",
      nro_matricula: arbitro.nro_matricula || "",
      email: arbitro.email || "",
    });
    setErrorForm("");
    setMostrarFormulario(true);
  };

  const handleCerrarFormulario = () => {
    setMostrarFormulario(false);
    setArbitroEditando(null);
  };

  const handleChangeForm = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleGuardar = async (e) => {
    e.preventDefault();
    setGuardando(true);
    setErrorForm("");

    try {
      const endpoint = arbitroEditando ? `/arbitros/${arbitroEditando.id}` : "/arbitros";
      const method = arbitroEditando ? "PUT" : "POST";
      const res = await adminApiFetch(endpoint, {
        method,
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error al guardar el árbitro");

      if (arbitroEditando) {
        setArbitros((prev) => prev.map((a) => (a.id === arbitroEditando.id ? data.data : a)));
      } else {
        setArbitros((prev) => [...prev, data.data]);
      }

      setMostrarFormulario(false);
      setArbitroEditando(null);
    } catch (err) {
      setErrorForm(err.message);
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminar = async (arbitro) => {
    if (!confirm(`¿Seguro que querés eliminar a ${arbitro.nombre} ${arbitro.apellido}?`)) return;
    try {
      const res = await adminApiFetch(`/arbitros/${arbitro.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Error al eliminar");
      }
      setArbitros((prev) => prev.filter((a) => a.id !== arbitro.id));
    } catch (e) {
      alert(e.message);
    }
  };

  if (!admin) return null;

  const filtrados = arbitros.filter((a) => {
    const texto = `${a.nombre} ${a.apellido} ${a.nro_matricula}`.toLowerCase();
    return texto.includes(search.toLowerCase());
  });

  return (
    <div className="layout">
      <AdminHeader admin={admin} onLogout={handleLogout} />

      <PageShell bare>
        <PageHero
          layout="left"
          icon={<FiFlag />}
          title="Árbitros"
          subtitle="Gestioná el padrón de árbitros disponibles para asignar a los partidos."
        >
        <section className="ar-list">
          <div className="ar-controls">
            <TextField
              icon={<FiSearch />}
              placeholder="Buscar por nombre, apellido o matrícula..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="ar-search"
            />
            <Button onClick={handleAbrirNuevo}>+ Nuevo árbitro</Button>
          </div>

          {loading && <Card className="ar-status-card">Cargando árbitros...</Card>}
          {error && <Card className="ar-status-card ar-status-error">{error}</Card>}

          {!loading && !error && (
            <div className="ar-table-wrap">
              <table className="ar-table">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Apellido</th>
                    <th>Matrícula</th>
                    <th>Email</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filtrados.map((arbitro) => (
                    <tr key={arbitro.id}>
                      <td>{arbitro.nombre}</td>
                      <td>{arbitro.apellido}</td>
                      <td>{arbitro.nro_matricula}</td>
                      <td>{arbitro.email}</td>
                      <td className="ar-table-acciones">
                        <button className="ar-btn-icon" onClick={() => handleAbrirEditar(arbitro)}>
                          <FiEdit2 />
                        </button>
                        <button className="ar-btn-icon ar-btn-icon-danger" onClick={() => handleEliminar(arbitro)}>
                          <FiTrash2 />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filtrados.length === 0 && (
                    <tr>
                      <td colSpan={5} className="ar-table-vacio">
                        No hay árbitros que coincidan con la búsqueda.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
        </PageHero>
      </PageShell>

      {mostrarFormulario && (
        <div className="ar-modal-overlay">
          <form className="ar-modal" onSubmit={handleGuardar}>
            <h3>{arbitroEditando ? "Editar árbitro" : "Nuevo árbitro"}</h3>

            {errorForm && <Alert variant="error">{errorForm}</Alert>}

            <TextField
              label="Nombre"
              name="nombre"
              value={form.nombre}
              onChange={handleChangeForm}
              required
            />
            <TextField
              label="Apellido"
              name="apellido"
              value={form.apellido}
              onChange={handleChangeForm}
              required
            />
            <TextField
              label="Nº de matrícula"
              name="nro_matricula"
              value={form.nro_matricula}
              onChange={handleChangeForm}
              required
            />
            <TextField
              label="Email"
              type="email"
              name="email"
              value={form.email}
              onChange={handleChangeForm}
              required
            />

            <div className="ar-modal-botones">
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
