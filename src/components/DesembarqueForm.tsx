import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FocusEvent,
  type MouseEvent,
  type ReactNode,
  type SubmitEvent,
} from 'react'
import {
  ARTES_PESCA,
  CAPITANIA_POR_PUERTO,
  DESEMBARQUE_VACIO,
  DESTINOS,
  ESPECIES,
  ESTADOS,
  LARGO_EMBARCACION,
  PUERTOS,
  TONELADAS_MAXIMAS,
  perteneceACatalogo,
} from '../constants/desembarques.ts'
import type {
  CampoDesembarque,
  DesembarqueEditable,
  ErroresDesembarque,
} from '../types/desembarque.ts'
import { colorEspecie, slugEspecie } from '../utils/colores.ts'
import { formatearPrecio, hoyISO } from '../utils/formato.ts'
import { validarDesembarque } from '../utils/validarDesembarque.ts'
import AlertMessage from './AlertMessage.tsx'
import TarjetaDesembarque from './TarjetaDesembarque.tsx'
import { Tecla } from './Tecla.tsx'

/** Orden de los campos en pantalla: define cuál es el "primer campo inválido". */
const ORDEN_CAMPOS: readonly CampoDesembarque[] = [
  'codigo',
  'embarcacion',
  'matricula',
  'especie',
  'artePesca',
  'toneladas',
  'precioTonelada',
  'puerto',
  'fechaDesembarque',
  'destino',
  'estado',
]

/** Campos que se escriben siempre en mayúsculas. */
const EN_MAYUSCULAS: readonly CampoDesembarque[] = ['codigo', 'matricula']

/** Número escrito con punto decimal (el mismo criterio que usa la validación). */
const PATRON_NUMERO = /^\d+(\.\d+)?$/

/** Valores del formulario: en los inputs, toneladas y precio siempre son texto. */
interface ValoresFormulario extends DesembarqueEditable {
  toneladas: string
  precioTonelada: string
}

/** Campos que se eligen entre opciones (grupos de radios). */
type CampoOpciones = 'especie' | 'artePesca' | 'destino' | 'estado'

/** Forma de un grupo de opciones. */
type VarianteOpciones = 'especie' | 'chip' | 'segmentado'

/** Texto de ayuda bajo un campo, con el id que lo enlaza por aria-describedby. */
interface AyudaCampo {
  id: string
  texto: string
}

/** Indica si el atributo name de un input corresponde a un campo del formulario. */
const esCampo = (nombre: string): nombre is CampoDesembarque =>
  perteneceACatalogo(ORDEN_CAMPOS, nombre)

/** Texto para un input: vacío si no hay valor. */
const aTexto = (valor: unknown): string =>
  valor === undefined || valor === null ? '' : String(valor)

/** Convierte un desembarque (de la API o un borrador) en valores de texto para los inputs. */
function aValoresFormulario(
  desembarque: Partial<DesembarqueEditable> | null | undefined,
): ValoresFormulario {
  const datos = desembarque ?? {}
  return {
    codigo: aTexto(datos.codigo),
    embarcacion: aTexto(datos.embarcacion),
    matricula: aTexto(datos.matricula),
    especie: datos.especie ?? '',
    artePesca: datos.artePesca ?? '',
    toneladas: aTexto(datos.toneladas),
    precioTonelada: aTexto(datos.precioTonelada),
    puerto: datos.puerto ?? '',
    fechaDesembarque: aTexto(datos.fechaDesembarque),
    destino: datos.destino ?? '',
    estado: datos.estado || DESEMBARQUE_VACIO.estado,
  }
}

/** Siguiente código libre (DSB-001, DSB-002...) a partir de los códigos ya registrados. */
function sugerirCodigo(codigosExistentes: readonly string[]): string {
  const usados = new Set(codigosExistentes.map((codigo) => String(codigo).toUpperCase()))
  const mayor = Math.max(
    0,
    ...[...usados].map((codigo) => Number(/^DSB-(\d{3})$/.exec(codigo)?.[1] ?? 0)),
  )
  for (let numero = mayor + 1; numero < 1000; numero += 1) {
    const codigo = `DSB-${String(numero).padStart(3, '0')}`
    if (!usados.has(codigo)) return codigo
  }
  return ''
}

