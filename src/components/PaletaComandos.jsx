import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useAppContext } from '../context/AppContext.jsx'
import { useCapaModal } from '../hooks/useCapaModal.js'
import { useShell } from '../hooks/useShell.js'
import { getAll } from '../services/apiService.js'
import { formatearFechaCorta, formatearToneladas } from '../utils/formato.js'
import { normalizarTexto } from '../utils/operaciones.js'
import InsigniaEspecie from './InsigniaEspecie.jsx'
import { Tecla } from './Tecla.jsx'

const MAXIMO_DESEMBARQUES = 8

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

function PanelPaleta({ onCerrar }) {
  const { usuario, logout, tema, alternarTema } = useAppContext()
  const { abrir, navegarSeguro } = useShell()
  const [consulta, setConsulta] = useState('')
  const [activo, setActivo] = useState(0)
  const [desembarques, setDesembarques] = useState(null)
  const [errorDesembarques, setErrorDesembarques] = useState('')
  const contenedorRef = useRef(null)
  const inputRef = useRef(null)
  const listaRef = useRef(null)
  const id = useId()

  useCapaModal(true, contenedorRef, { onEscape: onCerrar, enfoqueInicialRef: inputRef })

  useEffect(() => {
    let vigente = true
    getAll()
      .then((datos) => {
        if (vigente) setDesembarques(datos)
      })
      .catch((error) => {
        if (vigente) setErrorDesembarques(error.message)
      })
    return () => {
      vigente = false
    }
  }, [])

  const comandos = useMemo(() => {
    const ir = (ruta) => () => {
      onCerrar()
      navegarSeguro(ruta)
    }
    return [
      {
        id: 'inicio',
        grupo: 'Ir a',
        texto: 'Inicio',
        icono: 'bi-house',
        atajo: 'G I',
        claves: 'panel resumen dashboard',
        ejecutar: ir('/'),
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
      usuario
        ? {
            id: 'sesion',
            grupo: 'Acciones',
            texto: `Cerrar sesión de ${usuario.nombre}`,
            icono: 'bi-box-arrow-right',
            claves: 'salir logout usuario',
            ejecutar: () => {
              logout()
              onCerrar()
            },
          }
        : {
            id: 'sesion',
            grupo: 'Acciones',
            texto: 'Iniciar sesión',
            icono: 'bi-person-circle',
            claves: 'ingresar login usuario',
            ejecutar: () => abrir('login'),
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
  }, [tema, usuario, alternarTema, logout, abrir, onCerrar, navegarSeguro])

  const termino = normalizarTexto(consulta.trim())

  const opciones = useMemo(() => {
    const coincide = (comando) =>
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
          .map((desembarque) => ({
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

  function manejarTecla(evento) {
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

  const grupos = []
  opciones.forEach((opcion, indice) => {
    const ultimo = grupos[grupos.length - 1]
    if (ultimo?.nombre === opcion.grupo) ultimo.items.push({ opcion, indice })
    else grupos.push({ nombre: opcion.grupo, items: [{ opcion, indice }] })
  })

  const idOpcion = (indice) => `${id}-opcion-${indice}`
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
