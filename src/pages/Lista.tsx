import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import AlertMessage from '../components/AlertMessage.tsx'
import ConfirmModal from '../components/ConfirmModal.tsx'
import DetalleDesembarque from '../components/DetalleDesembarque.tsx'
import Drawer from '../components/Drawer.tsx'
import Esqueleto from '../components/Esqueleto.tsx'
import EstadoVacio from '../components/EstadoVacio.tsx'
import InsigniaEspecie from '../components/InsigniaEspecie.tsx'
import Loading from '../components/Loading.tsx'
import TablaDesembarques from '../components/TablaDesembarques.tsx'
import TarjetaDesembarque from '../components/TarjetaDesembarque.tsx'
import { Tecla } from '../components/Tecla.tsx'
import { ESPECIES, ESTADOS, PUERTOS, perteneceACatalogo } from '../constants/desembarques.ts'
import { useLocalStorage } from '../hooks/useLocalStorage.ts'
import { useToast } from '../hooks/useToast.ts'
import { getAll, remove } from '../services/apiService.ts'
import type { Desembarque, Especie, EstadoDesembarque, Puerto } from '../types/desembarque.ts'
import type { Orden } from '../types/operaciones.ts'
import { mensajeDeError } from '../utils/errores.ts'
import { formatearFechaCorta, formatearToneladas } from '../utils/formato.ts'
import {
  ORDENES,
  ORDEN_PREDETERMINADO,
  avisarCambioOperaciones,
  filtrarDesembarques,
  ordenValido,
  ordenarDesembarques,
  requiereAtencion,
} from '../utils/operaciones.ts'

const PATRON_FECHA = /^\d{4}-\d{2}-\d{2}$/

/** Filtros de la lista leídos de la URL. */
interface FiltrosLista {
  q: string
  especie: Especie | ''
  puerto: Puerto | ''
  estado: EstadoDesembarque | ''
  /** Fecha `YYYY-MM-DD` o vacía. */
  desde: string
  /** Fecha `YYYY-MM-DD` o vacía. */
  hasta: string
  /** Solo los que requieren atención (?atencion=1). */
  atencion: boolean
}

/** Filtro de la lista que se elige en un select. */
interface FiltroSelect {
  clave: 'especie' | 'puerto' | 'estado'
  etiqueta: string
  opciones: readonly string[]
  /** Texto de la opción sin filtro. */
  todos: string
}

/** Valor de un parámetro de la URL; vacío, `false`, null o undefined lo quitan. */
type ValorParametro = string | false | null | undefined

/** Vistas de la lista. */
type VistaLista = 'tabla' | 'tarjetas'

/** Desembarques que esperan confirmación para eliminarse. */
interface Eliminacion {
  abierta: boolean
  desembarques: Desembarque[]
}

/** Desembarque que no se pudo eliminar, con el motivo. */
interface EliminacionFallida {
  desembarque: Desembarque
  mensaje: string
}

/** Valida un parámetro de la URL contra una lista; si no es válido, se ignora. */
const valorPermitido = <T extends string>(valor: string | null, permitidos: readonly T[]) =>
  perteneceACatalogo(permitidos, valor) ? valor : ''

/** Indica si el estado de navegación pide enfocar la búsqueda (atajo "/" desde otra página). */
const pideEnfocarBusqueda = (estado: unknown): boolean =>
  typeof estado === 'object' &&
  estado !== null &&
  'enfocarBusqueda' in estado &&
  Boolean(estado.enfocarBusqueda)

/** Lee los filtros desde los parámetros de la URL (sin confiar en su contenido). */
function leerFiltros(parametros: URLSearchParams): FiltrosLista {
  const fecha = (clave: string) => {
    const valor = parametros.get(clave) ?? ''
    return PATRON_FECHA.test(valor) ? valor : ''
  }
  return {
    q: parametros.get('q') ?? '',
    especie: valorPermitido(parametros.get('especie'), ESPECIES),
    puerto: valorPermitido(parametros.get('puerto'), PUERTOS),
    estado: valorPermitido(parametros.get('estado'), ESTADOS),
    desde: fecha('desde'),
    hasta: fecha('hasta'),
    atencion: parametros.get('atencion') === '1',
  }
}

const FILTROS_SELECT: readonly FiltroSelect[] = [
  { clave: 'especie', etiqueta: 'Especie', opciones: ESPECIES, todos: 'Todas las especies' },
  { clave: 'puerto', etiqueta: 'Puerto', opciones: PUERTOS, todos: 'Todos los puertos' },
  { clave: 'estado', etiqueta: 'Estado', opciones: ESTADOS, todos: 'Todos los estados' },
]

