# Evidencia de ejecución de tests — Frontend

Salida real de `pnpm test` (Vitest, unitarios) y `pnpm test:e2e` (Playwright, end-to-end), corridas el 14/08/2026. Sin editar — se filtraron únicamente los códigos de color de la terminal para que se lea como texto plano.

## Tests unitarios (`pnpm test`)

```
> gestor-torneos-frontend@0.0.0 test
> vitest run

 RUN  v2.1.9 C:/Users/Mateo/GestorTorneos/frontend

 ✓ src/components/ui/Button.test.jsx (6 tests) 182ms

 Test Files  1 passed (1)
      Tests  6 passed (6)
   Start at  00:19:06
   Duration  1.81s (transform 89ms, setup 175ms, collect 360ms, tests 182ms, environment 616ms, prepare 171ms)
```

## Tests end-to-end (`pnpm test:e2e`)

Requiere el backend corriendo en `localhost:3000` (ver `README.md`). Usa Microsoft Edge (`channel: 'msedge'` en `playwright.config.js`) y la cuenta de prueba persistente `capitan.prueba@gestor.com`.

```
> gestor-torneos-frontend@0.0.0 test:e2e
> playwright test

Running 2 tests using 1 worker

  ok 1 e2e\login.spec.js:10:3 › Login de jugador › con credenciales válidas entra y llega a la pantalla de inicio (2.5s)
  ok 2 e2e\login.spec.js:26:3 › Login de jugador › con contraseña incorrecta muestra un error y no navega (822ms)

  2 passed (5.4s)
```

**Total: 8 tests entre las dos suites, 100% en verde** (6 unitarios de componente + 2 end-to-end).
