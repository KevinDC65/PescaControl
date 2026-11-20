import {
  DESTINOS,
  ESPECIES,
  ESTADOS,
  ESTADOS_ATENCION,
  PUERTOS,
  perteneceACatalogo,
} from '../constants/desembarques.ts'
import type { Desembarque, DesembarqueEditable, EstadoDesembarque } from '../types/desembarque.ts'
import type {
  FiltrosDesembarques,
  GrupoOperaciones,
  Orden,
  ResumenOperaciones,
} from '../types/operaciones.ts'

// Cálculos sobre la lista de desembarques compartidos por Inicio, Lista, la barra lateral y
// la paleta de comandos. Funciones puras: no llaman a la API ni modifican los desembarques
// (salvo `avisarCambioOperaciones`, que solo emite un evento de ventana).

/** Cantidad de desembarques que devuelve `resumirOperaciones` en `recientes`. */
export const CANTIDAD_RECIENTES = 5

const PATRON_FECHA = /^\d{4}-\d{2}-\d{2}$/

/** Lista de desembarques tal como puede llegar (también vacía o ausente). */
type ListaDesembarques = readonly Desembarque[] | null | undefined

/** Número finito o 0 (para no propagar NaN en sumas). */
const numero = (valor: unknown): number => {
  const convertido = Number(valor)
  return valor !== null && valor !== '' && Number.isFinite(convertido) ? convertido : 0
}

/** Redondeo a 2 decimales para evitar ruido de coma flotante en totales. */
const redondear2 = (valor: number): number => Math.round(valor * 100) / 100

const comoLista = (lista: ListaDesembarques): readonly Desembarque[] =>
  Array.isArray(lista) ? lista : []

/** Minúsculas y sin tildes, para que "senor" encuentre "Señor de Sipán". */
export const normalizarTexto = (texto: unknown): string =>
  String(texto ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()

/**
 * Valor comercial del desembarque en soles: toneladas × precio por tonelada.
 * Acepta también los valores del formulario (números como texto).
 * @returns Redondeado a céntimos; 0 si faltan datos numéricos.
 */
export function valorDesembarque(
  desembarque:
    Partial<Pick<DesembarqueEditable, 'toneladas' | 'precioTonelada'>> | null | undefined,
): number {
  return redondear2(numero(desembarque?.toneladas) * numero(desembarque?.precioTonelada))
}

/** Indica si el desembarque requiere seguimiento (estado Observado o En descarga). */
export const requiereAtencion = (
  desembarque: { estado?: string | null } | null | undefined,
): boolean => perteneceACatalogo(ESTADOS_ATENCION, desembarque?.estado)

/** Campos de `Desembarque` por los que se agrupa el resumen. */
type CampoAgrupable = 'especie' | 'puerto' | 'destino'

/** Grupo del resumen con la clave del catálogo (ej. `{ especie: 'Jurel', ... }`). */
type GrupoPor<C extends CampoAgrupable> = Record<C, Desembarque[C]> & GrupoOperaciones

/** Agrupa toneladas y cantidad por cada valor de un catálogo, en el orden del catálogo. */
function agruparPor<C extends CampoAgrupable>(
  lista: readonly Desembarque[],
  campo: C,
  catalogo: readonly Desembarque[C][],
  toneladasTotales: number,
): GrupoPor<C>[] {
  return catalogo.map((clave) => {
    const grupo = lista.filter((desembarque) => desembarque[campo] === clave)
    const toneladas = redondear2(grupo.reduce((total, d) => total + numero(d.toneladas), 0))
    // Una clave calculada no conserva el tipo genérico: se indica que es `{ [campo]: clave }`.
    const etiqueta = { [campo]: clave } as Record<C, Desembarque[C]>
    return {
      ...etiqueta,
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
 */
export function resumirOperaciones(desembarques: ListaDesembarques): ResumenOperaciones {
  const lista = comoLista(desembarques)
  const toneladas = redondear2(lista.reduce((total, d) => total + numero(d.toneladas), 0))
  const valor = redondear2(lista.reduce((total, d) => total + valorDesembarque(d), 0))

  // `fromEntries` devuelve un objeto genérico: se indica que tiene una clave por estado.
  const porEstado = Object.fromEntries(ESTADOS.map((estado) => [estado, 0])) as Record<
    EstadoDesembarque,
    number
  >
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
] as const)

/** Orden que se usa cuando no se indica uno o el indicado no existe. */
export const ORDEN_PREDETERMINADO: Orden = 'fecha-desc'

/** Indica si el valor es uno de los órdenes de `ORDENES`. */
const esOrden = (valor: unknown): valor is Orden => ORDENES.some((orden) => orden.valor === valor)

/**
 * Devuelve el orden si es uno de `ORDENES`; si no, el predeterminado. Útil para leer el
 * orden desde la URL sin confiar en su contenido.
 */
export const ordenValido = (valor: string | null | undefined): Orden =>
  esOrden(valor) ? valor : ORDEN_PREDETERMINADO

const compararTexto = (a: unknown, b: unknown): number =>
  String(a ?? '').localeCompare(String(b ?? ''), 'es', { numeric: true, sensitivity: 'base' })

/** Función de comparación para `Array.prototype.sort`. */
type Comparador = (a: Desembarque, b: Desembarque) => number

const compararCodigo: Comparador = (a, b) => compararTexto(a.codigo, b.codigo)

const COMPARADORES: Record<Orden, Comparador> = {
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
 * @param orden Uno de los valores de `ORDENES`.
 * @returns Nueva lista ordenada.
 */
export function ordenarDesembarques(
  desembarques: ListaDesembarques,
  orden: string | null | undefined = ORDEN_PREDETERMINADO,
): Desembarque[] {
  return [...comoLista(desembarques)].sort(COMPARADORES[ordenValido(orden)])
}

/**
 * Filtra desembarques. Todos los criterios son opcionales y se combinan con "y".
 * - `q`: texto libre, sin distinguir mayúsculas ni tildes, sobre código, embarcación o matrícula.
 * - `especie`, `puerto`, `estado`: coincidencia exacta con el catálogo.
 * - `desde`, `hasta`: fechas `YYYY-MM-DD` inclusivas; si no tienen ese formato se ignoran.
 * @returns Nueva lista filtrada.
 */
export function filtrarDesembarques(
  desembarques: ListaDesembarques,
  { q, especie, puerto, estado, desde, hasta }: FiltrosDesembarques = {},
): Desembarque[] {
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
export function avisarCambioOperaciones(): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new Event(EVENTO_CAMBIO_OPERACIONES))
}
