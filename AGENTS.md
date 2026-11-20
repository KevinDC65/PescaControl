# AGENTS.md — Guía técnica rápida

Resumen técnico de todo el proyecto en un solo archivo. Léelo completo antes de tocar código. La misma información está ampliada en README, PROYECTO, ESTRUCTURA, CONTRIBUTING, SPRINTS y DESIGN.

## Qué es este proyecto

**PescaControl**: práctica universitaria (UTP, PC3) de una app React para el **Sistema de Gestión de Operaciones Pesqueras y Desembarque**. CRUD de desembarques contra una API falsa (json-server) y un panel de operaciones. Lo desarrollan **5 personas en paralelo**, cada una con un rol y archivos propios. Es un proyecto académico: se valora que se vean claramente los conceptos pedidos (rutas, formulario controlado, props, validaciones, `useState`, `useEffect`, `useRef`, `useContext`, custom hook de `localStorage`, servicio REST con Axios, `Loading...`, mensajes de éxito/error). **Claridad > ingenio.**

## Stack (no cambiar)

- React 19 + Vite 8 · JavaScript (**no TypeScript**) · archivos `.jsx`
- react-router-dom 7 (`BrowserRouter` en `main.jsx`, `<Routes>` en `App.jsx`)
- Bootstrap 5.3 + Bootstrap Icons (`<i className="bi bi-..." />`)
- Axios · json-server **0.17.4** (puerto 3001) · oxlint · Prettier
- Node ≥ 20.19

No instales otras librerías (ni de UI, ni de estado, ni de formularios, ni de gráficos, ni de testing) sin que la issue lo pida.

## Comandos

```bash
npm install          # dependencias
npm run dev:all      # API (3001) + frontend (5173)
npm run server       # solo json-server
npm run dev          # solo Vite
npm run lint         # oxlint — debe quedar sin errores
npm run format       # Prettier sobre src/
npm run format:check # lo que corre la CI
npm run build        # debe compilar
```

## Mapa de archivos principales

| Archivo | Rol | Notas |
|---|---|---|
| `src/main.jsx` | — | Bootstrap, `BrowserRouter`, `AppProvider`, `ToastProvider`, `ShellProvider` |
| `src/App.jsx` | Dev 1 | Shell y rutas: `/`, `/registro`, `/registro/:id`, `/lista`, `*` |
| `src/components/Header.jsx` | Dev 1 | Título de la app, migas y buscador |
| `src/components/Navbar.jsx` | Dev 2 | Barra lateral y barra móvil con `NavLink`, tema y sesión |
| `src/components/PaletaComandos.jsx` | Dev 2 | `Ctrl+K` |
| `src/pages/Home.jsx` | Dev 2 | Panel de operaciones |
| `src/components/DesembarqueForm.jsx` | Dev 3 | Form reutilizable: `desembarqueInicial`, `onSubmit`, `textoBoton`, `cargando`, `codigosExistentes`, `onCambio`, `onCancel` |
| `src/pages/Registro.jsx` | Dev 3 | Crear y editar (`/registro/:id`) |
| `src/context/AppContext.jsx` | Dev 4 | `AppProvider`, `useAppContext()` |
| `src/hooks/useLocalStorage.js` | Dev 4 | `[valor, setValor] = useLocalStorage(clave, inicial)` |
| `src/components/AlertMessage.jsx` | Dev 4 | `<AlertMessage tipo="success|danger|warning|info" mensaje onClose />` |
| `src/services/apiService.js` | Dev 5 | Único punto de acceso HTTP |
| `src/pages/Lista.jsx` | Dev 5 | Tabla/tarjetas, filtros en la URL, eliminar |
| `src/components/Loading.jsx` | Dev 5 | `<Loading texto="Loading..." />` |
| `db.json` | Dev 5 | Datos de prueba, colección `desembarques` |

Otros módulos: `src/constants/desembarques.js` (catálogos y patrones), `src/utils/validarDesembarque.js` (`validarDesembarque`, `normalizarDesembarque`), `src/utils/formato.js` (`formatearPrecio`, `formatearToneladas`, `formatearFecha`, `formatearFechaCorta`, `hoyISO`), `src/utils/operaciones.js` (`resumirOperaciones`, `filtrarDesembarques`, `ordenarDesembarques`, `valorDesembarque`, `requiereAtencion`, `avisarCambioOperaciones`) y `src/utils/colores.js` (`colorEspecie`, `colorEstado`). El shell (barra lateral, paleta, atajos, panel lateral, toasts) vive en `ShellProvider`/`ToastProvider` con los hooks `useShell`, `useToast`, `useAtajosTeclado`, `useCapaModal` y `useGuardiaCambios`. Estilos en `src/styles/*.css`, tokens en `src/index.css` (prefijo `--pc-*`), sistema visual en [DESIGN.md](DESIGN.md). Mapa completo en [ESTRUCTURA.md](ESTRUCTURA.md).

## Modelo de datos `Desembarque`

