import { motion, useInView, useReducedMotion } from 'motion/react'
import { useRef } from 'react'

const SALIDA_FUERTE = [0.23, 1, 0.32, 1] as const

const DOLORES = [
  {
    icono: 'bi-hourglass-split',
    titulo: 'Planillas que llegan tarde',
    texto: 'Las cifras del día se conocen al día siguiente, cuando la planta ya recibió la pesca.',
  },
  {
    icono: 'bi-diagram-2',
    titulo: 'Datos dispersos',
    texto: 'Cada puerto lleva su cuaderno; sumar toneladas por especie toma horas de oficina.',
  },
  {
    icono: 'bi-exclamation-diamond',
    titulo: 'Observaciones que se pierden',
    texto: 'Una descarga observada queda en una nota al margen y nadie le hace seguimiento.',
  },
] as const

/**
 * El problema, en lenguaje simple: el desembarque en papel. A la derecha, una planilla de
 * muelle escrita a mano; al entrar en pantalla un trazo rojo tacha la cifra mal sumada y
 * aparece la nota "¿revisar?" (clip-path y opacity, una sola vez).
 */
function Problema() {
  const planillaRef = useRef<HTMLDivElement>(null)
  const enPantalla = useInView(planillaRef, { once: true, margin: '0px 0px -25% 0px' })
  const reducir = useReducedMotion()
  const mostrar = enPantalla || reducir

  return (
    <section id="problema" className="pc-bloque pc-problema" aria-labelledby="titulo-problema">
      <div className="pc-envoltura pc-problema-rejilla">
        <div>
          <h2 id="titulo-problema" className="pc-bloque-titulo">
            En muchos muelles, el desembarque todavía se anota en papel
          </h2>
          <p className="pc-bloque-texto">
            La embarcación atraca, se pesa la captura y alguien la apunta en una planilla. Cuando
            esos datos llegan a la oficina ya pasaron horas, y cada puerto los sumó a su manera.
          </p>
          <ul className="pc-dolores">
            {DOLORES.map((dolor) => (
              <li key={dolor.titulo}>
                <i className={`bi ${dolor.icono}`} aria-hidden="true" />
                <div>
                  <h3>{dolor.titulo}</h3>
                  <p>{dolor.texto}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div
          ref={planillaRef}
          className="pc-planilla"
          role="img"
          aria-label="Planilla de desembarque escrita a mano, con una cifra corregida y un total que no cuadra."
        >
          <div className="pc-planilla-cabecera" aria-hidden="true">
            <span>Planilla de desembarque</span>
            <span>Muelle Chimbote · 03/10</span>
          </div>
          <ol className="pc-planilla-filas" aria-hidden="true">
            <li>
              <span>Don Lucho II</span>
              <span>anchov.</span>
              <span>312,4</span>
            </li>
            <li>
              <span>Sta. Rosa I</span>
              <span>anchov.</span>
              <span>
                <s>380</s> 245,8
              </span>
            </li>
            <li>
              <span>Mi Patricia</span>
              <span>jurel</span>
              <span>32,5</span>
            </li>
            <li>
              <span>Sr. de Sipán</span>
              <span>¿cab.?</span>
              <span>41</span>
            </li>
          </ol>
          <div className="pc-planilla-total" aria-hidden="true">
            <span>Total</span>
            <span className="pc-planilla-suma">
              711,7
              <motion.span
                className="pc-planilla-tachon"
                initial={reducir ? false : { clipPath: 'inset(0 100% 0 0)' }}
                animate={mostrar ? { clipPath: 'inset(0 0% 0 0)' } : undefined}
                transition={{ duration: 0.5, delay: 0.25, ease: SALIDA_FUERTE }}
              />
            </span>
            <motion.span
              className="pc-planilla-nota"
              initial={reducir ? false : { opacity: 0, scale: 0.9 }}
              animate={mostrar ? { opacity: 1, scale: 1 } : undefined}
              transition={{ type: 'spring', duration: 0.6, bounce: 0.3, delay: 0.7 }}
            >
              ¿revisar?
            </motion.span>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Problema
