import { animate, useInView, useReducedMotion } from 'motion/react'
import { useEffect, useRef } from 'react'

/** Propiedades de `Contador`. */
interface PropsContador {
  valor: number
  /** Da formato a cada cuadro (ej. separador de miles). */
  formato: (valor: number) => string
  /** Segundos que tarda en llegar al valor. */
  duracion?: number
  className?: string
}

/**
 * Cifra que cuenta desde cero hasta su valor la primera vez que entra en pantalla.
 * Escribe cada cuadro directamente en el DOM (sin re-renderizar React) y, para lectores de
 * pantalla, expone solo el valor final. Con movimiento reducido muestra el valor de una vez.
 */
function Contador({ valor, formato, duracion = 1.6, className = '' }: PropsContador) {
  const visibleRef = useRef<HTMLSpanElement>(null)
  const enPantalla = useInView(visibleRef, { once: true, margin: '0px 0px -12% 0px' })
  const reducir = useReducedMotion()
  const formatoRef = useRef(formato)

  useEffect(() => {
    formatoRef.current = formato
  })

  useEffect(() => {
    const nodo = visibleRef.current
    if (!nodo) return undefined
    if (reducir) {
      nodo.textContent = formatoRef.current(valor)
      return undefined
    }
    if (!enPantalla) {
      nodo.textContent = formatoRef.current(0)
      return undefined
    }
    const control = animate(0, valor, {
      duration: duracion,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (actual) => {
        nodo.textContent = formatoRef.current(actual)
      },
    })
    return () => control.stop()
  }, [valor, enPantalla, reducir, duracion])

  return (
    <span className={`pc-contador ${className}`}>
      {/* Reserva el ancho de la cifra final: el texto de alrededor no se mueve al contar. */}
      <span className="pc-contador-reserva" aria-hidden="true">
        {formato(valor)}
      </span>
      <span ref={visibleRef} className="pc-contador-vivo" aria-hidden="true">
        {formato(reducir ? valor : 0)}
      </span>
      <span className="visually-hidden">{formato(valor)}</span>
    </span>
  )
}

export default Contador
