# Recorrido por las pantallas

Este documento describe cada pantalla del proyecto: para qué sirve, de qué datos depende, y cómo se conecta con las demás. Sigue el mapa de rutas de `src/App.jsx`.

## Mapa de rutas

```
/                              → InicioSesion (login de jugador)
/registro                      → Registro
/olvide-password               → OlvidePassword
/restablecer-password          → RestablecerPassword
/admin                         → InicioSesionAdmin (login de administrador)
/menu-admin                    → MenuAdmin
/admin/torneos                 → MisTorneos
/admin/torneos/nuevo           → CrearTorneo
/admin/torneos/:id/equipos     → InscribirEquipos
/admin/arbitros                → Arbitros

/gestorTorneos                 → GestorTorneos (layout) + Navbar
  ├── (index)                    → TablaPosiciones
  ├── /estadisticas               → Estadisticas
  ├── /fixture                    → FixtureTorneo
  ├── /equipos                    → Equipos
  ├── /miPerfil                   → MiPerfil
  └── /inicio                     → Inicio

/equipo/:id                    → EquipoDetalle (fuera del layout de arriba)
```

Dos cosas para notar del mapa: primero, hay **dos guards distintos** — `PrivateRoute` (definido en `App.jsx`) protege las rutas de jugador (`/gestorTorneos/*` y `/equipo/:id`) chequeando `localStorage.getItem("token")`; las rutas de admin no pasan por `PrivateRoute`, cada pantalla admin valida `localStorage.getItem("admin")` en su propio `useEffect`. Segundo, `/equipo/:id` **no** está anidada bajo `/gestorTorneos` aunque visualmente se vea igual — ver la sección dedicada más abajo, es la parte más particular de la arquitectura de páginas.

---

## Autenticación (fuera de cualquier layout compartido)

Las 5 pantallas de auth comparten un mismo "look" (fondo `--color-grass`, una `Card` centrada) pero cada una es un archivo independiente sin navbar ni layout envolvente — tiene sentido, porque todavía no hay sesión iniciada.

- **`InicioSesion.jsx`** (`/`) — login de jugador. Hace un `fetch` directo (no `apiFetch`, porque todavía no hay token) a `POST /jugadores/login`, guarda `token` en `localStorage`, y después busca los datos completos del jugador (`GET /jugadores/by-email`) para guardar el objeto `jugador` también en `localStorage` — ese objeto es la fuente de "quién soy" que consultan casi todas las demás pantallas (`JSON.parse(localStorage.getItem("jugador"))`). Tiene checkbox "Recordar" que persiste el email en `localStorage` (`rememberEmail`) para precargarlo la próxima vez.
- **`Registro.jsx`** (`/registro`) — alta de jugador nuevo. Validación de formulario 100% en el cliente (regex de email, DNI de 7-9 dígitos, contraseña ≥ 6 caracteres, confirmación de contraseña) antes de habilitar el botón de submit.
- **`OlvidePassword.jsx`** / **`RestablecerPassword.jsx`** — flujo de recuperación de contraseña en dos pasos: el primero pide el email y dispara un mail (`POST /jugadores/forgot-password`); el segundo lee un `token` de la URL (`useSearchParams`) y lo manda junto a la nueva contraseña (`POST /jugadores/reset-password`).
- **`InicioSesionAdmin.jsx`** (`/admin`) — login de administrador. Mismo look que el resto de auth, con un badge "Acceso Administrador" arriba de la marca para diferenciarlo. Guarda `admin`/`adminToken` en `localStorage` (sesión separada de la de jugador).

## Pantallas de jugador (bajo `/gestorTorneos`)

Todas comparten el layout `GestorTorneos.jsx`, que es solo esto:

```jsx
function GestorTorneos() {
  return (
    <div className="layout">
      <Navbar />
      <main className="content"><Outlet /></main>
      <footer className="footer">...</footer>
    </div>
  );
}
```

`<Outlet />` es dónde React Router inyecta la pantalla hija según la URL (`TablaPosiciones`, `Estadisticas`, etc.). El `<Navbar />` (`src/components/Navbar.jsx`) es el mismo para las 6, con 5 links (Tabla de Posiciones, Estadísticas, Fixture, Equipos, Mi Perfil) más un botón de cerrar sesión.

