import { motion, useInView, useReducedMotion, useScroll, useTransform } from 'motion/react'
import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { PUERTOS } from '../../constants/desembarques.ts'
import { useAppContext } from '../../context/AppContext.tsx'
import { RUTA_PANEL } from '../../utils/sesion.ts'
import { Boya, Embarcacion, Ola } from '../escena/Escena.tsx'

const SALIDA_FUERTE = [0.23, 1, 0.32, 1] as const
const TITULO = ['El desembarque,', 'bajo control.'] as const

/** Propiedades de `Portada`. */
interface PropsPortada {
  /** Movimiento continuo detenido por el visitante. */
  pausado: boolean
  onAlternarPausa: () => void
}

/**
 * Portada a pantalla completa: el muelle al amanecer (tema claro) o de noche (tema oscuro).
 * Cielo, costa al este, una embarcación de cerco que cruza el horizonte, cuatro capas de
 * oleaje con parallax al hacer scroll y la boya de señal en primer plano.
 *
 * Coreografía de entrada (una vez): el mar sube por capas, el titular se descubre línea a
 * línea desde su máscara y luego llegan bajada, acciones y datos. Solo transform, opacity
 * y clip-path. Con movimiento reducido todo aparece en su sitio, sin desplazamientos.
 */
function Portada({ pausado, onAlternarPausa }: PropsPortada) {
  const { usuario } = useAppContext()
  const reducir = useReducedMotion()
  const portadaRef = useRef<HTMLElement>(null)
  // Fuera de pantalla el oleaje se detiene: no gasta cuadros que nadie ve.
  const visible = useInView(portadaRef, { margin: '0px 0px -5% 0px' })
  const { scrollYProgress } = useScroll({
    target: portadaRef,
    offset: ['start start', 'end start'],
  })

  // Parallax: las capas más cercanas se desplazan más, como al alejarse de la orilla.
  const yLejos = useTransform(scrollYProgress, [0, 1], ['0%', reducir ? '0%' : '-6%'])
  const yMedia = useTransform(scrollYProgress, [0, 1], ['0%', reducir ? '0%' : '-14%'])
  const yCerca = useTransform(scrollYProgress, [0, 1], ['0%', reducir ? '0%' : '-26%'])
  const yFrente = useTransform(scrollYProgress, [0, 1], ['0%', reducir ? '0%' : '-40%'])
  const yAstro = useTransform(scrollYProgress, [0, 1], ['0%', reducir ? '0%' : '30%'])

  const entrada = (retraso: number, desplazamiento = 14) =>
    reducir
      ? {}
      : {
          initial: { opacity: 0, y: desplazamiento },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.8, delay: retraso, ease: SALIDA_FUERTE },
        }

  const subida = (retraso: number) =>
    reducir
      ? {}
      : {
          initial: { y: '18%' },
          animate: { y: '0%' },
          transition: { duration: 1.3, delay: retraso, ease: SALIDA_FUERTE },
        }

  return (
    <section
      ref={portadaRef}
      className="pc-portada"
      aria-labelledby="titulo-portada"
      data-pausado={pausado}
      data-fuera={!visible}
    >
      <div className="pc-portada-escena" aria-hidden="true">
        <motion.div className="pc-portada-astro" style={{ y: yAstro }}>
          <motion.span
            className="d-block"
            initial={reducir ? false : { opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.6, ease: SALIDA_FUERTE }}
          />
        </motion.div>
        <svg className="pc-portada-costa" viewBox="0 0 600 120" preserveAspectRatio="none">
          <path d="M600 120V18c-30-6-52 6-80 2s-46-18-78-12-50 26-86 30-62-8-96 4-64 40-98 52-50 12-62 26Z" />
          <path
            className="pc-portada-costa-cerca"
            d="M600 120V58c-40-4-70 10-110 12s-70-8-110 6-72 30-118 44Z"
          />
        </svg>
        <div className="pc-portada-horizonte">
          <div className="pc-portada-travesia">
            <Embarcacion />
          </div>
        </div>

        <motion.div className="pc-portada-capa pc-portada-capa-lejos" style={{ y: yLejos }}>
          <motion.div className="h-100" {...subida(0)}>
            <Ola className="pc-ola-lejana" longitud={50} amplitud={0.9} />
          </motion.div>
        </motion.div>
        <motion.div className="pc-portada-capa pc-portada-capa-media" style={{ y: yMedia }}>
          <motion.div className="h-100" {...subida(0.06)}>
            <Ola className="pc-ola-media" longitud={100} amplitud={1.8} />
          </motion.div>
        </motion.div>
        <motion.div className="pc-portada-capa pc-portada-capa-boya" style={{ y: yCerca }}>
          <motion.div
            className="h-100"
            initial={reducir ? false : { y: -40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: 'spring', duration: 1.1, bounce: 0.22, delay: 0.7 }}
          >
            <Boya />
          </motion.div>
        </motion.div>
        <motion.div className="pc-portada-capa pc-portada-capa-cerca" style={{ y: yCerca }}>
          <motion.div className="h-100" {...subida(0.12)}>
            <Ola className="pc-ola-cercana" longitud={160} amplitud={2.8} />
          </motion.div>
        </motion.div>
        <motion.div className="pc-portada-capa pc-portada-capa-frente" style={{ y: yFrente }}>
          <motion.div className="h-100" {...subida(0.18)}>
            <Ola className="pc-ola-frente" longitud={200} amplitud={4} />
          </motion.div>
        </motion.div>
      </div>

      <div className="pc-portada-contenido">
        <h1 id="titulo-portada" className="pc-portada-titulo">
          {TITULO.map((linea, indice) => (
            <span key={linea} className="pc-portada-linea">
              <motion.span
                className="d-block"
                initial={reducir ? false : { y: '108%' }}
                animate={{ y: '0%' }}
                transition={{ duration: 1, delay: 0.12 + indice * 0.09, ease: SALIDA_FUERTE }}
              >
                {linea}
              </motion.span>
            </span>
          ))}
        </h1>
        <motion.p className="pc-portada-bajada" {...entrada(0.36)}>
          PescaControl registra cada descarga en los puertos del litoral peruano: embarcación,
          especie, toneladas y estado. Así sabes al instante qué llegó, cuánto vale y qué operación
          necesita seguimiento.
        </motion.p>
        <motion.div className="pc-portada-acciones" {...entrada(0.46)}>
          {usuario ? (
            <Link to={RUTA_PANEL} className="btn btn-primary btn-lg pc-boton-principal">
              Ir al panel
              <i className="bi bi-arrow-right" aria-hidden="true" />
            </Link>
          ) : (
            <>
              <Link to="/crear-cuenta" className="btn btn-primary btn-lg pc-boton-principal">
                Crear cuenta
                <i className="bi bi-arrow-right" aria-hidden="true" />
              </Link>
              <Link to="/ingresar" className="btn btn-lg pc-boton-secundario">
                Ingresar
              </Link>
            </>
          )}
        </motion.div>
        <motion.p className="pc-portada-puertos" {...entrada(0.58, 8)}>
          <i className="bi bi-geo-alt" aria-hidden="true" />
          <span className="visually-hidden">Puertos: </span>
          {PUERTOS.join(' · ')}
        </motion.p>
      </div>

      <div className="pc-portada-pie">
        <a href="#problema" className="pc-portada-desliza">
          <span className="pc-portada-desliza-linea" aria-hidden="true" />
          <span>
            Desliza<span className="d-none d-sm-inline"> para conocerlo</span>
          </span>
        </a>
        <button
          type="button"
          className="pc-portada-pausa"
          onClick={onAlternarPausa}
          aria-label={pausado ? 'Reanudar el oleaje de la página' : 'Pausar el oleaje de la página'}
          title="Detiene o reanuda el movimiento continuo de toda la página"
        >
          <i className={`bi ${pausado ? 'bi-play-fill' : 'bi-pause-fill'}`} aria-hidden="true" />
          <span>
            {pausado ? 'Reanudar' : 'Pausar'}
            <span className="d-none d-sm-inline"> el oleaje</span>
          </span>
        </button>
      </div>
    </section>
  )
}

export default Portada
