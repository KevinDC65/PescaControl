import {
  ARTES_PESCA,
  DESTINOS,
  ESPECIES,
  ESTADOS,
  LARGO_EMBARCACION,
  PATRON_CODIGO,
  PATRON_MATRICULA,
  PUERTOS,
  TONELADAS_MAXIMAS,
} from '../constants/desembarques.js'
import { hoyISO } from './formato.js'

const esVacio = (valor) => valor === undefined || valor === null || String(valor).trim() === ''

const texto = (valor) => String(valor ?? '').trim()

/** Número escrito con punto decimal opcional (sin comas, exponentes ni hexadecimales). */
const PATRON_NUMERO = /^[+-]?(\d+(\.\d*)?|\.\d+)$/

const PATRON_FECHA = /^(\d{4})-(\d{2})-(\d{2})$/

/**
 * Convierte el valor de un input (texto) o un número en número.
 * Devuelve NaN si el texto no es un número decimal simple (por ejemplo "12,5" o "1e3").
 */
function aNumero(valor) {
  if (typeof valor === 'number') return valor
  if (typeof valor !== 'string') return Number.NaN
  const limpio = valor.trim()
  return PATRON_NUMERO.test(limpio) ? Number(limpio) : Number.NaN
}

const tieneMasDeDosDecimales = (numero) => Math.round(numero * 100) / 100 !== numero

/** Indica si `YYYY-MM-DD` es una fecha real del calendario (descarta 2026-02-30). */
function esFechaReal(fechaISO) {
  const coincidencia = PATRON_FECHA.exec(fechaISO)
  if (!coincidencia) return false
  const [anio, mes, dia] = coincidencia.slice(1).map(Number)
  const fecha = new Date(Date.UTC(anio, mes - 1, dia))
  return (
    fecha.getUTCFullYear() === anio && fecha.getUTCMonth() === mes - 1 && fecha.getUTCDate() === dia
  )
}

/**
 * Valida una cantidad positiva con 2 decimales como máximo.
 * @returns {string|undefined} Mensaje de error, o undefined si es válida.
 */
function validarCantidad(valor, mensajes, maximo) {
  if (esVacio(valor)) return mensajes.vacio
  const numero = aNumero(valor)
  if (!Number.isFinite(numero)) return mensajes.invalido
  if (numero <= 0) return mensajes.noPositivo
  if (maximo !== undefined && numero > maximo) return mensajes.excede
  if (tieneMasDeDosDecimales(numero)) return mensajes.decimales
  return undefined
}

/**
 * Valida un desembarque según las reglas del modelo. Función pura: no modifica el objeto.
 * Acepta toneladas y precio como texto (valor de un input) o como número. El código y la
 * matrícula se comparan en mayúsculas, igual que los guarda `normalizarDesembarque`.
 *
 * @param {object} desembarque Datos del formulario.
 * @param {{ codigosExistentes?: string[], hoy?: string }} [opciones]
 *   `codigosExistentes`: códigos ya registrados (en edición, excluye el del propio desembarque).
 *   `hoy`: fecha de referencia `YYYY-MM-DD` para rechazar fechas futuras (por defecto, hoy local).
 * @returns {Record<string, string>} Solo los campos con error; objeto vacío = válido.
 */
