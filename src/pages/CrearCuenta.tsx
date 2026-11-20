import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type RefObject,
  type SubmitEvent,
} from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import AlertMessage from '../components/AlertMessage.tsx'
import CampoContrasena from '../components/acceso/CampoContrasena.tsx'
import LayoutAcceso from '../components/acceso/LayoutAcceso.tsx'
import MedidorFortaleza from '../components/acceso/MedidorFortaleza.tsx'
import { useAppContext } from '../context/AppContext.tsx'
import { useToast } from '../hooks/useToast.ts'
import { describirErrorAcceso, type AvisoAcceso } from '../utils/erroresAcceso.ts'
import {
  LARGO_CONTRASENA,
  LARGO_NOMBRE,
  validarConfirmacion,
  validarContrasenaNueva,
  validarCorreo,
  validarNombre,
  type CampoCuenta,
  type ErroresCuenta,
} from '../utils/validarCuenta.ts'

/** Valores del formulario de registro (la confirmación no se envía al servidor). */
type DatosFormulario = Record<CampoCuenta, string>

const VACIO: DatosFormulario = { nombre: '', correo: '', contrasena: '', confirmacion: '' }

/** Orden de los campos: define a cuál se lleva el foco cuando hay errores. */
const ORDEN: readonly CampoCuenta[] = ['nombre', 'correo', 'contrasena', 'confirmacion']

const FRASE = ['Tu turno en el muelle', 'empieza con', 'una cuenta.'] as const
const DETALLE = [
  { icono: 'bi-person-badge', texto: 'Operador: registra y edita desembarques' },
  { icono: 'bi-shield-check', texto: 'Jefe: además elimina y gestiona usuarios' },
] as const

/** Validación en vivo con las mismas reglas que el servidor. */
function validar(datos: DatosFormulario): ErroresCuenta {
  const errores: ErroresCuenta = {
    nombre: validarNombre(datos.nombre),
    correo: validarCorreo(datos.correo),
    contrasena: validarContrasenaNueva(datos.contrasena),
    confirmacion: validarConfirmacion(datos.contrasena, datos.confirmacion),
  }
  for (const campo of ORDEN) if (!errores[campo]) delete errores[campo]
  return errores
}

/**
 * Página /crear-cuenta: formulario controlado con nombre, correo, contraseña (medidor de
 * fortaleza y requisitos) y confirmación. Valida mientras se escribe y muestra los errores
 * del servidor en su campo (400) o como aviso general (409 correo repetido, 429).
 */
