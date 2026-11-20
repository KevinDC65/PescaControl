import { MotionConfig } from 'motion/react'
import { useEffect, useState } from 'react'
import BarraPublica from '../components/principal/BarraPublica.tsx'
import CartaLitoral from '../components/principal/CartaLitoral.tsx'
import Cierre, { PiePublico } from '../components/principal/Cierre.tsx'
import CifrasEnVivo, { type EstadoResumen } from '../components/principal/CifrasEnVivo.tsx'
import ComoFunciona from '../components/principal/ComoFunciona.tsx'
import Modulos from '../components/principal/Modulos.tsx'
import Portada from '../components/principal/Portada.tsx'
import Problema from '../components/principal/Problema.tsx'
import Roles from '../components/principal/Roles.tsx'
import { useLocalStorage } from '../hooks/useLocalStorage.ts'
import { obtenerResumenPublico } from '../services/publicoService.ts'
import { mensajeDeError } from '../utils/errores.ts'

/**
 * Página principal pública (/): presenta PescaControl sin necesidad de sesión.
 * Orden: portada → el problema → cómo funciona → módulos → cifras en vivo → carta del
 * litoral → roles → llamado final y pie.
 *
 * Las cifras reales llegan del resumen público (sin datos de embarcaciones ni personas);
 * las vistas previas usan datos de ejemplo locales. El visitante puede pausar todo el
 * movimiento continuo y la preferencia se recuerda (useLocalStorage).
 */
function Principal() {
  const [estado, setEstado] = useState<EstadoResumen>({ tipo: 'cargando' })
  const [intento, setIntento] = useState(0)
  const [pausadoGuardado, setPausado] = useLocalStorage<unknown>(
    'pescacontrol:movimiento-pausado',
    false,
  )
  const pausado = pausadoGuardado === true

  useEffect(() => {
    document.title = 'PescaControl · El desembarque, bajo control'
    return () => {
      document.title = 'PescaControl · Operaciones pesqueras y desembarque'
    }
  }, [])

  useEffect(() => {
    let activo = true
    obtenerResumenPublico()
      .then((resumen) => {
        if (activo) setEstado({ tipo: 'listo', resumen })
      })
      .catch((error) => {
        if (activo) setEstado({ tipo: 'error', mensaje: mensajeDeError(error) })
      })
    return () => {
      activo = false
    }
  }, [intento])

  function reintentar() {
    setEstado({ tipo: 'cargando' })
    setIntento((n) => n + 1)
  }

  return (
    <MotionConfig reducedMotion="user">
      <div className="pc-publico" data-pausado={pausado}>
        <a href="#contenido" className="pc-saltar">
          Saltar al contenido
        </a>
        <BarraPublica />
        <main id="contenido" tabIndex={-1}>
          <Portada pausado={pausado} onAlternarPausa={() => setPausado(!pausado)} />
          <Problema />
          <ComoFunciona />
          <Modulos pausado={pausado} />
          <CifrasEnVivo estado={estado} onReintentar={reintentar} />
          <CartaLitoral estado={estado} />
          <Roles />
          <Cierre />
        </main>
        <PiePublico />
      </div>
    </MotionConfig>
  )
}

export default Principal
