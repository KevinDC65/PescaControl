import { useEffect, useRef } from 'react'
import { formatearFechaCorta, formatearPrecio, formatearToneladas } from '../utils/formato.js'
import { valorDesembarque } from '../utils/operaciones.js'
import InsigniaEspecie from './InsigniaEspecie.jsx'
import InsigniaEstado from './InsigniaEstado.jsx'

/**
 * Columnas de la tabla. `ordenes` son los valores de ORDENES (utils/operaciones.js) que
 * aplica su encabezado: con dos, cada clic alterna entre ellos; con uno, lo fija.
 */
const COLUMNAS = [
  { clave: 'codigo', texto: 'Código', clase: 'pc-c-codigo', ordenes: ['codigo-asc'] },
  { clave: 'embarcacion', texto: 'Embarcación', clase: '', ordenes: ['embarcacion-asc'] },
  { clave: 'especie', texto: 'Especie', clase: 'pc-c-especie' },
  { clave: 'puerto', texto: 'Puerto', clase: 'pc-c-puerto' },
  {
    clave: 'toneladas',
    texto: 'Toneladas',
    clase: 'text-end',
    ordenes: ['toneladas-desc', 'toneladas-asc'],
  },
  {
    clave: 'valor',
    texto: 'Valor',
    clase: 'pc-c-valor text-end',
    ordenes: ['valor-desc'],
  },
  {
    clave: 'fecha',
    texto: 'Fecha',
    clase: 'pc-c-fecha',
    ordenes: ['fecha-desc', 'fecha-asc'],
  },
  { clave: 'estado', texto: 'Estado', clase: 'pc-c-estado' },
]

/** Elementos dentro de la fila que no deben abrir el detalle al hacer clic. */
const INTERACTIVOS = 'button, a, input, label'

/** Dirección de `aria-sort` para un valor de orden. */
const direccionDe = (orden) => (orden.endsWith('-desc') ? 'descending' : 'ascending')

/**
 * Tabla densa de desembarques: encabezados que ordenan al hacer clic (con los órdenes de
 * ORDENES), selección múltiple con casillas y acciones por fila (ver, editar, eliminar).
 * En pantallas angostas se ocultan columnas secundarias y sus datos pasan a la línea bajo
 * la embarcación; tocar la fila abre el detalle.
 */
