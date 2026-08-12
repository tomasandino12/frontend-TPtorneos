# Auditoría de estado responsive — Gestor de Torneos

Informe de solo lectura. No se modificó ningún archivo del repositorio para producir este documento. Cada afirmación cita ruta de archivo y número de línea; donde el código no permite concluir algo con certeza se indica explícitamente "No determinable estáticamente".

Contexto de referencia: problema confirmado en dispositivo Android real, viewport ~393px de ancho (ver los 7 síntomas en el encargo original).

---

## 1. Meta viewport

`index.html:6`:

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
```

- No incluye `viewport-fit=cover`. El proyecto no tiene ningún safe-area inset (`env(safe-area-inset-*)`) en ningún archivo CSS del repo — confirmado por búsqueda de `safe-area` y `env(` sin resultados en `src/`.
- No hay `maximum-scale` ni `user-scalable=no`, lo cual es correcto (no bloquea el zoom del usuario).
- Es la única etiqueta `<meta name="viewport">` del proyecto; no hay overrides por página.

## 2. Sistema de tokens

Definido en `src/styles/tokens.css:1-96`, importado globalmente desde `src/index.css:2` (`@import "./styles/tokens.css";`), antes que cualquier otro CSS de página.

**Tokens que existen hoy:**

| Categoría | Tokens | Líneas |
|---|---|---|
| Color de marca | `--color-pitch`, `--color-pitch-dark`, `--color-turf`, `--color-whistle`, `--color-alert`, `--color-alert-dark`, `--color-paper`, `--color-grass`, `--color-ink` | `tokens.css:32-40` |
| Color neutro | `--color-surface`, `--color-surface-muted`, `--color-border`, `--color-muted` | `tokens.css:43-46` |
| Color semántico | `--color-success-bg/text`, `--color-error-bg/text`, `--color-warning-bg/text`, `--color-info/-bg/-text` | `tokens.css:49-59` |
| Tipografía (familias) | `--font-display` (Bebas Neue), `--font-body` (Inter) | `tokens.css:62-63` |
| Radios | `--radius-sm` (6px), `--radius-md` (10px), `--radius-lg` (16px) | `tokens.css:66-68` |
| Sombra / foco | `--shadow-sm`, `--shadow-md`, `--focus-ring` | `tokens.css:69-71` |
| Z-index | `--z-navbar` (100), `--z-dropdown` (200), `--z-modal` (300) | `tokens.css:80-82` |
| Utilidad | `.stat-numeral` (clase, no token) | `tokens.css:90-95` |

**Tokens que NO existen y harían falta para el rediseño mobile:**

- **Altura mínima de target táctil** (ej. `--tap-target-min: 44px`): no hay ningún token ni valor de `min-height`/`min-width` de 44px en ningún CSS del proyecto (búsqueda de `min-height: 44px` / `min-width: 44px` / `touch-action` sin resultados en `src/`). Botones reales quedan por debajo: `.ui-btn` (`src/components/ui/Button.css:8-9`) usa `font-size: 0.95rem` + `padding: 0.65em 1.4em`, que renderiza una altura aproximada de ~38-40px, no 44px.
- **Altura de header**: no existe un token `--header-height`. El navbar jugador (`.gt-navbar`) y el navbar admin (`.navbar`) no fijan una altura explícita en ningún breakpoint — la altura depende del contenido (logo + nav wrap + acciones), lo que hace imposible calcular `padding-top`/`scroll-margin-top` para anclas o para un futuro header sticky mobile sin reintroducir el mismo problema.
- **Escala tipográfica fluida**: no hay ningún token de tipo `--font-size-*`. El único uso de `clamp()` en todo `src/` está en `src/styles/Inicio.css:70` y `:78` (2 ocurrencias), específico de esa pantalla. El resto de los títulos usa `rem` fijos (ver Hallazgos no previstos).
- **Escala de espaciado**: no existen tokens `--space-*`/`--spacing-*` (búsqueda sin resultados). Cada archivo usa `rem`/`px` literales para padding/margin/gap.

**Z-index — nota de consistencia:** el propio comentario de `tokens.css:73-79` documenta que `.navbar`/`.gt-navbar` quedaron fuera de la migración a la escala de tokens y siguen con `z-index: 10` hardcodeado (`src/styles/IndexStyle.css:21` y `src/styles/Navbar.css:14`), en vez de usar `--z-navbar: 100`. El resto de los z-index sí usa tokens (`var(--z-modal)`, `var(--z-dropdown)`).

## 3. Media queries

Búsqueda de `@media` en todo `src/` (excluyendo el comentario explicativo de `tokens.css:11-25`, que no es una regla real):

| Archivo | Línea | Breakpoint | Tipo |
|---|---|---|---|
| `src/index.css` | 58 | `prefers-color-scheme: light` | No es breakpoint de ancho |
| `src/components/ui/Toast.css` | 20 | `prefers-reduced-motion: reduce` | No es breakpoint de ancho |
| `src/styles/InicioSesion.css` | 210 | `min-width: 480px` | Mobile-first |
| `src/styles/Arbitros.css` | 160 | `min-width: 768px` | Mobile-first |
| `src/styles/Canchas.css` | 342 | `min-width: 768px` | Mobile-first |
| `src/styles/Canchas.css` | 350 | `min-width: 1024px` | Mobile-first |
| `src/styles/CrearCancha.css` | 67 | `min-width: 768px` | Mobile-first |
| `src/components/ui/PageHero.css` | 161 | `min-width: 768px` | Mobile-first |
| `src/styles/CrearTorneo.css` | 304 | `min-width: 768px` | Mobile-first |
| `src/styles/CrearTorneo.css` | 313 | `min-width: 1024px` | Mobile-first |
| `src/styles/InscribirEquipos.css` | 428 | `min-width: 768px` | Mobile-first |
| `src/styles/Jugadores.css` | 325 | `min-width: 768px` | Mobile-first |
| `src/styles/MenuAdmin.css` | 48 | `min-width: 1024px` | Mobile-first |
| `src/styles/MiPerfil.css` | 101 | `min-width: 768px` | Mobile-first |
| `src/styles/Navbar.css` | 154 | `min-width: 1024px` | Mobile-first |
| `src/components/ui/NotificationBell.css` | 180 | `min-width: 1024px` | Mobile-first |
| `src/styles/MisTorneos.css` | 385 | `min-width: 768px` | Mobile-first |
| `src/styles/MisTorneos.css` | 391 | `min-width: 1024px` | Mobile-first |
| `src/styles/Registro.css` | 25 | `min-width: 768px` | Mobile-first |

**Criterio:** las 17 media queries de ancho son `min-width` (mobile-first), usando exclusivamente 3 valores: **480px, 768px, 1024px**. Esto coincide exactamente con la convención documentada en `tokens.css:14-17` (SM/MD/LG). A diferencia de lo que los síntomas podrían sugerir, **sí hay un criterio consistente**: no se encontró ningún `max-width` (desktop-first) en el proyecto. El problema descrito en el contexto no es inconsistencia de breakpoints, sino que varias pantallas (notablemente el navbar y las tablas de admin) no tienen ninguna regla de ajuste *por debajo* de 480px, que es donde ocurre el viewport de 393px reportado.

## 4. Navegación

**Lado jugador** — `src/components/Navbar.jsx`. No recibe props (se auto-lee del `localStorage`, `Navbar.jsx:22`). No hay ninguna prop ni lógica condicional por rol: la lista `NAV_ITEMS` (`Navbar.jsx:6-12`) es fija para todos los jugadores logueados, capitanes incluidos. La única distinción por rol visible en el código de esta sección es textual, en `Estadisticas.jsx:149` (`jugadorLogueado?.esCapitan ? "Gestionar mi equipo" : "Ver mi equipo"`), que no cambia destinos de navegación, solo el label de un botón.

Destinos reales de `NAV_ITEMS` (`Navbar.jsx:7-11`):
1. `/gestorTorneos` (Tabla de Posiciones)
2. `/gestorTorneos/estadisticas`
3. `/gestorTorneos/fixture`
4. `/gestorTorneos/equipos`
5. `/gestorTorneos/miPerfil`

(`/gestorTorneos/inicio` existe como ruta — `App.jsx:66` — pero solo se accede vía el logo, `Navbar.jsx:36`, no aparece en `NAV_ITEMS`.)

**Lado admin** — `src/components/AdminHeader.jsx`. Recibe props `admin` (objeto) y `onLogout` (función) — `AdminHeader.jsx:12`. No hay lógica condicional por rol dentro del admin (no existe un concepto de "sub-rol" de admin en el código). La navegación combina 2 dropdowns con estado (`openMenu`, `AdminHeader.jsx:17`) más 2 links directos (`OTHER_NAV`, `AdminHeader.jsx:7-10`).

Destinos reales de administración, confirmados en `AdminHeader.jsx` y `App.jsx`:
1. `/admin/torneos` (dropdown "Mis Torneos" → "Mis Torneos")
2. `/admin/torneos/nuevo` (dropdown "Mis Torneos" → "Crear Torneo")
3. `/admin/canchas` (dropdown "Canchas" → "Ver canchas")
4. `/admin/canchas/nueva` (dropdown "Canchas" → "Nueva cancha")
5. `/admin/arbitros` (link directo "Arbitraje")
6. `/admin/jugadores` (link directo "Jugadores")
7. `/menu-admin` (logo, `AdminHeader.jsx:68`)

Rutas adicionales que existen en `App.jsx` pero no tienen entrada de nav (solo se llega por navegación programática desde otra pantalla): `/admin/torneos/:id/editar`, `/admin/torneos/:id/equipos` (`App.jsx:52-53`).

**Confirmación del síntoma 1:** tanto `Navbar.css` (`.gt-navlinks`, líneas 40-51, `order: 3; width: 100%`) como `AdminHeader`/`MenuAdmin.css` (`.navlinks`, líneas 37-42, mismo patrón `order: 3; width: 100%`) apilan la lista de links en una fila propia por debajo del logo hasta 1024px (`Navbar.css:154`, `MenuAdmin.css:48`). Antes de ese breakpoint ambos headers son la versión "comprimida" descrita.

## 5. Notificaciones

Componente: `src/components/NotificationBell.jsx`. Solo se usa desde `Navbar.jsx:55` (lado jugador) — el admin no tiene notificaciones.

**Apertura/cierre:** estado local `abierto` (`NotificationBell.jsx:48`), toggle por click en el botón campana (`NotificationBell.jsx:100`). Se cierra con click afuera (listener `mousedown` en documento, `NotificationBell.jsx:65-66`) o con tecla `Escape` (`NotificationBell.jsx:68-69`), ambos activos solo mientras `abierto === true` (`NotificationBell.jsx:63-77`).

**CSS de posicionamiento** — `src/styles/NotificationBell.css`:
- `.notif-bell` (línea 5-7): `position: relative`, es el ancla.
- `.notif-panel` (líneas 62-73): `position: absolute; top: calc(100% + 10px); right: -0.5rem; width: min(380px, 90vw);`.
- El único ajuste responsive es `right: 0` a partir de `min-width: 1024px` (`NotificationBell.css:180-184`); por debajo de 1024px queda `right: -0.5rem` sin ningún otro condicionamiento.

El panel se posiciona exclusivamente en relación a su propio botón ancla (`right` relativo a `.notif-bell`), sin ninguna lógica de colisión con el borde izquierdo del viewport (no hay JS de posicionamiento dinámico, ni `left: auto` condicional, ni `overflow` de contención en un ancestro). Esto es consistente con el desborde confirmado en el dispositivo real: si el botón campana no está pegado al borde derecho de la pantalla, un panel de hasta 90vw de ancho anclado por `right` puede extenderse más allá del borde izquierdo del viewport sin que ninguna regla lo evite.

## 6. Tablas

Se encontraron **4** apariciones de `<table>` en todo `src/` (no hay listas div-a-modo-de-tabla adicionales; se verificó explícitamente que `Equipos.jsx`, `MisTorneos.jsx`, `InscribirEquipos.jsx` y `Canchas.jsx` no usan ningún patrón tabular, solo cards).

| # | Archivo:línea | Clase | Columnas | Contenedor de scroll |
|---|---|---|---|---|
| 1 | `src/pages/TablaPosiciones.jsx:99` | `.tabla-posiciones` | 8: Pos, Equipo, PJ, PG, PE, PP, DG, Pts | Sí: `.tabla-scroll` (`TablaPosiciones.jsx:98`) con `overflow-x: auto` (`TablaPosiciones.css:41`) y `min-width: 560px` en la tabla (`TablaPosiciones.css:46`) |
| 2 | `src/pages/Arbitros.jsx:167` | `.ar-table` | 5: Nombre, Apellido, Matrícula, Email, Acciones | `.ar-table-wrap` (`Arbitros.jsx:166`) tiene `overflow: hidden` (`Arbitros.css:43`), **no** `overflow-x: auto` |
| 3 | `src/pages/Jugadores.jsx:249` | `.jg-table` | 4: Nombre, Apellido, DNI, Equipo | `.jg-table-wrap` (`Jugadores.jsx:248`) tiene `overflow: hidden` (`Jugadores.css:65`), **no** `overflow-x: auto` |
| 4 | `src/components/EquipoInfo.jsx:751` | `.tabla-partidos` | 5: Fecha, Local, Resultado, Visitante, Estado | Ninguno — la tabla está envuelta solo en un `<section className="detalle-seccion historial-seccion">` (`EquipoInfo.jsx:749`) sin wrapper de scroll; la propia `.tabla-partidos` tiene `overflow: hidden` (`Equipos.css:765`) |

**Detalle del síntoma 4:** de las 4 tablas, solo la Tabla de Posiciones (#1) tiene un contenedor de scroll horizontal funcional (`overflow-x: auto` + `min-width` forzado en la tabla). Sin embargo, incluso ahí no hay ninguna señal visual de que el contenido es desplazable (no hay sombra/gradiente lateral, ni indicador de scroll) ni encabezado fijo (`<thead>`/`<th>` no tienen `position: sticky` en `TablaPosiciones.css`) — esto confirma literalmente el síntoma 4 tal como está descrito, aun cuando el mecanismo de scroll en sí existe.

Las otras 3 tablas (#2, #3, #4) usan `overflow: hidden`, que en los 3 casos es la técnica para recortar las esquinas redondeadas del contenedor (`border-radius` + `overflow: hidden`), no una decisión de scroll. El efecto en mobile es peor que "sin señal visual": el contenido que no entra queda literalmente recortado/oculto, sin ninguna forma de acceder a él por scroll.

## 7. Inventario de páginas

`src/pages/` contiene 20 archivos `.jsx`.

| Página | Usa PageShell | Usa PageHero | Notas |
|---|---|---|---|
| `Arbitros.jsx` | Sí | Sí | Panel admin |
| `Canchas.jsx` | Sí | Sí | Panel admin |
| `CrearCancha.jsx` | Sí | Sí | Panel admin |
| `CrearTorneo.jsx` | Sí | Sí | Panel admin |
| `EquipoDetalle.jsx` | Sí | — (usa `EquipoInfo`, que sí usa `PageHero` internamente) | Ruta standalone `/equipo/:id` |
| `Equipos.jsx` | Sí | Sí | |
| `Estadisticas.jsx` | Sí | Sí | |
| `FixtureTorneo.jsx` | Sí | Sí | |
| `GestorTorneos.jsx` | No | No | Es el layout contenedor (`<Navbar/><Outlet/>`), no una pantalla de contenido |
| `Inicio.jsx` | **No** | **No** | Reimplementa su propio layout completo (`.inicio-page`, `.inicio-hero`) en `Inicio.css` |
| `InicioSesion.jsx` | **No** | **No** | Reimplementa `.auth-page`/`.auth-card` (`InicioSesion.css`) |
| `InicioSesionAdmin.jsx` | **No** | **No** | Reimplementa `.auth-page` (comparte `InicioSesion.css`) |
| `InscribirEquipos.jsx` | Sí | Sí | Panel admin |
| `Jugadores.jsx` | Sí | Sí | Panel admin |
| `MenuAdmin.jsx` | Sí | — | |
| `MiPerfil.jsx` | Sí | Sí | |
| `MisTorneos.jsx` | Sí | Sí | Panel admin |
| `OlvidePassword.jsx` | **No** | **No** | Reimplementa `.auth-page` (comparte `InicioSesion.css`) |
| `Registro.jsx` | **No** | **No** | Reimplementa `.auth-page` (comparte `InicioSesion.css` + `Registro.css`) |
| `RestablecerPassword.jsx` | **No** | **No** | Reimplementa `.auth-page` (comparte `InicioSesion.css`) |
| `TablaPosiciones.jsx` | Sí (`bare`) | — (usa su propio `.tabla-container`) | |

Resumen: 14 de 20 archivos usan `PageShell`, 13 usan `PageHero`. Las 6 pantallas que no usan ninguno de los dos son las 5 de autenticación (comparten intencionalmente `InicioSesion.css` como hoja "compartida de auth", según el comentario en `InicioSesion.css:1-13`) más `Inicio.jsx` (pantalla "hero" de bienvenida con su propio fondo de imagen). Esto es consistente y documentado en el propio código, no parece drift accidental — pero significa que cualquier corrección de layout/padding a `PageShell`/`PageHero` para mobile **no** alcanza a estas 6 pantallas.

Adicionalmente: las 8 páginas del panel admin (`MisTorneos`, `InscribirEquipos`, `CrearTorneo`, `Jugadores`, `CrearCancha`, `Canchas`, `Arbitros`, `MenuAdmin`) no comparten un componente de layout análogo a `GestorTorneos.jsx` (que centraliza `<Navbar/><Outlet/><footer/>` para el lado jugador) — cada una repite su propio `<div className="layout"><AdminHeader .../><main className="content">...</main><footer>...</footer></div>` inline (confirmado en `MenuAdmin.jsx:41-48` como ejemplo).

## 8. Wizard de formación

Componentes: `src/components/Cancha.jsx` (visualización SVG) + `src/components/Convocatoria.jsx` (wizard de 4 pasos que lo controla).

**SVG de la cancha** (`Cancha.jsx:50-57`):
```jsx
<svg className="cancha-svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
```
- `viewBox="0 0 100 100"` con `preserveAspectRatio="none"`: el SVG es fluido, no tiene `width`/`height` fijos en atributos.
- El contenedor real que define el tamaño es `.cancha-wrapper` (`src/styles/Equipos.css:607-616`): `width: 100%; max-width: 420px; aspect-ratio: 2 / 3; margin: 0 auto;` — fluido hasta 420px, luego se limita.
- `.cancha-svg` (`Equipos.css:618-624`): `position: absolute; inset: 0; width: 100%; height: 100%;` — llena el wrapper fluido.
- Los puntos de jugador (`.cancha-punto`, `Equipos.css:636-644`) se posicionan con `left`/`top` en porcentaje (inline style desde `Cancha.jsx:66-73`, valores `punto.x`/`punto.y` de 0-100), por lo que escalan junto con el SVG. El tamaño del círculo en sí es fijo: `width: 46px; height: 46px` (`Equipos.css:642-643`) — por encima del umbral habitual de 44px de target táctil.

**Asignación de jugadores — NO es drag and drop.** Es 100% por tap/click + selección en modal:
1. En modo editable, tocar un punto vacío de la cancha dispara `onClickPunto` → `handleClickPunto` (`Convocatoria.jsx:140-151`), que abre un modal (`puntoSeleccionado`, `Convocatoria.jsx:109`).
2. El modal (`Convocatoria.jsx:431-460`, usa el componente `Modal` de `ui/`) lista los jugadores disponibles de esa categoría como botones (`Convocatoria.jsx:439-455`).
3. Tocar un jugador de la lista llama `handleAsignarJugador`/`handleClickJugadorLista` (`Convocatoria.jsx:153-167`), que actualiza el estado `asignaciones` — no hay ningún listener de `dragstart`/`drop`/`pointermove` en todo el componente.
4. Tocar un punto ya asignado lo desasigna directamente (`Convocatoria.jsx:141-147`), sin pasar por el modal.

Texto de ayuda explícito confirma esta interacción: `Convocatoria.jsx:358-360` — *"Tocá un punto vacío para asignar un jugador. Tocá uno ya asignado para quitarlo."*

**Conclusión:** contrario a lo que el punto 8 del encargo planteaba como riesgo crítico, el wizard **no depende de arrastrar**. El mecanismo de asignación (tap + lista en modal) ya es accesible por teclado/táctil por diseño. El único hallazgo real de esta sección es de layout, no de interacción: el SVG y el wrapper son fluidos, así que no hay problema de escala aquí.

## 9. Formularios

Login (`InicioSesion.jsx`) y Registro (`Registro.jsx`) no tienen inputs propios: ambos usan el componente compartido `TextField` (`src/components/ui/TextField.jsx`, importado en `InicioSesion.jsx:7` y `Registro.jsx:6`), que renderiza `.ui-field-input`.

`src/components/ui/TextField.css:41-52`:
```css
.ui-field-input {
  ...
  font-size: 0.95rem;
  ...
}
```

`0.95rem` equivale a **15.2px**, asumiendo el `font-size` raíz del navegador (16px). Se confirmó que el proyecto no redefine el `font-size` de `:root`/`html` en ningún lado (`src/index.css:4-13` solo fija `font-family`, `line-height`, `font-weight` — no `font-size`).

**Todos** los inputs de Login y Registro están por debajo de 16px, ya que ambos consumen exclusivamente `TextField`/`.ui-field-input` y ninguno de los dos archivos (`InicioSesion.css`, `Registro.css`) sobrescribe `font-size` en ningún selector de input (confirmado por búsqueda de `font-size` en `Registro.css`, que solo aparece en el comentario de layout, sin ninguna declaración de input). Esto incluye email, contraseña, y en Registro también nombre/apellido/DNI/fecha de nacimiento/posición/confirmar contraseña — es un único punto de origen (`TextField.css:48`), por lo que la corrección, si se aplica, se propaga a los dos formularios (y a cualquier otro que use `TextField`, que es prácticamente todos los del proyecto).

## 10. Unidades de viewport

Todas las ocurrencias de `vh` en `src/`:

| Archivo:línea | Valor | Contexto |
|---|---|---|
| `src/index.css:27` | `min-height: 100vh` | `body` global |
| `src/styles/IndexStyle.css:158` | `min-height: 100vh` | `.layout` (wrapper de página con Navbar/AdminHeader) |
| `src/styles/InicioSesion.css:16` | `min-height: 100vh` | `.auth-page` — usada por las 5 pantallas de auth |
| `src/components/ui/PageShell.css:28` | `min-height: 100vh` | `.ui-page-shell-bare` (Tabla de Posiciones, panel admin) |
| `src/components/ui/Modal.css:18` | `max-height: 85vh` | Modal genérico (`ui/Modal`) |
| `src/styles/Canchas.css:292` | `height: 100vh` | Overlay de modal propio de Canchas |
| `src/styles/Canchas.css:307` | `max-height: 90vh` | Contenido del modal de Canchas |
| `src/styles/Arbitros.css:122` | `height: 100vh` | Overlay de modal propio de Arbitros |
| `src/styles/Equipos.css:29` | `height: 100vh` | Overlay de modal (Equipos) |
| `src/styles/Equipos.css:855` | `height: 100vh` | Overlay de un segundo modal (Equipos) |
| `src/styles/Equipos.css:870` | `max-height: 85vh` | Contenido de ese segundo modal |
| `src/styles/Jugadores.css:195` | `height: 100vh` | Overlay de modal propio de Jugadores |
| `src/styles/Jugadores.css:211` | `max-height: 90vh` | Contenido del modal de Jugadores |

13 ocurrencias en 9 archivos. Ninguna usa `dvh` (dynamic viewport height) ni `svh`/`lvh`. Los casos de `.layout`/`.auth-page`/`.ui-page-shell-bare` (`min-height: 100vh`) son los que más impactan el síntoma descrito: en mobile, cuando la barra de direcciones del navegador se oculta/muestra al hacer scroll, `100vh` no se recalcula de forma consistente entre navegadores, lo que puede producir saltos de layout o una franja vacía/cortada al pie de estos contenedores. Los usos en overlays de modal (`height: 100vh` con `position: fixed`) son un patrón más tolerante al problema (el modal ya está pensado para cubrir toda la pantalla), pero comparten la misma causa raíz.

## 11. Estados hover

Búsqueda de `:hover` en `src/`: **56 ocurrencias en 20 archivos** (conteo por archivo vía `grep -c`):

`src/index.css` (3), `src/styles/Canchas.css` (4), `src/styles/Arbitros.css` (3), `src/styles/Equipos.css` (10), `src/styles/CrearTorneo.css` (2), `src/styles/InicioSesion.css` (1), `src/styles/Inicio.css` (1), `src/styles/IndexStyle.css` (2), `src/components/ui/Modal.css` (1), `src/styles/Jugadores.css` (3), `src/styles/MenuAdmin.css` (5), `src/styles/InscribirEquipos.css` (3), `src/styles/NotificationBell.css` (3), `src/styles/MisTorneos.css` (4), `src/components/ui/Button.css` (4), `src/components/ui/TextField.css` (2), `src/styles/Navbar.css` (2), `src/styles/TablaPosiciones.css` (1), `src/components/ui/Toast.css` (1), `src/components/ui/Tabs.css` (1).

Búsqueda de `@media (hover: hover)` en todo `src/`: **0 resultados**. Ninguna de las 56 reglas `:hover` del proyecto está condicionada por `@media (hover: hover)` ni por `@media (pointer: fine)`. Esto incluye elementos con estado interactivo permanente en mobile como `.gt-logout-btn:hover` (`Navbar.css:140`), `.notif-item:hover` (`NotificationBell.css:119`), `.tabla-posiciones tbody tr:hover` (`TablaPosiciones.css:73`) y todos los botones de `ui/Button.css`. En touchscreens sin mouse, estas reglas pueden quedar "pegadas" tras un tap (estado `:hover` que persiste hasta el siguiente toque en otro lugar de la pantalla) en los navegadores que emulan `:hover` al tocar.

---

## Hallazgos no previstos

1. **El título de `PageHero` (no solo el de Tabla de Posiciones) tiene tamaño fijo sin reducción en mobile.** `.ui-page-hero-title` (`src/components/ui/PageHero.css:22-30`) usa `font-size: 2.2rem` sin ninguna regla `@media` que lo reduzca por debajo de 768px. Como 13 de 20 páginas usan `PageHero` (ver sección 7), el síntoma 5 (título que se parte en dos líneas, ícono desalineado) es potencialmente un problema de layout compartido, no aislado a Tabla de Posiciones (que además ni siquiera usa `PageHero`, sino su propio `.tabla-titulo` en `TablaPosiciones.css:17-26`, también con `font-size: 2rem` fijo).

2. **El padding de `PageShell` y `PageHero` se anida y no se reduce en mobile.** `.ui-page-shell` tiene `padding: 2rem` fijo (`PageShell.css:9`) y, cuando además envuelve un `PageHero`, este último agrega otro `padding: 2rem` propio (`PageHero.css:3`) antes de llegar al contenido real. En un viewport de 393px, esto consume hasta ~64px de ancho horizontal solo en padding anidado, sin ninguna regla mobile que lo compense — una causa estructural del síntoma 7, más amplia que "el padding de las cards".

3. **Solo 1 de las 4 tablas del proyecto tiene scroll horizontal funcional.** Como se detalla en la sección 6, `Arbitros.jsx`, `Jugadores.jsx` y `EquipoInfo.jsx` (historial de partidos) usan `overflow: hidden` en el contenedor de la tabla — una técnica de recorte de esquinas redondeadas, no una decisión de UX — lo que en mobile oculta columnas sin ninguna vía de acceder a ellas (ni scroll ni layout alternativo). Es un problema más severo que la falta de indicador visual: ahí directamente no hay scroll disponible.

4. **El botón "Cerrar sesión" con jerarquía invertida existe también en el panel admin**, de forma casi idéntica al de jugador: `.btn-logout` (`src/styles/IndexStyle.css:69-89`, recoloreado en `src/styles/MenuAdmin.css:19-27`) usa el mismo borde/texto rojo (`--color-alert`) que `.gt-logout-btn` (`Navbar.css:123-143`). El síntoma 2 no es exclusivo de la vista jugador.

5. **No existe una escala de espaciado ni un token de altura mínima de target táctil** (ver sección 2) — confirma explícitamente lo que el punto 2 del encargo pedía verificar.

6. **Uso de `clamp()` para tipografía fluida limitado a una sola pantalla.** Las únicas 2 ocurrencias de `clamp()` en todo el proyecto están en `Inicio.css:70` y `:78`. El resto de los ~30+ `font-size` del proyecto son valores `rem`/`px` fijos sin fluidez entre breakpoints.

7. **`NotificationBell` no es el único elemento con `position: absolute` sin contención de borde.** El mismo patrón (panel/dropdown posicionado por `right`/`left` sin lógica de colisión) aparece en los dropdowns de `AdminHeader.jsx` (`.admin-dropdown`, ver `AdminHeader.jsx:92` y `:136`, estilizado en `MenuAdmin.css`) — no se verificó su comportamiento en 393px pero comparte la misma causa raíz que el síntoma 3.

8. **Los botones del sistema de diseño (`ui/Button.css`) probablemente no alcanzan 44px de alto.** `.ui-btn` (`Button.css:1-16`) combina `font-size: 0.95rem` (15.2px) con `padding: 0.65em 1.4em` (~9.9px vertical), dando una altura aproximada de 38-40px — por debajo del target táctil mínimo recomendado, en todos los botones primarios/secundarios/danger/ghost del proyecto, no solo en el header.

9. **Cada página del panel admin reimplementa el wrapper `<div className="layout">` en vez de un layout compartido** (ver sección 7, ejemplo en `MenuAdmin.jsx:41-48`), a diferencia del lado jugador donde `GestorTorneos.jsx` centraliza esa estructura una sola vez. No es un bug hoy, pero es una superficie 8 veces más grande para que un futuro ajuste responsive del header quede inconsistente entre pantallas admin.

10. **El proyecto importa Tailwind** (`@import "tailwindcss";` en `src/index.css:1`) pero no se encontró ningún uso de clases utilitarias de Tailwind en los archivos `.jsx` revisados — el sistema de diseño real del proyecto es el CSS plano con tokens de `tokens.css`. No determinable estáticamente si Tailwind está configurado con algún preset/reset que afecte el viewport (no se leyó `tailwind.config` ni `vite.config.js` en detalle para este informe, fuera del alcance de las 11 preguntas).
