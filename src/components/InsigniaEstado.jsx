import { clasesBadgeEstado } from '../utils/colores.js'

/** Ícono de cada estado: el estado nunca se comunica solo con color. */
const ICONOS_ESTADO = {
  Programado: 'bi-calendar-event',
  'En descarga': 'bi-arrow-down-circle',
  Descargado: 'bi-check2-circle',
  Observado: 'bi-exclamation-diamond',
}

/**
 * Badge del estado de un desembarque (Programado, En descarga, Descargado, Observado) con
 * los colores de Bootstrap que asigna `clasesBadgeEstado` y un ícono propio.
 *
 * @param {{ estado: string, className?: string }} props
 */
function InsigniaEstado({ estado, className = '' }) {
  return (
    <span className={`badge pc-estado ${clasesBadgeEstado(estado)} ${className}`}>
      <i className={`bi ${ICONOS_ESTADO[estado] ?? 'bi-circle'}`} aria-hidden="true" />
      {estado || 'Sin estado'}
    </span>
  )
}

export default InsigniaEstado
