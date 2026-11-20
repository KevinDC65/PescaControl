import type { ErrorRequestHandler, RequestHandler } from 'express'
import type { RespuestaError } from '../../src/types/api.ts'
import { ErrorHttp, errorNoEncontrado, MENSAJES } from '../errores.ts'

// Respuestas de error de toda la API: siempre `{ error, campos? }` en español y nunca con
// stack traces ni detalles internos.

/** Registra un error inesperado (por defecto en la salida de errores). */
export type RegistrarError = (error: unknown) => void

/** Respuesta 404 para cualquier ruta que ningún enrutador atendió. */
export const rutaNoEncontrada: RequestHandler = () => {
  throw errorNoEncontrado()
}

/** Mensajes para los errores conocidos de `express.json()` (body-parser). */
const ERRORES_CUERPO: Readonly<Record<string, readonly [number, string]>> = {
  'entity.parse.failed': [400, 'El cuerpo de la petición no es un JSON válido.'],
  'entity.too.large': [413, 'El cuerpo de la petición es demasiado grande.'],
  'encoding.unsupported': [415, 'La codificación del cuerpo no es compatible.'],
  'charset.unsupported': [415, 'El juego de caracteres del cuerpo no es compatible.'],
  'request.aborted': [400, 'La petición se interrumpió antes de terminar.'],
}

function tipoDeError(error: unknown): string | undefined {
  return typeof error === 'object' && error !== null && 'type' in error
    ? String((error as { type: unknown }).type)
    : undefined
}

/** Convierte cualquier error en estado HTTP y cuerpo seguro para el cliente. */
function aRespuesta(error: unknown): { estado: number; cuerpo: RespuestaError } | undefined {
  if (error instanceof ErrorHttp) return { estado: error.estado, cuerpo: error.aRespuesta() }
  const conocido = ERRORES_CUERPO[tipoDeError(error) ?? '']
  if (conocido) return { estado: conocido[0], cuerpo: { error: conocido[1] } }
  return undefined
}

/** Manejador central de errores. Los inesperados se registran y responden 500 genérico. */
export function crearManejadorErrores(registrar: RegistrarError): ErrorRequestHandler {
  return (error: unknown, _req, res, next) => {
    if (res.headersSent) {
      next(error)
      return
    }
    const conocido = aRespuesta(error)
    if (conocido) {
      res.status(conocido.estado).json(conocido.cuerpo)
      return
    }
    registrar(error)
    res.status(500).json({ error: MENSAJES.interno } satisfies RespuestaError)
  }
}
