/** Rol de un usuario del sistema. */
export type Rol = 'operador' | 'jefe'

/** Usuario registrado del sistema (se usará cuando exista autenticación real). */
export interface Usuario {
  id: string
  nombre: string
  correo: string
  rol: Rol
  activo: boolean
  /** Fecha y hora de creación en formato ISO 8601. */
  creadoEn: string
}

/** Usuario de la sesión simulada actual: solo se guarda el nombre. */
export interface UsuarioSimulado {
  nombre: string
}
