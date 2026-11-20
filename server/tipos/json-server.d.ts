// Tipos mínimos de json-server 0.17 (el paquete no trae los suyos). Solo se declara lo que
// usa el servidor: el router y su base de datos lowdb. El router se monta directamente en la
// app de Express 5, así que recibe los `req`/`res` de Express 5.
declare module 'json-server' {
  import type { Request, RequestHandler, Response } from 'express'

  /** Cadena de lowdb/lodash: `value()` devuelve los datos. */
  interface CadenaLowdb {
    value(): unknown
  }

  /** Base de datos lowdb que el router mantiene en memoria y escribe en el archivo. */
  interface BaseDatosLowdb {
    get(ruta: string): CadenaLowdb
  }

  /** Router (de Express 4) que genera las rutas REST a partir del archivo JSON. */
  type RouterJsonServer = RequestHandler & {
    db: BaseDatosLowdb
    /** Envía `res.locals.data`; se reemplaza para cambiar el formato de respuesta. */
    render: (req: Request, res: Response) => void
  }

  const jsonServer: {
    router(fuente: string, opciones?: { foreignKeySuffix?: string }): RouterJsonServer
  }

  export = jsonServer
}
