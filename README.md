# Gestor de Torneos — Frontend

Interfaz web para la gestión de torneos de fútbol amateur: perfil de jugador, equipos, inscripción a torneos, fixture, resultados y panel de administración. Frontend del TP de Desarrollo de Software (UTN FRRo) — el backend vive en un repositorio aparte, [`backend-TPtorneos`](https://github.com/tomasandino12/backend-TPtorneos).

Documentación completa del proyecto (páginas, sistema de diseño, decisiones técnicas): **[`docs/README.md`](./docs/README.md)**.

## Stack

React 19 + Vite · CSS propio con tokens (`src/styles/tokens.css`) · React Router · Vitest + Testing Library (unitarios) · Playwright (end-to-end).

## Requisitos previos

- Node.js 18 o superior.
- pnpm (`corepack enable` o `npm install -g pnpm`). El proyecto usa `pnpm-lock.yaml` — no instalar con `npm install`.
- El [backend](https://github.com/tomasandino12/backend-TPtorneos) corriendo (local o contra el deploy), para que la app tenga datos reales con los que funcionar.

## Instalación

```bash
pnpm install
cp .env.example .env
```

Completar `.env`:

| Variable | Para qué |
|---|---|
| `VITE_API_URL` | URL base del backend (ej. `http://localhost:3000` en desarrollo, o la URL del backend deployado). |
| `VITE_GOOGLE_CLIENT_ID` | Client ID de Google Cloud, para el botón de "Iniciar sesión con Google" (opcional — si se deja vacío, ese botón no funciona pero el resto de la app sí). |

```bash
pnpm dev
```

Levanta el servidor de desarrollo en `http://localhost:5173`.

## Scripts disponibles

| Comando | Qué hace |
|---|---|
| `pnpm dev` | Servidor de desarrollo con hot reload. |
| `pnpm build` | Build de producción a `dist/`. |
| `pnpm preview` | Sirve el build de producción localmente, para verificarlo antes de deployar. |
| `pnpm lint` | ESLint (config Airbnb). |
| `pnpm typecheck` | Chequeo de tipos de TypeScript (la capa de modelos/API, `src/models/` y `src/utils/api.ts`; las páginas `.jsx` no tienen type-checking). |
| `pnpm test` | Tests unitarios (Vitest + Testing Library). |
| `pnpm test:watch` | Tests unitarios en modo watch. |
| `pnpm test:e2e` | Tests end-to-end (Playwright, usa Microsoft Edge — no hace falta instalar Chromium aparte). Requiere el backend corriendo. |

Evidencia real de una corrida completa de las dos suites (8 tests, 100% en verde): [`docs/evidencia-tests.md`](./docs/evidencia-tests.md).

## Estructura del proyecto

- `src/pages/` — una pantalla por archivo, JSX.
- `src/components/ui/` — sistema de diseño propio (Button, TextField, Modal, Alert, Card, Tabs, PageHero, PageShell, Toast, Sheet, ScrollableTable), con tokens centralizados en `src/styles/tokens.css`.
- `src/models/` — modelos tipados en TypeScript (clases e interfaces) para los datos que van y vuelven de la API.
- `src/utils/api.ts` — cliente único de acceso a la API (`ApiClient`), usado por todas las páginas.

Detalle completo de cada pantalla y de las decisiones de diseño en [`docs/README.md`](./docs/README.md).

## Deploy

Frontend deployado en Vercel: [`frontend-gestortorneos.vercel.app`](https://frontend-gestortorneos.vercel.app/). Backend en Render, conectado a una base MySQL en Aiven.

### Credenciales de prueba

Para evaluar la app deployada, sin necesidad de registrar una cuenta nueva:

| Rol | Email | Contraseña |
|---|---|---|
| Administrador | `adrianperez@gmail.com` | `adrianperez123` |
| Jugador | `julianalvarez@gmail.com` | `julianalvarez123` |

Son cuentas de prueba — no representan personas reales.
