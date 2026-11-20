import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
} from 'motion/react'
import { useRef, useState } from 'react'
import { PUERTOS } from '../../constants/desembarques.ts'
import type { Puerto } from '../../types/desembarque.ts'
import { formatearToneladas } from '../../utils/formato.ts'
import type { EstadoResumen } from './CifrasEnVivo.tsx'

// Proyección simple (equirectangular) del litoral peruano: 40 unidades por grado.
const ESCALA = 40
const LONGITUD_OESTE = 88
const LATITUD_NORTE = 3
const ANCHO = (LONGITUD_OESTE - 69.5) * ESCALA
const ALTO = (19 - LATITUD_NORTE) * ESCALA

/** Proyecta longitud oeste y latitud sur (en grados positivos) al dibujo. */
const proyectar = (oeste: number, sur: number) => ({
  x: (LONGITUD_OESTE - oeste) * ESCALA,
  y: (sur - LATITUD_NORTE) * ESCALA,
})

/** Línea de costa aproximada de Tumbes a la frontera con Chile (oeste, sur). */
const COSTA: readonly (readonly [number, number])[] = [
  [80.6, 3],
  [80.45, 3.57],
  [81.0, 4.2],
  [81.28, 4.68],
  [81.11, 5.09],
  [81.18, 5.5],
  [81.05, 5.85],
  [80.6, 6.1],
  [79.95, 6.85],
  [79.45, 7.7],
  [78.98, 8.22],
  [78.59, 9.07],
  [78.17, 10.07],
  [77.65, 11.1],
  [77.15, 12.05],
  [76.5, 13.0],
  [76.22, 13.71],
  [76.38, 14.0],
  [75.9, 14.6],
  [75.2, 15.35],
  [74.4, 15.85],
  [73.7, 16.2],
  [72.65, 16.6],
  [72.0, 17.03],
  [71.34, 17.64],
  [70.37, 18.35],
  [70.3, 19],
]

/** Ubicación de cada puerto (oeste, sur). */
const UBICACION: Record<Puerto, readonly [number, number]> = {
  Paita: [81.11, 5.09],
  Chimbote: [78.59, 9.07],
  Callao: [77.15, 12.05],
  Pisco: [76.22, 13.71],
  Ilo: [71.34, 17.64],
}

/** Meridiano desde el que salen las barras hacia el mar (82° O). */
const X_BASE = proyectar(82, 0).x
const LARGO_BARRA = X_BASE - 24

const trazoCosta = COSTA.map(([oeste, sur], indice) => {
  const { x, y } = proyectar(oeste, sur)
  return `${indice === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`
}).join(' ')
const trazoTierra = `${trazoCosta} L${ANCHO} ${ALTO} L${ANCHO} 0 Z`

const PARALELOS = [4, 6, 8, 10, 12, 14, 16, 18]
const MERIDIANOS = [86, 82, 78, 74, 70]

const porcentaje = (valor: number, total: number) => `${(valor / total) * 100}%`

/** Propiedades de `CartaLitoral`. */
interface PropsCartaLitoral {
  estado: EstadoResumen
}

/**
 * Carta del litoral: la costa del Perú de Tumbes a Tacna con isóbatas, paralelos y
 * meridianos, y los cinco puertos del sistema en su latitud real. Al recorrer la sección,
 * una línea de lectura baja de norte a sur (scroll-linked) y cada puerto se enciende al
 * alcanzarlo, con su barra de toneladas saliendo hacia el mar (scaleX).
 */
