import { readFile } from 'node:fs/promises'
import path from 'node:path'
import request from 'supertest'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { Desembarque } from '../../src/types/desembarque.ts'
import { RAIZ_PROYECTO } from '../config.ts'
import {
  crearEntorno,
  crearJefeYOperador,
  desembarqueValido,
  enviar,
  type EntornoPrueba,
} from './utilidades.ts'

let entorno: EntornoPrueba
let jefe: string
let operador: string

const leerDbTemporal = async (): Promise<{ desembarques: Desembarque[] }> =>
  JSON.parse(await readFile(entorno.rutaDb, 'utf8'))

beforeEach(async () => {
  entorno = await crearEntorno()
  const sesiones = await crearJefeYOperador(entorno.app)
  jefe = sesiones.jefe.cookie
  operador = sesiones.operador.cookie
})

afterEach(async () => {
  await entorno.limpiar()
})

describe('/api/desembarques sin sesión', () => {
  it.each([
    ['get', '/api/desembarques'],
    ['get', '/api/desembarques/1'],
    ['post', '/api/desembarques'],
    ['put', '/api/desembarques/1'],
    ['patch', '/api/desembarques/1'],
    ['delete', '/api/desembarques/1'],
  ] as const)('%s %s responde 401', async (metodo, ruta) => {
    const respuesta = await enviar(request(entorno.app)[metodo](ruta))
    expect(respuesta.status).toBe(401)
    expect(respuesta.body).toEqual({ error: 'No has iniciado sesión.' })
  })
})

describe('/api/desembarques como Operador', () => {
  it('lista y obtiene desembarques', async () => {
    const lista = await enviar(
      request(entorno.app).get('/api/desembarques').set('Cookie', operador),
    )
    expect(lista.status).toBe(200)
    expect(lista.body).toHaveLength(16)
    const uno = await enviar(
      request(entorno.app).get('/api/desembarques/1').set('Cookie', operador),
    )
    expect(uno.status).toBe(200)
    expect(uno.body.codigo).toBe('DSB-001')
  })

  it('respeta los parámetros de consulta de json-server', async () => {
    const respuesta = await enviar(
      request(entorno.app)
        .get('/api/desembarques?puerto=Paita&_sort=codigo&_order=desc&_limit=2')
        .set('Cookie', operador),
    )
    expect(respuesta.status).toBe(200)
    expect(respuesta.body.length).toBeLessThanOrEqual(2)
    for (const desembarque of respuesta.body) expect(desembarque.puerto).toBe('Paita')
  })

  it('crea (201) un desembarque normalizado y solo con los campos del modelo', async () => {
    const respuesta = await enviar(
      request(entorno.app)
        .post('/api/desembarques')
        .set('Cookie', operador)
        .send({
          ...desembarqueValido(),
          id: '999',
          codigo: ' dsb-900 ',
          matricula: 'pt-12345-pm',
          toneladas: '120.50',
          intruso: true,
        }),
    )
    expect(respuesta.status).toBe(201)
    expect(respuesta.body).toMatchObject({
      codigo: 'DSB-900',
      matricula: 'PT-12345-PM',
      toneladas: 120.5,
    })
    expect(respuesta.body.id).not.toBe('999')
    expect(respuesta.body).not.toHaveProperty('intruso')
    const db = await leerDbTemporal()
    expect(db.desembarques.some((d) => d.codigo === 'DSB-900')).toBe(true)
  })

  it('reemplaza (PUT) y modifica (PATCH) un desembarque', async () => {
    const put = await enviar(
      request(entorno.app)
        .put('/api/desembarques/1')
        .set('Cookie', operador)
        .send(desembarqueValido({ codigo: 'DSB-001', estado: 'Observado' })),
    )
    expect(put.status).toBe(200)
    expect(put.body).toMatchObject({ id: '1', codigo: 'DSB-001', estado: 'Observado' })

    const patch = await enviar(
      request(entorno.app)
        .patch('/api/desembarques/1')
        .set('Cookie', operador)
        .send({ estado: 'Descargado' }),
    )
    expect(patch.status).toBe(200)
    expect(patch.body).toMatchObject({
      id: '1',
      estado: 'Descargado',
      embarcacion: 'Prueba del Norte',
    })
  })

  it('no puede eliminar (403)', async () => {
    const respuesta = await enviar(
      request(entorno.app).delete('/api/desembarques/1').set('Cookie', operador),
    )
    expect(respuesta.status).toBe(403)
    expect(respuesta.body).toEqual({ error: 'Tu rol no tiene permiso para esta acción.' })
    expect((await leerDbTemporal()).desembarques.some((d) => d.id === '1')).toBe(true)
  })

  it('no puede eliminar disfrazando el método con X-HTTP-Method-Override', async () => {
    const respuesta = await enviar(
      request(entorno.app)
        .post('/api/desembarques')
        .set('Cookie', operador)
        .set('X-HTTP-Method-Override', 'DELETE')
        .send(desembarqueValido()),
    )
    expect(respuesta.status).toBe(201)
    expect((await leerDbTemporal()).desembarques).toHaveLength(17)
  })

  it('responde 400 con campos si el desembarque no es válido', async () => {
    const respuesta = await enviar(
      request(entorno.app)
        .post('/api/desembarques')
        .set('Cookie', operador)
        .send(
          desembarqueValido({
            codigo: 'X-1',
            toneladas: -3,
            fechaDesembarque: '2999-01-01',
          }),
        ),
    )
    expect(respuesta.status).toBe(400)
    expect(respuesta.body.error).toBe('Revisa los datos del desembarque.')
    expect(Object.keys(respuesta.body.campos).sort()).toEqual([
      'codigo',
      'fechaDesembarque',
      'toneladas',
    ])
  })

  it('responde 400 si el código ya existe (sin contar el propio en edición)', async () => {
    const duplicado = await enviar(
      request(entorno.app)
        .post('/api/desembarques')
        .set('Cookie', operador)
        .send(desembarqueValido({ codigo: 'dsb-002' })),
    )
    expect(duplicado.status).toBe(400)
    expect(duplicado.body.campos).toEqual({ codigo: 'El código DSB-002 ya está registrado.' })

    const cambioACodigoAjeno = await enviar(
      request(entorno.app)
        .patch('/api/desembarques/1')
        .set('Cookie', operador)
        .send({ codigo: 'DSB-002' }),
    )
    expect(cambioACodigoAjeno.status).toBe(400)
  })

  it('responde 400 si el cuerpo no es un objeto', async () => {
    const respuesta = await enviar(
      request(entorno.app)
        .post('/api/desembarques')
        .set('Cookie', operador)
        .set('Content-Type', 'application/json')
        .send('[1,2]'),
    )
    expect(respuesta.status).toBe(400)
    expect(respuesta.body.error).toMatch(/objeto JSON/)
  })

  it('responde 404 con el formato de error si el desembarque no existe', async () => {
    for (const prueba of [
      request(entorno.app).get('/api/desembarques/no-existe'),
      request(entorno.app).put('/api/desembarques/no-existe').send(desembarqueValido()),
      request(entorno.app).patch('/api/desembarques/no-existe').send({ estado: 'Observado' }),
    ]) {
      const respuesta = await enviar(prueba.set('Cookie', operador))
      expect(respuesta.status).toBe(404)
      expect(respuesta.body).toEqual({ error: 'El desembarque no existe o fue eliminado.' })
    }
  })
})

