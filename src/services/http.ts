import axios, { isAxiosError, type AxiosResponse } from 'axios'
import type { RespuestaError } from '../types/api.ts'

// Cliente HTTP compartido por todos los servicios. La sesión viaja en una cookie httpOnly
// que pone el servidor: el código del navegador nunca ve ni guarda el token.

/** Prefijo de la API. En desarrollo Vite lo redirige al servidor Express (ver vite.config.ts). */
export const API_URL: string = import.meta.env.VITE_API_URL ?? '/api'

/** Evento que se emite cuando el servidor responde 401 fuera de las rutas de autenticación. */
export const EVENTO_SESION_EXPIRADA = 'pescacontrol:sesion-expirada'

const MENSAJE_SIN_CONEXION =
  'No se pudo conectar con el servidor. Verifica que la API esté en ejecución (npm run server).'

export const api = axios.create({
  baseURL: API_URL,
  timeout: 8000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

api.interceptors.response.use(undefined, (error: unknown) => {
  if (isAxiosError(error) && error.response?.status === 401) {
    const ruta = error.config?.url ?? ''
    if (!ruta.startsWith('/auth/')) window.dispatchEvent(new Event(EVENTO_SESION_EXPIRADA))
  }
  return Promise.reject(error)
})

/** Error de la API con el código HTTP y, si el servidor los envía, los errores por campo. */
export class ErrorApi extends Error {
  estado: number | null
  campos: Record<string, string>

  constructor(
    mensaje: string,
    estado: number | null,
    campos: Record<string, string> = {},
    causa?: unknown,
  ) {
    super(mensaje, { cause: causa })
    this.name = 'ErrorApi'
    this.estado = estado
    this.campos = campos
  }
}

function esRespuestaError(datos: unknown): datos is RespuestaError {
  return (
    typeof datos === 'object' &&
    datos !== null &&
    'error' in datos &&
    typeof (datos as { error: unknown }).error === 'string'
  )
}

/**
 * Convierte un error de Axios en un `ErrorApi` con mensaje en español.
 * Si el servidor envía `{ error, campos }`, se usa su mensaje; si no, uno genérico.
 * @param accion Verbo de la operación (ej. "listar los desembarques").
 * @param mensajes Mensajes propios por código HTTP (ej. `{ 404: '...' }`).
 */
export function traducirError(
  error: unknown,
  accion: string,
  mensajes: Partial<Record<number, string>> = {},
): never {
  const errorHttp = isAxiosError(error) ? error : undefined
  const respuesta = errorHttp?.response
  if (respuesta) {
    const datos: unknown = respuesta.data
    const delServidor = esRespuestaError(datos) ? datos : undefined
    const mensaje =
      mensajes[respuesta.status] ??
      delServidor?.error ??
      (respuesta.status >= 500
        ? `El servidor tuvo un problema al ${accion} (código ${respuesta.status}). Intenta de nuevo.`
        : `Error al ${accion} (código ${respuesta.status}).`)
    throw new ErrorApi(mensaje, respuesta.status, delServidor?.campos ?? {}, error)
  }
  const codigosDeRed = ['ECONNABORTED', 'ETIMEDOUT', 'ERR_NETWORK']
  if (errorHttp?.request || codigosDeRed.includes(errorHttp?.code ?? '')) {
    throw new ErrorApi(MENSAJE_SIN_CONEXION, null, {}, error)
  }
  throw new ErrorApi(
    `Error al ${accion} (código ${errorHttp?.code ?? 'desconocido'}).`,
    null,
    {},
    error,
  )
}

/** Ejecuta una petición y devuelve solo `response.data`, traduciendo los errores. */
export async function solicitar<T>(
  accion: string,
  peticion: () => Promise<AxiosResponse<T>>,
  mensajes?: Partial<Record<number, string>>,
): Promise<T> {
  try {
    const respuesta = await peticion()
    return respuesta.data
  } catch (error) {
    traducirError(error, accion, mensajes)
  }
}

/** Código HTTP de un error de la API, o `null` si no hubo respuesta. */
export function estadoDeError(error: unknown): number | null {
  return error instanceof ErrorApi ? error.estado : null
}
