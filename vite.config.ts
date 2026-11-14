/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { configDefaults } from 'vitest/config'
import { defineConfig } from 'vite'

// Backend local para `npm run dev`. Solo se lee aquí, en Node: no lleva prefijo VITE_ y nunca llega al cliente.
const backend = process.env.BACKEND_URL ?? 'http://localhost:8080'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    // Mismo enrutado que el Caddy de producción: el código usa siempre rutas relativas
    proxy: {
      '/api': { target: backend, changeOrigin: true },
      '/actuator': { target: backend, changeOrigin: true },
    },
  },
  test: {
    environment: 'jsdom',
    // Los E2E son de Playwright (npm run test:e2e), no de Vitest
    exclude: [...configDefaults.exclude, 'e2e/**'],
    setupFiles: ['./src/pruebas/setup.ts'],
    restoreMocks: true,
  },
})
