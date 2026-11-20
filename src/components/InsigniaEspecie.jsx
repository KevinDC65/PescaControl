import { colorEspecie, slugEspecie } from '../utils/colores.js'

/**
 * Insignia de especie con su color de la serie de datos (colorEspecie). Es decorativa salvo
 * en la forma "etiqueta", que también escribe el nombre: el color nunca es la única pista.
 *
 * @param {object} props
 * @param {string} props.especie Una de ESPECIES (si viene vacía se usa el tono neutro).
 * @param {'punto'|'ficha'|'etiqueta'} [props.forma] Punto de color, ficha con las iniciales
 *   o punto acompañado del nombre.
 */
function InsigniaEspecie({ especie, forma = 'punto', className = '' }) {
  const iniciales = especie ? especie.slice(0, 2) : '—'
  return (
    <span
      className={`pc-insignia pc-insignia-${forma} ${className}`}
      data-especie={slugEspecie(especie)}
      style={{ '--especie': colorEspecie(especie) }}
      aria-hidden={forma === 'etiqueta' ? undefined : 'true'}
    >
      {forma === 'ficha' && iniciales}
      {forma === 'etiqueta' && (especie || 'Sin especie')}
    </span>
  )
}

export default InsigniaEspecie
