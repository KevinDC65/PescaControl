import { Link, useLocation } from 'react-router-dom'
import { Tecla } from '../components/Tecla.tsx'
import { useShell } from '../hooks/useShell.ts'

function NotFound() {
  const { pathname } = useLocation()
  const { abrir } = useShell()

  return (
    <section className="pc-404" aria-labelledby="titulo-404">
      <div className="pc-404-carta" aria-hidden="true">
        <svg className="pc-404-isobatas" viewBox="0 0 320 160" preserveAspectRatio="none">
          <path d="M0 30c60-14 110 18 170 6s100-26 150-10" />
          <path d="M0 70c64-12 108 20 168 8s102-22 152-6" />
          <path d="M0 112c56-10 112 16 172 4s96-18 148-4" />
        </svg>
        <span className="pc-404-cifra">404</span>
        <span className="pc-404-nota">Fuera de carta · sin sondaje</span>
      </div>
      <h2 id="titulo-404" className="pc-titulo-pagina">
        Página no encontrada
      </h2>
      <p className="pc-bajada">
        La dirección <code className="pc-404-ruta">{pathname}</code> no existe en PescaControl.
        Revisa el enlace o sigue desde una de estas opciones.
      </p>
      <div className="pc-404-acciones">
        <Link to="/" className="btn btn-primary d-inline-flex align-items-center gap-2">
          <i className="bi bi-compass" aria-hidden="true" />
          Volver al inicio
        </Link>
        <Link to="/lista" className="btn btn-outline-secondary">
          Ver desembarques
        </Link>
        <button
          type="button"
          className="btn btn-outline-secondary d-inline-flex align-items-center gap-2"
          onClick={() => abrir('paleta')}
        >
          <i className="bi bi-search" aria-hidden="true" />
          Buscar
          <Tecla mod>K</Tecla>
        </button>
      </div>
    </section>
  )
}

export default NotFound
