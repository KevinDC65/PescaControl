import { createContext, useCallback, useContext, useEffect, useMemo } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage.js'

/**
 * Valor del contexto global.
 * @typedef {object} ValorAppContext
 * @property {{ nombre: string } | null} usuario Usuario con sesión simulada, o null.
 * @property {(nombre: string) => boolean} login Inicia sesión; ignora nombres vacíos (devuelve false).
 * @property {() => void} logout Cierra la sesión.
 * @property {'light' | 'dark'} tema Tema actual de Bootstrap.
 * @property {() => void} alternarTema Cambia entre claro y oscuro.
 * @property {{ moneda: string, unidad: string }} config Configuración de la aplicación
 *   (`moneda`: símbolo de los soles; `unidad`: abreviatura de toneladas).
 */

const AppContext = createContext(null)

const CONFIG = Object.freeze({ moneda: 'S/', unidad: 't' })

/** Tema del sistema operativo, usado solo la primera vez que se abre la app. */
function temaDelSistema() {
  try {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  } catch {
    return 'light'
  }
}

export function AppProvider({ children }) {
  const [usuarioGuardado, setUsuario] = useLocalStorage('pescacontrol:usuario', null)
  const [temaGuardado, setTema] = useLocalStorage('pescacontrol:tema', temaDelSistema)

  // Si localStorage tiene datos manipulados o de otra versión, se usan valores seguros.
  const usuario =
    usuarioGuardado && typeof usuarioGuardado.nombre === 'string' ? usuarioGuardado : null
  const tema = temaGuardado === 'dark' ? 'dark' : 'light'

  useEffect(() => {
    document.documentElement.setAttribute('data-bs-theme', tema)
  }, [tema])

  const login = useCallback(
    (nombre) => {
      const nombreLimpio = String(nombre ?? '').trim()
      if (!nombreLimpio) return false
      setUsuario({ nombre: nombreLimpio })
      return true
    },
    [setUsuario],
  )

  const logout = useCallback(() => setUsuario(null), [setUsuario])

  const alternarTema = useCallback(
    () => setTema((anterior) => (anterior === 'dark' ? 'light' : 'dark')),
    [setTema],
  )

  /** @type {ValorAppContext} */
  const value = useMemo(
    () => ({ usuario, login, logout, tema, alternarTema, config: CONFIG }),
    [usuario, login, logout, tema, alternarTema],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

/**
 * Acceso al contexto global. Debe usarse dentro de `<AppProvider>`.
 * @returns {ValorAppContext}
 */
// oxlint-disable-next-line react/only-export-components
export function useAppContext() {
  const contexto = useContext(AppContext)
  if (contexto === null) {
    throw new Error('useAppContext debe usarse dentro de <AppProvider>.')
  }
  return contexto
}
