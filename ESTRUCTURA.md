# Estructura del proyecto

```text
PescaControl/
├── .github/                   Plantillas de issues y PR; CI (autoría, lint, formato, typecheck, pruebas, build)
├── docs/
│   ├── capturas/              Capturas de pantalla para la entrega
│   ├── informe/informe.html   Fuente editable del informe
│   ├── PescaControl_PC3.pdf   Informe de entrega
│   └── ENTREGA.md             Guía de la entrega
├── public/favicon.svg         Boya sobre olas
├── server/                    API: Express + TypeScript (#37, #38)
│   ├── index.ts               Arranque: valida la configuración y escucha en API_PORT
│   ├── app.ts                 crearApp(): middlewares, rutas y manejo de errores (sin listen, para pruebas)
│   ├── config.ts              Variables de entorno validadas con zod
│   ├── sesion.ts              JWT y cookie httpOnly pc_sesion
│   ├── validacion.ts          Validación de cuerpos con zod → 400 { error, campos }
│   ├── errores.ts             ErrorHttp y mensajes comunes
│   ├── seed.ts                Crea los usuarios de demostración (npm run seed)
│   ├── almacen/usuarios.ts    Lectura/escritura atómica de usuarios; nunca expone el hash
│   ├── middleware/            autenticar (relee el usuario en cada petición), autorizar(rol), errores
│   ├── rutas/                 auth, usuarios, publico y desembarques (json-server protegido)
│   ├── tipos/                 Tipos auxiliares (res.locals, json-server)
│   ├── data/usuarios.json     Usuarios (separado de db.json, nunca expuesto por json-server)
│   └── tests/                 Vitest + Supertest: 66 pruebas de la API
├── src/
│   ├── main.tsx               Punto de entrada: Bootstrap, Router y proveedores
│   ├── App.tsx                Rutas públicas y protegidas (#42)
│   ├── index.css              Tokens de diseño claro/oscuro
│   ├── styles/                base, shell, capas, especies, vistas, escena, acceso y publico
│   ├── pages/
│   │   ├── Principal.tsx      "/"               Página principal pública animada (#41)
│   │   ├── Ingresar.tsx       "/ingresar"       Inicio de sesión (#40)
│   │   ├── CrearCuenta.tsx    "/crear-cuenta"   Registro de cuenta (#40)
│   │   ├── Panel.tsx          "/panel"          Panel de operaciones (#11)
│   │   ├── Registro.tsx       "/registro" y "/registro/:id" (#5, #18)
│   │   ├── Lista.tsx          "/lista"          Tabla/tarjetas, filtros en la URL (#16, #21, #22)
│   │   ├── Usuarios.tsx       "/usuarios"       Gestión de usuarios, solo Jefe (#43)
│   │   └── NotFound.tsx       "*"               (#9)
│   ├── components/
│   │   ├── LayoutApp.tsx      Shell del sistema: navegación, cabecera, contenido y pie (#42)
│   │   ├── RutaProtegida.tsx  Exige sesión (y rol); SoloInvitado para las páginas de acceso (#39)
│   │   ├── Permiso.tsx        Muestra su contenido solo al rol indicado (#44)
│   │   ├── InsigniaRol.tsx    Insignia Operador/Jefe (#42)
│   │   ├── Header.tsx         Título de la app, migas y buscador Ctrl+K (#1)
│   │   ├── Navbar.tsx         Barra lateral y barra móvil con NavLink, usuario y rol (#3, #42)
│   │   ├── DesembarqueForm.tsx Formulario controlado reutilizable vía props (#5, #12, #13, #19)
│   │   ├── TablaDesembarques.tsx, TarjetaDesembarque.tsx, DetalleDesembarque.tsx
│   │   ├── AlertMessage.tsx, Loading.tsx, Modal.tsx, ConfirmModal.tsx, Drawer.tsx
│   │   ├── PaletaComandos.tsx, AyudaAtajos.tsx, Tecla.tsx, Graficos.tsx
│   │   ├── Marca.tsx, Footer.tsx, EstadoVacio.tsx, Esqueleto.tsx, InsigniaEspecie.tsx, InsigniaEstado.tsx
│   │   ├── acceso/            LayoutAcceso, PanelMarino, CampoContrasena, MedidorFortaleza (#40)
│   │   ├── escena/Escena.tsx  Ola, Boya, Embarcacion, CartaIsobatas (#40, #41)
│   │   └── principal/         Secciones de la página principal: BarraPublica, Portada, Problema,
│   │                          ComoFunciona, Modulos, CifrasEnVivo, Contador, CartaLitoral, Roles, Cierre (#41)
│   ├── context/
│   │   ├── AppContext.tsx     Sesión real, tema y configuración (#39)
│   │   ├── ShellProvider.tsx  Paneles abiertos y navegación protegida
│   │   ├── ToastProvider.tsx  Notificaciones tipo toast
│   │   └── contextos.ts       Definición de los contextos
│   ├── hooks/                 useLocalStorage (#14), useCerrarSesion, useShell, useToast, useCapaModal,
│   │                          useAtajosTeclado, useConteoOperaciones, useGuardiaCambios
│   ├── services/
│   │   ├── http.ts            Cliente axios común (cookie, ErrorApi, aviso de sesión expirada)
│   │   ├── apiService.ts      Desembarques (#8)
│   │   ├── authService.ts     Registro, ingreso, salida y sesión (#39)
│   │   ├── usuariosService.ts Gestión de usuarios (#43)
│   │   └── publicoService.ts  Cifras de la página principal (#41)
│   ├── types/                 Tipos del dominio, usuario, API, contextos y operaciones (#33)
│   ├── constants/desembarques.ts  Catálogos y patrones (también los usa el servidor)
│   └── utils/                 validarDesembarque (compartida con el servidor), validarCuenta, formato,
│                              operaciones, colores, sesion, errores y erroresAcceso
├── db.json                    Desembarques (servidos por json-server detrás del servidor)
├── .env.example               Variables de entorno (copiar a .env)
├── tsconfig*.json             TypeScript: app, node (vite.config) y server
├── vite.config.ts             Proxy /api → servidor
├── vitest.config.ts           Pruebas de la API
└── *.md                       Documentación
```

