import { Router, type RequestHandler } from 'express'
import { z } from 'zod'
import type { CambiosUsuario, Usuario } from '../../src/types/usuario.ts'
import { aPublico, type AlmacenUsuarios, type UsuarioGuardado } from '../almacen/usuarios.ts'
import { errorConflicto, errorNoEncontrado, ErrorHttp } from '../errores.ts'
import { usuarioActual } from '../middleware/autenticar.ts'
import { autorizar } from '../middleware/autorizar.ts'
import { validarCon } from '../validacion.ts'

// Rutas /api/usuarios: solo para el rol Jefe.

const esquemaCambios = z
  .strictObject({
    rol: z.enum(['operador', 'jefe'], { error: 'El rol debe ser "operador" o "jefe".' }).optional(),
    activo: z.boolean({ error: 'El estado debe ser verdadero o falso.' }).optional(),
  })
  .refine((cambios) => cambios.rol !== undefined || cambios.activo !== undefined, {
    error: 'Indica el rol o el estado que quieres cambiar.',
  })

export const MENSAJES_USUARIOS = Object.freeze({
  noExiste: 'El usuario no existe.',
  autoDesactivar: 'No puedes desactivar tu propia cuenta.',
  autoDegradar: 'No puedes quitarte el rol de Jefe a ti mismo.',
  ultimoJefe: 'Debe quedar al menos un Jefe activo en el sistema.',
})

const esJefeActivo = (usuario: Pick<Usuario, 'rol' | 'activo'>): boolean =>
  usuario.rol === 'jefe' && usuario.activo

/**
 * Aplica los cambios de un Jefe sobre un usuario respetando las reglas:
 * - un Jefe no puede desactivarse ni quitarse el rol a sí mismo (400);
 * - el sistema no puede quedarse sin ningún Jefe activo (409).
 * Función pura: devuelve el usuario modificado o lanza ErrorHttp.
 */
export function aplicarCambiosUsuario(
  objetivo: UsuarioGuardado,
  cambios: CambiosUsuario,
  idActor: string,
  todos: readonly UsuarioGuardado[],
): UsuarioGuardado {
  const modificado: UsuarioGuardado = {
    ...objetivo,
    rol: cambios.rol ?? objetivo.rol,
    activo: cambios.activo ?? objetivo.activo,
  }
  if (objetivo.id === idActor) {
    if (!modificado.activo) throw new ErrorHttp(400, MENSAJES_USUARIOS.autoDesactivar)
    if (modificado.rol !== 'jefe') throw new ErrorHttp(400, MENSAJES_USUARIOS.autoDegradar)
  }
  const quedanJefes = todos.some((usuario) =>
    esJefeActivo(usuario.id === objetivo.id ? modificado : usuario),
  )
  if (!quedanJefes) throw errorConflicto(MENSAJES_USUARIOS.ultimoJefe)
  return modificado
}

export function crearRutasUsuarios(almacen: AlmacenUsuarios, autenticar: RequestHandler): Router {
  const rutas = Router()
  rutas.use(autenticar, autorizar('jefe'))

  rutas.get('/', async (_req, res) => {
    const usuarios = await almacen.listar()
    res.json(usuarios.map(aPublico) satisfies Usuario[])
  })

  rutas.patch('/:id', async (req, res) => {
    const id = req.params.id
    if (typeof id !== 'string' || id === '') throw errorNoEncontrado(MENSAJES_USUARIOS.noExiste)
    const cambios = validarCon(esquemaCambios, req.body ?? {}, 'Revisa los cambios del usuario.')
    const idActor = usuarioActual(res).id
    const actualizado = await almacen.actualizar(id, (objetivo, todos) =>
      aplicarCambiosUsuario(objetivo, cambios, idActor, todos),
    )
    if (!actualizado) throw errorNoEncontrado(MENSAJES_USUARIOS.noExiste)
    res.json(aPublico(actualizado) satisfies Usuario)
  })

  return rutas
}
