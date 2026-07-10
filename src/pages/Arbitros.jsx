import "../styles/IndexStyle.css";
import "../styles/MenuAdmin.css";
import "../styles/Arbitros.css";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminHeader from "../components/AdminHeader.jsx";
import { adminApiFetch } from "../utils/api.js";

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

      <main style={{ backgroundColor: "#f9fafb" }}>
        <section className="ar-hero">
          <div className="ar-hero-title">
            <i className="bx bx-whistle ar-whistle-icon"></i>
            <h1>Árbitros</h1>
          </div>
          <p className="ar-hero-subtitle">
            Gestioná el padrón de árbitros disponibles para asignar a los partidos.
          </p>
        </section>

        <section className="ar-list">
          <div className="ar-controls">
            <div className="ar-search">
              <i className="bx bx-search"></i>
              <input
                type="text"
                placeholder="Buscar por nombre, apellido o matrícula..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button className="ar-btn-new" onClick={handleAbrirNuevo}>
              + Nuevo árbitro
            </button>
          </div>

          {loading && <p style={{ padding: "2rem", textAlign: "center", color: "#6b7280" }}>Cargando árbitros...</p>}
          {error && <p style={{ padding: "2rem", textAlign: "center", color: "#dc2626" }}>{error}</p>}

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
                          <i className="bx bx-edit"></i>
                        </button>
                        <button className="ar-btn-icon ar-btn-icon-danger" onClick={() => handleEliminar(arbitro)}>
                          <i className="bx bx-trash"></i>
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
      </main>

      {mostrarFormulario && (
        <div className="ar-modal-overlay">
          <form className="ar-modal" onSubmit={handleGuardar}>
            <h3>{arbitroEditando ? "Editar árbitro" : "Nuevo árbitro"}</h3>

            {errorForm && <p className="ar-modal-error">{errorForm}</p>}

            <label>Nombre</label>
            <input type="text" name="nombre" value={form.nombre} onChange={handleChangeForm} required />

            <label>Apellido</label>
            <input type="text" name="apellido" value={form.apellido} onChange={handleChangeForm} required />

            <label>Nº de matrícula</label>
            <input type="text" name="nro_matricula" value={form.nro_matricula} onChange={handleChangeForm} required />

            <label>Email</label>
            <input type="email" name="email" value={form.email} onChange={handleChangeForm} required />

            <div className="ar-modal-botones">
              <button type="button" onClick={handleCerrarFormulario} disabled={guardando}>
                Cancelar
              </button>
              <button type="submit" disabled={guardando}>
                {guardando ? "Guardando..." : "Guardar"}
              </button>
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
