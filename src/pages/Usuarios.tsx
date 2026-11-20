import { useEffect, useState } from 'react'
import AlertMessage from '../components/AlertMessage.tsx'
import ConfirmModal from '../components/ConfirmModal.tsx'
import Esqueleto from '../components/Esqueleto.tsx'
import EstadoVacio from '../components/EstadoVacio.tsx'
import InsigniaRol, { nombreRol } from '../components/InsigniaRol.tsx'
import Loading from '../components/Loading.tsx'
import { useAppContext } from '../context/AppContext.tsx'
import { useToast } from '../hooks/useToast.ts'
import { actualizarUsuario, listarUsuarios } from '../services/usuariosService.ts'
import type { CambiosUsuario, Rol, Usuario } from '../types/usuario.ts'
import { mensajeDeError } from '../utils/errores.ts'
import { formatearFecha } from '../utils/formato.ts'

/** Desactivación que espera confirmación. */
interface Desactivacion {
  abierta: boolean
  usuario: Usuario | null
}

const plural = (cantidad: number, singular: string, varias: string) =>
  `${cantidad} ${cantidad === 1 ? singular : varias}`

/** Fecha de alta (`creadoEn` en ISO 8601) en texto corto. */
const fechaAlta = (creadoEn: string) => formatearFecha(creadoEn.slice(0, 10))

/**
 * Página /usuarios (solo Jefe): lista las cuentas con su rol y estado. El Jefe cambia el
 * rol (Operador/Jefe) y activa o desactiva cuentas; desactivar pide confirmación. Su propia
 * fila no se puede degradar ni desactivar, y el servidor además impide quedarse sin Jefes.
 */
