# Estructura del proyecto

```text
PescaControl/
├── .github/
│   ├── ISSUE_TEMPLATE/        Plantillas de issues (tarea, bug)
│   ├── workflows/ci.yml       CI: autoría + lint + formato + build en cada PR
│   └── pull_request_template.md
├── docs/
│   ├── capturas/              Capturas de pantalla para la entrega (#24)
│   ├── informe/informe.html   Fuente editable del informe (#25)
│   ├── PescaControl_PC3.pdf   Informe de entrega (#25)
│   └── ENTREGA.md             Guía de la entrega
├── public/favicon.svg         Boya sobre olas
├── src/
│   ├── components/            Piezas reutilizables, sin lógica de página
│   │   ├── Header.jsx         Cabecera: título de la app, migas y buscador Ctrl+K (#1)
│   │   ├── Marca.jsx          Sello y nombre de la marca (#1)
│   │   ├── Navbar.jsx         Barra lateral y barra inferior móvil con NavLink (#3)
│   │   ├── Footer.jsx         Pie de página (#4)
│   │   ├── EstadoVacio.jsx    Estados vacío y sin resultados con ilustraciones propias (#4)
│   │   ├── Esqueleto.jsx      Esqueletos de carga (#4)
│   │   ├── DesembarqueForm.jsx Formulario controlado reutilizable vía props (#5, #12, #13, #19)
│   │   ├── AlertMessage.jsx   Mensajes de éxito/error; también dentro de los toasts (#15)
│   │   ├── Loading.jsx        Indicador "Loading..." (#16)
│   │   ├── TablaDesembarques.jsx Tabla ordenable con selección múltiple (#16, #21)
│   │   ├── Graficos.jsx       Composición por especie y carta del litoral por puerto (#11)
│   │   ├── PaletaComandos.jsx Paleta de comandos Ctrl+K (#17)
│   │   ├── AyudaAtajos.jsx    Ayuda de atajos de teclado (#17)
│   │   ├── Tecla.jsx          Representación de una tecla (#17)
│   │   ├── Modal.jsx          Base de modales: portal, Esc, foco y bloqueo de scroll (#20)
│   │   ├── ConfirmModal.jsx   Confirmación de eliminación (#20)
│   │   ├── Drawer.jsx         Panel lateral accesible (#20)
│   │   ├── LoginModal.jsx     Inicio de sesión simulado (#20)
│   │   ├── TarjetaDesembarque.jsx Tarjeta de la vista de tarjetas y vista previa (#21)
│   │   ├── DetalleDesembarque.jsx Contenido del panel de detalle (#21)
│   │   ├── InsigniaEspecie.jsx Insignia con el color de la especie (#21)
│   │   └── InsigniaEstado.jsx Badge del estado con ícono (#16)
│   ├── pages/                 Una por ruta
│   │   ├── Home.jsx           "/"              Panel de operaciones (#11)
│   │   ├── Registro.jsx       "/registro" y "/registro/:id" (#5, #18)
│   │   ├── Lista.jsx          "/lista"         Tabla/tarjetas, filtros en la URL (#16, #21, #22)
│   │   └── NotFound.jsx       "*"              (#9)
│   ├── context/
│   │   ├── AppContext.jsx     Estado global: usuario, tema, configuración (#6)
│   │   ├── ShellProvider.jsx  Paneles abiertos y navegación protegida (#20)
│   │   ├── ToastProvider.jsx  Notificaciones tipo toast (#15)
│   │   └── contextos.js       Definición de los contextos del shell y los toasts
│   ├── hooks/
│   │   ├── useLocalStorage.js Custom hook de persistencia (#14)
│   │   ├── useShell.js        Acceso al estado del shell (#20)
│   │   ├── useToast.js        Mostrar toasts (#15)
│   │   ├── useCapaModal.js    Foco atrapado, Esc y bloqueo de scroll en capas (#20)
│   │   ├── useAtajosTeclado.js Atajos globales (N, /, G+I/L/R, ?) (#17)
│   │   ├── useConteoOperaciones.js Contadores de la barra lateral (#3)
│   │   └── useGuardiaCambios.js Aviso al salir con cambios sin guardar (#18)
│   ├── services/
│   │   └── apiService.js      Único lugar que habla con la API (#8)
│   ├── constants/
│   │   └── desembarques.js    Especies, artes, puertos, destinos, estados y patrones (#5)
│   ├── utils/
│   │   ├── validarDesembarque.js Validación y normalización (#12)
│   │   ├── formato.js         Formato de soles, toneladas y fechas (#8)
│   │   ├── operaciones.js     Resumen, filtros y orden de desembarques (#11, #22)
│   │   └── colores.js         Colores por especie y estado, contraste (#21)
│   ├── styles/                base, shell, capas, especies y vistas (importados desde index.css)
│   ├── App.jsx                Shell de la app + definición de rutas (#1)
│   ├── main.jsx               Punto de entrada: Bootstrap, Router y proveedores
│   └── index.css              Tokens de diseño claro/oscuro (#2)
├── db.json                    "Base de datos" de json-server (#7)
├── .env.example               VITE_API_URL
├── package.json               Dependencias y scripts
└── *.md                       Documentación (README, PROYECTO, PRODUCT, DESIGN, ESTRUCTURA, CONTRIBUTING, SPRINTS, AGENTS)
```

