# AGENTS.md — Guía técnica rápida

Resumen técnico de todo el proyecto en un solo archivo. Léelo completo antes de tocar código. La misma información está ampliada en README, PROYECTO, ESTRUCTURA, CONTRIBUTING, SPRINTS y DESIGN.

## Qué es este proyecto

**PescaControl**: práctica universitaria (UTP, PC3) del **Sistema de Gestión de Operaciones Pesqueras y Desembarque**. Frontend React + TypeScript con página principal pública, acceso con cuentas reales y roles (**Operador**, **Jefe**), panel de operaciones y CRUD de desembarques; servidor Express que autentica, autoriza y sirve los desembarques con json-server. Lo desarrollan **5 personas en paralelo**, cada una con un rol y archivos propios. Se valora que se vean claramente los conceptos pedidos por la práctica (rutas, formulario controlado, props, validaciones, `useState`, `useEffect`, `useRef`, `useContext`, custom hook de `localStorage`, servicio REST con Axios, `Loading...`, mensajes de éxito/error). **Claridad > ingenio.**

## Stack (no cambiar)

- **Frontend:** React 19 + Vite 8 + **TypeScript estricto** (`.tsx`/`.ts`), react-router-dom 7, Bootstrap 5.3 + Bootstrap Icons, Motion (`motion/react`) solo para animación, Axios.
- **Servidor:** Express 5 + TypeScript (tsx), bcryptjs, jsonwebtoken, cookie-parser, helmet, express-rate-limit, zod, json-server **0.17.4** como router de desembarques.
- **Calidad:** oxlint, Prettier, `tsc` (`npm run typecheck`), Vitest + Supertest.
- Node ≥ 20.19.

No instales otras librerías sin que la issue lo pida.

## Comandos

```bash
npm install          # dependencias
cp .env.example .env # configuración local (cambia JWT_SECRET)
npm run seed         # usuarios de demostración (Jefe y Operador)
npm run dev:all      # API Express (3001) + frontend Vite (5173, proxy /api)
npm run server       # solo la API
npm run dev          # solo Vite
npm test             # pruebas de la API
npm run typecheck    # TypeScript
npm run lint         # oxlint — sin errores
npm run format       # Prettier sobre src/ y server/
npm run format:check # lo que corre la CI
npm run build        # compila el frontend
```

## Mapa de archivos principales

| Archivo | Rol | Notas |
|---|---|---|
| `src/main.tsx` | — | Bootstrap, `BrowserRouter`, `ToastProvider`, `AppProvider`, `ShellProvider` |
| `src/App.tsx` | Dev 1 | Rutas públicas (`/`, `/ingresar`, `/crear-cuenta`) y protegidas (`/panel`, `/registro`, `/registro/:id`, `/lista`, `/usuarios`), `*` |
| `src/components/LayoutApp.tsx` | Dev 1 | Shell del sistema (`<Outlet/>`) |
| `src/components/Header.tsx` | Dev 1 | Título de la app, migas y buscador |
| `src/components/Navbar.tsx` | Dev 2 | Navegación con `NavLink`, usuario, rol, tema y cerrar sesión |
| `src/pages/Principal.tsx` + `components/principal/` | Dev 2 | Página principal pública animada |
| `src/pages/Panel.tsx` | Dev 2 | Panel de operaciones |
| `src/components/DesembarqueForm.tsx` | Dev 3 | Form reutilizable: `desembarqueInicial`, `onSubmit`, `textoBoton`, `cargando`, `codigosExistentes`, `onCambio`, `onCancel` |
| `src/pages/Registro.tsx` | Dev 3 | Crear y editar (`/registro/:id`) |
| `src/pages/Ingresar.tsx`, `CrearCuenta.tsx` + `components/acceso/` | Dev 3 | Páginas de acceso |
| `src/context/AppContext.tsx` | Dev 4 | Sesión real (`usuario`, `cargandoSesion`, `iniciarSesion`, `registrarse`, `cerrarSesion`, `esJefe`), tema, config |
| `src/components/RutaProtegida.tsx`, `Permiso.tsx` | Dev 4 | Acceso por sesión y por rol |
| `src/pages/Usuarios.tsx` | Dev 4 | Gestión de usuarios (Jefe) |
| `src/hooks/useLocalStorage.ts` | Dev 4 | `[valor, setValor] = useLocalStorage<T>(clave, inicial)` |
| `src/components/AlertMessage.tsx` | Dev 4 | `<AlertMessage tipo="success|danger|warning|info" mensaje onClose />` |
| `src/services/*.ts` | Dev 5 | Únicos puntos de acceso HTTP |
| `src/pages/Lista.tsx` | Dev 5 | Tabla/tarjetas, filtros en la URL, eliminar (Jefe) |
| `server/**` | Dev 5 | API Express, autenticación, roles y pruebas |
| `db.json` | Dev 5 | Desembarques |

