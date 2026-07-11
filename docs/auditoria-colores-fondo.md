# Auditoría: fondo de página vs. recuadro "hero" — causa raíz real

**Tipo:** diagnóstico puro, sin cambios de código. Evidencia extraída con Playwright + Chrome DevTools Protocol (`CSS.getMatchedStylesForNode`, que devuelve la resolución de cascada real del navegador, no una inferencia) contra un servidor de desarrollo vivo (`vite dev`), navegando con una cuenta de prueba registrada para esta auditoría (sin tocar credenciales ni datos de usuarios reales; las pantallas que dependen de un torneo activo se verificaron mockeando la respuesta de la API con `page.route`).

## Resumen ejecutivo

Las 3 correcciones anteriores (Equipos, Estadísticas, Fixture, Mi Perfil, Tabla de Posiciones) **están, en el estado actual del código, correctamente resueltas**: verifiqué con `getComputedStyle` real que el fondo de página computa a marfil (`--color-paper`, `#F5F1E6`) y el recuadro hero computa a verde pálido (`--color-grass`, `#EAF6EC`) en las 5 pantallas, sin ninguna regla en conflicto. No encontré ninguna causa de bug en esas 5 pantallas.

Lo que sí encontré, con evidencia igual de concreta, es la causa raíz real de por qué el problema "se sentía" no resuelto y probablemente iba a volver a aparecer:

1. **El panel admin nunca se tocó** (estaba fuera de alcance en los 3 intentos) y **tiene el mismo bug que el lado jugador tenía antes de la Fase de corrección**: `.admin-hero` (el recuadro hero de Mis Torneos, Crear Torneo y Arbitraje) usa `background: var(--color-success-bg)` en vez de `--color-grass` — exactamente el mismo error que tenía `.page-header` antes de corregirse. Confirmado con `getComputedStyle`: `rgb(225, 241, 228)`, que es `--color-success-bg`, no `--color-grass`.
2. **`--color-grass` (`#EAF6EC`) y `--color-success-bg` (`#E1F1E4`) son perceptualmente casi idénticos** (difieren en 5-9 unidades por canal RGB) pero cumplen roles distintos (uno es "soy un recuadro hero", el otro es "estoy comunicando éxito/estado positivo"). No hay ningún mecanismo (lint, naming, o consolidación) que impida que alguien tome el token equivocado — y **ya volvió a pasar en código nuevo, independiente de estas correcciones**: el modal "Transferir capitanía" agregado recientemente en `Equipos.css` usa `--color-grass` para el estado por defecto de una card y `--color-success-bg` para el estado "seleccionado" de esa misma card — dos colores casi indistinguibles usados para comunicar dos estados que necesitan distinguirse.

Esto es consistente con un patrón: cada intento corrigió la superficie que tenía delante (el lado jugador), pero la causa estructural (dos tokens casi-idénticos sin ninguna barrera que impida confundirlos) nunca se tocó, así que el mismo error sigue aaparenciendo en otras superficies del código — superficies que un usuario recorriendo "toda la app" para verificar la unificación sí va a ver.

---

## Tabla 1 — Pantallas con el patrón "fondo de página + recuadro hero" (jugador)

| Pantalla | Selector real del fondo | Regla ganadora (archivo:línea) | Valor computado (fondo) | Selector real del hero | Regla ganadora (archivo:línea) | Valor computado (hero) |
|---|---|---|---|---|---|---|
| **Tabla de Posiciones** (`/gestorTorneos`) | `.tabla-wrapper` | `TablaPosiciones.css:2` `.tabla-wrapper { background-color: var(--color-grass) }` | `rgb(234, 246, 236)` = `--color-grass` | *(no existe — ver nota)* | `.tabla-container` (`TablaPosiciones.css:11`) es blanca (`--color-surface`), no hay un recuadro hero verde separado | `rgb(255, 255, 255)` |
| **Equipos** (`/gestorTorneos/equipos`) | `.subpagina-container` | `IndexStyle.css:171` `.subpagina-container { background-color: var(--color-paper) }` — gana por especificidad de clase sobre `main, .content` (`IndexStyle.css:148`, selector de tipo, también matchea porque el propio elemento es un `<main>`) | `rgb(245, 241, 230)` = `--color-paper` | `.page-header` | `IndexStyle.css:186` `.page-header { background-color: var(--color-grass) }` | `rgb(234, 246, 236)` = `--color-grass` |
| **Estadísticas** (`/gestorTorneos/estadisticas`) | `.subpagina-container` | mismo que arriba | `rgb(245, 241, 230)` | `.page-header` | mismo que arriba | `rgb(234, 246, 236)` |
| **Fixture** (`/gestorTorneos/fixture`) | `.subpagina-container` | mismo que arriba | `rgb(245, 241, 230)` | `.page-header` | mismo que arriba | `rgb(234, 246, 236)` |
| **Mi Perfil** (`/gestorTorneos/miPerfil`) | `.MiPerfil` | `MiPerfil.css:2` `.MiPerfil { background-color: var(--color-paper) }` | `rgb(245, 241, 230)` = `--color-paper` | `.mi-perfil-container` | `MiPerfil.css:13` `.mi-perfil-container { background-color: var(--color-grass) }` — gana por especificidad de clase sobre `main, .content` (el elemento es `<main className="mi-perfil-container">`, matchea ambos selectores) | `rgb(234, 246, 236)` = `--color-grass` |

