import { useShell } from '../hooks/useShell.ts'
import Modal from './Modal.tsx'
import { Tecla } from './Tecla.tsx'

/** Atajo de la ayuda: combinaciones de teclas que se pulsan una tras otra. */
interface AtajoAyuda {
  /** Cada combinación es una lista de teclas; 'mod' es Ctrl o ⌘. */
  teclas: string[][]
  texto: string
}

/** Grupo de atajos de la ayuda. */
interface GrupoAtajos {
  grupo: string
  items: AtajoAyuda[]
}

const ATAJOS: GrupoAtajos[] = [
  {
    grupo: 'General',
    items: [
      { teclas: [['mod', 'K']], texto: 'Abrir la paleta de comandos y buscar desembarques' },
      { teclas: [['?']], texto: 'Mostrar esta ayuda' },
      { teclas: [['Esc']], texto: 'Cerrar paneles y ventanas' },
    ],
  },
  {
    grupo: 'Navegación',
    items: [
      { teclas: [['G'], ['I']], texto: 'Ir a Inicio' },
      { teclas: [['G'], ['L']], texto: 'Ir a Desembarques' },
      { teclas: [['G'], ['R']], texto: 'Ir a Registro' },
      { teclas: [['N']], texto: 'Registrar un desembarque nuevo' },
    ],
  },
  {
    grupo: 'Desembarques y formulario',
    items: [
      { teclas: [['/']], texto: 'Enfocar la búsqueda de Desembarques' },
      { teclas: [['mod', 'S']], texto: 'Guardar el formulario de desembarque' },
    ],
  },
]

/** Ventana con los atajos de teclado disponibles (se abre con "?"). */
function AyudaAtajos() {
  const { panel, cerrar } = useShell()

  return (
    <Modal
      abierto={panel === 'ayuda'}
      onCerrar={cerrar}
      titulo="Atajos de teclado"
      descripcion="Funcionan en cualquier página mientras no estés escribiendo en un campo."
      pie={
        <button type="button" className="btn btn-primary px-4" onClick={cerrar}>
          Entendido
        </button>
      }
    >
      <div className="pc-atajos">
        {ATAJOS.map((seccion) => (
          <section key={seccion.grupo}>
            <h3 className="pc-atajos-grupo">{seccion.grupo}</h3>
            <dl>
              {seccion.items.map((item) => (
                <div key={item.texto} className="pc-atajos-fila">
                  <dt>{item.texto}</dt>
                  <dd>
                    {item.teclas.map((combinacion, indice) => (
                      <span key={combinacion.join('+')} className="pc-atajos-teclas">
                        {indice > 0 && <span className="pc-atajos-luego">luego</span>}
                        {combinacion[0] === 'mod' ? (
                          <Tecla mod>{combinacion[1]}</Tecla>
                        ) : (
                          <Tecla>{combinacion[0]}</Tecla>
                        )}
                      </span>
                    ))}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </div>
    </Modal>
  )
}

export default AyudaAtajos
