import type { ReactNode } from 'react'
import type { NavigateOptions, To } from 'react-router-dom'
import type { UsuarioSimulado } from './usuario.ts'

/** Tema de Bootstrap (atributo `data-bs-theme`). */
export type Tema = 'light' | 'dark'

/** Configuración fija de la aplicación. */
export interface ConfiguracionApp {
  /** Símbolo de los soles. */
  moneda: string
  /** Abreviatura de toneladas. */
  unidad: string
}

/** Valor del contexto global (`useAppContext`). */
export interface ValorAppContext {
  /** Usuario con sesión simulada, o null. */
  usuario: UsuarioSimulado | null
  /** Inicia sesión; ignora nombres vacíos (devuelve false). */
  login: (nombre: string) => boolean
  /** Cierra la sesión. */
  logout: () => void
  /** Tema actual de Bootstrap. */
  tema: Tema
  /** Cambia entre claro y oscuro. */
  alternarTema: () => void
  config: ConfiguracionApp
}

/** Panel global del shell que puede estar abierto. */
export type Panel = 'paleta' | 'ayuda' | 'login' | 'mas'

/** Modo de la guardia de cambios: ajusta el texto de la confirmación. */
export type ModoGuardia = 'nuevo' | 'edicion'

/** Guardia de navegación registrada por una página con cambios sin guardar. */
export interface Guardia {
  modo: ModoGuardia
  /** Se ejecuta si el usuario confirma que quiere salir. */
  alSalir?: () => void
}

/** Valor del contexto del shell (`useShell`). */
export interface ValorShellContext {
  panel: Panel | null
  abrir: (nombre: Panel) => void
  cerrar: () => void
  alternar: (nombre: Panel) => void
  /** Registra la guardia y devuelve la función que la quita. */
  registrarGuardia: (guardia: Guardia) => () => void
  /** Navega pidiendo confirmación si hay una guardia activa. */
  navegarSeguro: (destino: To, opciones?: NavigateOptions) => void
}

/** Tipo de toast (variante de alerta de Bootstrap). */
export type TipoToast = 'success' | 'info' | 'warning' | 'danger'

/** Botón opcional dentro de un toast. */
export interface AccionToast {
  texto: string
  onClick: () => void
}

/** Opciones al mostrar un toast. */
export interface OpcionesToast {
  accion?: AccionToast | null
  /** Milisegundos en pantalla; por defecto depende del tipo. */
  duracion?: number
}

/** Toast en pantalla. */
export interface Toast {
  id: number
  tipo: TipoToast
  mensaje: ReactNode
  accion: AccionToast | null
  duracion: number
  /** true durante la animación de salida. */
  saliendo: boolean
}

/** Muestra un toast de un tipo concreto y devuelve su id. */
export type MostrarToastTipo = (mensaje: ReactNode, opciones?: OpcionesToast) => number

/** Valor del contexto de notificaciones (`useToast`). */
export interface ValorToastContext {
  mostrar: (tipo: TipoToast, mensaje: ReactNode, opciones?: OpcionesToast) => number
  cerrar: (id: number) => void
  exito: MostrarToastTipo
  error: MostrarToastTipo
  aviso: MostrarToastTipo
  info: MostrarToastTipo
}
