import type { z } from 'zod'
import { errorValidacion } from './errores.ts'

/**
 * Valida datos con un esquema de zod.
 * @param mensaje Mensaje general del 400 si algo no es válido.
 * @returns Los datos ya transformados por el esquema.
 * @throws ErrorHttp 400 con el primer mensaje de cada campo en `campos`.
 */
export function validarCon<T>(esquema: z.ZodType<T>, datos: unknown, mensaje: string): T {
  const resultado = esquema.safeParse(datos)
  if (resultado.success) return resultado.data
  const campos: Record<string, string> = {}
  let mensajeGeneral = mensaje
  for (const problema of resultado.error.issues) {
    const campo = problema.path[0]
    if (problema.code === 'unrecognized_keys') {
      for (const clave of problema.keys) campos[clave] ??= 'Este campo no se puede enviar.'
    } else if (typeof campo === 'string') {
      campos[campo] ??= problema.message
    } else if (problema.code === 'custom') {
      // Regla sobre el objeto completo (sin campo): su mensaje es más útil que el general.
      mensajeGeneral = problema.message
    }
  }
  throw errorValidacion(mensajeGeneral, campos)
}

/** Indica si un valor es un objeto JSON (no un arreglo ni null). */
export const esObjeto = (valor: unknown): valor is Record<string, unknown> =>
  typeof valor === 'object' && valor !== null && !Array.isArray(valor)
