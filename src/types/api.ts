/** Cuerpo de error que devuelve el servidor en cualquier respuesta 4xx/5xx. */
export interface RespuestaError {
  /** Mensaje en español apto para mostrar al usuario. */
  error: string
  /** Errores de validación por campo (solo en respuestas 400). */
  campos?: Record<string, string>
}
