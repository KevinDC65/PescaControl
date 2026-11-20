import type { ReactNode } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { useAppContext } from '../context/AppContext.tsx'
import { useAtajosTeclado } from '../hooks/useAtajosTeclado.ts'
import { useShell } from '../hooks/useShell.ts'
import { RUTA_PANEL } from '../utils/sesion.ts'
import AyudaAtajos from './AyudaAtajos.tsx'
import Footer from './Footer.tsx'
import Header from './Header.tsx'
import Navbar from './Navbar.tsx'
import PaletaComandos from './PaletaComandos.tsx'

/** Propiedades de `LayoutApp`. */
interface PropsLayoutApp {
  /** Contenido fijo; sin él se muestra la ruta hija (`<Outlet />`). */
  children?: ReactNode
}

/**
 * Layout de la aplicación con sesión (shell):
 *   Navbar (barra lateral en escritorio, barra inferior en móvil)
 *   Header (título de la app, migas y buscador) → contenido de la ruta → Footer
 * Además monta los paneles globales (paleta de comandos y atajos) y los atajos de teclado.
 */
function LayoutApp({ children }: PropsLayoutApp) {
  const { pathname } = useLocation()
  const { abrir, alternar, navegarSeguro } = useShell()
  const { esJefe } = useAppContext()

  useAtajosTeclado({
    'mod+k': () => alternar('paleta'),
    '?': () => abrir('ayuda'),
    n: () => navegarSeguro('/registro'),
    '/': () => {
      const busqueda = document.getElementById('filtro-busqueda')
      if (pathname === '/lista' && busqueda) busqueda.focus()
      else navegarSeguro('/lista', { state: { enfocarBusqueda: true } })
    },
    'g i': () => navegarSeguro(RUTA_PANEL),
    'g l': () => navegarSeguro('/lista'),
    'g r': () => navegarSeguro('/registro'),
    ...(esJefe ? { 'g u': () => navegarSeguro('/usuarios') } : {}),
  })

  return (
    <div className="pc-app">
      <a href="#contenido" className="pc-saltar">
        Saltar al contenido
      </a>
      <Navbar />
      <div className="pc-area">
        <Header />
        <main id="contenido" className="pc-main" tabIndex={-1}>
          <div key={pathname} className="pc-pagina">
            {children ?? <Outlet />}
          </div>
        </main>
        <Footer />
      </div>

      <PaletaComandos />
      <AyudaAtajos />
    </div>
  )
}

export default LayoutApp
