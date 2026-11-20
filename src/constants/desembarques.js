// Catálogos y reglas del modelo Desembarque. Se definen una sola vez y se reutilizan
// en formularios, filtros, validaciones y cálculos del panel.

/** Especies hidrobiológicas que se registran en el desembarque. */
export const ESPECIES = Object.freeze([
  'Anchoveta',
  'Jurel',
  'Caballa',
  'Bonito',
  'Perico',
  'Pota',
  'Merluza',
])

/** Artes o aparejos de pesca permitidos. */
export const ARTES_PESCA = Object.freeze(['Cerco', 'Arrastre', 'Espinel', 'Pinta', 'Enmalle'])

/** Puertos de desembarque, de norte a sur. */
export const PUERTOS = Object.freeze(['Paita', 'Chimbote', 'Callao', 'Pisco', 'Ilo'])

/** Destino de la captura. */
export const DESTINOS = Object.freeze(['Consumo humano directo', 'Harina y aceite'])

/** Estados del desembarque, en el orden en que avanza la operación. */
export const ESTADOS = Object.freeze(['Programado', 'En descarga', 'Descargado', 'Observado'])

/** Estados que requieren seguimiento del operador (se destacan en el panel). */
export const ESTADOS_ATENCION = Object.freeze(['Observado', 'En descarga'])

/**
 * Prefijo de capitanía de puerto con que suelen matricularse las embarcaciones de cada
 * puerto. Es solo referencial (por ejemplo, para sugerir el inicio de la matrícula):
 * una embarcación puede desembarcar en un puerto distinto al de su matrícula.
 */
export const CAPITANIA_POR_PUERTO = Object.freeze({
  Paita: 'PT',
  Chimbote: 'CE',
  Callao: 'CO',
  Pisco: 'PS',
  Ilo: 'IO',
})

/** Valores iniciales de un formulario de desembarque nuevo (solo campos editables). */
export const DESEMBARQUE_VACIO = Object.freeze({
  codigo: '',
  embarcacion: '',
  matricula: '',
  especie: '',
  artePesca: '',
  puerto: '',
  destino: '',
  toneladas: '',
  precioTonelada: '',
  fechaDesembarque: '',
  estado: 'Programado',
})

/** Formato del código: "DSB", guion y 3 números (ej. DSB-014). */
export const PATRON_CODIGO = /^DSB-\d{3}$/

/** Formato de la matrícula: 2 letras, guion, 5 números, guion y 2 letras (ej. CO-21345-PM). */
export const PATRON_MATRICULA = /^[A-Z]{2}-\d{5}-[A-Z]{2}$/

/** Tope razonable de toneladas por desembarque (una bodega industrial grande). */
export const TONELADAS_MAXIMAS = 1500

/** Longitud permitida del nombre de la embarcación. */
export const LARGO_EMBARCACION = Object.freeze({ minimo: 3, maximo: 60 })
