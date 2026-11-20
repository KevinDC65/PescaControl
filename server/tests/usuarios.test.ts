import request from 'supertest'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { UsuarioGuardado } from '../almacen/usuarios.ts'
import { aplicarCambiosUsuario, MENSAJES_USUARIOS } from '../rutas/usuarios.ts'
import { ErrorHttp } from '../errores.ts'
import {
  cookieSesion,
  crearEntorno,
  crearJefeYOperador,
  datosRegistro,
  enviar,
  type EntornoPrueba,
} from './utilidades.ts'

let entorno: EntornoPrueba

beforeEach(async () => {
  entorno = await crearEntorno()
})

afterEach(async () => {
  await entorno.limpiar()
})

describe('GET /api/usuarios', () => {
  it('lista los usuarios sin hash para un Jefe', async () => {
    const { jefe } = await crearJefeYOperador(entorno.app)
    const respuesta = await enviar(
      request(entorno.app).get('/api/usuarios').set('Cookie', jefe.cookie),
    )
    expect(respuesta.status).toBe(200)
    expect(respuesta.body).toHaveLength(2)
    expect(respuesta.body.map((u: { rol: string }) => u.rol)).toEqual(['jefe', 'operador'])
  })

  it('responde 403 a un Operador y 401 sin sesión', async () => {
    const { operador } = await crearJefeYOperador(entorno.app)
    const prohibido = await enviar(
      request(entorno.app).get('/api/usuarios').set('Cookie', operador.cookie),
    )
    expect(prohibido.status).toBe(403)
    expect(prohibido.body).toEqual({ error: 'Tu rol no tiene permiso para esta acción.' })
    const sinSesion = await enviar(request(entorno.app).get('/api/usuarios'))
    expect(sinSesion.status).toBe(401)
  })
})

describe('PATCH /api/usuarios/:id', () => {
  it('cambia el rol y el estado de otro usuario', async () => {
    const { jefe, operador } = await crearJefeYOperador(entorno.app)
    const respuesta = await enviar(
      request(entorno.app)
        .patch(`/api/usuarios/${operador.usuario.id}`)
        .set('Cookie', jefe.cookie)
        .send({ rol: 'jefe', activo: false }),
    )
    expect(respuesta.status).toBe(200)
    expect(respuesta.body).toMatchObject({ id: operador.usuario.id, rol: 'jefe', activo: false })
  })

  it('responde 403 si lo intenta un Operador', async () => {
    const { jefe, operador } = await crearJefeYOperador(entorno.app)
    const respuesta = await enviar(
      request(entorno.app)
        .patch(`/api/usuarios/${jefe.usuario.id}`)
        .set('Cookie', operador.cookie)
        .send({ activo: false }),
    )
    expect(respuesta.status).toBe(403)
  })

  it('impide que un Jefe se desactive o se degrade a sí mismo (400)', async () => {
    const { jefe } = await crearJefeYOperador(entorno.app)
    const desactivar = await enviar(
      request(entorno.app)
        .patch(`/api/usuarios/${jefe.usuario.id}`)
        .set('Cookie', jefe.cookie)
        .send({ activo: false }),
    )
    expect(desactivar.status).toBe(400)
    expect(desactivar.body).toEqual({ error: MENSAJES_USUARIOS.autoDesactivar })
    const degradar = await enviar(
      request(entorno.app)
        .patch(`/api/usuarios/${jefe.usuario.id}`)
        .set('Cookie', jefe.cookie)
        .send({ rol: 'operador' }),
    )
    expect(degradar.status).toBe(400)
    expect(degradar.body).toEqual({ error: MENSAJES_USUARIOS.autoDegradar })
  })

  it('permite degradar a otro Jefe si queda al menos uno activo', async () => {
    const { jefe, operador } = await crearJefeYOperador(entorno.app)
    await enviar(
      request(entorno.app)
        .patch(`/api/usuarios/${operador.usuario.id}`)
        .set('Cookie', jefe.cookie)
        .send({ rol: 'jefe' }),
    )
    const respuesta = await enviar(
      request(entorno.app)
        .patch(`/api/usuarios/${jefe.usuario.id}`)
        .set('Cookie', operador.cookie)
        .send({ rol: 'operador' }),
    )
    expect(respuesta.status).toBe(200)
    expect(respuesta.body.rol).toBe('operador')
  })

  it('valida el cuerpo (400 con campos) y el id (404)', async () => {
    const { jefe, operador } = await crearJefeYOperador(entorno.app)
    const invalido = await enviar(
      request(entorno.app)
        .patch(`/api/usuarios/${operador.usuario.id}`)
        .set('Cookie', jefe.cookie)
        .send({ rol: 'admin', hash: 'x' }),
    )
    expect(invalido.status).toBe(400)
    expect(Object.keys(invalido.body.campos).sort()).toEqual(['hash', 'rol'])

    const vacio = await enviar(
      request(entorno.app)
        .patch(`/api/usuarios/${operador.usuario.id}`)
        .set('Cookie', jefe.cookie)
        .send({}),
    )
    expect(vacio.status).toBe(400)
    expect(vacio.body.error).toBe('Indica el rol o el estado que quieres cambiar.')

    const inexistente = await enviar(
      request(entorno.app)
        .patch('/api/usuarios/no-existe')
        .set('Cookie', jefe.cookie)
        .send({ activo: false }),
    )
    expect(inexistente.status).toBe(404)
    expect(inexistente.body).toEqual({ error: 'El usuario no existe.' })
  })
})

