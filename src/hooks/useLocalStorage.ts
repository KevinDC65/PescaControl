import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react'

// Por qué es un custom hook: la lógica "leer de localStorage al iniciar, guardar al
// cambiar y tolerar errores" se repite para cada dato que queremos persistir (tema,
// usuario, borradores). Encapsularla en useLocalStorage permite reutilizarla con la
// misma interfaz que useState, sin duplicar código en cada componente.

/** Valor inicial: el valor o una función que lo devuelve (inicialización perezosa). */
type ValorInicial<T> = T | (() => T)

const esInicializador = <T>(valorInicial: ValorInicial<T>): valorInicial is () => T =>
  typeof valorInicial === 'function'

const resolver = <T>(valorInicial: ValorInicial<T>): T =>
  esInicializador(valorInicial) ? valorInicial() : valorInicial

/**
 * Interpreta un texto JSON guardado. localStorage no garantiza la forma del dato
 * (otra versión de la app o un cambio manual), así que quien lo usa debe validar los
 * valores críticos, como hace AppContext con el usuario y el tema.
 */
function parsear<T>(texto: string): T {
  const leido: unknown = JSON.parse(texto)
  return leido as T
}

/** Lee y parsea la clave; si no existe, el JSON es inválido o no hay localStorage, usa el inicial. */
function leerValor<T>(clave: string, valorInicial: ValorInicial<T>): T {
  try {
    const guardado = window.localStorage.getItem(clave)
    return guardado === null ? resolver(valorInicial) : parsear<T>(guardado)
  } catch {
    return resolver(valorInicial)
  }
}

/**
 * Estado de React persistido en localStorage.
 * Uso: `const [valor, setValor] = useLocalStorage(clave, valorInicial)`.
 * `valorInicial` puede ser un valor o una función (inicialización perezosa) y
 * `setValor` acepta un valor o una función `(anterior) => nuevo`, igual que useState.
 * El valor se sincroniza entre pestañas abiertas de la aplicación.
 *
 * @param clave Clave en localStorage.
 * @param valorInicial Valor (o función que lo devuelve) si no hay nada guardado.
 */
export function useLocalStorage<T>(
  clave: string,
  valorInicial: ValorInicial<T>,
): [T, Dispatch<SetStateAction<T>>] {
  const [valor, setValor] = useState<T>(() => leerValor(clave, valorInicial))
  const [claveActual, setClaveActual] = useState(clave)
  const valorInicialRef = useRef(valorInicial)

  // Si cambia la clave, se vuelve a leer el valor guardado para la nueva clave.
  if (claveActual !== clave) {
    setClaveActual(clave)
    setValor(leerValor(clave, valorInicial))
  }

  useEffect(() => {
    try {
      window.localStorage.setItem(clave, JSON.stringify(valor))
    } catch {
      // Cuota llena o almacenamiento bloqueado: el valor sigue disponible en memoria.
    }
  }, [clave, valor])

  useEffect(() => {
    function manejarCambioExterno(evento: StorageEvent) {
      if (evento.storageArea !== window.localStorage || evento.key !== clave) return
      if (evento.newValue === null) {
        setValor(() => resolver(valorInicialRef.current))
        return
      }
      try {
        const nuevo = parsear<T>(evento.newValue)
        setValor(() => nuevo)
      } catch {
        // Otra pestaña guardó un valor no válido: se mantiene el actual.
      }
    }
    window.addEventListener('storage', manejarCambioExterno)
    return () => window.removeEventListener('storage', manejarCambioExterno)
  }, [clave])

  return [valor, setValor]
}