**Nota sobre Tabla de Posiciones**: no es solo "un color distinto a propósito" — es una estructura de **2 zonas** (fondo `.tabla-wrapper` + card de contenido blanca `.tabla-container`), no de 3 zonas como el resto (fondo + hero + cards). Nunca tuvo un recuadro hero separado del contenido; el título vive directamente dentro de la card blanca. Confirmado intacto, sin cambios, tal como se pidió.

Todas las reglas de esta tabla se verificaron con `CSS.getMatchedStylesForNode` (CDP): para cada elemento, esa es la ÚNICA regla con `background-color`/`background` que matchea (fuera de la ya mencionada colisión benigna `main, .content` vs. la clase específica, resuelta correctamente por especificidad en los 3 casos donde aplica). No hay ninguna otra regla en pugna.

## Tabla 2 — Pantallas de autenticación (5, mismo layout compartido: `InicioSesion.css`)

| Pantalla | Selector del fondo | Regla ganadora | Valor computado | ¿Tiene hero separado? |
|---|---|---|---|---|
| Inicio de sesión (`/`) | `.auth-page` | `InicioSesion.css:21` `var(--color-paper)` | `rgb(245, 241, 230)` | No — `.auth-card` es la `<Card>` blanca (`--color-surface` vía `.ui-card`, `Card.css`), el logo/título va dentro de esa misma card. No hay una tercera zona de color. |
| Registro (`/registro`) | `.auth-page` | igual | `rgb(245, 241, 230)` | igual |
| Olvidé mi contraseña (`/olvide-password`) | `.auth-page` | igual | `rgb(245, 241, 230)` | igual |
| Restablecer contraseña (`/restablecer-password`) | `.auth-page` | igual | `rgb(245, 241, 230)` | igual |
| Login admin (`/admin`) | `.auth-page` | igual | `rgb(245, 241, 230)` | igual |

Las 5 pantallas de auth están unificadas correctamente y no tienen el patrón de 3 zonas — es un patrón de 2 zonas (fondo + card), igual que Tabla de Posiciones pero por diseño, no por excepción.

## Tabla 3 — Panel admin (aplicando el mismo criterio fondo/hero)

| Pantalla | Selector del fondo | Regla ganadora | Valor computado (fondo) | Selector del hero | Regla ganadora | Valor computado (hero) |
|---|---|---|---|---|---|---|
| Menú Admin (`/menu-admin`) | `.admin-main-content` | `MenuAdmin.css:249` `.admin-main-content { background-color: var(--color-paper) }` (gana por especificidad sobre `main, .content`, mismo mecanismo que en Equipos) | `rgb(245, 241, 230)` = `--color-paper` ✅ | *(esta pantalla no tiene `.admin-hero`, es un dashboard de accesos directos)* | — | — |
| Mis Torneos (`/admin/torneos`) | `main` (elemento bare, sin clase — **no** usa `.admin-main-content`, esa clase es exclusiva de `MenuAdmin.jsx`) | `IndexStyle.css:148` `main, .content { background-color: var(--color-paper) }` | `rgb(245, 241, 230)` = `--color-paper` ✅ | `.admin-hero` | `MenuAdmin.css:350` **`.admin-hero { background: var(--color-success-bg) }`** | `rgb(225, 241, 228)` = `--color-success-bg` ❌ |
| Crear Torneo (`/admin/torneos/nuevo`) | `main` (bare) | igual | `rgb(245, 241, 230)` ✅ | `.admin-hero` | igual | `rgb(225, 241, 228)` ❌ |
| Arbitraje (`/admin/arbitros`) | `main` (bare) | igual | `rgb(245, 241, 230)` ✅ | `.admin-hero` | igual | `rgb(225, 241, 228)` ❌ |

**Esto es un hallazgo real, no un matiz**: el fondo de página del panel admin SÍ está unificado en marfil (correcto). Pero el recuadro hero de las 3 pantallas que lo tienen (Mis Torneos, Crear Torneo, Arbitraje — todas comparten el bloque `.admin-hero` de `MenuAdmin.css:350-357`) usa `--color-success-bg`, no `--color-grass`. Contra un fondo marfil, ambos verdes son sutilmente distintos así que el recuadro SÍ se distingue del fondo (no está "perdido" como pasaba en el bug original del lado jugador) — pero es el token semánticamente incorrecto, y es la prueba viva de que este mismo error de "tomé el verde que no era" sigue sin corregirse en una parte entera de la app que ningún intento anterior tocó.

