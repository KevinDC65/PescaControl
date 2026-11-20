import type { Especie, Puerto } from './desembarque.ts'

/**
 * Cifras agregadas para la página principal pública (`GET /api/publico/resumen`).
 * No incluye datos de embarcaciones ni de usuarios.
 */
export interface ResumenPublico {
  desembarques: number
  toneladas: number
  /** Valor desembarcado en soles (toneladas × precio por tonelada). */
  valor: number
  /** Puertos con al menos un desembarque. */
  puertos: number
  /** Especies con al menos un desembarque. */
  especies: number
  porPuerto: Array<{ puerto: Puerto; toneladas: number }>
  porEspecie: Array<{ especie: Especie; toneladas: number }>
}
