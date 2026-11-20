import { createContext } from 'react'

// Contextos de la interfaz (además de AppContext): el "shell" de la aplicación
// (paneles abiertos y navegación protegida) y las notificaciones emergentes (toasts).
// Se definen aquí, separados de sus proveedores, para que cada archivo .jsx exporte
// solo componentes.

export const ShellContext = createContext(null)

export const ToastContext = createContext(null)
