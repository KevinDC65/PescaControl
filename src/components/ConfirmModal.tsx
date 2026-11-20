import { useRef, type ReactNode } from 'react'
import Modal, { type TamanoModal } from './Modal.tsx'

/*
 * Modal reutilizable de confirmación. Ejemplo de uso:
 *
 *   <ConfirmModal
 *     abierto={modalAbierto}
 *     titulo="Eliminar desembarque"
 *     textoConfirmar="Eliminar"
 *     varianteConfirmar="danger"
 *     cargando={eliminando}
 *     onConfirm={confirmarEliminacion}
 *     onCancel={() => setModalAbierto(false)}
 *   >
 *     ¿Seguro que deseas eliminar este desembarque?
 *   </ConfirmModal>
 *
 * Sin `onConfirm` solo muestra el botón de cancelar (útil para modales informativos).
 */

/** Propiedades de `ConfirmModal`. */
interface PropsConfirmModal {
  abierto: boolean
  titulo: ReactNode
  descripcion?: ReactNode
  children?: ReactNode
  textoConfirmar?: string
  /** Clase de Bootstrap Icons del botón de confirmar (ej. "bi-trash3"). */
  iconoConfirmar?: string
  /** Variante de botón de Bootstrap (ej. "primary", "danger"). */
  varianteConfirmar?: string
  textoCancelar?: string
  textoCargando?: string
  /** Deshabilita los botones, muestra un spinner y bloquea el cierre. */
  cargando?: boolean
  tamano?: TamanoModal
  onConfirm?: () => void
  onCancel: () => void
}

function ConfirmModal({
  abierto,
  titulo,
  descripcion,
  children,
  textoConfirmar = 'Confirmar',
  iconoConfirmar,
  varianteConfirmar = 'primary',
  textoCancelar = 'Cancelar',
  textoCargando = 'Procesando...',
  cargando = false,
  tamano,
  onConfirm,
  onCancel,
}: PropsConfirmModal) {
  // El foco inicial va a "Cancelar": es la opción segura si se pulsa Enter sin pensar.
  const cancelarRef = useRef<HTMLButtonElement>(null)

  const pie = (
    <>
      <button
        ref={cancelarRef}
        type="button"
        className="btn btn-outline-secondary"
        onClick={onCancel}
        disabled={cargando}
      >
        {textoCancelar}
      </button>
      {onConfirm && (
        <button
          type="button"
          className={`btn btn-${varianteConfirmar} d-inline-flex align-items-center gap-2`}
          onClick={onConfirm}
          disabled={cargando}
        >
          {cargando ? (
            <span className="spinner-border spinner-border-sm" aria-hidden="true" />
          ) : (
            iconoConfirmar && <i className={`bi ${iconoConfirmar}`} aria-hidden="true" />
          )}
          {cargando ? textoCargando : textoConfirmar}
        </button>
      )}
    </>
  )

  return (
    <Modal
      abierto={abierto}
      onCerrar={onCancel}
      titulo={titulo}
      descripcion={descripcion}
      pie={pie}
      tamano={tamano}
      bloquearCierre={cargando}
      enfoqueInicialRef={cancelarRef}
    >
      {children}
    </Modal>
  )
}

export default ConfirmModal
