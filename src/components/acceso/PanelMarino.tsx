import { motion, useReducedMotion } from 'motion/react'
import { Link } from 'react-router-dom'
import Marca from '../Marca.tsx'
import { Boya, CartaIsobatas, Ola } from '../escena/Escena.tsx'

const SALIDA_FUERTE = [0.23, 1, 0.32, 1] as const

/** Propiedades de `PanelMarino`. */
interface PropsPanelMarino {
  /** Frase de valor, una línea por elemento (cada línea entra por separado). */
  frase: readonly string[]
  /** Datos breves bajo la frase. */
  detalle: readonly { icono: string; texto: string }[]
}

/**
 * Panel visual de las páginas de acceso: océano nocturno con una carta náutica (isóbatas,
 * sondas y escala graduada) que se descubre de derecha a izquierda, la frase de valor que
 * sube línea a línea, la boya de señal que cae al agua y tres capas de oleaje.
 * En móvil se reduce a una franja con la marca y el oleaje.
 */
function PanelMarino({ frase, detalle }: PropsPanelMarino) {
  const reducir = useReducedMotion()

  return (
    <aside className="pc-marino" data-bs-theme="dark" aria-label="PescaControl">
      <motion.div
        className="pc-marino-carta"
        initial={reducir ? false : { clipPath: 'inset(0 0 0 100%)' }}
        animate={{ clipPath: 'inset(0 0 0 0%)' }}
        transition={{ duration: 1.4, ease: SALIDA_FUERTE }}
      >
        <CartaIsobatas />
      </motion.div>
      <span className="pc-marino-luna" aria-hidden="true" />

      <div className="pc-marino-contenido">
        <Link to="/" className="pc-marino-marca">
          <Marca />
          <span>PescaControl</span>
        </Link>

        <div className="pc-marino-texto">
          <p className="pc-marino-frase">
            {frase.map((linea, indice) => (
              <span key={linea} className="pc-marino-linea">
                <motion.span
                  className="d-block"
                  initial={reducir ? false : { y: '105%' }}
                  animate={{ y: '0%' }}
                  transition={{ duration: 0.9, delay: 0.25 + indice * 0.09, ease: SALIDA_FUERTE }}
                >
                  {linea}
                </motion.span>
              </span>
            ))}
          </p>
          <motion.ul
            className="pc-marino-detalle"
            initial={reducir ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.62, ease: SALIDA_FUERTE }}
          >
            {detalle.map((dato) => (
              <li key={dato.texto}>
                <i className={`bi ${dato.icono}`} aria-hidden="true" />
                {dato.texto}
              </li>
            ))}
          </motion.ul>
        </div>
      </div>

      <div className="pc-marino-mar" aria-hidden="true">
        <Ola className="pc-ola-lejana" longitud={160} amplitud={5} />
        <motion.div
          className="pc-marino-boya"
          initial={reducir ? false : { y: -28, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', duration: 0.9, bounce: 0.25, delay: 0.55 }}
        >
          <Boya />
        </motion.div>
        <Ola className="pc-ola-media" longitud={200} amplitud={7} />
        <Ola className="pc-ola-cercana" longitud={400} amplitud={9} />
      </div>
    </aside>
  )
}

export default PanelMarino
