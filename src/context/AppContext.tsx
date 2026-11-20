import { createContext, useCallback, useContext, useEffect, useMemo, type ReactNode } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage.ts'
import type { ConfiguracionApp, Tema, ValorAppContext } from '../types/contextos.ts'
import type { UsuarioSimulado } from '../types/usuario.ts'

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

/** Indica si el valor guardado tiene la forma de un usuario de la sesión simulada. */
function esUsuarioSimulado(valor: unknown): valor is UsuarioSimulado {
  return (
    typeof valor === 'object' &&
    valor !== null &&
    'nombre' in valor &&
    typeof valor.nombre === 'string'
  )
}

/** Propiedades de `AppProvider`. */
interface PropsAppProvider {
  children?: ReactNode
}

export function AppProvider({ children }: PropsAppProvider) {
  // Lo guardado en localStorage se lee como `unknown`: puede venir manipulado o de otra versión.
  const [usuarioGuardado, setUsuario] = useLocalStorage<unknown>('pescacontrol:usuario', null)
  const [temaGuardado, setTema] = useLocalStorage<unknown>('pescacontrol:tema', temaDelSistema)

  // Si localStorage tiene datos manipulados o de otra versión, se usan valores seguros.
  const usuario = esUsuarioSimulado(usuarioGuardado) ? usuarioGuardado : null
  const tema: Tema = temaGuardado === 'dark' ? 'dark' : 'light'

  useEffect(() => {
    document.documentElement.setAttribute('data-bs-theme', tema)
  }, [tema])

  const login = useCallback(
    (nombre: string) => {
      const nombreLimpio = String(nombre ?? '').trim()
      if (!nombreLimpio) return false
      setUsuario({ nombre: nombreLimpio })
      return true
    },
    [setUsuario],
  )

  const logout = useCallback(() => setUsuario(null), [setUsuario])

  const alternarTema = useCallback(
    () => setTema((anterior: unknown) => (anterior === 'dark' ? 'light' : 'dark')),
    [setTema],
  )

  const value = useMemo<ValorAppContext>(
    () => ({ usuario, login, logout, tema, alternarTema, config: CONFIG }),
    [usuario, login, logout, tema, alternarTema],
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
