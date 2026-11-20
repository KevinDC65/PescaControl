import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import AlertMessage from '../components/AlertMessage.tsx'
import Esqueleto from '../components/Esqueleto.tsx'
import EstadoVacio from '../components/EstadoVacio.tsx'
import {
  ComposicionEspecies,
  ConteoEstados,
  Isobatas,
  LitoralPuertos,
  RepartoDestino,
} from '../components/Graficos.tsx'
import InsigniaEspecie from '../components/InsigniaEspecie.tsx'
import InsigniaEstado from '../components/InsigniaEstado.tsx'
import { useAppContext } from '../context/AppContext.tsx'
import { getAll } from '../services/apiService.ts'
import type { Desembarque } from '../types/desembarque.ts'
import { mensajeDeError } from '../utils/errores.ts'
import {
  formatearFecha,
  formatearFechaCorta,
  formatearPrecio,
  formatearToneladas,
  hoyISO,
} from '../utils/formato.ts'
import { resumirOperaciones } from '../utils/operaciones.ts'

/** Saludo según la hora local. */
function saludoDelMomento(): string {
  const hora = new Date().getHours()
  if (hora < 12) return 'Buenos días'
  if (hora < 19) return 'Buenas tardes'
  return 'Buenas noches'
}

const plural = (cantidad: number, singular: string, varias: string) =>
  `${cantidad} ${cantidad === 1 ? singular : varias}`

/** Separa la cifra de la unidad para destacar el número ("2,559.15" y "t"). */
const cifraSinUnidad = (texto: string, unidad: string) =>
  texto.replace(new RegExp(`\\s?${unidad}$`), '')

const RUTA_ATENCION = '/lista?atencion=1'