```js
{
  id: '1',                        // string, lo genera json-server (no lo envíes al crear)
  codigo: 'DSB-001',              // obligatorio, único, /^DSB-\d{3}$/
  embarcacion: 'Don Lucho II',    // obligatorio, 3–60 caracteres
  matricula: 'CE-21345-PM',       // /^[A-Z]{2}-\d{5}-[A-Z]{2}$/ (prefijo = capitanía)
  especie: 'Anchoveta',           // Anchoveta | Jurel | Caballa | Bonito | Perico | Pota | Merluza
  artePesca: 'Cerco',             // Cerco | Arrastre | Espinel | Pinta | Enmalle
  puerto: 'Chimbote',             // Paita | Chimbote | Callao | Pisco | Ilo
  destino: 'Harina y aceite',     // Consumo humano directo | Harina y aceite
  toneladas: 420.5,               // number > 0, máx. 2 decimales, hasta 1500
  precioTonelada: 1850,           // number > 0 (soles)
  fechaDesembarque: '2026-10-03', // YYYY-MM-DD, no futura
  estado: 'Descargado'            // Programado | En descarga | Descargado | Observado
}
```

Requiere atención = estado `Observado` o `En descarga`. Valor = `toneladas × precioTonelada`. Los catálogos se definen **una sola vez** en `src/constants/desembarques.js`.

## Contrato de `apiService.js`

```js
getAll()                 // GET    /desembarques      -> Promise<Desembarque[]>
getById(id)              // GET    /desembarques/:id  -> Promise<Desembarque>
add(desembarque)         // POST   /desembarques      -> Promise<Desembarque>
update(id, desembarque)  // PUT    /desembarques/:id  -> Promise<Desembarque>
remove(id)               // DELETE /desembarques/:id  -> Promise<void>
```

- Instancia `axios.create({ baseURL: API_URL })` con `API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'`.
- Devuelve `response.data`, no la respuesta completa.
- Ante error, lanza `Error` con mensaje en español (sin conexión, 404, 5xx).
- Llama a `normalizarDesembarque` antes de `add`/`update` y a `avisarCambioOperaciones()` después.
- Componentes y páginas **nunca** importan `axios` ni usan `fetch`.

## Patrones esperados (para que el docente los vea)

```jsx
// Carga con loading y error
const [desembarques, setDesembarques] = useState([])
const [cargando, setCargando] = useState(true)
const [error, setError] = useState('')
useEffect(() => {
  getAll()
    .then(setDesembarques)
    .catch((e) => setError(e.message))
    .finally(() => setCargando(false))
}, [])
```

- Formulario **controlado**: un objeto en `useState` + `onChange` genérico con `name`.
- Validación: objeto `errores`; clases `is-invalid` / `is-valid` y `<div className="invalid-feedback">`.
- `useRef` para enfocar el primer campo al montar y el primer campo inválido al enviar.
- `useContext` vía `useAppContext()`; el contexto expone `usuario`, `login`, `logout`, `tema`, `alternarTema`, `config` (`{ moneda: 'S/', unidad: 't' }`).
- Tema: atributo `data-bs-theme` en `<html>` (soporte nativo de Bootstrap 5.3).
- Claves de `localStorage`: `pescacontrol:<dato>`.

## Reglas duras

1. **Mantente en el alcance de la issue.** No refactorices ni “mejores” archivos de otros roles. Si es imprescindible, cambio mínimo y explícalo en el PR.
2. No uses CRA, TypeScript, Tailwind, Redux, React Hook Form, styled-components ni similares.
3. No edites `db.json` salvo en la issue #7 o si la issue lo pide.
4. Textos de UI, nombres de variables y commits **en español**. Componentes en `PascalCase`.
5. Solo componentes funcionales. Clases de Bootstrap antes que CSS propio.
6. No dejes `console.log`. No dejes código comentado.
7. No hagas push a `main`. Trabaja en `feature/<n>-descripcion` y abre PR con `Closes #<n>`.
8. No subas `.env`, `node_modules`, `dist` ni archivos de configuración personal de tu editor o herramientas; solo código y documentación del proyecto.
9. Si una dependencia de tu issue no está lista, usa un mock local con `// TODO #n` en vez de implementar la issue ajena.
10. **Autoría solo del equipo.** Los commits y PRs llevan como autor únicamente al integrante. Prohibido añadir trailers `Co-authored-by:`, firmas como "Generated with…" o cualquier mención a herramientas en commits, PRs, issues, comentarios del código o documentación. La CI rechaza los PRs que los contengan.

## Definition of Done

- Criterios de aceptación de la issue cumplidos.
- `npm run lint`, `npm run format:check` y `npm run build` sin errores.
- Probado con `npm run dev:all` en el navegador: sin errores en consola, se ve bien a 375 px y en escritorio, en tema claro y oscuro.
- `// TODO #n` de la issue eliminado; fila marcada `[x]` en `SPRINTS.md`.
- Commit con formato `feat(ámbito): descripción`.

## Cómo verificar rápido

1. `npm run dev:all`
2. Abrir http://localhost:3001/desembarques → JSON con desembarques.
3. Abrir http://localhost:5173 → navegar Inicio / Registrar desembarque / Desembarques y una ruta inexistente.
4. Para CRUD: registrar un desembarque, verlo en la lista, editarlo, eliminarlo; revisar que `db.json` cambie (y restaurarlo después).

## Documentos relacionados

[PROYECTO.md](PROYECTO.md) · [ESTRUCTURA.md](ESTRUCTURA.md) · [CONTRIBUTING.md](CONTRIBUTING.md) · [SPRINTS.md](SPRINTS.md) · [DESIGN.md](DESIGN.md)