Mapa completo en [ESTRUCTURA.md](ESTRUCTURA.md). Sistema visual en [DESIGN.md](DESIGN.md) (tokens `--pc-*` en `src/index.css`, estilos en `src/styles/*.css`).

## Modelos

```ts
interface Desembarque {
  id: string                 // lo genera json-server
  codigo: string             // único, /^DSB-\d{3}$/
  embarcacion: string        // 3–60
  matricula: string          // /^[A-Z]{2}-\d{5}-[A-Z]{2}$/
  especie: Especie           // Anchoveta | Jurel | Caballa | Bonito | Perico | Pota | Merluza
  artePesca: ArtePesca       // Cerco | Arrastre | Espinel | Pinta | Enmalle
  puerto: Puerto             // Paita | Chimbote | Callao | Pisco | Ilo
  destino: Destino           // Consumo humano directo | Harina y aceite
  toneladas: number          // > 0, máx. 2 decimales, hasta 1500
  precioTonelada: number     // > 0 (soles)
  fechaDesembarque: string   // YYYY-MM-DD, no futura
  estado: EstadoDesembarque  // Programado | En descarga | Descargado | Observado
}

interface Usuario {          // nunca incluye la contraseña ni su hash
  id: string
  nombre: string
  correo: string
  rol: 'operador' | 'jefe'
  activo: boolean
  creadoEn: string
}
```

Los catálogos se definen **una sola vez** en `src/constants/desembarques.ts` y la validación en `src/utils/validarDesembarque.ts`; ambos los usa **también el servidor**.

## Contrato de la API (detalle en [PROYECTO.md](PROYECTO.md#api-rest))

- Todo bajo `/api`; errores como `{ error, campos? }` en español.
- `authService`: `registrarse`, `iniciarSesion`, `cerrarSesion`, `obtenerSesion` → `/api/auth/{registro,ingreso,salida,sesion}`.
- `apiService`: `getAll`, `getById`, `add`, `update`, `remove` → `/api/desembarques` (sesión; `remove` solo Jefe).
- `usuariosService`: `listarUsuarios`, `actualizarUsuario` → `/api/usuarios` (Jefe).
- `publicoService`: `obtenerResumenPublico` → `/api/publico/resumen` (sin sesión).
- `http.ts`: cliente axios con `withCredentials`, `ErrorApi { estado, campos }` y evento `pescacontrol:sesion-expirada` ante 401.
- Componentes y páginas **nunca** importan `axios` ni usan `fetch`.

## Seguridad (no romper)

1. El token vive en la cookie `httpOnly` `pc_sesion`; **nunca** se guarda en `localStorage` ni se lee desde JavaScript.
2. Todo permiso se comprueba en el **servidor** (`autenticar` relee al usuario en cada petición, `autorizar('jefe')`); la UI solo oculta acciones.
3. Nunca devuelvas `hash` ni contraseñas en una respuesta (usa `aPublico`).
4. Valida toda entrada en el servidor (zod o `validarDesembarque`).
5. Secretos solo en `.env` (no versionado); `.env.example` sin secretos reales.
6. TypeScript ayuda a evitar errores, pero **no** sustituye ninguna de estas reglas.