## Lista completa de tokens verdes / marfil-beige en `tokens.css`

| Token | Hex | Tono | Dónde se usa hoy (archivo:selector) |
|---|---|---|---|
| `--color-pitch` | `#1F5233` | Verde cancha oscuro (marca) | Decenas de usos como color de texto/borde/botón primario en casi todos los `.css` del proyecto — no es confundible con los tonos pálidos de abajo. |
| `--color-turf` | `#3F8452` | Verde cancha medio | Hover/acentos/interacción — tampoco confundible, es notablemente más saturado. |
| `--color-grass` | `#EAF6EC` | Verde pálido | `IndexStyle.css:188` (`.page-header`), `MiPerfil.css:18` (`.mi-perfil-container`), `TablaPosiciones.css:2` (`.tabla-wrapper`), `InicioSesion.css:46` (color de texto del badge admin, no fondo), `Equipos.css:452` (`.transferir-capitania-card`, estado normal). |
| `--color-success-bg` | `#E1F1E4` | Verde pálido (semántico "éxito") | `Alert.css:24` (`Alert variant="success"`), `Navbar.css:68,89` (link activo del navbar jugador), `Estadisticas.css:86` (tarjeta "partido ganado"), `MenuAdmin.css:110,208,220,321,351` (icono de card, dropdown, **y `.admin-hero`**), `MisTorneos.css:291`, `Arbitros.css:52`, `InscribirEquipos.css:95,159`, `Equipos.css:465` (`.transferir-capitania-card.seleccionado`, estado seleccionado). |
| `--color-paper` | `#F5F1E6` | Marfil cálido | `IndexStyle.css:152,175` (`main`/`.content`, `.subpagina-container`), `MiPerfil.css:3` (`.MiPerfil`), `MenuAdmin.css:249` (`.admin-main-content`), `InicioSesion.css:21` (`.auth-page`). |
| `--color-surface-muted` | `#EFE8D6` | Beige/marfil oscurecido (no verde) | Hover sobre `--color-surface`, filas zebra — familia marfil, no verde; no se confunde con los de arriba porque no tiene tinte verde. |
| `--color-border` | `#DCD3BC` | Beige (no verde) | Bordes — misma familia marfil que `--color-surface-muted`, mencionado por completitud aunque no interviene en el problema de fondo/hero. |

**El par que importa es `--color-grass` (`#EAF6EC`) vs. `--color-success-bg` (`#E1F1E4`)** — ambos "verde pálido", diferencia de 5-9 unidades RGB por canal, ningún otro par de la tabla se acerca a ese nivel de similitud. Todos los demás tokens verdes (`--color-pitch`, `--color-turf`) son claramente distintos a simple vista.

## Orden de imports / carga de hojas de estilo

Cada página importa su propio `.css` directamente en el archivo del componente (ej. `Equipos.jsx` importa `IndexStyle.css` y `Equipos.css`; no hay un punto central único de import de estilos salvo `App.jsx` → `App.css`, que no toca ninguno de los archivos de esta auditoría). Como todos los componentes de ruta se importan de forma estática al principio de `App.jsx` (no hay `React.lazy`), Vite en modo desarrollo inyecta un `<style>` por cada módulo CSS la primera vez que se evalúa, seguiendo el orden de ese árbol de imports estático.

Inspeccioné `document.styleSheets` en vivo tras navegar por toda la app: se observan **entradas duplicadas y con contenido parcial para el mismo archivo** (por ejemplo, dos fragmentos separados de `IndexStyle.css`, uno empezando en `* { text-decoration: none... }` y otro en `html, body { height: 100%... }`). Confirmé con `CSS.getMatchedStylesForNode` que, en el estado actual, **las entradas duplicadas contienen exactamente el mismo valor** (nunca un valor viejo compitiendo con uno nuevo) — así que hoy esto no es la causa de ningún resultado incorrecto. Es un comportamiento conocido del HMR de Vite en modo desarrollo (puede dejar `<style>` duplicados/parciales en un servidor de desarrollo de larga duración que fue recargando módulos repetidamente), y **no existe en el build de producción** (`vite build` genera un único archivo CSS deduplicado — confirmado en corridas anteriores de `npm run build`). Lo dejo documentado como hallazgo porque el método lo pedía explícitamente, pero no es la causa raíz: no cambia qué regla gana hoy.

## Estilos inline

