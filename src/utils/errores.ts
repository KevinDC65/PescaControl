/**
 * Mensaje legible de un error capturado. Los servicios siempre lanzan `Error` con un mensaje
 * en español; si llegara otra cosa, se convierte a texto.
 */
export function mensajeDeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}
