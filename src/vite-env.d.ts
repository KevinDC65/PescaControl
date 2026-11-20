/// <reference types="vite/client" />

/** Variables de entorno que la aplicación lee con `import.meta.env`. */
interface ImportMetaEnv {
  /** URL base de json-server (por defecto, http://localhost:3001). */
  readonly VITE_API_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
