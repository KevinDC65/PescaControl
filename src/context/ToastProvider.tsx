import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import AlertMessage from '../components/AlertMessage.tsx'
import type {
  OpcionesToast,
  TipoToast,
  Toast as DatosToast,
  ValorToastContext,
} from '../types/contextos.ts'
import { ToastContext } from './contextos.ts'

// Duración en pantalla según el tipo. Los errores se quedan más tiempo para poder leerlos.
const DURACIONES: Record<TipoToast, number> = {
  success: 5000,
  info: 5000,
  warning: 8000,
  danger: 9000,
}
const DURACION_SALIDA = 200
const MAXIMO_VISIBLES = 4

let siguienteId = 1

/** Propiedades de `ToastProvider`. */
interface PropsToastProvider {
  children?: ReactNode
}

/**
 * Proveedor de notificaciones emergentes (toasts). Las apila abajo a la derecha (arriba de
 * la barra inferior en móvil), las cierra solas y pausa el tiempo al pasar el puntero, al
 * enfocarlas o si la pestaña queda oculta. Cada toast se dibuja con <AlertMessage />.
 */
export function ToastProvider({ children }: PropsToastProvider) {
  const [toasts, setToasts] = useState<DatosToast[]>([])

  const cerrar = useCallback((id: number) => {
    setToasts((lista) =>
      lista.map((toast) => (toast.id === id ? { ...toast, saliendo: true } : toast)),
    )
    setTimeout(
      () => setToasts((lista) => lista.filter((toast) => toast.id !== id)),
      DURACION_SALIDA,
    )
  }, [])

  const mostrar = useCallback(
    (tipo: TipoToast, mensaje: ReactNode, opciones: OpcionesToast = {}) => {
      const id = siguienteId++
      const toast: DatosToast = {
        id,
        tipo,
        mensaje,
        accion: opciones.accion ?? null,
        duracion: opciones.duracion ?? DURACIONES[tipo] ?? 5000,
        saliendo: false,
      }
      setToasts((lista) => [...lista, toast].slice(-MAXIMO_VISIBLES))
      return id
    },
    [],
  )

  const valor = useMemo<ValorToastContext>(
    () => ({
      mostrar,
      cerrar,
      exito: (mensaje, opciones) => mostrar('success', mensaje, opciones),
      error: (mensaje, opciones) => mostrar('danger', mensaje, opciones),
      aviso: (mensaje, opciones) => mostrar('warning', mensaje, opciones),
      info: (mensaje, opciones) => mostrar('info', mensaje, opciones),
    }),
    [mostrar, cerrar],
  )

  return (
    <ToastContext.Provider value={valor}>
      {children}
      {createPortal(
        <section className="pc-toasts" aria-label="Notificaciones" aria-live="polite">
          <ol className="list-unstyled m-0">
            {toasts.map((toast) => (
              <Toast key={toast.id} toast={toast} onCerrar={() => cerrar(toast.id)} />
            ))}
          </ol>
        </section>,
        document.body,
      )}
    </ToastContext.Provider>
  )
}

/** Propiedades de un toast en pantalla. */
interface PropsToast {
  toast: DatosToast
  onCerrar: () => void
}

function Toast({ toast, onCerrar }: PropsToast) {
  const [pausado, setPausado] = useState(false)
  const restanteRef = useRef(toast.duracion)
  const onCerrarRef = useRef(onCerrar)
  const { accion } = toast

  useEffect(() => {
    onCerrarRef.current = onCerrar
  })

  // Cuenta regresiva que se detiene mientras está pausado o la pestaña está oculta.
  useEffect(() => {
    if (pausado || toast.saliendo) return undefined
    let inicio = Date.now()
    let temporizador: ReturnType<typeof setTimeout> | undefined

    const arrancar = () => {
      inicio = Date.now()
      temporizador = setTimeout(() => onCerrarRef.current(), restanteRef.current)
    }
    const detener = () => {
      clearTimeout(temporizador)
      restanteRef.current = Math.max(800, restanteRef.current - (Date.now() - inicio))
    }
    const manejarVisibilidad = () => (document.hidden ? detener() : arrancar())

    if (!document.hidden) arrancar()
    document.addEventListener('visibilitychange', manejarVisibilidad)
    return () => {
      document.removeEventListener('visibilitychange', manejarVisibilidad)
      detener()
    }
  }, [pausado, toast.saliendo])

  return (
    <li
      className="pc-toast"
      data-saliendo={toast.saliendo}
      role={toast.tipo === 'danger' ? 'alert' : undefined}
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
      onFocus={() => setPausado(true)}
      onBlur={() => setPausado(false)}
    >
      <div className="pc-toast-interior">
        <AlertMessage
          tipo={toast.tipo}
          mensaje={toast.mensaje}
          onClose={onCerrar}
          anunciar={false}
          className="mb-0"
        >
          {accion && (
            <button
              type="button"
              className="btn btn-link alert-link p-0 ms-2 align-baseline"
              onClick={() => {
                accion.onClick()
                onCerrar()
              }}
            >
              {accion.texto}
            </button>
          )}
        </AlertMessage>
      </div>
    </li>
  )
}
