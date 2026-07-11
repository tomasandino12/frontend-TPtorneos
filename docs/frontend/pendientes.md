# Pendientes

Lo que quedó sin resolver después de las 5 fases de migración de UI y los ajustes puntuales posteriores. Cada ítem tiene un motivo concreto, no es simplemente "no hubo tiempo" — la fuente completa de estos 5 primeros ítems es [`../auditoria-ui-cierre.md`](../auditoria-ui-cierre.md), que los contrasta contra los 79 hallazgos de la auditoría original.

## 1. Estados de carga sin estilo en 3 pantallas

**Dónde**: `src/components/EquipoInfo.jsx`, `src/pages/TablaPosiciones.jsx`, `src/pages/Estadisticas.jsx` — las 3 todavía muestran `<p>Cargando...</p>` como texto plano mientras cargan datos, sin ningún estilo.

**Por qué no se resolvió**: la Fase 4 sí le dio un tratamiento consistente a este mismo problema, pero solo en el panel admin (`MisTorneos.jsx`, `Arbitros.jsx`, `InscribirEquipos.jsx`, envolviendo el mensaje en un `<Card>`). Los 3 archivos que faltan son de la Fase 3 y no estaban en la lista explícita de arreglos triviales que se definió para la Fase 5 de cierre. Es un cambio sencillo de replicar (mismo patrón que ya existe en el panel admin), pero encaja mejor como un ítem de seguimiento acotado que como parte de un sweep genérico.

## 2. Tres formas distintas de "card de página" sin relación

**Dónde**: la mayoría de las pantallas usa la clase compartida `.subpagina-container` (`IndexStyle.css`), pero `TablaPosiciones.jsx` define su propio `.tabla-wrapper > .tabla-container`, y `MiPerfil.jsx` define su propio `.mi-perfil-container` — mismo rol (contenedor de página), tres implementaciones CSS distintas, con valores de sombra y fondo levemente distintos entre sí.

**Por qué no se resolvió**: unificarlas no es un cambio de una o dos líneas — implica decidir cuál de los tres patrones "gana" como el definitivo, y después ajustar el layout visual de dos pantallas para adaptarse a él (posible cambio de anchos máximos, paddings, o comportamiento responsive que hoy cada una resuelve a su manera). Es una decisión de diseño, no una corrección puntual.

## 3. `CrearTorneo.jsx` sin agrupación en el formulario

**Dónde**: el formulario de creación de torneo es una lista plana de campos (nombre, fechas, categoría, cantidad de equipos, formato, puntos) sin ningún `<fieldset>` ni títulos de sección intermedios.

**Por qué no se resolvió**: hoy el formulario es corto y se lee bien tal como está, pero si en el futuro se le agregan más campos, esta falta de agrupación visual va a hacer que escale mal (una lista larga sin puntos de referencia). Resolverlo implica reestructurar el JSX del formulario en secciones, no es un ajuste de estilo aislado.

## 4. Inscripción de equipos sin feedback de progreso

**Dónde**: `src/pages/InscribirEquipos.jsx`, función `handleInscribir` — cuando el admin selecciona varios equipos e inscribe, el código hace un `POST /participacion` por cada equipo **en un loop secuencial** (uno atrás del otro, no en paralelo), y mientras tanto el botón solo dice "Inscribiendo..." sin indicar cuántos van (ej. "3 de 10").

**Por qué no se resolvió**: es explícitamente un problema de UX funcional, no visual — quedó fuera de alcance por pedido explícito en la fase que lo detectó. Resolverlo implica tocar la lógica de `handleInscribir` (agregar un contador de progreso al estado y actualizarlo en cada iteración del loop), más que un ajuste de presentación.

## 5. Duplicación de la regla `footer` entre `App.css` e `IndexStyle.css`

**Dónde**: `src/App.css` y `src/styles/IndexStyle.css` definen la misma regla `footer { background-color: #1b5e20; ... }` con los mismos valores, en dos archivos distintos.

**Por qué no se resolvió**: a diferencia de otro CSS muerto que sí se limpió en la Fase 5 (reglas que no se usaban en absoluto), esta regla **sí se usa** en los dos archivos — no es código muerto, es una duplicación real. Decidir cuál de los dos archivos debería ser la única fuente de esa regla es una decisión de organización de archivos (¿`App.css` debería seguir existiendo como archivo separado, o su contenido debería vivir todo en `IndexStyle.css`?), no una corrección de una o dos líneas.

## 6. Sistema de invitaciones / unirse a un equipo existente

**Dónde**: no es un archivo puntual — es una funcionalidad que no existe. La pantalla "Equipos" (`Equipos.jsx`), cuando el jugador no tiene equipo, solo ofrece crear uno nuevo.

**Por qué no se resolvió**: se investigó el backend (`equipo.routes.ts`, `jugador.routes.ts`) antes de decidir qué mostrar en esta pantalla, y no existe ningún endpoint de autoservicio para que un jugador se una a un equipo por su cuenta — la única forma de sumarse a un equipo hoy es que un capitán lo agregue desde su propio buscador de reclutamiento (dentro de `EquipoInfo.jsx`). Antes de este ajuste, la copia de la pantalla decía "Creá tu equipo o unite a uno existente", prometiendo una acción que en realidad no existía en ningún lado de la interfaz. Se decidió, con el usuario, no improvisar un endpoint ni un flujo nuevo como parte de un ajuste de UI — construir un sistema de invitaciones (o un modelo de equipos "público/privado" con solicitudes de ingreso) es una funcionalidad nueva de producto, con decisiones de diseño y de backend propias, y queda pendiente de una conversación aparte.
