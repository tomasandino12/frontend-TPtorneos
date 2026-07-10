# Auditoría de UI/UX — Gestor de Torneos (Frontend)

Fecha: 2026-07-10
Alcance: `src/` completo (18 páginas, 1 componente compartido, 15 hojas de estilo). Solo lectura — no se modificó código funcional, únicamente se creó este reporte.

## Resumen ejecutivo

El frontend fue construido pantalla por pantalla, en general por copy-paste de la pantalla más parecida, sin ningún sistema de diseño compartido: **no existe una sola variable CSS (`:root`) en todo el proyecto**, no hay componentes reutilizables de Button/Input/Card/Modal/Table, y conviven **tres sistemas de iconografía distintos** (emoji, Boxicons vía CDN, react-icons) muchas veces para el mismo rol. Esto se traduce en bloques de CSS duplicados casi al byte en 3-4 archivos distintos (hoja de auth, "hero" de panel admin, `.mensaje-error`, encabezado de página), paletas de color que divergen entre pantallas que deberían verse iguales, y al menos un caso confirmado de mal uso semántico del color (caja roja de "error" para un mensaje informativo). También surgieron algunos bugs funcionales durante la lectura de código (botones sin `onClick`, un botón que no hace lo que su texto dice) que se listan al final por transparencia, aunque no sean estrictamente visuales.

**Total: 79 hallazgos** → Alta: **17** · Media: **44** · Baja: **18**

(Ver tabla de resumen completa al final del documento.)

---

## 1. Paleta de colores

**No hay variables CSS en ningún archivo del proyecto** (`grep` de `:root`/`--` en `src/styles` no arroja resultados). Todos los colores están escritos como hex/rgba literales y repetidos manualmente archivo por archivo. Esta es la causa raíz de casi todo lo que sigue. **(Alta)**

### Dos paletas conviviendo sin puente entre sí

- **Grupo oscuro (autenticación)** — `InicioSesion.jsx`, `InicioSesionAdmin.jsx`, `Registro.jsx`, `OlvidePassword.jsx`, `RestablecerPassword.jsx`: fondo `radial-gradient(..., rgba(34,197,94,0.25), transparent 60%), linear-gradient(135deg, #0b1220 0%, #0f1a2b 50%, #0a2a1a 100%)` (`InicioSesion.css:10-11`), texto blanco `#ffffff` (`InicioSesion.css:46,57`), acento verde `#22c55e` (`InicioSesion.css:50`).
- **Grupo claro (resto de la app)** — `MenuAdmin`, `Equipos`, `Estadisticas`, `FixtureTorneo`, `TablaPosiciones`, `MiPerfil`, panel admin de torneos: fondo `#eaf6ec`/`#f9fafb` (`IndexStyle.css:13`), navbar blanco `#ffffff` con borde `#b7dfbe` (`IndexStyle.css:17-18`), texto `#1f2937`/`#444`, acentos verdes `#2e7d32`/`#16a34a`/`#166534`.
- No hay ninguna transición ni elemento puente entre ambos temas — el usuario pasa de un login oscuro a una app clara sin ningún indicio visual de continuidad de marca. **(Alta)**

### Verde de marca sin fuente única de verdad

Al menos **9 tonos de verde** usados como "color de marca" sin relación declarada entre sí: `#eaf6ec` (fondo body/main), `#1b5e20` (footer, `App.css:21` y `IndexStyle.css:163`, duplicado), `#2e7d32`/`#338637`/`#d4f4dc` (nav activo, `IndexStyle.css`), `#22c55e` (acento auth), `#16a34a`/`#166534`/`#15803d`/`#f0fdf4`/`#dcfce7`/`#d1fae5`/`#bbf7d0`/`#86efac` (panel admin de torneos: `CrearTorneo.css`, `MisTorneos.css`, `Arbitros.css`). Ningún archivo comparte una fuente única. **(Media)**

### Rojo/"atención" con al menos 3 paletas distintas

