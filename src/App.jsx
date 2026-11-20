import { useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import AyudaAtajos from './components/AyudaAtajos.jsx'
import Footer from './components/Footer.jsx'
import Header from './components/Header.jsx'
import LoginModal from './components/LoginModal.jsx'
import Navbar from './components/Navbar.jsx'
import PaletaComandos from './components/PaletaComandos.jsx'
import { useAtajosTeclado } from './hooks/useAtajosTeclado.js'
import { useShell } from './hooks/useShell.js'
import Home from './pages/Home.jsx'
import Lista from './pages/Lista.jsx'
import NotFound from './pages/NotFound.jsx'
import Registro from './pages/Registro.jsx'

/**
 * Layout principal (shell de aplicación):
 *   Navbar (barra lateral en escritorio, barra inferior en móvil)
 *   Header (título de la app, migas y buscador) → contenido de la ruta → Footer
 * Además monta los paneles globales (paleta, atajos, inicio de sesión) y los atajos.
 */
function App() {
  const { pathname } = useLocation()
  const { panel, abrir, cerrar, alternar, navegarSeguro } = useShell()

  // Al cambiar de página se vuelve al inicio, como en una navegación normal.
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  useAtajosTeclado({
    'mod+k': () => alternar('paleta'),
    '?': () => abrir('ayuda'),
    n: () => navegarSeguro('/registro'),
    '/': () => {
      const busqueda = document.getElementById('filtro-busqueda')
      if (pathname === '/lista' && busqueda) busqueda.focus()
      else navegarSeguro('/lista', { state: { enfocarBusqueda: true } })
    },
    'g i': () => navegarSeguro('/'),
    'g l': () => navegarSeguro('/lista'),
    'g r': () => navegarSeguro('/registro'),
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
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/registro" element={<Registro />} />
              <Route path="/registro/:id" element={<Registro />} />
              <Route path="/lista" element={<Lista />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </main>
        <Footer />
      </div>

      <PaletaComandos />
      <AyudaAtajos />
      <LoginModal abierto={panel === 'login'} onCerrar={cerrar} />
    </div>
  )
}

export default App
