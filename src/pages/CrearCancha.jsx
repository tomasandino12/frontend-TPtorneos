import "../styles/IndexStyle.css";
import "../styles/MenuAdmin.css";
import "../styles/CrearCancha.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FiMapPin } from "react-icons/fi";
import { adminApiFetch } from "../utils/api.js";
import { Button, TextField, Card, Alert, PageShell, PageHero } from "../components/ui";
import { canchaSchema } from "../schemas/cancha.js";

const ESTADOS = [
  { value: "activa", label: "Activa" },
  { value: "mantenimiento", label: "En mantenimiento" },
  { value: "inactiva", label: "Inactiva" },
];

export default function CrearCancha() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(canchaSchema),
    defaultValues: {
      nombre: "",
      direccion: "",
      tipoSuperficie: "",
      capacidad: "",
      estado: "activa",
      precioPorHora: "",
      iluminacion: false,
    },
  });

  // Un solo Alert genérico (no por campo), como antes: muestra el primer
  // error en el mismo orden en que se chequeaban los ifs originales.
  const mensajeValidacion =
    errors.nombre?.message
    || errors.direccion?.message
    || errors.tipoSuperficie?.message
    || errors.capacidad?.message
    || errors.precioPorHora?.message;

  const onGuardar = async (values) => {
    setError("");
    setLoading(true);
    try {
      const res = await adminApiFetch("/canchas", {
        method: "POST",
        body: JSON.stringify({
          nombre: values.nombre,
          direccion: values.direccion,
          tipoSuperficie: values.tipoSuperficie,
          capacidad: Number(values.capacidad),
          estado: values.estado,
          precioPorHora: Number(values.precioPorHora),
          iluminacion: values.iluminacion,
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

  return (
    <>
      <PageShell bare>
        <PageHero
          layout="left"
          icon={<FiMapPin />}
          title="Nueva Cancha"
          subtitle="Cargá los datos de la cancha para poder asignarla a los partidos."
        />

        <section className="cc-main">
          <Card className="cc-form-card">
            <div className="cc-form-header">
              <h2>Datos de la Cancha</h2>
              <p>Información básica del predio</p>
            </div>

            <form className="cc-form-body" onSubmit={handleSubmit(onGuardar)} noValidate>
              <TextField
                label="Nombre"
                placeholder="Ej: Cancha Municipal 1"
                {...register("nombre")}
              />

              <TextField
                label="Dirección"
                placeholder="Ej: Av. Siempre Viva 123"
                {...register("direccion")}
              />

              <div className="cc-field-row">
                <TextField
                  label="Tipo de superficie"
                  placeholder="Ej: Césped sintético"
                  {...register("tipoSuperficie")}
                />
                <TextField
                  label="Capacidad"
                  type="number"
                  min={0}
                  placeholder="Ej: 200"
                  {...register("capacidad")}
                />
              </div>

              <div className="cc-field-row">
                <div className="ui-field">
                  <label className="ui-field-label" htmlFor="cc-estado">Estado</label>
                  <div className="ui-field-control">
                    <select
                      id="cc-estado"
                      className="ui-field-input"
                      {...register("estado")}
                    >
                      {ESTADOS.map((e) => (
                        <option key={e.value} value={e.value}>{e.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <TextField
                  label="Precio por hora"
                  type="number"
                  min={0}
                  placeholder="Ej: 15000"
                  {...register("precioPorHora")}
                />
              </div>

              <label className="cc-checkbox-label">
                <input type="checkbox" {...register("iluminacion")} />
                Tiene iluminación
              </label>

              {(error || mensajeValidacion) && <Alert variant="error">{error || mensajeValidacion}</Alert>}

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
      </PageShell>
    </>
  );
}
