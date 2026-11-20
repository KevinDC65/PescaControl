import { useEffect, useRef, type RefObject } from 'react'

const ENFOCABLES =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

// Pila de capas abiertas (modal sobre panel, por ejemplo): solo la de arriba responde
// a Esc y atrapa el foco. El scroll del body se bloquea mientras haya alguna abierta.
const pila: object[] = []

/** Indica si hay algún panel, modal o paleta abierto (lo usan los atajos de teclado). */
export const hayCapaAbierta = (): boolean => pila.length > 0

/** Opciones de `useCapaModal`. */
export interface OpcionesCapaModal {
  /** Se llama al pulsar Esc (si no está bloqueado). */
  onEscape?: () => void
  /** Elemento a enfocar al abrir. */
  enfoqueInicialRef?: RefObject<HTMLElement | null>
  /** Ignora Esc (ej. mientras se elimina). */
  bloquearEscape?: boolean
}

/**
 * Comportamiento común de modales, paneles y paleta: foco inicial, trampa de foco con
 * Tab, cierre con Esc, bloqueo del scroll de la página y devolución del foco al cerrar.
 *
 * @param abierto Si es true, la capa está activa.
 * @param contenedorRef Elemento que contiene la capa.
 */
export function useCapaModal(
  abierto: boolean,
  contenedorRef: RefObject<HTMLElement | null>,
  { onEscape, enfoqueInicialRef, bloquearEscape }: OpcionesCapaModal,
): void {
  const opcionesRef = useRef({ onEscape, bloquearEscape })

  useEffect(() => {
    opcionesRef.current = { onEscape, bloquearEscape }
  })

  useEffect(() => {
    if (!abierto) return undefined
    const capa = {}
    pila.push(capa)
    const enfocadoAntes = document.activeElement
    const destino =
      enfoqueInicialRef?.current ?? contenedorRef.current?.querySelector<HTMLElement>(ENFOCABLES)
    destino?.focus({ preventScroll: true })

    if (pila.length === 1) {
      const anchoBarra = window.innerWidth - document.documentElement.clientWidth
      document.body.style.overflow = 'hidden'
      if (anchoBarra > 0) document.body.style.paddingRight = `${anchoBarra}px`
    }

    function manejarTecla(evento: KeyboardEvent) {
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
      const enfocables = [...contenedor.querySelectorAll<HTMLElement>(ENFOCABLES)].filter(
        (elemento) => elemento.offsetParent !== null || elemento === document.activeElement,
      )
      const primero = enfocables[0]
      const ultimo = enfocables[enfocables.length - 1]
      // Sin elementos enfocables (lista vacía) el foco no sale de la capa.
      if (!primero || !ultimo) {
        evento.preventDefault()
        return
      }
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
