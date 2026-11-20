import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
// En desarrollo, /api se redirige al servidor Express: el navegador ve un único origen,
// así la cookie de sesión (SameSite=Strict) viaja sin configurar CORS.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
})
