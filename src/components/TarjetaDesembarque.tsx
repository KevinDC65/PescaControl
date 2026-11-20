import type { DesembarqueEditable } from '../types/desembarque.ts'
import { colorEspecie, slugEspecie } from '../utils/colores.ts'
import { formatearFechaCorta, formatearPrecio, formatearToneladas } from '../utils/formato.ts'
import { valorDesembarque } from '../utils/operaciones.ts'
import InsigniaEstado from './InsigniaEstado.tsx'

/** Toneladas sin la unidad, para destacar la cifra y escribir la "t" aparte. */
const cifraToneladas = (toneladas: number | string) =>
  formatearToneladas(toneladas).replace(/ t$/, '')

/** Propiedades de `TarjetaDesembarque`. */
interface PropsTarjetaDesembarque {
  /** Un desembarque guardado o los valores del formulario (vista previa, puede venir incompleto). */
  desembarque: DesembarqueEditable
  /** Si se pasa, la embarcación es un botón que abre el detalle. */
  onAbrir?: () => void
  /** Muestra la casilla de selección múltiple. */
  seleccionable?: boolean
  seleccionada?: boolean
  onSeleccionar?: () => void
  /** Posición, para escalonar la animación de entrada. */
  indice?: number
  /** Muestra textos de ejemplo en los campos vacíos. */
  vistaPrevia?: boolean
}

/**
 * Tarjeta de desembarque: una banda con el color de la especie y un oleaje muy fino arriba;
 * debajo la embarcación, su matrícula, el código, puerto y fecha, las toneladas destacadas,
 * el valor y el estado. La usan la vista Tarjetas de Desembarques y la vista previa del
 * formulario.
 */
function TarjetaDesembarque({
  desembarque,
  onAbrir,
  seleccionable = false,
  seleccionada = false,
  onSeleccionar,
  indice = 0,
  vistaPrevia = false,
}: PropsTarjetaDesembarque) {
  const { especie, embarcacion, matricula, codigo, puerto, artePesca, estado } = desembarque
  const valor = valorDesembarque(desembarque)
  const nombre = embarcacion || 'Nombre de la embarcación'
  const lugar = [puerto, formatearFechaCorta(desembarque.fechaDesembarque)].filter(Boolean)

  return (
    <article
      className="pc-tarjeta"
      data-especie={slugEspecie(especie)}
      data-seleccionada={seleccionada}
      data-interactiva={Boolean(onAbrir)}
      data-vacia={vistaPrevia && !embarcacion}
      style={{ '--especie': colorEspecie(especie), '--i': Math.min(indice, 12) }}
    >
      <div className="pc-tarjeta-banda">
        <span className="pc-tarjeta-especie">
          <span className="pc-insignia pc-insignia-punto" aria-hidden="true" />
          {especie || 'Especie'}
        </span>
        {artePesca && <span className="pc-tarjeta-arte">{artePesca}</span>}
      </div>

      {seleccionable && (
        <label className="pc-tarjeta-check">
          <input
            type="checkbox"
            className="form-check-input"
            checked={seleccionada}
            onChange={onSeleccionar}
          />
          <span className="visually-hidden">
            Seleccionar {codigo} · {embarcacion}
          </span>
        </label>
      )}

      <div className="pc-tarjeta-cuerpo">
        <div className="pc-tarjeta-cabecera">
          <span className="pc-codigo">{codigo || 'DSB-000'}</span>
          {(estado || vistaPrevia) && <InsigniaEstado estado={estado} />}
        </div>
        <h3 className="pc-tarjeta-nombre">
          {onAbrir ? (
            <button type="button" className="pc-tarjeta-abrir" onClick={onAbrir}>
              {nombre}
            </button>
          ) : (
            nombre
          )}
        </h3>
        <p className="pc-matricula mb-0">{matricula || 'AA-00000-AA'}</p>
        <p className="pc-tarjeta-lugar">
          <i className="bi bi-geo-alt" aria-hidden="true" />
          {lugar.length > 0 ? lugar.join(' · ') : 'Puerto · fecha'}
        </p>
        <div className="pc-tarjeta-pie">
          <p className="pc-tarjeta-toneladas">
            {cifraToneladas(desembarque.toneladas)}
            <span className="pc-tarjeta-unidad"> t</span>
          </p>
          <p className="pc-tarjeta-valor">{valor > 0 ? formatearPrecio(valor) : 'S/ —'}</p>
        </div>
      </div>
    </article>
  )
}

export default TarjetaDesembarque
