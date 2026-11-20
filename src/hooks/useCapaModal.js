import { useEffect, useRef } from 'react'

const ENFOCABLES =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

// Pila de capas abiertas (modal sobre panel, por ejemplo): solo la de arriba responde
// a Esc y atrapa el foco. El scroll del body se bloquea mientras haya alguna abierta.
const pila = []

/** Indica si hay algún panel, modal o paleta abierto (lo usan los atajos de teclado). */
export const hayCapaAbierta = () => pila.length > 0

/**
 * Comportamiento común de modales, paneles y paleta: foco inicial, trampa de foco con
 * Tab, cierre con Esc, bloqueo del scroll de la página y devolución del foco al cerrar.
 *
 * @param {boolean} abierto
 * @param {React.RefObject<HTMLElement>} contenedorRef Elemento que contiene la capa.
 * @param {object} opciones
 * @param {() => void} opciones.onEscape Se llama al pulsar Esc (si no está bloqueado).
 * @param {React.RefObject<HTMLElement>} [opciones.enfoqueInicialRef] Elemento a enfocar al abrir.
 * @param {boolean} [opciones.bloquearEscape] Ignora Esc (ej. mientras se elimina).
 */
export function useCapaModal(
  abierto,
  contenedorRef,
  { onEscape, enfoqueInicialRef, bloquearEscape },
) {
  const opcionesRef = useRef({ onEscape, bloquearEscape })

  useEffect(() => {
    opcionesRef.current = { onEscape, bloquearEscape }
  })

  useEffect(() => {
    if (!abierto) return undefined
    const capa = {}
    pila.push(capa)
    const enfocadoAntes = document.activeElement
    const destino = enfoqueInicialRef?.current ?? contenedorRef.current?.querySelector(ENFOCABLES)
    destino?.focus({ preventScroll: true })

    if (pila.length === 1) {
      const anchoBarra = window.innerWidth - document.documentElement.clientWidth
      document.body.style.overflow = 'hidden'
      if (anchoBarra > 0) document.body.style.paddingRight = `${anchoBarra}px`
    }

    function manejarTecla(evento) {
      if (pila[pila.length - 1] !== capa) return
      if (evento.key === 'Escape') {
        const { onEscape: cerrar, bloquearEscape: bloqueado } = opcionesRef.current
        if (!bloqueado) {
          evento.preventDefault()
          cerrar?.()
        }
        return
      }
      const contenedor = contenedorRef.current
      if (evento.key !== 'Tab' || !contenedor) return
      const enfocables = [...contenedor.querySelectorAll(ENFOCABLES)].filter(
        (elemento) => elemento.offsetParent !== null || elemento === document.activeElement,
      )
      if (enfocables.length === 0) {
        evento.preventDefault()
        return
      }
      const primero = enfocables[0]
      const ultimo = enfocables[enfocables.length - 1]
      const dentro = contenedor.contains(document.activeElement)
      if (evento.shiftKey && (document.activeElement === primero || !dentro)) {
        evento.preventDefault()
        ultimo.focus()
      } else if (!evento.shiftKey && (document.activeElement === ultimo || !dentro)) {
        evento.preventDefault()
        primero.focus()
      }
    }

    document.addEventListener('keydown', manejarTecla)
    return () => {
      document.removeEventListener('keydown', manejarTecla)
      const indice = pila.indexOf(capa)
      if (indice !== -1) pila.splice(indice, 1)
      if (pila.length === 0) {
        document.body.style.overflow = ''
        document.body.style.paddingRight = ''
      }
      if (enfocadoAntes instanceof HTMLElement && document.contains(enfocadoAntes)) {
        enfocadoAntes.focus({ preventScroll: true })
      }
    }
  }, [abierto, contenedorRef, enfoqueInicialRef])
}