- **`TablaPosiciones.jsx`** (ruta índice) — trae las estadísticas del torneo activo del equipo del jugador logueado (`GET /equipos/estadisticas/:torneoId`) y las muestra en una tabla (Pos/Equipo/PJ/PG/PE/PP/DG/Pts). Cada fila es clickeable y navega a `/equipo/:id` — **de cualquier equipo de la tabla, no solo el propio** (ver la sección de `EquipoDetalle` más abajo, esto es clave para entender por qué esa pantalla existe separada). Las columnas numéricas usan la clase `.stat-numeral`.
- **`Estadisticas.jsx`** — muestra resultados del equipo del propio jugador: resumen (victorias/empates/derrotas/partidos jugados), partidos jugados recientes, y próximos partidos programados. **No muestra el plantel** (jugadores del equipo) — eso se sacó de acá y se consolidó en `EquipoInfo.jsx` (ver `decisiones.md`, ajuste puntual). Tiene un botón "Gestionar mi equipo"/"Ver mi equipo" (según si sos capitán o no) que lleva a `/equipo/:id` del propio equipo.
- **`FixtureTorneo.jsx`** — próximos partidos programados del torneo activo del equipo, con un filtro por jornada.
- **`Equipos.jsx`** — ver la sección dedicada abajo, es la más particular de las tres.
- **`MiPerfil.jsx`** — datos personales del jugador logueado (nombre, fecha de nacimiento, posición, email, descripción), con un modo de edición. También tiene el botón "Salir del equipo" (si el jugador tiene uno), que pide confirmación nativa (`window.confirm`, no un modal propio — es una confirmación destructiva, se mantuvo así a propósito) y actualiza el estado de React sin recargar la página.
- **`Inicio.jsx`** — pantalla de bienvenida/landing dentro de la sección de jugador, con una imagen de fondo tipo "hero" (no forma parte del flujo de datos real, es más una portada) y dos botones de acceso rápido a Fixture y Tabla de Posiciones.

## La trilogía `Equipos` / `EquipoDetalle` / `EquipoInfo`

Esta es la parte del código que más necesita explicación, porque a simple vista parecen 3 pantallas de "equipo" y en realidad son 1 componente de contenido (`EquipoInfo`) reusado por 2 puntos de entrada distintos (`Equipos` y `EquipoDetalle`).

### El problema que resuelve esta estructura

Hay dos preguntas distintas que la app necesita responder, y que a primera vista parecen la misma:

1. "¿Qué es mi equipo?" — la pregunta que se hace el jugador logueado sobre su propio equipo.
2. "¿Qué es el equipo con ID 7?" — la pregunta que se hace cualquiera al clickear una fila en `TablaPosiciones` (que puede ser el propio equipo o el de un rival).

Antes de la consolidación existían dos pantallas separadas para esto (`Equipos.jsx` mostraba una card resumen con un botón "Ver mi equipo" que navegaba a `EquipoDetalle.jsx`, agregando un click intermedio sin necesidad), y encima el "plantel" con posición/edad de cada jugador vivía duplicado en una tercera pantalla (`Estadisticas.jsx`) con una presentación totalmente distinta. La consolidación resuelve las dos preguntas con **una sola implementación del contenido** (`EquipoInfo.jsx`), y dos "cascarones" livianos que la usan de forma distinta.

### Quién es quién

- **`src/components/EquipoInfo.jsx`** — no es una pantalla, es un **componente de contenido** (ver "componente presentacional vs. contenedor" en `glosario.md`). Recibe un `equipoId` por prop, hace su propio `fetch` a `GET /equipos/:id`, y renderiza todo lo que hay que mostrar de un equipo: encabezado con escudo y nombre (dentro de `PageHero`, `layout="split"`), descripción (editable, siempre visible fuera de cualquier pestaña), y tres pestañas — Plantel, Historial, Estrategia — armadas con el componente `Tabs` (ver `sistema-de-diseno.md`). No sabe nada sobre routing — no le importa si lo montaron dentro de `/gestorTorneos/equipos` o dentro de `/equipo/7`.

