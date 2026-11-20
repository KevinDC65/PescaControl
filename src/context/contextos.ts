import { createContext } from 'react'
import type { ValorShellContext, ValorToastContext } from '../types/contextos.ts'

// Contextos de la interfaz (además de AppContext): el "shell" de la aplicación
// (paneles abiertos y navegación protegida) y las notificaciones emergentes (toasts).
// Se definen aquí, separados de sus proveedores, para que cada archivo .tsx exporte
// solo componentes.

export const ShellContext = createContext<ValorShellContext | null>(null)

export const ToastContext = createContext<ValorToastContext | null>(null)
