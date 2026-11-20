import type { RequestHandler, Response } from 'express'
import type { Usuario } from '../../src/types/usuario.ts'
import { aPublico, type AlmacenUsuarios } from '../almacen/usuarios.ts'
import { errorNoAutenticado, MENSAJES } from '../errores.ts'
import {
  borrarCookieSesion,
  COOKIE_SESION,
  verificarToken,
  type OpcionesSesion,
} from '../sesion.ts'

interface OpcionesAutenticar extends OpcionesSesion {
  almacen: AlmacenUsuarios
}

/**
 * Exige una sesión válida. Verifica el JWT de la cookie y relee al usuario del almacén:
 * si ya no existe o está desactivado responde 401 y borra la cookie.
 * Deja el usuario público (sin hash) en `res.locals.usuario`.
 */
export function crearAutenticar({
  almacen,
  jwtSecreto,
  cookieSegura,
}: OpcionesAutenticar): RequestHandler {
  return async (req, res, next) => {
    const cookies: Record<string, unknown> = req.cookies ?? {}
    const token = cookies[COOKIE_SESION]
    if (typeof token !== 'string' || token === '') throw errorNoAutenticado(MENSAJES.sinSesion)

    const id = verificarToken(token, jwtSecreto)
    const usuario = id ? await almacen.buscarPorId(id) : undefined
    if (!usuario || !usuario.activo) {
      borrarCookieSesion(res, cookieSegura)
      throw errorNoAutenticado(usuario ? MENSAJES.cuentaDesactivada : MENSAJES.sesionExpirada)
    }

    res.locals.usuario = aPublico(usuario)
    next()
  }
}

/**
 * Usuario de la sesión. Solo debe llamarse en rutas protegidas por `autenticar`.
 * @throws Error si la ruta no pasó por `autenticar` (error de programación).
 */
export function usuarioActual(res: Response): Usuario {
  const usuario = res.locals.usuario
  if (!usuario) throw new Error('La ruta usa usuarioActual sin pasar por autenticar.')
  return usuario
}
