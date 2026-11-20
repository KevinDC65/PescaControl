import { Router } from 'express'
import type { Desembarque } from '../../src/types/desembarque.ts'
import type { ResumenPublico } from '../../src/types/publico.ts'
import { resumirOperaciones } from '../../src/utils/operaciones.ts'

// /api/publico: cifras agregadas sin sesión. Nunca devuelve desembarques individuales
// (embarcaciones, matrículas) ni datos de usuarios.

/** Resume los desembarques para la página pública. */
export function resumenPublico(desembarques: readonly Desembarque[]): ResumenPublico {
  const resumen = resumirOperaciones(desembarques)
  return {
    desembarques: resumen.total,
    toneladas: resumen.toneladas,
    valor: resumen.valor,
    puertos: resumen.porPuerto.filter((grupo) => grupo.desembarques > 0).length,
    especies: resumen.porEspecie.filter((grupo) => grupo.desembarques > 0).length,
    porPuerto: resumen.porPuerto.map(({ puerto, toneladas }) => ({ puerto, toneladas })),
    porEspecie: resumen.porEspecie.map(({ especie, toneladas }) => ({ especie, toneladas })),
  }
}

export function crearRutasPublico(leerDesembarques: () => readonly Desembarque[]): Router {
  const rutas = Router()
  rutas.get('/resumen', (_req, res) => {
    res.json(resumenPublico(leerDesembarques()) satisfies ResumenPublico)
  })
  return rutas
}