- **`src/pages/EquipoDetalle.jsx`** — la ruta standalone `/equipo/:id`. Es la que usa `TablaPosiciones` cuando cualquiera clickea una fila (puede ser un equipo rival). Como es una ruta que vive **fuera** del layout `GestorTorneos`, arma su propio layout completo (navbar + contenido + footer) a mano:

  ```jsx
  function EquipoDetalle() {
    const { id } = useParams();
    return (
      <div className="layout">
        <Navbar />
        <main className="content">
          <main className="subpagina-container">
            <EquipoInfo equipoId={Number(id)} />
          </main>
        </main>
        <footer className="footer">...</footer>
      </div>
    );
  }
  ```

- **`src/pages/Equipos.jsx`** — la pestaña "Equipos" del navbar (`/gestorTorneos/equipos`), que **ya está** dentro del layout de `GestorTorneos` (heredado del `<Outlet/>`). Acá la lógica es condicional según si el jugador logueado tiene equipo:

  ```jsx
  if (jugador.equipo?.id) {
    return (
      <main className="subpagina-container">
        <EquipoInfo equipoId={jugador.equipo.id} showVolver={false} />
      </main>
    );
  }
  // si no tiene equipo: formulario de "crear equipo nuevo"
  ```

  Si el jugador **no tiene equipo**, `Equipos.jsx` muestra una vista genérica de "crear equipo" (no renderiza `EquipoInfo` en absoluto, porque no hay ningún equipo que mostrar). Si **ya tiene equipo**, renderiza `EquipoInfo` directo — sin el paso intermedio de una card + botón que existía antes — y el título que ve el usuario pasa a ser el nombre del equipo (porque ese título lo pone `EquipoInfo`, no `Equipos.jsx`).

### La prop `showVolver`

`EquipoInfo` recibe una segunda prop, `showVolver` (default `true`), que controla un solo botón: "Volver al menú". Tiene sentido en `EquipoDetalle` (viniste de otro lado, tenés que poder volver) pero no tiene sentido cuando `Equipos.jsx` ya renderiza `EquipoInfo` dentro de su propio layout con navbar — ahí ese botón sería redundante, así que `Equipos.jsx` pasa `showVolver={false}`.

### Renderizado condicional por rol: capitán vs. jugador común vs. equipo ajeno

Adentro de `EquipoInfo`, todo el gating de "quién puede ver/editar qué" se resuelve con dos variables calculadas al principio del componente:

```jsx
const jugadorLogueado = JSON.parse(localStorage.getItem("jugador") || "null");
const esMiEquipo = jugadorLogueado?.equipo?.id === Number(equipoId);
const esCapitanDeEsteEquipo = !!jugadorLogueado?.esCapitan && esMiEquipo;
```

- Si estás viendo un equipo que **no es el tuyo** (`esMiEquipo === false`, típicamente entraste desde `TablaPosiciones` clickeando la fila de un rival): ves todo en **solo lectura** — sin botón de editar escudo, sin editar descripción, sin buscador para agregar jugadores. Ninguno de esos controles se renderiza (no es que estén deshabilitados — directamente no están en el DOM).
- Si es tu equipo pero **no sos capitán** (`esMiEquipo === true`, `esCapitanDeEsteEquipo === false`): mismo caso, solo lectura — ver tu propio equipo no te da permiso de editarlo, solo ser su capitán.
- Si sos **capitán de ese equipo** (`esCapitanDeEsteEquipo === true`): aparecen todos los controles — cambiar escudo, editar descripción, y (dentro de la pestaña Plantel, ver más abajo) echar jugadores, agregar jugadores nuevos y asignar la capitanía.

Ejemplo real de ese gating en el JSX (el botón "Editar descripción"):

```jsx
{esCapitanDeEsteEquipo && (
  <Button variant="secondary" icon={<FiEdit2 />} onClick={handleEmpezarEdicionDescripcion}>
    Editar descripción
  </Button>
)}
```

Es importante remarcar (está documentado en un comentario arriba del propio componente): **este gating es de interfaz, no de seguridad**. Que el botón no aparezca en pantalla no reemplaza ninguna validación que tenga que hacer el backend — si alguien arma el request a mano (por ejemplo con curl) para editar un equipo del que no es capitán, lo que lo tiene que frenar es una validación del lado del servidor, no el hecho de que el botón esté oculto en el frontend. El caso más explícito de esto en el código real es el endpoint de expulsar jugador (ver más abajo, "La pestaña Plantel"): identifica quién puede expulsar leyendo el JWT del que llama, nunca un parámetro que mande el cliente — ver "identificar al usuario por JWT" en `glosario.md`.

