import { useEffect, useRef, type ReactNode } from 'react'

/*
 * Alerta reutilizable de Bootstrap. Ejemplo de uso:
 *
 *   const [aviso, setAviso] = useState(null)
 *   <AlertMessage
 *     tipo="success"
 *     mensaje="Desembarque registrado correctamente."
 *     onClose={() => setAviso(null)}
 *     autoCerrar={5000}
 *   />
 *
 * Props: tipo (success | danger | warning | info), mensaje, onClose (muestra el botón
 * de cerrar), autoCerrar (milisegundos, opcional) y anunciar (por defecto true: la alerta
 * se anuncia a lectores de pantalla; los toasts lo desactivan porque su contenedor ya lo
 * hace). Si no hay mensaje, no se renderiza.
 *
 * Se usa en línea para mensajes persistentes (errores de carga, validación general) y
 * dentro de los toasts para las confirmaciones breves.
 */

/** Variante de alerta de Bootstrap. */
type TipoAlerta = 'success' | 'danger' | 'warning' | 'info'

const ICONOS: Record<TipoAlerta, string> = {
  success: 'bi-check-circle-fill',
  danger: 'bi-exclamation-octagon-fill',
  warning: 'bi-exclamation-triangle-fill',
  info: 'bi-info-circle-fill',
}

/** Propiedades de `AlertMessage`. */
interface PropsAlertMessage {
  tipo?: TipoAlerta
  /** Contenido de la alerta; si está vacío, no se renderiza. */
  mensaje?: ReactNode
  /** Si se pasa, muestra el botón de cerrar. */
  onClose?: () => void
  /** Milisegundos tras los que se llama a `onClose`. */
  autoCerrar?: number
  children?: ReactNode
  className?: string
  /** Anuncia la alerta a lectores de pantalla (role="alert"). */
  anunciar?: boolean
}

function AlertMessage({
  tipo = 'info',
  mensaje,
  onClose,
  autoCerrar,
  children,
  className = '',
  anunciar = true,
}: PropsAlertMessage) {
  // Se guarda la última versión de onClose para que el temporizador no se reinicie
  // cada vez que el componente padre vuelve a renderizar.
  const onCloseRef = useRef(onClose)

  useEffect(() => {
    onCloseRef.current = onClose
  })

  useEffect(() => {
    if (!mensaje || !autoCerrar) return undefined
    const temporizador = setTimeout(() => onCloseRef.current?.(), autoCerrar)
    return () => clearTimeout(temporizador)
  }, [mensaje, autoCerrar])

  if (!mensaje) return null

  const tipoValido: TipoAlerta = ICONOS[tipo] ? tipo : 'info'
  const urgente = tipoValido === 'danger' || tipoValido === 'warning'

  return (
    <div
      className={`alert alert-${tipoValido} pc-alerta d-flex align-items-start gap-2 ${onClose ? 'alert-dismissible' : ''} ${className}`}
      role={anunciar ? 'alert' : undefined}
      aria-live={anunciar ? (urgente ? 'assertive' : 'polite') : undefined}
    >
      <i className={`bi ${ICONOS[tipoValido]} flex-shrink-0 pc-alerta-icono`} aria-hidden="true" />
      <div className="flex-grow-1 pc-alerta-texto">
        {mensaje}
        {children}
      </div>
      {onClose && (
        <button type="button" className="btn-close" aria-label="Cerrar mensaje" onClick={onClose} />
      )}
    </div>
  )
}

export default AlertMessage
