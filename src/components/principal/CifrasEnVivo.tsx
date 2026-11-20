import { ESPECIES, PUERTOS } from '../../constants/desembarques.ts'
import type { ResumenPublico } from '../../types/publico.ts'
import { colorEspecie, slugEspecie } from '../../utils/colores.ts'
import { formatearToneladas } from '../../utils/formato.ts'
import AlertMessage from '../AlertMessage.tsx'
import Esqueleto from '../Esqueleto.tsx'
import { CartaIsobatas } from '../escena/Escena.tsx'
import Contador from './Contador.tsx'

/** Estado de la carga del resumen público. */
export type EstadoResumen =
  | { tipo: 'cargando' }
  | { tipo: 'listo'; resumen: ResumenPublico }
  | { tipo: 'error'; mensaje: string }

const enteros = new Intl.NumberFormat('es-PE', { maximumFractionDigits: 0 })
const millones = new Intl.NumberFormat('es-PE', { maximumFractionDigits: 2 })

/** Monto en soles abreviado: "S/ 4.12 M" desde un millón, si no con separador de miles. */
function solesCortos(valor: number): string {
  if (valor >= 1_000_000) return `${millones.format(valor / 1_000_000)} M`
  return enteros.format(valor)
}

/** Propiedades de `CifrasEnVivo`. */
interface PropsCifrasEnVivo {
  estado: EstadoResumen
  onReintentar: () => void
}

/**
 * Cifras en vivo del sistema (`GET /api/publico/resumen`, sin sesión) en una pizarra de
 * océano nocturno: toneladas en grande, valor, desembarques, puertos y especies con
 * contadores que suben al entrar en pantalla, y la composición de la captura por especie.
 * Mientras carga muestra esqueletos; si falla, lo dice y permite reintentar.
 */
function CifrasEnVivo({ estado, onReintentar }: PropsCifrasEnVivo) {
  return (
    <section id="cifras" className="pc-bloque pc-cifras-vivo" aria-labelledby="titulo-cifras">
      <div className="pc-envoltura">
        <h2 id="titulo-cifras" className="pc-bloque-titulo">
          Lo que ya se registró en PescaControl
        </h2>
        <p className="pc-bloque-texto">
          Cifras agregadas del sistema, tal como están ahora. No incluyen datos de embarcaciones ni
          de personas.
        </p>

        <div className="pc-tablero" data-bs-theme="dark" aria-busy={estado.tipo === 'cargando'}>
          <CartaIsobatas className="pc-tablero-carta" />
          {estado.tipo === 'cargando' && <CifrasCargando />}
          {estado.tipo === 'error' && (
            <div className="pc-tablero-error">
              <AlertMessage tipo="warning" mensaje="Las cifras en vivo no están disponibles ahora.">
                <p className="mb-2 mt-1 small">{estado.mensaje}</p>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-2"
                  onClick={onReintentar}
                >
                  <i className="bi bi-arrow-clockwise" aria-hidden="true" />
                  Reintentar
                </button>
              </AlertMessage>
              <p className="pc-tablero-catalogo">
                El sistema trabaja con <strong>{PUERTOS.length} puertos</strong> y{' '}
                <strong>{ESPECIES.length} especies</strong> del litoral peruano.
              </p>
            </div>
          )}
          {estado.tipo === 'listo' && <Cifras resumen={estado.resumen} />}
        </div>
      </div>
    </section>
  )
}

/** Propiedades de `Cifras`. */
interface PropsCifras {
  resumen: ResumenPublico
}

function Cifras({ resumen }: PropsCifras) {
  const conCaptura = [...resumen.porEspecie]
    .filter((fila) => fila.toneladas > 0)
    .sort((a, b) => b.toneladas - a.toneladas)
  const descripcion = conCaptura
    .map((fila) => `${fila.especie}: ${formatearToneladas(fila.toneladas)}`)
    .join(', ')

  return (
    <>
      <dl className="pc-tablero-cifras">
        <div className="pc-tablero-principal">
          <dt>Toneladas desembarcadas</dt>
          <dd>
            <Contador valor={resumen.toneladas} formato={(n) => enteros.format(n)} />
            <span className="pc-tablero-unidad"> t</span>
          </dd>
        </div>
        <div>
          <dt>Valor desembarcado</dt>
          <dd>
            <span className="pc-tablero-unidad">S/ </span>
            <Contador valor={resumen.valor} formato={solesCortos} />
          </dd>
        </div>
        <div>
          <dt>Desembarques</dt>
          <dd>
            <Contador valor={resumen.desembarques} formato={(n) => enteros.format(n)} />
          </dd>
        </div>
        <div>
          <dt>Puertos activos</dt>
          <dd>
            <Contador valor={resumen.puertos} formato={(n) => enteros.format(n)} duracion={1} />
            <span className="pc-tablero-unidad"> de {PUERTOS.length}</span>
          </dd>
        </div>
        <div>
          <dt>Especies</dt>
          <dd>
            <Contador valor={resumen.especies} formato={(n) => enteros.format(n)} duracion={1} />
            <span className="pc-tablero-unidad"> de {ESPECIES.length}</span>
          </dd>
        </div>
      </dl>

      {conCaptura.length > 0 && (
        <figure className="pc-tablero-especies">
          <div
            className="pc-tablero-franja"
            role="img"
            aria-label={`Toneladas por especie. ${descripcion}.`}
          >
            {conCaptura.map((fila) => (
              <span
                key={fila.especie}
                data-especie={slugEspecie(fila.especie)}
                style={{ '--especie': colorEspecie(fila.especie), flexGrow: fila.toneladas }}
              />
            ))}
          </div>
          <figcaption>
            <ul className="pc-tablero-leyenda">
              {conCaptura.map((fila) => (
                <li key={fila.especie}>
                  <span
                    className="pc-insignia pc-insignia-punto"
                    data-especie={slugEspecie(fila.especie)}
                    style={{ '--especie': colorEspecie(fila.especie) }}
                    aria-hidden="true"
                  />
                  {fila.especie}
                  <span className="pc-tablero-leyenda-dato">
                    {formatearToneladas(fila.toneladas)}
                  </span>
                </li>
              ))}
            </ul>
          </figcaption>
        </figure>
      )}
    </>
  )
}

function CifrasCargando() {
  return (
    <div className="pc-tablero-cargando">
      <p className="visually-hidden" role="status">
        Cargando las cifras del sistema.
      </p>
      <div className="pc-tablero-cifras" aria-hidden="true">
        {[0, 1, 2, 3, 4].map((n) => (
          <div key={n} className={n === 0 ? 'pc-tablero-principal' : ''}>
            <Esqueleto ancho="55%" alto="0.75rem" className="pc-esqueleto-oscuro" />
            <Esqueleto
              ancho={n === 0 ? '70%' : '50%'}
              alto={n === 0 ? '4.5rem' : '2.25rem'}
              className="mt-3 pc-esqueleto-oscuro"
            />
          </div>
        ))}
      </div>
      <Esqueleto alto="1rem" className="mt-4 pc-esqueleto-oscuro" />
    </div>
  )
}

export default CifrasEnVivo
