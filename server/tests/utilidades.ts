import { randomBytes } from 'node:crypto'
import { copyFile, mkdtemp, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import type { Express } from 'express'
import request, { type Response, type Test } from 'supertest'
import { expect } from 'vitest'
import type { DesembarqueNuevo } from '../../src/types/desembarque.ts'
import type { DatosRegistro } from '../../src/types/usuario.ts'
import { crearApp, type OpcionesApp } from '../app.ts'
import { RAIZ_PROYECTO } from '../config.ts'
import { COOKIE_SESION } from '../sesion.ts'

// Utilidades de las pruebas: cada entorno usa una copia temporal de db.json y un archivo de
// usuarios vacío, sin abrir ningún puerto. El db.json real solo se lee.

export interface EntornoPrueba {
  app: Express
  rutaDb: string
  rutaUsuarios: string
  limpiar: () => Promise<void>
}

export async function crearEntorno(opciones: Partial<OpcionesApp> = {}): Promise<EntornoPrueba> {
  const carpeta = await mkdtemp(path.join(os.tmpdir(), 'pescacontrol-pruebas-'))
  const rutaDb = path.join(carpeta, 'db.json')
  const rutaUsuarios = path.join(carpeta, 'usuarios.json')
  await copyFile(path.join(RAIZ_PROYECTO, 'db.json'), rutaDb)
  const app = crearApp({
    jwtSecreto: randomBytes(48).toString('hex'),
    cookieSegura: false,
    rutaDb,
    rutaUsuarios,
    costeHash: 4,
    registrarError: () => undefined,
    ...opciones,
  })
  return { app, rutaDb, rutaUsuarios, limpiar: () => rm(carpeta, { recursive: true, force: true }) }
}

/** Contraseñas usadas en las pruebas: ninguna respuesta debe contenerlas. */
const CONTRASENAS_USADAS = new Set<string>()

export const datosRegistro = (n: number, cambios: Partial<DatosRegistro> = {}): DatosRegistro => {
  const datos: DatosRegistro = {
    nombre: `Usuario ${n}`,
    correo: `usuario${n}@pescacontrol.pe`,
    contrasena: `Clave${n}segura`,
    ...cambios,
  }
  CONTRASENAS_USADAS.add(datos.contrasena)
  return datos
}

/**
 * Recorre el JSON y devuelve las rutas de las claves `hash` o `contrasena`. Dentro de `campos`
 * se permiten: ahí son nombres de campo con un mensaje de validación, no valores.
 */
function clavesProhibidas(valor: unknown, ruta = '$'): string[] {
  if (Array.isArray(valor))
    return valor.flatMap((item, i) => clavesProhibidas(item, `${ruta}[${i}]`))
  if (typeof valor !== 'object' || valor === null) return []
  return Object.entries(valor).flatMap(([clave, hijo]) => {
    const prohibida = (clave === 'hash' || clave === 'contrasena') && !ruta.endsWith('.campos')
    return [
      ...(prohibida ? [`${ruta}.${clave}`] : []),
      ...clavesProhibidas(hijo, `${ruta}.${clave}`),
    ]
  })
}

/** Comprueba que la respuesta no expone hashes, contraseñas ni stack traces. */
export function revisarSinSecretos(respuesta: Response): void {
  const texto = respuesta.text ?? ''
  expect(clavesProhibidas(respuesta.body)).toEqual([])
  expect(texto).not.toMatch(/\$2[aby]\$\d{2}\$/)
  expect(texto).not.toMatch(/\bat .+\.(ts|js):\d+/)
  // Se busca la contraseña como valor JSON completo: buscarla como subcadena daba falsos
  // positivos con contraseñas de prueba cortas (p. ej. "ab1" dentro de un UUID aleatorio).
  for (const contrasena of CONTRASENAS_USADAS) {
    expect(texto).not.toContain(JSON.stringify(contrasena))
  }
}

/** Ejecuta la petición y revisa que la respuesta no filtre secretos. */
export async function enviar(prueba: Test): Promise<Response> {
  const respuesta = await prueba
  revisarSinSecretos(respuesta)
  return respuesta
}

/** Cabeceras Set-Cookie de la respuesta. */
export function cabecerasCookie(respuesta: Response): string[] {
  const valor: unknown = respuesta.headers['set-cookie']
  if (Array.isArray(valor)) return valor.map(String)
  return typeof valor === 'string' ? [valor] : []
}

/** `pc_sesion=...` listo para enviarse en la cabecera Cookie. */
export function cookieSesion(respuesta: Response): string {
  const cabecera = cabecerasCookie(respuesta).find((c) => c.startsWith(`${COOKIE_SESION}=`))
  if (!cabecera) throw new Error('La respuesta no puso la cookie de sesión.')
  const par = cabecera.split(';')[0] ?? ''
  return par
}

/** Registra un usuario y devuelve su cookie de sesión y sus datos. */
export async function registrar(app: Express, datos: DatosRegistro) {
  const respuesta = await enviar(request(app).post('/api/auth/registro').send(datos))
  expect(respuesta.status).toBe(201)
  return { cookie: cookieSesion(respuesta), usuario: respuesta.body.usuario }
}

/** Crea un Jefe (primer registro) y un Operador (segundo). */
export async function crearJefeYOperador(app: Express) {
  const jefe = await registrar(app, datosRegistro(1))
  const operador = await registrar(app, datosRegistro(2))
  return { jefe, operador }
}

export const desembarqueValido = (cambios: Partial<DesembarqueNuevo> = {}): DesembarqueNuevo => ({
  codigo: 'DSB-900',
  embarcacion: 'Prueba del Norte',
  matricula: 'PT-12345-PM',
  especie: 'Jurel',
  artePesca: 'Cerco',
  puerto: 'Paita',
  destino: 'Consumo humano directo',
  toneladas: 120.5,
  precioTonelada: 2100,
  fechaDesembarque: '2026-10-15',
  estado: 'Programado',
  ...cambios,
})
