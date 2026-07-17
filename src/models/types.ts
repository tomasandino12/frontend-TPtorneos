/**
 * Interfaces de los modelos de dominio que devuelve la API del backend
 * (Gestor de Torneos), tal como llegan en el JSON de cada response — reflejan
 * los campos reales de las entidades en `backend/src/*​/*.entity.ts`.
 *
 * Estas interfaces son las que hoy no tienen equivalente en clase (a
 * diferencia de Jugador y Equipo, ver Jugador.ts / Equipo.ts) porque el
 * frontend solo las lee, sin comportamiento propio que representar.
 */

export interface TorneoDTO {
  id?: number;
  nombreTorneo: string;
  fechaInicio: string;
  fechaFin: string;
  /** 'borrador' | 'inscripcion' | 'en_curso' | 'finalizado' */
  estado: string;
  /** 'ida' | 'idayvuelta' */
  formato: string;
  cantidadEquipos: number;
  categoria: string;
  adminTorneo?: { id?: number; nombre?: string; apellido?: string };
}

export interface CanchaDTO {
  id?: number;
  nombre: string;
  direccion: string;
  tipoSuperficie: string;
  capacidad: number;
  /** 'activa' | 'mantenimiento' | 'inactiva' */
  estado: string;
  precioPorHora: number;
  iluminacion: boolean;
}

export interface ArbitroDTO {
  id?: number;
  nombre: string;
  apellido: string;
  nro_matricula: string;
  email: string;
}

export interface ParticipacionDTO {
  id?: number;
  equipo: { id?: number; nombreEquipo?: string };
  torneo: TorneoDTO | number;
  fecha_inscripcion: string;
}

export interface PartidoDTO {
  id?: number;
  fecha_partido: string;
  hora_partido: string;
  /** 'programado' | 'finalizado' */
  estado_partido: string;
  jornada: number;
  goles_local: number | null;
  goles_visitante: number | null;
  torneo?: TorneoDTO | number;
  cancha?: CanchaDTO;
  arbitro?: ArbitroDTO;
  local: ParticipacionDTO;
  visitante: ParticipacionDTO;
}

export interface NotificacionDTO {
  id?: number;
  tipo: string;
  mensaje: string;
  torneo?: { id?: number; nombreTorneo?: string };
  leida: boolean;
  fecha: string;
}

export interface InvitacionDTO {
  id?: number;
  jugador: { id?: number; nombre?: string; apellido?: string };
  equipo: { id?: number; nombreEquipo?: string };
  capitanEmisor: { id?: number; nombre?: string; apellido?: string };
  /** 'pendiente' | 'aceptada' | 'rechazada' */
  estado: string;
  fechaEnvio: string;
  fechaRespuesta?: string;
  vistaPorCapitan: boolean;
}

/** Forma genérica de las respuestas `{ message, data }` que devuelve toda la API. */
export interface ApiResponse<T> {
  message: string;
  data: T;
}
