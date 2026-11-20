import { useEffect, useRef } from 'react'
import type { ModoGuardia } from '../types/contextos.ts'
import { useShell } from './useShell.ts'

/**
 * Avisa antes de salir de una página con cambios sin guardar: al recargar o cerrar la
 * pestaña (evento beforeunload) y al navegar dentro de la app (confirmación propia).
 *
 * @param hayCambios Si es true, la guardia está activa.
 * @param modo Ajusta el texto de la confirmación.
 * @param alSalir Se ejecuta si el usuario confirma que quiere salir.
 */
export function useGuardiaCambios(
  hayCambios: boolean,
  modo: ModoGuardia,
  alSalir?: () => void,
): void {
  const { registrarGuardia } = useShell()
  const alSalirRef = useRef(alSalir)

  useEffect(() => {
    alSalirRef.current = alSalir
  })

  useEffect(() => {
    if (!hayCambios) return undefined
    const quitarGuardia = registrarGuardia({ modo, alSalir: () => alSalirRef.current?.() })
    const antesDeSalir = (evento: BeforeUnloadEvent) => {
      evento.preventDefault()
      evento.returnValue = ''
    }
    window.addEventListener('beforeunload', antesDeSalir)
    return () => {
      quitarGuardia()
      window.removeEventListener('beforeunload', antesDeSalir)
    }
  }, [hayCambios, modo, registrarGuardia])
}
