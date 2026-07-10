# Graph Report - .  (2026-06-13)

## Corpus Check
- Corpus is ~7,687 words - fits in a single context window. You may not need a graph.

## Summary
- 93 nodes · 146 edges · 14 communities (8 shown, 6 thin omitted)
- Extraction: 88% EXTRACTED · 12% INFERRED · 0% AMBIGUOUS · INFERRED: 18 edges (avg confidence: 0.9)
- Token cost: 600 input · 180 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Team & Match Pages|Team & Match Pages]]
- [[_COMMUNITY_Runtime Dependencies|Runtime Dependencies]]
- [[_COMMUNITY_Auth & Login Flow|Auth & Login Flow]]
- [[_COMMUNITY_Dev Tools & Linting|Dev Tools & Linting]]
- [[_COMMUNITY_App Entry & Assets|App Entry & Assets]]
- [[_COMMUNITY_Tournament Creation|Tournament Creation]]
- [[_COMMUNITY_Layout Shell|Layout Shell]]
- [[_COMMUNITY_React Brand Asset|React Brand Asset]]
- [[_COMMUNITY_ESLint Config Module|ESLint Config Module]]
- [[_COMMUNITY_Package Metadata|Package Metadata]]
- [[_COMMUNITY_Vite Brand Asset|Vite Brand Asset]]
- [[_COMMUNITY_Vite Config Module|Vite Config Module]]

## God Nodes (most connected - your core abstractions)
1. `apiFetch()` - 17 edges
2. `App()` - 16 edges
3. `GestorTorneos()` - 10 edges
4. `Estadisticas()` - 6 edges
5. `FixtureTorneo()` - 6 edges
6. `InicioSesion()` - 6 edges
7. `TablaPosiciones()` - 6 edges
8. `index.html - Entry HTML` - 6 edges
9. `scripts` - 5 edges
10. `EquipoDetalle()` - 5 edges

## Surprising Connections (you probably didn't know these)
- `Layout()` --semantically_similar_to--> `GestorTorneos()`  [INFERRED] [semantically similar]
  src/pages/Layout.jsx → src/pages/GestorTorneos.jsx
- `React + Vite Setup` --rationale_for--> `index.html - Entry HTML`  [INFERRED]
  README.md → index.html
- `Estadisticas()` --semantically_similar_to--> `FixtureTorneo()`  [INFERRED] [semantically similar]
  src/pages/Estadisticas.jsx → src/pages/FixtureTorneo.jsx
- `PrivateRoute()` --shares_data_with--> `localStorage Auth Token Pattern`  [INFERRED]
  src/App.jsx → src/utils/api.js
- `App()` --references--> `EquipoDetalle()`  [EXTRACTED]
  src/App.jsx → src/pages/EquipoDetalle.jsx

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Pages That Require Player Authentication via apiFetch** — pages_equipodetalle_equipodetalle, pages_equipos_equipos, pages_estadisticas_estadisticas, pages_fixturetorneo_fixturetorneo, pages_tablaposiciones_tablaposiciones, pages_miperfil_miperfil [INFERRED 0.95]
- **Child Routes Nested Under GestorTorneos Layout** — pages_tablaposiciones_tablaposiciones, pages_estadisticas_estadisticas, pages_fixturetorneo_fixturetorneo, pages_equipos_equipos, pages_miperfil_miperfil, pages_inicio_inicio [EXTRACTED 1.00]
- **Admin Authentication Flow** — pages_iniciosesionadmin_iniciosesionadmin, pages_menuadmin_menuadmin, concept_admin_dual_login [INFERRED 0.90]
- **HTML Entry Point Assembly** —  [EXTRACTED 1.00]

## Communities (14 total, 6 thin omitted)

### Community 0 - "Team & Match Pages"
Cohesion: 0.25
Nodes (10): EquipoDetalle(), Equipos(), Estadisticas(), FixtureTorneo(), GestorTorneos(), Inicio(), MenuAdmin(), MiPerfil() (+2 more)

### Community 1 - "Runtime Dependencies"
Cohesion: 0.12
Nodes (16): dependencies, lucide-react, react, react-dom, react-icons, react-router-dom, name, packageManager (+8 more)

### Community 2 - "Auth & Login Flow"
Cohesion: 0.16
Nodes (12): Dual Login Flow (Admin vs Player), localStorage Auth Token Pattern, Private Route Authentication Guard, InicioSesion(), InicioSesionAdmin Page, MenuAdmin(), NAV_ITEMS, Registro() (+4 more)

### Community 3 - "Dev Tools & Linting"
Cohesion: 0.17
Nodes (12): devDependencies, eslint, @eslint/js, eslint-plugin-react-hooks, eslint-plugin-react-refresh, globals, tailwindcss, @tailwindcss/vite (+4 more)

### Community 4 - "App Entry & Assets"
Cohesion: 0.24
Nodes (10): Boxicons CSS Library, Gestor de Torneos - Application, Google Fonts - Montserrat, index.html - Entry HTML, React + Vite Setup, README - React + Vite, #root div - React Mount Point, src/main.jsx - App Entry Point (+2 more)

### Community 5 - "Tournament Creation"
Cohesion: 0.36
Nodes (7): calcularPartidos(), CANCHAS_LIST, CrearTorneo(), FORMATOS, StatCard(), Toggle(), TORNEOS_RECIENTES

## Knowledge Gaps
- **38 isolated node(s):** `name`, `private`, `version`, `type`, `dev` (+33 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `devDependencies` connect `Dev Tools & Linting` to `Runtime Dependencies`?**
  _High betweenness centrality (0.058) - this node is a cross-community bridge._
- **Why does `App()` connect `Auth & Login Flow` to `Team & Match Pages`?**
  _High betweenness centrality (0.029) - this node is a cross-community bridge._
- **Are the 7 inferred relationships involving `GestorTorneos()` (e.g. with `Equipos()` and `Estadisticas()`) actually correct?**
  _`GestorTorneos()` has 7 INFERRED edges - model-reasoned connections that need verification._
- **What connects `name`, `private`, `version` to the rest of the system?**
  _39 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Runtime Dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.11764705882352941 - nodes in this community are weakly interconnected._