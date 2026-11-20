/**
 * Bloque de carga con la forma del contenido que va a llegar. Es decorativo: el estado
 * de carga se anuncia aparte (componente Loading o texto con role="status").
 *
 * @param {{ ancho?: string, alto?: string, className?: string }} props
 */
function Esqueleto({ ancho = '100%', alto = '1rem', className = '' }) {
  return (
    <span
      className={`pc-esqueleto ${className}`}
      style={{ width: ancho, height: alto }}
      aria-hidden="true"
    />
  )
}

export default Esqueleto
