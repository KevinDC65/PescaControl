import type { ReactNode } from 'react'
import { useAppContext } from '../context/AppContext.tsx'
import type { Rol } from '../types/usuario.ts'

/** Propiedades de `Permiso`. */
interface PropsPermiso {
  /** Rol necesario. Un Jefe cumple también el rol Operador. */
  rol: Rol
  children: ReactNode
  /** Qué mostrar si el usuario no tiene el rol (por defecto, nada). */
  alternativa?: ReactNode
}

/**
 * Renderizado condicional por rol: `<Permiso rol="jefe">…</Permiso>` muestra su contenido
 * solo a los Jefes. Es una ayuda visual: el servidor vuelve a comprobar cada permiso.
 */
function Permiso({ rol, children, alternativa = null }: PropsPermiso) {
  const { tieneRol } = useAppContext()
  return tieneRol(rol) ? children : alternativa
}

export default Permiso
