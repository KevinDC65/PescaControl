import type { ResumenPublico } from '../types/publico.ts'
import { api, solicitar } from './http.ts'

/** Cifras agregadas para la página principal. No requiere sesión. */
export function obtenerResumenPublico(): Promise<ResumenPublico> {
  return solicitar('consultar el resumen', () => api.get<ResumenPublico>('/publico/resumen'))
}
