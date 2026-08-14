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

## 7. ~~`docs/backend/` no existe todavía~~ — resuelto

**Actualizado**: ya existe, con la misma estructura que este directorio (`entidades.md`, `endpoints.md`, `glosario.md`, `decisiones.md`, `pendientes.md`, más `bitacora.md`), en el repo del backend — ver [`backend-TPtorneos/docs/README.md`](https://github.com/tomasandino12/backend-TPtorneos/blob/master/docs/README.md). Se deja el ítem tachado en vez de borrarlo para que quede visible que la afirmación original ya no aplica.

---

Los siguientes 4 ítems son del **rediseño mobile** (ver
[`decisiones-mobile.md`](./decisiones-mobile.md)), no de la migración de UI
original — quedaron fuera de alcance de ese trabajo por pedido explícito del
encargo, que pedía registrarlos acá sin resolverlos.

## 8. Import de Tailwind sin usar

**Dónde**: `src/index.css:1` — `@import "tailwindcss";`. No se encontró ningún uso de clases utilitarias de Tailwind en ningún componente `.jsx` del proyecto (confirmado por la auditoría mobile); el sistema de diseño real es el CSS plano con los tokens de `tokens.css`.

**Por qué no se resolvió**: el encargo del rediseño mobile prohibía explícitamente tocar ese import ("NO tocar el import de Tailwind en `src/index.css:1`"). Sacarlo es una decisión de alcance mayor (¿se quiere eliminar la dependencia `tailwindcss`/`@tailwindcss/vite` del proyecto por completo, o solo el import sin uso?) que no correspondía tomar en una tarea de presentación/layout.

## 9. Sin layout compartido para las 8 páginas del panel admin

**Dónde**: `MisTorneos.jsx`, `InscribirEquipos.jsx`, `CrearTorneo.jsx`, `Jugadores.jsx`, `CrearCancha.jsx`, `Canchas.jsx`, `Arbitros.jsx`, `MenuAdmin.jsx` — cada una repite inline su propio `<div className="layout"><AdminHeader/>...<footer/></div>`, a diferencia del lado jugador, donde `GestorTorneos.jsx` centraliza esa estructura una sola vez para las 7 pantallas que la usan.

**Por qué no se resolvió**: ya estaba señalado como hallazgo no crítico en la auditoría mobile (una superficie 8 veces más grande para que un futuro ajuste de header quede inconsistente, pero no un bug hoy). El rediseño mobile tocó `AdminHeader.jsx` y `AdminDrawer.jsx` — compartidos por las 8 páginas — así que el header compacto y el drawer ya llegan a las 8 sin necesitar unificar el wrapper. Unificarlo igual implicaría reescribir la estructura de 8 archivos por una razón de mantenibilidad, no de layout mobile, y quedaba fuera del alcance explícito del encargo.

## 10. Date picker nativo angosto en 320px

**Dónde**: los campos `type="date"` de `Registro.jsx` ("Fecha de nacimiento") y del modal de completar registro con Google en `InicioSesion.jsx` — en 320px de ancho, el input nativo del navegador se ve visualmente apretado (el ícono de calendario queda muy pegado al placeholder `dd/mm/yyyy`).

**Por qué no se resolvió**: es el control nativo del navegador (`<input type="date">` vía `TextField`) — su presentación interna (el layout del ícono de calendario, el placeholder, los segmentos día/mes/año) la dibuja el motor del navegador, no CSS del proyecto. No hay margen para ajustarlo sin reemplazar el input nativo por un date picker propio (una dependencia nueva o un componente hecho a mano), lo cual excede el alcance de un ajuste de presentación — el encargo también prohibía instalar dependencias nuevas.

## 11. Hover de Cancha/Convocatoria sin envolver en `@media (hover: hover)`

**Dónde**: `src/styles/Equipos.css` — 4 de las 56 reglas `:hover` del proyecto (`.convocatoria-formacion-card:hover`, `.cancha-punto-editable:hover`, `.convocatoria-seleccion-item:hover`, `.convocatoria-seleccion-item-suspendido:hover`) quedaron **intactas, sin envolver**, a diferencia de las otras 52.

**Por qué no se resolvió**: esas 4 reglas pertenecen exclusivamente a la UI de Cancha.jsx/Convocatoria.jsx (el wizard de formación), aunque viven físicamente en `Equipos.css` (un archivo compartido con otras pantallas que sí se tocaron). El encargo prohibía explícitamente tocar "Cancha.jsx, Convocatoria.jsx ni su CSS" porque ya son táctiles y fluidos por diseño — se priorizó esa prohibición por sobre la tarea general de envolver los 56 `:hover`. No es un bug real: ese wizard funciona 100% por tap + selección en modal, sin ningún elemento que dependa de hover para ser usable en touch — el "pegado" de `:hover` tras un tap, que es el problema que `@media (hover: hover)` previene, no tiene ningún efecto funcional ahí. Si en el futuro se habilita tocar esos archivos, es un cambio mecánico idéntico al ya aplicado en el resto del proyecto.

## 12. `escudoUrl` desactualizado en la base para el equipo Arsenal (id 2)

**Dónde**: no es un archivo del frontend — es un dato inconsistente en la base de datos. El registro del equipo Arsenal (`equipo.id = 2`) tiene `escudoUrl: "/uploads/escudos/escudo-2-1784512669310.jpg"`, pero el archivo que existe hoy en `Backend/uploads/escudos/` para ese equipo es `escudo-2-1784482610677.jpg` — mismo prefijo (`escudo-2-`), sufijo de timestamp distinto. El `<img>` de la ficha del equipo (`EquipoInfo.jsx`, dentro de `PageHero`) pide ese archivo y el backend responde 404.

**Por qué no se resolvió acá**: es un dato desactualizado en la base (o un bug de `equipo.controler.ts` en el endpoint de cambio de escudo, que no actualiza `escudoUrl` de forma consistente con el nombre del archivo que efectivamente persiste) — ninguna de las dos causas es de layout responsive ni de CSS, y el encargo que originó este hallazgo prohibía tocar la lógica de subida/cambio de escudo. Corregir el dato de este equipo puntual (UPDATE manual) no ataca la causa si el bug real está en el controller; y tocar el controller excede el alcance de una tarea de frontend.

**Efecto colateral que sí se corrigió acá** (fuera de este ítem, ver `src/styles/Equipos.css`, `.escudo-preview`): cuando la imagen del escudo no carga por cualquier motivo (este caso u otro), el navegador dibuja el texto `alt` como contenido de reemplazo, y ese texto se derramaba fuera de la caja de 64×64 y quedaba superpuesto al título del equipo en `PageHero` — eso sí era un bug de CSS/layout genuino (contención del elemento roto), y se corrigió con `font-size: 0` en `.escudo-preview` (`overflow: hidden` no alcanza: es un quirk conocido de Chromium con el texto de fallback de imágenes rotas). Ese fix es independiente de esta causa de backend y no la resuelve — solo evita que un escudo roto (por esta razón o cualquier otra) rompa visualmente el título de al lado.
