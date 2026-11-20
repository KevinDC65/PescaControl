import type { ReactElement, ReactNode, SVGProps } from 'react'

/** Dibujo del estado vacío. */
type Ilustracion = 'muelle' | 'sonda' | 'deriva'

/** Nivel del encabezado del título (h2 a h6). */
type NivelTitulo = 2 | 3 | 4 | 5 | 6

/** Propiedades de `EstadoVacio`. */
interface PropsEstadoVacio {
  /** Muelle vacío, lupa sobre la carta náutica o boya a la deriva con la amarra cortada. */
  ilustracion?: Ilustracion
  titulo: ReactNode
  /** Texto de ayuda. */
  children: ReactNode
  acciones?: ReactNode
  nivelTitulo?: NivelTitulo
}

/**
 * Estado vacío ilustrado: sin desembarques registrados, búsqueda sin resultados o error.
 * La ilustración es un dibujo de línea (SVG propio) que hereda el color del texto.
 */
function EstadoVacio({
  ilustracion = 'muelle',
  titulo,
  children,
  acciones,
  nivelTitulo = 3,
}: PropsEstadoVacio) {
  const Titulo: `h${NivelTitulo}` = `h${nivelTitulo}`
  return (
    <div className="pc-vacio">
      <svg
        className="pc-vacio-ilustracion"
        viewBox="0 0 160 120"
        aria-hidden="true"
        focusable="false"
      >
        {ILUSTRACIONES[ilustracion] ?? ILUSTRACIONES.muelle}
      </svg>
      <Titulo className="pc-vacio-titulo">{titulo}</Titulo>
      <div className="pc-vacio-texto">{children}</div>
      {acciones && <div className="pc-vacio-acciones">{acciones}</div>}
    </div>
  )
}

const trazo: SVGProps<SVGGElement> = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2.5,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

const ILUSTRACIONES: Record<Ilustracion, ReactElement> = {
  muelle: (
    <g {...trazo}>
      <path d="M18 64h96" />
      <path d="M30 64v34M58 64v34M86 64v34M110 64v34" />
      <path d="M120 54v10M114 54h12" />
      <path d="M118 64c8 0 12 4 18 10" strokeDasharray="4 5" />
      <path
        className="pc-vacio-acento"
        d="M14 88c6 0 6-4 12-4s6 4 12 4 6-4 12-4 6 4 12 4 6-4 12-4 6 4 12 4 6-4 12-4 6 4 12 4 6-4 12-4 6 4 12 4"
      />
      <path
        d="M22 102c6 0 6-4 12-4s6 4 12 4 6-4 12-4 6 4 12 4 6-4 12-4 6 4 12 4 6-4 12-4"
        strokeOpacity=".5"
      />
    </g>
  ),
  sonda: (
    <g {...trazo}>
      <path
        className="pc-vacio-acento"
        d="M14 34c22-10 44 6 70-2s40-12 62-4M14 56c24-8 42 8 66 0s42-12 66-4M14 78c20-6 44 8 68 2"
        strokeWidth="1.4"
      />
      <circle cx="100" cy="72" r="22" fill="var(--pc-superficie)" />
      <path d="m116 88 20 20" strokeWidth="4" />
      <path d="M92 72h16M100 64v16" strokeWidth="1.6" strokeOpacity=".6" />
    </g>
  ),
  deriva: (
    <g {...trazo}>
      <path d="M62 30v14M56 30h12" />
      <path d="m48 86 6-42h16l6 42Z" />
      <path className="pc-vacio-acento" d="M50 66h24" />
      <path d="M76 82c12 6 22 4 30 10" strokeDasharray="4 5" />
      <path d="m108 90 6 4M112 86l-2 8" />
      <path
        className="pc-vacio-acento"
        d="M20 96c7 0 7-5 14-5s7 5 14 5 7-5 14-5 7 5 14 5 7-5 14-5 7 5 14 5 7-5 14-5 7 5 14 5"
      />
    </g>
  ),
}

export default EstadoVacio
