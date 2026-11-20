import type { CookieOptions, Response } from 'express'
import jwt from 'jsonwebtoken'
import type { Rol } from '../src/types/usuario.ts'

// Sesión en una cookie httpOnly con un JWT HS256. El token solo lleva `{ sub, rol }`; el
// rol del token no se usa para autorizar: el middleware `autenticar` relee el usuario del
// almacén en cada petición, así un usuario desactivado o degradado pierde permisos al instante.

/** Nombre de la cookie de sesión. */
export const COOKIE_SESION = 'pc_sesion'

/** Duración de la sesión: 8 horas. */
export const DURACION_SESION_MS = 8 * 60 * 60 * 1000

const ALGORITMO = 'HS256'

/** Datos que la sesión necesita para firmar y poner la cookie. */
export interface OpcionesSesion {
  jwtSecreto: string
  cookieSegura: boolean
}

function opcionesCookie(cookieSegura: boolean): CookieOptions {
  return { httpOnly: true, sameSite: 'strict', secure: cookieSegura, path: '/' }
}

/** Firma el token de un usuario. */
export function firmarToken(id: string, rol: Rol, jwtSecreto: string): string {
  return jwt.sign({ rol }, jwtSecreto, {
    algorithm: ALGORITMO,
    subject: id,
    expiresIn: DURACION_SESION_MS / 1000,
  })
}

/**
 * Verifica firma, algoritmo y expiración del token.
 * @returns El id del usuario (`sub`), o null si el token no es válido.
 */
export function verificarToken(token: string, jwtSecreto: string): string | null {
  try {
    const datos = jwt.verify(token, jwtSecreto, { algorithms: [ALGORITMO] })
    if (typeof datos !== 'object' || typeof datos.sub !== 'string' || datos.sub === '') return null
    return datos.sub
  } catch {
    return null
  }
}

/** Inicia la sesión: pone la cookie con el token firmado. */
export function ponerCookieSesion(
  res: Response,
  usuario: { id: string; rol: Rol },
  { jwtSecreto, cookieSegura }: OpcionesSesion,
): void {
  res.cookie(COOKIE_SESION, firmarToken(usuario.id, usuario.rol, jwtSecreto), {
    ...opcionesCookie(cookieSegura),
    maxAge: DURACION_SESION_MS,
  })
}

/** Cierra la sesión: borra la cookie con los mismos atributos con que se creó. */
export function borrarCookieSesion(res: Response, cookieSegura: boolean): void {
  res.clearCookie(COOKIE_SESION, opcionesCookie(cookieSegura))
}
