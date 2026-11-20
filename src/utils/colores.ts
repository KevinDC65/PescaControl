import { ESPECIES, ESTADOS, perteneceACatalogo } from '../constants/desembarques.ts'
import type { Especie, EstadoDesembarque } from '../types/desembarque.ts'

// Colores del dominio pesquero: un tono marino por especie (para gráficos, leyendas y
// marcas en tablas) y una variante de Bootstrap por estado (para badges y alertas).
// Funciones puras: el mismo dato siempre produce el mismo color.

/** Variante de Bootstrap que se usa para un estado. */
export type VarianteEstado = 'secondary' | 'info' | 'success' | 'warning'

/**
 * Tono asignado a cada especie (tema claro). Paleta marina sin morados: azules, verdes agua,
 * dorado, coral y ladrillo. Todos tienen al menos 3:1 de contraste sobre las superficies
 * blancas y ninguno se confunde con el naranja de boya, que la interfaz reserva para
 * "requiere atención". El tema oscuro aclara cada tono en styles/especies.css.
 */
export const COLORES_ESPECIE: Readonly<Record<Especie, string>> = Object.freeze({
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

/** Indica si la especie tiene un color propio en `COLORES_ESPECIE`. */
const tieneColorPropio = (especie: unknown): especie is Especie =>
  typeof especie === 'string' && Object.hasOwn(COLORES_ESPECIE, especie)

/**
 * Color hexadecimal de una especie.
 * @param especie Ej. "Anchoveta".
 * @returns Ej. "#1b4965". Si la especie no existe, `COLOR_ESPECIE_DESCONOCIDA`.
 */
export function colorEspecie(especie: string | null | undefined): string {
  return tieneColorPropio(especie) ? COLORES_ESPECIE[especie] : COLOR_ESPECIE_DESCONOCIDA
}

/**
 * Identificador en minúsculas y sin tildes de una especie, para clases CSS
 * (ej. `ps-especie-${slugEspecie(especie)}`).
 * @returns Ej. "anchoveta"; "otra" si no pertenece al catálogo.
 */
export function slugEspecie(especie: string | null | undefined): string {
  return perteneceACatalogo(ESPECIES, especie) ? especie.toLowerCase() : 'otra'
}

/** Variante de Bootstrap de cada estado. */
export const VARIANTES_ESTADO: Readonly<Record<EstadoDesembarque, VarianteEstado>> = Object.freeze({
  Programado: 'secondary',
  'En descarga': 'info',
  Descargado: 'success',
  Observado: 'warning',
})

/**
 * Variante de Bootstrap para el estado (sirve para `bg-*`, `text-*`, `border-*`, `alert-*`).
 * @param estado Ej. "Observado".
 * @returns "secondary" si el estado no existe.
 */
export function colorEstado(estado: string | null | undefined): VarianteEstado {
  return perteneceACatalogo(ESTADOS, estado) ? VARIANTES_ESTADO[estado] : 'secondary'
}

/**
 * Clases de Bootstrap 5.3 para un badge de estado legible en tema claro y oscuro
 * (fondo suave, texto enfatizado y borde del mismo tono).
 * @returns Ej. "text-warning-emphasis bg-warning-subtle border border-warning-subtle".
 */
export function clasesBadgeEstado(estado: string | null | undefined): string {
  const variante = colorEstado(estado)
  return `text-${variante}-emphasis bg-${variante}-subtle border border-${variante}-subtle`
}

function hexARgb(hex: string | null | undefined): [number, number, number] {
  const limpio = String(hex ?? '').replace('#', '')
  if (!/^[0-9a-f]{6}$/i.test(limpio)) return [0, 0, 0]
  const canal = (inicio: number) => parseInt(limpio.slice(inicio, inicio + 2), 16)
  return [canal(0), canal(2), canal(4)]
}

/** Canal sRGB (0–255) convertido a valor lineal (0–1), según WCAG. */
function canalLineal(canal: number): number {
  const c = canal / 255
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}

/** Luminancia relativa (WCAG) de un color hexadecimal `#rrggbb`. */
export function luminancia(hex: string | null | undefined): number {
  const [r, g, b] = hexARgb(hex)
  return 0.2126 * canalLineal(r) + 0.7152 * canalLineal(g) + 0.0722 * canalLineal(b)
}

/** Indica si sobre ese color conviene texto oscuro. */
export function esColorClaro(hex: string | null | undefined): boolean {
  return luminancia(hex) > 0.36
}

const TEXTO_OSCURO = '#102a43'
const TEXTO_CLARO = '#ffffff'

/** Relación de contraste WCAG entre dos colores (1 a 21). */
export function contraste(
  hexA: string | null | undefined,
  hexB: string | null | undefined,
): number {
  const luminanciaA = luminancia(hexA)
  const luminanciaB = luminancia(hexB)
  const claro = Math.max(luminanciaA, luminanciaB)
  const oscuro = Math.min(luminanciaA, luminanciaB)
  return (claro + 0.05) / (oscuro + 0.05)
}

/**
 * Color de texto más legible sobre un fondo dado (ej. etiqueta dentro de una barra).
 * @returns "#102a43" (azul muy oscuro) o "#ffffff", el de mayor contraste.
 */
export function colorTextoSobre(hexFondo: string | null | undefined): string {
  return contraste(hexFondo, TEXTO_OSCURO) >= contraste(hexFondo, TEXTO_CLARO)
    ? TEXTO_OSCURO
    : TEXTO_CLARO
}
