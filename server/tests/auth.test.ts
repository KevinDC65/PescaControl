import { readFile } from 'node:fs/promises'
import request from 'supertest'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  cabecerasCookie,
  cookieSesion,
  crearEntorno,
  datosRegistro,
  enviar,
  registrar,
  type EntornoPrueba,
} from './utilidades.ts'

let entorno: EntornoPrueba

beforeEach(async () => {
  entorno = await crearEntorno()
})

afterEach(async () => {
  await entorno.limpiar()
})

describe('POST /api/auth/registro', () => {
  it('crea al primer usuario como Jefe, con cookie de sesión', async () => {
    const respuesta = await enviar(
      request(entorno.app).post('/api/auth/registro').send(datosRegistro(1)),
    )
    expect(respuesta.status).toBe(201)
    expect(respuesta.body.usuario).toMatchObject({
      nombre: 'Usuario 1',
      correo: 'usuario1@pescacontrol.pe',
      rol: 'jefe',
      activo: true,
    })
    expect(Object.keys(respuesta.body.usuario).sort()).toEqual(
      ['activo', 'correo', 'creadoEn', 'id', 'nombre', 'rol'].sort(),
    )
    expect(cookieSesion(respuesta)).toMatch(/^pc_sesion=.+/)
  })

  it('crea a los siguientes usuarios como Operador', async () => {
    await registrar(entorno.app, datosRegistro(1))
    const { usuario } = await registrar(entorno.app, datosRegistro(2))
    expect(usuario.rol).toBe('operador')
  })

  it('normaliza el correo y rechaza duplicados con 409', async () => {
    await registrar(entorno.app, datosRegistro(1))
    const respuesta = await enviar(
      request(entorno.app)
        .post('/api/auth/registro')
        .send(datosRegistro(3, { correo: '  USUARIO1@PescaControl.pe ' })),
    )
    expect(respuesta.status).toBe(409)
    expect(respuesta.body).toEqual({ error: 'Ya existe una cuenta con ese correo.' })
  })

  it('responde 400 con los errores por campo', async () => {
    const respuesta = await enviar(
      request(entorno.app)
        .post('/api/auth/registro')
        .send({ nombre: 'A', correo: 'no-es-correo', contrasena: 'solotexto' }),
    )
    expect(respuesta.status).toBe(400)
    expect(respuesta.body.error).toEqual(expect.any(String))
    expect(Object.keys(respuesta.body.campos).sort()).toEqual(['contrasena', 'correo', 'nombre'])
    expect(respuesta.body.campos.contrasena).toBe(
      'La contraseña debe incluir al menos una letra y un número.',
    )
  })

  it('exige contraseña de 8 a 72 caracteres', async () => {
    const corta = await enviar(
      request(entorno.app)
        .post('/api/auth/registro')
        .send(datosRegistro(4, { contrasena: 'ab1' })),
    )
    const larga = await enviar(
      request(entorno.app)
        .post('/api/auth/registro')
        .send(datosRegistro(5, { contrasena: `a1${'x'.repeat(71)}` })),
    )
    expect(corta.status).toBe(400)
    expect(larga.status).toBe(400)
    expect(corta.body.campos.contrasena).toMatch(/entre 8 y 72/)
  })

  it('responde 400 si el cuerpo no es JSON válido, sin stack trace', async () => {
    const respuesta = await enviar(
      request(entorno.app)
        .post('/api/auth/registro')
        .set('Content-Type', 'application/json')
        .send('{"nombre":'),
    )
    expect(respuesta.status).toBe(400)
    expect(respuesta.body).toEqual({ error: 'El cuerpo de la petición no es un JSON válido.' })
  })

  it('guarda el hash y nunca la contraseña en el archivo', async () => {
    const datos = datosRegistro(6)
    await registrar(entorno.app, datos)
    const archivo = await readFile(entorno.rutaUsuarios, 'utf8')
    expect(archivo).not.toContain(datos.contrasena)
    expect(archivo).toMatch(/"hash": "\$2[aby]\$04\$/)
  })

  it('limita los registros por IP con 429', async () => {
    const limitado = await crearEntorno({ limiteRegistro: { ventanaMs: 60_000, maximo: 2 } })
    try {
      await registrar(limitado.app, datosRegistro(1))
      await registrar(limitado.app, datosRegistro(2))
      const respuesta = await enviar(
        request(limitado.app).post('/api/auth/registro').send(datosRegistro(3)),
      )
      expect(respuesta.status).toBe(429)
      expect(respuesta.body.error).toMatch(/^Demasiados intentos de registro/)
    } finally {
      await limitado.limpiar()
    }
  })
})

describe('POST /api/auth/ingreso', () => {
  it('inicia sesión con cookie httpOnly y SameSite=Strict', async () => {
    const datos = datosRegistro(1)
    await registrar(entorno.app, datos)
    const respuesta = await enviar(
      request(entorno.app)
        .post('/api/auth/ingreso')
        .send({ correo: datos.correo.toUpperCase(), contrasena: datos.contrasena }),
    )
    expect(respuesta.status).toBe(200)
    expect(respuesta.body.usuario.correo).toBe(datos.correo)
    const cookie = cabecerasCookie(respuesta).find((c) => c.startsWith('pc_sesion='))
    expect(cookie).toMatch(/HttpOnly/i)
    expect(cookie).toMatch(/SameSite=Strict/i)
    expect(cookie).toMatch(/Path=\//)
    expect(cookie).toMatch(/Max-Age=28800/)
    expect(cookie).not.toMatch(/Secure/i)
  })

  it('pone la cookie Secure si COOKIE_SECURE está activo', async () => {
    const seguro = await crearEntorno({ cookieSegura: true })
    try {
      const respuesta = await enviar(
        request(seguro.app).post('/api/auth/registro').send(datosRegistro(1)),
      )
      expect(cabecerasCookie(respuesta).join(';')).toMatch(/Secure/)
    } finally {
      await seguro.limpiar()
    }
  })

  it('responde el mismo 401 genérico si la contraseña es incorrecta o el correo no existe', async () => {
    const datos = datosRegistro(1)
    await registrar(entorno.app, datos)
    const claveMala = await enviar(
      request(entorno.app)
        .post('/api/auth/ingreso')
        .send({ correo: datos.correo, contrasena: 'Otra1234' }),
    )
    const correoInexistente = await enviar(
      request(entorno.app)
        .post('/api/auth/ingreso')
        .send({ correo: 'nadie@pescacontrol.pe', contrasena: 'Otra1234' }),
    )
    for (const respuesta of [claveMala, correoInexistente]) {
      expect(respuesta.status).toBe(401)
      expect(respuesta.body).toEqual({ error: 'Correo o contraseña incorrectos.' })
      expect(cabecerasCookie(respuesta)).toEqual([])
    }
  })

  it('responde 403 si la cuenta está desactivada', async () => {
    const jefe = await registrar(entorno.app, datosRegistro(1))
    const datosOperador = datosRegistro(2)
    const operador = await registrar(entorno.app, datosOperador)
    await enviar(
      request(entorno.app)
        .patch(`/api/usuarios/${operador.usuario.id}`)
        .set('Cookie', jefe.cookie)
        .send({ activo: false }),
    )
    const respuesta = await enviar(
      request(entorno.app)
        .post('/api/auth/ingreso')
        .send({ correo: datosOperador.correo, contrasena: datosOperador.contrasena }),
    )
    expect(respuesta.status).toBe(403)
    expect(respuesta.body).toEqual({ error: 'Tu cuenta está desactivada. Contacta a un Jefe.' })
  })

  it('responde 429 tras el límite de intentos fallidos, sin contar los exitosos', async () => {
    const limitado = await crearEntorno({ limiteIngreso: { ventanaMs: 60_000, maximo: 3 } })
    try {
      const datos = datosRegistro(1)
      await registrar(limitado.app, datos)
      const ingresar = (contrasena: string) =>
        enviar(
          request(limitado.app)
            .post('/api/auth/ingreso')
            .send({ correo: datos.correo, contrasena }),
        )
      expect((await ingresar(datos.contrasena)).status).toBe(200)
      for (let intento = 0; intento < 3; intento += 1) {
        expect((await ingresar('Incorrecta1')).status).toBe(401)
      }
      const bloqueado = await ingresar(datos.contrasena)
      expect(bloqueado.status).toBe(429)
      expect(bloqueado.body.error).toMatch(/^Demasiados intentos de ingreso\. Espera 1 minuto/)
    } finally {
      await limitado.limpiar()
    }
  })

  it('aplica por defecto 5 intentos fallidos cada 15 minutos', async () => {
    const datos = datosRegistro(1)
    await registrar(entorno.app, datos)
    for (let intento = 0; intento < 5; intento += 1) {
      const respuesta = await enviar(
        request(entorno.app)
          .post('/api/auth/ingreso')
          .send({ correo: datos.correo, contrasena: 'Incorrecta1' }),
      )
      expect(respuesta.status).toBe(401)
    }
    const bloqueado = await enviar(
      request(entorno.app)
        .post('/api/auth/ingreso')
        .send({ correo: datos.correo, contrasena: datos.contrasena }),
    )
    expect(bloqueado.status).toBe(429)
    expect(bloqueado.body.error).toMatch(/Espera 15 minutos/)
  })

  it('responde 400 si faltan las credenciales', async () => {
    const respuesta = await enviar(request(entorno.app).post('/api/auth/ingreso').send({}))
    expect(respuesta.status).toBe(400)
    expect(Object.keys(respuesta.body.campos).sort()).toEqual(['contrasena', 'correo'])
  })
})

describe('GET /api/auth/sesion y POST /api/auth/salida', () => {
  it('responde 401 sin cookie', async () => {
    const respuesta = await enviar(request(entorno.app).get('/api/auth/sesion'))
    expect(respuesta.status).toBe(401)
    expect(respuesta.body).toEqual({ error: 'No has iniciado sesión.' })
  })

  it('devuelve el usuario con una cookie válida', async () => {
    const { cookie, usuario } = await registrar(entorno.app, datosRegistro(1))
    const respuesta = await enviar(
      request(entorno.app).get('/api/auth/sesion').set('Cookie', cookie),
    )
    expect(respuesta.status).toBe(200)
    expect(respuesta.body).toEqual({ usuario })
    expect(respuesta.headers['cache-control']).toBe('no-store')
  })

  it('responde 401 con un token manipulado o firmado con otro secreto', async () => {
    const { cookie } = await registrar(entorno.app, datosRegistro(1))
    const otro = await crearEntorno()
    try {
      const ajeno = await registrar(otro.app, datosRegistro(1))
      const manipulado = `${cookie.slice(0, -3)}abc`
      for (const valor of [manipulado, ajeno.cookie, 'pc_sesion=basura']) {
        const respuesta = await enviar(
          request(entorno.app).get('/api/auth/sesion').set('Cookie', valor),
        )
        expect(respuesta.status).toBe(401)
      }
    } finally {
      await otro.limpiar()
    }
  })

  it('responde 401 y borra la cookie si el usuario fue desactivado', async () => {
    const jefe = await registrar(entorno.app, datosRegistro(1))
    const operador = await registrar(entorno.app, datosRegistro(2))
    await enviar(
      request(entorno.app)
        .patch(`/api/usuarios/${operador.usuario.id}`)
        .set('Cookie', jefe.cookie)
        .send({ activo: false }),
    )
    const respuesta = await enviar(
      request(entorno.app).get('/api/auth/sesion').set('Cookie', operador.cookie),
    )
    expect(respuesta.status).toBe(401)
    expect(cabecerasCookie(respuesta).join(';')).toMatch(/pc_sesion=;.*Expires=Thu, 01 Jan 1970/)
  })

  it('cierra la sesión con 204 y borra la cookie', async () => {
    const { cookie } = await registrar(entorno.app, datosRegistro(1))
    const respuesta = await enviar(
      request(entorno.app).post('/api/auth/salida').set('Cookie', cookie),
    )
    expect(respuesta.status).toBe(204)
    const borrada = cabecerasCookie(respuesta).find((c) => c.startsWith('pc_sesion='))
    expect(borrada).toMatch(/^pc_sesion=;/)
    expect(borrada).toMatch(/HttpOnly/i)
    expect(borrada).toMatch(/SameSite=Strict/i)
  })
})
