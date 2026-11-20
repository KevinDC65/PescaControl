import type { Desembarque, Especie, Puerto } from '../../types/desembarque.ts'

// Datos de ejemplo de las vistas previas de la página principal. Son locales a propósito:
// la página es pública y no llama a las rutas protegidas de la API. Las cifras reales
// del sistema llegan solo por el resumen público (publicoService).

export const DESEMBARQUES_EJEMPLO: readonly Desembarque[] = [
  {
    id: 'ejemplo-1',
    codigo: 'DSB-001',
    embarcacion: 'Don Lucho II',
    matricula: 'CE-21345-CM',
    especie: 'Anchoveta',
    artePesca: 'Cerco',
    puerto: 'Chimbote',
    destino: 'Harina y aceite',
    toneladas: 312.4,
    precioTonelada: 1850,
    fechaDesembarque: '2026-10-01',
    estado: 'Descargado',
  },
  {
    id: 'ejemplo-2',
    codigo: 'DSB-002',
    embarcacion: 'Virgen de la Puerta',
    matricula: 'PT-10872-PM',
    especie: 'Pota',
    artePesca: 'Pinta',
    puerto: 'Paita',
    destino: 'Consumo humano directo',
    toneladas: 18.6,
    precioTonelada: 3450,
    fechaDesembarque: '2026-10-03',
    estado: 'En descarga',
  },
]

/** Composición de ejemplo por especie (toneladas) para las miniaturas del panel. */
export const ESPECIES_EJEMPLO: readonly { especie: Especie; toneladas: number }[] = [
  { especie: 'Anchoveta', toneladas: 1240 },
  { especie: 'Jurel', toneladas: 210 },
  { especie: 'Caballa', toneladas: 160 },
  { especie: 'Pota', toneladas: 120 },
  { especie: 'Merluza', toneladas: 90 },
  { especie: 'Bonito', toneladas: 60 },
]

/** Toneladas de ejemplo por puerto, de norte a sur. */
export const PUERTOS_EJEMPLO: readonly { puerto: Puerto; toneladas: number }[] = [
  { puerto: 'Paita', toneladas: 210 },
  { puerto: 'Chimbote', toneladas: 820 },
  { puerto: 'Callao', toneladas: 460 },
  { puerto: 'Pisco', toneladas: 300 },
  { puerto: 'Ilo', toneladas: 380 },
]
