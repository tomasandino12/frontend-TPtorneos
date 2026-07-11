# Sistema de diseño

Todo lo que describe este documento vive en dos lugares:

- **`src/styles/tokens.css`** — los "tokens": variables CSS con los colores, tipografías, radios, sombras y niveles de z-index de toda la app.
- **`src/components/ui/`** — 4 componentes de React (`Button`, `TextField`, `Card`, `Alert`) que usan esos tokens y que reemplazan lo que antes cada pantalla reinventaba por su cuenta.

Antes de que esto existiera, cada pantalla tenía sus propios colores en hexadecimal repetidos a mano, y no había un solo `<Button>` o `<input>` reutilizable en todo el proyecto — cada botón, cada campo de formulario, cada card blanca con sombra, estaba copiado y pegado de la pantalla más parecida. El detalle de ese problema está en `../auditoria-ui.md`.

## Los tokens (`src/styles/tokens.css`)

Un **token** acá es simplemente una variable CSS (`--algo: valor;`) declarada una sola vez en `:root`, que después se usa en cualquier archivo `.css` del proyecto como `var(--algo)`. La ventaja frente a escribir `#1F5233` en 10 archivos distintos: si mañana hay que ajustar el verde de marca, se cambia en un solo lugar y se actualiza toda la app.

### Paleta con nombre

Son 7 colores con un significado fijo — no son "verde 1", "verde 2", son roles:

| Token | Valor | Para qué se usa | Cuándo NO usarlo |
|---|---|---|---|
| `--color-pitch` | `#1F5233` | Verde cancha oscuro — marca primaria, texto de marca, botones primarios (`Button variant="primary"`) | No usarlo como color de advertencia o de estado neutral |
| `--color-turf` | `#3F8452` | Verde cancha medio — estados de hover, acentos secundarios, y el color "éxito" de `Alert` | Es un color de *interacción/estado*, no el color de marca principal (ese es `--color-pitch`) |
| `--color-whistle` | `#D98E04` | Ámbar "silbato" — **el único** color de advertencia, pendiente o borrador de toda la app | No es un acento decorativo. Si algo no es realmente "atención/pendiente", no debería llevar este color — este fue justamente uno de los bugs que corrigió la migración: el estado "Borrador" de un torneo usaba este color como si estar en borrador fuera una alerta, cuando en realidad es un estado neutral (ver `decisiones.md`, Fase 4) |
| `--color-alert` | `#B3261E` | Rojo único de error — reemplaza 3 paletas de rojo distintas que convivían antes (una por pantalla) | No usarlo para "esto es importante" si no es un error real. La única excepción documentada es el badge "EN VIVO" de Inicio (ver `glosario.md` y `decisiones.md`) |
| `--color-paper` | `#F5F1E6` | Marfil cálido — fondo de **página**: el área exterior detrás de todo (`main`/`.content`, `.subpagina-container`, `.MiPerfil`, `.auth-page`, `.admin-main-content`) | No usarlo en el recuadro "hero"/header de una pantalla (ícono + título + subtítulo) — ese rol es de `--color-grass`. Si ambos quedan iguales, el recuadro se pierde contra el fondo (bug real, ya pasó dos veces) |
| `--color-grass` | `#EAF6EC` | Verde pálido — fondo de los recuadros "hero"/header con ícono + título + subtítulo de cada pantalla (`.page-header`, `.mi-perfil-container`). Reemplazó al marfil que tenía este mismo rol en la Fase 1, tras verlo en vivo contra datos reales: preferencia visual confirmada, no un bug de las fases anteriores | No usarlo como fondo de página — ese rol es de `--color-paper`. Son roles separados a propósito, aunque ambos sean tonos de verde/marfil muy claros: la única forma de que el recuadro hero se note es que su color sea *distinto* al del fondo que lo rodea |
| `--color-ink` | `#16241B` | Texto principal — negro con base verde, no un gris neutro | — |

Excepción puntual: Tabla de Posiciones (`TablaPosiciones.css`) usa `--color-grass` como fondo de su wrapper de página (`.tabla-wrapper`) en vez de `--color-paper` — quedó así deliberadamente porque el usuario confirmó en vivo que esa pantalla ya se ve bien tal cual está, y no forma parte del alcance de este ajuste.

