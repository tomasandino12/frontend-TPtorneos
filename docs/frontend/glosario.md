# Glosario

Estos son los conceptos técnicos que aparecen en el código y que no son necesariamente obvios si nunca trabajaste con ellos antes. Cada uno tiene la explicación en criollo primero, y después el ejemplo real de este proyecto — no una definición de manual.

## CSS custom properties (los "tokens")

**La idea en criollo**: es una forma de decirle al navegador "esta palabra significa este valor" y después usar la palabra en vez del valor, en cualquier archivo CSS del proyecto. Se declaran una vez dentro de `:root` (que representa "toda la página") y se usan con `var(--nombre)`.

**Por qué importa acá**: antes de que este proyecto tuviera tokens, cada pantalla tenía sus propios colores escritos en hexadecimal (`#2e7d32`, `#166534`, `#16a34a`... nueve tonos de verde distintos, todos "el verde de la marca" según quien escribió cada archivo). Si querías cambiar el verde principal de la app, tenías que buscarlo y cambiarlo a mano en 10+ archivos, y era fácil olvidarse alguno.

**El ejemplo real** — declaración en `src/styles/tokens.css`:

```css
:root {
  --color-pitch: #1F5233;
}
```

Y el uso, en cualquier otro archivo `.css` del proyecto:

```css
.ui-btn-primary {
  background-color: var(--color-pitch);
}
```

Si mañana hay que cambiar el verde de marca, se cambia una sola vez en `tokens.css` y automáticamente se actualiza en todos los botones, títulos, y bordes que usan `var(--color-pitch)`.

## El archivo `index.js` "barrel" de `src/components/ui/`

**La idea en criollo**: un archivo "barrel" (de *barrel file*, "archivo barril" — como un barril que junta un montón de cosas sueltas) es un archivo que no define nada nuevo, solo re-exporta cosas que ya existen en otros archivos, para que quien lo importa no tenga que escribir una línea de `import` por cada uno.

**Por qué importa acá**: sin el barrel, cada pantalla que necesita `Button` y `TextField` tendría que escribir:

```js
import Button from "../components/ui/Button.jsx";
import TextField from "../components/ui/TextField.jsx";
```

**El ejemplo real** — `src/components/ui/index.js` completo:

```js
export { default as Button } from "./Button.jsx";
export { default as TextField } from "./TextField.jsx";
export { default as Card } from "./Card.jsx";
export { default as Alert } from "./Alert.jsx";
```

Gracias a este archivo, cualquier pantalla puede hacer un solo import agrupado:

```js
import { Button, TextField, Card, Alert } from "../components/ui";
```

Node/Vite resuelven automáticamente `../components/ui` como `../components/ui/index.js` porque ese es el nombre por convención para "el archivo que representa a toda la carpeta".

## Componente presentacional vs. componente contenedor

**La idea en criollo**: un componente **contenedor** (o "wrapper") es el que decide *dónde* vive algo — layout, ruteo, qué otros componentes envolver. Un componente **presentacional** es el que decide *qué mostrar* con los datos que le pasan — no le importa si lo están usando dentro de una ruta, de una modal, o de otra pantalla, solo recibe props y renderiza.

**El ejemplo real de este proyecto**: `src/components/EquipoInfo.jsx` es presentacional — recibe `equipoId` (y `showVolver`) como props, hace su propio fetch, y renderiza el contenido de "detalle de equipo". No sabe nada sobre rutas.

Tiene **dos contenedores distintos** que lo usan:

```jsx
// src/pages/EquipoDetalle.jsx — contenedor #1: arma su propio layout completo
function EquipoDetalle() {
  const { id } = useParams();
  return (
    <div className="layout">
      <Navbar />
      <main className="content">
        <EquipoInfo equipoId={Number(id)} />
      </main>
      <footer>...</footer>
    </div>
  );
}
```

```jsx
// src/pages/Equipos.jsx — contenedor #2: ya está dentro de un layout heredado
function Equipos() {
  // ...
  if (jugador.equipo?.id) {
    return (
      <main className="subpagina-container">
        <EquipoInfo equipoId={jugador.equipo.id} showVolver={false} />
      </main>
    );
  }
  // ...
}
```

Esta separación es justamente lo que permitió resolver el problema de "3 archivos para lo que es 1 pantalla de equipo" sin duplicar el contenido — ver `paginas.md` para el detalle completo.

## Renderizado condicional por rol

**La idea en criollo**: mostrar u ocultar partes de la interfaz según quién está mirando, calculando esa condición en JavaScript y usándola para decidir qué JSX se renderiza (`{condicion && <Componente/>}`).

**El ejemplo real** — en `EquipoInfo.jsx`, antes de renderizar nada se calculan dos booleanos:

```jsx
const jugadorLogueado = JSON.parse(localStorage.getItem("jugador") || "null");
const esMiEquipo = jugadorLogueado?.equipo?.id === Number(equipoId);
const esCapitanDeEsteEquipo = !!jugadorLogueado?.esCapitan && esMiEquipo;
```

Y después, cualquier control de edición se envuelve así:

```jsx
{esCapitanDeEsteEquipo && (
  <Button variant="secondary" icon={<FiEdit2 />} onClick={handleEmpezarEdicionDescripcion}>
    Editar descripción
  </Button>
)}
```

Si `esCapitanDeEsteEquipo` es `false`, ese `<Button>` ni siquiera se crea — no está en el DOM, no es que esté oculto con CSS o deshabilitado. Un jugador que no es capitán de ese equipo, o que está viendo el equipo de otra persona, simplemente no tiene ese botón en la pantalla. Importante: esto decide qué se **muestra**, no qué se **permite** — la validación real de "¿este usuario puede editar este equipo?" tiene que existir también del lado del servidor.

## `font-variant-numeric: tabular-nums`

**La idea en criollo**: es una propiedad CSS que le dice a la tipografía "todos los dígitos (0-9) tienen que ocupar el mismo ancho horizontal". Sin esto, en la mayoría de las tipografías el "1" es más angosto que el "8", por ejemplo — lo cual está bien para leer texto normal, pero es un problema en una tabla de números que cambian: si las columnas de una tabla de estadísticas se actualizan y el ancho de cada dígito varía, los números "bailan" horizontalmente en vez de quedar alineados en una grilla prolija.

**El ejemplo real** — la utility class `.stat-numeral` en `tokens.css`:

```css
.stat-numeral {
  font-family: var(--font-display);
  font-variant-numeric: tabular-nums;
  font-weight: 700;
  letter-spacing: 0.03em;
}
```

Se usa en las columnas numéricas de `TablaPosiciones.jsx` (PJ, PG, PE, PP, DG, Pts) y en los resultados de partidos de `Estadisticas.jsx`/`EquipoInfo.jsx` — el efecto visual buscado es el de un tablero/marcador deportivo, donde los números quedan alineados como en un placar real.

## La escala de z-index (`--z-navbar`/`--z-dropdown`/`--z-modal`)

**La idea en criollo**: `z-index` es la propiedad CSS que decide qué elemento tapa a cuál cuando dos elementos se superponen en la pantalla (números más altos quedan "más arriba" en la pila visual). El problema típico es que si cada componente define su propio número sin ponerse de acuerdo con los demás (`z-index: 10` acá, `z-index: 20` allá, `z-index: 200` en otro lado, cada uno elegido sin mirar a los otros), en algún momento dos elementos que "no deberían" superponerse terminan haciéndolo, porque nadie tenía el panorama completo.

**El ejemplo real de este proyecto** (un bug que existió y se corrigió): el panel admin tiene un dropdown ("Mis Torneos", en `AdminHeader.jsx`) con `z-index: 200`, y por otro lado un modal de alta/edición de árbitros (`Arbitros.jsx`) que originalmente tenía `z-index: 20`. Si el dropdown quedaba abierto justo cuando se abría el modal, el dropdown (200) terminaba **por encima** del fondo oscuro semitransparente del modal (20) — algo que visualmente no tiene sentido, un modal se supone que tapa todo lo demás.

La solución fue declarar una escala explícita en `tokens.css`, en vez de números sueltos sin relación:

```css
--z-navbar: 100;
--z-dropdown: 200;
--z-modal: 300;
```

Y usarlos donde corresponde:

```css
/* MenuAdmin.css */
.admin-dropdown { z-index: var(--z-dropdown); }

/* Arbitros.css */
.ar-modal-overlay { z-index: var(--z-modal); }
```

Con esto, cualquiera que agregue un elemento nuevo que necesite superponerse a otros sabe de entrada dónde ubicarlo en la escala, en vez de inventar un número al azar.

## El fondo amarillo del autocompletado del navegador

**La idea en criollo**: cuando un navegador (típicamente Chrome) reconoce un campo de formulario como "autocompletable" (por ejemplo, porque el usuario ya guardó un valor ahí antes, o porque el campo se llama `email`/`name`), le pinta un fondo amarillo pálido por su cuenta, usando estilos internos del navegador que **no se pueden pisar con `background-color` normal** — el navegador los aplica con más prioridad que el CSS del sitio.

**Por qué importa acá**: el sistema de diseño del proyecto usa una paleta verde (`--color-grass`, `--color-surface`), así que un campo de formulario con fondo amarillo de golpe rompe la paleta — se ve como un error visual aunque el código CSS del campo esté "bien".

