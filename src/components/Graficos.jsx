import { ESTADOS } from '../constants/desembarques.js'
import { colorEspecie, slugEspecie } from '../utils/colores.js'
import { formatearToneladas } from '../utils/formato.js'
import InsigniaEspecie from './InsigniaEspecie.jsx'
import InsigniaEstado from './InsigniaEstado.jsx'

// Gráficos propios del panel de Inicio, hechos con HTML y CSS (sin librerías). Cada uno
// lleva role="img" con una descripción completa y, además, sus cifras escritas como texto.

const porcentajeTexto = (porcentaje) =>
  `${porcentaje.toLocaleString('es-PE', { maximumFractionDigits: 1 })} %`

/**
 * Composición de la captura por especie: una franja con un tramo por especie (ancho
 * proporcional a sus toneladas, color de colorEspecie) y debajo la tabla con las cifras,
 * de mayor a menor tonelaje.
 *
 * @param {{ porEspecie: { especie: string, desembarques: number, toneladas: number,
 *   porcentaje: number }[] }} props
 */
export function ComposicionEspecies({ porEspecie }) {
  const filas = [...porEspecie].sort((a, b) => b.toneladas - a.toneladas)
  const conCaptura = filas.filter((fila) => fila.toneladas > 0)
  const descripcion = conCaptura
    .map((fila) => `${fila.especie}: ${formatearToneladas(fila.toneladas)}`)
    .join(', ')

  return (
    <figure className="pc-composicion mb-0">
      <div
        className="pc-composicion-franja"
        role="img"
        aria-label={`Toneladas por especie. ${descripcion || 'Sin capturas registradas'}.`}
      >
        {conCaptura.length === 0 ? (
          <span className="pc-composicion-vacia" />
        ) : (
          conCaptura.map((fila) => (
            <span
              key={fila.especie}
              className="pc-composicion-tramo"
              data-especie={slugEspecie(fila.especie)}
              style={{ '--especie': colorEspecie(fila.especie), flexGrow: fila.toneladas }}
              title={`${fila.especie}: ${formatearToneladas(fila.toneladas)}`}
            />
          ))
        )}
      </div>
      <figcaption>
        <table className="pc-composicion-tabla">
          <thead>
            <tr>
              <th scope="col">Especie</th>
              <th scope="col" className="text-end">
                Desemb.
              </th>
              <th scope="col" className="text-end">
                Toneladas
              </th>
              <th scope="col" className="text-end">
                Part.
              </th>
            </tr>
          </thead>
          <tbody>
            {filas.map((fila) => (
              <tr key={fila.especie} data-vacio={fila.toneladas === 0}>
                <th scope="row">
                  <InsigniaEspecie especie={fila.especie} forma="etiqueta" />
                </th>
                <td className="text-end">{fila.desembarques}</td>
                <td className="text-end pc-cifra-dato">{formatearToneladas(fila.toneladas)}</td>
                <td className="text-end">{porcentajeTexto(fila.porcentaje)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </figcaption>
    </figure>
  )
}

/** Latitud sur aproximada de cada puerto (grados), para ubicarlo en la carta del litoral. */
const LATITUD_PUERTO = { Paita: 5.08, Chimbote: 9.07, Callao: 12.05, Pisco: 13.71, Ilo: 17.64 }
const LATITUD_NORTE = 4
const LATITUD_SUR = 19.2
const PARALELOS = [6, 10, 14, 18]

/** Posición vertical (0–100 %) de una latitud dentro de la carta. */
const posicion = (latitud) =>
  `${((latitud - LATITUD_NORTE) / (LATITUD_SUR - LATITUD_NORTE)) * 100}%`

/**
 * Toneladas por puerto dibujadas como una carta del litoral peruano: cada puerto está a su
 * latitud real (de Paita a Ilo, de norte a sur) sobre la franja de arena de la costa y su
 * barra sale hacia el mar con un largo proporcional a lo desembarcado.
 *
 * @param {{ porPuerto: { puerto: string, desembarques: number, toneladas: number }[] }} props
 */
export function LitoralPuertos({ porPuerto }) {
  const maximo = Math.max(1, ...porPuerto.map((fila) => fila.toneladas))
  const descripcion = porPuerto
    .map((fila) => `${fila.puerto}: ${formatearToneladas(fila.toneladas)}`)
    .join(', ')

  return (
    <div
      className="pc-litoral"
      role="img"
      aria-label={`Toneladas por puerto, de norte a sur. ${descripcion}.`}
    >
      <span className="pc-litoral-tierra" aria-hidden="true" />
      <span className="pc-litoral-isobata" aria-hidden="true" />
      <span className="pc-litoral-isobata pc-litoral-isobata-honda" aria-hidden="true" />
      {PARALELOS.map((latitud) => (
        <span
          key={latitud}
          className="pc-litoral-paralelo"
          style={{ '--y': posicion(latitud) }}
          aria-hidden="true"
        >
          {String(latitud).padStart(2, '0')}°S
        </span>
      ))}
      {porPuerto.map((fila, indice) => (
        <div
          key={fila.puerto}
          className="pc-litoral-puerto"
          data-vacio={fila.toneladas === 0}
          style={{
            '--y': posicion(LATITUD_PUERTO[fila.puerto] ?? LATITUD_NORTE),
            '--p': fila.toneladas / maximo,
            '--i': indice,
          }}
          aria-hidden="true"
        >
          <span className="pc-litoral-mar">
            <span className="pc-litoral-valor">{formatearToneladas(fila.toneladas)}</span>
            <span className="pc-litoral-barra" />
          </span>
          <span className="pc-litoral-nombre">{fila.puerto}</span>
        </div>
      ))}
    </div>
  )
}

/**
 * Destino de la captura (consumo humano directo frente a harina y aceite) como una barra
 * partida en dos, con sus toneladas y porcentaje.
 *
 * @param {{ porDestino: { destino: string, toneladas: number, porcentaje: number }[] }} props
 */
export function RepartoDestino({ porDestino }) {
  const descripcion = porDestino
    .map((fila) => `${fila.destino}: ${formatearToneladas(fila.toneladas)}`)
    .join(', ')
  const hayCaptura = porDestino.some((fila) => fila.toneladas > 0)

  return (
    <figure className="pc-destino mb-0">
      <div
        className="pc-destino-barra"
        role="img"
        aria-label={`Toneladas por destino. ${descripcion}.`}
      >
        {hayCaptura ? (
          porDestino.map((fila, indice) => (
            <span
              key={fila.destino}
              className="pc-destino-tramo"
              data-destino={indice}
              style={{ flexGrow: fila.toneladas }}
            />
          ))
        ) : (
          <span className="pc-composicion-vacia" />
        )}
      </div>
      <figcaption>
        <dl className="pc-destino-leyenda">
          {porDestino.map((fila, indice) => (
            <div key={fila.destino} data-destino={indice}>
              <dt>{fila.destino}</dt>
              <dd>
                <span className="pc-cifra-dato">{formatearToneladas(fila.toneladas)}</span>
                <span className="pc-destino-pct">{porcentajeTexto(fila.porcentaje)}</span>
              </dd>
            </div>
          ))}
        </dl>
      </figcaption>
    </figure>
  )
}

/**
 * Cantidad de desembarques en cada estado, en el orden en que avanza la operación.
 * @param {{ porEstado: Record<string, number> }} props
 */
export function ConteoEstados({ porEstado }) {
  return (
    <ul className="pc-estados">
      {ESTADOS.map((estado) => (
        <li key={estado} data-vacio={!porEstado[estado]}>
          <InsigniaEstado estado={estado} />
          <span className="pc-estados-cifra">{porEstado[estado] ?? 0}</span>
        </li>
      ))}
    </ul>
  )
}

/**
 * Isóbatas: curvas de profundidad de una carta náutica, dibujadas muy tenues detrás de la
 * cifra principal de Inicio. Decorativas.
 */
export function Isobatas() {
  return (
    <svg
      className="pc-isobatas"
      viewBox="0 0 640 220"
      preserveAspectRatio="xMaxYMid slice"
      aria-hidden="true"
      focusable="false"
    >
      <g fill="none" strokeWidth="1">
        <path d="M640 18c-60 6-96 40-150 44s-92-22-150-8-80 52-140 60S96 98 0 112" />
        <path d="M640 52c-54 4-92 34-140 40s-96-14-150 0-86 50-148 58S92 140 0 150" />
        <path d="M640 92c-48 6-80 28-124 34s-90-8-140 4-82 40-140 50S90 176 0 186" />
        <path d="M640 136c-44 2-76 22-116 28s-82-2-128 8-78 30-128 38S86 206 0 214" />
        <path d="M640 178c-40 2-70 16-106 20s-74 0-114 6-68 18-110 22" />
      </g>
      <g className="pc-isobatas-sondas">
        <text x="560" y="84">
          12
        </text>
        <text x="470" y="150">
          25
        </text>
        <text x="380" y="200">
          40
        </text>
      </g>
    </svg>
  )
}