Además hay variantes derivadas para estados de interacción: `--color-pitch-dark` (botón primario presionado), `--color-alert-dark` (botón destructivo en hover).

### Neutros derivados

Estos no son parte de "la paleta de marca", son grises/blancos que se apoyan en los 7 colores de arriba para que las superficies (cards, bordes, texto secundario) combinen con el resto:

| Token | Valor | Uso |
|---|---|---|
| `--color-surface` | `#FFFFFF` | Fondo de cards e inputs, siempre sobre `--color-paper` (fondo de página) |
| `--color-surface-muted` | `#EFE8D6` | Hover sobre `--color-surface`, filas "zebra" en tablas |
| `--color-border` | `#DCD3BC` | Bordes sutiles |
| `--color-muted` | `#5B6B5E` | Texto secundario (subtítulos, ayudas) — un gris con matiz verde, no un gris puro |

### Superficies semánticas (para `Alert`)

Cada variante de `Alert` tiene su propio par fondo/texto, derivado de la paleta de arriba:

```css
--color-success-bg: #E1F1E4;   --color-success-text: var(--color-pitch);
--color-error-bg:   #F8DEDC;   --color-error-text:   #7A1B16;
--color-warning-bg: #FBEBCB;   --color-warning-text: #7A5205;
--color-info:    var(--color-muted);          /* ver nota abajo */
--color-info-bg: var(--color-surface-muted);
--color-info-text: var(--color-ink);
```

Nota tal cual está en el código fuente sobre por qué "info" es distinto a los otros tres: la paleta de marca no tiene un azul/hue propio, así que en vez de inventar un séptimo color, la variante "info" de `Alert` se apoya en los neutros ya derivados (queda gris, no colorido). Esta fue una decisión deliberada de la Fase 1: no agregar un color nuevo solo para tener un "info azul" cuando el dominio (cancha de fútbol) no lo pedía.

**`--color-success-bg` (`#E1F1E4`) vs. `--color-grass` (`#EAF6EC`) — no son el mismo token, aunque el hex se parezca mucho a simple vista.** Son roles completamente distintos que casualmente cayeron en el mismo verde clarísimo:
- `--color-success-bg` es semántico: significa "estado positivo/éxito" — lo usan `Alert variant="success"`, el link activo del navbar (`.gt-navlinks a.active` / `.navdiv ul a.active`), la tarjeta "partido ganado" de `Estadisticas.css`, badges de estado "En curso" en `MisTorneos.jsx`, y varias superficies del panel admin (`MenuAdmin.css`, `Arbitros.css`, `InscribirEquipos.css`). Se usa en decenas de lugares chicos y puntuales, nunca como fondo de una sección grande.
- `--color-grass` es estructural: significa "soy el recuadro hero de esta pantalla" — lo usa únicamente `.page-header` y `.mi-perfil-container`, siempre como fondo de una sección grande junto al fondo `--color-paper` de la página.

Esta confusión ya causó un bug real: en una fase anterior, `.page-header` usaba `--color-success-bg` en vez de `--color-grass` "porque quedaba prácticamente igual visualmente" — y por eso, cuando el fondo de página todavía era del mismo verde, el recuadro hero desaparecía contra el fondo (los dos verdes clarísimos, casi indistinguibles a simple vista, sumado a que encima estaban mal separados). No se consolidan en un solo token porque `--color-success-bg` tiene que poder seguir usándose en Alerts/badges sin arrastrar involuntariamente el fondo de ningún hero, y viceversa.

### Tipografía

```css
--font-display: "Bebas Neue", "Arial Narrow", sans-serif;
--font-body: "Inter", system-ui, Avenir, Helvetica, Arial, sans-serif;
```

- **`--font-display`** (Bebas Neue): tipografía condensada en mayúsculas, pensada para títulos y cifras destacadas — el "look" de tablero/marcador deportivo. Se usa en los `<h1>` de los hero de pantalla (ej. `.admin-hero-title h1` en `MenuAdmin.css`, `.auth-brand` en las pantallas de login) y en `.stat-numeral` (ver abajo). **Nunca en párrafos ni formularios** — es puramente decorativa a tamaños chicos y sería difícil de leer.
- **`--font-body`** (Inter): todo lo demás — texto de UI, formularios, tablas, botones. Es la tipografía "de trabajo" del proyecto.

