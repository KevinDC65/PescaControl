import { useMotionValueEvent, useScroll } from 'motion/react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAppContext } from '../../context/AppContext.tsx'
import { RUTA_PANEL } from '../../utils/sesion.ts'
import Marca from '../Marca.tsx'

const SECCIONES = [
  { id: 'como-funciona', texto: 'Cómo funciona' },
  { id: 'modulos', texto: 'Módulos' },
  { id: 'litoral', texto: 'Puertos' },
  { id: 'roles', texto: 'Roles' },
] as const

/**
 * Barra superior de la página principal: marca, secciones, tema y acceso. Sobre la portada
 * es transparente; al bajar toma la superficie de la página para que el texto se lea
 * sobre cualquier sección. Con sesión ofrece "Ir al panel" en lugar de Ingresar/Crear.
 */
function BarraPublica() {
  const { usuario, tema, alternarTema } = useAppContext()
  const { scrollY } = useScroll()
  const [despegada, setDespegada] = useState(false)
  const esOscuro = tema === 'dark'

  useMotionValueEvent(scrollY, 'change', (posicion) => {
    const nueva = posicion > 24
    if (nueva !== despegada) setDespegada(nueva)
  })

  return (
    <header className="pc-barra-publica" data-despegada={despegada}>
      <div className="pc-barra-publica-interior">
        <Link to="/" className="pc-barra-marca" aria-label="PescaControl, página principal">
          <Marca />
          <span>PescaControl</span>
        </Link>

        <nav className="pc-barra-secciones" aria-label="Secciones de la página">
          <ul>
            {SECCIONES.map((seccion) => (
              <li key={seccion.id}>
                <a href={`#${seccion.id}`}>{seccion.texto}</a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="pc-barra-acciones">
          <button
            type="button"
            className="btn pc-boton-icono pc-barra-tema"
            onClick={alternarTema}
            aria-label={esOscuro ? 'Activar tema claro' : 'Activar tema oscuro'}
            title={esOscuro ? 'Tema claro' : 'Tema oscuro'}
          >
            <i className={`bi ${esOscuro ? 'bi-sun' : 'bi-moon-stars'}`} aria-hidden="true" />
          </button>
          {usuario ? (
            <Link to={RUTA_PANEL} className="btn btn-primary pc-barra-boton">
              Ir al panel
              <i className="bi bi-arrow-right" aria-hidden="true" />
            </Link>
          ) : (
            <>
              <Link to="/ingresar" className="btn pc-barra-ingresar">
                Ingresar
              </Link>
              <Link to="/crear-cuenta" className="btn btn-primary pc-barra-boton pc-barra-crear">
                Crear cuenta
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

export default BarraPublica
