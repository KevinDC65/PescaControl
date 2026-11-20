import { Link, NavLink } from 'react-router-dom'
import { useAppContext } from '../context/AppContext.tsx'
import { useCerrarSesion } from '../hooks/useCerrarSesion.ts'
import { useConteoOperaciones } from '../hooks/useConteoOperaciones.ts'
import { useLocalStorage } from '../hooks/useLocalStorage.ts'
import { useShell } from '../hooks/useShell.ts'
import { RUTA_PANEL } from '../utils/sesion.ts'
import Drawer from './Drawer.tsx'
import InsigniaRol from './InsigniaRol.tsx'
import Marca from './Marca.tsx'

/** Enlace de la navegación principal. */
interface EnlaceNavegacion {
  ruta: string
  texto: string
  /** Clase de Bootstrap Icons. */
  icono: string
  /** Activo solo en la ruta exacta (NavLink `end`). */
  exacto?: boolean
  /** Solo se muestra a los Jefes. */
  soloJefe?: boolean
}

const ENLACES: readonly EnlaceNavegacion[] = [
  { ruta: RUTA_PANEL, texto: 'Panel', icono: 'bi-compass', exacto: true },
  { ruta: '/registro', texto: 'Registrar desembarque', icono: 'bi-plus-square' },
  { ruta: '/lista', texto: 'Desembarques', icono: 'bi-list-columns-reverse' },
  { ruta: '/usuarios', texto: 'Usuarios', icono: 'bi-people', soloJefe: true },
]

/** Lista filtrada a los desembarques Observados o En descarga. */
const RUTA_ATENCION = '/lista?atencion=1'

/**
 * Navegación principal con enlaces de React Router (NavLink marca la página activa).
 * - Escritorio (≥ 992 px): barra lateral con marca, enlaces, contadores de operaciones,
 *   usuario (nombre, rol y cerrar sesión) y tema al pie. Se contrae a solo íconos y el
 *   estado se recuerda (useLocalStorage). "Usuarios" solo aparece para el rol Jefe.
 * - Móvil: barra inferior al alcance del pulgar y una hoja "Más" con la cuenta y el tema.
 */