describe('aplicarCambiosUsuario: regla del último Jefe', () => {
  const usuario = (id: string, cambios: Partial<UsuarioGuardado> = {}): UsuarioGuardado => ({
    id,
    nombre: `Usuario ${id}`,
    correo: `${id}@pescacontrol.pe`,
    rol: 'operador',
    activo: true,
    creadoEn: '2026-11-01T00:00:00.000Z',
    hash: 'hash',
    ...cambios,
  })

  it('responde 409 si el cambio dejaría el sistema sin Jefes activos', () => {
    // Situación límite: el actor ya no es Jefe activo (por ejemplo, cambió entre peticiones).
    const unicoJefe = usuario('a', { rol: 'jefe' })
    const todos = [unicoJefe, usuario('b')]
    const intentar = () => aplicarCambiosUsuario(unicoJefe, { activo: false }, 'b', todos)
    expect(intentar).toThrow(ErrorHttp)
    expect(intentar).toThrow(MENSAJES_USUARIOS.ultimoJefe)
    try {
      intentar()
    } catch (error) {
      expect((error as ErrorHttp).estado).toBe(409)
    }
  })

  it('permite el cambio si queda otro Jefe activo', () => {
    const jefeA = usuario('a', { rol: 'jefe' })
    const jefeB = usuario('b', { rol: 'jefe' })
    const resultado = aplicarCambiosUsuario(jefeA, { rol: 'operador' }, 'b', [jefeA, jefeB])
    expect(resultado.rol).toBe('operador')
  })

  it('no cuenta a un Jefe desactivado como Jefe disponible', () => {
    const jefeActivo = usuario('a', { rol: 'jefe' })
    const jefeInactivo = usuario('b', { rol: 'jefe', activo: false })
    expect(() =>
      aplicarCambiosUsuario(jefeActivo, { activo: false }, 'c', [jefeActivo, jefeInactivo]),
    ).toThrow(MENSAJES_USUARIOS.ultimoJefe)
  })
})

describe('Concurrencia del almacén', () => {
  it('no pierde registros simultáneos y solo el primero es Jefe', async () => {
    const respuestas = await Promise.all(
      [1, 2, 3, 4, 5].map((n) =>
        enviar(request(entorno.app).post('/api/auth/registro').send(datosRegistro(n))),
      ),
    )
    expect(respuestas.map((r) => r.status)).toEqual([201, 201, 201, 201, 201])
    const jefes = respuestas.filter((r) => r.body.usuario.rol === 'jefe')
    expect(jefes).toHaveLength(1)
    const cookieJefe = cookieSesion(jefes[0] as (typeof respuestas)[number])
    const lista = await enviar(request(entorno.app).get('/api/usuarios').set('Cookie', cookieJefe))
    expect(lista.body).toHaveLength(5)
  })
})