### Las tres pestañas: Plantel, Historial, Estrategia

Debajo de la descripción, `EquipoInfo` arma un `<Tabs>` (ver `sistema-de-diseno.md`) con tres pestañas, dos de ellas condicionales según `esMiEquipo`:

```jsx
const tabsConfig = [
  { id: "plantel", label: "Plantel", content: plantelTabContent },
  { id: "historial", label: "Historial", content: historialTabContent, hidden: esMiEquipo },
  { id: "convocatoria", label: "Estrategia", content: convocatoriaTabContent, hidden: !esMiEquipo },
];
```

- **Plantel** — siempre visible, para cualquiera. Ver detalle abajo.
- **Historial** — visible **solo cuando estás viendo un equipo ajeno** (`hidden: esMiEquipo`, o sea, se oculta cuando SÍ es el tuyo). Tiene sentido: para tu propio equipo ya existe "Ver estadísticas del equipo" (botón en las `actions` del `PageHero`, lleva a `Estadisticas.jsx`); "Historial" acá es la versión resumida (tabla Fecha/Local/Resultado/Visitante/Estado) que tiene sentido cuando estás mirando a un rival desde Tabla de Posiciones y no vas a navegar a "tus" estadísticas para verlo.
- **Estrategia** — lo opuesto: visible **solo en tu propio equipo** (`hidden: !esMiEquipo`). El `id` interno sigue siendo `"convocatoria"` (el componente que la renderiza es `Convocatoria.jsx`) — el renombre a "Estrategia" fue solo del texto que ve el usuario.

**Nota de implementación importante, documentada en un comentario en el propio código**: `Tabs` desmonta el contenido de la pestaña que no está activa (solo renderiza `active.content`, no las tres a la vez con `display:none`). Esto significa que cualquier estado que tenga que **sobrevivir** a que el capitán se vaya a otra pestaña y vuelva —como la formación de Estrategia ya guardada— no puede vivir adentro del componente de esa pestaña, porque se perdería en cada cambio de pestaña. Por eso la formación guardada (`convocatoriaGuardada`) vive como estado de `EquipoInfo.jsx` y se pasa a `Convocatoria` por props, en vez de ser un `useState` local de `Convocatoria.jsx` — ver el ejemplo completo en `sistema-de-diseno.md` (sección `Tabs`) y el comentario real en `EquipoInfo.jsx` junto a ese `useState`.

### La pestaña Plantel

Muestra, en este orden fijo: un contador de cupo (`"14/26 jugadores en el plantel"`), y los jugadores agrupados por posición siempre en el mismo orden — Arqueros → Defensores → Mediocampistas → Delanteros (`ORDEN_POSICIONES` en el código), sin importar en qué orden los devuelva el backend — cada grupo con su cantidad (`"Defensores · 4"`).

Solo para el capitán de ese equipo (`esCapitanDeEsteEquipo`), cada fila del plantel tiene además un botón para **echar al jugador** (ícono `FiUserX`, oculto/deshabilitado en la propia fila del capitán — no podés echarte a vos mismo desde acá) que abre un `Modal` pidiendo un motivo (mínimo 5 caracteres) y llama a `PATCH /jugadores/:id/expulsar`. El `:id` de la URL es el jugador **objetivo** (a quién echar); quién tiene permiso para hacerlo lo resuelve el backend leyendo el JWT del que llama, no un parámetro — ver el ejemplo completo de este patrón en `glosario.md`.

También solo para el capitán, dos acciones más viven en esta pestaña:
- **"Agregar jugador"** — abre un `Modal` (`size="lg"`) con el buscador de jugadores libres y el botón de invitar (misma lógica de siempre, movida adentro del modal en vez de vivir como una sección fija de la pantalla).
- **"Asignar capitanía"** — reusa el mismo modal de transferencia de capitanía que existía antes de la reestructuración en pestañas (`.transferir-capitania-overlay`/`.transferir-capitania-modal`, con su propia implementación CSS/JSX, no el componente genérico `Modal`), solo que ahora el botón que lo abre vive en Plantel en vez de estar suelto en la pantalla. La lógica de ese modal no se tocó al reorganizar las pestañas.