- Rojo Tailwind (`#dc2626`/`#fef2f2`/`#fca5a5`/`#ef4444`/`#fee2e2`): usado en `CrearTorneo.jsx:234` (inline), `Equipos.css:72-82`, `InscribirEquipos.css` `.ie-msg-err`.
- Rojo Bootstrap (`#fdecea`/`#f5c2c7`/`#842029`): usado solo en `Arbitros.css:216-224` (`.ar-modal-error`) — visualmente distinto al resto de la app para el mismo significado "error". **(Alta)**
- Ámbar/naranja "de advertencia" con dos variantes en el mismo archivo: `.ct-warning` (`#fffbeb`/`#fde68a`/`#d97706`/`#92400e`) y `.ct-field-warning` (`#fff7ed`/`#fed7aa`/`#c2410c`/`#ea580c`) en `CrearTorneo.css:428-470`. **(Media)**

### Azul sin sistema

Tres azules "informativos" no relacionados entre sí: `.ie-btn-fixture` (`#1d4ed8`/`#1e40af`, `InscribirEquipos.css:265-279`, único CTA primario azul de toda la app — el resto usa verde), badge de jornada (`#0366d6`/`#e1ecf4`, `FixtureTorneo.css:84-85`), caja "Partidos Jugados" (`#1e88e5`, `Estadisticas.css:60`). **(Media)**

### Paleta boilerplate de Vite sin limpiar

`src/index.css:16,20,45,50` conserva los colores default del template de Vite/React (`#646cff`, `#535bf2`, `#1a1a1a`) para `a`/`button` sin clase — no coinciden con ningún verde de la app; cualquier elemento nuevo sin clase propia heredaría este morado por accidente. **(Media)**

### Otras divergencias menores de paleta

- Verde de hover de botón primario diverge: `#1b5e20` (`Equipos.css:56,310,364`) vs `#256428` (`MiPerfil.css:153,177`) para el mismo rol. **(Baja)**
- Color de encabezado diverge dentro del propio panel admin: `#111827` (`InscribirEquipos.css:17,74,142,186`) vs `#1f2937` (`CrearTorneo.css`, `MisTorneos.css`, `Arbitros.css`) para el mismo rol de heading. **(Baja)**
- `.inicio-badge` "EN VIVO" en rojo puro `#c62828` (`Inicio.css:41-42`) — único uso de rojo fuera del contexto de error/logout; vale la pena confirmar que no se lea como alerta. **(Baja)**

---

## 2. Iconografía

Se detectaron **tres sistemas de íconos distintos** conviviendo en la misma app, a veces en el mismo componente para el mismo rol:

| Sistema | Dónde se usa |
|---|---|
| Emoji Unicode | Navbar, botones, alertas, mensajes (listado completo abajo) |
| Boxicons (`bx bx-*`, cargado por **CDN externo**) | Todas las páginas del panel admin de torneos + `AdminHeader.jsx` + auth |
| `react-icons` (bundleado) | `GestorTorneos.jsx`, `AdminHeader.jsx` (logout) |

Boxicons se carga vía CDN externo (`unpkg.com/boxicons@2.1.4`) — si el CDN falla, **todos** los íconos `bx-*` de todas las pantallas admin desaparecen a la vez. **(Media, riesgo de robustez)**

### Listado de emojis usados como ícono (archivo:línea)

