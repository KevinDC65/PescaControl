import { useCallback, useState } from 'react'
import { useAppContext } from '../context/AppContext.tsx'
import { useToast } from './useToast.ts'

/**
 * Cierra la sesión y avisa con un toast. Devuelve la acción y si está en curso, para que
 * la barra lateral, la hoja "Más" y la paleta compartan el mismo comportamiento.
 */
export function useCerrarSesion(): { salir: () => Promise<void>; saliendo: boolean } {
  const { cerrarSesion } = useAppContext()
  const toast = useToast()
  const [saliendo, setSaliendo] = useState(false)

  const salir = useCallback(async () => {
    setSaliendo(true)
    try {
      await cerrarSesion()
      toast.info('Cerraste sesión. Hasta el próximo desembarque.')
    } catch {
      toast.aviso('El servidor no respondió, pero cerramos la sesión en este navegador.')
    } finally {
      setSaliendo(false)
    }
  }, [cerrarSesion, toast])

  return { salir, saliendo }
}
