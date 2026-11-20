import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useAppContext } from '../../context/AppContext.tsx'
import PanelMarino from './PanelMarino.tsx'

/** Propiedades de `LayoutAcceso`. */
interface PropsLayoutAcceso {
  frase: readonly string[]
  detalle: readonly { icono: string; texto: string }[]
  children: ReactNode
}

/**
 * Layout de las páginas de acceso (/ingresar y /crear-cuenta), fuera del shell de la app:
 * panel marino a la izquierda y el formulario a la derecha. En móvil, una sola columna con
 * la franja marina arriba.
 */
function LayoutAcceso({ frase, detalle, children }: PropsLayoutAcceso) {
  const { tema, alternarTema } = useAppContext()
  const esOscuro = tema === 'dark'

  return (
    <div className="pc-acceso">
      <a href="#contenido" className="pc-saltar">
        Saltar al formulario
      </a>
      <PanelMarino frase={frase} detalle={detalle} />

      <main id="contenido" className="pc-acceso-lado" tabIndex={-1}>
        <div className="pc-acceso-barra">
          <Link to="/" className="pc-acceso-volver">
            <i className="bi bi-arrow-left" aria-hidden="true" />
            Página principal
          </Link>
          <button
            type="button"
            className="btn pc-boton-icono"
            onClick={alternarTema}
            aria-label={esOscuro ? 'Activar tema claro' : 'Activar tema oscuro'}
            title={esOscuro ? 'Tema claro' : 'Tema oscuro'}
          >
            <i className={`bi ${esOscuro ? 'bi-sun' : 'bi-moon-stars'}`} aria-hidden="true" />
          </button>
        </div>

        <div className="pc-acceso-caja">{children}</div>

        <p className="pc-acceso-pie">
          PescaControl · Universidad Tecnológica del Perú. La sesión se guarda en una cookie segura
          del servidor; este navegador no guarda tu contraseña ni tu token.
        </p>
      </main>
    </div>
  )
}

export default LayoutAcceso
