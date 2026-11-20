import { useContext } from 'react'
import { ShellContext } from '../context/contextos.ts'
import type { ValorShellContext } from '../types/contextos.ts'

/**
 * Acceso al estado del shell: paleta de comandos, ayuda de atajos, inicio de sesión,
 * menú móvil y navegación protegida por cambios sin guardar.
 * Debe usarse dentro de `<ShellProvider>`.
 */
export function useShell(): ValorShellContext {
  const contexto = useContext(ShellContext)
  if (contexto === null) throw new Error('useShell debe usarse dentro de <ShellProvider>.')
  return contexto
}
