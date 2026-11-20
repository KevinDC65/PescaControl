import type { Rol } from '../types/usuario.ts'

/** Texto e ícono de cada rol. */
const ROLES: Record<Rol, { texto: string; icono: string }> = {
  jefe: { texto: 'Jefe', icono: 'bi-shield-check' },
  operador: { texto: 'Operador', icono: 'bi-person-badge' },
}

/** Propiedades de `InsigniaRol`. */
interface PropsInsigniaRol {
  rol: Rol
  /** Versión para fondos oscuros (barra lateral). */
  sobreOscuro?: boolean
  className?: string
}

/** Insignia del rol del usuario (Operador o Jefe), con ícono y texto. */
function InsigniaRol({ rol, sobreOscuro = false, className = '' }: PropsInsigniaRol) {
  const { texto, icono } = ROLES[rol] ?? ROLES.operador
  return (
    <span
      className={`pc-rol ${className}`}
      data-rol={rol}
      data-sobre-oscuro={sobreOscuro || undefined}
    >
      <i className={`bi ${icono}`} aria-hidden="true" />
      {texto}
    </span>
  )
}

/** Nombre legible de un rol. */
// oxlint-disable-next-line react/only-export-components
export const nombreRol = (rol: Rol): string => (ROLES[rol] ?? ROLES.operador).texto

export default InsigniaRol
