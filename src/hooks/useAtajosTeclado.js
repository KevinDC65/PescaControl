import { useEffect, useRef } from 'react'
import { hayCapaAbierta } from './useCapaModal.js'

/** Indica si el foco está en un lugar donde se escribe texto. */
function estaEscribiendo(elemento) {
  if (!(elemento instanceof HTMLElement)) return false
  if (elemento.isContentEditable) return true
  const etiqueta = elemento.tagName
  if (etiqueta === 'TEXTAREA' || etiqueta === 'SELECT') return true
  if (etiqueta !== 'INPUT') return false
  const tiposSinTexto = ['checkbox', 'radio', 'button', 'submit', 'reset', 'range', 'color']
  return !tiposSinTexto.includes(elemento.type)
}

const ESPERA_SECUENCIA = 1200

/**
 * Atajos globales de teclado. `atajos` es un objeto cuyas claves son:
 *   - 'mod+k'  Ctrl+K en Windows/Linux o ⌘K en macOS (funciona incluso escribiendo).
 *   - 'n', '/', '?'  una tecla sola.
 *   - 'g i'  secuencia: G y luego I.
 * Las teclas simples y las secuencias no se disparan mientras se escribe en un campo
 * ni con un modal o panel abierto.
 *
 * @param {Record<string, (evento: KeyboardEvent) => void>} atajos
 */
export function useAtajosTeclado(atajos) {
  const atajosRef = useRef(atajos)
  const prefijoRef = useRef({ tecla: '', hasta: 0 })

  useEffect(() => {
    atajosRef.current = atajos
  })

  useEffect(() => {
    function manejarTecla(evento) {
      const mapa = atajosRef.current
      const tecla = evento.key.length === 1 ? evento.key.toLowerCase() : evento.key

      if ((evento.ctrlKey || evento.metaKey) && !evento.altKey && tecla === 'k') {
        if (mapa['mod+k']) {
          evento.preventDefault()
          mapa['mod+k'](evento)
        }
        return
      }

      if (evento.ctrlKey || evento.metaKey || evento.altKey || evento.repeat) return
      if (estaEscribiendo(evento.target) || hayCapaAbierta()) return

      const ahora = Date.now()
      const prefijo = prefijoRef.current
      if (prefijo.tecla && ahora < prefijo.hasta) {
        const secuencia = mapa[`${prefijo.tecla} ${tecla}`]
        prefijoRef.current = { tecla: '', hasta: 0 }
        if (secuencia) {
          evento.preventDefault()
          secuencia(evento)
          return
        }
      }

      const empiezaSecuencia = Object.keys(mapa).some((clave) => clave.startsWith(`${tecla} `))
      if (empiezaSecuencia) {
        prefijoRef.current = { tecla, hasta: ahora + ESPERA_SECUENCIA }
        return
      }

      const accion = mapa[evento.key === '?' ? '?' : tecla]
      if (accion) {
        evento.preventDefault()
        accion(evento)
      }
    }

    document.addEventListener('keydown', manejarTecla)
    return () => document.removeEventListener('keydown', manejarTecla)
  }, [])
}
