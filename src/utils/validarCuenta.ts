// Validaciones de las páginas de acceso. Repiten las reglas del servidor para avisar mientras
// se escribe; el servidor vuelve a validar y su respuesta siempre manda.

/** Largo permitido del nombre (sin espacios al inicio ni al final). */
export const LARGO_NOMBRE = Object.freeze({ minimo: 2, maximo: 60 } as const)

/** Largo permitido de la contraseña. */
export const LARGO_CONTRASENA = Object.freeze({ minimo: 8, maximo: 72 } as const)

/** Formato básico de correo: algo@dominio.ext, sin espacios. */
const PATRON_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

const TIENE_LETRA = /\p{L}/u
const TIENE_NUMERO = /\d/

/** Campos de los formularios de acceso. */
export type CampoCuenta = 'nombre' | 'correo' | 'contrasena' | 'confirmacion'

/** Mensajes de error por campo; solo aparecen los campos con error. */
export type ErroresCuenta = Partial<Record<CampoCuenta, string>>

export function validarNombre(nombre: string): string {
  const limpio = nombre.trim()
  if (!limpio) return 'Escribe tu nombre.'
  if (limpio.length < LARGO_NOMBRE.minimo) {
    return `El nombre debe tener al menos ${LARGO_NOMBRE.minimo} caracteres.`
  }
  if (limpio.length > LARGO_NOMBRE.maximo) {
    return `El nombre puede tener hasta ${LARGO_NOMBRE.maximo} caracteres.`
  }
  return ''
}

export function validarCorreo(correo: string): string {
  const limpio = correo.trim()
  if (!limpio) return 'Escribe tu correo.'
  if (!PATRON_CORREO.test(limpio)) return 'Escribe un correo válido, por ejemplo nombre@empresa.pe.'
  return ''
}

/** Reglas completas de una contraseña nueva (registro). */
export function validarContrasenaNueva(contrasena: string): string {
  if (!contrasena) return 'Crea una contraseña.'
  if (contrasena.length < LARGO_CONTRASENA.minimo) {
    return `Usa al menos ${LARGO_CONTRASENA.minimo} caracteres.`
  }
  if (contrasena.length > LARGO_CONTRASENA.maximo) {
    return `Usa como máximo ${LARGO_CONTRASENA.maximo} caracteres.`
  }
  if (!TIENE_LETRA.test(contrasena) || !TIENE_NUMERO.test(contrasena)) {
    return 'Incluye al menos una letra y un número.'
  }
  return ''
}

/** Requisitos de la contraseña nueva con su estado, para la lista bajo el campo. */
export function requisitosContrasena(contrasena: string) {
  return [
    {
      clave: 'largo',
      texto: `${LARGO_CONTRASENA.minimo} caracteres o más`,
      cumple: contrasena.length >= LARGO_CONTRASENA.minimo,
    },
    { clave: 'letra', texto: 'Una letra', cumple: TIENE_LETRA.test(contrasena) },
    { clave: 'numero', texto: 'Un número', cumple: TIENE_NUMERO.test(contrasena) },
  ] as const
}

/** Niveles del medidor de fortaleza, de 0 (vacía) a 4 (muy fuerte). */
export const NIVELES_FORTALEZA = ['Sin contraseña', 'Débil', 'Aceptable', 'Fuerte', 'Muy fuerte']

/**
 * Fortaleza aproximada de una contraseña (0–4). Suma puntos por largo, por mezclar
 * mayúsculas y minúsculas, por números y por símbolos; si no cumple las reglas mínimas del
 * servidor nunca pasa de "Débil".
 */
export function fortalezaContrasena(contrasena: string): number {
  if (!contrasena) return 0
  let puntos = 0
  if (contrasena.length >= LARGO_CONTRASENA.minimo) puntos += 1
  if (contrasena.length >= 12) puntos += 1
  if (contrasena.length >= 16) puntos += 1
  if (/[a-zà-ÿñ]/.test(contrasena) && /[A-ZÀ-ÝÑ]/.test(contrasena)) puntos += 1
  if (TIENE_NUMERO.test(contrasena) && TIENE_LETRA.test(contrasena)) puntos += 1
  if (/[^\p{L}\d\s]/u.test(contrasena)) puntos += 1
  if (validarContrasenaNueva(contrasena)) return 1
  if (puntos <= 2) return 2
  if (puntos <= 4) return 3
  return 4
}

export function validarConfirmacion(contrasena: string, confirmacion: string): string {
  if (!confirmacion) return 'Repite la contraseña.'
  if (confirmacion !== contrasena) return 'Las contraseñas no coinciden.'
  return ''
}
