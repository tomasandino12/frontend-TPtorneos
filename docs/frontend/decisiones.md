# Bitácora de decisiones

Resumen fase por fase de **por qué** se decidió cada cosa, no de **qué** se hizo técnicamente (eso está en `sistema-de-diseno.md` y `paginas.md`). El detalle completo de cada fase, con verificación y alcance exacto, está en el historial de la conversación que las ejecutó — acá va la versión corta.

## Fase 1 — Sistema de diseño base

Se decidió construir tokens y componentes **antes** de tocar ninguna pantalla real, en vez de migrar pantalla por pantalla desde el principio. La razón: la auditoría original identificó que la causa raíz de casi todos los problemas (paletas de color divergentes, iconografía mezclada, botones/inputs reinventados en cada archivo) era la ausencia total de un sistema compartido — migrar sin resolver eso primero habría significado repetir la misma decisión de "qué verde usar" en cada fase siguiente.

La paleta se eligió deliberadamente distinta tanto del tema oscuro con verde ácido que tenía el login original (identificado como un look genérico de interfaz "hecha por IA") como del verde SaaS genérico que ya usaba el resto de la app — se ancló en el dominio real del producto (cancha de fútbol amateur: pitch, turf, silbato). Fue intencional que esta fase no cambiara casi nada visible: los tokens y componentes quedaron construidos pero sin usar en ninguna pantalla, para poder revisar el resultado de forma aislada antes de aplicar cambios más grandes.

## Fase 2 — Autenticación

Se migraron las pantallas de auth antes que el resto de la app porque son el punto de entrada de todos los usuarios y porque eran, medido en líneas de CSS duplicado, el bloque más repetido del proyecto (una hoja de estilos casi idéntica copiada 3 veces). De paso se aprovechó para eliminar `Layout.jsx` (un componente que no se importaba desde ningún lado) y resolver de raíz el bug de mostrar/ocultar contraseña, que hasta ese momento dependía de que cada pantalla lo implementara bien a mano — con `TextField` manejando su propio estado de visibilidad, ese bug se volvió estructuralmente imposible de repetir.

## Fase 3 — Pantallas principales (jugador)

Al revisar el navbar de jugador se encontró que en realidad no estaba duplicado por pantalla (como sospechaba la auditoría), sino que faltaba directamente en una ruta (`EquipoDetalle`, que vive fuera del layout compartido). Se extrajo a un componente propio (`Navbar.jsx`) en vez de arreglarlo en el lugar donde vivía, justamente para poder reusarlo ahí. El resto de la fase fue resolver bugs puntuales ya confirmados por la auditoría (escudo sin estilo, tabla de posiciones recortada en mobile, superposición de botón y título en Mi Perfil, z-index frágil del hero de Inicio).

## Fase 4 — Panel de administrador

Última pieza que todavía dependía de Boxicons (un CDN externo de íconos) — se migró a `react-icons` y recién ahí se pudo sacar el `<link>` del CDN de `index.html` para todo el proyecto, no solo para esta fase. Se investigó el backend (entidad `Torneo`) antes de decidir a qué estado debía pasar un torneo recién creado, en vez de asumir un valor — la entidad solo admite `borrador`/`en_curso`/`finalizado`, así que "Crear Torneo" pasa a `en_curso` en vez de repetir el mismo estado que "Guardar borrador". Se decidió explícitamente no completar el uso de la escala de z-index en `.navbar` (`IndexStyle.css`) porque tocar ese archivo excedía el alcance de esa fase, y no había un bug real de superposición — se prefirió dejarlo pendiente y documentado antes que estirar el alcance sin necesidad.

## Fase 5 — Cierre

Esta fase no migró nada nuevo: contrastó los 79 hallazgos de la auditoría original contra el código real, verificando en vez de asumiendo (con `grep`, con `Playwright` en modo headless para casos que leer el código no alcanza a confirmar, y con builds/lint reales). En el proceso de verificación aparecieron 3 arreglos triviales que ninguna fase anterior había detectado (una tarjeta `sticky` que había quedado tapada por el navbar por un cambio de la propia Fase 4, una fecha sin formatear, y CSS muerto en un archivo que nunca había estado en el alcance de ninguna fase) — se resolvieron ahí mismo por ser cambios de una o dos líneas, sin abrir nada más grande.

## Ajuste puntual — Login social, plantel duplicado, y "Equipos" condicional

Tres cambios de producto decididos después de revisar el resultado en el navegador, ya con las 5 fases cerradas:

- **Se sacó el botón "Continuar con Facebook"** del login: nunca tuvo lógica detrás (ni `onClick` ni integración real), y Google es el único login social que el proyecto usa de verdad.
- **El "plantel" del equipo (jugadores con posición y edad) se sacó de `Estadisticas.jsx`** y se dejó como responsabilidad exclusiva de `EquipoInfo.jsx` — antes existía una versión de esa misma información en dos pantallas con presentación distinta, lo cual era exactamente el tipo de confusión "gestión vs. estadísticas" que la auditoría original había señalado como un hallazgo de severidad Alta.
- **`Equipos.jsx` se consolidó con `EquipoInfo.jsx`** para eliminar el paso intermedio de "card con botón Ver mi equipo" — si el jugador ya tiene equipo, la pestaña "Equipos" muestra directamente su equipo. Antes de decidir esto se investigó si existía en el backend algún flujo de autoservicio para "unirse a un equipo existente" (la copia de la pantalla lo sugería) — no existe: la única forma de sumarse a un equipo es que un capitán te agregue. Se decidió, con el usuario, no inventar ese feature en un ajuste de UI, y ajustar la copia de la pantalla para no prometer algo que la app no puede hacer todavía. Queda documentado como pendiente en `pendientes.md`.
