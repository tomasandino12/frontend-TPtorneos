import { z } from "zod";

// Reglas para "Datos de la cancha", compartidas entre CrearCancha.jsx (crear)
// y Canchas.jsx (editar) — antes cada pantalla tenía su propio criterio
// (crear validaba, editar no validaba nada, aunque son los mismos campos).
// Una sola definición: si el día de mañana cambia una regla, cambia para
// las dos pantallas a la vez.
//
// capacidad/precioPorHora usan z.coerce.string() (no z.string() a secas):
// en creación el valor arranca en "" (string, desde defaultValues) y en
// edición viene del backend, donde puede llegar como number — coerce.string()
// normaliza los dos casos a texto ANTES de validar, evitando el mismatch de
// tipos que causó el bug de cantEquipos en CrearTorneo (z.string() rechazando
// un number con el mensaje crudo de zod, "Invalid input: expected string,
// received number"). El caso "vacío" sigue dando el mismo mensaje de
// siempre: se valida con .refine() en vez de z.coerce.number(), porque
// coerce.number() convierte "" en 0, que pasaría un .min(0)/.min(2) sin
// querer (precioPorHora="" tiene que seguir rechazándose igual que hoy).
export const canchaSchema = z.object({
  nombre: z.string().trim().min(1, "El nombre de la cancha es obligatorio."),
  direccion: z.string().trim().min(1, "La dirección es obligatoria."),
  tipoSuperficie: z.string().trim().min(1, "El tipo de superficie es obligatorio."),
  capacidad: z.coerce.string().refine((v) => v !== "" && Number(v) > 0, "La capacidad debe ser mayor a 0."),
  estado: z.string(),
  precioPorHora: z.coerce.string().refine((v) => v !== "" && Number(v) >= 0, "El precio por hora es obligatorio."),
  iluminacion: z.boolean(),
});
