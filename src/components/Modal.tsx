import {
  useEffect,
  useId,
  useRef,
  useState,
  type MouseEvent,
  type ReactNode,
  type RefObject,
} from 'react'
import { createPortal } from 'react-dom'
import { useCapaModal } from '../hooks/useCapaModal.ts'

// Duración de la animación de salida definida en styles/capas.css (pc-salida-modal).
const DURACION_SALIDA = 160

/** Tamaño opcional del diálogo de Bootstrap (`modal-sm`, `modal-lg`, `modal-xl`). */
export type TamanoModal = 'sm' | 'lg' | 'xl'

/** Propiedades de `Modal`. */
interface PropsModal {
  abierto: boolean
  onCerrar: () => void
  titulo: ReactNode
  descripcion?: ReactNode
  children?: ReactNode
  /** Botones del pie del modal. */
  pie?: ReactNode
  tamano?: TamanoModal
  /** Impide cerrar con Esc, el botón o el fondo (ej. mientras se procesa). */
  bloquearCierre?: boolean
  /** Elemento a enfocar al abrir. */
  enfoqueInicialRef?: RefObject<HTMLElement | null>
}

/**
 * Base de los modales de la app. Se abre y cierra con estado de React (prop `abierto`),
 * sin el JavaScript de Bootstrap. Cierra con Esc, botón o clic en el fondo; mantiene
 * el foco dentro mientras está abierto y lo devuelve al elemento que lo abrió.
 * Se dibuja con un portal en <body> para que ningún contenedor lo recorte.
 */
function Modal({
  abierto,
  onCerrar,
  titulo,
  descripcion,
  children,
  pie,
  tamano,
  bloquearCierre = false,
  enfoqueInicialRef,
}: PropsModal) {
  const [montado, setMontado] = useState(abierto)
  const contenidoRef = useRef<HTMLDivElement>(null)
  const pulsadoFueraRef = useRef(false)
  const idTitulo = useId()

  // Al abrir se monta de inmediato; al cerrar se espera a que termine la animación de salida.
  if (abierto && !montado) setMontado(true)
  const saliendo = montado && !abierto

  useEffect(() => {
    if (!saliendo) return undefined
    const temporizador = setTimeout(() => setMontado(false), DURACION_SALIDA)
    return () => clearTimeout(temporizador)
  }, [saliendo])

  useCapaModal(abierto, contenidoRef, {
    onEscape: onCerrar,
    enfoqueInicialRef,
    bloquearEscape: bloquearCierre,
  })

  if (!montado) return null

  /** Indica si el evento ocurrió fuera del contenido del modal (en el fondo). */
  const ocurrioFuera = (evento: MouseEvent<HTMLDivElement>) =>
    !(evento.target instanceof Node && contenidoRef.current?.contains(evento.target))

  function manejarPulsacion(evento: MouseEvent<HTMLDivElement>) {
    pulsadoFueraRef.current = ocurrioFuera(evento)
  }

  function manejarClicFondo(evento: MouseEvent<HTMLDivElement>) {
    const fuera = ocurrioFuera(evento)
    if (fuera && pulsadoFueraRef.current && !bloquearCierre && !saliendo) onCerrar()
    pulsadoFueraRef.current = false
  }

  return createPortal(
    <>
      <div className="modal-backdrop show pc-modal-fondo" data-saliendo={saliendo} />
      <div
        className="modal d-block pc-modal"
        data-saliendo={saliendo}
        role="dialog"
        aria-modal="true"
        aria-labelledby={idTitulo}
        onMouseDown={manejarPulsacion}
        onClick={manejarClicFondo}
      >
        <div className={`modal-dialog modal-dialog-centered ${tamano ? `modal-${tamano}` : ''}`}>
          <div className="modal-content" ref={contenidoRef}>
            <div className="modal-header">
              <div className="min-w-0">
                <h2 className="modal-title" id={idTitulo}>
                  {titulo}
                </h2>
                {descripcion && <p className="pc-modal-descripcion mb-0">{descripcion}</p>}
              </div>
              <button
                type="button"
                className="btn-close"
                aria-label="Cerrar"
                onClick={onCerrar}
                disabled={bloquearCierre}
              />
            </div>
            <div className="modal-body">{children}</div>
            {pie && <div className="modal-footer">{pie}</div>}
          </div>
        </div>
      </div>
    </>,
    document.body,
  )
}

export default Modal
