# Documentación del frontend — Gestor de Torneos

Esta carpeta explica cómo está armado el frontend del proyecto: su arquitectura, su sistema de diseño, cada pantalla, y las decisiones que se tomaron para llegar al estado actual. Está pensada para alguien que no vivió el proceso de migración de UI (5 fases + 2 ajustes puntuales) y necesita entender el código para trabajar sobre él o para explicarlo.

## Índice

- [`sistema-de-diseno.md`](./sistema-de-diseno.md) — los tokens de color/tipografía/espaciado y los componentes reutilizables (`Button`, `TextField`, `Card`, `Alert`, `PageShell`, `PageHero`, `Tabs`, `Modal`, más `Toast`, `Sheet` y `ScrollableTable` sumados en el rediseño mobile), con ejemplos reales de uso.
- [`paginas.md`](./paginas.md) — recorrido por cada pantalla de la app: qué muestra, de qué datos depende, y cómo se relacionan entre sí. Incluye una sección dedicada a explicar por qué "la pantalla de equipo" está repartida en 3 archivos distintos (con su estructura de pestañas Plantel/Historial/Estrategia), y otra para la campanita de notificaciones del `Navbar`.
- [`glosario.md`](./glosario.md) — explicación en criollo de los conceptos técnicos no obvios que aparecen en el código (CSS variables, barrel files, componentes contenedor vs. presentacionales, etc.), cada uno con el ejemplo real de este proyecto.
- [`decisiones.md`](./decisiones.md) — bitácora breve de qué se decidió en cada fase de la migración de UI y por qué.
- [`decisiones-mobile.md`](./decisiones-mobile.md) — decisiones del rediseño mobile (320–767px): navegación jugador/admin, tablas con scroll horizontal, y la lección aprendida de *stacking context* que apareció tres veces. Trabajo independiente del resto de este índice — ver [`auditoria-mobile.md`](./auditoria-mobile.md).
- [`pendientes.md`](./pendientes.md) — lo que quedó sin resolver, con el motivo concreto de cada caso.

También son relevantes, fuera de esta carpeta:
- [`../auditoria-ui.md`](../auditoria-ui.md) — la auditoría original de UI/UX que dio origen a todo el trabajo de las 5 fases (79 hallazgos).
- [`../auditoria-ui-cierre.md`](../auditoria-ui-cierre.md) — el contraste final: qué de esos 79 hallazgos quedó resuelto y qué no.

## Visión general de la arquitectura

### Stack

- **React 19** con **Vite 7** como bundler/dev server (no Create React App).
- **React Router 7** (`react-router-dom`) para el ruteo — todo cliente, no hay server-side rendering.
- **`react-icons`** (familia `Fi`/Feather) para los íconos — es la única librería de íconos del proyecto.
- CSS plano (sin CSS Modules, sin styled-components, sin Tailwind aplicado — hay una dependencia de `tailwindcss`/`@tailwindcss/vite` en `package.json` pero solo se usa su import base en `src/index.css`, no se usan clases utilitarias de Tailwind en ningún componente).
- Gestor de paquetes: **pnpm** (hay un `pnpm-lock.yaml`; no usar `npm install` para no generar un `package-lock.json` en paralelo).

### Cómo correr el proyecto localmente

```bash
pnpm install
pnpm dev       # levanta Vite en modo desarrollo (puerto 5173 por defecto)
pnpm build     # build de producción a dist/
pnpm lint      # eslint sobre todo el proyecto
```

El frontend **necesita el backend corriendo en paralelo** (ver más abajo) para que cualquier pantalla que haga `fetch` funcione — sin backend, vas a ver los estados de error/carga, no datos reales.

### Estructura de carpetas (`src/`)

```
src/
├── main.jsx           # punto de entrada: monta <App/> en el DOM
├── App.jsx             # define todas las rutas (React Router)
├── App.css, index.css   # estilos globales de arranque
├── pages/               # una pantalla = un archivo. Son los componentes que
│                         # App.jsx conecta directamente a una ruta.
├── components/          # componentes compartidos que NO son una pantalla
│   ├── Navbar.jsx        # navbar de las pantallas de jugador (incluye la campanita)
│   ├── NotificationBell.jsx # campanita de notificaciones (ver paginas.md)
│   ├── AdminHeader.jsx   # navbar del panel admin
│   ├── EquipoInfo.jsx    # contenido de "detalle de equipo" (ver paginas.md)
│   ├── Convocatoria.jsx  # pestaña "Estrategia" de EquipoInfo: asistente de formación
│   ├── Cancha.jsx        # cancha SVG reutilizada por Convocatoria (editable y de solo lectura)
│   └── ui/               # sistema de diseño: Button, TextField, Card, Alert,
│                         # PageShell, PageHero, Tabs, Modal
├── styles/               # un .css por pantalla/componente, más los archivos
│                         # transversales: tokens.css, IndexStyle.css
└── utils/
    └── api.ts            # cliente único de acceso a la API (ApiClient, ver más abajo)
```