function Navbar() {
  const { usuario, esJefe, tema, alternarTema } = useAppContext()
  const { salir, saliendo } = useCerrarSesion()
  const { panel, abrir, cerrar } = useShell()
  const [colapsada, setColapsada] = useLocalStorage('pescacontrol:barra-colapsada', false)
  const conteo = useConteoOperaciones()
  const esOscuro = tema === 'dark'
  const enlaces = ENLACES.filter((enlace) => esJefe || !enlace.soloJefe)
  const inicial = usuario?.nombre.charAt(0).toUpperCase() ?? ''

  const contador = (ruta: string): number | null => {
    if (ruta === '/lista' && conteo.total !== null) return conteo.total
    return null
  }

  return (
    <>
      <div className="pc-riel-columna">
        <aside className="pc-riel" id="barra-lateral" data-colapsada={colapsada}>
          <div className="pc-riel-marca">
            <Link to={RUTA_PANEL} className="pc-marca" title="PescaControl · Panel">
              <Marca />
              <span className="pc-riel-texto pc-marca-texto">
                <span className="pc-marca-nombre">PescaControl</span>
                <span className="pc-marca-sub">Operaciones y desembarque</span>
              </span>
            </Link>
          </div>
          <span className="pc-regla" aria-hidden="true" />

          <nav aria-label="Principal">
            <ul className="pc-riel-enlaces">
              {enlaces.map((enlace) => (
                <li key={enlace.ruta}>
                  <NavLink
                    to={enlace.ruta}
                    end={enlace.exacto}
                    className="pc-riel-enlace"
                    title={colapsada ? enlace.texto : undefined}
                  >
                    <i className={`bi ${enlace.icono}`} aria-hidden="true" />
                    <span className="pc-riel-texto">{enlace.texto}</span>
                    {contador(enlace.ruta) !== null && (
                      <span className="pc-riel-contador pc-riel-texto">
                        {contador(enlace.ruta)}
                        <span className="visually-hidden"> desembarques</span>
                      </span>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          {conteo.atencion !== null && conteo.atencion > 0 && (
            <Link
              to={RUTA_ATENCION}
              className="pc-riel-alerta"
              title={`${conteo.atencion} ${conteo.atencion === 1 ? 'desembarque requiere' : 'desembarques requieren'} atención`}
            >
              <span className="pc-riel-alerta-punto" aria-hidden="true" />
              <span className="pc-riel-texto">
                <strong>{conteo.atencion}</strong> requieren atención
              </span>
              <span className="visually-hidden"> (observados o en descarga)</span>
            </Link>
          )}

          <div className="pc-riel-pie">
            {usuario && (
              <div className="pc-riel-usuario">
                <span className="pc-avatar" aria-hidden="true" title={usuario.nombre}>
                  {inicial}
                </span>
                <span className="pc-riel-texto pc-riel-usuario-datos">
                  <span className="pc-riel-usuario-nombre" title={usuario.nombre}>
                    {usuario.nombre}
                  </span>
                  <InsigniaRol rol={usuario.rol} sobreOscuro />
                </span>
                <button
                  type="button"
                  className="pc-riel-icono pc-riel-salir"
                  onClick={() => void salir()}
                  disabled={saliendo}
                  aria-label={`Cerrar sesión de ${usuario.nombre}`}
                  title="Cerrar sesión"
                >
                  <i className="bi bi-box-arrow-right" aria-hidden="true" />
                </button>
              </div>
            )}

            <div className="pc-riel-herramientas">
              <button
                type="button"
                className="pc-riel-icono"
                onClick={alternarTema}
                aria-label={esOscuro ? 'Activar tema claro' : 'Activar tema oscuro'}
                title={esOscuro ? 'Tema claro' : 'Tema oscuro'}
              >
                <i className={`bi ${esOscuro ? 'bi-sun' : 'bi-moon-stars'}`} aria-hidden="true" />
              </button>
              <button
                type="button"
                className="pc-riel-icono"
                onClick={() => abrir('ayuda')}
                aria-label="Ver atajos de teclado"
                title="Atajos de teclado (?)"
              >
                <i className="bi bi-keyboard" aria-hidden="true" />
              </button>
              <button
                type="button"
                className="pc-riel-icono ms-auto pc-riel-contraer"
                onClick={() => setColapsada((valor) => !valor)}
                aria-expanded={!colapsada}
                aria-controls="barra-lateral"
                aria-label={colapsada ? 'Expandir barra lateral' : 'Contraer barra lateral'}
                title={colapsada ? 'Expandir' : 'Contraer'}
              >
                <i
                  className={`bi ${colapsada ? 'bi-layout-sidebar' : 'bi-layout-sidebar-inset'}`}
                  aria-hidden="true"
                />
              </button>
            </div>
          </div>
        </aside>
      </div>

      <nav className="pc-tabbar" aria-label="Navegación móvil">
        <NavLink to={RUTA_PANEL} end className="pc-tab">
          <i className="bi bi-compass" aria-hidden="true" />
          <span>Panel</span>
        </NavLink>
        <NavLink to="/lista" className="pc-tab">
          <i className="bi bi-list-columns-reverse" aria-hidden="true" />
          <span>Desembarques</span>
        </NavLink>
        <NavLink
          to="/registro"
          className="pc-tab pc-tab-principal"
          aria-label="Registrar desembarque"
        >
          <span className="pc-tab-boton">
            <i className="bi bi-plus-lg" aria-hidden="true" />
          </span>
          <span aria-hidden="true">Registrar</span>
        </NavLink>
        <button type="button" className="pc-tab" onClick={() => abrir('paleta')}>
          <i className="bi bi-search" aria-hidden="true" />
          <span>Buscar</span>
        </button>
        <button
          type="button"
          className="pc-tab"
          onClick={() => abrir('mas')}
          aria-expanded={panel === 'mas'}
          aria-haspopup="dialog"
        >
          {usuario ? (
            <span className="pc-avatar pc-avatar-sm" aria-hidden="true">
              {inicial}
            </span>
          ) : (
            <i className="bi bi-three-dots" aria-hidden="true" />
          )}
          <span>Más</span>
        </button>
      </nav>

      <Drawer abierto={panel === 'mas'} onCerrar={cerrar} titulo="Más opciones" lado="abajo">
        {usuario && (
          <div className="pc-hoja-seccion">
            <div className="d-flex align-items-center gap-3">
              <span className="pc-avatar pc-avatar-lg" aria-hidden="true">
                {inicial}
              </span>
              <div className="flex-grow-1 min-w-0">
                <p className="mb-0 fw-semibold text-truncate">{usuario.nombre}</p>
                <p className="mb-1 small text-body-secondary text-truncate">{usuario.correo}</p>
                <InsigniaRol rol={usuario.rol} />
              </div>
            </div>
            <button
              type="button"
              className="btn btn-outline-secondary w-100 mt-3 d-inline-flex align-items-center justify-content-center gap-2"
              onClick={() => {
                cerrar()
                void salir()
              }}
              disabled={saliendo}
            >
              <i className="bi bi-box-arrow-right" aria-hidden="true" />
              Cerrar sesión
            </button>
          </div>
        )}
        <ul className="pc-hoja-lista">
          {esJefe && (
            <li>
              <Link to="/usuarios" className="pc-hoja-fila" onClick={cerrar}>
                <i className="bi bi-people" aria-hidden="true" />
                <span className="flex-grow-1">Usuarios</span>
                <i className="bi bi-chevron-right small" aria-hidden="true" />
              </Link>
            </li>
          )}
          <li>
            <button
              type="button"
              className="pc-hoja-fila"
              role="switch"
              aria-checked={esOscuro}
              onClick={alternarTema}
            >
              <i className="bi bi-moon-stars" aria-hidden="true" />
              <span className="flex-grow-1">Tema oscuro</span>
              <span className="pc-interruptor" aria-hidden="true" />
            </button>
          </li>
          <li>
            <Link to={RUTA_ATENCION} className="pc-hoja-fila" onClick={cerrar}>
              <i className="bi bi-exclamation-diamond" aria-hidden="true" />
              <span className="flex-grow-1">Requieren atención</span>
              {conteo.atencion !== null && (
                <span className="pc-riel-contador">{conteo.atencion}</span>
              )}
            </Link>
          </li>
          <li>
            <Link to="/" className="pc-hoja-fila" onClick={cerrar}>
              <i className="bi bi-water" aria-hidden="true" />
              <span className="flex-grow-1">Página principal</span>
              <i className="bi bi-chevron-right small" aria-hidden="true" />
            </Link>
          </li>
          <li>
            <a
              href="https://github.com/KevinDC65/PescaControl"
              target="_blank"
              rel="noreferrer"
              className="pc-hoja-fila"
            >
              <i className="bi bi-github" aria-hidden="true" />
              <span className="flex-grow-1">Repositorio en GitHub</span>
              <i className="bi bi-box-arrow-up-right small" aria-hidden="true" />
            </a>
          </li>
        </ul>
      </Drawer>
    </>
  )
}

export default Navbar
