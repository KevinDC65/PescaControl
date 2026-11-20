import {
  NIVELES_FORTALEZA,
  fortalezaContrasena,
  requisitosContrasena,
} from '../../utils/validarCuenta.ts'

/** Propiedades de `MedidorFortaleza`. */
interface PropsMedidorFortaleza {
  id: string
  contrasena: string
}

/**
 * Medidor de fortaleza de la contraseña nueva: cuatro tramos que se llenan, el nivel
 * escrito (no solo color) y la lista de requisitos del servidor con su estado.
 * Accesible como `role="meter"` con `aria-valuetext`; el nivel se anuncia al cambiar.
 */
function MedidorFortaleza({ id, contrasena }: PropsMedidorFortaleza) {
  const nivel = fortalezaContrasena(contrasena)
  const texto = NIVELES_FORTALEZA[nivel] ?? NIVELES_FORTALEZA[0]
  const requisitos = requisitosContrasena(contrasena)

  return (
    <div id={id} className="pc-fortaleza" data-nivel={nivel}>
      <div className="pc-fortaleza-fila">
        <div
          className="pc-fortaleza-tramos"
          role="meter"
          aria-label="Fortaleza de la contraseña"
          aria-valuemin={0}
          aria-valuemax={4}
          aria-valuenow={nivel}
          aria-valuetext={texto}
        >
          {[1, 2, 3, 4].map((tramo) => (
            <span key={tramo} data-lleno={nivel >= tramo} />
          ))}
        </div>
        <span className="pc-fortaleza-texto" aria-live="polite">
          {contrasena ? texto : 'Fortaleza'}
        </span>
      </div>
      <ul className="pc-requisitos" aria-label="Requisitos de la contraseña">
        {requisitos.map((requisito) => (
          <li key={requisito.clave} data-cumple={requisito.cumple}>
            <i
              className={`bi ${requisito.cumple ? 'bi-check-circle-fill' : 'bi-circle'}`}
              aria-hidden="true"
            />
            {requisito.texto}
            <span className="visually-hidden">
              {requisito.cumple ? ' (cumplido)' : ' (pendiente)'}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default MedidorFortaleza
