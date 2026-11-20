import { Link, useLocation } from 'react-router-dom'
import { useAppContext } from '../context/AppContext.tsx'
import { useShell } from '../hooks/useShell.ts'
import Marca from './Marca.tsx'
import { Tecla } from './Tecla.tsx'

/** Nivel de las migas de pan; con `ruta`, es un enlace. */
interface Miga {
  texto: string
  ruta?: string
}

/** Migas de pan de la ruta actual (el primer nivel siempre es el título de la app). */
function migasDe(pathname: string): Miga[] {
  if (pathname === '/') return [{ texto: 'Inicio' }]
  if (pathname === '/lista') return [{ texto: 'Desembarques' }]
  if (pathname === '/registro') {
    return [{ texto: 'Desembarques', ruta: '/lista' }, { texto: 'Registrar desembarque' }]
  }
  if (pathname.startsWith('/registro/')) {
    return [{ texto: 'Desembarques', ruta: '/lista' }, { texto: 'Editar desembarque' }]
  }
  return [{ texto: 'Página no encontrada' }]
}

/**
 * Encabezado con el título de la aplicación (requisito de la práctica): "PescaControl" como
 * <h1>, la página actual en migas de pan y las acciones globales (buscar con Ctrl+K,
 * atajos y, en móvil, el tema).
 */
function Header() {
  const { pathname } = useLocation()
  const { tema, alternarTema } = useAppContext()
  const { abrir } = useShell()
  const migas = migasDe(pathname)
  const esOscuro = tema === 'dark'

  return (
    <header className="pc-header">
      <div className="pc-header-titulo">
        <span className="pc-header-marca" aria-hidden="true">
          <Marca />
        </span>
        <h1 className="pc-titulo-app">
          <Link to="/" className="pc-titulo-app-enlace">
            PescaControl
          </Link>
        </h1>
        <nav aria-label="Ruta de navegación" className="pc-migas">
          <ol>
            {migas.map((miga, indice) => (
              <li key={miga.texto} aria-current={indice === migas.length - 1 ? 'page' : undefined}>
                <i className="bi bi-chevron-right pc-migas-separador" aria-hidden="true" />
                {miga.ruta ? <Link to={miga.ruta}>{miga.texto}</Link> : <span>{miga.texto}</span>}
              </li>
            ))}
          </ol>
        </nav>
      </div>

      <div className="pc-header-acciones">
        <button type="button" className="pc-buscador" onClick={() => abrir('paleta')}>
          <i className="bi bi-search" aria-hidden="true" />
          <span className="pc-buscador-texto">Buscar embarcación, código o matrícula</span>
          <Tecla mod className="pc-buscador-tecla">
            K
          </Tecla>
        </button>
        <button
          type="button"
          className="btn pc-boton-icono d-lg-none"
          onClick={alternarTema}
          aria-label={esOscuro ? 'Activar tema claro' : 'Activar tema oscuro'}
        >
          <i className={`bi ${esOscuro ? 'bi-sun' : 'bi-moon-stars'}`} aria-hidden="true" />
        </button>
      </div>
    </header>
  )
}

export default Header
