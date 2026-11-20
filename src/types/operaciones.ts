import type { ORDENES } from '../utils/operaciones.ts'
import type { Desembarque, Destino, Especie, EstadoDesembarque, Puerto } from './desembarque.ts'

/** Cantidad, toneladas y participación de un valor del catálogo. */
export interface GrupoOperaciones {
  desembarques: number
  toneladas: number
  /** Participación en toneladas (0–100, con 1 decimal). */
  porcentaje: number
}

/** Grupo de desembarques de una especie. */
export interface GrupoEspecie extends GrupoOperaciones {
  especie: Especie
}

/** Grupo de desembarques de un puerto. */
export interface GrupoPuerto extends GrupoOperaciones {
  puerto: Puerto
}

/** Grupo de desembarques de un destino. */
export interface GrupoDestino extends GrupoOperaciones {
  destino: Destino
}

/** Resultado de `resumirOperaciones`: cifras del panel de inicio y la barra lateral. */
export interface ResumenOperaciones {
  total: number
  toneladas: number
  valor: number
  observados: number
  enDescarga: number
  /** Desembarques Observados o En descarga, los más recientes primero. */
  atencion: Desembarque[]
  porEspecie: GrupoEspecie[]
  porPuerto: GrupoPuerto[]
  porDestino: GrupoDestino[]
  porEstado: Record<EstadoDesembarque, number>
  /** Los `CANTIDAD_RECIENTES` desembarques más recientes. */
  recientes: Desembarque[]
}

/** Criterios de `filtrarDesembarques`; todos opcionales (pueden venir de la URL). */
export interface FiltrosDesembarques {
  /** Texto libre sobre código, embarcación o matrícula. */
  q?: string | null
  especie?: string | null
  puerto?: string | null
  estado?: string | null
  /** Fecha `YYYY-MM-DD` inclusiva. */
  desde?: string | null
  /** Fecha `YYYY-MM-DD` inclusiva. */
  hasta?: string | null
}

/** Opción de orden de la lista, con su etiqueta. */
export type OpcionOrden = (typeof ORDENES)[number]

/** Orden disponible para la lista (ej. "fecha-desc"). */
export type Orden = OpcionOrden['valor']

/** Conteos de la barra lateral; `null` si la API no respondió. */
export interface ConteoOperaciones {
  total: number | null
  atencion: number | null
}
