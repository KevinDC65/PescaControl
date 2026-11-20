// Piezas de la escena marina que comparten la página principal y las páginas de acceso:
// capas de oleaje, la boya de señal, la embarcación de cerco y las isóbatas de la carta.
// Todas son decorativas (aria-hidden). El movimiento continuo (oleaje, vaivén, destello)
// es CSS sobre transform y opacity, así corre en el compositor aunque la página esté
// ocupada; prefers-reduced-motion y el botón de pausa lo detienen (styles/escena.css).

/**
 * Trazo de una franja de oleaje de 1600 de ancho: dos tramos idénticos de 800, para que
 * desplazarla la mitad de su ancho (translateX(-50%)) haga un bucle sin costura.
 */
function trazoOla(longitud: number, amplitud: number, alto: number): string {
  const cresta = amplitud
  const base = amplitud * 2
  let trazo = `M0 ${base}`
  for (let x = 0; x < 1600; x += longitud) {
    trazo += ` Q${x + longitud / 4} ${base - cresta * 2} ${x + longitud / 2} ${base}`
    trazo += ` T${x + longitud} ${base}`
  }
  return `${trazo} V${alto} H0 Z`
}

/** Propiedades de `Ola`. */
interface PropsOla {
  /** Largo de cada ola (debe dividir 800 para que el bucle no tenga costura). */
  longitud?: number
  /** Altura de la cresta, en unidades del dibujo. */
  amplitud?: number
  /** Alto total de la franja, en unidades del dibujo. */
  alto?: number
  className?: string
}

/** Franja de oleaje que se desplaza en bucle (la velocidad la define su clase CSS). */
export function Ola({ longitud = 200, amplitud = 8, alto = 120, className = '' }: PropsOla) {
  return (
    <div className={`pc-ola ${className}`} aria-hidden="true">
      <svg viewBox={`0 0 1600 ${alto}`} preserveAspectRatio="none" focusable="false">
        <path d={trazoOla(longitud, amplitud, alto)} />
      </svg>
    </div>
  )
}

/** Propiedades de `Boya`. */
interface PropsBoya {
  className?: string
}

/**
 * Boya de señal (la marca de PescaControl a gran tamaño): cuerpo naranja con franja,
 * mástil con marca de tope y una luz que destella despacio, como una boya de canal.
 */
export function Boya({ className = '' }: PropsBoya) {
  return (
    <div className={`pc-boya ${className}`} aria-hidden="true">
      <div className="pc-boya-mecer">
        <span className="pc-boya-luz" />
        <svg viewBox="0 0 64 96" focusable="false">
          <path d="M32 12v22" className="pc-boya-mastil" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="32" cy="10" r="5" className="pc-boya-tope" />
          <path d="M14 78 21 34h22l7 44Z" className="pc-boya-cuerpo" />
          <path d="M17.6 56h28.8" className="pc-boya-franja" strokeWidth="5" />
          <path d="M21 34h22" className="pc-boya-borde" strokeWidth="2" />
          <ellipse cx="32" cy="80" rx="24" ry="4" className="pc-boya-sombra" />
        </svg>
      </div>
    </div>
  )
}

/** Propiedades de `Embarcacion`. */
interface PropsEmbarcacion {
  className?: string
}

/**
 * Silueta de una embarcación de cerco (bolichera) con la proa a la derecha: casco con la
 * proa alzada, caseta de gobierno, mástil con pluma y la red apilada en la popa.
 */
export function Embarcacion({ className = '' }: PropsEmbarcacion) {
  return (
    <svg
      className={`pc-embarcacion ${className}`}
      viewBox="0 0 200 80"
      aria-hidden="true"
      focusable="false"
    >
      <path className="pc-embarcacion-aparejo" d="M108 52V8M108 14 44 42M108 22l26 8" />
      <path
        className="pc-embarcacion-casco"
        d="M6 50h158l30-12-10 28c-50 6-118 6-168 2Z M22 50c2-9 10-13 22-13s22 3 26 13Z M122 50V28h30l6 8v14Z"
      />
      <path className="pc-embarcacion-ventanas" d="M128 33h7v5h-7zM139 33h7v5h-7z" />
      <circle className="pc-embarcacion-luz" cx="108" cy="7" r="2.4" />
    </svg>
  )
}

/** Propiedades de `CartaIsobatas`. */
interface PropsCartaIsobatas {
  className?: string
}

/**
 * Isóbatas y sondas de una carta náutica: curvas de igual profundidad, sondas en metros y
 * una escala graduada en el borde, como en las cartas del servicio hidrográfico.
 */
export function CartaIsobatas({ className = '' }: PropsCartaIsobatas) {
  const marcas = Array.from({ length: 33 }, (_, indice) => indice)
  return (
    <svg
      className={`pc-carta ${className}`}
      viewBox="0 0 600 640"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
    >
      <g className="pc-carta-isobatas" fill="none">
        <path d="M600 40c-70 18-110 70-180 78s-120-40-200-22S90 170 0 186" />
        <path d="M600 120c-60 14-100 64-170 74s-120-30-190-10S100 260 0 280" />
        <path d="M600 210c-56 12-96 56-156 66s-110-18-176 0S96 350 0 372" />
        <path d="M600 300c-50 10-84 48-140 58s-104-10-164 6S90 440 0 460" />
        <path d="M600 392c-46 10-78 40-128 48s-96-4-150 10-86 60-146 70S60 540 0 552" />
      </g>
      <g className="pc-carta-sondas">
        <text x="452" y="96">
          8
        </text>
        <text x="330" y="168">
          14
        </text>
        <text x="510" y="232">
          22
        </text>
        <text x="214" y="262">
          31
        </text>
        <text x="402" y="338">
          45
        </text>
        <text x="120" y="388">
          60
        </text>
        <text x="300" y="430">
          74
        </text>
      </g>
      <g className="pc-carta-escala">
        <path d="M14 0V640" />
        {marcas.map((marca) => (
          <path key={marca} d={`M14 ${marca * 20}h${marca % 5 === 0 ? 10 : 5}`} />
        ))}
      </g>
    </svg>
  )
}
