import { Router, type RequestHandler } from 'express'
import jsonServer from 'json-server'
import type {
  Desembarque,
  DesembarqueEditable,
  DesembarqueNuevo,
} from '../../src/types/desembarque.ts'
import { normalizarDesembarque, validarDesembarque } from '../../src/utils/validarDesembarque.ts'
import { errorNoEncontrado, errorValidacion } from '../errores.ts'
import { autorizar } from '../middleware/autorizar.ts'
import { rutaNoEncontrada } from '../middleware/errores.ts'
import { esObjeto } from '../validacion.ts'

// /api/desembarques: el CRUD lo resuelve el router de json-server 0.17 sobre db.json, pero
// detrás de nuestra propia capa:
// - exige sesión (cualquier rol) y el rol Jefe para DELETE;
// - valida POST, PUT y PATCH con las mismas reglas del formulario (validarDesembarque),
//   incluido el código duplicado, y reenvía solo los campos del modelo ya normalizados;
// - solo deja pasar `/` y `/:id`: /db, /__rules y cualquier otra ruta del router dan 404;
// - responde los errores en el formato `{ error, campos? }` de la API.

const COLECCION = 'desembarques'

/** Campos del modelo que se aceptan del cliente (el `id` lo pone json-server o la URL). */
const CAMPOS_DESEMBARQUE = [
  'codigo',
  'embarcacion',
  'matricula',
  'especie',
  'artePesca',
  'puerto',
  'destino',
  'toneladas',
  'precioTonelada',
  'fechaDesembarque',
  'estado',
] as const satisfies readonly (keyof DesembarqueNuevo)[]

export const MENSAJE_DESEMBARQUE_INEXISTENTE = 'El desembarque no existe o fue eliminado.'

/** Copia con solo los campos del modelo (descarta `id` y cualquier campo desconocido). */
function soloCamposDelModelo(datos: DesembarqueNuevo): DesembarqueNuevo {
  return {
    codigo: datos.codigo,
    embarcacion: datos.embarcacion,
    matricula: datos.matricula,
    especie: datos.especie,
    artePesca: datos.artePesca,
    puerto: datos.puerto,
    destino: datos.destino,
    toneladas: datos.toneladas,
    precioTonelada: datos.precioTonelada,
    fechaDesembarque: datos.fechaDesembarque,
    estado: datos.estado,
  }
}

/** Campos del modelo presentes en un cuerpo parcial (PATCH). */
function camposEnviados(datos: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    CAMPOS_DESEMBARQUE.filter((campo) => Object.hasOwn(datos, campo)).map((campo) => [
      campo,
      datos[campo],
    ]),
  )
}

export interface RutasDesembarques {
  rutas: Router
  /** Desembarques actuales (los mismos que sirve json-server, desde su memoria). */
  leerDesembarques: () => readonly Desembarque[]
}

export function crearRutasDesembarques(
  rutaDb: string,
  autenticar: RequestHandler,
): RutasDesembarques {
  const routerJson = jsonServer.router(rutaDb)

  // json-server responde con `res.jsonp` y un `{}` vacío en los 404; aquí se usa `res.json`
  // (sin JSONP) y el formato de error de la API.
  routerJson.render = (_req, res) => {
    if (res.statusCode === 404) {
      res.json({ error: MENSAJE_DESEMBARQUE_INEXISTENTE })
      return
    }
    res.json(res.locals.data)
  }

  const leerDesembarques = (): readonly Desembarque[] => {
    const datos = routerJson.db.get(COLECCION).value()
    // Los datos los escribe este mismo router tras validarlos (o vienen de db.json).
    return Array.isArray(datos) ? (datos as Desembarque[]) : []
  }

  const buscarExistente = (id: string | undefined): Desembarque => {
    const desembarque = leerDesembarques().find((d) => String(d.id) === id)
    if (!desembarque) throw errorNoEncontrado(MENSAJE_DESEMBARQUE_INEXISTENTE)
    return desembarque
  }

  /** Valida y normaliza un desembarque completo; `idPropio` se excluye del control de código. */
  const validarEntrante = (datos: unknown, idPropio?: string): DesembarqueNuevo => {
    if (!esObjeto(datos)) {
      throw errorValidacion('Envía los datos del desembarque como un objeto JSON.', {})
    }
    // validarDesembarque convierte cada valor a texto o número antes de comprobarlo, así que
    // acepta cualquier objeto JSON aunque traiga tipos inesperados.
    const editable = datos as Partial<DesembarqueEditable>
    const codigosExistentes = leerDesembarques()
      .filter((d) => String(d.id) !== idPropio)
      .map((d) => d.codigo)
    const errores = validarDesembarque(editable, { codigosExistentes })
    if (Object.keys(errores).length > 0) {
      throw errorValidacion('Revisa los datos del desembarque.', errores)
    }
    return soloCamposDelModelo(normalizarDesembarque(editable))
  }

  /** Ajusta la petición para el router de json-server (Express 4 dentro de Express 5). */
  const prepararParaJsonServer: RequestHandler = (req, _res, next) => {
    // method-override (incluido en json-server) convertiría un POST en DELETE/PUT con esta
    // cabecera, saltándose la autorización y la validación.
    delete req.headers['x-http-method-override']
    // El cuerpo ya lo leyó express.json(); body-parser 1.x de json-server lo sabe por `_body`.
    Object.assign(req, { _body: true })
    // En Express 5 `req.query` es un getter que crea un objeto nuevo en cada lectura, y
    // json-server borra claves de él (`_sort`, `_page`...). Se fija una copia propia.
    // `_delay` se descarta: permitiría retener conexiones a voluntad.
    const consulta: Record<string, unknown> = { ...req.query }
    delete consulta._delay
    Object.defineProperty(req, 'query', {
      value: consulta,
      writable: true,
      configurable: true,
      enumerable: true,
    })
    // El router de json-server espera la ruta completa del recurso: `/desembarques/:id`.
    req.url = `/${COLECCION}${req.url.replace(/^\/(?=\?|$)/, '')}`
    next()
  }

  const rutas = Router()
  rutas.use(autenticar)
  rutas.delete('/:id', autorizar('jefe'))
  rutas.post('/', (req, _res, next) => {
    req.body = validarEntrante(req.body)
    next()
  })
  rutas.put('/:id', (req, _res, next) => {
    const id = req.params.id
    buscarExistente(id)
    req.body = validarEntrante(req.body, id)
    next()
  })
  rutas.patch('/:id', (req, _res, next) => {
    const id = req.params.id
    const actual = buscarExistente(id)
    if (!esObjeto(req.body)) {
      throw errorValidacion('Envía los cambios del desembarque como un objeto JSON.', {})
    }
    // Se valida el desembarque completo tal como quedaría tras el cambio.
    req.body = validarEntrante({ ...actual, ...camposEnviados(req.body) }, id)
    next()
  })
  rutas.all(['/', '/:id'], prepararParaJsonServer, routerJson)
  rutas.use(rutaNoEncontrada)

  return { rutas, leerDesembarques }
}
