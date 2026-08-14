# Decisiones del rediseño mobile

Documenta el trabajo específico de hacer legible y usable entre 320px y 767px
el frontend de Gestor de Torneos, sin alterar nada por encima de 768px. Es un
trabajo distinto e independiente del historial de fases que registra
[`decisiones.md`](./decisiones.md) — las "Fase 1–7" que se nombran acá son las
de *este* rediseño, no las de ese documento. Punto de partida:
[`auditoria-mobile.md`](./auditoria-mobile.md) (auditoría de solo lectura del
estado responsive previo).

## Decisión A — Navegación del lado jugador: barra inferior de 5 ítems

Header compacto y sticky (`--header-h: 56px`) por debajo de 768px: logo a la
izquierda, campana y avatar a la derecha — nada más. Los 5 destinos de
`NAV_ITEMS` (`Navbar.jsx`) pasan a una barra de navegación inferior fija
(`MobileBottomNav.jsx`), visible solo por debajo de 768px. El avatar abre una
hoja de cuenta (`AccountSheet.jsx`) con nombre, email y "Cerrar sesión" — ese
botón desaparece del header en mobile.

**Por qué:** los 5 destinos son fijos y sin condicionales de rol (confirmado
por la auditoría), así que caben todos sin necesitar un ítem "Más"; los
pulgares viven en la mitad inferior de la pantalla en el uso real con una
mano; y sacar una acción destructiva y poco frecuente (cerrar sesión) de la
portada del header corrige la jerarquía invertida que señalaba la auditoría,
sin esconderla del todo — sigue a un toque de distancia, en la hoja de
cuenta. Entre 768px y 1023px no se renderiza la barra inferior: el navbar
apilado que ya existía entra cómodo en una fila a ese ancho, y por encima de
1024px no cambia nada.

## Decisión B — Navegación del lado admin: drawer lateral

Header compacto de 56px con logo y botón hamburguesa, por debajo de 1024px
(no 768 — el panel admin ya tenía su propio quiebre de "modo compacto" en
1024px antes de este trabajo, y se respetó esa convención existente en vez
de introducir un cuarto breakpoint). El botón abre un drawer lateral
(`AdminDrawer.jsx`) con los mismos destinos agrupados igual que hoy los
dropdowns de escritorio, y "Cerrar sesión" al pie.

**Actualizado**: la composición real de `AdminHeader.jsx` hoy es **3
dropdowns** ("Mis Torneos", "Canchas", "Sanciones" — este último agrupa
"Buscar Jugador" y "Sanciones", `/admin/jugadores` y `/admin/sanciones`) más
**1 link directo** ("Arbitraje", `/admin/arbitros`) — no 2 dropdowns + 2
links directos como decía esta página antes. "Jugadores" no es un link
directo, vive dentro del dropdown "Sanciones". El total de 7 destinos sigue
siendo el mismo por coincidencia numérica, pero la agrupación cambió.

**Por qué:** 7 destinos en dos niveles de jerarquía no entran en una barra de
pestañas tipo bottom-nav, y el panel de administración se usa sentado y con
las dos manos, no en tránsito — un drawer lateral es el patrón correcto para
ese contexto de uso, distinto del de jugador.

## Decisión C — Tablas: scroll horizontal con encabezado y columna fijos

Se mantiene el elemento `<table>` con su semántica nativa — no se convierten
filas en tarjetas (`display: block` habría anulado la semántica de tabla,
menos accesible para lectores de pantalla). Componente compartido
`ScrollableTable.jsx` con el patrón de dos contenedores anidados: uno externo
con `border-radius` + `overflow: hidden` (conserva el recorte de esquinas que
ya tenían 3 de las 4 tablas), uno interno con `overflow-x: auto`,
`tabindex="0"`, `role="region"` y `aria-label`. Primera columna y `<thead>`
con `position: sticky` y fondo opaco propio; degradado como indicador de
scroll; encabezados abreviados con `<abbr title="...">` en la Tabla de
Posiciones.

