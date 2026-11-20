import { useEffect, useRef } from 'react'
import { useShell } from './useShell.js'

/**
 * Avisa antes de salir de una página con cambios sin guardar: al recargar o cerrar la
 * pestaña (evento beforeunload) y al navegar dentro de la app (confirmación propia).
 *
 * @param {boolean} hayCambios Si es true, la guardia está activa.
 * @param {'nuevo'|'edicion'} modo Ajusta el texto de la confirmación.
 * @param {() => void} [alSalir] Se ejecuta si el usuario confirma que quiere salir.
 */
export function useGuardiaCambios(hayCambios, modo, alSalir) {
  const { registrarGuardia } = useShell()
  const alSalirRef = useRef(alSalir)

  useEffect(() => {
    alSalirRef.current = alSalir
  })

  useEffect(() => {
    if (!hayCambios) return undefined
    const quitarGuardia = registrarGuardia({ modo, alSalir: () => alSalirRef.current?.() })
    const antesDeSalir = (evento) => {
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