export function validarDesembarque(desembarque, { codigosExistentes = [], hoy } = {}) {
  const datos = desembarque ?? {}
  const errores = {}
  const fechaReferencia = esFechaReal(texto(hoy)) ? texto(hoy) : hoyISO()

  const codigo = texto(datos.codigo).toUpperCase()
  if (!codigo) {
    errores.codigo = 'El código es obligatorio.'
  } else if (!PATRON_CODIGO.test(codigo)) {
    errores.codigo = 'Formato: DSB, guion y 3 números (ej. DSB-014).'
  } else if (codigosExistentes.some((existente) => texto(existente).toUpperCase() === codigo)) {
    errores.codigo = `El código ${codigo} ya está registrado.`
  }

  const embarcacion = texto(datos.embarcacion)
  if (!embarcacion) {
    errores.embarcacion = 'El nombre de la embarcación es obligatorio.'
  } else if (
    embarcacion.length < LARGO_EMBARCACION.minimo ||
    embarcacion.length > LARGO_EMBARCACION.maximo
  ) {
    errores.embarcacion = `El nombre de la embarcación debe tener entre ${LARGO_EMBARCACION.minimo} y ${LARGO_EMBARCACION.maximo} caracteres.`
  }

  const matricula = texto(datos.matricula).toUpperCase()
  if (!matricula) {
    errores.matricula = 'La matrícula es obligatoria.'
  } else if (!PATRON_MATRICULA.test(matricula)) {
    errores.matricula = 'Formato: 2 letras, guion, 5 números, guion y 2 letras (ej. CO-21345-PM).'
  }

  const catalogos = [
    ['especie', ESPECIES, 'Selecciona una especie.', 'La especie seleccionada no es válida.'],
    [
      'artePesca',
      ARTES_PESCA,
      'Selecciona un arte de pesca.',
      'El arte de pesca seleccionado no es válido.',
    ],
    ['puerto', PUERTOS, 'Selecciona un puerto.', 'El puerto seleccionado no es válido.'],
    ['destino', DESTINOS, 'Selecciona un destino.', 'El destino seleccionado no es válido.'],
    ['estado', ESTADOS, 'Selecciona un estado.', 'El estado seleccionado no es válido.'],
  ]
  for (const [campo, opciones, mensajeVacio, mensajeInvalido] of catalogos) {
    const valor = texto(datos[campo])
    if (!valor) {
      errores[campo] = mensajeVacio
    } else if (!opciones.includes(valor)) {
      errores[campo] = mensajeInvalido
    }
  }

  const errorToneladas = validarCantidad(
    datos.toneladas,
    {
      vacio: 'Las toneladas son obligatorias.',
      invalido: 'Ingresa un tonelaje válido (usa punto decimal, ej. 125.50).',
      noPositivo: 'Las toneladas deben ser mayores que 0.',
      excede: `Las toneladas no pueden superar ${TONELADAS_MAXIMAS} t por desembarque.`,
      decimales: 'Las toneladas admiten como máximo 2 decimales.',
    },
    TONELADAS_MAXIMAS,
  )
  if (errorToneladas) errores.toneladas = errorToneladas

  const errorPrecio = validarCantidad(datos.precioTonelada, {
    vacio: 'El precio por tonelada es obligatorio.',
    invalido: 'Ingresa un precio válido (usa punto decimal, ej. 1850.50).',
    noPositivo: 'El precio por tonelada debe ser mayor que 0.',
    decimales: 'El precio por tonelada admite como máximo 2 decimales.',
  })
  if (errorPrecio) errores.precioTonelada = errorPrecio

  const fecha = texto(datos.fechaDesembarque)
  if (!fecha) {
    errores.fechaDesembarque = 'La fecha de desembarque es obligatoria.'
  } else if (!esFechaReal(fecha)) {
    errores.fechaDesembarque = 'Ingresa una fecha válida (AAAA-MM-DD).'
  } else if (fecha > fechaReferencia) {
    errores.fechaDesembarque = 'La fecha de desembarque no puede ser futura.'
  }

  return errores
}

/**
 * Limpia los datos antes de enviarlos a la API: recorta textos, pasa el código y la
 * matrícula a mayúsculas y convierte toneladas y precio por tonelada a número.
 * Conserva el resto de campos (por ejemplo `id`). Debe usarse después de validar.
 *
 * @param {object} desembarque
 * @returns {object} Nuevo desembarque normalizado.
 */
export function normalizarDesembarque(desembarque) {
  const datos = desembarque ?? {}
  return {
    ...datos,
    codigo: texto(datos.codigo).toUpperCase(),
    embarcacion: texto(datos.embarcacion),
    matricula: texto(datos.matricula).toUpperCase(),
    especie: texto(datos.especie),
    artePesca: texto(datos.artePesca),
    puerto: texto(datos.puerto),
    destino: texto(datos.destino),
    toneladas: aNumero(datos.toneladas),
    precioTonelada: aNumero(datos.precioTonelada),
    fechaDesembarque: texto(datos.fechaDesembarque),
    estado: texto(datos.estado),
  }
}
