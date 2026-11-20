import { motion, useMotionValueEvent, useScroll, useTransform } from 'motion/react'
import { useRef, useState } from 'react'
import { colorEspecie } from '../../utils/colores.ts'
import InsigniaEspecie from '../InsigniaEspecie.tsx'
import InsigniaEstado from '../InsigniaEstado.tsx'
import { ESPECIES_EJEMPLO, PUERTOS_EJEMPLO } from './datosEjemplo.ts'

const PASOS = [
  {
    clave: 'registrar',
    icono: 'bi-pencil-square',
    titulo: 'Registrar',
    texto:
      'El operador registra la descarga al atracar: embarcación, matrícula, especie, arte de pesca, puerto, toneladas y precio. El formulario revisa cada dato antes de guardarlo.',
  },
  {
    clave: 'controlar',
    icono: 'bi-arrow-repeat',
    titulo: 'Controlar',
    texto:
      'Cada desembarque avanza de Programado a En descarga y Descargado. Los observados y los que siguen en descarga llevan la boya naranja para que nadie los pierda de vista.',
  },
  {
    clave: 'decidir',
    icono: 'bi-bar-chart-line',
    titulo: 'Decidir',
    texto:
      'El panel suma toneladas y valor por especie, puerto y destino. La planta y la jefatura saben qué llegó sin esperar el reporte del día siguiente.',
  },
] as const

/**
 * Cómo funciona: tres pasos (Registrar → Controlar → Decidir) en una sección fija mientras
 * se recorre (position: sticky). El avance del scroll (useScroll) llena el riel de progreso
 * (scaleY con useTransform) y decide el paso activo; la escena de la derecha cambia de un
 * paso a otro con un fundido. Todo el texto está siempre en el DOM.
 */
function ComoFunciona() {
  const recorridoRef = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({
    target: recorridoRef,
    offset: ['start start', 'end end'],
  })
  const progreso = useTransform(scrollYProgress, [0.04, 0.92], [0, 1], { clamp: true })
  const [activo, setActivo] = useState(0)

  useMotionValueEvent(scrollYProgress, 'change', (valor) => {
    const paso = valor < 0.36 ? 0 : valor < 0.68 ? 1 : 2
    if (paso !== activo) setActivo(paso)
  })

  return (
    <section
      id="como-funciona"
      ref={recorridoRef}
      className="pc-pasos"
      aria-labelledby="titulo-pasos"
    >
      <div className="pc-pasos-fijo">
        <div className="pc-envoltura pc-pasos-rejilla">
          <div className="pc-pasos-texto">
            <h2 id="titulo-pasos" className="pc-bloque-titulo">
              Del muelle a la decisión, en tres pasos
            </h2>
            <div className="pc-pasos-lista-envoltura">
              <span className="pc-pasos-riel" aria-hidden="true">
                <motion.span className="pc-pasos-riel-lleno" style={{ scaleY: progreso }} />
              </span>
              <ol className="pc-pasos-lista">
                {PASOS.map((paso, indice) => (
                  <li
                    key={paso.clave}
                    data-activo={indice === activo}
                    aria-current={indice === activo ? 'step' : undefined}
                  >
                    <span className="pc-pasos-marca" aria-hidden="true">
                      <i className={`bi ${paso.icono}`} />
                    </span>
                    <div>
                      <h3>{paso.titulo}</h3>
                      <p>{paso.texto}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
            <div className="pc-pasos-detalle" aria-hidden="true">
              {PASOS.map((paso, indice) => (
                <p key={paso.clave} data-activo={indice === activo}>
                  {paso.texto}
                </p>
              ))}
            </div>
          </div>

          <div className="pc-pasos-escenario" aria-hidden="true">
            <EscenaRegistrar activa={activo === 0} />
            <EscenaControlar activa={activo === 1} />
            <EscenaDecidir activa={activo === 2} />
          </div>
        </div>
      </div>
    </section>
  )
}

/** Propiedades de las escenas de los pasos. */
interface PropsEscena {
  activa: boolean
}

/** Paso 1: un formulario de registro que se completa campo a campo. */
function EscenaRegistrar({ activa }: PropsEscena) {
  return (
    <div className="pc-escena-paso pc-escena-registro" data-activa={activa}>
      <p className="pc-mini-titulo">Registrar desembarque</p>
      <div className="pc-mini-campo" style={{ '--i': 0 }}>
        <span>Embarcación</span>
        <strong>Don Lucho II</strong>
      </div>
      <div className="pc-mini-campo pc-mini-valido" style={{ '--i': 1 }}>
        <span>Matrícula</span>
        <strong className="pc-matricula">CE-21345-CM</strong>
        <i className="bi bi-check-lg" />
      </div>
      <div className="pc-mini-fila">
        <div className="pc-mini-campo" style={{ '--i': 2 }}>
          <span>Especie</span>
          <strong>
            <InsigniaEspecie especie="Anchoveta" forma="punto" /> Anchoveta
          </strong>
        </div>
        <div className="pc-mini-campo" style={{ '--i': 3 }}>
          <span>Toneladas</span>
          <strong className="pc-cifra-dato">312.40 t</strong>
        </div>
      </div>
      <span className="pc-mini-boton" style={{ '--i': 4 }}>
        <i className="bi bi-check2" /> Registrar desembarque
      </span>
    </div>
  )
}

/** Paso 2: el estado del desembarque avanza y lo que requiere atención se marca. */
function EscenaControlar({ activa }: PropsEscena) {
  return (
    <div className="pc-escena-paso pc-escena-control" data-activa={activa}>
      <p className="pc-mini-titulo">DSB-014 · Virgen de la Puerta</p>
      <ol className="pc-mini-estados">
        <li style={{ '--i': 0 }}>
          <InsigniaEstado estado="Programado" />
          <span>Atraca a las 05:40</span>
        </li>
        <li style={{ '--i': 1 }}>
          <InsigniaEstado estado="En descarga" />
          <span>Chata 2 · tolva abierta</span>
        </li>
        <li style={{ '--i': 2 }}>
          <InsigniaEstado estado="Observado" />
          <span>Diferencia de 1.2 t en balanza</span>
        </li>
        <li style={{ '--i': 3 }}>
          <InsigniaEstado estado="Descargado" />
          <span>Cerrado por jefatura</span>
        </li>
      </ol>
    </div>
  )
}

/** Paso 3: las cifras del panel listas para decidir. */
function EscenaDecidir({ activa }: PropsEscena) {
  const totalEspecies = ESPECIES_EJEMPLO.reduce((suma, fila) => suma + fila.toneladas, 0)
  const maximoPuerto = Math.max(...PUERTOS_EJEMPLO.map((fila) => fila.toneladas))
  return (
    <div className="pc-escena-paso pc-escena-decidir" data-activa={activa}>
      <div className="pc-mini-pizarra">
        <span>Toneladas desembarcadas</span>
        <strong>1,880 t</strong>
        <span className="pc-mini-franja">
          {ESPECIES_EJEMPLO.map((fila) => (
            <span
              key={fila.especie}
              style={{
                '--especie': colorEspecie(fila.especie),
                flexGrow: fila.toneladas / totalEspecies,
              }}
            />
          ))}
        </span>
      </div>
      <ul className="pc-mini-puertos">
        {PUERTOS_EJEMPLO.map((fila, indice) => (
          <li key={fila.puerto} style={{ '--i': indice }}>
            <span>{fila.puerto}</span>
            <span className="pc-mini-barra" style={{ '--p': fila.toneladas / maximoPuerto }} />
          </li>
        ))}
      </ul>
    </div>
  )
}

export default ComoFunciona
