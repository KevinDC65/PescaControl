import type {
  CredencialesIngreso,
  DatosRegistro,
  RespuestaUsuario,
  Usuario,
} from '../types/usuario.ts'
import { api, estadoDeError, solicitar } from './http.ts'

// Autenticación contra el servidor. La sesión queda en una cookie httpOnly: estas funciones
// solo envían credenciales y reciben los datos públicos del usuario.

/** Crea una cuenta e inicia sesión. El primer usuario del sistema es Jefe. */
export async function registrarse(datos: DatosRegistro): Promise<Usuario> {
  const respuesta = await solicitar(
    'crear la cuenta',
    () => api.post<RespuestaUsuario>('/auth/registro', datos),
    { 409: 'Ya existe una cuenta con ese correo.' },
  )
  return respuesta.usuario
}

/** Inicia sesión con correo y contraseña. */
export async function iniciarSesion(credenciales: CredencialesIngreso): Promise<Usuario> {
  const respuesta = await solicitar('iniciar sesión', () =>
    api.post<RespuestaUsuario>('/auth/ingreso', credenciales),
  )
  return respuesta.usuario
}

/** Cierra la sesión (el servidor borra la cookie). */
export async function cerrarSesion(): Promise<void> {
  await solicitar('cerrar la sesión', () => api.post<unknown>('/auth/salida'))
}

/** Devuelve el usuario de la sesión actual, o `null` si no hay sesión válida. */
export async function obtenerSesion(): Promise<Usuario | null> {
  try {
    const respuesta = await solicitar('consultar la sesión', () =>
      api.get<RespuestaUsuario>('/auth/sesion'),
    )
    return respuesta.usuario
  } catch (error) {
    if (estadoDeError(error) === 401) return null
    throw error
  }
}
