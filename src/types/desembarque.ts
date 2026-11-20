import type {
  ARTES_PESCA,
  DESTINOS,
  ESPECIES,
  ESTADOS,
  PUERTOS,
} from '../constants/desembarques.ts'

// Tipos del modelo Desembarque. Las uniones literales se derivan de los catálogos de
// constants/desembarques.ts, que siguen siendo la única fuente de los valores permitidos.

/** Especie hidrobiológica (ej. "Anchoveta"). */
export type Especie = (typeof ESPECIES)[number]

/** Arte o aparejo de pesca (ej. "Cerco"). */
export type ArtePesca = (typeof ARTES_PESCA)[number]

/** Puerto de desembarque (ej. "Chimbote"). */
export type Puerto = (typeof PUERTOS)[number]

/** Destino de la captura (ej. "Harina y aceite"). */
export type Destino = (typeof DESTINOS)[number]

/** Estado del desembarque (ej. "Descargado"). */
export type EstadoDesembarque = (typeof ESTADOS)[number]

/** Desembarque tal como lo guarda y devuelve la API (json-server). */
export interface Desembarque {
  /** Lo genera json-server; no se envía al crear. */
  id: string
  /** Único, formato `DSB-000`. */
  codigo: string
  /** Nombre de la embarcación, de 3 a 60 caracteres. */
  embarcacion: string
  /** Formato `AA-00000-AA` (el prefijo es la capitanía). */
  matricula: string
  especie: Especie
  artePesca: ArtePesca
  puerto: Puerto
  destino: Destino
  /** Mayor que 0, máximo 2 decimales y hasta `TONELADAS_MAXIMAS`. */
  toneladas: number
  /** Precio por tonelada en soles, mayor que 0. */
  precioTonelada: number
  /** Fecha `YYYY-MM-DD`, no futura. */
  fechaDesembarque: string
  estado: EstadoDesembarque
}

/** Datos de un desembarque listos para enviar a la API (sin `id`). */
export type DesembarqueNuevo = Omit<Desembarque, 'id'>

/**
 * Valores del formulario mientras se edita: sin `id`, los catálogos pueden estar vacíos
 * (aún no se eligió una opción) y los números llegan como texto desde los inputs.
 */
export interface DesembarqueEditable {
  codigo: string
  embarcacion: string
  matricula: string
  especie: Especie | ''
  artePesca: ArtePesca | ''
  puerto: Puerto | ''
  destino: Destino | ''
  toneladas: number | string
  precioTonelada: number | string
  fechaDesembarque: string
  estado: EstadoDesembarque | ''
}

/** Campo editable de un desembarque. */
export type CampoDesembarque = keyof DesembarqueEditable

/** Mensajes de validación por campo; solo aparecen los campos con error. */
export type ErroresDesembarque = Partial<Record<CampoDesembarque, string>>