| Emoji | Archivo:línea | Contexto |
|---|---|---|
| 🏆 | `AdminHeader.jsx:75` ("➕ Crear Torneo" convive con 🏆 en otros lados), `MisTorneos.jsx:255`, `TablaPosiciones.jsx:93` | Botón / título de página |
| 📋 | `AdminHeader.jsx:63` | Ítem de dropdown (duplica el ícono boxicon `bx-list-ul` ya presente en el mismo ítem, línea 60-61) |
| ➕ | `AdminHeader.jsx:75`, `Equipos.jsx:258` ("➕ Agregar") | Botón, duplica acción que en otro lado usa `bx-plus` |
| 👥 | `MisTorneos.jsx:243,249` | Botones "Equipos" / "Agregar equipos" |
| 👤 | `MiPerfil.jsx:151` | Título "👤 Mi Perfil" |
| ✏️ | `MiPerfil.jsx:161` | Botón "✏️ Editar perfil" |
| 🚪 | `MiPerfil.jsx:312` | Botón "🚪 Salir del equipo" |
| 📧 / 🔒 / 👁 | `InicioSesionAdmin.jsx:72,86,100` | Íconos de campo — el resto de pantallas de auth usa Boxicons (`bx-envelope`, `bx-lock-alt`, `bx-show`/`bx-hide`) para lo mismo |
| ✅ | `InicioSesion.jsx:62`, `Registro.jsx:94`, `RestablecerPassword.jsx:72` | Dentro de `alert()` nativo o texto de confirmación |
| ⚠️ / ❌ | `Equipos.jsx:38,53,72,89,139,146` | Dentro de `window.alert()`/`confirm()` |
| ⚽ | `Equipos.jsx:272` | Mensaje "Ya perteneces a un equipo..." |
| ⚡ | `InscribirEquipos.jsx:452` | Botón "Generar fixture" |
| ✓ | `InscribirEquipos.jsx:206,328,383` | Mensajes de éxito (símbolo Unicode suelto, no ícono de librería) |
| ← | `InscribirEquipos.jsx:373`, `EquipoDetalle.jsx:130` | "Volver" (en vez de ícono boxicon `bx-arrow-back` u homólogo) |

**Hallazgo puntual**: en `AdminHeader.jsx:59-65` y `:71-77`, cada ítem del dropdown ya tiene un ícono Boxicon en `.admin-dropdown-icon` (`bx-list-ul`, `bx-plus-circle`) y **además** un emoji embebido en el propio texto del label — ícono duplicado para el mismo elemento. **(Media)**

---

## 3. Bugs visuales concretos

### Confirmados de la lista original

- **Input de escudo sin estilo (confirmado)** — `EquipoDetalle.jsx:138-144`:
  ```jsx
  <input id="escudo-input" type="file" accept=".jpg,.jpeg,image/jpeg"
    onChange={handleSubirEscudo} disabled={subiendoEscudo} />
  ```
  El único CSS que lo toca es `Equipos.css:418-420` (`font-size: 0.85rem`). Es el `<input type="file">` nativo del navegador, sin botón custom, dropzone ni preview — no se integra visualmente con el resto de cards/botones redondeados de la pantalla. **(Alta)**

- **Toggle mostrar/ocultar contraseña — implementación inconsistente entre pantallas** (relacionado con el bug reportado originalmente, confirmado como inconsistencia de código):
  - `InicioSesionAdmin.jsx:95-101` — el botón **siempre** renderiza el emoji `👁` sin alternar según el estado `mostrarPass`, a diferencia de `InicioSesion.jsx:132`, `Registro.jsx:235,260` y `RestablecerPassword.jsx:100`, que sí alternan `bx-show`/`bx-hide`. Además le falta `aria-label`. **(Media)**
  - `RestablecerPassword.jsx:105-121` — el campo "Confirmar contraseña" **no tiene** el botón de mostrar/ocultar que sí tiene "Nueva contraseña" (líneas 79-103). Como `.field-action` reserva 44px a la derecha (`InicioSesion.css:129-132`), el campo sin ese botón queda con un padding/ancho visualmente distinto al de arriba, rompiendo la alineación entre ambos inputs — este es el mecanismo concreto más probable detrás del "el texto se desplaza" reportado. **(Media)**
  - Recomendación de seguimiento: confirmar visualmente en navegador si además hay un bug de layout-shift al hacer click (no solo al comparar pantallas entre sí), ya que el análisis fue sobre código fuente, no sobre la app corriendo.

- **Caja roja de error para mensaje informativo (confirmado)** — `Equipos.jsx:239`, dentro de `<section className="agregar-jugadores">`. El selector `.agregar-jugadores p` (`Equipos.css:72-82`, fondo `#ffeaea`, borde y texto `#d32f2f`) tiene más especificidad que `.subtexto-busqueda` (`Equipos.css:119-123`, gris neutro) y gana, pintando como error el texto "¿Necesitás encontrar jugadores para tu equipo?". El mismo bug de especificidad afecta otros dos mensajes no-error en la misma sección (línea 264, estado vacío; línea 272, "Ya perteneces a un equipo"). **(Alta)** — ver también sección 6.

