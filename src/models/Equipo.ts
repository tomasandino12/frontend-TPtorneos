import type { JugadorDTO } from './Jugador.js';
import type { ParticipacionDTO } from './types.js';

/** Subconjunto de campos de Equipo usado como referencia dentro de otros
 * modelos (ej. `Jugador.equipo`) para evitar un ciclo de import circular
 * completo entre las dos clases — mismo problema que resuelve el backend
 * importando entidades con `import type` (ver arbitro.entity.ts). */
export interface EquipoRef {
  id?: number;
  nombreEquipo: string;
  colorPrimario?: string;
  escudoUrl?: string;
}

/** Forma cruda del equipo tal como llega en el JSON de la API
 * (`backend/src/equipo/equipo.entity.ts`). */
export interface EquipoDTO extends EquipoRef {
  colorSecundario?: string;
  categoria: string;
  descripcion?: string;
  jugadores?: JugadorDTO[];
  participaciones?: ParticipacionDTO[];
}

/** Modelo de dominio del equipo. */
export class Equipo implements EquipoDTO {
  id?: number;
  nombreEquipo: string;
  colorPrimario?: string;
  colorSecundario?: string;
  categoria: string;
  descripcion?: string;
  escudoUrl?: string;
  jugadores?: JugadorDTO[];
  participaciones?: ParticipacionDTO[];

  constructor(data: EquipoDTO) {
    this.id = data.id;
    this.nombreEquipo = data.nombreEquipo;
    this.colorPrimario = data.colorPrimario;
    this.colorSecundario = data.colorSecundario;
    this.categoria = data.categoria;
    this.descripcion = data.descripcion;
    this.escudoUrl = data.escudoUrl;
    this.jugadores = data.jugadores;
    this.participaciones = data.participaciones;
  }

  tieneEscudo(): boolean {
    return !!this.escudoUrl;
  }

  /** URL absoluta del escudo, lista para usar en un <img src>, o null si el
   * equipo todavía no subió uno. `assetsBase` es la raíz del backend sin
   * `/api` (ver ASSETS_URL en utils/api.ts). */
  escudoUrlCompleta(assetsBase: string): string | null {
    return this.escudoUrl ? `${assetsBase}${this.escudoUrl}` : null;
  }

  capitan(): JugadorDTO | undefined {
    return this.jugadores?.find((j) => j.esCapitan);
  }
}
