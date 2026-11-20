import {
  createContext,
  startTransition,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useLocalStorage } from '../hooks/useLocalStorage.ts'
import { useToast } from '../hooks/useToast.ts'
import * as auth from '../services/authService.ts'
import { EVENTO_SESION_EXPIRADA } from '../services/http.ts'
import type { ConfiguracionApp, Tema, ValorAppContext } from '../types/contextos.ts'
import type { CredencialesIngreso, DatosRegistro, Rol, Usuario } from '../types/usuario.ts'
import { CLAVE_USUARIO_ANTERIOR, urlIngresoConRetorno } from '../utils/sesion.ts'

const AppContext = createContext<ValorAppContext | null>(null)

const CONFIG: Readonly<ConfiguracionApp> = Object.freeze({ moneda: 'S/', unidad: 't' })

/** Tema del sistema operativo, usado solo la primera vez que se abre la app. */
function temaDelSistema(): Tema {
  try {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  } catch {
    return 'light'
  }
}

/** Borra el usuario de la sesión simulada que guardaban versiones anteriores. */
function borrarSesionAnterior() {
  try {
    window.localStorage.removeItem(CLAVE_USUARIO_ANTERIOR)
  } catch {
    // Almacenamiento bloqueado: no hay nada que limpiar.
  }
}

/** Propiedades de `AppProvider`. */
interface PropsAppProvider {
  children?: ReactNode
}

/**
 * Estado global de la aplicación: sesión del usuario, tema y configuración.
 *
 * La sesión es real: el servidor la guarda en una cookie httpOnly que el navegador envía
 * solo. Aquí se conserva únicamente el usuario público que devuelve la API (nunca el token).
 * Al montar se pregunta al servidor si hay una sesión abierta (`cargandoSesion`).
 */
export function AppProvider({ children }: PropsAppProvider) {
  const navigate = useNavigate()
  const { pathname, search } = useLocation()
  const toast = useToast()
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [cargandoSesion, setCargandoSesion] = useState(true)
  const [temaGuardado, setTema] = useLocalStorage<unknown>('pescacontrol:tema', temaDelSistema)
  const tema: Tema = temaGuardado === 'dark' ? 'dark' : 'light'

  // Referencias para leer el valor vigente dentro del escucha del evento global.
  const usuarioRef = useRef<Usuario | null>(null)
  const rutaRef = useRef(`${pathname}${search}`)

  useEffect(() => {
    usuarioRef.current = usuario
  }, [usuario])

  useEffect(() => {
    rutaRef.current = `${pathname}${search}`
  }, [pathname, search])

  useEffect(() => {
    document.documentElement.setAttribute('data-bs-theme', tema)
  }, [tema])

  // Al cargar: se limpia la sesión simulada antigua y se consulta la sesión real.
  useEffect(() => {
    let activo = true
    borrarSesionAnterior()
    auth
      .obtenerSesion()
      .then((datos) => {
        if (activo) setUsuario(datos)
      })
      .catch(() => {
        if (activo) setUsuario(null)
      })
      .finally(() => {
        if (activo) setCargandoSesion(false)
      })
    return () => {
      activo = false
    }
  }, [])

  // El servidor respondió 401 en una ruta protegida: la sesión venció o la cerraron.
  useEffect(() => {
    function manejarExpiracion() {
      if (!usuarioRef.current) return
      usuarioRef.current = null
      setUsuario(null)
      toast.aviso('Tu sesión expiró. Vuelve a ingresar para continuar.')
      navigate(urlIngresoConRetorno(rutaRef.current), { replace: true })
    }
    window.addEventListener(EVENTO_SESION_EXPIRADA, manejarExpiracion)
    return () => window.removeEventListener(EVENTO_SESION_EXPIRADA, manejarExpiracion)
  }, [navigate, toast])

  const iniciarSesion = useCallback(async (credenciales: CredencialesIngreso) => {
    const datos = await auth.iniciarSesion(credenciales)
    setUsuario(datos)
    return datos
  }, [])

  const registrarse = useCallback(async (datos: DatosRegistro) => {
    const creado = await auth.registrarse(datos)
    setUsuario(creado)
    return creado
  }, [])

  const cerrarSesion = useCallback(async () => {
    try {
      await auth.cerrarSesion()
    } finally {
      // Aunque el servidor no responda, en este navegador la sesión se da por cerrada.
      // Navegar y limpiar el usuario en la misma transición evita que la ruta protegida
      // alcance a redirigir con ?volver= (React Router actualiza la ruta en una transición).
      usuarioRef.current = null
      startTransition(() => {
        navigate('/ingresar', { replace: true })
        setUsuario(null)
      })
    }
  }, [navigate])

  const alternarTema = useCallback(
    () => setTema((anterior: unknown) => (anterior === 'dark' ? 'light' : 'dark')),
    [setTema],
  )

  const esJefe = usuario?.rol === 'jefe'

  const tieneRol = useCallback(
    (rol: Rol) => Boolean(usuario) && (rol === 'operador' || usuario?.rol === 'jefe'),
    [usuario],
  )

  const value = useMemo<ValorAppContext>(
    () => ({
      usuario,
      cargandoSesion,
      iniciarSesion,
      registrarse,
      cerrarSesion,
      esJefe,
      tieneRol,
      tema,
      alternarTema,
      config: CONFIG,
    }),
    [
      usuario,
      cargandoSesion,
      iniciarSesion,
      registrarse,
      cerrarSesion,
      esJefe,
      tieneRol,
      tema,
      alternarTema,
    ],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

/**
 * Acceso al contexto global. Debe usarse dentro de `<AppProvider>`.
 */
// oxlint-disable-next-line react/only-export-components
export function useAppContext(): ValorAppContext {
  const contexto = useContext(AppContext)
  if (contexto === null) {
    throw new Error('useAppContext debe usarse dentro de <AppProvider>.')
  }
  return contexto
}
