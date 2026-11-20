import { useInView, useReducedMotion } from 'motion/react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ESTADOS } from '../../constants/desembarques.ts'
import type { EstadoDesembarque } from '../../types/desembarque.ts'
import { colorEspecie } from '../../utils/colores.ts'
import InsigniaEspecie from '../InsigniaEspecie.tsx'
import InsigniaEstado from '../InsigniaEstado.tsx'
import InsigniaRol from '../InsigniaRol.tsx'
import TarjetaDesembarque from '../TarjetaDesembarque.tsx'
import { DESEMBARQUES_EJEMPLO, ESPECIES_EJEMPLO, PUERTOS_EJEMPLO } from './datosEjemplo.ts'

/** Estados que recorre la tarjeta de ejemplo: así avanza una descarga real. */
const CICLO_ESTADOS: readonly EstadoDesembarque[] = ['En descarga', 'Observado', 'Descargado']

/** Propiedades de `Modulos`. */
interface PropsModulos {
  /** Movimiento continuo detenido por el visitante. */
  pausado: boolean
}

/**
 * Los cuatro módulos del sistema con vistas previas hechas con los mismos componentes de la
 * app (TarjetaDesembarque, insignias de especie, estado y rol) y datos de ejemplo locales.
 * Las vistas previas solo se mueven mientras están en pantalla y nunca con movimiento
 * reducido o con el oleaje pausado.
 */
function Modulos({ pausado }: PropsModulos) {
  const rejillaRef = useRef<HTMLDivElement>(null)
  const enPantalla = useInView(rejillaRef, { margin: '0px 0px -10% 0px' })
  const reducir = useReducedMotion()
  const visto = useInView(rejillaRef, { once: true, margin: '0px 0px -10% 0px' })
  const vivo = enPantalla && !pausado && !reducir

  return (
    <section id="modulos" className="pc-bloque pc-modulos" aria-labelledby="titulo-modulos">
      <div className="pc-envoltura">
        <h2 id="titulo-modulos" className="pc-bloque-titulo">
          Cuatro módulos sobre un mismo registro
        </h2>
        <p className="pc-bloque-texto">
          Lo que se anota en el muelle alimenta todo lo demás: el panel, la lista, los filtros y los
          permisos trabajan sobre el mismo desembarque.
        </p>

        <div
          ref={rejillaRef}
          className="pc-modulos-rejilla"
          data-vivo={vivo}
          data-visto={visto || Boolean(reducir)}
        >
          <Modulo
            clase="pc-modulo-panel"
            icono="bi-compass"
            titulo="Panel de operaciones"
            texto="Toneladas y valor del día, lo que requiere atención, la captura por especie y la carta del litoral por puerto."
          >
            <VistaPanel />
          </Modulo>
          <Modulo
            clase="pc-modulo-lista"
            icono="bi-list-columns-reverse"
            titulo="Desembarques"
            texto="Tabla densa o tarjetas, con filtros por especie, puerto, estado y fechas que quedan en la dirección para compartirlos."
          >
            <VistaLista vivo={vivo} />
          </Modulo>
          <Modulo
            clase="pc-modulo-registro"
            icono="bi-plus-square"
            titulo="Registro con validación"
            texto="Matrícula de capitanía, código único, toneladas con dos decimales y fecha no futura: el error se marca antes de guardar."
          >
            <VistaRegistro />
          </Modulo>
          <Modulo
            clase="pc-modulo-roles"
            icono="bi-people"
            titulo="Cuentas y roles"
            texto="Cada persona entra con su correo. El Operador registra y edita; el Jefe además elimina y administra las cuentas."
          >
            <VistaRoles />
          </Modulo>
        </div>
      </div>
    </section>
  )
}

/** Propiedades de `Modulo`. */
interface PropsModulo {
  clase: string
  icono: string
  titulo: string
  texto: string
  children: ReactNode
}

function Modulo({ clase, icono, titulo, texto, children }: PropsModulo) {
  return (
    <article className={`pc-modulo ${clase}`}>
      <div className="pc-modulo-texto">
        <h3>
          <i className={`bi ${icono}`} aria-hidden="true" />
          {titulo}
        </h3>
        <p>{texto}</p>
      </div>
      <div className="pc-modulo-vista" aria-hidden="true" inert>
        {children}
      </div>
    </article>
  )
}

