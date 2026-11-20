import cookieParser from 'cookie-parser'
import express, { type Express } from 'express'
import helmet from 'helmet'
import { AlmacenUsuarios } from './almacen/usuarios.ts'
import { crearAutenticar } from './middleware/autenticar.ts'
import {
  crearManejadorErrores,
  rutaNoEncontrada,
  type RegistrarError,
} from './middleware/errores.ts'
import { COSTE_HASH, crearRutasAuth, type LimiteIntentos } from './rutas/auth.ts'
import { crearRutasDesembarques } from './rutas/desembarques.ts'
import { crearRutasPublico } from './rutas/publico.ts'
import { crearRutasUsuarios } from './rutas/usuarios.ts'

// Aplicación Express de la API. No escucha ningún puerto (eso lo hace index.ts), así las
// pruebas la usan directamente con supertest y archivos de datos temporales.

const QUINCE_MINUTOS = 15 * 60 * 1000

export interface OpcionesApp {
  jwtSecreto: string
  cookieSegura: boolean
  /** Ruta del db.json de desembarques. */
  rutaDb: string
  /** Ruta del archivo de usuarios. */
  rutaUsuarios: string
  /** Coste de bcrypt (por defecto 12; las pruebas usan uno menor para ir rápido). */
  costeHash?: number
  /** Intentos fallidos de ingreso por IP (por defecto 5 cada 15 min). */
  limiteIngreso?: LimiteIntentos
  /** Registros por IP (por defecto 5 cada 15 min). */
  limiteRegistro?: LimiteIntentos
  /** Dónde se registran los errores inesperados (por defecto, console.error). */
  registrarError?: RegistrarError
}

const registrarEnConsola: RegistrarError = (error) => {
  console.error(error)
}

export function crearApp(opciones: OpcionesApp): Express {
  const sesion = { jwtSecreto: opciones.jwtSecreto, cookieSegura: opciones.cookieSegura }
  const almacen = new AlmacenUsuarios(opciones.rutaUsuarios)
  const autenticar = crearAutenticar({ almacen, ...sesion })
  const desembarques = crearRutasDesembarques(opciones.rutaDb, autenticar)

  const app = express()
  app.disable('x-powered-by')
  app.use(helmet())
  app.use(express.json({ limit: '20kb' }))
  app.use(cookieParser())

  const api = express.Router()
  // Las respuestas pueden llevar datos de la sesión: que ningún intermediario las guarde.
  api.use((_req, res, next) => {
    res.set('Cache-Control', 'no-store')
    next()
  })
  api.use(
    '/auth',
    crearRutasAuth({
      almacen,
      sesion,
      autenticar,
      costeHash: opciones.costeHash ?? COSTE_HASH,
      limiteIngreso: opciones.limiteIngreso ?? { ventanaMs: QUINCE_MINUTOS, maximo: 5 },
      limiteRegistro: opciones.limiteRegistro ?? { ventanaMs: QUINCE_MINUTOS, maximo: 5 },
    }),
  )
  api.use('/usuarios', crearRutasUsuarios(almacen, autenticar))
  api.use('/publico', crearRutasPublico(desembarques.leerDesembarques))
  api.use('/desembarques', desembarques.rutas)

  app.use('/api', api)
  app.use(rutaNoEncontrada)
  app.use(crearManejadorErrores(opciones.registrarError ?? registrarEnConsola))

  return app
}
