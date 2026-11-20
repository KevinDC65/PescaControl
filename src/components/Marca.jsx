/**
 * Sello de PescaControl: una boya de señal naranja flotando sobre dos líneas de oleaje,
 * en un recuadro de océano nocturno. SVG propio, decorativo.
 */
function Marca({ className = '' }) {
  return (
    <svg
      className={`pc-sello ${className}`}
      viewBox="0 0 32 32"
      aria-hidden="true"
      focusable="false"
    >
      <rect width="32" height="32" rx="7" fill="#0c2b3e" />
      <path d="M16 6.5v4.5" stroke="#dfe9ec" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M13.6 6.5h4.8" stroke="#dfe9ec" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M10.5 20.5 12.6 12h6.8l2.1 8.5Z" fill="#ff8a3d" />
      <path d="M11.6 16.2h8.8" stroke="#0c2b3e" strokeWidth="1.4" />
      <path
        d="M5 21.6c2.2 0 2.2-1.6 4.4-1.6s2.2 1.6 4.4 1.6 2.2-1.6 4.4-1.6 2.2 1.6 4.4 1.6 2.2-1.6 4.4-1.6"
        fill="none"
        stroke="#6cc3e8"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M7.2 25.6c2.2 0 2.2-1.6 4.4-1.6s2.2 1.6 4.4 1.6 2.2-1.6 4.4-1.6 2.2 1.6 4.4 1.6"
        fill="none"
        stroke="#6cc3e8"
        strokeOpacity=".55"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  )
}

export default Marca
