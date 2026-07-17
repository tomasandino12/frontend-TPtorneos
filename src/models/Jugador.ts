import type { EquipoRef } from './Equipo.js';

/** Forma cruda del jugador tal como llega en el JSON de la API
 * (`backend/src/jugador/jugador.entity.ts`, sin el campo `contraseña`, que el
 * backend nunca serializa). */
export interface JugadorDTO {
  id?: number;
  nombre: string;
  apellido: string;
  dni: string;
  email: string;
  fechaNacimiento: string;
  posicion: string;
  descripcion?: string;
  esCapitan: boolean;
  equipo: EquipoRef | null;
  suspendido?: boolean;
}

/** Modelo de dominio del jugador, con el comportamiento que antes vivía
 * disperso como lógica inline en las páginas (ej. armar "nombre completo",
 * chequear si es capitán de un equipo puntual). Se construye a partir del
 * DTO crudo que devuelve la API. */
export class Jugador implements JugadorDTO {
  id?: number;
  nombre: string;
  apellido: string;
  dni: string;
  email: string;
  fechaNacimiento: string;
  posicion: string;
  descripcion?: string;
  esCapitan: boolean;
  equipo: EquipoRef | null;
  suspendido?: boolean;

  constructor(data: JugadorDTO) {
    this.id = data.id;
    this.nombre = data.nombre;
    this.apellido = data.apellido;
    this.dni = data.dni;
    this.email = data.email;
    this.fechaNacimiento = data.fechaNacimiento;
    this.posicion = data.posicion;
    this.descripcion = data.descripcion;
    this.esCapitan = data.esCapitan;
    this.equipo = data.equipo;
    this.suspendido = data.suspendido;
  }

  get nombreCompleto(): string {
    return `${this.nombre} ${this.apellido}`.trim();
  }

  /** Es capitán del equipo indicado (no de cualquier equipo). */
  esCapitanDe(equipoId: number): boolean {
    return this.esCapitan && this.equipo?.id === equipoId;
  }

  tieneEquipo(): boolean {
    return this.equipo !== null;
  }
}
