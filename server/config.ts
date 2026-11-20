import { randomBytes } from 'node:crypto'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { z } from 'zod'

// Configuración del servidor a partir de las variables de entorno (ver .env.example).
// Se valida al arrancar: si algo falta o no es válido, el servidor no inicia.
//
// Decisión sobre JWT_SECRET: en producción es obligatorio (mínimo 32 caracteres y distinto
// del valor de ejemplo). En desarrollo, si no está definido, se genera un secreto aleatorio
// que solo vive mientras el proceso está en marcha: así `npm run dev:all` funciona recién
// clonado, a cambio de que las sesiones se pierdan en cada reinicio. Si JWT_SECRET está
// definido pero es corto, el arranque falla también en desarrollo.

/** Carpeta raíz del proyecto (la que contiene package.json). */
export const RAIZ_PROYECTO = path.resolve(fileURLToPath(new URL('..', import.meta.url)))

/** Longitud mínima del secreto con que se firman las sesiones. */
export const LARGO_MINIMO_SECRETO = 32

/** Valor de ejemplo de .env.example: nunca se acepta en producción. */
const SECRETO_DE_EJEMPLO = 'cambia-este-valor-por-una-cadena-larga-y-aleatoria'

const RUTA_DB_PREDETERMINADA = 'db.json'
const RUTA_USUARIOS_PREDETERMINADA = path.join('server', 'data', 'usuarios.json')

/** Configuración ya validada que usan `index.ts` y `crearApp`. */
export interface Configuracion {
  produccion: boolean
  puerto: number
  jwtSecreto: string
  /** true si el secreto se generó al arrancar (solo en desarrollo, sin JWT_SECRET). */
  secretoEfimero: boolean
  cookieSegura: boolean
  /** Ruta absoluta del db.json de desembarques. */
  rutaDb: string
  /** Ruta absoluta del archivo de usuarios. */
  rutaUsuarios: string
}

/** La configuración no es válida; el mensaje enumera cada problema. */
export class ErrorConfiguracion extends Error {
  constructor(problemas: readonly string[]) {
    super(`Configuración no válida:\n- ${problemas.join('\n- ')}`)
    this.name = 'ErrorConfiguracion'
  }
}

type Entorno = Record<string, string | undefined>

/** Trata las variables vacías (`API_PORT=`) como no definidas. */
function sinVacias(entorno: Entorno): Entorno {
  return Object.fromEntries(
    Object.entries(entorno).filter(([, valor]) => valor !== undefined && valor.trim() !== ''),
  )
}

/** Convierte una ruta relativa a la raíz del proyecto en absoluta. */
export const resolverRuta = (ruta: string): string => path.resolve(RAIZ_PROYECTO, ruta)

const booleano = z
  .enum(['true', 'false'], { error: 'debe ser "true" o "false".' })
  .transform((valor) => valor === 'true')

const esquemaEntorno = z.object({
  NODE_ENV: z.string().default('development'),
  API_PORT: z.coerce
    .number({ error: 'debe ser un número.' })
    .int('debe ser un entero.')
    .min(1, 'debe estar entre 1 y 65535.')
    .max(65535, 'debe estar entre 1 y 65535.')
    .default(3001),
  JWT_SECRET: z.string().optional(),
  COOKIE_SECURE: booleano.default(false),
  DB_PATH: z.string().default(RUTA_DB_PREDETERMINADA),
  USUARIOS_PATH: z.string().default(RUTA_USUARIOS_PREDETERMINADA),
})

/** Lista "VARIABLE: mensaje" a partir de los errores de zod. */
function describirProblemas(error: z.ZodError): string[] {
  return error.issues.map(
    (problema) => `${problema.path.join('.') || 'entorno'}: ${problema.message}`,
  )
}

/**
 * Lee y valida la configuración.
 * @param entorno Variables de entorno (por defecto, `process.env`).
 * @throws ErrorConfiguracion si falta algo o no es válido.
 */
export function cargarConfiguracion(entorno: Entorno = process.env): Configuracion {
  const resultado = esquemaEntorno.safeParse(sinVacias(entorno))
  if (!resultado.success) throw new ErrorConfiguracion(describirProblemas(resultado.error))
  const variables = resultado.data
  const produccion = variables.NODE_ENV === 'production'

  const problemas: string[] = []
  let jwtSecreto = variables.JWT_SECRET?.trim() ?? ''
  let secretoEfimero = false

  if (!jwtSecreto) {
    if (produccion) {
      problemas.push('JWT_SECRET: es obligatorio en producción.')
    } else {
      jwtSecreto = randomBytes(48).toString('base64url')
      secretoEfimero = true
    }
  } else if (jwtSecreto.length < LARGO_MINIMO_SECRETO) {
    problemas.push(`JWT_SECRET: debe tener al menos ${LARGO_MINIMO_SECRETO} caracteres.`)
  } else if (produccion && jwtSecreto === SECRETO_DE_EJEMPLO) {
    problemas.push('JWT_SECRET: no uses en producción el valor de ejemplo de .env.example.')
  }
  if (problemas.length > 0) throw new ErrorConfiguracion(problemas)

  return {
    produccion,
    puerto: variables.API_PORT,
    jwtSecreto,
    secretoEfimero,
    cookieSegura: variables.COOKIE_SECURE,
    rutaDb: resolverRuta(variables.DB_PATH),
    rutaUsuarios: resolverRuta(variables.USUARIOS_PATH),
  }
}

/** Ruta absoluta del archivo de usuarios (para el seed, que no necesita JWT_SECRET). */
export function rutaUsuariosDesde(entorno: Entorno = process.env): string {
  return resolverRuta(sinVacias(entorno).USUARIOS_PATH ?? RUTA_USUARIOS_PREDETERMINADA)
}
