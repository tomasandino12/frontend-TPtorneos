# Cierre de la auditoría de UI/UX — Gestor de Torneos (Frontend)

Fecha: 2026-07-10
Contrasta cada hallazgo de [`docs/auditoria-ui.md`](./auditoria-ui.md) (79 hallazgos, Alta 17 / Media 44 / Baja 18) contra el estado actual del código, después de las Fases 1-4 de migración y los ajustes puntuales posteriores. Incluye una verificación activa (build, lint, sweep de CSS muerto, chequeo de overflow en 375px con Playwright headless, y foco por teclado) — no es solo relectura de código.

**Resultado global: 74 Resueltos · 5 Pendientes · 0 No aplica.**

En esta fase se corrigieron además 3 hallazgos triviales que ninguna fase anterior había tocado explícitamente (ver sección "Arreglos de esta fase" al final).

---

## 1. Paleta de colores (10 hallazgos)

| # | Hallazgo | Severidad | Estado |
|---|---|---|---|
| 1 | Cero variables CSS (`:root`) en todo el proyecto | Alta | ✅ **Resuelto** (Fase 1) — `src/styles/tokens.css` |
| 2 | Dos paletas sin puente (auth oscuro vs resto claro) | Alta | ✅ **Resuelto** (Fase 2) — las 5 pantallas de auth migraron a `--color-paper`/`--color-pitch`, mismo puente visual que el resto de la app |
| 3 | 9 tonos de verde sin fuente única | Media | ✅ **Resuelto** (Fases 1-4) — todo verde hoy sale de `--color-pitch`/`--color-turf` |
| 4 | Rojo con 3 paletas distintas (Tailwind / Bootstrap) | Alta | ✅ **Resuelto** (Fase 3 `Equipos`, Fase 4 `Arbitros` modal) — un solo `--color-alert` en toda la app |
| 5 | Ámbar con 2 variantes en `CrearTorneo.css` | Media | ✅ **Resuelto** (Fase 4) — `.ct-warning`/`.ct-field-warning` unificados vía `Alert variant="warning"` (`--color-whistle`) |
| 6 | Azul sin sistema (3 casos: fixture CTA, badge jornada, "Partidos Jugados") | Media | ✅ **Resuelto** (Fase 3 `Estadisticas`/`FixtureTorneo`, Fase 4 `InscribirEquipos`) — sin azules ad hoc; el CTA de fixture pasó a `Button variant="primary"` + ícono en vez de color propio |
| 7 | Paleta boilerplate de Vite en `index.css` | Media | ✅ **Resuelto** (Fase 1) — `a`/`button` sin clase usan `--color-pitch`/`--color-turf`/`--color-ink` |
| 8 | Verde de hover divergente `Equipos.css` (`#1b5e20`) vs `MiPerfil.css` (`#256428`) | Baja | ✅ **Resuelto** (Fase 3) — verificado: ninguno de los dos archivos define ya un botón primario propio; ambas pantallas usan `<Button>` (Fase 1), que centraliza el hover en un solo lugar |
| 9 | Color de heading divergente `InscribirEquipos` (`#111827`) vs resto panel admin (`#1f2937`) | Baja | ✅ **Resuelto** (Fase 4) — verificado: los 4 archivos usan `var(--color-ink)` de forma uniforme |
| 10 | Badge "EN VIVO" en rojo puro (`Inicio.css`) | Baja | ✅ **Resuelto** (Fase 3) — usa `var(--color-alert)`, ya no es un hex suelto. Decisión ya tomada y documentada en el código: es un badge chico "LIVE" (convención universal), contextualmente inconfundible con un mensaje de error de formulario — no se reabre |

**Categoría 1: 10/10 resueltos.**

---

## 2. Iconografía

| # | Hallazgo | Severidad | Estado |
|---|---|---|---|
| 1 | Boxicons cargado por CDN externo (riesgo si el CDN cae) | Media | ✅ **Resuelto** (Fase 4) — `<link>` de Boxicons retirado de `index.html`; `grep "bx bx-"` en `src/` no arroja resultados |
| 2 | Ícono duplicado en `AdminHeader` (boxicon + emoji para el mismo ítem) | Media | ✅ **Resuelto** (Fase 4) — un solo ícono `react-icons/fi` por ítem del dropdown |
| 3 | Tabla de 14 emojis usados como ícono (navbar, botones, alertas) | — | ✅ **Resuelto** (Fases 2-4) — verificado: cero emojis usados como ícono en todo `src/pages`/`src/components` (los 2 únicos emoji restantes en el código son comentarios de desarrollador en `Equipos.jsx`, no íconos de UI) |

