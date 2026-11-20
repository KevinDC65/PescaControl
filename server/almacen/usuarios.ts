import { randomUUID } from 'node:crypto'
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { z } from 'zod'
import type { Rol, Usuario } from '../../src/types/usuario.ts'

// Almacén de usuarios en un archivo JSON (`{ "usuarios": [...] }`).
// - Cada lectura va al archivo, así los cambios del seed se ven sin reiniciar.
// - Las escrituras se serializan en una cola: leer, modificar y guardar ocurre sin que otra
//   escritura se intercale (evita perder usuarios con dos registros simultáneos).
// - Se guarda de forma atómica: primero un archivo temporal y luego `rename` sobre el real.
// - Lo que sale hacia la API pasa siempre por `aPublico`, que quita el hash.

/** Usuario tal como se guarda: el público más el hash de la contraseña. */
export interface UsuarioGuardado extends Usuario {
  hash: string
}

/** Datos para crear un usuario. Sin `rol`, el primero del sistema es Jefe y el resto Operador. */
export interface DatosUsuarioNuevo {
  nombre: string
  correo: string
  hash: string
  rol?: Rol
}

/** El correo ya pertenece a otra cuenta. */
export class ErrorCorreoDuplicado extends Error {
  constructor() {
    super('Ya existe una cuenta con ese correo.')
    this.name = 'ErrorCorreoDuplicado'
  }
}

const esquemaUsuarioGuardado = z.object({
  id: z.string().min(1),
  nombre: z.string(),
  correo: z.string(),
  rol: z.enum(['operador', 'jefe']),
  activo: z.boolean(),
  creadoEn: z.string(),
  hash: z.string().min(1),
})

const esquemaArchivo = z.object({ usuarios: z.array(esquemaUsuarioGuardado) })

/** Copia del usuario sin el hash: lo único que puede salir hacia la API. */
export function aPublico(usuario: UsuarioGuardado): Usuario {
  const { id, nombre, correo, rol, activo, creadoEn } = usuario
  return { id, nombre, correo, rol, activo, creadoEn }
}

const normalizarCorreo = (correo: string): string => correo.trim().toLowerCase()

/** Códigos de error de Windows cuando otro proceso tiene el archivo abierto un instante. */
const ERRORES_TRANSITORIOS = new Set(['EPERM', 'EBUSY', 'EACCES'])
const REINTENTOS_RENOMBRADO = 5

const esperar = (ms: number): Promise<void> => new Promise((resolver) => setTimeout(resolver, ms))

function codigoDeError(error: unknown): string | undefined {
  return typeof error === 'object' && error !== null && 'code' in error
    ? String((error as { code: unknown }).code)
    : undefined
}

export class AlmacenUsuarios {
  readonly #ruta: string
  #cola: Promise<unknown> = Promise.resolve()

  constructor(ruta: string) {
    this.#ruta = ruta
  }

  /** Lee todos los usuarios. Un archivo inexistente equivale a no tener usuarios. */
  async #leer(): Promise<UsuarioGuardado[]> {
    let contenido: string
    try {
      contenido = await readFile(this.#ruta, 'utf8')
    } catch (error) {
      if (codigoDeError(error) === 'ENOENT') return []
      throw error
    }
    const resultado = esquemaArchivo.safeParse(JSON.parse(contenido))
    if (!resultado.success) {
      throw new Error(`El archivo de usuarios ${this.#ruta} no tiene el formato esperado.`)
    }
    return resultado.data.usuarios
  }

  /** Guarda de forma atómica: archivo temporal en la misma carpeta y `rename`. */
  async #guardar(usuarios: readonly UsuarioGuardado[]): Promise<void> {
    await mkdir(path.dirname(this.#ruta), { recursive: true })
    const temporal = `${this.#ruta}.${process.pid}.${randomUUID()}.tmp`
    await writeFile(temporal, `${JSON.stringify({ usuarios }, null, 2)}\n`, 'utf8')
    try {
      for (let intento = 1; ; intento += 1) {
        try {
          await rename(temporal, this.#ruta)
          return
        } catch (error) {
          const transitorio = ERRORES_TRANSITORIOS.has(codigoDeError(error) ?? '')
          if (!transitorio || intento >= REINTENTOS_RENOMBRADO) throw error
          await esperar(20 * intento)
        }
      }
    } finally {
      await rm(temporal, { force: true })
    }
  }

  /** Ejecuta `tarea` cuando terminen las escrituras anteriores (una a la vez). */
  #enCola<T>(tarea: () => Promise<T>): Promise<T> {
    // `#cola` nunca queda rechazada (ver abajo): un fallo no bloquea las tareas siguientes.
    const resultado = this.#cola.then(tarea)
    this.#cola = resultado.catch(() => undefined)
    return resultado
  }

  async listar(): Promise<UsuarioGuardado[]> {
    return this.#leer()
  }

  async buscarPorId(id: string): Promise<UsuarioGuardado | undefined> {
    return (await this.#leer()).find((usuario) => usuario.id === id)
  }

  async buscarPorCorreo(correo: string): Promise<UsuarioGuardado | undefined> {
    const buscado = normalizarCorreo(correo)
    return (await this.#leer()).find((usuario) => usuario.correo === buscado)
  }

  /**
   * Crea un usuario activo.
   * @throws ErrorCorreoDuplicado si el correo ya está registrado.
   */
  crear(datos: DatosUsuarioNuevo): Promise<UsuarioGuardado> {
    return this.#enCola(async () => {
      const usuarios = await this.#leer()
      const correo = normalizarCorreo(datos.correo)
      if (usuarios.some((usuario) => usuario.correo === correo)) throw new ErrorCorreoDuplicado()
      const nuevo: UsuarioGuardado = {
        id: randomUUID(),
        nombre: datos.nombre.trim(),
        correo,
        rol: datos.rol ?? (usuarios.length === 0 ? 'jefe' : 'operador'),
        activo: true,
        creadoEn: new Date().toISOString(),
        hash: datos.hash,
      }
      await this.#guardar([...usuarios, nuevo])
      return nuevo
    })
  }

  /**
   * Modifica un usuario dentro de la cola de escrituras. `modificar` recibe el usuario y la
   * lista completa (para reglas como "debe quedar un Jefe activo") y devuelve la versión
   * nueva, o lanza un error para cancelar el cambio.
   * @returns El usuario guardado, o undefined si no existe.
   */
  actualizar(
    id: string,
    modificar: (actual: UsuarioGuardado, todos: readonly UsuarioGuardado[]) => UsuarioGuardado,
  ): Promise<UsuarioGuardado | undefined> {
    return this.#enCola(async () => {
      const usuarios = await this.#leer()
      const indice = usuarios.findIndex((usuario) => usuario.id === id)
      const actual = usuarios[indice]
      if (!actual) return undefined
      const modificado: UsuarioGuardado = { ...modificar(actual, usuarios), id: actual.id }
      await this.#guardar(usuarios.with(indice, modificado))
      return modificado
    })
  }
}
