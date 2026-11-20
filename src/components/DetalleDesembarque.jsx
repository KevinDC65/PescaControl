import { CAPITANIA_POR_PUERTO } from '../constants/desembarques.js'
import { colorEspecie, slugEspecie } from '../utils/colores.js'
import { formatearFecha, formatearPrecio, formatearToneladas } from '../utils/formato.js'
import { valorDesembarque } from '../utils/operaciones.js'
import InsigniaEspecie from './InsigniaEspecie.jsx'
import InsigniaEstado from './InsigniaEstado.jsx'

/**
 * Contenido del panel lateral de detalle de un desembarque: banda con el color de la
 * especie, toneladas y valor destacados y la ficha completa de la operación. Las acciones
 * (Editar, Eliminar) van en el pie del panel.
 */
function DetalleDesembarque({ desembarque }) {
  const valor = valorDesembarque(desembarque)

  return (
    <div className="pc-detalle">
      <div
        className="pc-detalle-banda"
        data-especie={slugEspecie(desembarque.especie)}
        style={{ '--especie': colorEspecie(desembarque.especie) }}
      >
        <span className="pc-tarjeta-especie">
          <span className="pc-insignia pc-insignia-punto" aria-hidden="true" />
          {desembarque.especie}
        </span>
        <span className="pc-tarjeta-arte">{desembarque.artePesca}</span>
      </div>

      <div className="pc-detalle-encabezado">
        <span className="pc-codigo">{desembarque.codigo}</span>
        <InsigniaEstado estado={desembarque.estado} />
      </div>

      <div className="pc-detalle-cifras">
        <div>
          <p className="pc-detalle-etiqueta">Toneladas</p>
          <p className="pc-detalle-cifra">{formatearToneladas(desembarque.toneladas)}</p>
        </div>
        <div>
          <p className="pc-detalle-etiqueta">Valor</p>
          <p className="pc-detalle-cifra">{formatearPrecio(valor)}</p>
        </div>
      </div>
      <p className="pc-detalle-formula">
        {formatearToneladas(desembarque.toneladas)} × {formatearPrecio(desembarque.precioTonelada)}{' '}
        por tonelada
      </p>

      <dl className="pc-detalle-datos">
        <div className="pc-detalle-ancho">
          <dt>Embarcación</dt>
          <dd>{desembarque.embarcacion}</dd>
        </div>
        <div>
          <dt>Matrícula</dt>
          <dd className="pc-matricula">{desembarque.matricula}</dd>
        </div>
        <div>
          <dt>Arte de pesca</dt>
          <dd>{desembarque.artePesca}</dd>
        </div>
        <div>
          <dt>Especie</dt>
          <dd>
            <InsigniaEspecie especie={desembarque.especie} forma="etiqueta" />
          </dd>
        </div>
        <div>
          <dt>Destino</dt>
          <dd>{desembarque.destino}</dd>
        </div>
        <div>
          <dt>Puerto</dt>
          <dd>
            {desembarque.puerto}
            {CAPITANIA_POR_PUERTO[desembarque.puerto] && (
              <span className="pc-detalle-nota">
                {' '}
                · capitanía {CAPITANIA_POR_PUERTO[desembarque.puerto]}
              </span>
            )}
          </dd>
        </div>
        <div>
          <dt>Fecha de desembarque</dt>
          <dd>{formatearFecha(desembarque.fechaDesembarque)}</dd>
        </div>
      </dl>
    </div>
  )
}

export default DetalleDesembarque