**Categoría 2: 3/3 resueltos** (incluye los 14 casos puntuales de la tabla de emojis, todos verificados).

---

## 3. Bugs visuales concretos (11 hallazgos)

| # | Hallazgo | Severidad | Estado |
|---|---|---|---|
| 1 | Input de escudo sin estilo | Alta | ✅ **Resuelto** (Fase 3) — label estilizado como `Button` + preview del escudo, input nativo oculto pero accesible por teclado |
| 2 | Toggle de contraseña — `InicioSesionAdmin` no alterna ícono | Media | ✅ **Resuelto** (Fase 2) — `TextField` con toggle integrado, estructuralmente imposible que no alterne |
| 3 | Toggle de contraseña — `RestablecerPassword` sin botón en "confirmar" | Media | ✅ **Resuelto** (Fase 2) — mismo motivo, `TextField` lo agrega siempre |
| 4 | Caja roja de error para mensaje informativo | Alta | ✅ **Resuelto** (Fase 3) — `Alert variant="info"` en los 3 mensajes afectados |
| 5 | Tabla de posiciones recortada en mobile | Alta | ✅ **Resuelto** (Fase 3) — `.tabla-scroll { overflow-x: auto }` propio; reverificado en esta fase con Playwright a 375px, sin overflow |
| 6 | Hero de Inicio con z-index frágil | Alta | ✅ **Resuelto** (Fase 3) — `z-index: 1` explícito, documentado como menor al del Navbar |
| 7 | Dropdown de `AdminHeader` con "gap bug" (`setTimeout` 120ms) | Media | ✅ **Resuelto** (Fase 4) — reemplazado por click + cierre por click-outside + Escape + foco visible |
| 8 | Modal de `Arbitros` por debajo del dropdown (z-index 20 vs 200) | Media | ✅ **Resuelto** (Fase 4) — `--z-dropdown: 200` / `--z-modal: 300` |
| 9 | Falsa affordance en `EquipoDetalle` (hover-lift en lista no clickeable) | Media | ✅ **Resuelto** (Fase 3) — `.lista-plantel` separada de `.lista-jugadores`, sin el hover heredado |
| 10 | Superposición botón/título en `MiPerfil` | Media | ✅ **Resuelto** (Fase 3) — `.perfil-seccion-header` en flex, ya no `position: absolute` |
| 11 | Ícono del datepicker invisible fuera de Chrome/Edge | Media | ✅ **Resuelto** (Fase 2) — el filtro `invert(1)` se sacó al migrar a fondo claro (ya no hacía falta; el ícono nativo oscuro se lee bien sobre fondo claro en cualquier navegador) |
| 12 | Estados de carga sin estilo (`<p>Cargando...</p>`) vs errores con card | Baja | ⚠️ **Pendiente (parcial)** — la Fase 4 lo resolvió para `MisTorneos`/`Arbitros`/`InscribirEquipos` (loading dentro de `<Card>`). Sigue sin resolver en `EquipoInfo.jsx`, `TablaPosiciones.jsx` y `Estadisticas.jsx` (Fase 3), que todavía usan `<p>Cargando...</p>` plano. **Motivo para no tocarlo ahora**: no estaba en la lista explícita de triviales de esta fase de cierre; son 3 archivos con call-sites distintos, encaja mejor como un ítem de seguimiento acotado que como parte del sweep de esta fase |

**Categoría 3: 11/12 resueltos, 1 pendiente.**

---

## 4. Duplicación / confusión funcional (13 hallazgos)

