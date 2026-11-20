import { useId, useRef, useState, type SubmitEvent } from 'react'
import { useAppContext } from '../context/AppContext.tsx'
import { useToast } from '../hooks/useToast.ts'
import Modal from './Modal.tsx'

/** Propiedades de `LoginModal`. */
interface PropsLoginModal {
  abierto: boolean
  onCerrar: () => void
}

// Inicio de sesión simulado: solo pide un nombre y lo guarda en el contexto global.
function LoginModal({ abierto, onCerrar }: PropsLoginModal) {
  const { login } = useAppContext()
  const toast = useToast()
  const [nombre, setNombre] = useState('')
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const idFormulario = useId()
  const inicial = nombre.trim().charAt(0).toUpperCase()

  function cerrar() {
    setNombre('')
    setError('')
    onCerrar()
  }

  function manejarEnvio(evento: SubmitEvent<HTMLFormElement>) {
    evento.preventDefault()
    if (!login(nombre)) {
      setError('Escribe tu nombre para ingresar.')
      inputRef.current?.focus()
      return
    }
    toast.exito(`Hola, ${nombre.trim()}. Sesión iniciada.`)
    cerrar()
  }

  const pie = (
    <>
      <button type="button" className="btn btn-outline-secondary" onClick={cerrar}>
        Cancelar
      </button>
      <button type="submit" form={idFormulario} className="btn btn-primary px-4">
        Ingresar
      </button>
    </>
  )

  return (
    <Modal
      abierto={abierto}
      onCerrar={cerrar}
      titulo="Ingresar a PescaControl"
      descripcion="Tu nombre aparecerá en el saludo de Inicio y en la barra lateral."
      pie={pie}
      enfoqueInicialRef={inputRef}
    >
      <form id={idFormulario} onSubmit={manejarEnvio} noValidate className="pc-login">
        <span className="pc-avatar pc-avatar-xl" data-vacio={!inicial} aria-hidden="true">
          {inicial || <i className="bi bi-person" />}
        </span>
        <div className="flex-grow-1">
          <label htmlFor={`${idFormulario}-nombre`} className="form-label">
            Tu nombre
          </label>
          <input
            ref={inputRef}
            id={`${idFormulario}-nombre`}
            type="text"
            className={`form-control form-control-lg ${error ? 'is-invalid' : ''}`}
            value={nombre}
            onChange={(evento) => {
              setNombre(evento.target.value)
              if (error) setError('')
            }}
            placeholder="Ej. Kevin"
            autoComplete="given-name"
            maxLength={40}
            aria-invalid={Boolean(error)}
            aria-describedby={`${idFormulario}-ayuda${error ? ` ${idFormulario}-error` : ''}`}
          />
          {error && (
            <div id={`${idFormulario}-error`} className="invalid-feedback">
              {error}
            </div>
          )}
          <p id={`${idFormulario}-ayuda`} className="form-text mb-0 mt-2">
            <i className="bi bi-shield-check me-1" aria-hidden="true" />
            Sesión simulada: no se pide contraseña ni se envía nada a un servidor.
          </p>
        </div>
      </form>
    </Modal>
  )
}

export default LoginModal