/** Identificador seguro para un id de HTML a partir de una opción con tildes o espacios. */
const idOpcion = (campo: string, opcion: string) =>
  `desembarque-${campo}-${opcion.normalize('NFD').replace(/[^\w]/g, '').toLowerCase()}`

/** Propiedades de `DesembarqueForm`. */
interface PropsDesembarqueForm {
  /** Valores con los que se rellena el formulario. */
  desembarqueInicial?: Partial<DesembarqueEditable>
  /** Recibe los datos válidos; si devuelve `true`, el formulario se limpia. */
  onSubmit: (desembarque: ValoresFormulario) => Promise<boolean> | boolean
  /** Texto del botón principal. */
  textoBoton?: string
  /** Deshabilita el formulario y muestra un spinner. */
  cargando?: boolean
  /** Códigos ya usados (para validar unicidad). */
  codigosExistentes?: readonly string[]
  /** Avisa cada cambio (ej. para guardar un borrador). */
  onCambio?: (valores: ValoresFormulario) => void
  /** Si se pasa, muestra el botón "Cancelar". */
  onCancel?: () => void
}

/**
 * Formulario controlado de desembarque, reutilizable para registrar y editar.
 * La página que lo usa decide qué hacer con los datos: se comunica solo por props.
 */
function DesembarqueForm({
  desembarqueInicial = DESEMBARQUE_VACIO,
  onSubmit,
  textoBoton = 'Guardar desembarque',
  cargando = false,
  codigosExistentes = [],
  onCambio,
  onCancel,
}: PropsDesembarqueForm) {
  const [valores, setValores] = useState(() => aValoresFormulario(desembarqueInicial))
  const [errores, setErrores] = useState<ErroresDesembarque>({})
  const [tocados, setTocados] = useState<Partial<Record<CampoDesembarque, boolean>>>({})
  const [intentoEnvio, setIntentoEnvio] = useState(false)
  const hoy = hoyISO()

  // useRef guarda referencias a elementos del DOM sin provocar renders:
  // codigoRef enfoca "Código" al montar y tras limpiar/guardar; formRef permite
  // enfocar el primer campo inválido por su atributo name al enviar con errores
  // y enviar el formulario con Ctrl+S.
  const codigoRef = useRef<HTMLInputElement>(null)
  const formRef = useRef<HTMLFormElement>(null)
  // Marca pendiente: el foco se mueve cuando el formulario ya no está deshabilitado.
  const enfocarCodigoRef = useRef(false)

  useEffect(() => {
    codigoRef.current?.focus()
  }, [])

  useEffect(() => {
    if (enfocarCodigoRef.current && !cargando) {
      enfocarCodigoRef.current = false
      codigoRef.current?.focus()
    }
  })

  // Ctrl+S (⌘S en macOS) guarda el formulario desde cualquier campo.
  useEffect(() => {
    function manejarTecla(evento: KeyboardEvent) {
      if ((evento.ctrlKey || evento.metaKey) && evento.key.toLowerCase() === 's') {
        evento.preventDefault()
        formRef.current?.requestSubmit()
      }
    }
    window.addEventListener('keydown', manejarTecla)
    return () => window.removeEventListener('keydown', manejarTecla)
  }, [])

  // Si la página cambia el desembarque inicial (ej. termina de cargar en modo edición), se
  // rellena. Se ajusta el estado durante el render, como recomienda React, sin un efecto.
  const [inicialPrevio, setInicialPrevio] = useState(desembarqueInicial)
  if (desembarqueInicial !== inicialPrevio) {
    setInicialPrevio(desembarqueInicial)
    setValores(aValoresFormulario(desembarqueInicial))
    setErrores({})
    setTocados({})
    setIntentoEnvio(false)
  }

  const validar = (datos: ValoresFormulario) =>
    validarDesembarque(datos, { codigosExistentes, hoy })

  /** Cambia un campo y revalida si ya se mostró su estado. */
  function cambiarCampo(name: CampoDesembarque, value: string) {
    const limpio = EN_MAYUSCULAS.includes(name) ? value.toUpperCase() : value
    const nuevos = { ...valores, [name]: limpio }
    setValores(nuevos)
    onCambio?.(nuevos)
    if (tocados[name] || intentoEnvio) setErrores(validar(nuevos))
  }

  // onChange genérico: sirve para todos los campos (textos, selects, fecha y radios)
  // gracias a su atributo name.
  function manejarCambio(evento: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = evento.target
    if (esCampo(name)) cambiarCampo(name, value)
  }

  function manejarBlur(evento: FocusEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name } = evento.target
    setTocados((anteriores) => ({ ...anteriores, [name]: true }))
    setErrores(validar(valores))
  }

  /** Cambia un campo desde un botón (sugerencias, stepper) y lo da por revisado. */
  function marcarYCambiar(name: CampoDesembarque, value: string) {
    setTocados((anteriores) => ({ ...anteriores, [name]: true }))
    const nuevos = { ...valores, [name]: value }
    setValores(nuevos)
    onCambio?.(nuevos)
    setErrores(validar(nuevos))
  }

  const toneladasActuales = PATRON_NUMERO.test(valores.toneladas.trim())
    ? Number(valores.toneladas)
    : 0

  function ajustarToneladas(delta: number) {
    const nuevo = Math.min(TONELADAS_MAXIMAS, Math.max(0, toneladasActuales + delta))
    marcarYCambiar('toneladas', String(Math.round(nuevo * 100) / 100))
  }

  function limpiar() {
    setValores(aValoresFormulario(DESEMBARQUE_VACIO))
    setErrores({})
    setTocados({})
    setIntentoEnvio(false)
    onCambio?.(aValoresFormulario(DESEMBARQUE_VACIO))
    enfocarCodigoRef.current = true
  }

  async function manejarEnvio(evento: SubmitEvent<HTMLFormElement>) {
    evento.preventDefault()
    if (cargando) return
    const encontrados = validar(valores)
    setErrores(encontrados)
    setIntentoEnvio(true)

    const primerInvalido = ORDEN_CAMPOS.find((campo) => encontrados[campo])
    if (primerInvalido) {
      const elemento = formRef.current?.elements.namedItem(primerInvalido)
      // Los grupos de opciones (especie, arte, destino, estado) devuelven una lista de radios.
      const destino = elemento instanceof RadioNodeList ? elemento[0] : elemento
      if (destino instanceof HTMLElement) destino.focus()
      return
    }

    const exito = await onSubmit({ ...valores })
    if (exito === true) limpiar()
  }

  // Evita que el blur del último campo muestre un error, desplace el botón y se pierda el clic.
  const evitarBlurPrevio = (evento: MouseEvent<HTMLButtonElement>) => evento.preventDefault()

  const mostrar = (campo: CampoDesembarque) => Boolean(tocados[campo] || intentoEnvio)
  const clase = (campo: CampoDesembarque) => {
    if (!mostrar(campo)) return ''
    return errores[campo] ? 'is-invalid' : 'is-valid'
  }
  const describir = (campo: CampoDesembarque, ayuda?: string) =>
    [ayuda, mostrar(campo) && errores[campo] ? `desembarque-${campo}-error` : null]
      .filter(Boolean)
      .join(' ') || undefined
  const propsCampo = (campo: CampoDesembarque, ayuda?: string) => ({
    id: `desembarque-${campo}`,
    name: campo,
    value: valores[campo],
    onChange: manejarCambio,
    onBlur: manejarBlur,
    'aria-invalid': mostrar(campo) && Boolean(errores[campo]),
    'aria-describedby': describir(campo, ayuda),
  })
  const error = (campo: CampoDesembarque, enBloque = false): ReactNode =>
    mostrar(campo) && errores[campo] ? (
      <div
        id={`desembarque-${campo}-error`}
        className={`invalid-feedback ${enBloque ? 'd-block' : ''}`}
      >
        {errores[campo]}
      </div>
    ) : null

  /** Grupo de radios con aspecto de botón; `variante` decide su forma. */
  const grupoOpciones = (
    campo: CampoOpciones,
    etiqueta: string,
    opciones: readonly string[],
    variante: VarianteOpciones,
    ayuda?: AyudaCampo,
  ) => (
    <fieldset
      className={`pc-grupo ${mostrar(campo) && errores[campo] ? 'pc-grupo-invalido' : ''}`}
      aria-describedby={describir(campo, ayuda?.id)}
    >
      <legend className="form-label">{etiqueta}</legend>
      <div className={`pc-opciones pc-opciones-${variante}`}>
        {opciones.map((opcion) => {
          const id = idOpcion(campo, opcion)
          const esEspecie = variante === 'especie'
          return (
            <span
              key={opcion}
              className="pc-opcion"
              data-especie={esEspecie ? slugEspecie(opcion) : undefined}
              style={esEspecie ? { '--especie': colorEspecie(opcion) } : undefined}
            >
              <input
                type="radio"
                className={`btn-check ${clase(campo)}`}
                id={id}
                name={campo}
                value={opcion}
                checked={valores[campo] === opcion}
                onChange={manejarCambio}
                onBlur={manejarBlur}
                aria-invalid={mostrar(campo) && Boolean(errores[campo])}
              />
              <label
                htmlFor={id}
                className={esEspecie ? 'pc-opcion-especie' : `pc-opcion-${variante}-boton`}
              >
                {esEspecie && <span className="pc-insignia pc-insignia-punto" aria-hidden="true" />}
                {opcion}
              </label>
            </span>
          )
        })}
      </div>
      {ayuda && (
        <div id={ayuda.id} className="form-text">
          {ayuda.texto}
        </div>
      )}
      {error(campo, true)}
    </fieldset>
  )

  const cantidadErrores = Object.keys(errores).length
  const mensajeErrores =
    intentoEnvio && cantidadErrores > 0
      ? `Revisa el formulario: ${cantidadErrores === 1 ? 'hay 1 campo' : `hay ${cantidadErrores} campos`} por corregir.`
      : ''

  const codigoSugerido = !valores.codigo ? sugerirCodigo(codigosExistentes) : ''
  const capitania = valores.puerto ? CAPITANIA_POR_PUERTO[valores.puerto] : ''
  const prefijoSugerido = capitania && valores.matricula.trim().length < 3 ? `${capitania}-` : ''

  const precio = PATRON_NUMERO.test(valores.precioTonelada.trim())
    ? Number(valores.precioTonelada)
    : 0
  const valorEstimado = toneladasActuales > 0 && precio > 0 ? toneladasActuales * precio : null

  return (
    <form ref={formRef} onSubmit={manejarEnvio} noValidate className="pc-formulario">
      <AlertMessage tipo="danger" mensaje={mensajeErrores} />

      <div className="pc-formulario-rejilla">
        <fieldset disabled={cargando} className="pc-formulario-campos">
          <legend className="visually-hidden">Datos del desembarque</legend>

          <section className="pc-seccion" aria-labelledby="seccion-embarcacion">
            <h3 id="seccion-embarcacion" className="pc-seccion-titulo">
              <i className="bi bi-life-preserver" aria-hidden="true" />
              Embarcación
            </h3>
            <div className="row g-3">
              <div className="col-sm-4">
                <label htmlFor="desembarque-codigo" className="form-label">
                  Código
                </label>
                <input
                  ref={codigoRef}
                  type="text"
                  className={`form-control pc-input-codigo ${clase('codigo')}`}
                  placeholder="Ej. DSB-017"
                  maxLength={7}
                  autoComplete="off"
                  spellCheck={false}
                  {...propsCampo('codigo', 'desembarque-codigo-ayuda')}
                />
                {error('codigo')}
                <div id="desembarque-codigo-ayuda" className="form-text">
                  {codigoSugerido ? (
                    <>
                      Siguiente libre:{' '}
                      <button
                        type="button"
                        className="pc-enlace-boton"
                        onMouseDown={evitarBlurPrevio}
                        onClick={() => marcarYCambiar('codigo', codigoSugerido)}
                      >
                        usar {codigoSugerido}
                      </button>
                    </>
                  ) : (
                    'DSB, guion y 3 números.'
                  )}
                </div>
              </div>
              <div className="col-sm-8">
                <label htmlFor="desembarque-embarcacion" className="form-label">
                  Nombre de la embarcación
                </label>
                <input
                  type="text"
                  className={`form-control ${clase('embarcacion')}`}
                  placeholder="Ej. Don Lucho II"
                  maxLength={LARGO_EMBARCACION.maximo}
                  autoComplete="off"
                  {...propsCampo('embarcacion', 'desembarque-embarcacion-ayuda')}
                />
                {error('embarcacion')}
                <div
                  id="desembarque-embarcacion-ayuda"
                  className="form-text d-flex justify-content-between gap-2"
                >
                  <span>
                    Entre {LARGO_EMBARCACION.minimo} y {LARGO_EMBARCACION.maximo} caracteres.
                  </span>
                  <span className="pc-cifras-tabla" aria-hidden="true">
                    {valores.embarcacion.trim().length}/{LARGO_EMBARCACION.maximo}
                  </span>
                </div>
              </div>
              <div className="col-sm-6">
                <label htmlFor="desembarque-matricula" className="form-label">
                  Matrícula
                </label>
                <input
                  type="text"
                  className={`form-control pc-input-codigo ${clase('matricula')}`}
                  placeholder="Ej. CE-21345-CM"
                  maxLength={11}
                  autoComplete="off"
                  spellCheck={false}
                  {...propsCampo('matricula', 'desembarque-matricula-ayuda')}
                />
                {error('matricula')}
                <div id="desembarque-matricula-ayuda" className="form-text">
                  {!(mostrar('matricula') && errores.matricula) &&
                    'Capitanía, guion, 5 números, guion y tipo (CE-21345-CM).'}
                  {prefijoSugerido && (
                    <>
                      {' '}
                      Capitanía de {valores.puerto}:{' '}
                      <button
                        type="button"
                        className="pc-enlace-boton"
                        onMouseDown={evitarBlurPrevio}
                        onClick={() => {
                          cambiarCampo('matricula', prefijoSugerido)
                          const matricula = formRef.current?.elements.namedItem('matricula')
                          if (matricula instanceof HTMLElement) matricula.focus()
                        }}
                      >
                        empezar con {prefijoSugerido}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </section>

          <section className="pc-seccion" aria-labelledby="seccion-captura">
            <h3 id="seccion-captura" className="pc-seccion-titulo">
              <i className="bi bi-water" aria-hidden="true" />
              Captura
            </h3>
            <div className="d-grid gap-4">
              {grupoOpciones('especie', 'Especie', ESPECIES, 'especie')}
              {grupoOpciones('artePesca', 'Arte de pesca', ARTES_PESCA, 'chip')}
              <div className="row g-3">
                <div className="col-sm-6">
                  <label htmlFor="desembarque-toneladas" className="form-label">
                    Toneladas
                  </label>
                  <div className="input-group has-validation pc-stepper">
                    <button
                      type="button"
                      className="btn"
                      onClick={() => ajustarToneladas(-1)}
                      disabled={cargando || !(toneladasActuales > 0)}
                      aria-label="Restar una tonelada"
                    >
                      <i className="bi bi-dash-lg" aria-hidden="true" />
                    </button>
                    <input
                      type="text"
                      inputMode="decimal"
                      className={`form-control text-center pc-cifras-tabla ${clase('toneladas')}`}
                      placeholder="312.40"
                      autoComplete="off"
                      {...propsCampo('toneladas', 'desembarque-toneladas-ayuda')}
                    />
                    <span className="input-group-text pc-sufijo">t</span>
                    <button
                      type="button"
                      className="btn"
                      onClick={() => ajustarToneladas(1)}
                      disabled={cargando || toneladasActuales >= TONELADAS_MAXIMAS}
                      aria-label="Sumar una tonelada"
                    >
                      <i className="bi bi-plus-lg" aria-hidden="true" />
                    </button>
                    {error('toneladas')}
                  </div>
                  <div id="desembarque-toneladas-ayuda" className="form-text">
                    Hasta {TONELADAS_MAXIMAS.toLocaleString('es-PE')} t, con punto decimal.
                  </div>
                </div>
                <div className="col-sm-6">
                  <label htmlFor="desembarque-precioTonelada" className="form-label">
                    Precio por tonelada
                  </label>
                  <div className="input-group has-validation">
                    <span className="input-group-text pc-prefijo">S/</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      className={`form-control pc-cifras-tabla ${clase('precioTonelada')}`}
                      placeholder="1850.00"
                      autoComplete="off"
                      {...propsCampo('precioTonelada')}
                    />
                    {error('precioTonelada')}
                  </div>
                </div>
              </div>
              <p className="pc-valor-estimado" aria-live="polite">
                <span className="pc-valor-estimado-etiqueta">Valor estimado</span>
                <span className="pc-valor-estimado-cifra">
                  {valorEstimado === null ? 'S/ —' : formatearPrecio(valorEstimado)}
                </span>
                <span className="pc-valor-estimado-nota">toneladas × precio por tonelada</span>
              </p>
            </div>
          </section>

          <section className="pc-seccion" aria-labelledby="seccion-operacion">
            <h3 id="seccion-operacion" className="pc-seccion-titulo">
              <i className="bi bi-signpost-split" aria-hidden="true" />
              Operación
            </h3>
            <div className="d-grid gap-4">
              <div className="row g-3">
                <div className="col-sm-6">
                  <label htmlFor="desembarque-puerto" className="form-label">
                    Puerto de desembarque
                  </label>
                  <select
                    className={`form-select ${clase('puerto')}`}
                    {...propsCampo('puerto', 'desembarque-puerto-ayuda')}
                  >
                    <option value="">Selecciona un puerto</option>
                    {PUERTOS.map((puerto) => (
                      <option key={puerto} value={puerto}>
                        {puerto}
                      </option>
                    ))}
                  </select>
                  {error('puerto')}
                  <div id="desembarque-puerto-ayuda" className="form-text">
                    De norte a sur.
                  </div>
                </div>
                <div className="col-sm-6">
                  <label htmlFor="desembarque-fechaDesembarque" className="form-label">
                    Fecha de desembarque
                  </label>
                  <input
                    type="date"
                    className={`form-control ${clase('fechaDesembarque')}`}
                    max={hoy}
                    {...propsCampo('fechaDesembarque', 'desembarque-fecha-ayuda')}
                  />
                  {error('fechaDesembarque')}
                  <div id="desembarque-fecha-ayuda" className="form-text">
                    Hoy o una fecha anterior.
                  </div>
                </div>
              </div>
              {grupoOpciones('destino', 'Destino de la captura', DESTINOS, 'chip')}
              {grupoOpciones('estado', 'Estado', ESTADOS, 'segmentado', {
                id: 'desembarque-estado-ayuda',
                texto: 'Observado y En descarga aparecen en «Requieren atención».',
              })}
            </div>
          </section>
        </fieldset>

        <aside className="pc-vista-previa" aria-label="Vista previa de la tarjeta">
          <p className="pc-vista-previa-titulo" aria-hidden="true">
            Así se verá en Desembarques
          </p>
          <div aria-hidden="true">
            <TarjetaDesembarque desembarque={valores} vistaPrevia />
          </div>
        </aside>
      </div>

      <div className="pc-formulario-acciones">
        <button
          type="submit"
          onMouseDown={evitarBlurPrevio}
          className="btn btn-primary pc-boton-guardar"
          disabled={cargando}
          aria-keyshortcuts="Control+S"
        >
          {cargando ? (
            <span className="spinner-border spinner-border-sm" aria-hidden="true" />
          ) : (
            <i className="bi bi-check2" aria-hidden="true" />
          )}
          <span>{cargando ? 'Guardando...' : textoBoton}</span>
          {!cargando && (
            <Tecla mod className="pc-tecla-en-boton d-none d-md-inline-flex">
              S
            </Tecla>
          )}
        </button>
        <button
          type="button"
          className="btn btn-outline-secondary d-inline-flex align-items-center gap-2"
          onMouseDown={evitarBlurPrevio}
          onClick={limpiar}
          disabled={cargando}
        >
          <i className="bi bi-eraser" aria-hidden="true" />
          Limpiar
        </button>
        {onCancel && (
          <button
            type="button"
            className="btn btn-link link-secondary ms-md-auto"
            onClick={onCancel}
            disabled={cargando}
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  )
}

export default DesembarqueForm
