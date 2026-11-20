import request from 'supertest'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cargarConfiguracion, ErrorConfiguracion, LARGO_MINIMO_SECRETO } from '../config.ts'
import { crearEntorno, crearJefeYOperador, enviar, type EntornoPrueba } from './utilidades.ts'

let entorno: EntornoPrueba

beforeEach(async () => {
  entorno = await crearEntorno()
})

afterEach(async () => {
  await entorno.limpiar()
})

describe('GET /api/publico/resumen', () => {
  it('responde sin sesión solo con cifras agregadas', async () => {
    const respuesta = await enviar(request(entorno.app).get('/api/publico/resumen'))
    expect(respuesta.status).toBe(200)
    expect(Object.keys(respuesta.body).sort()).toEqual(
      [
        'desembarques',
        'especies',
        'porEspecie',
        'porPuerto',
        'puertos',
        'toneladas',
        'valor',
      ].sort(),
    )
    expect(respuesta.body.desembarques).toBe(16)
    expect(respuesta.body.toneladas).toBeGreaterThan(0)
    expect(respuesta.body.porPuerto[0]).toEqual({ puerto: 'Paita', toneladas: expect.any(Number) })
    expect(respuesta.text).not.toMatch(/embarcacion|matricula|DSB-|correo/)
  })

  it('refleja los cambios hechos por la API', async () => {
    const { jefe } = await crearJefeYOperador(entorno.app)
    await enviar(request(entorno.app).delete('/api/desembarques/1').set('Cookie', jefe.cookie))
    const respuesta = await enviar(request(entorno.app).get('/api/publico/resumen'))
    expect(respuesta.body.desembarques).toBe(15)
  })
})

describe('Errores generales', () => {
  it('responde 404 JSON para rutas /api desconocidas', async () => {
    const respuesta = await enviar(request(entorno.app).get('/api/no-existe'))
    expect(respuesta.status).toBe(404)
    expect(respuesta.body).toEqual({ error: 'La ruta solicitada no existe.' })
  })

  it('aplica cabeceras de seguridad de helmet y oculta X-Powered-By', async () => {
    const respuesta = await enviar(request(entorno.app).get('/api/publico/resumen'))
    expect(respuesta.headers['x-content-type-options']).toBe('nosniff')
    expect(respuesta.headers['content-security-policy']).toBeDefined()
    expect(respuesta.headers['x-powered-by']).toBeUndefined()
  })

  it('responde 413 si el cuerpo supera 20 kB', async () => {
    const respuesta = await enviar(
      request(entorno.app)
        .post('/api/auth/registro')
        .send({ nombre: 'x'.repeat(25_000), correo: 'a@b.pe', contrasena: 'Clave1234' }),
    )
    expect(respuesta.status).toBe(413)
    expect(respuesta.body).toEqual({ error: 'El cuerpo de la petición es demasiado grande.' })
  })

  it('responde 500 genérico ante un error inesperado, sin detalles internos', async () => {
    const registrados: unknown[] = []
    const roto = await crearEntorno({ registrarError: (error) => registrados.push(error) })
    try {
      // Un archivo de usuarios corrupto provoca un error inesperado al leerlo.
      const { writeFile } = await import('node:fs/promises')
      await writeFile(roto.rutaUsuarios, '{ esto no es json', 'utf8')
      const respuesta = await enviar(
        request(roto.app)
          .post('/api/auth/ingreso')
          .send({ correo: 'a@b.pe', contrasena: 'Clave1234' }),
      )
      expect(respuesta.status).toBe(500)
      expect(respuesta.body).toEqual({
        error: 'Ocurrió un error inesperado en el servidor. Intenta de nuevo.',
      })
      expect(registrados).toHaveLength(1)
    } finally {
      await roto.limpiar()
    }
  })
})

describe('cargarConfiguracion', () => {
  const secreto = 's'.repeat(LARGO_MINIMO_SECRETO)

  it('lee las variables y resuelve rutas absolutas', () => {
    const config = cargarConfiguracion({
      JWT_SECRET: secreto,
      API_PORT: '3101',
      COOKIE_SECURE: 'true',
      DB_PATH: 'tmp/db.json',
    })
    expect(config).toMatchObject({ puerto: 3101, cookieSegura: true, secretoEfimero: false })
    expect(config.rutaDb).toMatch(/tmp[\\/]db\.json$/)
    expect(config.rutaUsuarios).toMatch(/server[\\/]data[\\/]usuarios\.json$/)
  })

  it('falla si JWT_SECRET mide menos de 32 caracteres', () => {
    expect(() => cargarConfiguracion({ JWT_SECRET: 'corto' })).toThrow(ErrorConfiguracion)
  })

  it('falla en producción sin JWT_SECRET o con el valor de ejemplo', () => {
    expect(() => cargarConfiguracion({ NODE_ENV: 'production' })).toThrow(/JWT_SECRET/)
    expect(() =>
      cargarConfiguracion({
        NODE_ENV: 'production',
        JWT_SECRET: 'cambia-este-valor-por-una-cadena-larga-y-aleatoria',
      }),
    ).toThrow(/valor de ejemplo/)
  })

  it('usa un secreto efímero en desarrollo si falta JWT_SECRET', () => {
    const config = cargarConfiguracion({})
    expect(config.secretoEfimero).toBe(true)
    expect(config.jwtSecreto.length).toBeGreaterThanOrEqual(LARGO_MINIMO_SECRETO)
    expect(cargarConfiguracion({}).jwtSecreto).not.toBe(config.jwtSecreto)
  })

  it('valida API_PORT y COOKIE_SECURE', () => {
    expect(() => cargarConfiguracion({ JWT_SECRET: secreto, API_PORT: 'abc' })).toThrow(/API_PORT/)
    expect(() => cargarConfiguracion({ JWT_SECRET: secreto, COOKIE_SECURE: 'si' })).toThrow(
      /COOKIE_SECURE/,
    )
  })
})