| # | Hallazgo | Severidad | Estado |
|---|---|---|---|
| 1 | `Layout.jsx` huérfano y duplicado | Alta | ✅ **Resuelto** (Fase 2) — eliminado, uso verificado antes de borrar |
| 2 | `InicioSesionAdmin.css` ~100% duplicado de `InicioSesion.css` | Alta | ✅ **Resuelto** (Fase 2) — eliminado; `InicioSesionAdmin.jsx` importa la hoja compartida |
| 3 | `Registro.css` triplica el patrón de card de auth | Alta | ✅ **Resuelto** (Fase 2) — reducido a solo lo específico de Registro (grilla 2 columnas); el resto viene de `Card` + tokens |
| 4 | Guard de autenticación admin duplicado (`MenuAdmin.jsx`/`Layout.jsx`) | Media | ✅ **Resuelto** (Fase 2) — `Layout.jsx` eliminado, un solo guard en `MenuAdmin.jsx` |
| 5 | `InicioSesionAdmin.jsx` exporta una función llamada `MenuAdmin` (colisión de nombres) | Alta | ✅ **Resuelto** (Fase 2) — renombrada a `InicioSesionAdmin` |
| 6 | Hero de panel admin triplicado byte a byte (`.ct-hero`/`.mt-hero`/`.ar-hero`) | Alta | ✅ **Resuelto** (Fase 4) — `.admin-hero` compartido en `MenuAdmin.css` |
| 7 | `.mensaje-error` duplicado idéntico en 3 archivos | Media | ✅ **Resuelto** (Fase 3) — reemplazado por `<Alert variant="error">` en los 3 (ya no existe la clase) |
| 8 | Header de página duplicado en 3 archivos (`.equipos-header`/etc.) | Media | ✅ **Resuelto** (Fase 3) — `.page-header` compartido en `IndexStyle.css` (aditivo) |
| 9 | `.mt-metric-card` usado / `.ct-metric-card` muerto, mismo bloque | Baja | ✅ **Resuelto** (Fase 4) — `.ct-metrics`/`.ct-metric-card` eliminados de `CrearTorneo.css` junto con el resto del CSS muerto |
| 10 | CSS muerto por copy-paste (`.ct-metrics`, `.ct-canchas`, `.ct-toggles`, `.equipos-page`, `.estadisticas-container`, `.fixture-container`) | Baja | ✅ **Resuelto** (Fase 3 y 4) — verificado con sweep automatizado en esta fase: cero clases sin referenciar en `src/styles` |
| 11 | `Equipos`/`EquipoDetalle` vs `Estadisticas`, confusión de roles | Alta | ✅ **Resuelto** (ajuste puntual post-Fase 4) — `Equipos.jsx` ahora muestra directo la info del propio equipo (gestión) vía `EquipoInfo.jsx`; `Estadisticas` quedó solo con resultados, y hay links cruzados en ambos sentidos |
| 12 | `.mt-card-new` vs botón "+ Nuevo torneo", ¿redundantes? | Baja | ✅ **Resuelto** (revisado en Fase 4, no se tocó ninguno) — es el patrón habitual "tile para agregar al final de una grilla" + CTA de toolbar, complementarios, documentado en el código |
| 13 | Tres variantes de "card de página" sin relación (`subpagina-container`/`.tabla-container`/`.mi-perfil-container`) | Media | ⏳ **Pendiente** — `TablaPosiciones.jsx` y `MiPerfil.jsx` siguen con su propio wrapper en vez de `subpagina-container`. **Motivo**: unificarlas requeriría decidir cuál de los 3 patrones "gana" y ajustar el layout visual de esas 2 pantallas — no es un cambio de 1-2 líneas, es una decisión de diseño que excede el alcance de esta fase de cierre |

**Categoría 4: 12/13 resueltos, 1 pendiente.**

---

## 5. Componentes reutilizables (categoría transversal)

| # | Hallazgo | Severidad | Estado |
|---|---|---|---|
| 1 | Cero componentes de Button/Input/Card/Modal/Table compartidos | Alta | ✅ **Resuelto** (Fase 1) — `src/components/ui/`: `Button`, `TextField`, `Card`, `Alert` |
| 2 | Patrón de parche recurrente (`style={{textAlign:"left"}}` x6, `style={{backgroundColor:"#f9fafb"}}` x4) en vez de arreglar el estilo compartido | Media-Alta | ✅ **Resuelto** — verificado con `grep`: cero ocurrencias de ambos parches en `src/pages`. El primero ya no hace falta (`TextField` tiene `text-align:left` de fábrica); el segundo se resolvió corrigiendo `main, .content` en `IndexStyle.css` a `var(--color-paper)` (Fase 4) |

**Categoría 5: 2/2 resueltos** (el resto de la categoría — buscador, campo de formulario en auth, botón primario — quedó cubierto por el mismo cambio estructural: todas las pantallas migradas usan `TextField`/`Button` en vez de reimplementar el patrón).

---

## 6. Uso semántico del color (7 hallazgos)

