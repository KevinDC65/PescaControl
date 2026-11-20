import { useEffect, useRef } from 'react'
import { hayCapaAbierta } from './useCapaModal.ts'

/** Acción de un atajo de teclado. */
export type AccionAtajo = (evento: KeyboardEvent) => void

/** Atajos por combinación: 'mod+k', una tecla ('n', '/', '?') o una secuencia ('g i'). */
export type MapaAtajos = Record<string, AccionAtajo>

/** Indica si el foco está en un lugar donde se escribe texto. */
function estaEscribiendo(elemento: EventTarget | null): boolean {
  if (!(elemento instanceof HTMLElement)) return false
  if (elemento.isContentEditable) return true
  const etiqueta = elemento.tagName
  if (etiqueta === 'TEXTAREA' || etiqueta === 'SELECT') return true
  if (etiqueta !== 'INPUT' || !(elemento instanceof HTMLInputElement)) return false
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
 */
export function useAtajosTeclado(atajos: MapaAtajos): void {
  const atajosRef = useRef(atajos)
  const prefijoRef = useRef({ tecla: '', hasta: 0 })

  useEffect(() => {
    atajosRef.current = atajos
  })

  useEffect(() => {
    function manejarTecla(evento: KeyboardEvent) {
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
