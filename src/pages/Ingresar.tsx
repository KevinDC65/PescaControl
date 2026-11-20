import { useEffect, useRef, useState, type ChangeEvent, type SubmitEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import AlertMessage from '../components/AlertMessage.tsx'
import CampoContrasena from '../components/acceso/CampoContrasena.tsx'
import LayoutAcceso from '../components/acceso/LayoutAcceso.tsx'
import { nombreRol } from '../components/InsigniaRol.tsx'
import { useAppContext } from '../context/AppContext.tsx'
import { useToast } from '../hooks/useToast.ts'
import type { CredencialesIngreso } from '../types/usuario.ts'
import { describirErrorAcceso, type AvisoAcceso } from '../utils/erroresAcceso.ts'
import { RUTA_PANEL, rutaDeRetorno } from '../utils/sesion.ts'
import { validarCorreo, type ErroresCuenta } from '../utils/validarCuenta.ts'

type CampoIngreso = keyof CredencialesIngreso

const VACIO: CredencialesIngreso = { correo: '', contrasena: '' }

/** Nombre legible de la sección a la que se volverá tras ingresar. */
const SECCIONES: Record<string, string> = {
  [RUTA_PANEL]: 'el panel de operaciones',
  '/lista': 'Desembarques',
  '/registro': 'Registrar desembarque',
  '/usuarios': 'Usuarios',
}

const FRASE = ['Cada tonelada', 'que llega al muelle,', 'registrada al momento.'] as const
const DETALLE = [
  { icono: 'bi-geo-alt', texto: 'Paita, Chimbote, Callao, Pisco e Ilo' },
  { icono: 'bi-shield-lock', texto: 'Sesión segura con roles Operador y Jefe' },
] as const

/** Validación en vivo del formulario de ingreso. */
function validar(datos: CredencialesIngreso): ErroresCuenta {
  const errores: ErroresCuenta = {}
  const correo = validarCorreo(datos.correo)
  if (correo) errores.correo = correo
  if (!datos.contrasena) errores.contrasena = 'Escribe tu contraseña.'
  return errores
}

/**
 * Página /ingresar: formulario controlado de correo y contraseña. Valida mientras se
 * escribe, muestra los errores del servidor (401, 403 cuenta desactivada, 429 demasiados
 * intentos) y, al ingresar, `SoloInvitado` lleva a la ruta de `?volver=` o al panel.
 */
function Ingresar() {
  const { iniciarSesion } = useAppContext()
  const toast = useToast()
  const [parametros] = useSearchParams()
  const [datos, setDatos] = useState<CredencialesIngreso>(VACIO)
  const [tocados, setTocados] = useState<Partial<Record<CampoIngreso, boolean>>>({})
  const [intentado, setIntentado] = useState(false)
  const [erroresServidor, setErroresServidor] = useState<ErroresCuenta>({})
  const [aviso, setAviso] = useState<AvisoAcceso | null>(null)
  const [enviando, setEnviando] = useState(false)
  const correoRef = useRef<HTMLInputElement>(null)
  const contrasenaRef = useRef<HTMLInputElement>(null)

  const destino = rutaDeRetorno(parametros)
  const seccion = parametros.has('volver')
    ? (SECCIONES[destino.split(/[?#]/)[0] ?? ''] ?? 'la página que abriste')
    : ''

  // useRef: el primer campo recibe el foco al abrir la página.
  useEffect(() => {
    correoRef.current?.focus()
  }, [])

  const errores: ErroresCuenta = { ...validar(datos), ...erroresServidor }
  const visible = (campo: CampoIngreso) => (tocados[campo] || intentado ? errores[campo] : '')

  function manejarCambio(evento: ChangeEvent<HTMLInputElement>) {
    const { name, value } = evento.target
    setDatos((anteriores) => ({ ...anteriores, [name]: value }))
    // El error del servidor de ese campo deja de valer en cuanto se corrige el valor.
    setErroresServidor((anteriores) => {
      const restantes = { ...anteriores }
      delete restantes[name as keyof ErroresCuenta]
      return restantes
    })
    if (aviso?.estado === 401) setAviso(null)
  }

  const marcarTocado = (campo: CampoIngreso) =>
    setTocados((anteriores) => ({ ...anteriores, [campo]: true }))

  async function manejarEnvio(evento: SubmitEvent<HTMLFormElement>) {
    evento.preventDefault()
    if (enviando) return
    setIntentado(true)
    setAviso(null)
    const erroresLocales = validar(datos)
    if (erroresLocales.correo) {
      correoRef.current?.focus()
      return
    }
    if (erroresLocales.contrasena) {
      contrasenaRef.current?.focus()
      return
    }

    setEnviando(true)
    try {
      const usuario = await iniciarSesion({
        correo: datos.correo.trim(),
        contrasena: datos.contrasena,
      })
      toast.exito(`Hola, ${usuario.nombre}. Ingresaste como ${nombreRol(usuario.rol)}.`)
    } catch (error) {
      const descripcion = describirErrorAcceso(error, 'ingreso')
      setAviso(descripcion)
      setErroresServidor(descripcion.campos)
      setEnviando(false)
      if (descripcion.campos.correo) correoRef.current?.focus()
      else if (descripcion.estado === 401) contrasenaRef.current?.select()
    }
  }

  return (
    <LayoutAcceso frase={FRASE} detalle={DETALLE}>
      <h1 className="pc-acceso-titulo">Ingresar</h1>
      <p className="pc-acceso-bajada">
        {seccion
          ? `Ingresa con tu cuenta para continuar en ${seccion}.`
          : 'Usa el correo y la contraseña de tu cuenta de PescaControl.'}
      </p>

      {aviso && (
        <AlertMessage
          tipo={aviso.tipo}
          mensaje={aviso.mensaje}
          onClose={() => setAviso(null)}
          className="mb-4"
        />
      )}

      <form className="pc-acceso-form" onSubmit={manejarEnvio} noValidate>
        <div className="pc-campo">
          <label htmlFor="ingreso-correo" className="form-label">
            Correo
          </label>
          <input
            ref={correoRef}
            id="ingreso-correo"
            name="correo"
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            className={`form-control ${visible('correo') ? 'is-invalid' : tocados.correo && !errores.correo ? 'is-valid' : ''}`}
            value={datos.correo}
            onChange={manejarCambio}
            onBlur={() => marcarTocado('correo')}
            placeholder="nombre@empresa.pe"
            aria-invalid={Boolean(visible('correo'))}
            aria-describedby={visible('correo') ? 'ingreso-correo-error' : undefined}
            required
          />
          {visible('correo') && (
            <div id="ingreso-correo-error" className="invalid-feedback">
              {visible('correo')}
            </div>
          )}
        </div>

        <CampoContrasena
          id="ingreso-contrasena"
          name="contrasena"
          etiqueta="Contraseña"
          valor={datos.contrasena}
          onChange={manejarCambio}
          onBlur={() => marcarTocado('contrasena')}
          autoComplete="current-password"
          error={visible('contrasena')}
          inputRef={contrasenaRef}
          maxLength={72}
        />

        <button
          type="submit"
          className="btn btn-primary btn-lg w-100 pc-acceso-enviar"
          disabled={enviando}
        >
          {enviando ? (
            <>
              <span className="spinner-border spinner-border-sm" aria-hidden="true" />
              <span role="status">Ingresando...</span>
            </>
          ) : (
            <>
              Ingresar
              <i className="bi bi-arrow-right" aria-hidden="true" />
            </>
          )}
        </button>
      </form>

      <p className="pc-acceso-cambio">
        ¿Aún no tienes cuenta?{' '}
        <Link
          to={parametros.has('volver') ? `/crear-cuenta?${parametros.toString()}` : '/crear-cuenta'}
        >
          Crear cuenta
        </Link>
      </p>
    </LayoutAcceso>
  )
}

export default Ingresar
