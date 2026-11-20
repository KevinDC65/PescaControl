import InsigniaRol from '../InsigniaRol.tsx'

/** Acción del sistema y si cada rol puede hacerla. */
interface FilaPermiso {
  accion: string
  detalle: string
  operador: boolean
  jefe: boolean
}

const PERMISOS: readonly FilaPermiso[] = [
  {
    accion: 'Ver el panel de operaciones',
    detalle: 'Toneladas, valor, atención y reparto por especie y puerto',
    operador: true,
    jefe: true,
  },
  {
    accion: 'Registrar desembarques',
    detalle: 'Con validación de matrícula, código, toneladas y fecha',
    operador: true,
    jefe: true,
  },
  {
    accion: 'Editar desembarques',
    detalle: 'Actualizar el estado mientras se descarga o corregir un dato',
    operador: true,
    jefe: true,
  },
  {
    accion: 'Eliminar desembarques',
    detalle: 'Uno por uno o varios a la vez, con confirmación',
    operador: false,
    jefe: true,
  },
  {
    accion: 'Gestionar usuarios',
    detalle: 'Cambiar el rol de una cuenta y activarla o desactivarla',
    operador: false,
    jefe: true,
  },
]

/** Celda de permiso: ícono y texto, nunca solo color. */
function Celda({ permitido }: { permitido: boolean }) {
  return (
    <td className="pc-permiso" data-permitido={permitido}>
      <i
        className={`bi ${permitido ? 'bi-check-circle-fill' : 'bi-dash-circle'}`}
        aria-hidden="true"
      />
      <span>{permitido ? 'Sí' : 'No'}</span>
    </td>
  )
}

/**
 * Qué hace cada rol, en una tabla de permisos. Es la misma regla que aplica el servidor:
 * la interfaz solo esconde lo que el rol no puede hacer.
 */
function Roles() {
  return (
    <section id="roles" className="pc-bloque pc-roles" aria-labelledby="titulo-roles">
      <div className="pc-envoltura pc-roles-rejilla">
        <div>
          <h2 id="titulo-roles" className="pc-bloque-titulo">
            Dos roles, permisos claros
          </h2>
          <p className="pc-bloque-texto">
            El Operador trabaja en el muelle: registra cada descarga y la mantiene al día. El Jefe
            responde por los datos: además puede eliminar registros y administrar las cuentas del
            equipo.
          </p>
          <p className="pc-roles-nota">
            <i className="bi bi-info-circle" aria-hidden="true" />
            La primera cuenta del sistema es Jefe; las siguientes empiezan como Operador y un Jefe
            decide si cambian de rol.
          </p>
        </div>

        <div className="pc-tabla-permisos">
          <table className="table align-middle mb-0">
            <caption className="visually-hidden">Permisos de cada rol en PescaControl</caption>
            <thead>
              <tr>
                <th scope="col">Acción</th>
                <th scope="col" className="text-center">
                  <InsigniaRol rol="operador" />
                </th>
                <th scope="col" className="text-center">
                  <InsigniaRol rol="jefe" />
                </th>
              </tr>
            </thead>
            <tbody>
              {PERMISOS.map((fila) => (
                <tr key={fila.accion}>
                  <th scope="row">
                    <span className="pc-permiso-accion">{fila.accion}</span>
                    <span className="pc-permiso-detalle">{fila.detalle}</span>
                  </th>
                  <Celda permitido={fila.operador} />
                  <Celda permitido={fila.jefe} />
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}

export default Roles
