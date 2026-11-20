import { ESTADOS, perteneceACatalogo } from '../constants/desembarques.ts'
import type { EstadoDesembarque } from '../types/desembarque.ts'
import { clasesBadgeEstado } from '../utils/colores.ts'

/** Ícono de cada estado: el estado nunca se comunica solo con color. */
const ICONOS_ESTADO: Record<EstadoDesembarque, string> = {
  Programado: 'bi-calendar-event',
  'En descarga': 'bi-arrow-down-circle',
  Descargado: 'bi-check2-circle',
  Observado: 'bi-exclamation-diamond',
}

/** Propiedades de `InsigniaEstado`. */
interface PropsInsigniaEstado {
  /** Estado del desembarque; vacío en la vista previa del formulario. */
  estado: EstadoDesembarque | ''
  className?: string
}

/**
 * Badge del estado de un desembarque (Programado, En descarga, Descargado, Observado) con
 * los colores de Bootstrap que asigna `clasesBadgeEstado` y un ícono propio.
 */
function InsigniaEstado({ estado, className = '' }: PropsInsigniaEstado) {
  const icono = perteneceACatalogo(ESTADOS, estado) ? ICONOS_ESTADO[estado] : 'bi-circle'
  return (
    <span className={`badge pc-estado ${clasesBadgeEstado(estado)} ${className}`}>
      <i className={`bi ${icono}`} aria-hidden="true" />
      {estado || 'Sin estado'}
    </span>
  )
}

export default InsigniaEstado
