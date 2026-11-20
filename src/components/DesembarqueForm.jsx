import { useEffect, useRef, useState } from 'react'
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
} from '../constants/desembarques.js'
import { colorEspecie, slugEspecie } from '../utils/colores.js'
import { formatearPrecio, hoyISO } from '../utils/formato.js'
import { validarDesembarque } from '../utils/validarDesembarque.js'
import AlertMessage from './AlertMessage.jsx'
import TarjetaDesembarque from './TarjetaDesembarque.jsx'
import { Tecla } from './Tecla.jsx'

/** Orden de los campos en pantalla: define cuál es el "primer campo inválido". */
const ORDEN_CAMPOS = [
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
const EN_MAYUSCULAS = ['codigo', 'matricula']

/** Número escrito con punto decimal (el mismo criterio que usa la validación). */
const PATRON_NUMERO = /^\d+(\.\d+)?$/

/** Convierte un desembarque (de la API o un borrador) en valores de texto para los inputs. */
function aValoresFormulario(desembarque) {
  const valores = { ...DESEMBARQUE_VACIO }
  for (const campo of ORDEN_CAMPOS) {
    const valor = desembarque?.[campo]
    valores[campo] = valor === undefined || valor === null ? '' : String(valor)
  }
  if (!valores.estado) valores.estado = DESEMBARQUE_VACIO.estado
  return valores
}

/** Siguiente código libre (DSB-001, DSB-002...) a partir de los códigos ya registrados. */
function sugerirCodigo(codigosExistentes) {
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
const idOpcion = (campo, opcion) =>
  `desembarque-${campo}-${opcion.normalize('NFD').replace(/[^\w]/g, '').toLowerCase()}`

/**
 * Formulario controlado de desembarque, reutilizable para registrar y editar.
 * La página que lo usa decide qué hacer con los datos: se comunica solo por props.
 *
 * @param {object} props
 * @param {object} [props.desembarqueInicial] Valores con los que se rellena el formulario.
 * @param {(desembarque: object) => Promise<boolean>|boolean} props.onSubmit Recibe los datos
 *   válidos; si devuelve `true`, el formulario se limpia.
 * @param {string} [props.textoBoton] Texto del botón principal.
 * @param {boolean} [props.cargando] Deshabilita el formulario y muestra un spinner.
 * @param {string[]} [props.codigosExistentes] Códigos ya usados (para validar unicidad).
 * @param {(valores: object) => void} [props.onCambio] Avisa cada cambio (ej. para guardar un borrador).
 * @param {() => void} [props.onCancel] Si se pasa, muestra el botón "Cancelar".
 */
function DesembarqueForm({
  desembarqueInicial = DESEMBARQUE_VACIO,
  onSubmit,
  textoBoton = 'Guardar desembarque',
  cargando = false,
  codigosExistentes = [],
  onCambio,
  onCancel,
}) {
  const [valores, setValores] = useState(() => aValoresFormulario(desembarqueInicial))
  const [errores, setErrores] = useState({})
  const [tocados, setTocados] = useState({})
  const [intentoEnvio, setIntentoEnvio] = useState(false)
  const hoy = hoyISO()

  // useRef guarda referencias a elementos del DOM sin provocar renders:
  // codigoRef enfoca "Código" al montar y tras limpiar/guardar; formRef permite
  // enfocar el primer campo inválido por su atributo name al enviar con errores
  // y enviar el formulario con Ctrl+S.
  const codigoRef = useRef(null)
  const formRef = useRef(null)
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
    function manejarTecla(evento) {
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

  const validar = (datos) => validarDesembarque(datos, { codigosExistentes, hoy })

  /** Cambia un campo y revalida si ya se mostró su estado. */
  function cambiarCampo(name, value) {
    const limpio = EN_MAYUSCULAS.includes(name) ? value.toUpperCase() : value
    const nuevos = { ...valores, [name]: limpio }
    setValores(nuevos)
    onCambio?.(nuevos)
    if (tocados[name] || intentoEnvio) setErrores(validar(nuevos))
  }

  // onChange genérico: sirve para todos los campos (textos, selects, fecha y radios)
  // gracias a su atributo name.
  function manejarCambio(evento) {
    const { name, value } = evento.target
    cambiarCampo(name, value)
  }

  function manejarBlur(evento) {
    const { name } = evento.target
    setTocados((anteriores) => ({ ...anteriores, [name]: true }))
    setErrores(validar(valores))
  }

  /** Cambia un campo desde un botón (sugerencias, stepper) y lo da por revisado. */
  function marcarYCambiar(name, value) {
    setTocados((anteriores) => ({ ...anteriores, [name]: true }))
    const nuevos = { ...valores, [name]: value }
    setValores(nuevos)
    onCambio?.(nuevos)
    setErrores(validar(nuevos))
  }

  const toneladasActuales = PATRON_NUMERO.test(valores.toneladas.trim())
    ? Number(valores.toneladas)
    : 0

  function ajustarToneladas(delta) {
    const nuevo = Math.min(TONELADAS_MAXIMAS, Math.max(0, toneladasActuales + delta))
    marcarYCambiar('toneladas', String(Math.round(nuevo * 100) / 100))
  }

  function limpiar() {
    setValores({ ...DESEMBARQUE_VACIO })
    setErrores({})
    setTocados({})
    setIntentoEnvio(false)
    onCambio?.({ ...DESEMBARQUE_VACIO })
    enfocarCodigoRef.current = true
  }

  async function manejarEnvio(evento) {
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
      destino?.focus()
      return
    }

    const exito = await onSubmit?.({ ...valores })
    if (exito === true) limpiar()
  }

  // Evita que el blur del último campo muestre un error, desplace el botón y se pierda el clic.
  const evitarBlurPrevio = (evento) => evento.preventDefault()

  const mostrar = (campo) => Boolean(tocados[campo] || intentoEnvio)
  const clase = (campo) => {
    if (!mostrar(campo)) return ''
    return errores[campo] ? 'is-invalid' : 'is-valid'
  }
  const describir = (campo, ayuda) =>
    [ayuda, mostrar(campo) && errores[campo] ? `desembarque-${campo}-error` : null]
      .filter(Boolean)
      .join(' ') || undefined
  const propsCampo = (campo, ayuda) => ({
    id: `desembarque-${campo}`,
    name: campo,
    value: valores[campo],
    onChange: manejarCambio,
    onBlur: manejarBlur,
    'aria-invalid': mostrar(campo) && Boolean(errores[campo]),
    'aria-describedby': describir(campo, ayuda),
  })
  const error = (campo, enBloque = false) =>
    mostrar(campo) && errores[campo] ? (
      <div
        id={`desembarque-${campo}-error`}
        className={`invalid-feedback ${enBloque ? 'd-block' : ''}`}
      >
        {errores[campo]}
      </div>
    ) : null

  /** Grupo de radios con aspecto de botón; `variante` decide su forma. */
  const grupoOpciones = (campo, etiqueta, opciones, variante, ayuda) => (
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
  const capitania = CAPITANIA_POR_PUERTO[valores.puerto]
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
                          formRef.current?.elements.namedItem('matricula')?.focus()
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
