import { useContext } from 'react'
import { ShellContext } from '../context/contextos.js'

/**
 * Acceso al estado del shell: paleta de comandos, ayuda de atajos, inicio de sesión,
 * menú móvil y navegación protegida por cambios sin guardar.
 * Debe usarse dentro de `<ShellProvider>`.
 */
export function useShell() {
  const contexto = useContext(ShellContext)
  if (contexto === null) throw new Error('useShell debe usarse dentro de <ShellProvider>.')
  return contexto
}
