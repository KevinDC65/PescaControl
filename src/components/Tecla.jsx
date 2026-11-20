/** Detecta macOS/iOS para mostrar ⌘ en lugar de Ctrl en las ayudas de teclado. */
const esMac =
  typeof navigator !== 'undefined' &&
  /Mac|iPhone|iPad/i.test(navigator.platform || navigator.userAgent)

/** Nombre visible de la tecla modificadora principal. */
const TECLA_MOD = esMac ? '⌘' : 'Ctrl'

/**
 * Tecla de un atajo de teclado: `<Tecla>N</Tecla>` o `<Tecla mod>K</Tecla>` para Ctrl+K / ⌘K.
 */
export function Tecla({ children, mod = false, className = '' }) {
  return (
    <kbd className={`pc-tecla ${className}`}>
      {mod && <span className="pc-tecla-mod">{TECLA_MOD}</span>}
      {children}
    </kbd>
  )
}
