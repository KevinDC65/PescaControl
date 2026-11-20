import { hash } from 'bcryptjs'
import { z } from 'zod'
import type { Rol } from '../src/types/usuario.ts'
import { AlmacenUsuarios } from './almacen/usuarios.ts'
import { rutaUsuariosDesde } from './config.ts'
import { COSTE_HASH, esquemaRegistro } from './rutas/auth.ts'

// Crea el Jefe y el Operador de demostración con las variables DEMO_* del .env.
// Es idempotente: si el correo ya existe no lo toca (tampoco cambia su contraseña).
// Uso: npm run seed

interface CuentaDemo {
  rol: Rol
  nombre: string
  variableCorreo: string
  variableClave: string
}

const CUENTAS: readonly CuentaDemo[] = [
  {
    rol: 'jefe',
    nombre: 'Jefe de demostración',
    variableCorreo: 'DEMO_JEFE_CORREO',
    variableClave: 'DEMO_JEFE_CLAVE',
  },
  {
    rol: 'operador',
    nombre: 'Operador de demostración',
    variableCorreo: 'DEMO_OPERADOR_CORREO',
    variableClave: 'DEMO_OPERADOR_CLAVE',
  },
]

/** Valida la cuenta con las mismas reglas del registro. */
function leerCuenta(cuenta: CuentaDemo): z.infer<typeof esquemaRegistro> {
  const resultado = esquemaRegistro.safeParse({
    nombre: cuenta.nombre,
    correo: process.env[cuenta.variableCorreo] ?? '',
    contrasena: process.env[cuenta.variableClave] ?? '',
  })
  if (resultado.success) return resultado.data
  const problemas = resultado.error.issues.map((problema) => {
    const variable =
      problema.path[0] === 'contrasena' ? cuenta.variableClave : cuenta.variableCorreo
    return `${variable}: ${problema.message}`
  })
  throw new Error(`Revisa el .env:\n- ${problemas.join('\n- ')}`)
}

async function sembrar(): Promise<void> {
  const ruta = rutaUsuariosDesde()
  const almacen = new AlmacenUsuarios(ruta)
  const datos = CUENTAS.map((cuenta) => ({ cuenta, datos: leerCuenta(cuenta) }))

  for (const { cuenta, datos: cuentaValida } of datos) {
    if (await almacen.buscarPorCorreo(cuentaValida.correo)) {
      console.info(`Ya existe ${cuentaValida.correo} (${cuenta.rol}); no se modifica.`)
      continue
    }
    await almacen.crear({
      nombre: cuentaValida.nombre,
      correo: cuentaValida.correo,
      hash: await hash(cuentaValida.contrasena, COSTE_HASH),
      rol: cuenta.rol,
    })
    console.info(`Creado ${cuentaValida.correo} (${cuenta.rol}).`)
  }
  console.info(`Usuarios en ${ruta}`)
}

sembrar().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