function Home() {
  const { usuario, config } = useAppContext()
  const [desembarques, setDesembarques] = useState<Desembarque[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [intento, setIntento] = useState(0)

  function reintentar() {
    setCargando(true)
    setError('')
    setIntento((n) => n + 1)
  }

  useEffect(() => {
    let activo = true
    getAll()
      .then((datos) => {
        if (activo) setDesembarques(datos)
      })
      .catch((e) => {
        if (activo) setError(mensajeDeError(e))
      })
      .finally(() => {
        if (activo) setCargando(false)
      })
    return () => {
      activo = false
    }
  }, [intento])

  const resumen = useMemo(() => resumirOperaciones(desembarques), [desembarques])

  const saludo = usuario ? `${saludoDelMomento()}, ${usuario.nombre}` : saludoDelMomento()
  const atencion = resumen.atencion.length
  const especieLider = [...resumen.porEspecie].sort((a, b) => b.toneladas - a.toneladas)[0]

  function bajada(): ReactNode {
    if (cargando) return 'Preparando el resumen de las operaciones…'
    if (error || resumen.total === 0)
      return `Resumen de operaciones pesqueras al ${formatearFecha(hoyISO())}.`
    return (
      <>
        <strong>{plural(resumen.total, 'desembarque', 'desembarques')}</strong> registrados en{' '}
        {resumen.porPuerto.filter((fila) => fila.desembarques > 0).length} puertos.{' '}
        {atencion > 0 ? (
          <>
            <strong>{plural(atencion, 'operación requiere', 'operaciones requieren')}</strong>{' '}
            seguimiento.
          </>
        ) : (
          'Ninguna operación requiere seguimiento.'
        )}
      </>
    )
  }

  function contenido() {
    if (cargando) return <EsqueletoInicio />

    if (error) {
      return (
        <AlertMessage tipo="danger" mensaje={error}>
          <div className="mt-3">
            <button
              type="button"
              className="btn btn-sm btn-danger d-inline-flex align-items-center gap-2"
              onClick={reintentar}
            >
              <i className="bi bi-arrow-clockwise" aria-hidden="true" />
              Reintentar
            </button>
          </div>
        </AlertMessage>
      )
    }

    if (resumen.total === 0) {
      return (
        <EstadoVacio
          ilustracion="muelle"
          titulo="Aún no hay desembarques registrados"
          acciones={
            <Link to="/registro" className="btn btn-primary">
              Registrar el primer desembarque
            </Link>
          }
        >
          Cuando registres desembarques verás aquí las toneladas y el valor descargado, qué
          operaciones requieren atención y cómo se reparte la captura por especie y por puerto.
        </EstadoVacio>
      )
    }

    return (
      <>
        <dl className="pc-cifras">
          <div className="pc-pizarra">
            <Isobatas />
            <dt>Toneladas desembarcadas</dt>
            <dd className="pc-cifra pc-cifra-xl">
              {cifraSinUnidad(formatearToneladas(resumen.toneladas), config.unidad)}
              <span className="pc-cifra-unidad"> {config.unidad}</span>
            </dd>
            <dd className="pc-cifra-nota">
              {especieLider && especieLider.toneladas > 0
                ? `${especieLider.especie}: ${especieLider.porcentaje.toLocaleString('es-PE')} % de la captura`
                : 'en todos los puertos'}
            </dd>
          </div>
          <div>
            <dt>Valor desembarcado</dt>
            <dd className="pc-cifra">
              <span className="pc-cifra-unidad">{config.moneda} </span>
              {formatearPrecio(resumen.valor).replace(/^S\/\s/, '')}
            </dd>
            <dd className="pc-cifra-nota">toneladas × precio por tonelada</dd>
          </div>
          <div>
            <dt>Desembarques</dt>
            <dd className="pc-cifra">{resumen.total}</dd>
            <dd className="pc-cifra-nota">
              {plural(resumen.porEstado.Descargado, 'descargado', 'descargados')} ·{' '}
              {resumen.porEstado.Programado} programados
            </dd>
          </div>
          <div data-alerta={atencion > 0}>
            <dt>Requieren atención</dt>
            <dd className="pc-cifra">{atencion}</dd>
            <dd className="pc-cifra-nota">
              {atencion > 0 ? (
                <Link to={RUTA_ATENCION} className="pc-enlace">
                  {resumen.observados} observados · {resumen.enDescarga} en descarga
                </Link>
              ) : (
                'sin observaciones ni descargas abiertas'
              )}
            </dd>
          </div>
        </dl>

        <div className="pc-rejilla-inicio">
          <section className="pc-panel" aria-labelledby="titulo-atencion">
            <div className="pc-panel-cabecera">
              <h3 id="titulo-atencion" className="pc-panel-titulo">
                Requieren atención
              </h3>
              {atencion > 0 && (
                <Link to={RUTA_ATENCION} className="pc-enlace small">
                  Ver en Desembarques
                </Link>
              )}
            </div>
            {atencion === 0 ? (
              <p className="text-body-secondary mb-0">
                <i className="bi bi-check2-circle me-2 text-success" aria-hidden="true" />
                Todas las operaciones están programadas o descargadas.
              </p>
            ) : (
              <ul className="pc-bitacora">
                {resumen.atencion.slice(0, 5).map((desembarque) => (
                  <FilaBitacora key={desembarque.id} desembarque={desembarque} />
                ))}
              </ul>
            )}
          </section>

          <section className="pc-panel" aria-labelledby="titulo-especies">
            <div className="pc-panel-cabecera">
              <h3 id="titulo-especies" className="pc-panel-titulo">
                Toneladas por especie
              </h3>
              <p className="pc-panel-nota">Ancho de cada tramo = toneladas desembarcadas.</p>
            </div>
            <ComposicionEspecies porEspecie={resumen.porEspecie} />
          </section>
        </div>

        <div className="pc-rejilla-inicio pc-rejilla-inicio-b">
          <section className="pc-panel" aria-labelledby="titulo-puertos">
            <div className="pc-panel-cabecera">
              <h3 id="titulo-puertos" className="pc-panel-titulo">
                Toneladas por puerto
              </h3>
              <p className="pc-panel-nota">De norte a sur, cada puerto en su latitud.</p>
            </div>
            <LitoralPuertos porPuerto={resumen.porPuerto} />
          </section>

          <section className="pc-panel" aria-labelledby="titulo-destino">
            <div className="pc-panel-cabecera">
              <h3 id="titulo-destino" className="pc-panel-titulo">
                Destino de la captura
              </h3>
            </div>
            <RepartoDestino porDestino={resumen.porDestino} />
            <h4 className="pc-subtitulo">Estado de las operaciones</h4>
            <ConteoEstados porEstado={resumen.porEstado} />
          </section>
        </div>

        <section className="pc-panel" aria-labelledby="titulo-recientes">
          <div className="pc-panel-cabecera">
            <h3 id="titulo-recientes" className="pc-panel-titulo">
              Últimos desembarques
            </h3>
            <Link to="/lista" className="pc-enlace small">
              Ver todos
            </Link>
          </div>
          <ul className="pc-bitacora pc-bitacora-recientes">
            {resumen.recientes.map((desembarque) => (
              <FilaBitacora key={desembarque.id} desembarque={desembarque} conFecha />
            ))}
          </ul>
        </section>
      </>
    )
  }

  return (
    <section className="pc-inicio" aria-labelledby="titulo-inicio">
      <header className="pc-cabecera-pagina">
        <div>
          <h2 id="titulo-inicio" className="pc-titulo-pagina">
            {saludo}
          </h2>
          <p className="pc-bajada">{bajada()}</p>
        </div>
        <div className="pc-cabecera-acciones">
          <Link to="/registro" className="btn btn-primary d-inline-flex align-items-center gap-2">
            <i className="bi bi-plus-lg" aria-hidden="true" />
            Registrar desembarque
          </Link>
          <Link
            to="/lista"
            className="btn btn-outline-secondary d-none d-sm-inline-flex align-items-center gap-2"
          >
            <i className="bi bi-list-columns-reverse" aria-hidden="true" />
            Ver desembarques
          </Link>
        </div>
      </header>

      {contenido()}
    </section>
  )
}

/**
 * Fila de la bitácora de Inicio: especie, embarcación con su matrícula, puerto, toneladas
 * y estado. La embarcación abre el detalle en Desembarques.
 */
/** Propiedades de `FilaBitacora`. */
interface PropsFilaBitacora {
  desembarque: Desembarque
  /** Muestra la fecha al inicio de la fila (bitácora de recientes). */
  conFecha?: boolean
}

function FilaBitacora({ desembarque, conFecha = false }: PropsFilaBitacora) {
  return (
    <li className="pc-bitacora-fila">
      {conFecha && (
        <span className="pc-bitacora-fecha">
          {formatearFechaCorta(desembarque.fechaDesembarque)}
        </span>
      )}
      <InsigniaEspecie especie={desembarque.especie} forma="ficha" />
      <div className="pc-bitacora-texto">
        <Link to={`/lista?desembarque=${desembarque.id}`} className="pc-bitacora-nombre">
          {desembarque.embarcacion}
        </Link>
        <span className="pc-bitacora-meta">
          <span className="pc-codigo">{desembarque.codigo}</span> · {desembarque.especie} ·{' '}
          {desembarque.puerto}
          {!conFecha && <> · {formatearFechaCorta(desembarque.fechaDesembarque)}</>}
        </span>
      </div>
      <div className="pc-bitacora-cierre">
        <span className="pc-cifra-dato">{formatearToneladas(desembarque.toneladas)}</span>
        <InsigniaEstado estado={desembarque.estado} />
      </div>
    </li>
  )
}

/** Esqueleto con la forma del panel mientras llega la respuesta de la API. */
function EsqueletoInicio() {
  return (
    <div aria-busy="true">
      <p className="visually-hidden" role="status">
        Cargando el resumen de las operaciones.
      </p>
      <div className="pc-cifras" aria-hidden="true">
        {[0, 1, 2, 3].map((n) => (
          <div key={n} className={n === 0 ? 'pc-pizarra pc-pizarra-esqueleto' : ''}>
            <Esqueleto ancho="45%" alto="0.75rem" />
            <Esqueleto
              ancho={n === 0 ? '75%' : '55%'}
              alto={n === 0 ? '3rem' : '2.25rem'}
              className="mt-3"
            />
            <Esqueleto ancho="60%" alto="0.75rem" className="mt-2" />
          </div>
        ))}
      </div>
      <div className="pc-rejilla-inicio" aria-hidden="true">
        {[0, 1].map((n) => (
          <div key={n} className="pc-panel">
            <Esqueleto ancho="40%" alto="1rem" />
            {n === 1 && <Esqueleto alto="2.5rem" className="mt-3" />}
            {[0, 1, 2, 3].map((fila) => (
              <Esqueleto key={fila} alto="2.25rem" className="mt-3" />
            ))}
          </div>
        ))}
      </div>
      <div className="pc-rejilla-inicio pc-rejilla-inicio-b" aria-hidden="true">
        <div className="pc-panel">
          <Esqueleto ancho="35%" alto="1rem" />
          <Esqueleto alto="15rem" className="mt-3" />
        </div>
        <div className="pc-panel">
          <Esqueleto ancho="45%" alto="1rem" />
          <Esqueleto alto="2rem" className="mt-3" />
          {[0, 1, 2, 3].map((fila) => (
            <Esqueleto key={fila} alto="1.75rem" className="mt-3" />
          ))}
        </div>
      </div>
    </div>
  )
}

export default Home