function TablaDesembarques({
  desembarques,
  orden,
  onOrdenar,
  seleccion,
  onSeleccionar,
  onSeleccionarTodos,
  onAbrir,
  onEditar,
  onEliminar,
}) {
  const todosRef = useRef(null)
  const seleccionados = desembarques.filter((desembarque) => seleccion.has(desembarque.id)).length
  const todos = desembarques.length > 0 && seleccionados === desembarques.length

  // El estado "indeterminado" de una casilla solo se puede asignar desde el DOM.
  useEffect(() => {
    if (todosRef.current) todosRef.current.indeterminate = seleccionados > 0 && !todos
  }, [seleccionados, todos])

  return (
    <div className="pc-tabla">
      <table className="table table-hover align-middle mb-0">
        <caption className="visually-hidden">
          Desembarques registrados. Los encabezados con botón ordenan la tabla.
        </caption>
        <thead>
          <tr>
            <th scope="col" className="pc-col-check">
              <input
                ref={todosRef}
                type="checkbox"
                className="form-check-input"
                checked={todos}
                onChange={() => onSeleccionarTodos(!todos)}
                aria-label={
                  todos ? 'Quitar la selección de todos' : 'Seleccionar todos los visibles'
                }
              />
            </th>
            {COLUMNAS.map((columna) => {
              const activa = Boolean(columna.ordenes?.includes(orden))
              return (
                <th
                  key={columna.clave}
                  scope="col"
                  className={columna.clase}
                  aria-sort={activa ? direccionDe(orden) : undefined}
                >
                  {columna.ordenes ? (
                    <button
                      type="button"
                      className="pc-orden"
                      data-activa={activa}
                      onClick={() => onOrdenar(columna.ordenes)}
                    >
                      {columna.texto}
                      <i
                        className={`bi ${activa ? (direccionDe(orden) === 'descending' ? 'bi-arrow-down' : 'bi-arrow-up') : 'bi-arrow-down-up'}`}
                        aria-hidden="true"
                      />
                    </button>
                  ) : (
                    columna.texto
                  )}
                </th>
              )
            })}
            <th scope="col" className="text-end">
              <span className="visually-hidden">Acciones</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {desembarques.map((desembarque) => {
            const seleccionado = seleccion.has(desembarque.id)
            const nombre = `${desembarque.codigo} · ${desembarque.embarcacion}`
            return (
              <tr
                key={desembarque.id}
                data-seleccionada={seleccionado}
                onClick={(evento) => {
                  if (!evento.target.closest(INTERACTIVOS)) onAbrir(desembarque)
                }}
              >
                <td className="pc-col-check">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    checked={seleccionado}
                    onChange={() => onSeleccionar(desembarque.id)}
                    aria-label={`Seleccionar ${nombre}`}
                  />
                </td>
                <td className="pc-codigo pc-c-codigo">{desembarque.codigo}</td>
                <td className="pc-col-embarcacion">
                  <button
                    type="button"
                    className="pc-fila-nombre"
                    onClick={() => onAbrir(desembarque)}
                  >
                    {desembarque.embarcacion}
                  </button>
                  <span className="pc-fila-meta">
                    <span className="pc-matricula">{desembarque.matricula}</span>
                    <span className="pc-m-especie">
                      {' · '}
                      <InsigniaEspecie especie={desembarque.especie} forma="punto" />{' '}
                      {desembarque.especie} · {desembarque.puerto}
                    </span>
                    <span className="pc-m-fecha">
                      {' · '}
                      {formatearFechaCorta(desembarque.fechaDesembarque)}
                    </span>
                    <span className="pc-m-estado">
                      {' · '}
                      {desembarque.estado}
                    </span>
                  </span>
                </td>
                <td className="pc-c-especie">
                  <InsigniaEspecie especie={desembarque.especie} forma="etiqueta" />
                </td>
                <td className="pc-c-puerto text-nowrap">{desembarque.puerto}</td>
                <td className="text-end text-nowrap pc-cifra-dato">
                  {formatearToneladas(desembarque.toneladas)}
                </td>
                <td className="pc-c-valor text-end text-nowrap pc-cifras-tabla">
                  {formatearPrecio(valorDesembarque(desembarque))}
                </td>
                <td className="pc-c-fecha text-nowrap">
                  {formatearFechaCorta(desembarque.fechaDesembarque)}
                </td>
                <td className="pc-c-estado text-nowrap">
                  <InsigniaEstado estado={desembarque.estado} />
                </td>
                <td className="text-end text-nowrap pc-col-acciones">
                  <div className="pc-acciones-fila">
                    <button
                      type="button"
                      className="btn btn-sm pc-boton-fila"
                      onClick={() => onAbrir(desembarque)}
                      aria-label={`Ver detalle de ${desembarque.codigo}`}
                      title="Ver detalle"
                    >
                      <i className="bi bi-layout-sidebar-inset-reverse" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm pc-boton-fila"
                      onClick={() => onEditar(desembarque)}
                      aria-label={`Editar ${desembarque.codigo}`}
                      title="Editar"
                    >
                      <i className="bi bi-pencil" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm pc-boton-fila pc-boton-fila-peligro"
                      onClick={() => onEliminar(desembarque)}
                      aria-label={`Eliminar ${desembarque.codigo}`}
                      title="Eliminar"
                    >
                      <i className="bi bi-trash3" aria-hidden="true" />
                    </button>
                  </div>
                  <button
                    type="button"
                    className="btn pc-boton-fila pc-boton-abrir"
                    onClick={() => onAbrir(desembarque)}
                    aria-label={`Abrir ${desembarque.codigo}`}
                  >
                    <i className="bi bi-chevron-right" aria-hidden="true" />
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default TablaDesembarques
