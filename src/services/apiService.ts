import type { Desembarque, DesembarqueNuevo } from '../types/desembarque.ts'
import { hoyISO } from '../utils/formato.ts'
import { api, estadoDeError, solicitar } from './http.ts'

// Operaciones REST de desembarques. Las páginas importan estas funciones y nunca usan
// axios ni fetch directamente. Todas requieren sesión; eliminar requiere el rol Jefe.

export { API_URL } from './http.ts'

const RECURSO = '/desembarques'

const MENSAJES_DESEMBARQUE: Partial<Record<number, string>> = {
  404: 'El desembarque no existe o fue eliminado.',
  403: 'Tu rol no tiene permiso para esta acción.',
}

/** Ruta de un desembarque concreto. Evita que un id vacío termine pidiendo la colección. */
function rutaDesembarque(id: string | number | null | undefined): string {
  if (id === undefined || id === null || String(id).trim() === '') {
    throw new Error('Identificador de desembarque no válido.')
  }
  return `${RECURSO}/${encodeURIComponent(String(id).trim())}`
}

/** Copia del desembarque sin `id` (el id lo decide json-server o la URL). */
function sinId<T extends object>(desembarque: T): Omit<T, 'id'> {
  const datos: T & { id?: unknown } = { ...desembarque }
  delete datos.id
  return datos
}

/** Obtiene todos los desembarques. */
export function getAll(): Promise<Desembarque[]> {
  return solicitar('listar los desembarques', () => api.get<Desembarque[]>(RECURSO), {
    404: 'No se encontró el recurso de desembarques en el servidor. Revisa la URL de la API.',
  })
}

/** Obtiene un desembarque por su id. */
export async function getById(id: string): Promise<Desembarque> {
  const ruta = rutaDesembarque(id)
  return solicitar('obtener el desembarque', () => api.get<Desembarque>(ruta), MENSAJES_DESEMBARQUE)
}

/**
 * Registra un desembarque nuevo. No envía `id` y asigna `fechaDesembarque` de hoy solo si
 * no viene.
 * @param desembarque Datos ya validados y normalizados.
 * @returns Desembarque creado (con su `id`).
 */
export function add(desembarque: DesembarqueNuevo): Promise<Desembarque> {
  const datos = sinId(desembarque)
  datos.fechaDesembarque = datos.fechaDesembarque || hoyISO()
  return solicitar(
    'registrar el desembarque',
    () => api.post<Desembarque>(RECURSO, datos),
    MENSAJES_DESEMBARQUE,
  )
}

/**
 * Reemplaza un desembarque (PUT). Si no se envía `fechaDesembarque`, conserva la registrada.
 * @param desembarque Datos completos ya validados y normalizados.
 * @returns Desembarque actualizado.
 */
export async function update(id: string, desembarque: DesembarqueNuevo): Promise<Desembarque> {
  const ruta = rutaDesembarque(id)
  const datos = sinId(desembarque)
  if (!datos.fechaDesembarque) {
    const actual = await getById(id)
    datos.fechaDesembarque = actual.fechaDesembarque
  }
  return solicitar(
    'actualizar el desembarque',
    () => api.put<Desembarque>(ruta, datos),
    MENSAJES_DESEMBARQUE,
  )
}

/** Elimina un desembarque (solo Jefe). */
export async function remove(id: string): Promise<void> {
  const ruta = rutaDesembarque(id)
  await solicitar('eliminar el desembarque', () => api.delete<unknown>(ruta), MENSAJES_DESEMBARQUE)
}

/** Indica si el error lo causó una respuesta 404 de la API (el desembarque no existe). */
export function esErrorNoEncontrado(error: unknown): boolean {
  return estadoDeError(error) === 404
}
