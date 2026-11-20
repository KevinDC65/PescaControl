const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

const formatoSoles = new Intl.NumberFormat('es-PE', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

/**
 * Da formato de moneda peruana a un número.
 * @param n Monto en soles.
 * @returns Ej. `formatearPrecio(39.9)` → "S/ 39.90". Si no es un número, "S/ —".
 */
export function formatearPrecio(n: number | string | null | undefined): string {
  const monto = Number(n)
  if (n === null || n === '' || !Number.isFinite(monto)) return 'S/ —'
  return `S/ ${formatoSoles.format(monto)}`
}

const formatoToneladasEnteras = new Intl.NumberFormat('es-PE', { maximumFractionDigits: 0 })

/**
 * Da formato a un tonelaje: sin decimales si es entero y con 2 decimales si no lo es.
 * @param n Toneladas.
 * @returns Ej. `formatearToneladas(1250.5)` → "1,250.50 t", `formatearToneladas(320)`
 *   → "320 t". Si no es un número, "— t".
 */
export function formatearToneladas(n: number | string | null | undefined): string {
  const toneladas = Number(n)
  if (n === null || n === '' || !Number.isFinite(toneladas)) return '— t'
  const redondeado = Math.round(toneladas * 100) / 100
  const formato = Number.isInteger(redondeado) ? formatoToneladasEnteras : formatoSoles
  return `${formato.format(redondeado)} t`
}

/**
 * Convierte una fecha `YYYY-MM-DD` a texto corto en español sin usar `Date`,
 * para evitar desfases por zona horaria.
 * @param fechaISO Ej. "2026-11-18".
 * @returns Ej. "18 nov 2026". Devuelve el texto original si no tiene el formato esperado.
 */
export function formatearFecha(fechaISO: string | null | undefined): string {
  const coincidencia = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(fechaISO ?? '').trim())
  if (!coincidencia) return fechaISO ?? ''
  const [, anio, mes, dia] = coincidencia
  const nombreMes = MESES[Number(mes) - 1]
  if (!nombreMes || Number(dia) < 1 || Number(dia) > 31) return fechaISO ?? ''
  return `${Number(dia)} ${nombreMes} ${anio}`
}

/**
 * Igual que `formatearFecha` pero sin el año, para tablas, gráficos y listas compactas.
 * @param fechaISO Ej. "2026-11-18".
 * @returns Ej. "18 nov". Devuelve el texto original si no tiene el formato esperado.
 */
export function formatearFechaCorta(fechaISO: string | null | undefined): string {
  const completa = formatearFecha(fechaISO)
  const coincidencia = /^(\d{1,2} [a-z]{3}) \d{4}$/.exec(completa)
  return coincidencia?.[1] ?? completa
}

/**
 * Fecha local (no UTC) en formato `YYYY-MM-DD`.
 * @param fecha Por defecto, hoy.
 */
export function hoyISO(fecha: Date = new Date()): string {
  const anio = fecha.getFullYear()
  const mes = String(fecha.getMonth() + 1).padStart(2, '0')
  const dia = String(fecha.getDate()).padStart(2, '0')
  return `${anio}-${mes}-${dia}`
}
