import { compare, hash } from 'bcryptjs'
import { randomUUID } from 'node:crypto'
import { Router, type RequestHandler } from 'express'
import { rateLimit } from 'express-rate-limit'
import { z } from 'zod'
import type { RespuestaUsuario } from '../../src/types/usuario.ts'
import { aPublico, ErrorCorreoDuplicado, type AlmacenUsuarios } from '../almacen/usuarios.ts'
import { errorConflicto, errorNoAutenticado, errorProhibido, MENSAJES } from '../errores.ts'
import { usuarioActual } from '../middleware/autenticar.ts'
import { borrarCookieSesion, ponerCookieSesion, type OpcionesSesion } from '../sesion.ts'
import { validarCon } from '../validacion.ts'

// Rutas /api/auth: registro, ingreso, salida y consulta de la sesión.

/** Ventana y máximo de peticiones por IP de un limitador. */
export interface LimiteIntentos {
  ventanaMs: number
  maximo: number
}

/** Coste de bcrypt para las contraseñas (2^12 iteraciones). */
export const COSTE_HASH = 12

/** Mismas reglas de nombre, correo y contraseña para el registro y el seed. */
export const esquemaRegistro = z.object({
  nombre: z
    .string({ error: 'El nombre es obligatorio.' })
    .trim()
    .min(2, 'El nombre debe tener entre 2 y 60 caracteres.')
    .max(60, 'El nombre debe tener entre 2 y 60 caracteres.'),
  correo: z
    .string({ error: 'El correo es obligatorio.' })
    .trim()
    .toLowerCase()
    .min(1, 'El correo es obligatorio.')
    .max(254, 'El correo es demasiado largo.')
    .pipe(z.email({ error: 'Ingresa un correo válido (ej. nombre@empresa.pe).' })),
  contrasena: z
    .string({ error: 'La contraseña es obligatoria.' })
    .min(8, 'La contraseña debe tener entre 8 y 72 caracteres.')
    .max(72, 'La contraseña debe tener entre 8 y 72 caracteres.')
    // bcrypt solo usa los primeros 72 bytes: con tildes o eñes un texto de 72 caracteres
    // puede superarlos.
    .refine(
      (contrasena) => Buffer.byteLength(contrasena, 'utf8') <= 72,
      'La contraseña es demasiado larga; usa menos tildes o símbolos.',
    )
    .refine(
      (contrasena) => /\p{L}/u.test(contrasena) && /\d/.test(contrasena),
      'La contraseña debe incluir al menos una letra y un número.',
    ),
})

const esquemaIngreso = z.object({
  correo: z
    .string({ error: 'Ingresa tu correo.' })
    .trim()
    .toLowerCase()
    .min(1, 'Ingresa tu correo.')
    .max(254, 'El correo es demasiado largo.'),
  contrasena: z
    .string({ error: 'Ingresa tu contraseña.' })
    .min(1, 'Ingresa tu contraseña.')
    .max(1024, 'La contraseña es demasiado larga.'),
})

/** Limitador por IP con respuesta 429 en el formato de error de la API. */
function crearLimitador(
  { ventanaMs, maximo }: LimiteIntentos,
  accion: string,
  soloFallidos: boolean,
): RequestHandler {
  const minutos = Math.max(1, Math.ceil(ventanaMs / 60_000))
  return rateLimit({
    windowMs: ventanaMs,
    limit: maximo,
    skipSuccessfulRequests: soloFallidos,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: {
      error: `Demasiados intentos de ${accion}. Espera ${minutos} ${minutos === 1 ? 'minuto' : 'minutos'} e inténtalo de nuevo.`,
    },
  })
}

export interface OpcionesRutasAuth {
  almacen: AlmacenUsuarios
  sesion: OpcionesSesion
  autenticar: RequestHandler
  costeHash: number
  limiteIngreso: LimiteIntentos
  limiteRegistro: LimiteIntentos
}

export function crearRutasAuth({
  almacen,
  sesion,
  autenticar,
  costeHash,
  limiteIngreso,
  limiteRegistro,
}: OpcionesRutasAuth): Router {
  const rutas = Router()

  // Hash de una contraseña aleatoria con el mismo coste que los reales: si el correo no
  // existe se compara contra él, así la respuesta tarda lo mismo y no revela qué correos
  // están registrados. Se calcula al crear las rutas para que el primer intento tampoco
  // tarde distinto.
  const hashFicticio = hash(randomUUID(), costeHash)
  hashFicticio.catch(() => undefined)

  // Cuenta todos los intentos de registro (también los fallidos: limita la búsqueda de
  // correos registrados mediante el 409).
  rutas.post('/registro', crearLimitador(limiteRegistro, 'registro', false), async (req, res) => {
    const datos = validarCon(esquemaRegistro, req.body ?? {}, 'Revisa los datos del registro.')
    const hashContrasena = await hash(datos.contrasena, costeHash)
    let usuario
    try {
      usuario = await almacen.crear({
        nombre: datos.nombre,
        correo: datos.correo,
        hash: hashContrasena,
      })
    } catch (error) {
      if (error instanceof ErrorCorreoDuplicado) throw errorConflicto(error.message)
      throw error
    }
    ponerCookieSesion(res, usuario, sesion)
    res.status(201).json({ usuario: aPublico(usuario) } satisfies RespuestaUsuario)
  })

  // Solo cuentan los intentos fallidos (respuestas 4xx/5xx).
  rutas.post('/ingreso', crearLimitador(limiteIngreso, 'ingreso', true), async (req, res) => {
    const { correo, contrasena } = validarCon(
      esquemaIngreso,
      req.body ?? {},
      'Ingresa tu correo y contraseña.',
    )
    const usuario = await almacen.buscarPorCorreo(correo)
    const coincide = await compare(contrasena, usuario?.hash ?? (await hashFicticio))
    if (!usuario || !coincide) throw errorNoAutenticado(MENSAJES.credencialesIncorrectas)
    // El estado de la cuenta solo se revela a quien conoce la contraseña.
    if (!usuario.activo) throw errorProhibido(MENSAJES.cuentaDesactivada)
    ponerCookieSesion(res, usuario, sesion)
    res.json({ usuario: aPublico(usuario) } satisfies RespuestaUsuario)
  })

  rutas.post('/salida', (_req, res) => {
    borrarCookieSesion(res, sesion.cookieSegura)
    res.status(204).end()
  })

  rutas.get('/sesion', autenticar, (_req, res) => {
    res.json({ usuario: usuarioActual(res) } satisfies RespuestaUsuario)
  })

  return rutas
}
