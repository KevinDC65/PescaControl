import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { createPortal } from 'react-dom'
import { useAppContext } from '../context/AppContext.tsx'
import { useCapaModal } from '../hooks/useCapaModal.ts'
import { useCerrarSesion } from '../hooks/useCerrarSesion.ts'
import { useShell } from '../hooks/useShell.ts'
import { getAll } from '../services/apiService.ts'
import type { Desembarque } from '../types/desembarque.ts'
import { mensajeDeError } from '../utils/errores.ts'
import { formatearFechaCorta, formatearToneladas } from '../utils/formato.ts'
import { normalizarTexto } from '../utils/operaciones.ts'
import { RUTA_PANEL } from '../utils/sesion.ts'
import InsigniaEspecie from './InsigniaEspecie.tsx'
import { Tecla } from './Tecla.tsx'

const MAXIMO_DESEMBARQUES = 8

/** Comando de la paleta: navegar o ejecutar una acción. */
interface Comando {
  id: string
  grupo: string
  texto: string
  /** Clase de Bootstrap Icons. */
  icono: string
  /** Teclas del atajo separadas por espacios (ej. "G I"). */
  atajo?: string
  /** Palabras extra con las que también se encuentra. */
  claves: string
  /** `editar` indica Ctrl/⌘ (o Mayús con Enter) pulsado; los comandos lo ignoran. */
  ejecutar: (editar: boolean) => void
  desembarque?: undefined
}

/** Desembarque encontrado: abre su detalle o, con `editar`, su edición. */
interface OpcionDesembarque {
  id: string
  grupo: string
  texto: string
  desembarque: Desembarque
  ejecutar: (editar: boolean) => void
}

/** Opción de la lista de resultados. */
type OpcionPaleta = Comando | OpcionDesembarque

/** Opciones consecutivas del mismo grupo, con su posición en la lista completa. */
interface GrupoPaleta {
  nombre: string
  items: { opcion: OpcionPaleta; indice: number }[]
}

/**
 * Paleta de comandos (Ctrl+K / ⌘K): navegar, ejecutar acciones y buscar desembarques por
 * embarcación, código o matrícula. Accesible como combobox: el foco queda en el campo y las flechas mueven la
 * opción activa (aria-activedescendant). Sin animación de apertura: se usa muchas veces
 * al día y debe sentirse instantánea.
 */
function PaletaComandos() {
  const { panel, cerrar } = useShell()
  const abierta = panel === 'paleta'
  return abierta ? <PanelPaleta onCerrar={cerrar} /> : null
}

/** Propiedades de `PanelPaleta`. */
interface PropsPanelPaleta {
  onCerrar: () => void
}

