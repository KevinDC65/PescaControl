import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useLocation, useNavigate, type NavigateOptions, type To } from 'react-router-dom'
import ConfirmModal from '../components/ConfirmModal.tsx'
import type { Guardia, ModoGuardia, Panel, ValorShellContext } from '../types/contextos.ts'
import { ShellContext } from './contextos.ts'

/** Textos del modal de confirmación según el modo de la guardia. */
interface TextosGuardia {
  mensaje: string
  confirmar: string
  variante: string
}

const TEXTOS_GUARDIA: Record<ModoGuardia, TextosGuardia> = {
  edicion: {
    mensaje: 'Si sales ahora, se perderán los cambios que hiciste en este desembarque.',
    confirmar: 'Descartar y salir',
    variante: 'danger',
  },
  nuevo: {
    mensaje:
      'El desembarque aún no está registrado. Tu borrador queda guardado en este navegador y podrás retomarlo al volver a Registrar desembarque.',
    confirmar: 'Salir y conservar borrador',
    variante: 'primary',
  },
}

/** Navegación que espera la confirmación del usuario. */
interface NavegacionPendiente {
  abierto: boolean
  modo: ModoGuardia
  destino?: To
  opciones?: NavigateOptions
}

/** Devuelve la ruta interna de un enlace, o null si sale de la app o abre otra pestaña. */
function rutaInterna(enlace: HTMLAnchorElement | null): string | null {
  if (!enlace || enlace.target === '_blank' || enlace.hasAttribute('download')) return null
  const url = new URL(enlace.href, window.location.href)
  if (url.origin !== window.location.origin) return null
  return `${url.pathname}${url.search}${url.hash}`
}

/** Propiedades de `ShellProvider`. */
interface PropsShellProvider {
  children?: ReactNode
}

/**
 * Estado del "shell" de la aplicación: qué panel global está abierto (paleta de comandos,
 * ayuda de atajos, inicio de sesión o menú móvil) y la navegación protegida.
 *
 * Navegación protegida: Registro registra una guardia mientras hay cambios sin guardar.
 * Entonces los clics en enlaces internos y `navegarSeguro()` (paleta y atajos) piden
 * confirmación antes de salir, y al recargar o cerrar la pestaña el navegador avisa.
 * BrowserRouter no admite `useBlocker`, por eso se intercepta aquí.
 */
export function ShellProvider({ children }: PropsShellProvider) {
  const navigate = useNavigate()
  const { pathname, search } = useLocation()
  const [panel, setPanel] = useState<Panel | null>(null)
  const [pendiente, setPendiente] = useState<NavegacionPendiente>({
    abierto: false,
    modo: 'edicion',
  })
  const guardiaRef = useRef<Guardia | null>(null)
  const rutaActualRef = useRef(`${pathname}${search}`)

  useEffect(() => {
    rutaActualRef.current = `${pathname}${search}`
  }, [pathname, search])

  const abrir = useCallback((nombre: Panel) => setPanel(nombre), [])
  const cerrar = useCallback(() => setPanel(null), [])
  const alternar = useCallback(
    (nombre: Panel) => setPanel((actual) => (actual === nombre ? null : nombre)),
    [],
  )

  const registrarGuardia = useCallback((guardia: Guardia) => {
    guardiaRef.current = guardia
    return () => {
      if (guardiaRef.current === guardia) guardiaRef.current = null
    }
  }, [])

  const navegarSeguro = useCallback(
    (destino: To, opciones?: NavigateOptions) => {
      if (guardiaRef.current && destino !== rutaActualRef.current) {
        setPendiente({ abierto: true, destino, opciones, modo: guardiaRef.current.modo })
        return
      }
      navigate(destino, opciones)
    },
    [navigate],
  )

  // Intercepta los clics en enlaces internos (Link y NavLink) mientras hay una guardia.
  useEffect(() => {
    function manejarClic(evento: MouseEvent) {
      if (!guardiaRef.current || evento.defaultPrevented || evento.button !== 0) return
      if (evento.metaKey || evento.ctrlKey || evento.shiftKey || evento.altKey) return
      const enlace =
        evento.target instanceof Element
          ? evento.target.closest<HTMLAnchorElement>('a[href]')
          : null
      const destino = rutaInterna(enlace)
      if (!destino || destino === rutaActualRef.current) return
      evento.preventDefault()
      evento.stopPropagation()
      setPendiente({ abierto: true, destino, modo: guardiaRef.current.modo })
    }
    document.addEventListener('click', manejarClic, true)
    return () => document.removeEventListener('click', manejarClic, true)
  }, [])

  function confirmarSalida() {
    const { destino, opciones } = pendiente
    guardiaRef.current?.alSalir?.()
    guardiaRef.current = null
    setPendiente((actual) => ({ ...actual, abierto: false }))
    setPanel(null)
    // El modal solo se abre con un destino, así que siempre lo hay al confirmar.
    if (destino !== undefined) navigate(destino, opciones)
  }

  const valor = useMemo<ValorShellContext>(
    () => ({ panel, abrir, cerrar, alternar, registrarGuardia, navegarSeguro }),
    [panel, abrir, cerrar, alternar, registrarGuardia, navegarSeguro],
  )

  const textos = TEXTOS_GUARDIA[pendiente.modo] ?? TEXTOS_GUARDIA.edicion

  return (
    <ShellContext.Provider value={valor}>
      {children}
      <ConfirmModal
        abierto={pendiente.abierto}
        titulo="Tienes cambios sin guardar"
        textoConfirmar={textos.confirmar}
        varianteConfirmar={textos.variante}
        textoCancelar="Seguir editando"
        onConfirm={confirmarSalida}
        onCancel={() => setPendiente((actual) => ({ ...actual, abierto: false }))}
      >
        <p className="mb-0">{textos.mensaje}</p>
      </ConfirmModal>
    </ShellContext.Provider>
  )
}