> La práctica nombra los archivos como `App.js`, `Navbar.js`, etc. En Vite los componentes con JSX usan la extensión `.jsx`; el contenido y propósito son los mismos.

## Responsabilidad de cada carpeta

| Carpeta | Puede | No debe |
|---|---|---|
| `components/` | Recibir datos por `props`, emitir eventos (`onSubmit`, `onConfirm`, `onClose`) | Llamar a la API directamente |
| `pages/` | Usar hooks, llamar a `apiService`, leer el contexto, componer componentes | Contener estilos complejos repetidos (extraer a componente) |
| `context/` | Guardar estado global compartido | Guardar la lista de desembarques (eso vive en las páginas) |
| `hooks/` | Lógica reutilizable con hooks (`useX`) | Renderizar JSX |
| `services/` | Peticiones HTTP con Axios y traducción de errores | Usar hooks o tocar el DOM |
| `utils/`, `constants/` | Funciones puras y catálogos | Depender de React |

## Flujo de datos

```text
        ┌──────────────┐   useAppContext()   ┌───────────────────────────┐
        │  AppContext  │ ──────────────────▶ │ Navbar / Header / páginas │
        │ usuario/tema │ ◀── useLocalStorage │                           │
        └──────────────┘                     │  Home   Registro   Lista  │
                                             └─────────────┬─────────────┘
                                                           │ getAll/add/update/remove
                                                           ▼
                                             ┌───────────────────────────┐
                                             │   services/apiService     │ (Axios)
                                             └─────────────┬─────────────┘
                                                           │ HTTP
                                                           ▼
                                             ┌───────────────────────────┐
                                             │ json-server :3001         │ ◀─ db.json
                                             └───────────────────────────┘
```

1. Una página monta → `useEffect` llama a `apiService.getAll()` → muestra `<Loading />` (o esqueletos) mientras espera.
2. El usuario envía el formulario → `validarDesembarque` → `apiService.add()` / `update()` → toast con `AlertMessage`.
3. Tras crear, editar o eliminar se avisa con `avisarCambioOperaciones()` para refrescar los contadores de la barra lateral.
4. Tema y usuario se leen desde `AppContext`, que los persiste con `useLocalStorage`.

## Convenciones de nombres

- Componentes y páginas: `PascalCase.jsx` (`DesembarqueForm.jsx`).
- Hooks: `useAlgo.js` (`useLocalStorage.js`).
- Funciones y variables: `camelCase` en español (`desembarqueInicial`, `cargarDesembarques`).
- Rutas: minúsculas en español (`/registro`, `/lista`).
- Claves de `localStorage`: `pescacontrol:<dato>`.