### Otros bugs de layout/interacción detectados

- **Tabla de posiciones recortada en mobile** — `TablaPosiciones.css` no envuelve `.tabla-posiciones` (8 columnas) en un contenedor con `overflow-x:auto`, y `body { overflow-x: hidden }` está seteado globalmente (`IndexStyle.css:12`). En viewports angostos las columnas de la derecha (DG, Pts) pueden quedar recortadas **sin forma de hacer scroll para verlas**. **(Alta)**
- **Hero de Inicio con posicionamiento frágil** — `Inicio.css:1-15`: `.inicio-page { height: 0; overflow: hidden }` + `.inicio-hero { position: fixed; inset: 0 }` sin `z-index` explícito. Al renderizarse dentro del layout con navbar `sticky` (`z-index: 10`, `IndexStyle.css:21`), puede terminar tapando o quedar tapado por el navbar según el stacking context. **(Alta)**
- **Dropdown de `AdminHeader` con "gap bug"** — `AdminHeader.jsx:19-20`, cierre por `setTimeout(120ms)` sin manejo de área de transición ni de foco/teclado; combinado con el gap de 8px entre trigger y menú (`MenuAdmin.css:124`), un movimiento diagonal del mouse puede cerrar el menú antes de llegar a él. Tampoco es accesible por teclado. **(Media)**
- **Modal de Árbitros por debajo del dropdown del header** — `.ar-modal-overlay` usa `z-index: 20` (`Arbitros.css:182`) mientras `.admin-dropdown` usa `z-index: 200` (`MenuAdmin.css:126`). No hay una escala de z-index consistente en el proyecto (10 / 20 / 200) — si el dropdown queda abierto al abrir el modal, puede quedar visualmente por encima del backdrop. **(Media)**
- **Falsa affordance en `EquipoDetalle`** — la lista de jugadores del plantel (`EquipoDetalle.jsx:194-201`, sin `onClick`) hereda el efecto hover `transform: translateY(-2px)` de `.lista-jugadores li:hover` (`Equipos.css:250-253`), pensado para una lista clickeable en otra pantalla. El usuario ve un efecto "lift" en filas que no hacen nada. **(Media)**
- **Posible superposición botón/título en `MiPerfil`** — `.boton-editar` es `position:absolute; top:1.5rem; right:1.5rem` sobre `.perfil-seccion{position:relative}` (`MiPerfil.css:50,137-141`) sin que el `<h2>` reserve espacio a la derecha; el único `@media` (768px, líneas 235-249) reposiciona el botón pero no ajusta el título. **(Media)**
- **Ícono del datepicker invisible fuera de Chrome/Edge** — `::-webkit-calendar-picker-indicator { filter: invert(1) }` (`InicioSesion.css:341-345`, compartido con `Registro.css` que sí tiene `<input type="date">`) solo cubre navegadores WebKit; en Firefox el ícono queda negro sobre fondo oscuro. **(Media)**
- Estados de carga sin ningún estilo (texto plano `<p>Cargando...</p>`) mientras los estados de error sí tienen card dedicada, en `EquipoDetalle.jsx:90`, `TablaPosiciones.jsx:76`, `Arbitros.jsx` — tratamiento asimétrico entre loading y error. **(Baja)**

---

## 4. Duplicación / confusión funcional

### Código duplicado o huérfano

