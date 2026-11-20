import { useEffect, useState, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import AlertMessage from '../components/AlertMessage.tsx'
import DesembarqueForm from '../components/DesembarqueForm.tsx'
import EstadoVacio from '../components/EstadoVacio.tsx'
import Loading from '../components/Loading.tsx'
import { DESEMBARQUE_VACIO } from '../constants/desembarques.ts'
import { useGuardiaCambios } from '../hooks/useGuardiaCambios.ts'
import { useLocalStorage } from '../hooks/useLocalStorage.ts'
import { useShell } from '../hooks/useShell.ts'
import { useToast } from '../hooks/useToast.ts'
import { add, esErrorNoEncontrado, getAll, getById, update } from '../services/apiService.ts'
import type { CampoDesembarque, Desembarque, DesembarqueEditable } from '../types/desembarque.ts'
import { mensajeDeError } from '../utils/errores.ts'
import { formatearFecha, formatearToneladas } from '../utils/formato.ts'
import { avisarCambioOperaciones } from '../utils/operaciones.ts'
import { normalizarDesembarque } from '../utils/validarDesembarque.ts'

// Object.keys devuelve string[]: las claves de DESEMBARQUE_VACIO son los campos editables.
const CAMPOS = Object.keys(DESEMBARQUE_VACIO) as CampoDesembarque[]

/** Indica si el borrador tiene algo escrito (el estado inicial "Programado" no cuenta). */
const tieneDatos = (desembarque: Partial<DesembarqueEditable> | null | undefined) =>
  CAMPOS.some(
    (campo) =>
      String(desembarque?.[campo] ?? '').trim() !== String(DESEMBARQUE_VACIO[campo] ?? '').trim(),
  )

/** Compara los valores del formulario con el desembarque guardado (todo como texto). */
const sonDistintos = (
  valores: Partial<DesembarqueEditable> | null | undefined,
  desembarque: Partial<DesembarqueEditable> | null | undefined,
) => CAMPOS.some((campo) => String(valores?.[campo] ?? '') !== String(desembarque?.[campo] ?? ''))

/** Propiedades de `EncabezadoRegistro`. */
interface PropsEncabezadoRegistro {
  titulo: string
  /** Bajada bajo el título. */
  children: ReactNode
}

/** Mensaje en línea de la página de registro. */
interface AvisoRegistro {
  tipo: 'warning' | 'danger'
  texto: string
}

/** Error al cargar el desembarque que se quiere editar. */
interface ErrorCarga {
  mensaje: string
  /** true si la API respondió 404 (el desembarque no existe). */
  noExiste: boolean
}

function EncabezadoRegistro({ titulo, children }: PropsEncabezadoRegistro) {
  return (
    <header className="pc-cabecera-pagina">
      <div>
        <h2 id="titulo-registro" className="pc-titulo-pagina">
          {titulo}
        </h2>
        <p className="pc-bajada">{children}</p>
      </div>
      <div className="pc-cabecera-acciones">
        <Link
          to="/lista"
          className="btn btn-outline-secondary d-inline-flex align-items-center gap-2"
        >
          <i className="bi bi-list-columns-reverse" aria-hidden="true" />
          Ver desembarques
        </Link>
      </div>
    </header>
  )
}

/** "/registro": alta de un desembarque nuevo, con borrador persistido en localStorage. */
function NuevoDesembarque() {
  const navigate = useNavigate()
  const toast = useToast()
  const [codigos, setCodigos] = useState<string[]>([])
  const [aviso, setAviso] = useState<AvisoRegistro | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [borrador, setBorrador] = useLocalStorage<DesembarqueEditable>(
    'pescacontrol:borrador-desembarque',
    DESEMBARQUE_VACIO,
  )
  // Se lee una sola vez: si el formulario recibiera el borrador en cada tecla, se rellenaría sin fin.
  const [borradorInicial, setBorradorInicial] = useState(borrador)

  useGuardiaCambios(tieneDatos(borrador), 'nuevo')

  useEffect(() => {
    let activo = true
    getAll()
      .then((desembarques) => {
        if (activo) setCodigos(desembarques.map((desembarque) => desembarque.codigo))
      })
      .catch((error) => {
        if (activo) setAviso({ tipo: 'warning', texto: mensajeDeError(error) })
      })
    return () => {
      activo = false
    }
  }, [])

  async function guardar(desembarque: DesembarqueEditable) {
    setGuardando(true)
    setAviso(null)
    try {
      const creado = await add(normalizarDesembarque(desembarque))
      setCodigos((anteriores) => [...anteriores, creado.codigo])
      setBorrador(DESEMBARQUE_VACIO)
      avisarCambioOperaciones()
      toast.exito(
        `Desembarque ${creado.codigo} · ${creado.embarcacion} registrado: ${formatearToneladas(creado.toneladas)} de ${creado.especie.toLowerCase()} en ${creado.puerto}.`,
        {
          accion: {
            texto: 'Ver en Desembarques',
            onClick: () => navigate(`/lista?desembarque=${creado.id}`),
          },
        },
      )
      return true
    } catch (error) {
      setAviso({ tipo: 'danger', texto: mensajeDeError(error) })
      return false
    } finally {
      setGuardando(false)
    }
  }

  function descartarBorrador() {
    setBorrador(DESEMBARQUE_VACIO)
    setBorradorInicial(DESEMBARQUE_VACIO)
  }

  return (
    <section className="pc-registro" aria-labelledby="titulo-registro">
      <EncabezadoRegistro titulo="Registrar desembarque">
        Todos los campos son obligatorios. El código identifica la operación en el muelle.
      </EncabezadoRegistro>

      <AlertMessage tipo={aviso?.tipo} mensaje={aviso?.texto} onClose={() => setAviso(null)} />

      {tieneDatos(borrador) && (
        <p className="pc-borrador">
          <i className="bi bi-cloud-check" aria-hidden="true" />
          {tieneDatos(borradorInicial)
            ? 'Se recuperó un borrador sin guardar. Los cambios se siguen guardando en este navegador.'
            : 'Borrador guardado en este navegador.'}
          <button type="button" className="pc-enlace-boton" onClick={descartarBorrador}>
            Descartar borrador
          </button>
        </p>
      )}

      <DesembarqueForm
        desembarqueInicial={borradorInicial}
        onSubmit={guardar}
        textoBoton="Registrar desembarque"
        cargando={guardando}
        codigosExistentes={codigos}
        onCambio={setBorrador}
      />
    </section>
  )
}

/** "/registro/:id": carga el desembarque, permite editarlo y vuelve a la lista al guardar. */
/** Propiedades de `EditarDesembarque`. */
interface PropsEditarDesembarque {
  /** Id del desembarque que se edita (parámetro :id de la ruta). */
  id: string
}

function EditarDesembarque({ id }: PropsEditarDesembarque) {
  const navigate = useNavigate()
  const toast = useToast()
  const { navegarSeguro } = useShell()
  const [desembarque, setDesembarque] = useState<Desembarque | null>(null)
  const [valores, setValores] = useState<DesembarqueEditable | null>(null)
  const [codigos, setCodigos] = useState<string[]>([])
  const [cargando, setCargando] = useState(true)
  const [errorCarga, setErrorCarga] = useState<ErrorCarga | null>(null)
  const [intento, setIntento] = useState(0)
  const [guardando, setGuardando] = useState(false)
  const [aviso, setAviso] = useState('')

  const hayCambios =
    Boolean(desembarque && valores && sonDistintos(valores, desembarque)) && !guardando
  useGuardiaCambios(hayCambios, 'edicion')

  useEffect(() => {
    let activo = true
    Promise.all([getById(id), getAll()])
      .then(([encontrado, todos]) => {
        if (!activo) return
        setDesembarque(encontrado)
        // En edición, el código propio no cuenta como repetido.
        setCodigos(todos.filter((otro) => otro.id !== encontrado.id).map((otro) => otro.codigo))
      })
      .catch((error) => {
        if (!activo) return
        const noExiste = esErrorNoEncontrado(error)
        setErrorCarga({ mensaje: mensajeDeError(error), noExiste })
      })
      .finally(() => {
        if (activo) setCargando(false)
      })
    return () => {
      activo = false
    }
  }, [id, intento])

  function reintentar() {
    setCargando(true)
    setErrorCarga(null)
    setIntento((n) => n + 1)
  }

  async function guardar(datos: DesembarqueEditable) {
    setGuardando(true)
    setAviso('')
    try {
      const actualizado = await update(id, normalizarDesembarque({ ...desembarque, ...datos }))
      avisarCambioOperaciones()
      toast.exito(
        `Desembarque ${actualizado.codigo} · ${actualizado.embarcacion} actualizado correctamente.`,
        {
          accion: {
            texto: 'Ver detalle',
            onClick: () => navigate(`/lista?desembarque=${actualizado.id}`),
          },
        },
      )
      navigate('/lista')
      return false
    } catch (error) {
      setAviso(mensajeDeError(error))
      setGuardando(false)
      return false
    }
  }

  if (cargando) {
    return (
      <section className="pc-registro" aria-labelledby="titulo-registro">
        <EncabezadoRegistro titulo="Editar desembarque">
          Cargando los datos del desembarque.
        </EncabezadoRegistro>
        <Loading />
      </section>
    )
  }

  if (errorCarga) {
    return (
      <section className="pc-registro" aria-labelledby="titulo-registro">
        <EncabezadoRegistro titulo="Editar desembarque">
          No se pudo abrir el desembarque solicitado.
        </EncabezadoRegistro>
        <AlertMessage
          tipo={errorCarga.noExiste ? 'warning' : 'danger'}
          mensaje={errorCarga.mensaje}
        />
        <EstadoVacio
          ilustracion="deriva"
          titulo={
            errorCarga.noExiste
              ? 'Este desembarque ya no está registrado'
              : 'Sin conexión con la API'
          }
          acciones={
            <>
              {!errorCarga.noExiste && (
                <button type="button" className="btn btn-primary" onClick={reintentar}>
                  Reintentar
                </button>
              )}
              <Link to="/lista" className="btn btn-outline-secondary">
                Volver a Desembarques
              </Link>
            </>
          }
        >
          {errorCarga.noExiste
            ? 'Puede que alguien lo haya eliminado. Búscalo en Desembarques o registra uno nuevo.'
            : 'Revisa que json-server esté en ejecución (npm run server) y vuelve a intentarlo.'}
        </EstadoVacio>
      </section>
    )
  }

  // Tras cargar sin error siempre hay desembarque; la comprobación solo estrecha el tipo.
  if (!desembarque) return null

  return (
    <section className="pc-registro" aria-labelledby="titulo-registro">
      <EncabezadoRegistro titulo="Editar desembarque">
        Modificando <span className="pc-codigo">{desembarque.codigo}</span> ·{' '}
        {desembarque.embarcacion}, desembarcado el {formatearFecha(desembarque.fechaDesembarque)}.
      </EncabezadoRegistro>

      <AlertMessage tipo="danger" mensaje={aviso} onClose={() => setAviso('')} />

      {hayCambios && (
        <p className="pc-borrador pc-borrador-pendiente" role="status">
          <i className="bi bi-pencil-square" aria-hidden="true" />
          Cambios sin guardar.
        </p>
      )}

      <DesembarqueForm
        desembarqueInicial={desembarque}
        onSubmit={guardar}
        textoBoton="Guardar cambios"
        cargando={guardando}
        codigosExistentes={codigos}
        onCambio={setValores}
        onCancel={() => navegarSeguro('/lista')}
      />
    </section>
  )
}

// Una misma ruta-página para crear y editar: con :id se edita; sin :id se registra.
// La `key` reinicia el estado al pasar de un desembarque a otro o de edición a registro.
function Registro() {
  const { id } = useParams()
  return id ? <EditarDesembarque key={id} id={id} /> : <NuevoDesembarque />
}

export default Registro
