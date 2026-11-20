import {
  DESTINOS,
  ESPECIES,
  ESTADOS,
  ESTADOS_ATENCION,
  PUERTOS,
} from '../constants/desembarques.js'

// Cálculos sobre la lista de desembarques compartidos por Inicio, Lista, la barra lateral y
// la paleta de comandos. Funciones puras: no llaman a la API ni modifican los desembarques
// (salvo `avisarCambioOperaciones`, que solo emite un evento de ventana).

/** Cantidad de desembarques que devuelve `resumirOperaciones` en `recientes`. */
export const CANTIDAD_RECIENTES = 5

const PATRON_FECHA = /^\d{4}-\d{2}-\d{2}$/

/** Número finito o 0 (para no propagar NaN en sumas). */
const numero = (valor) => {
  const convertido = Number(valor)
  return valor !== null && valor !== '' && Number.isFinite(convertido) ? convertido : 0
}

/** Redondeo a 2 decimales para evitar ruido de coma flotante en totales. */
const redondear2 = (valor) => Math.round(valor * 100) / 100

const comoLista = (lista) => (Array.isArray(lista) ? lista : [])

/** Minúsculas y sin tildes, para que "senor" encuentre "Señor de Sipán". */
export const normalizarTexto = (texto) =>
  String(texto ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()

/**
 * Valor comercial del desembarque en soles: toneladas × precio por tonelada.
 * @param {object} desembarque
 * @returns {number} Redondeado a céntimos; 0 si faltan datos numéricos.
 */
export function valorDesembarque(desembarque) {
  return redondear2(numero(desembarque?.toneladas) * numero(desembarque?.precioTonelada))
}

/**
 * Indica si el desembarque requiere seguimiento (estado Observado o En descarga).
 * @param {object} desembarque
 * @returns {boolean}
 */
export const requiereAtencion = (desembarque) => ESTADOS_ATENCION.includes(desembarque?.estado)

/** Agrupa toneladas y cantidad por cada valor de un catálogo, en el orden del catálogo. */
function agruparPor(lista, campo, catalogo, toneladasTotales) {
  return catalogo.map((clave) => {
    const grupo = lista.filter((desembarque) => desembarque[campo] === clave)
    const toneladas = redondear2(grupo.reduce((total, d) => total + numero(d.toneladas), 0))
    return {
      [campo]: clave,
      desembarques: grupo.length,
      toneladas,
      porcentaje: toneladasTotales > 0 ? Math.round((toneladas / toneladasTotales) * 1000) / 10 : 0,
    }
  })
}

/**
 * Resume las operaciones para el panel de inicio y la barra lateral.
 * Los grupos `porEspecie`, `porPuerto` y `porDestino` incluyen todos los valores del
 * catálogo (también los que tienen 0 t), en el orden del catálogo; `porcentaje` es la
 * participación en toneladas (0–100, con 1 decimal).
 *
 * @param {object[]} desembarques
 * @returns {{
 *   total: number,
 *   toneladas: number,
 *   valor: number,
 *   observados: number,
 *   enDescarga: number,
 *   atencion: object[],
 *   porEspecie: { especie: string, desembarques: number, toneladas: number, porcentaje: number }[],
 *   porPuerto: { puerto: string, desembarques: number, toneladas: number, porcentaje: number }[],
 *   porDestino: { destino: string, desembarques: number, toneladas: number, porcentaje: number }[],
 *   porEstado: Record<string, number>,
 *   recientes: object[],
 * }}
 */
export function resumirOperaciones(desembarques) {
  const lista = comoLista(desembarques)
  const toneladas = redondear2(lista.reduce((total, d) => total + numero(d.toneladas), 0))
  const valor = redondear2(lista.reduce((total, d) => total + valorDesembarque(d), 0))

  const porEstado = Object.fromEntries(ESTADOS.map((estado) => [estado, 0]))
  for (const desembarque of lista) {
    if (desembarque.estado in porEstado) porEstado[desembarque.estado] += 1
  }

  return {
    total: lista.length,
    toneladas,
    valor,
    observados: porEstado.Observado,
    enDescarga: porEstado['En descarga'],
    atencion: ordenarDesembarques(lista.filter(requiereAtencion), 'fecha-desc'),
    porEspecie: agruparPor(lista, 'especie', ESPECIES, toneladas),
    porPuerto: agruparPor(lista, 'puerto', PUERTOS, toneladas),
    porDestino: agruparPor(lista, 'destino', DESTINOS, toneladas),
    porEstado,
    recientes: ordenarDesembarques(lista, 'fecha-desc').slice(0, CANTIDAD_RECIENTES),
  }
}

/** Órdenes disponibles para la lista, con su etiqueta. El primero es el predeterminado. */
export const ORDENES = Object.freeze([
  Object.freeze({ valor: 'fecha-desc', texto: 'Más recientes primero' }),
  Object.freeze({ valor: 'fecha-asc', texto: 'Más antiguos primero' }),
  Object.freeze({ valor: 'toneladas-desc', texto: 'Toneladas: mayor a menor' }),
  Object.freeze({ valor: 'toneladas-asc', texto: 'Toneladas: menor a mayor' }),
  Object.freeze({ valor: 'valor-desc', texto: 'Valor: mayor a menor' }),
  Object.freeze({ valor: 'embarcacion-asc', texto: 'Embarcación (A–Z)' }),
  Object.freeze({ valor: 'codigo-asc', texto: 'Código' }),
])

/** Orden que se usa cuando no se indica uno o el indicado no existe. */
export const ORDEN_PREDETERMINADO = 'fecha-desc'

/**
 * Devuelve el orden si es uno de `ORDENES`; si no, el predeterminado. Útil para leer el
 * orden desde la URL sin confiar en su contenido.
 * @param {string} valor
 * @returns {string}
 */
export const ordenValido = (valor) =>
  ORDENES.some((orden) => orden.valor === valor) ? valor : ORDEN_PREDETERMINADO

const compararTexto = (a, b) =>
  String(a ?? '').localeCompare(String(b ?? ''), 'es', { numeric: true, sensitivity: 'base' })

const compararCodigo = (a, b) => compararTexto(a.codigo, b.codigo)

const COMPARADORES = {
  'fecha-desc': (a, b) =>
    compararTexto(b.fechaDesembarque, a.fechaDesembarque) || compararCodigo(b, a),
  'fecha-asc': (a, b) =>
    compararTexto(a.fechaDesembarque, b.fechaDesembarque) || compararCodigo(a, b),
  'toneladas-desc': (a, b) => numero(b.toneladas) - numero(a.toneladas) || compararCodigo(a, b),
  'toneladas-asc': (a, b) => numero(a.toneladas) - numero(b.toneladas) || compararCodigo(a, b),
  'valor-desc': (a, b) => valorDesembarque(b) - valorDesembarque(a) || compararCodigo(a, b),
  'embarcacion-asc': (a, b) => compararTexto(a.embarcacion, b.embarcacion) || compararCodigo(a, b),
  'codigo-asc': compararCodigo,
}

/**
 * Ordena una copia de los desembarques. Un orden desconocido se trata como `fecha-desc`.
 * Los empates se resuelven por código para que el resultado sea estable.
 * @param {object[]} desembarques
 * @param {string} [orden] Uno de los valores de `ORDENES`.
 * @returns {object[]} Nueva lista ordenada.
 */
export function ordenarDesembarques(desembarques, orden = ORDEN_PREDETERMINADO) {
  return [...comoLista(desembarques)].sort(COMPARADORES[ordenValido(orden)])
}

/**
 * Filtra desembarques. Todos los criterios son opcionales y se combinan con "y".
 * - `q`: texto libre, sin distinguir mayúsculas ni tildes, sobre código, embarcación o matrícula.
 * - `especie`, `puerto`, `estado`: coincidencia exacta con el catálogo.
 * - `desde`, `hasta`: fechas `YYYY-MM-DD` inclusivas; si no tienen ese formato se ignoran.
 *
 * @param {object[]} desembarques
 * @param {{ q?: string, especie?: string, puerto?: string, estado?: string,
 *   desde?: string, hasta?: string }} [filtros]
 * @returns {object[]} Nueva lista filtrada.
 */
export function filtrarDesembarques(
  desembarques,
  { q, especie, puerto, estado, desde, hasta } = {},
) {
  const termino = normalizarTexto(String(q ?? '').trim())
  const fechaDesde = PATRON_FECHA.test(String(desde ?? '')) ? desde : ''
  const fechaHasta = PATRON_FECHA.test(String(hasta ?? '')) ? hasta : ''

  return comoLista(desembarques).filter((desembarque) => {
    const fecha = String(desembarque.fechaDesembarque ?? '')
    return (
      (!termino ||
        [desembarque.codigo, desembarque.embarcacion, desembarque.matricula].some((campo) =>
          normalizarTexto(campo).includes(termino),
        )) &&
      (!especie || desembarque.especie === especie) &&
      (!puerto || desembarque.puerto === puerto) &&
      (!estado || desembarque.estado === estado) &&
      (!fechaDesde || fecha >= fechaDesde) &&
      (!fechaHasta || fecha <= fechaHasta)
    )
  })
}

/** Evento de ventana que avisa (por ejemplo a la barra lateral) que los desembarques cambiaron. */
export const EVENTO_CAMBIO_OPERACIONES = 'pescacontrol:operaciones-cambio'

/** Emite `EVENTO_CAMBIO_OPERACIONES` tras registrar, editar o eliminar un desembarque. */
export function avisarCambioOperaciones() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new Event(EVENTO_CAMBIO_OPERACIONES))
}