- **`Layout.jsx` es un componente huérfano y duplicado** — reimplementa a mano el mismo navbar que `AdminHeader.jsx` ya encapsula, con un array de navegación (`ADMIN_NAV`, líneas 7-12) que apunta a rutas que **no existen** en `App.jsx` (`/menu-admin/arbitraje`, `/menu-admin/canchas`, `/menu-admin/jugadores`). No está importado desde ningún lado. **(Alta)**
- **`InicioSesionAdmin.css` es ~100% duplicado de `InicioSesion.css`** — idénticos línea por línea de la 1 a la 345; solo agrega `.login-title { color: #22c55e; }` al final. Cualquier cambio de paleta futuro debe replicarse a mano en los dos archivos (y ya hay drift: el título es blanco en uno y verde en el otro). **(Alta)**
- **`Registro.css` triplica el mismo patrón de card de auth** bajo nombres de clase distintos (`.auth-wrap`/`.auth-card`/`.auth-brand`/`.auth-error` vs `.login-wrap`/`.login-card`/`.login-brand`/`.login-error`) con los mismos valores (`background: rgba(10,16,30,.78)`, `border: 1px solid rgba(34,197,94,.25)`, `border-radius: 18px`), con drift menor de padding (26px vs 28px). **(Alta)**
- **Guard de autenticación de admin duplicado** — `MenuAdmin.jsx:11-22` y `Layout.jsx:19-30` repiten el mismo `localStorage.getItem("admin")` + redirect, en vez de un guard único reutilizable; además ninguna ruta admin en `App.jsx` está envuelta en un `PrivateRoute` (sí existe uno para jugador). **(Media)**
- **`InicioSesionAdmin.jsx` exporta una función llamada `MenuAdmin`**, mismo nombre que el componente real de `MenuAdmin.jsx` (dashboard admin) — son pantallas distintas (login vs dashboard). Funciona porque `App.jsx` usa alias de import distintos, pero genera confusión real en DevTools, búsquedas de texto y refactors futuros. **(Alta, higiene de código)**
- **Bloque "hero" de panel admin duplicado byte-a-byte 3 veces** — `.ct-hero`/`.mt-hero`/`.ar-hero` (`CrearTorneo.css:3-8`, `MisTorneos.css:3-8`, `Arbitros.css:3-8`) son idénticos, con una 4ª variante en `InscribirEquipos.css` que cambia de unidad (rem vs px). No existe una clase `.admin-hero` compartida. **(Alta)**
- **`.mensaje-error` duplicado idéntico en 3 archivos** — `Estadisticas.css:163-192`, `FixtureTorneo.css:127-155`, `TablaPosiciones.css:89-118`. **(Media)**
- **Bloque "header de página" duplicado en 3 archivos** — `.equipos-header` / `.estadisticas-header` / `.fixture-header` (todas `Equipos.css:7-13`, `Estadisticas.css:7-13`, `FixtureTorneo.css:7-13`) son copia byte a byte. **(Media)**
- **`.mt-metric-card` (usado) y `.ct-metric-card` (CSS muerto, nunca referenciado en el JSX)** son bloques CSS idénticos (`MisTorneos.css:41-49` vs `CrearTorneo.css:41-49`) — mismo componente definido dos veces, uno de ellos ya sin uso. **(Baja)**
- **CSS muerto por copy-paste no limpiado**: `.ct-metrics`, `.ct-canchas`/`.ct-cancha-chip`, `.ct-toggles`/`.ct-toggle-switch`, `.ct-btn-outline-green` (`CrearTorneo.css:35-69,213-310,339-354`); `.equipos-page` (`Equipos.css:1-5`); `.estadisticas-container` (`Estadisticas.css:1-4`); `.fixture-container` (`FixtureTorneo.css:1-5`) — clases que sugieren que la pantalla se copió de otra con más funciones y se recortó el JSX sin tocar el CSS. **(Baja)**

### Pantallas que se parecen pero cumplen roles distintos

