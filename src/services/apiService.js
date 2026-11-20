import axios from 'axios'
import { hoyISO } from '../utils/formato.js'

// Único punto de acceso HTTP de la aplicación. Las páginas importan estas funciones
// y nunca usan axios ni fetch directamente.

/** URL base de json-server (configurable con VITE_API_URL en .env). */
export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

const RECURSO = '/desembarques'

const MENSAJE_SIN_CONEXION =
  'No se pudo conectar con el servidor. Verifica que la API esté en ejecución (npm run server).'

const api = axios.create({
  baseURL: API_URL,
  timeout: 8000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

/**
 * Convierte un error de Axios en un Error con mensaje en español para mostrar en la interfaz.
 * El error original se conserva en `cause` para depurar.
 * @param {unknown} error Error capturado.
 * @param {string} accion Verbo de la operación (ej. "listar los desembarques").
 * @throws {Error} Siempre.
 */
function traducirError(error, accion) {
  const respuesta = error?.response
  if (respuesta) {
    if (respuesta.status === 404) {
      const mensaje = accion.endsWith('el desembarque')
        ? 'El desembarque no existe o fue eliminado.'
        : 'No se encontró el recurso de desembarques en el servidor. Revisa la URL de la API.'
      throw new Error(mensaje, { cause: error })
    }
    if (respuesta.status >= 500) {
      throw new Error(
        `El servidor tuvo un problema al ${accion} (código ${respuesta.status}). Intenta de nuevo.`,
        { cause: error },
      )
    }
    throw new Error(`Error al ${accion} (código ${respuesta.status}).`, { cause: error })
  }
  const codigosDeRed = ['ECONNABORTED', 'ETIMEDOUT', 'ERR_NETWORK']
  if (error?.request || codigosDeRed.includes(error?.code)) {
    throw new Error(MENSAJE_SIN_CONEXION, { cause: error })
  }
  throw new Error(`Error al ${accion} (código ${error?.code ?? 'desconocido'}).`, {
    cause: error,
  })
}

/** Ejecuta una petición y devuelve solo `response.data`, traduciendo los errores. */
async function solicitar(accion, peticion) {
  try {
    const respuesta = await peticion()
    return respuesta.data
  } catch (error) {
    traducirError(error, accion)
  }
}

/** Ruta de un desembarque concreto. Evita que un id vacío termine pidiendo la colección. */
function rutaDesembarque(id) {
  if (id === undefined || id === null || String(id).trim() === '') {
    throw new Error('Identificador de desembarque no válido.')
  }
  return `${RECURSO}/${encodeURIComponent(String(id).trim())}`
}

/** Copia del desembarque sin `id` (el id lo decide json-server o la URL). */
function sinId(desembarque) {
  const datos = { ...desembarque }
  delete datos.id
  return datos
}

/**
 * Obtiene todos los desembarques.
 * @returns {Promise<object[]>}
 */
export function getAll() {
  return solicitar('listar los desembarques', () => api.get(RECURSO))
}

/**
 * Obtiene un desembarque por su id.
 * @param {string} id
 * @returns {Promise<object>}
 */
export async function getById(id) {
  const ruta = rutaDesembarque(id)
  return solicitar('obtener el desembarque', () => api.get(ruta))
}

/**
 * Registra un desembarque nuevo. No envía `id` y asigna `fechaDesembarque` de hoy solo si
 * no viene.
 * @param {object} desembarque Datos ya validados y normalizados.
 * @returns {Promise<object>} Desembarque creado (con su `id`).
 */
export function add(desembarque) {
  const datos = sinId(desembarque)
  datos.fechaDesembarque = datos.fechaDesembarque || hoyISO()
  return solicitar('registrar el desembarque', () => api.post(RECURSO, datos))
}

/**
 * Reemplaza un desembarque (PUT). Si no se envía `fechaDesembarque`, conserva la registrada.
 * @param {string} id
 * @param {object} desembarque Datos completos ya validados y normalizados.
 * @returns {Promise<object>} Desembarque actualizado.
 */
export async function update(id, desembarque) {
  const ruta = rutaDesembarque(id)
  const datos = sinId(desembarque)
  if (!datos.fechaDesembarque) {
    const actual = await getById(id)
    datos.fechaDesembarque = actual.fechaDesembarque
  }
  return solicitar('actualizar el desembarque', () => api.put(ruta, datos))
}

/**
 * Elimina un desembarque.
 * @param {string} id
 * @returns {Promise<void>}
 */
export async function remove(id) {
  const ruta = rutaDesembarque(id)
  await solicitar('eliminar el desembarque', () => api.delete(ruta))
}
