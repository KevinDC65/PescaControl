/**
 * Indicador de carga reutilizable con el texto "Loading..." (requisito de la práctica).
 * El dibujo es una boya de señal que se mece sobre el oleaje mientras se espera.
 * Lo usan Desembarques (carga inicial) y Registro (al abrir un desembarque para editarlo).
 */
function Loading({ texto = 'Loading...', compacto = false }) {
  return (
    <div
      className={`pc-loading ${compacto ? 'pc-loading-compacto' : ''}`}
      role="status"
      aria-live="polite"
    >
      <span className="pc-boya-carga" aria-hidden="true">
        <svg viewBox="0 0 22 30" focusable="false">
          <path d="M11 1.5v6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          <path d="M8 1.5h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          <path d="M3.5 27 6.4 9h9.2l2.9 18Z" fill="var(--pc-boya)" />
          <path d="M5.2 17.6h11.6" stroke="var(--pc-superficie)" strokeWidth="1.6" />
        </svg>
      </span>
      <span className="pc-loading-texto">{texto}</span>
    </div>
  )
}

export default Loading
