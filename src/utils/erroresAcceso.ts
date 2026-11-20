import { ErrorApi, estadoDeError } from '../services/http.ts'
import type { CampoCuenta, ErroresCuenta } from './validarCuenta.ts'

/** Tipo de alerta con que se muestra un error de acceso. */
export type TipoAvisoAcceso = 'danger' | 'warning'

/** Error de las páginas de acceso, listo para mostrar. */
export interface AvisoAcceso {
  tipo: TipoAvisoAcceso
  mensaje: string
  /** Errores por campo que envió el servidor (respuestas 400 y 409). */
  campos: ErroresCuenta
  /** Código HTTP, o null si no hubo respuesta. */
  estado: number | null
}

const CAMPOS: readonly CampoCuenta[] = ['nombre', 'correo', 'contrasena', 'confirmacion']

/** Se queda solo con los campos que conoce el formulario. */
function camposConocidos(campos: Record<string, string>): ErroresCuenta {
  const resultado: ErroresCuenta = {}
  for (const campo of CAMPOS) {
    const mensaje = campos[campo]
    if (mensaje) resultado[campo] = mensaje
  }
  return resultado
}

/**
 * Traduce el error del servidor al ingresar o al crear una cuenta en un aviso claro:
 * 401 credenciales, 403 cuenta desactivada, 409 correo repetido, 429 demasiados intentos,
 * 400 errores por campo y sin respuesta (servidor apagado).
 */
export function describirErrorAcceso(error: unknown, accion: 'ingreso' | 'registro'): AvisoAcceso {
  const estado = estadoDeError(error)
  const campos = error instanceof ErrorApi ? camposConocidos(error.campos) : {}
  const delServidor = error instanceof Error ? error.message : ''

  switch (estado) {
    case 401:
      return { tipo: 'danger', estado, campos, mensaje: 'Correo o contraseña incorrectos.' }
    case 403:
      return {
        tipo: 'warning',
        estado,
        campos,
        mensaje:
          'Tu cuenta está desactivada. Pide a un Jefe de PescaControl que la vuelva a activar.',
      }
    case 409:
      return {
        tipo: 'danger',
        estado,
        campos: { ...campos, correo: campos.correo ?? 'Ya existe una cuenta con ese correo.' },
        mensaje: 'Ese correo ya tiene una cuenta. Puedes ingresar con él.',
      }
    case 429:
      return {
        tipo: 'warning',
        estado,
        campos,
        mensaje:
          accion === 'ingreso'
            ? 'Demasiados intentos de ingreso. Por seguridad, espera unos 15 minutos antes de volver a intentarlo.'
            : 'Demasiados intentos seguidos. Espera unos 15 minutos antes de volver a intentarlo.',
      }
    case 400:
      return {
        tipo: 'danger',
        estado,
        campos,
        mensaje: delServidor || 'Revisa los datos marcados.',
      }
    default:
      return {
        tipo: 'danger',
        estado,
        campos,
        mensaje: delServidor || 'No se pudo completar la operación. Intenta de nuevo.',
      }
  }
}