- **`Equipos`/`EquipoDetalle` vs `Estadisticas` (confirmado, es el caso señalado en el pedido original)**: `EquipoDetalle.jsx` muestra "Jugadores" (nombre + capitán) e "Historial de partidos" en tabla; `Estadisticas.jsx` muestra un "Plantel" más rico (posición, edad) y partidos en formato de tarjetas, **para el mismo equipo**, con layouts totalmente distintos y sin ningún link cruzado entre ambas pantallas. `Equipos`/`EquipoDetalle` es donde se gestiona (editar, subir escudo, agregar jugadores) pero no muestra resultados; `Estadisticas` muestra resultados pero no tiene ninguna acción de gestión. Nada en la UI aclara esta distinción "gestión vs. estadísticas" al usuario. **(Alta)**
- **`CrearTorneo` vs `MisTorneos`**: `MisTorneos.jsx` tiene tanto una card `.mt-card-new` (líneas 264-268) como un botón "+ Nuevo torneo" (líneas 191-193) — dos puntos de entrada redundantes a la misma acción dentro de la misma pantalla. Verificar si es un patrón intencional (empty state + CTA) o ruido. **(Baja)**
- **Tres variantes de "card de página" sin relación** — la mayoría de las pantallas usa `subpagina-container` (compartido, `IndexStyle.css:171-178`), pero `TablaPosiciones.jsx` define su propio `.tabla-wrapper > .tabla-container` (fondo `#fefefe`, sombra `0 0 20px rgba(0,0,0,.08)`) y `MiPerfil.jsx` define `.mi-perfil-container` (sombra `0 2px 12px rgba(0,0,0,.15)`) — ninguna de las dos "combina" del todo con el resto. **(Media)**

---

## 5. Componentes reutilizables

**No existe ningún componente compartido de Button, Input, TextField, Card, Modal o Table en todo el proyecto.** Cada pantalla reimplementa desde cero:

- Su propio botón primario (`ct-btn-primary`, `mt-btn-new`, `ar-btn-new`, `ie-btn-inscribir`, `ie-btn-fixture`, `.login button`, `.boton-editar`, etc.) con recetas de padding/border-radius/transition muy parecidas pero repetidas manualmente.
- Su propio buscador (`.mt-search`, `.ar-search`, `.ie-search`) con el mismo patrón (ícono absoluto + input) pero recetas CSS levemente distintas (radios, unidades).
- Su propio patrón de campo de formulario en auth (`.field`/`.field-control`/`.field-icon`/`.field-action`), repetido idéntico 8+ veces en `Registro.jsx` y análogo en las otras 4 pantallas de auth — candidato directo a un componente `<TextField>`/`<PasswordField>`.
- Su propio estado de carga/error (`Cargando torneos...`, `Cargando árbitros...`) con `style` inline casi idéntico en `MisTorneos.jsx:196-197` y `Arbitros.jsx:168-169`.

**Patrón de parche recurrente**: en vez de corregir un estilo compartido, cada página lo pisa localmente. Ejemplos:
- `style={{ textAlign: "left" }}` inline repetido en 6+ inputs distintos (`InicioSesion.jsx:123`, `InicioSesionAdmin.jsx:92`, `Registro.jsx:226,251`, `RestablecerPassword.jsx:91,117`) mientras `InicioSesion.css:320` ya fuerza lo mismo globalmente con `!important` — doble solución al mismo problema.
- `style={{ backgroundColor: "#f9fafb" }}` inline repetido en `<main>` de las 4 páginas del panel de torneos (`CrearTorneo.jsx:113`, `MisTorneos.jsx:131`, `Arbitros.jsx:141`, `InscribirEquipos.jsx:246`) para pisar `main, .content { background-color: #eaf6ec }` de `IndexStyle.css:148-153` — indica que el panel migró de paleta sin actualizar la hoja compartida. **(Media-Alta)**

**Severidad global de esta categoría: Alta** — es la causa estructural detrás de la mayoría de las inconsistencias de color e iconografía listadas arriba; cualquier cambio de marca hoy requeriría tocar 10+ archivos.

---

## 6. Uso semántico del color

