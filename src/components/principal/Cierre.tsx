import { Link } from 'react-router-dom'
import { useAppContext } from '../../context/AppContext.tsx'
import { RUTA_PANEL } from '../../utils/sesion.ts'
import Marca from '../Marca.tsx'
import { Embarcacion, Ola } from '../escena/Escena.tsx'

// El año se calcula una vez al cargar la página.
const anio = new Date().getFullYear()

/**
 * Llamado final y pie de la página principal: una embarcación atracada sobre el oleaje en
 * calma, las acciones de acceso y el pie con la universidad y el repositorio.
 */
function Cierre() {
  const { usuario } = useAppContext()

  return (
    <section className="pc-cierre" aria-labelledby="titulo-cierre">
      <div className="pc-envoltura pc-cierre-contenido">
        <h2 id="titulo-cierre" className="pc-cierre-titulo">
          El próximo desembarque ya puede quedar registrado.
        </h2>
        <p className="pc-cierre-texto">
          Crear una cuenta toma un minuto. Si eres la primera persona de tu equipo, entras como Jefe
          y das de alta a los demás.
        </p>
        <div className="pc-cierre-acciones">
          {usuario ? (
            <Link to={RUTA_PANEL} className="btn btn-primary btn-lg pc-boton-principal">
              Ir al panel
              <i className="bi bi-arrow-right" aria-hidden="true" />
            </Link>
          ) : (
            <>
              <Link to="/crear-cuenta" className="btn btn-primary btn-lg pc-boton-principal">
                Crear cuenta
                <i className="bi bi-arrow-right" aria-hidden="true" />
              </Link>
              <Link to="/ingresar" className="btn btn-lg pc-boton-secundario">
                Ingresar
              </Link>
            </>
          )}
        </div>
      </div>
      <div className="pc-cierre-mar" aria-hidden="true">
        <div className="pc-cierre-barco">
          <Embarcacion />
        </div>
        <Ola className="pc-ola-media" longitud={160} amplitud={5} />
        <Ola className="pc-ola-cercana" longitud={400} amplitud={8} />
      </div>
    </section>
  )
}

/** Pie de la página principal: marca, universidad y repositorio. */
export function PiePublico() {
  return (
    <footer className="pc-pie-publico" data-bs-theme="dark">
      <div className="pc-envoltura pc-pie-publico-interior">
        <div className="pc-pie-marca">
          <Marca />
          <div>
            <p className="pc-pie-nombre">PescaControl</p>
            <p className="pc-pie-sub">Sistema de Gestión de Operaciones Pesqueras y Desembarque</p>
          </div>
        </div>
        <p className="pc-pie-utp">
          Proyecto académico · Universidad Tecnológica del Perú · © {anio}
        </p>
        <a
          href="https://github.com/KevinDC65/PescaControl"
          target="_blank"
          rel="noreferrer"
          className="pc-pie-enlace"
        >
          <i className="bi bi-github" aria-hidden="true" />
          Repositorio en GitHub
          <span className="visually-hidden"> (se abre en otra pestaña)</span>
        </a>
      </div>
    </footer>
  )
}

export default Cierre