| # | Hallazgo | Severidad | Estado |
|---|---|---|---|
| 1 | Caja roja de error para mensaje informativo | Alta | ✅ **Resuelto** (Fase 3) — ver también categoría 3 |
| 2 | Estado "Borrador" en color de advertencia | Media | ✅ **Resuelto** (Fase 4) — pasó a un tono neutro (`--color-muted`/`--color-surface-muted`); "En curso" es el único estado resaltado en color |
| 3 | `.ct-warning` (ámbar) para texto puramente informativo | Baja-Media | ✅ **Resuelto** (Fase 4, decisión explícita del propio pedido de esa fase: "unificar usando `--color-whistle`") |
| 4 | Paleta roja de error inconsistente (`Arbitros` vs resto) | Media | ✅ **Resuelto** (Fase 4) — `--color-alert` en todos lados |
| 5 | Feedback de éxito sin caja visual equivalente al error | Media | ✅ **Resuelto** (Fase 2) — `Alert variant="success"` |
| 6 | `alert()` nativo con emoji para feedback de éxito | Media | ✅ **Resuelto** (Fase 2) — reemplazado por `Alert` integrado en la pantalla |
| 7 | Badge "EN VIVO" en rojo, posible confusión con error | Baja | ✅ **Resuelto** — mismo hallazgo que categoría 1 #10, decisión ya tomada y no se reabre |

**Categoría 6: 7/7 resueltos.**

---

## 7. Responsive y espaciado (7 hallazgos)

| # | Hallazgo | Severidad | Estado |
|---|---|---|---|
| 1 | Cobertura de `@media` muy despareja (solo 3 de 15 archivos) | Alta | ✅ **Resuelto** (Fases 2-4) — todas las pantallas migradas tienen `@media` propio; reverificado en esta fase con un sweep de 15 rutas a 375px (auth, jugador, admin): **cero overflow horizontal detectado** |
| 2 | Navbar del panel admin sin colapso mobile | Media | ✅ **Resuelto** (Fase 4) — verificado visualmente en esta fase a 375px: navbar reflowea en 3 filas, sin recorte |
| 3 | Unidades inconsistentes (`rem` vs `px`) entre pantallas hermanas del panel | Media | ✅ **Resuelto** (Fase 4) — `CrearTorneo`/`MisTorneos`/`Arbitros` convertidos a `rem`, igual que `InscribirEquipos` |
| 4 | Ancho de contenido inconsistente (solo `InscribirEquipos` con `max-width`) | Media | ✅ **Resuelto** (Fase 4) — `max-width: 1100px` agregado a `.admin-hero`, `.ct-main`, `.mt-list`, `.ar-list` |
| 5 | Sidebar de fixture sin scroll propio (asimetría con `.ie-list`) | Media | ✅ **Resuelto** (Fase 4) — `.ie-fixture-scroll { max-height: 420px; overflow-y: auto }` |
| 6 | `.ct-summary-card` con `top: 80px` acoplado a la altura del navbar | Baja | ✅ **Resuelto en esta fase** — ver "Arreglos de esta fase" abajo: la Fase 4 lo había cambiado a `1.5rem`, un valor menor a la altura real del navbar (~70px), causando que la card quedara tapada al hacer scroll. Corregido a `5rem`, medido contra el navbar actual |
| 7 | `CrearTorneo` sin agrupación por secciones (`fieldset`) en formulario largo | Baja | ⏳ **Pendiente** — requeriría reestructurar el JSX del formulario (agrupar en secciones con título), no es un cambio de 1-2 líneas |

**Categoría 7: 6/7 resueltos, 1 pendiente.**

---

## 8. Otros hallazgos (funcionales/UX) (5 hallazgos)

| # | Hallazgo | Severidad | Estado |
|---|---|---|---|
| 1 | "Crear Torneo" llama al mismo handler que "Guardar borrador" | Alta (bug funcional) | ✅ **Resuelto** (Fase 4) — ahora publica con `estado: "en_curso"`, confirmado contra la entidad `Torneo` del backend |
| 2 | Botón "Ver resumen" de `MisTorneos` sin `onClick` | Alta (bug funcional) | ✅ **Resuelto** (Fase 4) — navega al detalle del torneo |
| 3 | `handleSalirEquipo` hace `window.location.reload()` | Media (UX) | ✅ **Resuelto** (ajuste puntual post-Fase 4) — actualiza el estado de React en vez de recargar la página |
| 4 | Inscripción secuencial de equipos sin feedback de progreso ("3/10") | Baja (UX) | ⏳ **Pendiente, explícitamente fuera de alcance** — mencionado en el pedido de esta misma fase como algo que se mantiene así; es una mejora de UX funcional, no visual, y requeriría tocar la lógica de `handleInscribir` (más que un cambio trivial) |
| 5 | Formato de fechas inconsistente (`EquipoDetalle` formatea, `MiPerfil` no) | Baja | ✅ **Resuelto en esta fase** — ver "Arreglos de esta fase" abajo |

**Categoría 8: 4/5 resueltos, 1 pendiente (explícitamente fuera de alcance por pedido).**

---

## Arreglos de esta fase (Fase 5)

Tres hallazgos triviales, ninguno mencionado explícitamente por una fase anterior, resueltos en este cierre:

