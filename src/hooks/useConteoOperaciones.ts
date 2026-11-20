import { useEffect, useState } from 'react'
import { getAll } from '../services/apiService.ts'
import type { ConteoOperaciones } from '../types/operaciones.ts'
import { EVENTO_CAMBIO_OPERACIONES, requiereAtencion } from '../utils/operaciones.ts'

/**
 * Cuenta los desembarques y los que requieren atención (Observado o En descarga) para la
 * barra lateral. Vuelve a consultar la API cuando una página avisa que las operaciones
 * cambiaron (`avisarCambioOperaciones` tras registrar, editar o eliminar).
 * Si la API no responde, devuelve `null` en los conteos y la barra simplemente los oculta.
 */
export function useConteoOperaciones(): ConteoOperaciones {
  const [conteo, setConteo] = useState<ConteoOperaciones>({ total: null, atencion: null })

  useEffect(() => {
    let activo = true
    function consultar() {
      getAll()
        .then((desembarques) => {
          if (!activo) return
          setConteo({
            total: desembarques.length,
            atencion: desembarques.filter(requiereAtencion).length,
          })
        })
        .catch(() => {
          if (activo) setConteo({ total: null, atencion: null })
        })
    }
    consultar()
    window.addEventListener(EVENTO_CAMBIO_OPERACIONES, consultar)
    return () => {
      activo = false
      window.removeEventListener(EVENTO_CAMBIO_OPERACIONES, consultar)
    }
  }, [])

  return conteo
}