> La práctica nombra los archivos como `App.js`, `Navbar.js`, etc. El proyecto usa **TypeScript**: los componentes con JSX son `.tsx` y el resto `.ts`; el propósito de cada archivo es el mismo.

## Responsabilidad de cada carpeta

| Carpeta | Puede | No debe |
|---|---|---|
| `server/` | Autenticar, autorizar por rol, validar y guardar datos | Confiar en datos o roles enviados por el navegador |
| `src/components/` | Recibir datos por `props`, emitir eventos (`onSubmit`, `onConfirm`, `onClose`) | Llamar a la API directamente |
| `src/pages/` | Usar hooks, llamar a los servicios, leer el contexto, componer componentes | Contener estilos complejos repetidos |
| `src/context/` | Guardar estado global (sesión, tema) | Guardar el token (vive en una cookie httpOnly) |
| `src/hooks/` | Lógica reutilizable con hooks (`useX`) | Renderizar JSX |
| `src/services/` | Peticiones HTTP con Axios y traducción de errores | Usar hooks o tocar el DOM |
| `src/utils/`, `src/constants/` | Funciones puras y catálogos (compartidos con el servidor) | Depender de React |

## Flujo de datos y sesión

```text
 Navegador (React)                                  Servidor (Express :3001)
 ┌───────────────────────────┐   /api (proxy Vite)   ┌───────────────────────────────────┐
 │ AppContext  ──obtenerSesion──────────────────────▶ │ /auth  bcrypt + JWT en cookie     │
 │ páginas ── servicios (axios, withCredentials) ───▶ │ autenticar → autorizar(rol)       │
 │                                                    │ /desembarques → json-server ◀ db.json
 │ ◀── 401 → evento "sesión expirada" → /ingresar ── │ /usuarios (Jefe) ◀ usuarios.json  │
 └───────────────────────────┘                       └───────────────────────────────────┘
```

1. Al abrir la app, `AppContext` pide `/api/auth/sesion`. Mientras tanto, `RutaProtegida` muestra `Loading...`.
2. Al ingresar, el servidor verifica la contraseña con bcrypt y responde con una cookie `httpOnly`. El navegador la envía sola en cada petición y el código nunca la lee.
3. En cada petición, el servidor relee al usuario y su rol. Si la acción no está permitida responde 403, y la interfaz ya oculta esas acciones.
4. Si una petición responde 401, el cliente avisa y la app vuelve a `/ingresar?volver=…`.

## Convenciones de nombres

- Componentes y páginas: `PascalCase.tsx` (`DesembarqueForm.tsx`).
- Hooks: `useAlgo.ts` (`useLocalStorage.ts`).
- Funciones y variables: `camelCase` en español (`desembarqueInicial`, `iniciarSesion`).
- Rutas: minúsculas en español (`/registro`, `/crear-cuenta`).
- Claves de `localStorage`: `pescacontrol:<dato>` (nunca datos de sesión).