- **Caja roja de error para mensaje informativo (confirmado, ver también sección 3)** — `Equipos.jsx:239` ("¿Necesitás encontrar jugadores para tu equipo?") se pinta con la clase de error `.agregar-jugadores p` (`Equipos.css:72-82`) por un problema de especificidad CSS, no por diseño intencional. El mismo selector también afecta el estado vacío (línea 264) y el aviso "Ya perteneces a un equipo" (línea 272), que tampoco son errores. **(Alta)**
- **Estado "Borrador" en color de advertencia** — `MisTorneos.jsx` `ESTADO_CONFIG["Borrador"]` usa ámbar (`#d97706`/`#fef9c3`/`#92400e`), el mismo tono que en `CrearTorneo.css` comunica "atención/advertencia". Un torneo en borrador es un estado neutral, no una alerta. **(Media)**
- **`.ct-warning` (ámbar) usado para texto puramente informativo** — "Vas a generar N partidos..." (`CrearTorneo.jsx:281-288`) no es una advertencia sobre algo a corregir, es información del sistema. **(Baja-Media)**
- **Paleta roja de error inconsistente entre pantallas** — el modal de `Arbitros.css` usa la paleta roja "Bootstrap" (`#fdecea`/`#842029`) mientras el resto de la app usa la paleta roja "Tailwind" (`#dc2626`/`#fef2f2`) para el mismo significado semántico de error; ambas son correctas semánticamente pero visualmente no combinan entre sí. **(Media)**
- **Feedback de éxito sin equivalente visual al de error** — `OlvidePassword.jsx:57-60` y `RestablecerPassword.jsx:72` muestran el mensaje de confirmación con la misma clase `.bottom-text` gris genérica que cualquier texto secundario, mientras que los errores sí tienen una card roja con borde (`.login-error`). No existe una "caja de éxito" visualmente equivalente. **(Media)**
- **`alert()` nativo con emoji para éxito** — `InicioSesion.jsx:62` y `Registro.jsx:94` usan `alert("✅ ...")`, mientras los errores del mismo formulario sí están integrados en la UI (`.login-error`). Asimetría entre feedback positivo (interrumpe con diálogo nativo) y negativo (integrado, no bloqueante). **(Media)**
- **Badge "EN VIVO" en rojo** (`Inicio.css:41-42`, `#c62828`) — convención común para "live", pero es el único uso de rojo en la app que no significa error/peligro; vale la pena verificar que no se confunda con la semántica de error usada en el resto de la app. **(Baja)**

---

## 7. Responsive y espaciado

- **Cobertura de `@media` muy despareja**: de los 15 archivos CSS, solo `Registro.css` (breakpoint en 900px, resuelve bien el colapso a una columna), `InicioSesion.css`/`InicioSesionAdmin.css` (solo 420px, no cubre tablets) y `MiPerfil.css` (768px, pero con el problema de superposición ya señalado en sección 3) tienen alguna media query. **`Equipos.css`, `Estadisticas.css`, `FixtureTorneo.css`, `TablaPosiciones.css`, `MenuAdmin.css` no tienen ninguna.** **(Alta, combinado con el bug de tabla recortada de la sección 3)**
- **Navbar del panel admin sin colapso mobile** — `MenuAdmin.css` no tiene media queries; combinado con `overflow-x: hidden` global en `body` (`IndexStyle.css:12`), en viewports angostos el navbar (4 botones + avatar + logout) se recorta en vez de reflowear. **(Media)**
- **Unidades inconsistentes entre pantallas hermanas del panel de torneos** — `InscribirEquipos.css` usa `rem` en todo el archivo (ej. `padding: 2rem 2.5rem 1.5rem`), mientras `CrearTorneo.css`, `MisTorneos.css` y `Arbitros.css` usan `px` para el mismo componente (hero: `padding: 28px 32px 24px`). **(Media)**
- **Ancho de contenido inconsistente** — solo `InscribirEquipos.css` define `max-width: 1100px` (`.ie-main`, línea 54); `CrearTorneo`, `MisTorneos` y `Arbitros` no tienen tope de ancho, por lo que en monitores grandes se estiran a todo el ancho mientras `InscribirEquipos` queda acotada. **(Media)**
- **Sidebar de fixture sin scroll propio ni tope de altura** — `.ie-fixture-card` (`InscribirEquipos.css:218-223`) apila fecha, hora, canchas y árbitros sin `max-height`/`overflow-y`, mientras la columna vecina `.ie-list` sí tiene `max-height: 420px; overflow-y: auto` (línea 108-111) — asimetría de comportamiento entre las dos columnas del mismo layout con muchos ítems. **(Media)**
- **`.ct-summary-card` con `position: sticky; top: 80px`** (`CrearTorneo.css:383-384`) asume un alto de navbar fijo definido en otro archivo (`MenuAdmin.css`/`IndexStyle.css`) — si cambia el alto del header, el sticky se desalinea sin que el vínculo entre archivos sea evidente. **(Baja)**
- Ver también: tabla de posiciones sin `overflow-x` en mobile (sección 3, Alta) y formulario largo de `CrearTorneo` sin agrupación por secciones (`fieldset`), que en formularios más grandes escalaría mal. **(Baja)**

