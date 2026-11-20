// src/utils/operaciones.ts (compartido con el frontend) usa `window` solo si existe.
// En Node no existe: se declara como posiblemente indefinido para que el código del
// servidor compile sin incluir los tipos del DOM.
declare global {
  var window: EventTarget | undefined
}

export {}