### La pestaña Estrategia (`Convocatoria.jsx` + `Cancha.jsx`)

Asistente de 4 pasos, solo para el capitán. Si el plantel tiene **menos de 11 jugadores**, el asistente ni siquiera se muestra — se reemplaza por un mensaje ("Hace falta que el plantel llegue a 11 jugadores..."); para cualquier no-capitán que entra sin que haya una formación guardada todavía, el mensaje es "El capitán todavía no armó la convocatoria para el próximo partido."

1. **Elegir formación** — 4 esquemas fijos (`4-3-3`, `4-4-2`, `4-2-3-1`, `5-3-2`), cada uno con sus cupos por posición (`FORMACIONES` en el código, coordinado con el mismo mapa que usa el backend). Un esquema se deshabilita, con el motivo visible (`"Necesitás al menos 5 defensores, tenés 4"`), si el plantel actual no alcanza para sus cupos.
2. **Armar el 11 titular** — el componente `Cancha.jsx` dibuja un SVG de cancha (fondo, líneas, arcos — ver `sistema-de-diseno.md`/`glosario.md` para el sistema de coordenadas) con un punto por cada posición del esquema elegido. Tocar un punto vacío abre un `Modal` con los jugadores disponibles de esa categoría (ya sin los que están asignados a otro punto); tocar un punto ya asignado lo libera. El color de los puntos es `equipo.colorPrimario` — como ese color lo elige cada capitán (o queda en el default del backend, blanco), `Cancha.jsx` calcula la luminancia del color para decidir si el texto va en negro o blanco, así el nombre del jugador siempre se lee bien sin importar el color del equipo (ver "cálculo de luminancia" en `glosario.md`).
3. **Banco de suplentes** — automático, sin selección: los jugadores del plantel que no quedaron en el 11 titular.
4. **Notas y confirmar** — un campo de texto libre opcional (notas de estrategia) y el botón "Confirmar", que llama `PUT /formaciones`.

Si ya existe una formación guardada, entrar a la pestaña muestra directamente la cancha en modo lectura (para cualquier miembro del equipo) con el banco y las notas debajo; el capitán ve además un botón **"Editar formación"** que reabre el asistente desde el paso 1, con el esquema y las asignaciones actuales ya precargadas (no hace falta rearmar todo desde cero).

`GET /formaciones` y `PUT /formaciones` **no reciben `equipoId` en la URL ni en el body** — el backend siempre resuelve "el equipo" a partir del jugador autenticado (el JWT): `GET` lo puede pedir cualquier miembro del equipo, `PUT` únicamente el capitán (403 si no lo es). Es el mismo patrón que expulsar jugador — ver `glosario.md`.

## Campanita de notificaciones (`NotificationBell.jsx`)

Vive en `src/components/Navbar.jsx`, dentro de `.gt-nav-actions` — visible en cualquier pantalla que renderice `<Navbar/>`, que son las 6 pantallas de jugador bajo `/gestorTorneos` **más** `EquipoDetalle.jsx` (ruta `/equipo/:id`, fuera de ese layout pero con su propio `<Navbar/>` armado a mano — ver "Quién es quién" más arriba). Es un componente genérico: no tiene ningún tipo de notificación hardcodeado en su lógica, solo un mapeo `tipo → ícono` para decidir qué dibujar.