La convención del proyecto es **un archivo `.jsx` por pantalla en `pages/`**, con su **CSS en un archivo separado en `styles/`** del mismo nombre (o compartido, cuando varias pantallas se parecen — ver `paginas.md`). No hay CSS-in-JS ni CSS Modules: los nombres de clase son globales, así que si dos archivos definen la misma clase, se pisan entre sí según el orden de import. Esto es intencional dado el tamaño del proyecto, pero es importante tenerlo en cuenta al agregar una clase nueva: conviene prefijarla o revisar que no colisione con otra pantalla.

### Cómo se conecta con el backend

**Actualizado** — desde que se agregó la capa de modelos tipados (ver más abajo), el acceso a la API pasó de `src/utils/api.js` a `src/utils/api.ts`, reorganizado como una clase `ApiClient` (patrón Facade + Singleton: concentra la construcción de headers, el manejo de 401 y las 3 formas de llamar a la API en un solo objeto, con una única instancia exportada — `export const apiClient = new ApiClient(API_BASE)`). Las funciones que ya usaban las páginas (`apiFetch`, `adminApiFetch`, `apiFetchFormData`, `getAuthHeaders`, `ASSETS_URL`) se mantuvieron exportadas con la misma firma, delegando a esa instancia — ningún `.jsx` necesitó cambiar.

La URL base **ya no está hardcodeada**: sale de `import.meta.env.VITE_API_URL` (`.env`, ver `README.md` de la raíz). Sigue el mismo comportamiento por función:

| Función | Para quién | Token que usa | Qué hace si el token es inválido (401) |
|---|---|---|---|
| `apiFetch(endpoint, options)` | Jugador | `localStorage.getItem("token")` | Borra el token y redirige a `/` |
| `adminApiFetch(endpoint, options)` | Administrador de torneo | `localStorage.getItem("adminToken")` | Borra `adminToken`/`admin` y redirige a `/admin` |
| `apiFetchFormData(endpoint, formData)` | Jugador, para subir archivos (ej. escudo del equipo) | `localStorage.getItem("token")` | Igual que `apiFetch` |

Las 3 agregan automáticamente el header `Authorization: Bearer <token>`. El login (`InicioSesion.jsx`, `InicioSesionAdmin.jsx`) es la excepción: hace el primer `fetch` a mano (todavía no hay token) y recién después de un login exitoso guarda `token`/`jugador` (o `adminToken`/`admin`) en `localStorage`.

Es decir: **hay dos "sesiones" completamente separadas** — la de jugador y la de administrador — cada una con su propio token y su propia info de usuario en `localStorage`, y cada una protegida por su propio guard en `App.jsx`:

```js
function PrivateRoute({ children }) {
  const token = localStorage.getItem("token");
  if (!token) return <Navigate to="/" replace />;
  return children;
}
function AdminRoute({ children }) {
  const adminToken = localStorage.getItem("adminToken");
  if (!adminToken) return <Navigate to="/admin" replace />;
  return children;
}
```

**Actualizado**: sí hay un guard de admin centralizado (`AdminRoute`), envolviendo todas las rutas `/admin/*` — el dato anterior de esta página (que no existía) quedó desactualizado. Dentro de las pantallas de equipo, un tercer nivel de rol (capitán vs. jugador raso) se resuelve a nivel de componente, no de ruta: `EquipoInfo.jsx` calcula `esCapitanDeEsteEquipo` y lo usa para mostrar u ocultar acciones (invitar, expulsar, transferir capitanía, editar descripción), porque capitán y jugador comparten las mismas páginas.

### Modelos tipados (`src/models/`)

TypeScript conviviendo con `.jsx` (`allowJs: true`), acotado a esta carpeta y a `api.ts` — las páginas siguen sin type-checking. `Jugador.ts` y `Equipo.ts` son **clases** con métodos reales (`Jugador.nombreCompleto`, `Jugador.esCapitanDe(equipoId)`, `Equipo.tieneEscudo()`), no solo tipos planos; `types.ts` tiene las interfaces del resto de entidades (`TorneoDTO`, `PartidoDTO`, `CanchaDTO`, etc.). **Nota para quien trabaje sobre esto**: hoy nada en `src/pages`/`src/components` importa desde `src/models` — es una capa correctamente tipada pero todavía no conectada al resto de la app. Si se va a mostrar como parte de la entrega, conviene enganchar al menos un flujo real a estos modelos antes de la defensa.