function CrearCuenta() {
  const { registrarse } = useAppContext()
  const toast = useToast()
  const [parametros] = useSearchParams()
  const [datos, setDatos] = useState<DatosFormulario>(VACIO)
  const [tocados, setTocados] = useState<Partial<Record<CampoCuenta, boolean>>>({})
  const [intentado, setIntentado] = useState(false)
  const [erroresServidor, setErroresServidor] = useState<ErroresCuenta>({})
  const [aviso, setAviso] = useState<AvisoAcceso | null>(null)
  const [enviando, setEnviando] = useState(false)

  const nombreRef = useRef<HTMLInputElement>(null)
  const correoRef = useRef<HTMLInputElement>(null)
  const contrasenaRef = useRef<HTMLInputElement>(null)
  const confirmacionRef = useRef<HTMLInputElement>(null)
  const referencias: Record<CampoCuenta, RefObject<HTMLInputElement | null>> = {
    nombre: nombreRef,
    correo: correoRef,
    contrasena: contrasenaRef,
    confirmacion: confirmacionRef,
  }

  useEffect(() => {
    nombreRef.current?.focus()
  }, [])

  const errores: ErroresCuenta = { ...validar(datos), ...erroresServidor }
  const mostrar = (campo: CampoCuenta) => Boolean(tocados[campo] || intentado)
  const visible = (campo: CampoCuenta) => (mostrar(campo) ? (errores[campo] ?? '') : '')
  const valido = (campo: CampoCuenta) => mostrar(campo) && !errores[campo]
  const clases = (campo: CampoCuenta) =>
    `form-control ${visible(campo) ? 'is-invalid' : valido(campo) ? 'is-valid' : ''}`

  function manejarCambio(evento: ChangeEvent<HTMLInputElement>) {
    const { name, value } = evento.target
    setDatos((anteriores) => ({ ...anteriores, [name]: value }))
    // El error del servidor de ese campo deja de valer en cuanto se corrige el valor.
    setErroresServidor((anteriores) => {
      const restantes = { ...anteriores }
      delete restantes[name as keyof ErroresCuenta]
      return restantes
    })
  }

  const marcarTocado = (campo: CampoCuenta) =>
    setTocados((anteriores) => ({ ...anteriores, [campo]: true }))

  function enfocarPrimerError(lista: ErroresCuenta) {
    const campo = ORDEN.find((nombre) => lista[nombre])
    if (campo) referencias[campo].current?.focus()
  }

  async function manejarEnvio(evento: SubmitEvent<HTMLFormElement>) {
    evento.preventDefault()
    if (enviando) return
    setIntentado(true)
    setAviso(null)
    const erroresLocales = validar(datos)
    if (Object.keys(erroresLocales).length > 0) {
      enfocarPrimerError(erroresLocales)
      return
    }

    setEnviando(true)
    try {
      const usuario = await registrarse({
        nombre: datos.nombre.trim(),
        correo: datos.correo.trim(),
        contrasena: datos.contrasena,
      })
      toast.exito(
        usuario.rol === 'jefe'
          ? `Cuenta creada, ${usuario.nombre}. Es la primera del sistema: tienes el rol Jefe.`
          : `Cuenta creada, ${usuario.nombre}. Tu rol es Operador.`,
      )
    } catch (error) {
      const descripcion = describirErrorAcceso(error, 'registro')
      setAviso(descripcion)
      setErroresServidor(descripcion.campos)
      setEnviando(false)
      enfocarPrimerError(descripcion.campos)
    }
  }

  const enlaceIngresar = parametros.has('volver')
    ? `/ingresar?${parametros.toString()}`
    : '/ingresar'

  return (
    <LayoutAcceso frase={FRASE} detalle={DETALLE}>
      <h1 className="pc-acceso-titulo">Crear cuenta</h1>
      <p className="pc-acceso-bajada">
        Las cuentas nuevas empiezan con el rol Operador; un Jefe puede cambiarlo. Si es la primera
        cuenta del sistema, queda como Jefe.
      </p>

      {aviso && (
        <AlertMessage
          tipo={aviso.tipo}
          mensaje={aviso.mensaje}
          onClose={() => setAviso(null)}
          className="mb-4"
        >
          {aviso.estado === 409 && (
            <>
              {' '}
              <Link to={enlaceIngresar} className="alert-link">
                Ir a Ingresar
              </Link>
            </>
          )}
        </AlertMessage>
      )}

      <form className="pc-acceso-form" onSubmit={manejarEnvio} noValidate>
        <div className="pc-campo">
          <label htmlFor="registro-nombre" className="form-label">
            Nombre y apellido
          </label>
          <input
            ref={nombreRef}
            id="registro-nombre"
            name="nombre"
            type="text"
            autoComplete="name"
            className={clases('nombre')}
            value={datos.nombre}
            onChange={manejarCambio}
            onBlur={() => marcarTocado('nombre')}
            maxLength={LARGO_NOMBRE.maximo + 10}
            placeholder="Ej. Rosa Huamán"
            aria-invalid={Boolean(visible('nombre'))}
            aria-describedby={visible('nombre') ? 'registro-nombre-error' : undefined}
            required
          />
          {visible('nombre') && (
            <div id="registro-nombre-error" className="invalid-feedback">
              {visible('nombre')}
            </div>
          )}
        </div>

        <div className="pc-campo">
          <label htmlFor="registro-correo" className="form-label">
            Correo
          </label>
          <input
            ref={correoRef}
            id="registro-correo"
            name="correo"
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            className={clases('correo')}
            value={datos.correo}
            onChange={manejarCambio}
            onBlur={() => marcarTocado('correo')}
            placeholder="nombre@empresa.pe"
            aria-invalid={Boolean(visible('correo'))}
            aria-describedby={visible('correo') ? 'registro-correo-error' : undefined}
            required
          />
          {visible('correo') && (
            <div id="registro-correo-error" className="invalid-feedback">
              {visible('correo')}
            </div>
          )}
        </div>

        <CampoContrasena
          id="registro-contrasena"
          name="contrasena"
          etiqueta="Contraseña"
          valor={datos.contrasena}
          onChange={manejarCambio}
          onBlur={() => marcarTocado('contrasena')}
          autoComplete="new-password"
          error={visible('contrasena')}
          valido={valido('contrasena')}
          idAyuda="registro-fortaleza"
          inputRef={contrasenaRef}
          maxLength={LARGO_CONTRASENA.maximo}
        >
          <MedidorFortaleza id="registro-fortaleza" contrasena={datos.contrasena} />
        </CampoContrasena>

        <CampoContrasena
          id="registro-confirmacion"
          name="confirmacion"
          etiqueta="Repite la contraseña"
          valor={datos.confirmacion}
          onChange={manejarCambio}
          onBlur={() => marcarTocado('confirmacion')}
          autoComplete="new-password"
          error={visible('confirmacion')}
          valido={valido('confirmacion')}
          inputRef={confirmacionRef}
          maxLength={LARGO_CONTRASENA.maximo}
        />

        <button
          type="submit"
          className="btn btn-primary btn-lg w-100 pc-acceso-enviar"
          disabled={enviando}
        >
          {enviando ? (
            <>
              <span className="spinner-border spinner-border-sm" aria-hidden="true" />
              <span role="status">Creando cuenta...</span>
            </>
          ) : (
            <>
              Crear cuenta
              <i className="bi bi-arrow-right" aria-hidden="true" />
            </>
          )}
        </button>
      </form>

      <p className="pc-acceso-cambio">
        ¿Ya tienes cuenta? <Link to={enlaceIngresar}>Ingresar</Link>
      </p>
    </LayoutAcceso>
  )
}

export default CrearCuenta