**La solución real, en `src/components/ui/TextField.css`**: el único truco que funciona contra este comportamiento del navegador es usar `box-shadow` con un `inset` (hacia adentro) del mismo color de fondo que se quiere mostrar, tan grande que tapa visualmente toda el área del input (`0 0 0 1000px`, un valor absurdamente grande a propósito, para que cubra el campo sea cual sea su tamaño):

```css
.ui-field-input:-webkit-autofill,
.ui-field-input:-webkit-autofill:hover,
.ui-field-input:-webkit-autofill:focus {
  -webkit-box-shadow: 0 0 0 1000px var(--color-surface) inset;
  -webkit-text-fill-color: var(--color-ink);
  transition: background-color 9999s ease-in-out 0s;
}
```

La línea de `transition` con un valor absurdamente largo (9999 segundos) es otro truco relacionado: evita que se vea un parpadeo de color amarillo-a-blanco cuando el navegador aplica el autocompletado, "congelando" la transición del color de fondo original del navegador para que nunca llegue a mostrarse.

## Testing con Playwright en modo headless

**La idea en criollo**: Playwright es una herramienta que controla un navegador real (Chrome, Firefox, etc.) desde código — puede abrir una página, hacer click, escribir en un formulario, y sacar una captura de pantalla, todo de forma automática. "Headless" (sin cabeza) significa que corre el navegador sin mostrar ninguna ventana — útil para correrlo desde una terminal o un servidor, donde no hay pantalla.

**Por qué hizo falta acá, y no alcanzaba con solo leer el código**: hay cosas que leyendo el CSS/JSX no se pueden confirmar con certeza, porque dependen de cómo el navegador calcula tamaños y posiciones en tiempo real:

- *¿Se corta algo horizontalmente en una pantalla de celular?* Se puede sospechar leyendo el CSS, pero para confirmarlo con seguridad hace falta medir el ancho real del contenido renderizado contra el ancho de la ventana.
- *¿Un elemento con `position: sticky` queda tapado por otro al hacer scroll?* Esto depende de las alturas reales de los elementos en pantalla, que solo se conocen cuando el navegador efectivamente los dibuja.

**El ejemplo real**: durante el cierre de la migración de UI se detectó (con Playwright, no leyendo código) que una tarjeta con `position: sticky` en el panel de "Crear Torneo" quedaba tapada por el navbar al hacer scroll. El chequeo fue, en esencia:

```js
const rects = await page.evaluate(() => {
  const nav = document.querySelector(".navbar");
  const summary = document.querySelector(".ct-summary-card");
  return {
    navBottom: nav.getBoundingClientRect().bottom,
    summaryTop: summary.getBoundingClientRect().top,
  };
});
// si summaryTop < navBottom, la tarjeta queda debajo del navbar
```

Ese chequeo reveló que un valor de CSS que "se veía razonable" leyendo el archivo (`top: 1.5rem`) en realidad era menor a la altura real del navbar (~70px), así que la tarjeta sí quedaba tapada — algo que no se podía haber confirmado solo leyendo el CSS de los dos elementos por separado.

## `git status --short` como verificación de alcance

**La idea en criollo**: `git status --short` muestra, en una línea por archivo, cuáles fueron modificados (`M`), agregados (`??` para archivos nuevos sin trackear) o borrados (`D`) desde el último commit. Es la forma más directa de ver "¿qué toqué realmente?" sin tener que confiar en la propia memoria de qué se editó.

**Por qué se usó al cierre de cada fase de este proyecto**: cada fase de la migración de UI tenía un alcance explícito y acotado (por ejemplo, "esta fase solo toca las pantallas de autenticación, no el panel admin"). Correr `git status --short` al final de cada fase, y comparar la lista de archivos modificados contra lo que decía el alcance, es una forma de **verificar objetivamente** que no se tocó nada de más — en vez de simplemente afirmar "no toqué nada fuera de lo pedido", que es fácil de decir pero no es una prueba. Es el mismo principio que "no confíes, verificá": una lista de archivos concreta es más confiable que una afirmación.

Ejemplo real (del cierre de la Fase 3, verificando que solo se tocaron las pantallas principales de jugador y no el panel admin ni la autenticación):

```
$ git status --short
 M src/pages/EquipoDetalle.jsx
 M src/pages/Equipos.jsx
 M src/pages/Estadisticas.jsx
 ...
?? src/components/Navbar.jsx
?? src/styles/Navbar.css
```

Si en esa lista hubiera aparecido, por ejemplo, `src/pages/Arbitros.jsx` (una pantalla del panel admin, fuera del alcance de esa fase), eso habría sido una señal clara de haberse ido de tema.
