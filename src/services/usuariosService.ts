import type { CambiosUsuario, Usuario } from '../types/usuario.ts'
import { api, solicitar } from './http.ts'

// Gestión de usuarios. Todas las rutas requieren el rol Jefe.

const MENSAJES: Partial<Record<number, string>> = {
  403: 'Solo un Jefe puede gestionar usuarios.',
  404: 'El usuario no existe.',
}

/** Lista todos los usuarios (sin contraseñas). */
export function listarUsuarios(): Promise<Usuario[]> {
  return solicitar('listar los usuarios', () => api.get<Usuario[]>('/usuarios'), MENSAJES)
}

/**
 * Cambia el rol o el estado de un usuario.
 * El servidor impide dejar el sistema sin Jefes activos y que un Jefe se desactive a sí mismo.
 */
export function actualizarUsuario(id: string, cambios: CambiosUsuario): Promise<Usuario> {
  return solicitar(
    'actualizar el usuario',
    () => api.patch<Usuario>(`/usuarios/${encodeURIComponent(id)}`, cambios),
    MENSAJES,
  )
}
