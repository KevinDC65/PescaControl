import { useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import AyudaAtajos from './components/AyudaAtajos.tsx'
import Footer from './components/Footer.tsx'
import Header from './components/Header.tsx'
import LoginModal from './components/LoginModal.tsx'
import Navbar from './components/Navbar.tsx'
import PaletaComandos from './components/PaletaComandos.tsx'
import { useAtajosTeclado } from './hooks/useAtajosTeclado.ts'
import { useShell } from './hooks/useShell.ts'
import Home from './pages/Home.tsx'
import Lista from './pages/Lista.tsx'
import NotFound from './pages/NotFound.tsx'
import Registro from './pages/Registro.tsx'

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
