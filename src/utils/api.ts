const API_BASE = import.meta.env.VITE_API_URL as string;

/** Raíz del backend sin `/api` — para armar URLs de archivos servidos como
 * estáticos (ej. escudos de equipo), no de la API. */
export const ASSETS_URL = API_BASE;

type Headers = Record<string, string>;

/**
 * Cliente HTTP centralizado hacia la API del backend.
 *
 * Patrón OO aplicado acá: Facade (concentra en un solo objeto la
 * construcción de headers, el manejo del 401 global, y las 3 formas
 * distintas en que el frontend le pega a la API) + Singleton (una única
 * instancia para toda la app, ver `apiClient` más abajo). Las funciones
 * sueltas que exporta este módulo (`apiFetch`, `adminApiFetch`,
 * `apiFetchFormData`, `getAuthHeaders`) son wrappers finos sobre esa
 * instancia — mantienen exactamente la misma firma que antes, así que
 * ninguna de las ~20 páginas `.jsx` que ya las usan necesita cambiar.
 */
class ApiClient {
  constructor(private readonly baseUrl: string) {}

  private buildUrl(endpoint: string): string {
    return `${this.baseUrl}/api${endpoint}`;
  }

  private authHeaders(tokenKey: string): Headers {
    const token = localStorage.getItem(tokenKey);
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  }

  private handleUnauthorized(res: Response, tokenKeys: string[], redirectTo: string): Response {
    if (res.status === 401) {
      tokenKeys.forEach((key) => localStorage.removeItem(key));
      window.location.href = redirectTo;
    }
    return res;
  }

  /** Llamadas autenticadas como jugador (token en localStorage.token). */
  async fetchAsJugador(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const res = await fetch(this.buildUrl(endpoint), {
      ...options,
      headers: { ...this.authHeaders('token'), ...(options.headers as Headers | undefined) },
    });
    return this.handleUnauthorized(res, ['token'], '/');
  }

  /** Llamadas autenticadas como admin (token en localStorage.adminToken). */
  async fetchAsAdmin(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const res = await fetch(this.buildUrl(endpoint), {
      ...options,
      headers: { ...this.authHeaders('adminToken'), ...(options.headers as Headers | undefined) },
    });
    return this.handleUnauthorized(res, ['adminToken', 'admin'], '/admin');
  }

  /** Subida de archivos como jugador — sin Content-Type explícito, para que
   * el browser arme el boundary de multipart/form-data solo. */
  async fetchFormData(endpoint: string, formData: FormData): Promise<Response> {
    const token = localStorage.getItem('token');
    const res = await fetch(this.buildUrl(endpoint), {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    return this.handleUnauthorized(res, ['token'], '/');
  }

  getJugadorAuthHeaders(): Headers {
    return this.authHeaders('token');
  }
}

/** Instancia única del cliente de API para toda la app (Singleton). */
export const apiClient = new ApiClient(API_BASE);

export function getAuthHeaders(): Headers {
  return apiClient.getJugadorAuthHeaders();
}

export async function apiFetch(endpoint: string, options: RequestInit = {}): Promise<Response> {
  return apiClient.fetchAsJugador(endpoint, options);
}

export async function apiFetchFormData(endpoint: string, formData: FormData): Promise<Response> {
  return apiClient.fetchFormData(endpoint, formData);
}

export async function adminApiFetch(endpoint: string, options: RequestInit = {}): Promise<Response> {
  return apiClient.fetchAsAdmin(endpoint, options);
}
