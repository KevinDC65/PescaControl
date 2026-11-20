import { useContext } from 'react'
import { ToastContext } from '../context/contextos.js'

/**
 * Notificaciones emergentes. Uso:
 *   const toast = useToast()
 *   toast.exito('Desembarque registrado.')
 *   toast.error('No se pudo eliminar.', { accion: { texto: 'Reintentar', onClick } })
 * Debe usarse dentro de `<ToastProvider>`.
 */
export function useToast() {
  const contexto = useContext(ToastContext)
  if (contexto === null) throw new Error('useToast debe usarse dentro de <ToastProvider>.')
  return contexto
}
