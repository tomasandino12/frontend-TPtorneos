import { test, expect } from '@playwright/test';

/**
 * Test end-to-end del login de jugador: navegador real -> frontend (React) ->
 * backend (Express) -> base de datos, de punta a punta, sin mockear nada.
 * Usa la cuenta de prueba persistente `capitan.prueba@gestor.com` (ver
 * mensajes anteriores de la sesión: cuentas creadas para pruebas manuales).
 */
test.describe('Login de jugador', () => {
  test('con credenciales válidas entra y llega a la pantalla de inicio', async ({ page }) => {
    await page.goto('/');

    await page.fill('input[type="email"]', 'capitan.prueba@gestor.com');
    await page.fill('input[type="password"]', 'Prueba1234');

    page.once('dialog', (dialog) => dialog.accept());
    await page.click('button[type="submit"]');

    await page.waitForURL('**/gestorTorneos/**');
    // .first(): el rediseño mobile agregó una bottom-nav que también repite
    // la etiqueta "Mi Perfil" (además del navbar de escritorio) — ambas
    // coexisten en el DOM según el viewport, así que hay que desambiguar.
    await expect(page.getByText('Mi Perfil').first()).toBeVisible();
  });

  test('con contraseña incorrecta muestra un error y no navega', async ({ page }) => {
    await page.goto('/');

    await page.fill('input[type="email"]', 'capitan.prueba@gestor.com');
    await page.fill('input[type="password"]', 'contraseña-incorrecta');
    await page.click('button[type="submit"]');

    await expect(page.getByText(/contraseña incorrecta/i)).toBeVisible();
    expect(page.url()).toContain('localhost:5173/');
  });
});
