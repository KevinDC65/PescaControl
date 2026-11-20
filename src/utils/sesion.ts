// Utilidades de la sesión del lado del navegador. La sesión real vive en una cookie httpOnly
// que pone el servidor: aquí solo se decide a dónde volver tras ingresar.

/** Rutas públicas de acceso: nunca son un destino de retorno válido. */
const RUTAS_ACCESO = ['/ingresar', '/crear-cuenta']

/** Ruta a la que se entra por defecto con la sesión iniciada. */
export const RUTA_PANEL = '/panel'

/**
 * Ruta interna segura a la que volver tras iniciar sesión, leída del parámetro `volver`.
 * Solo acepta rutas de la propia app (empiezan con "/" y no con "//") que no sean las
 * páginas de acceso; cualquier otra cosa lleva al panel.
 */
export function rutaDeRetorno(parametros: URLSearchParams): string {
  const volver = parametros.get('volver') ?? ''
  const esInterna = volver.startsWith('/') && !volver.startsWith('//') && !volver.includes('\\')
  const ruta = volver.split(/[?#]/)[0] ?? ''
  if (!esInterna || RUTAS_ACCESO.includes(ruta)) return RUTA_PANEL
  return volver
}

/** URL de la página de ingreso que, tras iniciar sesión, devuelve a `ruta`. */
export function urlIngresoConRetorno(ruta: string): string {
  return `/ingresar?volver=${encodeURIComponent(ruta || RUTA_PANEL)}`
}

/** Clave de la sesión simulada anterior; se borra al cargar la app. */
export const CLAVE_USUARIO_ANTERIOR = 'pescacontrol:usuario'
