/** Propiedades de `Esqueleto`. */
interface PropsEsqueleto {
  /** Ancho CSS (ej. "45%", "4rem"). */
  ancho?: string
  /** Alto CSS (ej. "1rem"). */
  alto?: string
  className?: string
}

/**
 * Bloque de carga con la forma del contenido que va a llegar. Es decorativo: el estado
 * de carga se anuncia aparte (componente Loading o texto con role="status").
 */
function Esqueleto({ ancho = '100%', alto = '1rem', className = '' }: PropsEsqueleto) {
  return (
    <span
      className={`pc-esqueleto ${className}`}
      style={{ width: ancho, height: alto }}
      aria-hidden="true"
    />
  )
}

export default Esqueleto
