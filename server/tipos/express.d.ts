import type { Usuario } from '../../src/types/usuario.ts'

// `res.locals.usuario` lo completa el middleware `autenticar` (sin hash).
declare global {
  namespace Express {
    interface Locals {
      usuario?: Usuario
    }
  }
}

export {}