Las dos se cargan por `<link>` de Google Fonts en `index.html`, no como paquete npm.

### `.stat-numeral`

Es una utility class (no un token, una clase CSS lista para usar) pensada específicamente para cifras en tablas de estadísticas:

```css
.stat-numeral {
  font-family: var(--font-display);
  font-variant-numeric: tabular-nums;
  font-weight: 700;
  letter-spacing: 0.03em;
}
```

Se usa hoy en `TablaPosiciones.jsx` (columnas PJ/PG/PE/PP/DG/Pts) y en `Estadisticas.jsx`/`EquipoInfo.jsx` (resultados de partidos, edad de jugadores). Ver `glosario.md` para la explicación de `font-variant-numeric: tabular-nums`.

### Radios, sombras, foco y z-index

```css
--radius-sm: 6px;   --radius-md: 10px;   --radius-lg: 16px;
--shadow-sm: 0 1px 2px rgba(22, 36, 27, 0.08);
--shadow-md: 0 4px 14px rgba(22, 36, 27, 0.12);
--focus-ring: 0 0 0 3px rgba(63, 132, 82, 0.45);
--z-navbar: 100;   --z-dropdown: 200;   --z-modal: 300;
```

`--focus-ring` es el anillo de foco por teclado que usan todos los componentes de `ui/` y la mayoría de los botones/links personalizados del resto de la app (ver `glosario.md`, "Foco visible por teclado"). La escala de z-index se explica con su ejemplo real en `glosario.md`.

---

## Los componentes (`src/components/ui/`)

Los 4 se importan así, desde el archivo "barrel" `src/components/ui/index.js` (ver `glosario.md`):

```js
import { Button, TextField, Card, Alert } from "../components/ui";
```

### `Button`

```jsx
export default function Button({
  variant = "primary",     // "primary" | "secondary" | "danger" | "ghost"
  icon = null,               // nodo de react-icons, opcional
  iconPosition = "left",     // "left" | "right"
  className = "",
  children,
  ...rest                    // onClick, type, disabled, aria-label, etc. van directo al <button>
})
```

Las 4 variantes tienen un rol fijo (comentado en `Button.css`):
- **`primary`** (por defecto): acción principal — crear, guardar, confirmar. Fondo `--color-pitch`.
- **`secondary`**: acción alternativa — cancelar, volver con jerarquía visible. Fondo blanco, borde.
- **`danger`**: acción destructiva — eliminar, salir de algo. Fondo `--color-alert`.
- **`ghost`**: acción de bajo énfasis, tipo texto — ej. "volver" cuando no hace falta que compita visualmente con el resto.

Ejemplo real (`MiPerfil.jsx`):

```jsx
<Button variant="danger" icon={<FiLogOut />} onClick={handleSalirEquipo}>
  Salir del equipo
</Button>
```

Y el caso más simple, sin variante explícita (usa `primary` por defecto), de `InicioSesion.jsx`:

```jsx
<Button type="submit" disabled={isLoading}>
  {isLoading ? "Entrando..." : "Entrar"}
</Button>
```

### `TextField`

```jsx
export default function TextField({
  label,          // texto del <label>, opcional
  type = "text",  // cualquier type de <input> nativo
  icon = null,    // ícono a la izquierda, opcional
  error = "",     // si viene seteado, pinta el borde de rojo y muestra el texto debajo
  id,
  className = "",
  ...rest         // value, onChange, name, placeholder, required, disabled, readOnly, etc.
})
```

Es el único componente de campo de formulario de todo el proyecto — reemplaza lo que antes eran 5 implementaciones casi idénticas (una por pantalla de login/registro) más los campos sueltos de cada formulario del panel admin.

