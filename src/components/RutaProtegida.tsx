import { useEffect, useRef, type ReactNode } from 'react'
import { Navigate, useLocation, useSearchParams } from 'react-router-dom'
import { useAppContext } from '../context/AppContext.tsx'
import { useToast } from '../hooks/useToast.ts'
import type { Rol } from '../types/usuario.ts'
import { RUTA_PANEL, rutaDeRetorno, urlIngresoConRetorno } from '../utils/sesion.ts'
import Loading from './Loading.tsx'

/** Pantalla de espera mientras se consulta la sesión al servidor. */
function EsperaSesion() {
  return (
    <div className="pc-espera-sesion">
      <Loading />
    </div>
  )
}

/** Propiedades de `RutaProtegida`. */
interface PropsRutaProtegida {
  /** Rol mínimo para entrar; sin rol basta con tener sesión. */
  rol?: Rol
  children: ReactNode
}

/**
 * Protege una ruta:
 *   - mientras se consulta la sesión muestra "Loading...";
 *   - sin sesión lleva a /ingresar?volver=<ruta actual>;
 *   - con un rol insuficiente vuelve al panel y avisa con un toast.
 */
function RutaProtegida({ rol, children }: PropsRutaProtegida) {
  const { usuario, cargandoSesion, tieneRol } = useAppContext()
  const { pathname, search } = useLocation()

  if (cargandoSesion) return <EsperaSesion />
  if (!usuario) return <Navigate to={urlIngresoConRetorno(`${pathname}${search}`)} replace />
  if (rol && !tieneRol(rol)) return <SinPermiso />
  return children
}

/** Redirige al panel avisando que el rol no alcanza. */
function SinPermiso() {
  const toast = useToast()
  const avisadoRef = useRef(false)

  useEffect(() => {
    if (avisadoRef.current) return
    avisadoRef.current = true
    toast.aviso('No tienes permiso para esa sección.')
  }, [toast])

  return <Navigate to={RUTA_PANEL} replace />
}

/** Propiedades de `SoloInvitado`. */
interface PropsSoloInvitado {
  children: ReactNode
}

/**
 * Páginas de acceso (/ingresar y /crear-cuenta): si ya hay sesión, lleva a la ruta de
 * `?volver=` o al panel. Así, tras iniciar sesión, la redirección ocurre en un solo lugar.
 */
export function SoloInvitado({ children }: PropsSoloInvitado) {
  const { usuario, cargandoSesion } = useAppContext()
  const [parametros] = useSearchParams()

  if (cargandoSesion) return <EsperaSesion />
  if (usuario) return <Navigate to={rutaDeRetorno(parametros)} replace />
  return children
}

export default RutaProtegida
