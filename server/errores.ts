import type { RespuestaError } from '../src/types/api.ts'

// Errores esperados de la API. Cada uno lleva el código HTTP y un mensaje en español apto
// para mostrar al usuario; el manejador central (middleware/errores.ts) los convierte en
// `{ error, campos? }`. Cualquier otro error se trata como inesperado (500).

/** Error HTTP con mensaje para el usuario y, opcionalmente, errores por campo. */
export class ErrorHttp extends Error {
  readonly estado: number
  readonly campos: Record<string, string> | undefined

  constructor(estado: number, mensaje: string, campos?: Record<string, string>) {
    super(mensaje)
    this.name = 'ErrorHttp'
    this.estado = estado
    this.campos = campos
  }

  /** Cuerpo JSON de la respuesta. */
  aRespuesta(): RespuestaError {
    return this.campos && Object.keys(this.campos).length > 0
      ? { error: this.message, campos: this.campos }
      : { error: this.message }
  }
}

/** Mensajes compartidos por varias rutas. */
export const MENSAJES = Object.freeze({
  sinSesion: 'No has iniciado sesión.',
  sesionExpirada: 'Tu sesión expiró. Inicia sesión de nuevo.',
  cuentaDesactivada: 'Tu cuenta está desactivada. Contacta a un Jefe.',
  sinPermiso: 'Tu rol no tiene permiso para esta acción.',
  credencialesIncorrectas: 'Correo o contraseña incorrectos.',
  rutaInexistente: 'La ruta solicitada no existe.',
  interno: 'Ocurrió un error inesperado en el servidor. Intenta de nuevo.',
})

export const errorValidacion = (mensaje: string, campos: Record<string, string>): ErrorHttp =>
  new ErrorHttp(400, mensaje, campos)

export const errorNoAutenticado = (mensaje: string = MENSAJES.sinSesion): ErrorHttp =>
  new ErrorHttp(401, mensaje)

export const errorProhibido = (mensaje: string = MENSAJES.sinPermiso): ErrorHttp =>
  new ErrorHttp(403, mensaje)

export const errorNoEncontrado = (mensaje: string = MENSAJES.rutaInexistente): ErrorHttp =>
  new ErrorHttp(404, mensaje)

export const errorConflicto = (mensaje: string): ErrorHttp => new ErrorHttp(409, mensaje)
