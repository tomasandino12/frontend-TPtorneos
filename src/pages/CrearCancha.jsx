import "../styles/IndexStyle.css";
import "../styles/MenuAdmin.css";
import "../styles/CrearCancha.css";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiMapPin } from "react-icons/fi";
import AdminHeader from "../components/AdminHeader.jsx";
import { adminApiFetch } from "../utils/api.js";
import { Button, TextField, Card, Alert } from "../components/ui";

export default function CrearCancha() {
  const navigate = useNavigate();
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("admin");
    if (!stored) { navigate("/admin"); return; }
    try { setAdmin(JSON.parse(stored)); }
    catch { navigate("/admin"); }
  }, [navigate]);

  const [form, setForm] = useState({
    nombre: "",
    direccion: "",
    tipoSuperficie: "",
    capacidad: "",
  });

  const upd = (key, val) => setForm((prev) => ({ ...prev, [key]: val }));

  const handleLogout = () => {
    localStorage.removeItem("admin");
    localStorage.removeItem("adminToken");
    navigate("/admin");
  };

  const handleGuardar = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.nombre.trim())         { setError("El nombre de la cancha es obligatorio."); return; }
    if (!form.direccion.trim())      { setError("La dirección es obligatoria."); return; }
    if (!form.tipoSuperficie.trim()) { setError("El tipo de superficie es obligatorio."); return; }
    if (!form.capacidad || Number(form.capacidad) <= 0) { setError("La capacidad debe ser mayor a 0."); return; }

    setLoading(true);
    try {
      const res = await adminApiFetch("/canchas", {
        method: "POST",
        body: JSON.stringify({
          nombre: form.nombre.trim(),
          direccion: form.direccion.trim(),
          tipoSuperficie: form.tipoSuperficie.trim(),
          capacidad: Number(form.capacidad),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error al crear la cancha");

      navigate("/admin/canchas");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (!admin) return null;

  return (
    <div className="layout">
      <AdminHeader admin={admin} onLogout={handleLogout} />

      <main>
        <section className="admin-hero">
          <div className="admin-hero-title">
            <FiMapPin className="admin-hero-icon" />
            <h1>Nueva Cancha</h1>
          </div>
          <p className="admin-hero-subtitle">
            Cargá los datos de la cancha para poder asignarla a los partidos.
          </p>
        </section>

        <section className="cc-main">
          <Card className="cc-form-card">
            <div className="cc-form-header">
              <h2>Datos de la Cancha</h2>
              <p>Información básica del predio</p>
            </div>

            <form className="cc-form-body" onSubmit={handleGuardar}>
              <TextField
                label="Nombre"
                value={form.nombre}
                onChange={(e) => upd("nombre", e.target.value)}
                placeholder="Ej: Cancha Municipal 1"
              />

              <TextField
                label="Dirección"
                value={form.direccion}
                onChange={(e) => upd("direccion", e.target.value)}
                placeholder="Ej: Av. Siempre Viva 123"
              />

              <div className="cc-field-row">
                <TextField
                  label="Tipo de superficie"
                  value={form.tipoSuperficie}
                  onChange={(e) => upd("tipoSuperficie", e.target.value)}
                  placeholder="Ej: Césped sintético"
                />
                <TextField
                  label="Capacidad"
                  type="number"
                  min={0}
                  value={form.capacidad}
                  onChange={(e) => upd("capacidad", e.target.value)}
                  placeholder="Ej: 200"
                />
              </div>

              {error && <Alert variant="error">{error}</Alert>}

              <div className="cc-actions">
                <Button
                  type="button"
                  variant="secondary"
                  disabled={loading}
                  onClick={() => navigate("/admin/canchas")}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Creando..." : "+ Crear Cancha"}
                </Button>
              </div>
            </form>
          </Card>
        </section>
      </main>

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
