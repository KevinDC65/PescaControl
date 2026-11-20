import type { Especie } from '../types/desembarque.ts'
import { colorEspecie, slugEspecie } from '../utils/colores.ts'

/** Punto de color, ficha con las iniciales o punto acompañado del nombre. */
type FormaInsignia = 'punto' | 'ficha' | 'etiqueta'

/** Propiedades de `InsigniaEspecie`. */
interface PropsInsigniaEspecie {
  /** Una de ESPECIES (si viene vacía se usa el tono neutro). */
  especie: Especie | ''
  forma?: FormaInsignia
  className?: string
}

/**
 * Insignia de especie con su color de la serie de datos (colorEspecie). Es decorativa salvo
 * en la forma "etiqueta", que también escribe el nombre: el color nunca es la única pista.
 */
function InsigniaEspecie({ especie, forma = 'punto', className = '' }: PropsInsigniaEspecie) {
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