function PanelPaleta({ onCerrar }: PropsPanelPaleta) {
  const { usuario, esJefe, tema, alternarTema } = useAppContext()
  const { salir } = useCerrarSesion()
  const { abrir, navegarSeguro } = useShell()
  const [consulta, setConsulta] = useState('')
  const [activo, setActivo] = useState(0)
  const [desembarques, setDesembarques] = useState<Desembarque[] | null>(null)
  const [errorDesembarques, setErrorDesembarques] = useState('')
  const contenedorRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listaRef = useRef<HTMLUListElement>(null)
  const id = useId()

  useCapaModal(true, contenedorRef, { onEscape: onCerrar, enfoqueInicialRef: inputRef })

  useEffect(() => {
    let vigente = true
    getAll()
      .then((datos) => {
        if (vigente) setDesembarques(datos)
      })
      .catch((error) => {
        if (vigente) setErrorDesembarques(mensajeDeError(error))
      })
    return () => {
      vigente = false
    }
  }, [])

  const comandos = useMemo<Comando[]>(() => {
    const ir = (ruta: string) => () => {
      onCerrar()
      navegarSeguro(ruta)
    }
    return [
      {
        id: 'inicio',
        grupo: 'Ir a',
        texto: 'Panel de operaciones',
        icono: 'bi-house',
        atajo: 'G I',
        claves: 'inicio resumen dashboard',
        ejecutar: ir(RUTA_PANEL),
      },
      {
        id: 'lista',
        grupo: 'Ir a',
        texto: 'Desembarques',
        icono: 'bi-list-columns-reverse',
        atajo: 'G L',
        claves: 'lista tabla tarjetas operaciones',
        ejecutar: ir('/lista'),
      },
      {
        id: 'atencion',
        grupo: 'Ir a',
        texto: 'Desembarques que requieren atención',
        icono: 'bi-exclamation-diamond',
        claves: 'observados en descarga pendientes alerta',
        ejecutar: ir('/lista?atencion=1'),
      },
      ...(esJefe
        ? [
            {
              id: 'usuarios',
              grupo: 'Ir a',
              texto: 'Usuarios y roles',
              icono: 'bi-people',
              atajo: 'G U',
              claves: 'cuentas operadores jefes permisos gestionar',
              ejecutar: ir('/usuarios'),
            },
          ]
        : []),
      {
        id: 'registrar',
        grupo: 'Acciones',
        texto: 'Registrar desembarque',
        icono: 'bi-plus-lg',
        atajo: 'N',
        claves: 'nuevo agregar crear registro captura',
        ejecutar: ir('/registro'),
      },
      {
        id: 'tema',
        grupo: 'Acciones',
        texto: tema === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro',
        icono: tema === 'dark' ? 'bi-sun' : 'bi-moon-stars',
        claves: 'tema oscuro claro modo apariencia',
        ejecutar: () => alternarTema(),
      },
      {
        id: 'sesion',
        grupo: 'Acciones',
        texto: usuario ? `Cerrar sesión de ${usuario.nombre}` : 'Cerrar sesión',
        icono: 'bi-box-arrow-right',
        claves: 'salir logout usuario cuenta',
        ejecutar: () => {
          onCerrar()
          void salir()
        },
      },
      {
        id: 'atajos',
        grupo: 'Acciones',
        texto: 'Ver atajos de teclado',
        icono: 'bi-keyboard',
        atajo: '?',
        claves: 'ayuda teclas',
        ejecutar: () => abrir('ayuda'),
      },
    ]
  }, [tema, usuario, esJefe, alternarTema, salir, abrir, onCerrar, navegarSeguro])

  const termino = normalizarTexto(consulta.trim())

  const opciones = useMemo<OpcionPaleta[]>(() => {
    const coincide = (comando: Comando) =>
      !termino || normalizarTexto(`${comando.texto} ${comando.claves}`).includes(termino)
    const visibles = comandos.filter(coincide)
    const encontrados = termino
      ? (desembarques ?? [])
          .filter((desembarque) =>
            [desembarque.embarcacion, desembarque.codigo, desembarque.matricula].some((campo) =>
              normalizarTexto(campo).includes(termino),
            ),
          )
          .slice(0, MAXIMO_DESEMBARQUES)
          .map((desembarque): OpcionDesembarque => ({
            id: `desembarque-${desembarque.id}`,
            grupo: 'Desembarques',
            desembarque,
            texto: desembarque.embarcacion,
            ejecutar: (editar) => {
              onCerrar()
              navegarSeguro(
                editar ? `/registro/${desembarque.id}` : `/lista?desembarque=${desembarque.id}`,
              )
            },
          }))
      : []
    return termino ? [...encontrados, ...visibles] : visibles
  }, [comandos, desembarques, termino, onCerrar, navegarSeguro])

  const indiceActivo = opciones.length === 0 ? -1 : Math.min(activo, opciones.length - 1)

  useEffect(() => {
    if (indiceActivo < 0) return
    listaRef.current
      ?.querySelector(`[data-indice="${indiceActivo}"]`)
      ?.scrollIntoView({ block: 'nearest' })
  }, [indiceActivo])

  function manejarTecla(evento: KeyboardEvent<HTMLInputElement>) {
    if (evento.key === 'ArrowDown' || evento.key === 'ArrowUp') {
      evento.preventDefault()
      if (opciones.length === 0) return
      const paso = evento.key === 'ArrowDown' ? 1 : -1
      setActivo((indiceActivo + paso + opciones.length) % opciones.length)
    } else if (evento.key === 'Home' && opciones.length) {
      evento.preventDefault()
      setActivo(0)
    } else if (evento.key === 'End' && opciones.length) {
      evento.preventDefault()
      setActivo(opciones.length - 1)
    } else if (evento.key === 'Enter') {
      evento.preventDefault()
      const opcion = opciones[indiceActivo]
      if (opcion) opcion.ejecutar(evento.ctrlKey || evento.metaKey || evento.shiftKey)
    }
  }

  const grupos: GrupoPaleta[] = []
  opciones.forEach((opcion, indice) => {
    const ultimo = grupos[grupos.length - 1]
    if (ultimo?.nombre === opcion.grupo) ultimo.items.push({ opcion, indice })
    else grupos.push({ nombre: opcion.grupo, items: [{ opcion, indice }] })
  })

  const idOpcion = (indice: number) => `${id}-opcion-${indice}`
  const buscandoDesembarques = termino && desembarques === null && !errorDesembarques

  return createPortal(
    <div
      className="pc-paleta-capa"
      onMouseDown={(evento) => evento.target === evento.currentTarget && onCerrar()}
    >
      <div
        ref={contenedorRef}
        className="pc-paleta"
        role="dialog"
        aria-modal="true"
        aria-label="Paleta de comandos"
      >
        <div className="pc-paleta-campo">
          <i className="bi bi-search" aria-hidden="true" />
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-expanded="true"
            aria-controls={`${id}-lista`}
            aria-autocomplete="list"
            aria-activedescendant={indiceActivo >= 0 ? idOpcion(indiceActivo) : undefined}
            aria-label="Buscar desembarques por embarcación, código o matrícula, o escribir un comando"
            placeholder="Busca «Don Lucho», DSB-014, CE-21345-CM o un comando…"
            value={consulta}
            onChange={(evento) => {
              setConsulta(evento.target.value)
              setActivo(0)
            }}
            onKeyDown={manejarTecla}
            autoComplete="off"
            spellCheck={false}
          />
          <Tecla className="pc-paleta-esc">Esc</Tecla>
        </div>

        <ul
          ref={listaRef}
          id={`${id}-lista`}
          role="listbox"
          aria-label="Resultados"
          className="pc-paleta-lista"
        >
          {grupos.map((grupo) => (
            <li key={grupo.nombre} role="presentation">
              <p className="pc-paleta-grupo" aria-hidden="true">
                {grupo.nombre}
              </p>
              <ul role="group" aria-label={grupo.nombre}>
                {grupo.items.map(({ opcion, indice }) => (
                  <li
                    key={opcion.id}
                    id={idOpcion(indice)}
                    role="option"
                    aria-selected={indice === indiceActivo}
                    data-indice={indice}
                    className="pc-paleta-opcion"
                    onMouseMove={() => indice !== indiceActivo && setActivo(indice)}
                    onClick={(evento) => opcion.ejecutar(evento.ctrlKey || evento.metaKey)}
                  >
                    {opcion.desembarque ? (
                      <>
                        <InsigniaEspecie especie={opcion.desembarque.especie} forma="ficha" />
                        <span className="pc-paleta-texto">
                          <span className="text-truncate">{opcion.desembarque.embarcacion}</span>
                          <span className="pc-codigo">{opcion.desembarque.codigo}</span>
                          <span className="pc-matricula d-none d-sm-inline">
                            {opcion.desembarque.matricula}
                          </span>
                        </span>
                        <span className="pc-paleta-meta">
                          {formatearToneladas(opcion.desembarque.toneladas)} ·{' '}
                          {formatearFechaCorta(opcion.desembarque.fechaDesembarque)}
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="pc-paleta-icono">
                          <i className={`bi ${opcion.icono}`} aria-hidden="true" />
                        </span>
                        <span className="pc-paleta-texto">{opcion.texto}</span>
                        {opcion.atajo && (
                          <span className="pc-paleta-atajo" aria-hidden="true">
                            {opcion.atajo.split(' ').map((tecla) => (
                              <Tecla key={tecla}>{tecla}</Tecla>
                            ))}
                          </span>
                        )}
                      </>
                    )}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>

        <div className="pc-paleta-estado" role="status">
          {buscandoDesembarques && 'Buscando desembarques…'}
          {termino &&
            errorDesembarques &&
            `No se pudieron buscar desembarques: ${errorDesembarques}`}
          {termino && desembarques !== null && opciones.length === 0 && (
            <>Ningún desembarque ni comando coincide con «{consulta.trim()}».</>
          )}
        </div>

        <div className="pc-paleta-pie" aria-hidden="true">
          <span>
            <Tecla>↑</Tecla>
            <Tecla>↓</Tecla> moverse
          </span>
          <span>
            <Tecla>Enter</Tecla> abrir
          </span>
          <span>
            <Tecla mod>Enter</Tecla> editar desembarque
          </span>
        </div>
      </div>
    </div>,
    document.body,
  )
}

export default PaletaComandos