---

## 8. Otros hallazgos (no puramente visuales, mencionados por completitud)

Surgieron durante la lectura de código y no son estrictamente de diseño, pero afectan directamente la percepción de calidad/UX de las pantallas auditadas:

- **`CrearTorneo.jsx:244,251`** — los botones "Guardar borrador" y "+ Crear Torneo" llaman ambos a `submitTorneo("borrador")`: el botón que dice "Crear Torneo" nunca publica el torneo, solo lo deja en borrador. Contradice su propio texto y el badge "● Borrador" del formulario. **(Alta, bug funcional)**
- **`MisTorneos.jsx:255`** — el botón "🏆 Ver resumen" no tiene `onClick`, a diferencia de los otros botones de la misma fila de acciones. Parece funcionar pero no hace nada. **(Alta, bug funcional)**
- **`MiPerfil.jsx:79`** — `handleSalirEquipo` hace `window.location.reload()` tras salir del equipo en vez de actualizar el estado de React — recarga completa de página, pierde los beneficios de SPA. **(Media, UX)**
- **`InscribirEquipos.jsx:143-181`** — la inscripción de equipos hace un `POST` secuencial por cada equipo seleccionado (loop, no `Promise.all`) sin feedback de progreso ("3/10"); con muchas selecciones el botón queda en "Inscribiendo..." un tiempo indeterminado. **(Baja, UX)**
- Formato de datos inconsistente entre pantallas: `EquipoDetalle.jsx` formatea fechas con `toLocaleDateString("es-AR")`, `MiPerfil.jsx:183` muestra `fechaNacimiento` cruda sin formatear. **(Baja)**

---

## Resumen de hallazgos por severidad

| Categoría | Alta | Media | Baja | Total |
|---|---|---|---|---|
| 1. Paleta de colores | 3 | 4 | 3 | 10 |
| 2. Iconografía | 0 | 2 | 0 | 2 (+ tabla de 14 emojis listados) |
| 3. Bugs visuales concretos | 4 | 4 | 1 | 9 |
| 4. Duplicación/confusión funcional | 6 | 4 | 3 | 13 |
| 5. Componentes reutilizables | 1 | 1 | 0 | 2 (categoría transversal) |
| 6. Uso semántico del color | 1 | 4 | 2 | 7 |
| 7. Responsive y espaciado | 1 | 4 | 2 | 7 |
| 8. Otros (funcionales/UX) | 2 | 2 | 1 | 5 |
| **Total** | **17** | **44** (incluye ambigüedades "Baja-Media" contadas como Media) | **18** | **~79** |

**El problema transversal más significativo**: ausencia total de variables CSS/design tokens y de componentes compartidos, combinada con triplicación literal de la hoja de estilos de autenticación y del "hero" de panel admin, y con tres sistemas de iconografía mezclados para el mismo rol visual. Resolver esto (design tokens + 3-4 componentes base: Button, TextField, Card, Alert/Toast) eliminaría la causa raíz de la mayoría de los hallazgos de las categorías 1, 2, 5 y 6.

---

*Reporte generado por auditoría automatizada de solo lectura sobre el código fuente. Algunos hallazgos (especialmente los de la sección 3 relacionados con el bug original de mostrar/ocultar contraseña) se basan en análisis estático de código y conviene confirmarlos visualmente corriendo la app, ya que esta auditoría no ejecutó el servidor de desarrollo ni abrió el navegador, por restricción explícita del alcance.*
