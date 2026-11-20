import { useState, type ChangeEvent, type ReactNode, type Ref } from 'react'

/** Propiedades de `CampoContrasena`. */
interface PropsCampoContrasena {
  id: string
  name: string
  etiqueta: string
  valor: string
  onChange: (evento: ChangeEvent<HTMLInputElement>) => void
  onBlur?: () => void
  /** `current-password` al ingresar, `new-password` al crear la cuenta. */
  autoComplete: 'current-password' | 'new-password'
  error?: string
  /** Muestra el borde de válido (solo cuando el campo ya se revisó). */
  valido?: boolean
  /** Id del texto de ayuda que describe el campo. */
  idAyuda?: string
  inputRef?: Ref<HTMLInputElement>
  maxLength?: number
  /** Contenido bajo el campo (medidor de fortaleza, requisitos). */
  children?: ReactNode
}

/**
 * Campo de contraseña controlado con botón para mostrarla u ocultarla. El botón anuncia su
 * estado (`aria-pressed`) y no se envía con el formulario.
 */
function CampoContrasena({
  id,
  name,
  etiqueta,
  valor,
  onChange,
  onBlur,
  autoComplete,
  error,
  valido = false,
  idAyuda,
  inputRef,
  maxLength,
  children,
}: PropsCampoContrasena) {
  const [visible, setVisible] = useState(false)
  const idError = `${id}-error`
  const describe = [idAyuda, error ? idError : ''].filter(Boolean).join(' ') || undefined
  const estado = error ? 'is-invalid' : valido ? 'is-valid' : ''

  return (
    <div className="pc-campo">
      <label htmlFor={id} className="form-label">
        {etiqueta}
      </label>
      <div className={`input-group pc-grupo-contrasena has-validation ${estado}`}>
        <input
          ref={inputRef}
          id={id}
          name={name}
          type={visible ? 'text' : 'password'}
          className={`form-control ${estado}`}
          value={valor}
          onChange={onChange}
          onBlur={onBlur}
          autoComplete={autoComplete}
          autoCapitalize="none"
          spellCheck={false}
          maxLength={maxLength}
          aria-invalid={Boolean(error)}
          aria-describedby={describe}
          required
        />
        <button
          type="button"
          className="btn pc-ver-contrasena"
          onClick={() => setVisible((actual) => !actual)}
          aria-pressed={visible}
          aria-controls={id}
          aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          title={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        >
          <i className={`bi ${visible ? 'bi-eye-slash' : 'bi-eye'}`} aria-hidden="true" />
        </button>
        {error && (
          <div id={idError} className="invalid-feedback">
            {error}
          </div>
        )}
      </div>
      {children}
    </div>
  )
}

export default CampoContrasena