El detalle importante: si `type="password"`, el campo **siempre** agrega el botón de mostrar/ocultar contraseña y **siempre** alterna entre `FiEye`/`FiEyeOff` según su propio estado interno (`useState` adentro del componente, no algo que cada pantalla tenga que manejar). Esto no es una elección de estilo — fue la forma de resolver de raíz un bug que la auditoría original encontró: antes, una pantalla de login tenía el ícono que nunca alternaba, y otra pantalla tenía un campo de "confirmar contraseña" al que directamente le faltaba el botón. Con `TextField`, ese bug ya no puede volver a pasar porque no depende de que cada pantalla lo implemente bien.

Ejemplo real con ícono y error (`Registro.jsx`):

```jsx
<TextField
  label="Email"
  type="email"
  icon={<FiMail />}
  name="email"
  value={form.email}
  onChange={handleChange}
  placeholder="juanperez@email.com"
  error={emailError}
  required
/>
```

Limitación a tener en cuenta: `TextField` solo renderiza un `<input>`. Cuando una pantalla necesita un `<select>` (por ejemplo "Posición" en `Registro.jsx` o `MiPerfil.jsx`), no usa `TextField` — arma el mismo look a mano reutilizando las clases CSS internas del componente (`ui-field`, `ui-field-control`, `ui-field-label`, `ui-field-input`), así:

```jsx
<div className="ui-field">
  <label className="ui-field-label" htmlFor="posicion">Posición</label>
  <div className="ui-field-control">
    <select id="posicion" className="ui-field-input" ...>
      ...
    </select>
  </div>
</div>
```

Esto funciona porque las clases CSS de `TextField.css` son globales (no hay CSS Modules en el proyecto), pero es un acoplamiento implícito: si el día de mañana se renombran esas clases dentro de `TextField.jsx`/`TextField.css`, hay que actualizar a mano estos 3 lugares (`Registro.jsx`, `MiPerfil.jsx`, `CrearTorneo.jsx`) que las reusan por fuera del componente.

### `Card`

```jsx
export default function Card({ as, className = "", children, ...rest }) {
  const Tag = as || "div";
  return <Tag className={`ui-card ${className}`.trim()} {...rest}>{children}</Tag>;
}
```

Es el contenedor de superficie genérico: fondo blanco, borde sutil, radio grande, sombra chica (`--shadow-sm`). Reemplaza ~5 variantes de "card"/"hero" que antes estaban duplicadas casi al byte entre distintas pantallas del panel admin. La prop `as` permite renderizarlo como otra etiqueta HTML (por ejemplo `"section"`) sin perder el estilo — útil porque semánticamente una card a veces debería ser una `<section>` y no un `<div>`.

Ejemplo real (`InicioSesion.jsx`):

```jsx
<Card className="auth-card">
  <div className="auth-header">...</div>
  <form className="auth-form">...</form>
</Card>
```

### `Alert`

```jsx
const CONFIG = {
  success: { icon: FiCheckCircle, className: "ui-alert-success" },
  error:   { icon: FiXCircle,     className: "ui-alert-error" },
  warning: { icon: FiAlertTriangle, className: "ui-alert-warning" },
  info:    { icon: FiInfo,        className: "ui-alert-info" },
};

export default function Alert({ variant = "info", children, className = "", ...rest })
```

Reemplaza tanto los `alert()`/`confirm()` nativos del navegador que usaban varias pantallas para dar feedback, como las cajas de error hechas a mano por cada pantalla. La variante determina color **e** ícono a la vez — no son dos cosas configurables por separado. Esto es deliberado: el bug que motivó este componente era exactamente que una pantalla mostraba un mensaje puramente informativo con la clase CSS de error (por un problema de especificidad CSS, no a propósito), así que con `Alert` es estructuralmente imposible que un mensaje `variant="info"` termine viéndose como error — el componente decide el look en un solo lugar, no hay forma de que "se cuele" el estilo equivocado.

Ejemplo simple (`EquipoInfo.jsx`):

```jsx
<Alert variant="info">No hay jugadores registrados.</Alert>
```

`Alert` también acepta contenido más rico que un string simple, como en `Estadisticas.jsx`:

```jsx
<Alert variant="error">
  <strong>No perteneces a un equipo o tu equipo no tiene un torneo activo</strong>
  <p>Uníte o creá un equipo, o participá de un torneo activo...</p>
</Alert>
```
