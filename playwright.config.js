import { defineConfig } from '@playwright/test';

/**
 * Test end-to-end (consigna: "al menos 1 test end-to-end" — 3.1.2 Frontend).
 * Usa el canal `msedge` en vez del Chromium que Playwright bajaría por
 * default, para no depender de descargar un browser nuevo en esta máquina.
 *
 * Requiere que el backend (http://localhost:3000) ya esté corriendo con
 * la cuenta de prueba `capitan.prueba@gestor.com` / `Prueba1234` — no lo
 * levanta este config, solo el frontend.
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  fullyParallel: false,
  retries: 0,
  use: {
    baseURL: 'http://localhost:5173',
    channel: 'msedge',
    headless: true,
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
    timeout: 30000,
  },
});
