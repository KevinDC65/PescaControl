/** Rol de un usuario del sistema. */
export type Rol = 'operador' | 'jefe'

/**
 * Usuario registrado del sistema, tal como lo devuelve la API.
 * Nunca incluye la contraseña ni su hash.
 */
export interface Usuario {
  id: string
  nombre: string
  correo: string
  rol: Rol
  activo: boolean
  /** Fecha y hora de creación en formato ISO 8601. */
  creadoEn: string
}

/** Datos para crear una cuenta (`POST /api/auth/registro`). */
export interface DatosRegistro {
  nombre: string
  correo: string
  contrasena: string
}

/** Credenciales para iniciar sesión (`POST /api/auth/ingreso`). */
export interface CredencialesIngreso {
  correo: string
  contrasena: string
}

/** Cambios que un Jefe puede aplicar a un usuario (`PATCH /api/usuarios/:id`). */
export interface CambiosUsuario {
  rol?: Rol
  activo?: boolean
}

/** Respuesta de las rutas de autenticación que devuelven al usuario. */
export interface RespuestaUsuario {
  usuario: Usuario
}