function Usuarios() {
  const { usuario: actual } = useAppContext()
  const toast = useToast()
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [intento, setIntento] = useState(0)
  const [guardando, setGuardando] = useState<ReadonlySet<string>>(() => new Set())
  const [desactivacion, setDesactivacion] = useState<Desactivacion>({
    abierta: false,
    usuario: null,
  })

  useEffect(() => {
    let activo = true
    listarUsuarios()
      .then((lista) => {
        if (activo) setUsuarios(lista)
      })
      .catch((e) => {
        if (activo) setError(mensajeDeError(e))
      })
      .finally(() => {
        if (activo) setCargando(false)
      })
    return () => {
      activo = false
    }
  }, [intento])

  function reintentar() {
    setCargando(true)
    setError('')
    setIntento((n) => n + 1)
  }

  const marcarGuardando = (id: string, valor: boolean) =>
    setGuardando((anterior) => {
      const nuevo = new Set(anterior)
      if (valor) nuevo.add(id)
      else nuevo.delete(id)
      return nuevo
    })

  async function aplicar(usuario: Usuario, cambios: CambiosUsuario, exito: string) {
    marcarGuardando(usuario.id, true)
    try {
      const actualizado = await actualizarUsuario(usuario.id, cambios)
      setUsuarios((lista) => lista.map((fila) => (fila.id === actualizado.id ? actualizado : fila)))
      toast.exito(exito)
    } catch (e) {
      toast.error(mensajeDeError(e))
    } finally {
      marcarGuardando(usuario.id, false)
    }
  }

  function cambiarRol(usuario: Usuario, rol: Rol) {
    if (rol === usuario.rol) return
    void aplicar(usuario, { rol }, `${usuario.nombre} ahora tiene el rol ${nombreRol(rol)}.`)
  }

  function alternarActivo(usuario: Usuario) {
    if (usuario.activo) {
      setDesactivacion({ abierta: true, usuario })
      return
    }
    void aplicar(usuario, { activo: true }, `Se activó la cuenta de ${usuario.nombre}.`)
  }

  async function confirmarDesactivacion() {
    const { usuario } = desactivacion
    if (!usuario) return
    await aplicar(usuario, { activo: false }, `Se desactivó la cuenta de ${usuario.nombre}.`)
    setDesactivacion((anterior) => ({ ...anterior, abierta: false }))
  }

  const jefesActivos = usuarios.filter((fila) => fila.rol === 'jefe' && fila.activo).length
  const inactivos = usuarios.filter((fila) => !fila.activo).length
  const ordenados = [...usuarios].sort((a, b) => {
    if (a.id === actual?.id) return -1
    if (b.id === actual?.id) return 1
    return a.nombre.localeCompare(b.nombre, 'es')
  })

  function contenido() {
    if (cargando) {
      return (
        <>
          <Loading />
          <div className="pc-panel pc-usuarios-esqueleto" aria-hidden="true">
            {[0, 1, 2, 3].map((fila) => (
              <div key={fila} className="pc-usuarios-esqueleto-fila">
                <Esqueleto ancho="2.25rem" alto="2.25rem" />
                <Esqueleto ancho={`${28 + ((fila * 11) % 20)}%`} alto="0.875rem" />
                <Esqueleto ancho="6rem" alto="1.75rem" className="ms-auto" />
                <Esqueleto ancho="2.75rem" alto="1.5rem" />
              </div>
            ))}
          </div>
        </>
      )
    }

    if (error) {
      return (
        <AlertMessage tipo="danger" mensaje={error}>
          <div className="mt-3">
            <button
              type="button"
              className="btn btn-sm btn-danger d-inline-flex align-items-center gap-2"
              onClick={reintentar}
            >
              <i className="bi bi-arrow-clockwise" aria-hidden="true" />
              Reintentar
            </button>
          </div>
        </AlertMessage>
      )
    }

    if (usuarios.length === 0) {
      return (
        <EstadoVacio ilustracion="muelle" titulo="Aún no hay usuarios registrados">
          Cuando alguien cree su cuenta en PescaControl aparecerá aquí con el rol Operador, y podrás
          cambiar su rol o desactivarla.
        </EstadoVacio>
      )
    }

    return (
      <>
        <div className="pc-tabla pc-usuarios">
          <table className="table align-middle mb-0">
            <caption className="visually-hidden">
              Usuarios del sistema con su rol, estado y fecha de alta.
            </caption>
            <thead>
              <tr>
                <th scope="col">Usuario</th>
                <th scope="col" className="pc-u-correo">
                  Correo
                </th>
                <th scope="col">Rol</th>
                <th scope="col">Estado</th>
                <th scope="col" className="pc-u-alta">
                  Alta
                </th>
              </tr>
            </thead>
            <tbody>
              {ordenados.map((usuario) => {
                const esActual = usuario.id === actual?.id
                const ocupado = guardando.has(usuario.id)
                const idRol = `rol-${usuario.id}`
                return (
                  <tr key={usuario.id} data-inactivo={!usuario.activo} aria-busy={ocupado}>
                    <th scope="row" className="pc-u-nombre">
                      <span className="pc-avatar" aria-hidden="true">
                        {usuario.nombre.charAt(0).toUpperCase()}
                      </span>
                      <span className="min-w-0">
                        <span className="pc-u-nombre-texto">
                          {usuario.nombre}
                          {esActual && <span className="pc-u-tu">Tú</span>}
                        </span>
                        <span className="pc-u-correo-movil">{usuario.correo}</span>
                      </span>
                    </th>
                    <td className="pc-u-correo">{usuario.correo}</td>
                    <td className="pc-u-rol">
                      {esActual ? (
                        <span title="No puedes cambiar tu propio rol">
                          <InsigniaRol rol={usuario.rol} />
                        </span>
                      ) : (
                        <>
                          <label htmlFor={idRol} className="visually-hidden">
                            Rol de {usuario.nombre}
                          </label>
                          <select
                            id={idRol}
                            className="form-select form-select-sm pc-u-select"
                            value={usuario.rol}
                            disabled={ocupado}
                            onChange={(evento) =>
                              cambiarRol(
                                usuario,
                                evento.target.value === 'jefe' ? 'jefe' : 'operador',
                              )
                            }
                          >
                            <option value="operador">Operador</option>
                            <option value="jefe">Jefe</option>
                          </select>
                        </>
                      )}
                    </td>
                    <td className="pc-u-estado">
                      <div className="form-check form-switch m-0 pc-u-interruptor">
                        <input
                          id={`activo-${usuario.id}`}
                          type="checkbox"
                          role="switch"
                          className="form-check-input"
                          checked={usuario.activo}
                          disabled={esActual || ocupado}
                          onChange={() => alternarActivo(usuario)}
                          aria-describedby={esActual ? 'usuarios-nota-propia' : undefined}
                        />
                        <label className="form-check-label" htmlFor={`activo-${usuario.id}`}>
                          {usuario.activo ? 'Activa' : 'Desactivada'}
                          <span className="visually-hidden"> · cuenta de {usuario.nombre}</span>
                        </label>
                        {ocupado && (
                          <span
                            className="spinner-border spinner-border-sm ms-2 text-secondary"
                            role="status"
                          >
                            <span className="visually-hidden">Guardando…</span>
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="pc-u-alta text-nowrap">{fechaAlta(usuario.creadoEn)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <p id="usuarios-nota-propia" className="pc-usuarios-nota">
          <i className="bi bi-info-circle" aria-hidden="true" />
          Tu propia cuenta no se puede degradar ni desactivar, y el sistema siempre debe tener al
          menos un Jefe activo.
        </p>
      </>
    )
  }

  return (
    <section className="pc-usuarios-pagina" aria-labelledby="titulo-usuarios">
      <header className="pc-cabecera-pagina">
        <div>
          <h2 id="titulo-usuarios" className="pc-titulo-pagina">
            Usuarios
          </h2>
          <p className="pc-bajada">
            {cargando || error
              ? 'Cuentas con acceso a PescaControl, su rol y su estado.'
              : `${plural(usuarios.length, 'cuenta', 'cuentas')} · ${plural(jefesActivos, 'Jefe activo', 'Jefes activos')}${inactivos ? ` · ${plural(inactivos, 'desactivada', 'desactivadas')}` : ''}.`}
          </p>
        </div>
      </header>

      {contenido()}

      <ConfirmModal
        abierto={desactivacion.abierta}
        titulo="Desactivar cuenta"
        textoConfirmar="Desactivar"
        iconoConfirmar="bi-person-dash"
        varianteConfirmar="danger"
        textoCargando="Desactivando..."
        cargando={Boolean(desactivacion.usuario && guardando.has(desactivacion.usuario.id))}
        onConfirm={() => void confirmarDesactivacion()}
        onCancel={() => setDesactivacion((anterior) => ({ ...anterior, abierta: false }))}
      >
        <p className="mb-0">
          <strong>{desactivacion.usuario?.nombre}</strong> no podrá ingresar a PescaControl hasta
          que vuelvas a activar su cuenta. Sus desembarques registrados no cambian.
        </p>
      </ConfirmModal>
    </section>
  )
}

export default Usuarios