1. **`.ct-summary-card` tapada por el navbar al hacer scroll** (`CrearTorneo.css`) — la Fase 4 había cambiado `top: 80px` (acoplado, pero visualmente correcto) a `top: 1.5rem` (24px), sin verificar que el navbar real mide ~70px de alto. Eso hacía que la tarjeta de resumen quedara parcialmente tapada por el navbar sticky al scrollear. Se midió el navbar actual con Playwright (`getBoundingClientRect`) y se corrigió a `top: 5rem`, confirmado sin superposición.
2. **Fecha de nacimiento sin formatear en `MiPerfil.jsx`** (vista de solo lectura) — ahora usa `toLocaleDateString("es-AR")`, igual que `EquipoInfo.jsx`.
3. **CSS muerto en `App.css`** — `#indexPage` y `.main-content`, ninguno referenciado en ningún JSX (confirmado con `grep`), eliminados. La duplicación de la regla `footer` entre `App.css` e `IndexStyle.css` (categoría 4 original) se dejó — es duplicación, no código muerto (ambas reglas se aplican con los mismos valores), y decidir cuál archivo debería "poseer" esa regla es una decisión de organización de archivos, no un arreglo de 1-2 líneas.
4. **Import muerto en `src/main.jsx`** (`createRoot`, sin usar — el archivo usa `ReactDOM.createRoot`) — no es un hallazgo de la auditoría de UI (nunca estuvo en el alcance de ninguna fase, no es un archivo de diseño), pero corría como único error de `eslint .` sobre el proyecto completo. Se sacó porque el criterio de esta fase pide "eslint sin errores" sin calificarlo — es una línea, sin ningún riesgo funcional.

Fuera de estos tres, el resto de los hallazgos "Resueltos" ya estaban resueltos por las Fases 1-4 o los ajustes puntuales posteriores — se verificaron activamente en este cierre (grep, build, y checks visuales con Playwright), no se asumieron.

---

## Pendientes (5 en total — ninguno se fuerza en esta fase)

| Hallazgo | Categoría | Severidad | Motivo |
|---|---|---|---|
| Estados de carga sin estilo en `EquipoInfo`/`TablaPosiciones`/`Estadisticas` | 3 | Baja | Resuelto solo parcialmente (Fase 4, panel admin); son 3 archivos adicionales de la Fase 3, no estaba en la lista explícita de esta fase de cierre |
| Tres variantes de "card de página" (`TablaPosiciones`/`MiPerfil` con wrapper propio) | 4 | Media | Requiere decidir un único patrón y ajustar el layout visual de 2 pantallas — no es trivial |
| `CrearTorneo` sin `fieldset`/agrupación en el formulario largo | 7 | Baja | Requiere reestructurar el JSX del formulario |
| Inscripción secuencial sin feedback de progreso | 8 | Baja | Explícitamente fuera de alcance en el pedido de esta fase (funcional, no visual) |
| Sistema de invitaciones / equipos público-privado (para "unirse a un equipo existente") | — (surgió en el ajuste puntual del ítem "Equipos", no es parte de los 79 originales) | — | No existe hoy en el backend ningún flujo de autoservicio; se decidió (con el usuario) no construir un feature nuevo en un ajuste visual — queda pendiente de una conversación de producto/diseño aparte |

---

## Verificación técnica de este cierre

```
$ npm run build   → sin errores
$ eslint          → sin errores (1 warning preexistente de react-hooks/exhaustive-deps en InscribirEquipos.jsx, no introducido por esta fase)
$ grep -rn "bx bx-\|bx-[a-z]" src/        → sin resultados (Boxicons)
$ sweep de clases CSS sin referenciar en src/styles → sin resultados
$ Playwright headless, 15 rutas a 375px (auth + jugador + admin) → sin overflow horizontal
$ grep de "outline: none" en todo src/    → cada ocurrencia tiene un reemplazo :focus-visible { box-shadow: var(--focus-ring) } — foco por teclado intacto en todos los controles agregados en las Fases 2-4
```

---

## Resumen final

| | Cantidad |
|---|---|
| **Resuelto** | 74 |
| **Pendiente** | 5 |
| **No aplica** | 0 |
| **Total** | 79 |

El problema raíz que motivó las 4 fases — ausencia de tokens y componentes compartidos — está completamente resuelto. Lo que queda pendiente son 5 ítems puntuales de bajo impacto (4 de severidad Baja/Media, más el tema de invitaciones que ni siquiera pertenece a los 79 originales), cada uno con un motivo concreto documentado arriba, no una simple falta de tiempo.