Grep de `backgroundColor`/`background:` en JSX de todo `src/`: los únicos usos son el color de fallback del escudo de un equipo (`EquipoInfo.jsx:369`, `InscribirEquipos.jsx:317`, un cuadrado de color arbitrario del equipo, no relacionado a fondo/hero) y dos badges de estado de torneo en `MisTorneos.jsx` (elementos chicos, no la página ni el hero). Ninguno interviene en el fondo de página ni en el recuadro hero de ninguna pantalla auditada.

## Diagnóstico de causa raíz

**No es un problema de CSS roto en las pantallas ya corregidas.** Las 5 pantallas del lado jugador que fueron objeto de los 3 intentos anteriores están, ahora mismo, resueltas correctamente y verificadas con valores computados reales.

**La causa raíz real es doble:**

1. **Alcance parcial, no bug residual**: los 3 intentos anteriores excluyeron explícitamente el panel admin de su alcance (confirmado leyendo los cierres de fases anteriores). El panel admin nunca recibió la corrección — y tiene, ahora mismo, el mismo error que el lado jugador tenía antes de corregirse (`.admin-hero` usando `--color-success-bg` en vez de `--color-grass`, confirmado con `getComputedStyle`). Si alguien evaluó "¿ya quedó todo unificado?" navegando por la app completa (jugador + admin), la respuesta correcta hoy sigue siendo "no" — no porque el trabajo hecho esté mal, sino porque una parte entera de la app quedó afuera cada vez.
2. **Riesgo estructural sin mitigar**: `--color-grass` y `--color-success-bg` son dos tokens con roles distintos pero valores casi indistinguibles a simple vista, y nada en el proyecto (lint, convención de nombres, o un único token consolidado) impide elegir el equivocado. La prueba de que esto no es hipotético: ya volvió a pasar, de forma independiente, en código nuevo no relacionado a las correcciones anteriores (`.transferir-capitania-card` / `.seleccionado` en `Equipos.css`, agregado después de la última corrección, usa exactamente este par de tokens para dos estados que necesitan distinguirse). Mientras los dos tokens sigan siendo tan parecidos y sin ninguna barrera, cualquier corrección puntual (como las 3 anteriores) es pan para hoy: arregla la superficie que se está mirando en ese momento, pero dado que la elección incorrecta es fácil de cometer y nadie la está evitando activamente, el mismo patrón de error va a seguir reapareciendo en las próximas superficies que se toquen — ya lo hizo, en el ejemplo de arriba, sin que nadie se lo propusiera.

No propongo la solución acá (esta tarea es solo diagnóstico) — pero cualquier arreglo futuro que solo repita "cambiar la regla de esta pantalla puntual" va a dejar en pie la misma causa estructural y es razonable esperar que el problema perceptual (por qué "no se ve unificado") vuelva a aparecer en la próxima superficie no revisada.

## Progreso

- ✅ Tabla de Posiciones — fondo: `.tabla-wrapper` / `rgb(234, 246, 236)` (`--color-grass`, sin cambios, según lo pedido) — sin recuadro hero (estructura de 2 zonas).
- ✅ Equipos — fondo: `.subpagina-container` / `rgb(245, 241, 230)` (`--color-paper`) — hero: `.page-header` / `rgb(234, 246, 236)` (`--color-grass`).
- ✅ Estadísticas — fondo: `.subpagina-container` / `rgb(245, 241, 230)` — hero: `.page-header` / `rgb(234, 246, 236)`.
- ✅ Fixture — fondo: `.subpagina-container` / `rgb(245, 241, 230)` — hero: `.page-header` / `rgb(234, 246, 236)`.
- ✅ Mi Perfil — fondo: `.MiPerfil` / `rgb(245, 241, 230)` — hero: `.mi-perfil-container` / `rgb(234, 246, 236)`.
- ✅ 5 pantallas de auth — fondo: `.auth-page` / `rgb(245, 241, 230)` en las 5 — sin recuadro hero (estructura de 2 zonas, por diseño).
- ✅ Menú Admin — fondo: `.admin-main-content` / `rgb(245, 241, 230)` — sin `.admin-hero` en esta pantalla.
- ⚠️ Mis Torneos / Crear Torneo / Arbitraje (admin) — fondo: `main` (bare) / `rgb(245, 241, 230)` correcto — **hero: `.admin-hero` / `rgb(225, 241, 228)` = `--color-success-bg`, no `--color-grass`** — bug real, nunca corregido, fuera de alcance de esta tarea (solo diagnóstico).

**Causa raíz**: alcance parcial de los intentos previos (panel admin nunca incluido) + `--color-grass`/`--color-success-bg` son casi indistinguibles y nada impide confundirlos — ya se repitió el error en código nuevo (`Equipos.css`, modal de transferencia de capitanía) de forma independiente. Ambos hechos están confirmados con `getComputedStyle` real, no con inferencia.
