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

## 6. Recordatorio de "partido mañana" en la campanita de notificaciones

**Dónde**: `src/components/NotificationBell.jsx` — la campanita hoy solo muestra las notificaciones que devuelve `GET /notificaciones` (expulsión, suspensión/habilitación, formación actualizada). No hay ningún recordatorio del tipo "tenés partido mañana".

**Por qué no se resolvió**: se decidió que este recordatorio se calcula **en el frontend**, no en el backend — comparando la fecha del próximo partido del equipo (ya disponible vía los endpoints que usa `FixtureTorneo.jsx`/`Estadisticas.jsx`) contra la fecha de hoy, en vez de que el backend tenga que generar y persistir una notificación de tipo nuevo para algo que es puramente una cuenta de días. Queda pendiente de construir: no forma parte de `NotificationBell.jsx` todavía, ni como notificación real ni como badge/aviso calculado aparte.

## 7. `docs/backend/` no existe todavía

**Dónde**: no es un archivo del frontend — es la documentación que falta del lado del backend (entidades, rutas, contrato de cada endpoint). Hoy la única forma de conocer el contrato real de un endpoint es leyendo el código fuente del backend directamente (`Backend/src/**/*.controler.ts`, `*.routes.ts`, `*.entity.ts`), como se hizo para escribir este mismo directorio de documentación.

**Por qué no se resolvió**: quedó fuera de alcance de las tareas de frontend que se fueron haciendo — cada vez que hizo falta confirmar un contrato (el shape exacto de `Notificacion`, los cupos por posición de `/formaciones`, el gating por JWT de `/jugadores/:id/expulsar`) se investigó puntualmente leyendo el backend, sin dejar esa investigación documentada en un lugar central y reusable. Un `docs/backend/` con la misma estructura que este directorio (sistema de entidades, recorrido por endpoints, decisiones, pendientes) evitaría tener que releer el código fuente cada vez que una tarea de frontend necesita confirmar un contrato.
