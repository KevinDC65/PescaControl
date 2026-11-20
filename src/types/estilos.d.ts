// Permite variables CSS propias (ej. `--especie`, `--i`) en la prop `style` de los elementos.
declare module 'react' {
  interface CSSProperties {
    [variable: `--${string}`]: string | number | undefined
  }
}

export {}
