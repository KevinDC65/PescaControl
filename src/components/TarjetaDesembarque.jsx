import { colorEspecie, slugEspecie } from '../utils/colores.js'
import { formatearFechaCorta, formatearPrecio, formatearToneladas } from '../utils/formato.js'
import { valorDesembarque } from '../utils/operaciones.js'
import InsigniaEstado from './InsigniaEstado.jsx'

/** Toneladas sin la unidad, para destacar la cifra y escribir la "t" aparte. */
const cifraToneladas = (toneladas) => formatearToneladas(toneladas).replace(/ t$/, '')

/**
 * Tarjeta de desembarque: una banda con el color de la especie y un oleaje muy fino arriba;
 * debajo la embarcación, su matrícula, el código, puerto y fecha, las toneladas destacadas,
 * el valor y el estado. La usan la vista Tarjetas de Desembarques y la vista previa del
 * formulario.
 *
 * @param {object} props
 * @param {object} props.desembarque Puede venir incompleto (vista previa del formulario).
 * @param {() => void} [props.onAbrir] Si se pasa, la embarcación es un botón que abre el detalle.
 * @param {boolean} [props.seleccionable] Muestra la casilla de selección múltiple.
 * @param {boolean} [props.seleccionada]
 * @param {() => void} [props.onSeleccionar]
 * @param {number} [props.indice] Posición, para escalonar la animación de entrada.
 * @param {boolean} [props.vistaPrevia] Muestra textos de ejemplo en los campos vacíos.
 */
function TarjetaDesembarque({
  desembarque,
  onAbrir,
  seleccionable = false,
  seleccionada = false,
  onSeleccionar,
  indice = 0,
  vistaPrevia = false,
}) {
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