function CartaLitoral({ estado }: PropsCartaLitoral) {
  const seccionRef = useRef<HTMLDivElement>(null)
  const reducir = useReducedMotion()
  const { scrollYProgress } = useScroll({
    target: seccionRef,
    offset: ['start 0.8', 'end 0.7'],
  })
  const lectura = useTransform(scrollYProgress, [0, 1], ['0%', '100%'])
  const [alcance, setAlcance] = useState(0)

  useMotionValueEvent(scrollYProgress, 'change', (valor) => {
    const redondeado = Math.round(valor * 100) / 100
    if (redondeado !== alcance) setAlcance(redondeado)
  })

  const toneladas = new Map<Puerto, number>(
    estado.tipo === 'listo'
      ? estado.resumen.porPuerto.map((fila) => [fila.puerto, fila.toneladas])
      : [],
  )
  const maximo = Math.max(1, ...toneladas.values())
  const conCifras = estado.tipo === 'listo'

  const puertos = PUERTOS.map((puerto) => {
    const [oeste, sur] = UBICACION[puerto]
    const punto = proyectar(oeste, sur)
    const encendido = Boolean(reducir) || alcance >= punto.y / ALTO - 0.02
    return { puerto, punto, encendido, toneladas: toneladas.get(puerto) ?? 0 }
  })

  const descripcion = conCifras
    ? puertos.map((fila) => `${fila.puerto}: ${formatearToneladas(fila.toneladas)}`).join(', ')
    : PUERTOS.join(', ')

  return (
    <section id="litoral" className="pc-bloque pc-costa-publico" aria-labelledby="titulo-litoral">
      <div className="pc-envoltura pc-costa-rejilla">
        <div className="pc-costa-texto">
          <h2 id="titulo-litoral" className="pc-bloque-titulo">
            De Paita a Ilo, cada puerto en su latitud
          </h2>
          <p className="pc-bloque-texto">
            Los cinco puertos del sistema, de norte a sur como en la costa. Al bajar por la página
            se encienden uno a uno con las toneladas que desembarcaron.
          </p>
          <ol className="pc-costa-lista">
            {puertos.map((fila) => (
              <li key={fila.puerto} data-encendido={fila.encendido}>
                <span className="pc-costa-faro" aria-hidden="true" />
                <span className="pc-costa-nombre">{fila.puerto}</span>
                <span className="pc-costa-latitud">
                  {Math.floor(UBICACION[fila.puerto][1])}°
                  {String(Math.round((UBICACION[fila.puerto][1] % 1) * 60)).padStart(2, '0')}′ S
                </span>
                <span className="pc-costa-toneladas">
                  {conCifras ? formatearToneladas(fila.toneladas) : '—'}
                </span>
              </li>
            ))}
          </ol>
          {estado.tipo === 'error' && (
            <p className="pc-costa-aviso">
              <i className="bi bi-info-circle" aria-hidden="true" />
              Sin cifras por ahora: la carta muestra solo la ubicación de los puertos.
            </p>
          )}
        </div>

        <div
          ref={seccionRef}
          className="pc-carta-litoral"
          role="img"
          aria-label={`Carta del litoral peruano con los puertos de norte a sur. ${descripcion}.`}
          style={{ aspectRatio: `${ANCHO} / ${ALTO}` }}
        >
          <svg viewBox={`0 0 ${ANCHO} ${ALTO}`} aria-hidden="true" focusable="false">
            <g className="pc-carta-reticula">
              {PARALELOS.map((sur) => (
                <line
                  key={sur}
                  x1="0"
                  x2={ANCHO}
                  y1={proyectar(0, sur).y}
                  y2={proyectar(0, sur).y}
                />
              ))}
              {MERIDIANOS.map((oeste) => (
                <line
                  key={oeste}
                  y1="0"
                  y2={ALTO}
                  x1={proyectar(oeste, 0).x}
                  x2={proyectar(oeste, 0).x}
                />
              ))}
            </g>
            <path
              className="pc-carta-isobata pc-carta-isobata-honda"
              d={trazoCosta}
              transform="translate(-44 0)"
            />
            <path className="pc-carta-isobata" d={trazoCosta} transform="translate(-18 0)" />
            <path className="pc-carta-tierra" d={trazoTierra} />
            <path className="pc-carta-costa" d={trazoCosta} />
            <line className="pc-carta-base" x1={X_BASE} x2={X_BASE} y1="0" y2={ALTO} />
            {puertos.map((fila) => (
              <g key={fila.puerto} className="pc-carta-puerto" data-encendido={fila.encendido}>
                <line
                  className="pc-carta-guia"
                  x1={X_BASE}
                  x2={fila.punto.x}
                  y1={fila.punto.y}
                  y2={fila.punto.y}
                />
                <circle className="pc-carta-halo" cx={fila.punto.x} cy={fila.punto.y} r="16" />
                <circle className="pc-carta-punto" cx={fila.punto.x} cy={fila.punto.y} r="5" />
              </g>
            ))}
          </svg>

          {PARALELOS.filter((sur) => sur % 4 === 2).map((sur) => (
            <span
              key={sur}
              className="pc-carta-rotulo"
              style={{ top: porcentaje(proyectar(0, sur).y, ALTO) }}
              aria-hidden="true"
            >
              {sur}°S
            </span>
          ))}

          {puertos.map((fila) => (
            <div
              key={fila.puerto}
              className="pc-carta-etiqueta"
              data-encendido={fila.encendido}
              style={{
                top: porcentaje(fila.punto.y, ALTO),
                right: porcentaje(ANCHO - X_BASE, ANCHO),
                width: porcentaje(LARGO_BARRA, ANCHO),
              }}
              aria-hidden="true"
            >
              <span className="pc-carta-etiqueta-texto">
                <strong>{fila.puerto}</strong>
                {conCifras && <span>{formatearToneladas(fila.toneladas)}</span>}
              </span>
              <span
                className="pc-carta-barra"
                style={{ '--p': conCifras ? Math.max(0.02, fila.toneladas / maximo) : 0.02 }}
              />
            </div>
          ))}

          {!reducir && (
            <motion.span className="pc-carta-lectura" style={{ y: lectura }} aria-hidden="true">
              <span />
            </motion.span>
          )}
        </div>
      </div>
    </section>
  )
}

export default CartaLitoral
