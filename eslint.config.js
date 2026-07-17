import path from 'node:path';
import { fileURLToPath } from 'node:url';
import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import { FlatCompat } from '@eslint/eslintrc';
import { defineConfig, globalIgnores } from 'eslint/config';

// eslint-config-airbnb todavía se publica en formato legacy (.eslintrc), no
// flat config nativo — FlatCompat es el puente oficial de ESLint para poder
// seguir usando esos "shareable configs" clásicos dentro de eslint.config.js.
const compat = new FlatCompat({
  baseDirectory: path.dirname(fileURLToPath(import.meta.url)),
});

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      ...compat.extends('airbnb'),
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
      // Reglas de Airbnb pensadas para un setup con bundler distinto al de
      // este proyecto (Vite) o que no aplican a un proyecto sin build de
      // producción con extensiones .jsx explícitas — se desactivan acá en
      // vez de arrastrar cientos de falsos positivos en archivos existentes.
      'react/jsx-filename-extension': ['error', { extensions: ['.jsx'] }],
      'import/extensions': 'off',
      'import/no-unresolved': 'off',
      'import/prefer-default-export': 'off',
      'react/react-in-jsx-scope': 'off',
      // El repo está checkouteado en CRLF (Windows) — esta regla de Airbnb
      // asume LF y si no se apaga marca prácticamente cada línea del
      // proyecto como error, tapando cualquier hallazgo real de estilo.
      'linebreak-style': 'off',
    },
  },
  {
    files: ['**/*.ts'],
    extends: [...tseslint.configs.recommended],
    languageOptions: {
      globals: globals.browser,
    },
  },
])
