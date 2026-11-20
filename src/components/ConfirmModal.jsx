import { useRef } from 'react'
import Modal from './Modal.jsx'

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
}) {
  // El foco inicial va a "Cancelar": es la opción segura si se pulsa Enter sin pensar.
  const cancelarRef = useRef(null)

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
