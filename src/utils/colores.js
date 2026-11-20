import { ESPECIES, ESTADOS } from '../constants/desembarques.js'

// Colores del dominio pesquero: un tono marino por especie (para gráficos, leyendas y
// marcas en tablas) y una variante de Bootstrap por estado (para badges y alertas).
// Funciones puras: el mismo dato siempre produce el mismo color.

/**
 * Tono asignado a cada especie (tema claro). Paleta marina sin morados: azules, verdes agua,
 * dorado, coral y ladrillo. Todos tienen al menos 3:1 de contraste sobre las superficies
 * blancas y ninguno se confunde con el naranja de boya, que la interfaz reserva para
 * "requiere atención". El tema oscuro aclara cada tono en styles/especies.css.
 */
export const COLORES_ESPECIE = Object.freeze({
  Anchoveta: '#1b4965', // azul profundo
  Jurel: '#2a9d8f', // verde agua
  Caballa: '#3d8fc4', // azul cielo
  Bonito: '#d1495b', // coral frambuesa
  Perico: '#b98a1b', // dorado
  Pota: '#9a4b2f', // ladrillo
  Merluza: '#6a994e', // verde alga
})

/** Color neutro (gris pizarra) para especies fuera del catálogo o vacías. */
export const COLOR_ESPECIE_DESCONOCIDA = '#6f7f8c'

/**
 * Color hexadecimal de una especie.
 * @param {string} especie Ej. "Anchoveta".
 * @returns {string} Ej. "#1b4965". Si la especie no existe, `COLOR_ESPECIE_DESCONOCIDA`.
 */
export function colorEspecie(especie) {
  return Object.hasOwn(COLORES_ESPECIE, especie)
    ? COLORES_ESPECIE[especie]
    : COLOR_ESPECIE_DESCONOCIDA
}

/**
 * Identificador en minúsculas y sin tildes de una especie, para clases CSS
 * (ej. `ps-especie-${slugEspecie(especie)}`).
 * @param {string} especie
 * @returns {string} Ej. "anchoveta"; "otra" si no pertenece al catálogo.
 */
export function slugEspecie(especie) {
  return ESPECIES.includes(especie) ? especie.toLowerCase() : 'otra'
}

/** Variante de Bootstrap de cada estado. */
export const VARIANTES_ESTADO = Object.freeze({
  Programado: 'secondary',
  'En descarga': 'info',
  Descargado: 'success',
  Observado: 'warning',
})

/**
 * Variante de Bootstrap para el estado (sirve para `bg-*`, `text-*`, `border-*`, `alert-*`).
 * @param {string} estado Ej. "Observado".
 * @returns {'secondary'|'info'|'success'|'warning'} "secondary" si el estado no existe.
 */
export function colorEstado(estado) {
  return ESTADOS.includes(estado) ? VARIANTES_ESTADO[estado] : 'secondary'
}

/**
 * Clases de Bootstrap 5.3 para un badge de estado legible en tema claro y oscuro
 * (fondo suave, texto enfatizado y borde del mismo tono).
 * @param {string} estado
 * @returns {string} Ej. "text-warning-emphasis bg-warning-subtle border border-warning-subtle".
 */
export function clasesBadgeEstado(estado) {
  const variante = colorEstado(estado)
  return `text-${variante}-emphasis bg-${variante}-subtle border border-${variante}-subtle`
}

function hexARgb(hex) {
  const limpio = String(hex ?? '').replace('#', '')
  if (!/^[0-9a-f]{6}$/i.test(limpio)) return [0, 0, 0]
  return [0, 2, 4].map((inicio) => parseInt(limpio.slice(inicio, inicio + 2), 16))
}

/** Luminancia relativa (WCAG) de un color hexadecimal `#rrggbb`. */
export function luminancia(hex) {
  const [r, g, b] = hexARgb(hex).map((canal) => {
    const c = canal / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** Indica si sobre ese color conviene texto oscuro. */
export function esColorClaro(hex) {
  return luminancia(hex) > 0.36
}

const TEXTO_OSCURO = '#102a43'
const TEXTO_CLARO = '#ffffff'

/** Relación de contraste WCAG entre dos colores (1 a 21). */
export function contraste(hexA, hexB) {
  const [claro, oscuro] = [luminancia(hexA), luminancia(hexB)].sort((a, b) => b - a)
  return (claro + 0.05) / (oscuro + 0.05)
}

/**
 * Color de texto más legible sobre un fondo dado (ej. etiqueta dentro de una barra).
 * @param {string} hexFondo
 * @returns {string} "#102a43" (azul muy oscuro) o "#ffffff", el de mayor contraste.
 */
export function colorTextoSobre(hexFondo) {
  return contraste(hexFondo, TEXTO_OSCURO) >= contraste(hexFondo, TEXTO_CLARO)
    ? TEXTO_OSCURO
    : TEXTO_CLARO
}
