import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useCapaModal } from '../hooks/useCapaModal.js'

// Duración de la animación de salida definida en styles/capas.css (pc-salida-modal).
const DURACION_SALIDA = 160

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
}) {
  const [montado, setMontado] = useState(abierto)
  const contenidoRef = useRef(null)
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

  function manejarPulsacion(evento) {
    pulsadoFueraRef.current = !contenidoRef.current?.contains(evento.target)
  }

  function manejarClicFondo(evento) {
    const fuera = !contenidoRef.current?.contains(evento.target)
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