describe('/api/desembarques como Jefe', () => {
  it('elimina un desembarque (200)', async () => {
    const respuesta = await enviar(
      request(entorno.app).delete('/api/desembarques/1').set('Cookie', jefe),
    )
    expect(respuesta.status).toBe(200)
    expect((await leerDbTemporal()).desembarques.some((d) => d.id === '1')).toBe(false)
    const otraVez = await enviar(
      request(entorno.app).delete('/api/desembarques/1').set('Cookie', jefe),
    )
    expect(otraVez.status).toBe(404)
  })

  it('pierde el permiso al instante si lo degradan a Operador', async () => {
    const otroJefe = await enviar(request(entorno.app).get('/api/usuarios').set('Cookie', jefe))
    const idOperador = otroJefe.body.find((u: { rol: string }) => u.rol === 'operador').id
    await enviar(
      request(entorno.app)
        .patch(`/api/usuarios/${idOperador}`)
        .set('Cookie', jefe)
        .send({ rol: 'jefe' }),
    )
    expect(
      (await enviar(request(entorno.app).delete('/api/desembarques/2').set('Cookie', operador)))
        .status,
    ).toBe(200)
    await enviar(
      request(entorno.app)
        .patch(`/api/usuarios/${idOperador}`)
        .set('Cookie', jefe)
        .send({ rol: 'operador' }),
    )
    expect(
      (await enviar(request(entorno.app).delete('/api/desembarques/3').set('Cookie', operador)))
        .status,
    ).toBe(403)
  })
})

describe('Rutas internas de json-server', () => {
  it.each(['/api/db', '/api/desembarques/1/extra', '/api/__rules', '/api/desembarques/db'])(
    '%s no queda expuesta',
    async (ruta) => {
      const respuesta = await enviar(request(entorno.app).get(ruta).set('Cookie', jefe))
      expect(respuesta.status).toBe(404)
      expect(respuesta.body.error).toEqual(expect.any(String))
      expect(respuesta.text).not.toContain('Don Lucho')
    },
  )

  it('no responde JSONP aunque se pida callback', async () => {
    const respuesta = await enviar(
      request(entorno.app).get('/api/desembarques?callback=robar').set('Cookie', jefe),
    )
    expect(respuesta.headers['content-type']).toMatch(/application\/json/)
    expect(respuesta.text.startsWith('[')).toBe(true)
  })
})

describe('db.json real', () => {
  it('las pruebas trabajan sobre una copia temporal', () => {
    expect(path.resolve(entorno.rutaDb)).not.toBe(path.join(RAIZ_PROYECTO, 'db.json'))
  })
})