- **Ícono con contador**: un badge numérico (o `"9+"` si son más de 9) solo si hay notificaciones no leídas — sin badge si son cero.
- **Panel desplegable**: se abre al clickear la campana, se cierra con click afuera, con Escape, o clickeando la campana de nuevo. Lista las notificaciones más recientes primero, cada una con su ícono según `tipo`, el mensaje, y hace cuánto llegó (`"hace 2 horas"`, calculado en el cliente a partir de `fecha`). Las no leídas se distinguen con fondo distinto, texto en negrita, y un punto de color.
- **Marcar como leída**: al clickear una notificación puntual (no al abrir el panel) — llama `PATCH /notificaciones/:id/leida`. Si esa notificación específica ya estaba leída, el click no hace ningún request de más.
- **Tipos reales que emite el backend hoy** (`Notificacion.tipo`): `expulsion`, `suspension`, `habilitacion`, `formacion_actualizada` — cada uno con su ícono en `TIPO_ICONOS`. Cualquier tipo que no esté en ese mapeo cae a un ícono de campana genérico, así el componente no se rompe si el backend agrega un tipo nuevo.
- **Fuente de datos**: `GET /notificaciones` (todas las notificaciones del jugador autenticado, leídas y no leídas, sin necesidad de pedirlas por tipo o por pantalla) — la llamada está aislada en una función `fetchNotificaciones()` al tope del archivo, separada del resto del componente.
- **Si la llamada falla** (sin conexión, error del servidor): el panel muestra un mensaje de error simple (`Alert variant="error"`) en vez de romper la pantalla o mostrar una lista vacía como si no hubiera notificaciones.

## Panel de administrador

El panel admin tiene su propio navbar (`AdminHeader.jsx`, distinto del `Navbar.jsx` de jugador) y su propia paleta de rutas, todas bajo `/admin/*` o `/menu-admin`. Ninguna pantalla admin comparte layout centralizado como `GestorTorneos` — cada una arma su `<div className="layout"><AdminHeader/>...</div>` a mano (y cada una repite su propio guard de `localStorage.getItem("admin")`, ver `README.md`).

- **`MenuAdmin.jsx`** (`/menu-admin`) — landing del panel admin, con accesos directos a "Mis Torneos", "Arbitraje", y dos placeholders sin implementar todavía ("Canchas", "Jugadores" — tienen `path: null` y quedan visualmente deshabilitados).
- **`MisTorneos.jsx`** (`/admin/torneos`) — lista de todos los torneos creados por el admin logueado, con tabs de filtro por estado (Todos/En curso/Borradores/Finalizados), buscador, y una card por torneo con sus métricas y acciones (que cambian según el estado: "Equipos" si está en curso, "Agregar equipos" si es borrador, "Ver resumen" si está finalizado — las 3 llevan a `InscribirEquipos`, es la única vista de detalle que existe).
- **`CrearTorneo.jsx`** (`/admin/torneos/nuevo`) — formulario de alta de torneo, con un panel de resumen en vivo al costado que se actualiza mientras se completa el formulario. Tiene dos botones de guardado: "Guardar borrador" (`estado: "borrador"`, vuelve al listado) y "Crear Torneo" (`estado: "en_curso"`, va directo a inscribir equipos) — los dos estados posibles que admite la entidad `Torneo` del backend además de `"finalizado"`.
- **`Arbitros.jsx`** (`/admin/arbitros`) — CRUD simple de árbitros (tabla + modal de alta/edición).
- **`InscribirEquipos.jsx`** (`/admin/torneos/:id/equipos`) — pantalla de detalle de un torneo puntual: a la izquierda, la lista de equipos disponibles de esa categoría para inscribir; a la derecha, un resumen con el botón de inscripción, y más abajo el formulario de "Generar Fixture" (fecha, hora, canchas, árbitros) que solo se muestra si el fixture todavía no fue generado (`torneo.estado !== "en_curso"`).

## Componentes compartidos que no son pantallas

- **`Navbar.jsx`** — navbar de las pantallas de jugador (las 6 de `/gestorTorneos/*` más `EquipoDetalle`), incluye la campanita de notificaciones (`NotificationBell.jsx`, ver más arriba). Ver `decisiones.md` (Fase 3) para por qué se extrajo a un componente propio en vez de vivir inline en `GestorTorneos.jsx`.
- **`AdminHeader.jsx`** — navbar del panel admin, con un dropdown ("Mis Torneos") que se abre por click (no por hover) y se cierra con click afuera, Escape, o al perder el foco — ver `decisiones.md` (Fase 4) y `glosario.md` para el porqué de ese diseño.
- **`Convocatoria.jsx`** / **`Cancha.jsx`** — contenido de la pestaña "Estrategia" de `EquipoInfo` y la cancha SVG que reutiliza (editable en el asistente, de solo lectura en la vista de la formación guardada). Ver la sección de la pestaña Estrategia más arriba.
