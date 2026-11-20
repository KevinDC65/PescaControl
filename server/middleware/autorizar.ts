import type { RequestHandler } from 'express'
import type { Rol } from '../../src/types/usuario.ts'
import { errorProhibido } from '../errores.ts'
import { usuarioActual } from './autenticar.ts'

/**
 * Permite seguir solo a los roles indicados; el resto recibe 403.
 * Debe ir después de `autenticar`, que relee el rol del almacén en cada petición.
 */
export function autorizar(...roles: readonly Rol[]): RequestHandler {
  return (_req, res, next) => {
    if (!roles.includes(usuarioActual(res).rol)) throw errorProhibido()
    next()
  }
}