const plural = (cantidad: number, singular: string, varias: string) =>
  `${cantidad} ${cantidad === 1 ? singular : varias}`

function Lista() {
  const toast = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const [parametros, setParametros] = useSearchParams()

  const [desembarques, setDesembarques] = useState<Desembarque[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [intento, setIntento] = useState(0)

  const [vista, setVista] = useLocalStorage<string>('pescacontrol:vista-desembarques', 'tabla')
  const [seleccion, setSeleccion] = useState(() => new Set<string>())
  const [eliminacion, setEliminacion] = useState<Eliminacion>({
    abierta: false,
    desembarques: [],
  })
  const [eliminando, setEliminando] = useState(false)
  const [errorEliminacion, setErrorEliminacion] = useState('')
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false)
  const busquedaRef = useRef<HTMLInputElement>(null)

  // Los filtros viven en la URL (?q=&especie=&puerto=&estado=&desde=&hasta=&atencion=1&orden=
  // &desembarque=) para que una vista filtrada se pueda compartir o guardar como marcador.
  const filtros = leerFiltros(parametros)

  // El texto de búsqueda se guarda también en estado local: la lista se filtra al instante
  // mientras se escribe y la URL (?q=) se actualiza un momento después.
  const [textoBusqueda, setTextoBusqueda] = useState(filtros.q)
  const escritoRef = useRef(filtros.q)
  const temporizadorRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => {
    if (filtros.q !== escritoRef.current) {
      escritoRef.current = filtros.q
      setTextoBusqueda(filtros.q)
    }
  }, [filtros.q])

  useEffect(() => () => clearTimeout(temporizadorRef.current), [])

  function buscar(texto: string) {
    setTextoBusqueda(texto)
    escritoRef.current = texto
    clearTimeout(temporizadorRef.current)
    temporizadorRef.current = setTimeout(() => cambiarParametros({ q: texto }), 250)
  }

  const orden = ordenValido(parametros.get('orden'))
  const idDetalle = parametros.get('desembarque')
  const vistaActual: VistaLista = vista === 'tarjetas' ? 'tarjetas' : 'tabla'

  function cambiarParametros(cambios: Record<string, ValorParametro>) {
    setParametros(
      () => {
        // Se parte de la URL actual (no de los parámetros del render que creó esta función):
        // una búsqueda diferida no debe reponer filtros que el usuario ya quitó.
        const nuevos = new URLSearchParams(window.location.search)
        for (const [clave, valor] of Object.entries(cambios)) {
          if (valor === '' || valor === null || valor === undefined || valor === false) {
            nuevos.delete(clave)
          } else {
            nuevos.set(clave, valor)
          }
        }
        return nuevos
      },
      { replace: true },
    )
  }

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

  // El atajo "/" desde otra página llega con esta marca para enfocar la búsqueda.
  useEffect(() => {
    if (!cargando && pideEnfocarBusqueda(location.state)) {
      busquedaRef.current?.focus()
      navigate(`${location.pathname}${location.search}`, { replace: true, state: null })
    }
  }, [cargando, location, navigate])

  const visibles = useMemo(() => {
    const leidos = leerFiltros(parametros)
    const filtrados = filtrarDesembarques(desembarques, { ...leidos, q: textoBusqueda })
    return ordenarDesembarques(
      leidos.atencion ? filtrados.filter(requiereAtencion) : filtrados,
      ordenValido(parametros.get('orden')),
    )
  }, [desembarques, parametros, textoBusqueda])

  const detalle = idDetalle
    ? desembarques.find((desembarque) => String(desembarque.id) === idDetalle)
    : null
  const seleccionados = visibles.filter((desembarque) => seleccion.has(desembarque.id))
  const cantidadFiltros = [
    filtros.especie,
    filtros.puerto,
    filtros.estado,
    filtros.desde || filtros.hasta,
  ].filter(Boolean).length
  const hayFiltros = Boolean(textoBusqueda || cantidadFiltros || filtros.atencion)
  const rangoInvertido = Boolean(filtros.desde && filtros.hasta && filtros.desde > filtros.hasta)
  const toneladasVisibles = visibles.reduce(
    (total, desembarque) => total + (Number(desembarque.toneladas) || 0),
    0,
  )
  const toneladasTotales = desembarques.reduce(
    (total, desembarque) => total + (Number(desembarque.toneladas) || 0),
    0,
  )

  function limpiarFiltros() {
    clearTimeout(temporizadorRef.current)
    setTextoBusqueda('')
    escritoRef.current = ''
    cambiarParametros({
      q: '',
      especie: '',
      puerto: '',
      estado: '',
      desde: '',
      hasta: '',
      atencion: '',
    })
  }

  /** Clic en un encabezado: alterna entre sus órdenes o fija el único que tiene. */
  function ordenarPor(ordenesColumna: readonly Orden[]) {
    const actual = ordenesColumna.indexOf(orden)
    const nuevo = ordenesColumna[(actual + 1) % ordenesColumna.length]
    cambiarParametros({ orden: nuevo === ORDEN_PREDETERMINADO ? '' : nuevo })
  }

  function alternarSeleccion(id: string) {
    setSeleccion((anterior) => {
      const nueva = new Set(anterior)
      if (nueva.has(id)) nueva.delete(id)
      else nueva.add(id)
      return nueva
    })
  }

  function seleccionarTodos(marcar: boolean) {
    setSeleccion((anterior) => {
      const nueva = new Set(anterior)
      for (const desembarque of visibles) {
        if (marcar) nueva.add(desembarque.id)
        else nueva.delete(desembarque.id)
      }
      return nueva
    })
  }

  const abrirDetalle = (desembarque: Desembarque) =>
    cambiarParametros({ desembarque: desembarque.id })
  const cerrarDetalle = () => cambiarParametros({ desembarque: '' })
  const editar = (desembarque: Desembarque) => navigate(`/registro/${desembarque.id}`)
  const pedirEliminacion = (lista: Desembarque[]) => {
    setErrorEliminacion('')
    setEliminacion({ abierta: true, desembarques: lista })
  }

  async function confirmarEliminacion() {
    const lista = eliminacion.desembarques
    setEliminando(true)
    const eliminados: Desembarque[] = []
    const fallidos: EliminacionFallida[] = []
    // Una petición DELETE por desembarque (apiService.remove), en orden.
    for (const desembarque of lista) {
      try {
        await remove(desembarque.id)
        eliminados.push(desembarque)
      } catch (e) {
        fallidos.push({ desembarque, mensaje: mensajeDeError(e) })
      }
    }
    const idsEliminados = new Set(eliminados.map((desembarque) => desembarque.id))
    setDesembarques((anteriores) =>
      anteriores.filter((desembarque) => !idsEliminados.has(desembarque.id)),
    )
    setSeleccion((anterior) => new Set([...anterior].filter((id) => !idsEliminados.has(id))))
    setEliminando(false)
    setEliminacion((actual) => ({ ...actual, abierta: false }))
    if (detalle && idsEliminados.has(detalle.id)) cerrarDetalle()

    const [primerEliminado] = eliminados
    const [primerFallo] = fallidos
    if (eliminados.length === 1 && primerEliminado) {
      toast.exito(
        `Se eliminó el desembarque ${primerEliminado.codigo} · ${primerEliminado.embarcacion}.`,
      )
    } else if (eliminados.length > 1) {
      toast.exito(`Se eliminaron ${eliminados.length} desembarques.`)
    }
    if (primerFallo) {
      const codigos = fallidos.map(({ desembarque }) => desembarque.codigo).join(', ')
      setErrorEliminacion(`No se pudo eliminar ${codigos}. ${primerFallo.mensaje}`)
    }
    if (eliminados.length > 0) avisarCambioOperaciones()
  }

  function contenido() {
    if (cargando) {
      return (
        <>
          <Loading />
          <div className="pc-tabla pc-tabla-esqueleto" aria-hidden="true">
            {[0, 1, 2, 3, 4].map((fila) => (
              <div key={fila} className="pc-fila-esqueleto">
                <Esqueleto ancho="1rem" alto="1rem" />
                <Esqueleto ancho="4rem" alto="0.875rem" />
                <Esqueleto ancho={`${30 + ((fila * 13) % 25)}%`} alto="0.875rem" />
                <Esqueleto ancho="4.5rem" alto="0.875rem" className="ms-auto" />
              </div>
            ))}
          </div>
        </>
      )
    }

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

    if (desembarques.length === 0) {
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
          Registra el primer desembarque para controlar las toneladas, el valor y el estado de cada
          operación en el muelle.
        </EstadoVacio>
      )
    }

    return (
      <>
        <div className="pc-barra-filtros" role="search" aria-label="Filtrar desembarques">
          <div className="pc-barra-filtros-fila">
            <div className="pc-campo-busqueda">
              <label htmlFor="filtro-busqueda" className="visually-hidden">
                Buscar por embarcación, código o matrícula
              </label>
              <i className="bi bi-search" aria-hidden="true" />
              <input
                ref={busquedaRef}
                id="filtro-busqueda"
                type="search"
                className="form-control"
                placeholder="Embarcación, código o matrícula"
                value={textoBusqueda}
                onChange={(evento) => buscar(evento.target.value)}
                onKeyDown={(evento) => {
                  if (evento.key === 'Escape' && textoBusqueda) {
                    evento.preventDefault()
                    buscar('')
                  }
                }}
                autoComplete="off"
              />
              <Tecla className="pc-campo-busqueda-tecla">/</Tecla>
            </div>

            <button
              type="button"
              className="pc-boton-filtros"
              aria-expanded={filtrosAbiertos}
              aria-controls="filtros-lista"
              onClick={() => setFiltrosAbiertos((abiertos) => !abiertos)}
            >
              <i className="bi bi-sliders2" aria-hidden="true" />
              <span className="visually-hidden">Filtros y orden</span>
              {cantidadFiltros > 0 && (
                <span className="pc-boton-filtros-cuenta">{cantidadFiltros}</span>
              )}
            </button>

            <button
              type="button"
              className="pc-chip pc-chip-atencion"
              aria-pressed={filtros.atencion}
              onClick={() => cambiarParametros({ atencion: filtros.atencion ? '' : '1' })}
            >
              <span className="pc-chip-boya" aria-hidden="true" />
              Requieren atención
            </button>

            <div className="pc-segmentado" role="group" aria-label="Vista de la lista">
              {[
                { valor: 'tabla', texto: 'Tabla', icono: 'bi-table' },
                { valor: 'tarjetas', texto: 'Tarjetas', icono: 'bi-grid-3x2-gap' },
              ].map((opcion) => (
                <button
                  key={opcion.valor}
                  type="button"
                  aria-pressed={vistaActual === opcion.valor}
                  onClick={() => setVista(opcion.valor)}
                  title={`Vista ${opcion.texto.toLowerCase()}`}
                >
                  <i className={`bi ${opcion.icono}`} aria-hidden="true" />
                  <span>{opcion.texto}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="pc-filtros-plegables" id="filtros-lista" data-abierto={filtrosAbiertos}>
            {FILTROS_SELECT.map((filtro) => (
              <div
                key={filtro.clave}
                className="pc-filtro"
                data-activo={Boolean(filtros[filtro.clave])}
              >
                <label htmlFor={`filtro-${filtro.clave}`} className="pc-filtro-etiqueta">
                  {filtro.etiqueta}
                </label>
                <select
                  id={`filtro-${filtro.clave}`}
                  className="form-select"
                  value={filtros[filtro.clave]}
                  onChange={(evento) => cambiarParametros({ [filtro.clave]: evento.target.value })}
                >
                  <option value="">{filtro.todos}</option>
                  {filtro.opciones.map((opcion) => (
                    <option key={opcion} value={opcion}>
                      {opcion}
                    </option>
                  ))}
                </select>
              </div>
            ))}

            <fieldset
              className="pc-filtro pc-filtro-fechas"
              data-activo={Boolean(filtros.desde || filtros.hasta)}
            >
              <legend className="pc-filtro-etiqueta">Fecha de desembarque</legend>
              <div className="pc-rango-fechas">
                <label htmlFor="filtro-desde" className="visually-hidden">
                  Desde
                </label>
                <input
                  id="filtro-desde"
                  type="date"
                  className="form-control"
                  value={filtros.desde}
                  max={filtros.hasta || undefined}
                  onChange={(evento) => cambiarParametros({ desde: evento.target.value })}
                  aria-describedby={rangoInvertido ? 'filtro-fechas-aviso' : undefined}
                />
                <span className="pc-rango-separador" aria-hidden="true">
                  a
                </span>
                <label htmlFor="filtro-hasta" className="visually-hidden">
                  Hasta
                </label>
                <input
                  id="filtro-hasta"
                  type="date"
                  className="form-control"
                  value={filtros.hasta}
                  min={filtros.desde || undefined}
                  onChange={(evento) => cambiarParametros({ hasta: evento.target.value })}
                  aria-describedby={rangoInvertido ? 'filtro-fechas-aviso' : undefined}
                />
              </div>
            </fieldset>

            <div className="pc-filtro pc-filtro-orden">
              <label htmlFor="filtro-orden" className="pc-filtro-etiqueta">
                Ordenar por
              </label>
              <select
                id="filtro-orden"
                className="form-select"
                value={orden}
                onChange={(evento) =>
                  cambiarParametros({
                    orden: evento.target.value === ORDEN_PREDETERMINADO ? '' : evento.target.value,
                  })
                }
              >
                {ORDENES.map((opcion) => (
                  <option key={opcion.valor} value={opcion.valor}>
                    {opcion.texto}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="pc-resultado">
          <p className="mb-0" aria-live="polite">
            Mostrando <strong>{visibles.length}</strong> de{' '}
            {plural(desembarques.length, 'desembarque', 'desembarques')}
            <span className="pc-resultado-toneladas">
              {' · '}
              {formatearToneladas(toneladasVisibles)}
            </span>
          </p>
          {hayFiltros && (
            <ul className="pc-filtros-activos" aria-label="Filtros activos">
              {textoBusqueda && (
                <FiltroActivo texto={`«${textoBusqueda}»`} onQuitar={() => buscar('')} />
              )}
              {filtros.atencion && (
                <FiltroActivo
                  texto="Requieren atención"
                  onQuitar={() => cambiarParametros({ atencion: '' })}
                />
              )}
              {FILTROS_SELECT.filter((filtro) => filtros[filtro.clave]).map((filtro) => (
                <FiltroActivo
                  key={filtro.clave}
                  texto={filtros[filtro.clave]}
                  onQuitar={() => cambiarParametros({ [filtro.clave]: '' })}
                />
              ))}
              {(filtros.desde || filtros.hasta) && (
                <FiltroActivo
                  texto={`${filtros.desde ? formatearFechaCorta(filtros.desde) : 'inicio'} – ${filtros.hasta ? formatearFechaCorta(filtros.hasta) : 'hoy'}`}
                  onQuitar={() => cambiarParametros({ desde: '', hasta: '' })}
                />
              )}
              <li>
                <button type="button" className="pc-enlace-boton" onClick={limpiarFiltros}>
                  Limpiar filtros
                </button>
              </li>
            </ul>
          )}
        </div>

        {rangoInvertido && (
          <p id="filtro-fechas-aviso" className="pc-aviso-rango" role="status">
            <i className="bi bi-exclamation-diamond" aria-hidden="true" />
            La fecha inicial es posterior a la final: ningún desembarque puede cumplir ese rango.
          </p>
        )}

        <AlertMessage
          tipo="danger"
          mensaje={errorEliminacion}
          onClose={() => setErrorEliminacion('')}
        />

        {visibles.length === 0 ? (
          <EstadoVacio
            ilustracion="sonda"
            titulo="Ningún desembarque coincide"
            acciones={
              <button type="button" className="btn btn-outline-primary" onClick={limpiarFiltros}>
                Limpiar filtros
              </button>
            }
          >
            Prueba con otra embarcación, código o matrícula, o quita algún filtro. La búsqueda
            ignora tildes y mayúsculas: «senor» encuentra «Señor de Sipán».
          </EstadoVacio>
        ) : vistaActual === 'tabla' ? (
          <TablaDesembarques
            desembarques={visibles}
            orden={orden}
            onOrdenar={ordenarPor}
            seleccion={seleccion}
            onSeleccionar={alternarSeleccion}
            onSeleccionarTodos={seleccionarTodos}
            onAbrir={abrirDetalle}
            onEditar={editar}
            onEliminar={(desembarque) => pedirEliminacion([desembarque])}
          />
        ) : (
          <ul className="pc-galeria">
            {visibles.map((desembarque, indice) => (
              <li key={desembarque.id}>
                <TarjetaDesembarque
                  desembarque={desembarque}
                  indice={indice}
                  onAbrir={() => abrirDetalle(desembarque)}
                  seleccionable
                  seleccionada={seleccion.has(desembarque.id)}
                  onSeleccionar={() => alternarSeleccion(desembarque.id)}
                />
              </li>
            ))}
          </ul>
        )}
      </>
    )
  }

  return (
    <section className="pc-lista" aria-labelledby="titulo-lista">
      <header className="pc-cabecera-pagina">
        <div>
          <h2 id="titulo-lista" className="pc-titulo-pagina">
            Desembarques
          </h2>
          <p className="pc-bajada">
            {cargando || error
              ? 'Operaciones de descarga registradas en los puertos.'
              : `${plural(desembarques.length, 'desembarque', 'desembarques')} · ${formatearToneladas(toneladasTotales)} en total.`}
          </p>
        </div>
        <div className="pc-cabecera-acciones">
          <Link to="/registro" className="btn btn-primary d-inline-flex align-items-center gap-2">
            <i className="bi bi-plus-lg" aria-hidden="true" />
            Registrar desembarque
          </Link>
        </div>
      </header>

      {contenido()}

      {seleccionados.length > 0 && (
        <div className="pc-barra-lote" role="region" aria-label="Acciones de la selección">
          <span className="pc-barra-lote-cuenta">
            <strong>{seleccionados.length}</strong>{' '}
            {seleccionados.length === 1 ? 'seleccionado' : 'seleccionados'}
          </span>
          <button
            type="button"
            className="btn btn-sm pc-barra-lote-secundario"
            onClick={() => seleccionarTodos(false)}
          >
            Quitar selección
          </button>
          <button
            type="button"
            className="btn btn-sm btn-danger d-inline-flex align-items-center gap-2"
            onClick={() => pedirEliminacion(seleccionados)}
          >
            <i className="bi bi-trash3" aria-hidden="true" />
            Eliminar
          </button>
        </div>
      )}

      <Drawer
        abierto={Boolean(detalle)}
        onCerrar={cerrarDetalle}
        titulo={detalle?.embarcacion ?? 'Detalle del desembarque'}
        pie={
          detalle && (
            <>
              <button
                type="button"
                className="btn btn-outline-danger d-inline-flex align-items-center gap-2"
                onClick={() => pedirEliminacion([detalle])}
              >
                <i className="bi bi-trash3" aria-hidden="true" />
                Eliminar
              </button>
              <Link
                to={`/registro/${detalle.id}`}
                className="btn btn-primary d-inline-flex align-items-center justify-content-center gap-2 flex-grow-1"
              >
                <i className="bi bi-pencil" aria-hidden="true" />
                Editar desembarque
              </Link>
            </>
          )
        }
      >
        {detalle && <DetalleDesembarque desembarque={detalle} />}
      </Drawer>

      <ConfirmModal
        abierto={eliminacion.abierta}
        titulo={
          eliminacion.desembarques.length > 1
            ? `Eliminar ${eliminacion.desembarques.length} desembarques`
            : 'Eliminar desembarque'
        }
        textoConfirmar={eliminacion.desembarques.length > 1 ? 'Eliminar todos' : 'Eliminar'}
        iconoConfirmar="bi-trash3"
        varianteConfirmar="danger"
        textoCargando="Eliminando..."
        cargando={eliminando}
        onConfirm={confirmarEliminacion}
        onCancel={() => setEliminacion((actual) => ({ ...actual, abierta: false }))}
      >
        <p className="mb-3">
          {eliminacion.desembarques.length > 1
            ? '¿Seguro que deseas eliminar estos desembarques?'
            : '¿Seguro que deseas eliminar este desembarque?'}
        </p>
        <ul className="pc-lista-eliminar">
          {eliminacion.desembarques.map((desembarque) => (
            <li key={desembarque.id}>
              <InsigniaEspecie especie={desembarque.especie} forma="ficha" />
              <span className="min-w-0 flex-grow-1">
                <strong className="d-block text-truncate">{desembarque.embarcacion}</strong>
                <span className="pc-codigo">{desembarque.codigo}</span>
                <span className="pc-lista-eliminar-meta">
                  {' · '}
                  {desembarque.puerto} · {formatearFechaCorta(desembarque.fechaDesembarque)}
                </span>
              </span>
              <span className="pc-cifra-dato text-nowrap">
                {formatearToneladas(desembarque.toneladas)}
              </span>
            </li>
          ))}
        </ul>
        <p className="small text-body-secondary mb-0 mt-3">
          <i className="bi bi-exclamation-circle me-1" aria-hidden="true" />
          Esta acción no se puede deshacer.
        </p>
      </ConfirmModal>
    </section>
  )
}

/** Propiedades de `FiltroActivo`. */
interface PropsFiltroActivo {
  texto: string
  onQuitar: () => void
}

function FiltroActivo({ texto, onQuitar }: PropsFiltroActivo) {
  return (
    <li>
      <button type="button" className="pc-filtro-activo" onClick={onQuitar}>
        {texto}
        <i className="bi bi-x" aria-hidden="true" />
        <span className="visually-hidden">(quitar filtro)</span>
      </button>
    </li>
  )
}

export default Lista