/** Miniatura del panel: pizarra, franja de especies y barras por puerto. */
function VistaPanel() {
  const total = ESPECIES_EJEMPLO.reduce((suma, fila) => suma + fila.toneladas, 0)
  const maximo = Math.max(...PUERTOS_EJEMPLO.map((fila) => fila.toneladas))
  return (
    <div className="pc-vista-panel">
      <div className="pc-vista-cifras">
        <div className="pc-mini-pizarra">
          <span>Toneladas</span>
          <strong>1,880 t</strong>
        </div>
        <div className="pc-vista-cifra">
          <span>Valor</span>
          <strong>S/ 3.8 M</strong>
        </div>
        <div className="pc-vista-cifra pc-vista-atencion">
          <span>
            <span className="pc-vista-punto" /> Atención
          </span>
          <strong>3</strong>
        </div>
      </div>
      <span className="pc-mini-franja pc-vista-franja">
        {ESPECIES_EJEMPLO.map((fila) => (
          <span
            key={fila.especie}
            style={{ '--especie': colorEspecie(fila.especie), flexGrow: fila.toneladas / total }}
          />
        ))}
      </span>
      <ul className="pc-vista-especies">
        {ESPECIES_EJEMPLO.slice(0, 4).map((fila) => (
          <li key={fila.especie}>
            <InsigniaEspecie especie={fila.especie} forma="etiqueta" />
          </li>
        ))}
      </ul>
      <ul className="pc-mini-puertos pc-vista-puertos">
        {PUERTOS_EJEMPLO.map((fila, indice) => (
          <li key={fila.puerto} style={{ '--i': indice }}>
            <span>{fila.puerto}</span>
            <span className="pc-mini-barra" style={{ '--p': fila.toneladas / maximo }} />
          </li>
        ))}
      </ul>
      <p className="pc-vista-subtitulo">Requieren atención</p>
      <ul className="pc-vista-atencion-lista">
        <li>
          <InsigniaEspecie especie="Pota" forma="ficha" />
          <span>
            <strong>Virgen de la Puerta</strong>
            <span className="pc-codigo">DSB-002</span>
          </span>
          <InsigniaEstado estado="En descarga" />
        </li>
        <li>
          <InsigniaEspecie especie="Caballa" forma="ficha" />
          <span>
            <strong>Señor de Sipán</strong>
            <span className="pc-codigo">DSB-011</span>
          </span>
          <InsigniaEstado estado="Observado" />
        </li>
      </ul>
    </div>
  )
}

/** Propiedades de `VistaLista`. */
interface PropsVistaLista {
  vivo: boolean
}

/** Dos tarjetas reales de la vista Tarjetas; la segunda avanza de estado cada pocos segundos. */
function VistaLista({ vivo }: PropsVistaLista) {
  const [paso, setPaso] = useState(0)

  useEffect(() => {
    if (!vivo) return undefined
    const temporizador = setInterval(() => setPaso((actual) => actual + 1), 2800)
    return () => clearInterval(temporizador)
  }, [vivo])

  const [primero, segundo] = DESEMBARQUES_EJEMPLO
  const estado = CICLO_ESTADOS[paso % CICLO_ESTADOS.length] ?? ESTADOS[1]

  return (
    <div className="pc-vista-lista">
      {primero && <TarjetaDesembarque desembarque={primero} />}
      {segundo && <TarjetaDesembarque desembarque={{ ...segundo, estado }} />}
    </div>
  )
}

/** Campo de matrícula que pasa de inválido a válido (bucle en CSS, pausable). */
function VistaRegistro() {
  return (
    <div className="pc-vista-registro">
      <div className="pc-vista-campo">
        <span className="pc-vista-etiqueta">Embarcación</span>
        <span className="pc-vista-control">Señor de Sipán</span>
      </div>
      <div className="pc-vista-campo">
        <span className="pc-vista-etiqueta">Matrícula</span>
        <span className="pc-vista-alternancia">
          <span className="pc-vista-control pc-vista-invalido">
            <span className="pc-matricula">CE-2134</span>
            <i className="bi bi-exclamation-circle" />
          </span>
          <span className="pc-vista-control pc-vista-valido">
            <span className="pc-matricula">CE-21345-CM</span>
            <i className="bi bi-check-lg" />
          </span>
        </span>
        <span className="pc-vista-alternancia pc-vista-ayudas">
          <span className="pc-vista-ayuda pc-vista-ayuda-error">Usa el formato AA-00000-AA.</span>
          <span className="pc-vista-ayuda pc-vista-ayuda-ok">Capitanía de Chimbote.</span>
        </span>
      </div>
      <div className="pc-vista-campo">
        <span className="pc-vista-etiqueta">Toneladas</span>
        <span className="pc-vista-control pc-vista-toneladas">
          <span>−</span>
          <strong className="pc-cifra-dato">41.00</strong>
          <span>+</span>
        </span>
      </div>
    </div>
  )
}

/** Dos cuentas con su rol y lo que cada una puede hacer con un desembarque. */
function VistaRoles() {
  return (
    <ul className="pc-vista-roles">
      <li>
        <span className="pc-avatar">R</span>
        <span className="pc-vista-rol-texto">
          <strong>Rosa Huamán</strong>
          <InsigniaRol rol="operador" />
        </span>
        <span className="pc-vista-permisos">
          <i className="bi bi-pencil" />
          <i className="bi bi-trash3 pc-vista-bloqueado" />
        </span>
      </li>
      <li>
        <span className="pc-avatar">J</span>
        <span className="pc-vista-rol-texto">
          <strong>Jorge Quispe</strong>
          <InsigniaRol rol="jefe" />
        </span>
        <span className="pc-vista-permisos">
          <i className="bi bi-pencil" />
          <i className="bi bi-trash3" />
          <i className="bi bi-people" />
        </span>
      </li>
      <li className="pc-vista-rol-inactivo">
        <span className="pc-avatar">L</span>
        <span className="pc-vista-rol-texto">
          <strong>Luis Ramos</strong>
          <InsigniaRol rol="operador" />
        </span>
        <span className="pc-vista-permisos">
          <span className="pc-vista-desactivada">Cuenta desactivada</span>
        </span>
      </li>
    </ul>
  )
}

export default Modulos
