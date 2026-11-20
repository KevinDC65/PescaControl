import { defineConfig } from 'vitest/config'

// Pruebas del servidor (Vitest + Supertest). Se ejecutan con `npm test`.
export default defineConfig({
  test: {
    include: ['server/**/*.test.ts'],
    environment: 'node',
  },
})