## Patrones esperados (para que el docente los vea)

```tsx
// Carga con loading y error
const [desembarques, setDesembarques] = useState<Desembarque[]>([])
const [cargando, setCargando] = useState(true)
const [error, setError] = useState('')
useEffect(() => {
  getAll()
    .then(setDesembarques)
    .catch((e: unknown) => setError(mensajeDeError(e)))
    .finally(() => setCargando(false))
}, [])
```

- Formulario **controlado**: un objeto en `useState` + `onChange` genérico con `name`.
- Validación: objeto `errores`; clases `is-invalid` / `is-valid` y `<div className="invalid-feedback">`.
- `useRef` para enfocar el primer campo al montar y el primer campo inválido al enviar.
- `useContext` vía `useAppContext()`.
- Tema: atributo `data-bs-theme` en `<html>`. Claves de `localStorage`: `pescacontrol:<dato>`.
- Animación: solo `transform`, `opacity` y `clip-path`; siempre con alternativa para `prefers-reduced-motion`.

## Reglas duras

1. **Mantente en el alcance de la issue.** No refactorices archivos de otros roles. Si es imprescindible, cambio mínimo y explícalo en el PR.
2. TypeScript estricto: sin `any` (usa `unknown` y estrechamiento). No uses CRA, Tailwind, Redux, React Hook Form ni styled-components.
3. No edites `db.json` ni `server/data/usuarios.json` salvo que la issue lo pida; si pruebas, restáuralos.
4. Textos de UI, nombres de variables y commits **en español**. Componentes en `PascalCase`.
5. Solo componentes funcionales. Clases de Bootstrap antes que CSS propio.
6. No dejes `console.log`. No dejes código comentado.
7. No hagas push a `main`. Trabaja en `feature/<n>-descripcion` y abre PR con `Closes #<n>`.
8. No subas `.env`, `node_modules`, `dist` ni archivos de configuración personal de tu editor o herramientas.
9. Si una dependencia de tu issue no está lista, usa un mock local con `// TODO #n`.
10. **Autoría solo del equipo.** Los commits y PRs llevan como autor únicamente al integrante. Prohibido añadir trailers `Co-authored-by:`, firmas como "Generated with…" o cualquier mención a herramientas en commits, PRs, issues, comentarios del código o documentación. La CI rechaza los PRs que los contengan.

## Definition of Done

- Criterios de aceptación de la issue cumplidos.
- `npm run lint`, `npm run typecheck`, `npm test`, `npm run format:check` y `npm run build` sin errores.
- Probado con `npm run dev:all` en el navegador como Operador y como Jefe: sin errores en consola, bien a 375 px y en escritorio, en tema claro y oscuro.
- `// TODO #n` eliminado; fila marcada `[x]` en `SPRINTS.md`.
- Commit con formato `feat(ámbito): descripción`.

## Cómo verificar rápido

1. `cp .env.example .env`, `npm run seed`, `npm run dev:all`.
2. http://localhost:5173 → página principal; "Ingresar" con un usuario de demostración.
3. Como Operador: registrar y editar; no aparece Eliminar ni Usuarios. Como Jefe: eliminar y gestionar usuarios.
4. `curl http://localhost:3001/api/desembarques` sin sesión → 401.
5. Restaura `db.json` y `server/data/usuarios.json` si los modificaste.

## Documentos relacionados

[PROYECTO.md](PROYECTO.md) · [ESTRUCTURA.md](ESTRUCTURA.md) · [CONTRIBUTING.md](CONTRIBUTING.md) · [SPRINTS.md](SPRINTS.md) · [DESIGN.md](DESIGN.md)
