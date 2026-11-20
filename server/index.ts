import { crearApp } from './app.ts'
import { cargarConfiguracion, ErrorConfiguracion } from './config.ts'

// Punto de entrada: valida la configuración y pone la API a escuchar en API_PORT (no se usa PORT a propósito: muchas herramientas lo definen para el frontend).
// `npm run server` carga .env si existe (opción --env-file-if-exists de Node).

function iniciar(): void {
  const config = cargarConfiguracion()
  const app = crearApp(config)
  const servidor = app.listen(config.puerto, (error?: Error) => {
    if (error) throw error
    const aviso = config.secretoEfimero
      ? '\n  Aviso: JWT_SECRET no está definido; se usa un secreto temporal y las sesiones se' +
        ' pierden al reiniciar. Copia .env.example a .env y define JWT_SECRET.'
      : ''
    console.info(`API de PescaControl en http://localhost:${config.puerto}/api${aviso}`)
  })

  const cerrar = (): void => {
    servidor.close(() => process.exit(0))
  }
  process.once('SIGINT', cerrar)
  process.once('SIGTERM', cerrar)
}

try {
  iniciar()
} catch (error) {
  if (!(error instanceof ErrorConfiguracion)) throw error
  console.error(error.message)
  process.exitCode = 1
}
