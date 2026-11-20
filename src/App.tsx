import { lazy, Suspense, useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import LayoutApp from './components/LayoutApp.tsx'
import Loading from './components/Loading.tsx'
import RutaProtegida, { SoloInvitado } from './components/RutaProtegida.tsx'
import { useAppContext } from './context/AppContext.tsx'
import Lista from './pages/Lista.tsx'
import NotFound from './pages/NotFound.tsx'
import Panel from './pages/Panel.tsx'
import Registro from './pages/Registro.tsx'

// Las páginas públicas y la gestión de usuarios se cargan bajo demanda: quien entra al
// panel no descarga las animaciones de la portada, y viceversa.
const Principal = lazy(() => import('./pages/Principal.tsx'))
const Ingresar = lazy(() => import('./pages/Ingresar.tsx'))
const CrearCuenta = lazy(() => import('./pages/CrearCuenta.tsx'))
const Usuarios = lazy(() => import('./pages/Usuarios.tsx'))

/** Espera mientras llega el código de una página cargada bajo demanda. */
function CargandoPagina() {
  return (
    <div className="pc-espera-sesion">
      <Loading />
    </div>
  )
}

/**
 * Rutas de la aplicación:
 *   Públicas (sin el shell): /  ·  /ingresar  ·  /crear-cuenta
 *   Con sesión, dentro del shell: /panel  ·  /registro  ·  /registro/:id  ·  /lista
 *   Solo Jefe: /usuarios
 *   404 en cualquier otra ruta (dentro del shell si hay sesión).
 */
function App() {
  const { pathname } = useLocation()

  // Al cambiar de página se vuelve al inicio, como en una navegación normal.
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <Suspense fallback={<CargandoPagina />}>
      <Routes>
        <Route path="/" element={<Principal />} />
        <Route
          path="/ingresar"
          element={
            <SoloInvitado>
              <Ingresar />
            </SoloInvitado>
          }
        />
        <Route
          path="/crear-cuenta"
          element={
            <SoloInvitado>
              <CrearCuenta />
            </SoloInvitado>
          }
        />
        <Route
          element={
            <RutaProtegida>
              <LayoutApp />
            </RutaProtegida>
          }
        >
          <Route path="/panel" element={<Panel />} />
          <Route path="/registro" element={<Registro />} />
          <Route path="/registro/:id" element={<Registro />} />
          <Route path="/lista" element={<Lista />} />
          <Route
            path="/usuarios"
            element={
              <RutaProtegida rol="jefe">
                <Usuarios />
              </RutaProtegida>
            }
          />
        </Route>
        <Route path="*" element={<PaginaNoEncontrada />} />
      </Routes>
    </Suspense>
  )
}

/** 404: dentro del shell si hay sesión; si no, como página pública. */
function PaginaNoEncontrada() {
  const { usuario, cargandoSesion } = useAppContext()
  if (cargandoSesion) return <CargandoPagina />
  if (usuario) {
    return (
      <LayoutApp>
        <NotFound />
      </LayoutApp>
    )
  }
  return (
    <main id="contenido" className="pc-404-publica">
      <NotFound />
    </main>
  )
}

export default App
