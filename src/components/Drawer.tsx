import { useEffect, useId, useRef, useState, type ReactNode, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import { useCapaModal } from '../hooks/useCapaModal.ts'

const DURACION_SALIDA = 220

/** Propiedades de `Drawer`. */
interface PropsDrawer {
  abierto: boolean
  onCerrar: () => void
  /** Título accesible (y visible si `mostrarTitulo`). */
  titulo: ReactNode
  children?: ReactNode
  /** Acciones fijas al pie del panel. */
  pie?: ReactNode
  lado?: 'derecha' | 'abajo'
  mostrarTitulo?: boolean
  /** Elemento a enfocar al abrir; por defecto, el propio panel. */
  enfoqueInicialRef?: RefObject<HTMLElement | null>
  className?: string
}

/**
 * Panel deslizante controlado por estado de React. `lado="derecha"` (detalle de desembarque en
 * escritorio) o `lado="abajo"` (hoja inferior en móvil). Comparte con los modales la
 * trampa de foco, el cierre con Esc y el bloqueo del scroll.
 */
function Drawer({
  abierto,
  onCerrar,
  titulo,
  children,
  pie,
  lado = 'derecha',
  mostrarTitulo = true,
  enfoqueInicialRef,
  className = '',
}: PropsDrawer) {
  const [montado, setMontado] = useState(abierto)
  const panelRef = useRef<HTMLDivElement>(null)
  const idTitulo = useId()

  if (abierto && !montado) setMontado(true)
  const saliendo = montado && !abierto

  useEffect(() => {
    if (!saliendo) return undefined
    const temporizador = setTimeout(() => setMontado(false), DURACION_SALIDA)
    return () => clearTimeout(temporizador)
  }, [saliendo])

  // Sin un destino indicado, el foco va al propio panel (sin anillo visible al abrir con el ratón).
  useCapaModal(abierto, panelRef, {
    onEscape: onCerrar,
    enfoqueInicialRef: enfoqueInicialRef ?? panelRef,
  })

  if (!montado) return null

  return createPortal(
    <div className="pc-drawer-capa" data-lado={lado} data-saliendo={saliendo}>
      <div className="pc-drawer-fondo" onClick={onCerrar} aria-hidden="true" />
      <div
        ref={panelRef}
        className={`pc-drawer ${className}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={idTitulo}
        tabIndex={-1}
      >
        {lado === 'abajo' && <span className="pc-drawer-asa" aria-hidden="true" />}
        <div className={`pc-drawer-cabecera ${mostrarTitulo ? '' : 'pc-drawer-cabecera-oculta'}`}>
          <h2 id={idTitulo} className={mostrarTitulo ? 'pc-drawer-titulo' : 'visually-hidden'}>
            {titulo}
          </h2>
          <button
            type="button"
            className="btn-close"
            aria-label="Cerrar panel"
            onClick={onCerrar}
          />
        </div>
        <div className="pc-drawer-cuerpo">{children}</div>
        {pie && <div className="pc-drawer-pie">{pie}</div>}
      </div>
    </div>,
    document.body,
  )
}

export default Drawer
