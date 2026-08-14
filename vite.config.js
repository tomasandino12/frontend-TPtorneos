import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.js'],
    globals: true,
    // Sin este exclude, Vitest también recoge e2e/*.spec.js (son tests de
    // Playwright, no de Vitest) y la suite reporta un archivo fallido con
    // "Playwright Test did not expect test.describe() to be called here".
    exclude: ['**/node_modules/**', '**/dist/**', 'e2e/**'],
  },
})