**Por qué:** el criterio de reflow de WCAG exime explícitamente a las tablas
de datos, así que el scroll horizontal es la solución prevista, no una
concesión — y una tabla de posiciones existe específicamente para comparar
equipos entre sí, algo que el formato de tarjetas destruye. Separar el
`border-radius` del `overflow-x: auto` en dos contenedores distintos es
obligatorio: en el mismo elemento, `overflow-x: auto` fuerza el eje Y a
`auto` también y rompe el recorte de esquinas redondeadas.

## Lección aprendida — El mismo bug de *stacking context* en tres fases distintas

Durante las Fases 2, 3 y 4 de este rediseño apareció **tres veces la misma
causa raíz**, no tres bugs distintos: cualquier ancestro con
`position: sticky` (o `fixed`/`absolute`) **y** un `z-index` explícito crea
su propio *stacking context*. A partir de ahí, **todos** sus descendientes
quedan confinados al nivel de ese ancestro al compararlos con elementos
*fuera* de él — sin importar qué tan alto sea el `z-index` que tenga el
descendiente puertas adentro. Es una regla de CSS fácil de pasar por alto
porque el descendiente "parece" tener prioridad si solo se mira su propio
`z-index` en aislamiento.

Concretamente: `Navbar.jsx` (`.gt-navbar`) y `AdminHeader.jsx` (`.navbar`)
tienen `position: sticky` + `z-index: var(--z-navbar)` — cualquier overlay de
pantalla completa (`position: fixed; inset: 0`) que quedara anidado
*adentro* de ellos, sin importar su propio `z-index` (`var(--z-modal)`, más
alto en teoría), quedaba confinado al nivel de ese navbar. Como
`MobileBottomNav.jsx` es un hermano posterior en el DOM con un `z-index`
igual o mayor, terminaba pintándose *encima* del overlay confinado — el
navbar entero perdía el "duelo" de stacking contra su hermano, así que
cualquier cosa adentro suyo lo perdía también.

Se resolvió de **dos formas distintas**, según qué otra cosa estuviera en
juego en cada caso:

- **Fases 2 y 3 (`AccountSheet`, `AdminDrawer`): relocalizar.** Ambos se
  sacaron de adentro de `<nav>` y se renderizan como **hermanos** suyos (un
  fragmento `<>...</>` en `Navbar.jsx`/`AdminHeader.jsx`), escapando por
  completo del *stacking context* que los confinaba. Es la solución más
  limpia, y quedó como el patrón a seguir de entrada en la Fase 3 (ya
  anticipado antes de escribir el código, no descubierto de nuevo a los
  golpes).
- **Fase 4 (`NotificationBell`): no relocalizar — ajustar el z-index del
  competidor.** Acá relocalizar el panel *rompía otra cosa*: el listener de
  click-afuera existente (`NotificationBell.jsx:63-77`, que el encargo pedía
  explícitamente no reescribir) depende de
  `contenedorRef.current.contains(e.target)` — si el panel se moviera fuera
  de ese contenedor (por ejemplo con un portal), cualquier click *adentro*
  del panel dejaría de estar "contenido", y el propio listener lo cerraría
  en el `mousedown` antes de que el `onClick` de una notificación llegara a
  ejecutarse (regresión funcional real, no solo estética). En vez de tocar
  la estructura, se bajó el `z-index` de `.gt-bottomnav` por debajo del de
  `.gt-navbar` (`MobileBottomNav.css`) — así el nivel confinado del navbar
  entero (panel de notificaciones incluido) le gana a la barra inferior sin
  importar el orden en el DOM. Verificado con Playwright: el listener de
  click-afuera original sigue funcionando sin tocarlo, y el overlay bloquea
  correctamente el tap sobre la barra inferior (no se puede "atravesar" el
  panel para tocar un ítem de abajo).

**Para la próxima vez:** antes de anidar un overlay de pantalla completa
dentro de `.gt-navbar` o `.navbar` (los dos únicos elementos del proyecto con
`position: sticky` + `z-index` propio), preguntar primero si se puede
renderizar como hermano en vez de hijo — es la solución por defecto. Solo si
alguna otra restricción real lo impide (como un listener atado a
`ref.contains()`), la alternativa válida es bajar el `z-index` del hermano
posterior con el que compite, nunca subir el del overlay confinado — eso
último no tiene ningún efecto porque el techo lo pone el ancestro, no el
overlay.
