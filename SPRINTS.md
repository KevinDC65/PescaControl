# Sprints y seguimiento

Cada desarrollador marca su avance aquí **en el mismo PR** que cierra la issue (cambia `[ ]` por `[x]`).
Escribe tu usuario de GitHub en la tabla del equipo la primera vez.

**Estados:** `[ ]` pendiente · `[~]` en progreso (opcional) · `[x]` fusionado en `main`

## Equipo

| Rol | GitHub | Área | Etiqueta |
|---|---|---|---|
| Dev 1 | @_por-asignar_ | Shell, layout, calidad e integración | `rol:setup` |
| Dev 2 | @_por-asignar_ | Navegación, Inicio, paleta de comandos y capturas | `rol:ui-navegacion` |
| Dev 3 | @_por-asignar_ | Formulario de desembarque, validaciones y edición | `rol:formulario` |
| Dev 4 | @_por-asignar_ | Estado global, hooks, capas (modales, panel, toasts) y PDF | `rol:estado-hooks` |
| Dev 5 | @_por-asignar_ | Datos, servicios REST y listado de desembarques | `rol:rest-lista` |

## Calendario

| Sprint | Fechas | Objetivo |
|---|---|---|
| Sprint 0 | 19/11 | ✅ Esqueleto Vite, rutas, estructura, docs, CI, issues |
| Sprint 1 | 20/11 – 24/11 | Base visual, formulario controlado, contexto y API lista |
| Sprint 2 | 25/11 – 29/11 | Validaciones, hooks, listado con REST y panel de Inicio |
| Sprint 3 | 30/11 – 04/12 | Edición, paleta de comandos, capas, filtros y vista de tarjetas |
| Entrega | 05/12 – 06/12 | Integración, capturas y PDF |
| Sprint 4 | 07/12 – 10/12 | Migración a TypeScript estricto |
| Sprint 5 | 11/12 – 17/12 | Autenticación con roles, página principal, gestión de usuarios y entrega v2 |

---

## Sprint 1 · 20/11 – 24/11

> Meta: cada rol deja su pieza base lista para que el Sprint 2 pueda conectarse.

| Estado | Issue | Dev | Tarea |
|---|---|---|---|
| [x] | #1 | Dev 1 | Shell de la aplicación y encabezado con el título |
| [x] | #2 | Dev 1 | Tokens de diseño marino y estilos base |
| [x] | #3 | Dev 2 | Navegación lateral y barra móvil con `NavLink` |
| [x] | #4 | Dev 2 | Pie de página y estados vacíos |
| [x] | #5 | Dev 3 | Formulario controlado `DesembarqueForm` |
| [x] | #6 | Dev 4 | Contexto global `AppContext` |
| [x] | #7 | Dev 5 | `db.json` con desembarques de prueba |
| [x] | #8 | Dev 5 | `services/apiService.js` (getAll, getById, add, update, remove) |

## Sprint 2 · 25/11 – 29/11

> Meta: la app ya lista desembarques reales desde la API y el formulario valida.

| Estado | Issue | Dev | Tarea |
|---|---|---|---|
| [x] | #9 | Dev 1 | Página `NotFound` (404) |
| [x] | #10 | Dev 1 | Verificar CI y README de instalación |
| [x] | #11 | Dev 2 | Panel de operaciones en Inicio |
| [x] | #12 | Dev 3 | Validaciones: alertas y estilos condicionales |
| [x] | #13 | Dev 3 | `useRef`: foco automático en el formulario |
| [x] | #14 | Dev 4 | Custom hook `useLocalStorage` y persistencia |
| [x] | #15 | Dev 4 | `AlertMessage` y notificaciones tipo toast |
| [x] | #16 | Dev 5 | Lista: tabla, `Loading...` y botón Eliminar |

## Sprint 3 · 30/11 – 04/12

> Meta: CRUD completo (crear y editar desde el formulario) y experiencia pulida.

| Estado | Issue | Dev | Tarea |
|---|---|---|---|
| [x] | #17 | Dev 2 | Paleta de comandos, atajos y tema claro/oscuro |
| [x] | #18 | Dev 3 | Guardar y editar: `add()` y `update()` desde Registro |
| [x] | #19 | Dev 3 | Controles visuales y vista previa en vivo |
| [x] | #20 | Dev 4 | Modales, panel lateral e inicio de sesión simulado |
| [x] | #21 | Dev 5 | Vista de tarjetas, detalle y eliminación en lote |
| [x] | #22 | Dev 5 | Filtros en la URL y orden |

## Entrega · 05/12 – 06/12

| Estado | Issue | Dev | Tarea |
|---|---|---|---|
| [x] | #23 | Dev 1 | Integración final y pruebas cruzadas |
| [x] | #24 | Dev 2 | Capturas de pantalla |
| [x] | #25 | Dev 4 | Documento PDF de entrega |


## Sprint 4 · 07/12 – 10/12 (TypeScript)

> Meta: todo el proyecto en TypeScript estricto, sin cambiar el comportamiento. Un solo PR coordinado porque renombra todos los archivos.

| Estado | Issue | Dev | Tarea |
|---|---|---|---|
| [x] | #32 | Dev 1 | Configurar TypeScript estricto y `typecheck` en la CI |
| [x] | #33 | Dev 5 | Tipos del dominio, servicios y utilidades en TypeScript |
| [x] | #34 | Dev 4 | Contextos y hooks en TypeScript |
| [x] | #35 | Dev 2 | Shell, navegación y panel en TypeScript |
| [x] | #36 | Dev 3 | Formulario, registro y lista en TypeScript |

## Sprint 5 · 11/12 – 17/12 (autenticación y página principal)

> Meta: cuentas reales con roles, página principal pública y entrega actualizada.

| Estado | Issue | Dev | Tarea |
|---|---|---|---|
| [x] | #37 | Dev 5 | Servidor Express: autenticación y json-server protegido |
| [x] | #38 | Dev 5 | Pruebas automáticas de la API |
| [x] | #39 | Dev 4 | Sesión real en el frontend y rutas protegidas |
| [x] | #40 | Dev 3 | Páginas Ingresar y Crear cuenta |
| [x] | #41 | Dev 2 | Página principal pública animada |
| [x] | #42 | Dev 1 | Shell con sesión: rutas nuevas, usuario y rol |
| [x] | #43 | Dev 4 | Gestión de usuarios (Jefe) |
| [x] | #44 | Dev 3 | Permisos por rol en desembarques |
| [x] | #45 | Dev 1 | Documentación v2 e instalación con `.env` |
| [x] | #46 | Dev 2 | Capturas v2 |
| [x] | #47 | Dev 4 | Informe PDF v2 con seguridad y autenticación |

> Las piezas del Sprint 5 dependen entre sí (la sesión la usan la navegación, el acceso, la página principal y la gestión de usuarios), así que el código se integra en un solo PR y la documentación en otro.

---

## Dependencias entre issues

```text
#8 apiService ──▶ #11 Inicio, #16 Lista, #18 Guardar/editar, #21 Tarjetas y lote
#7 db.json    ──▶ #11, #16 (datos para probar)
#6 Contexto   ──▶ #14 persistencia, #17 tema, #20 login
#5 Formulario ──▶ #12 ──▶ #13 ──▶ #18 ──▶ #19
#15 Alertas   ──▶ #18, #21 (mientras tanto: <div className="alert ..."> directo)
#20 Capas     ──▶ #21 (panel de detalle y confirmación)
#1 Shell      ──▶ #3, #4 (encajan en el layout)
Todo          ──▶ #23 ──▶ #24 ──▶ #25
```

Si tu dependencia no está lista, **no te bloquees**: usa datos falsos o un mock local y deja un `// TODO #n` para conectarlo.

## Responsables por archivo

| Archivos | Dueño |
|---|---|
| `src/App.jsx`, `src/components/Header.jsx`, `Marca.jsx`, `src/pages/NotFound.jsx`, `src/index.css`, `src/styles/base.css`, `src/styles/shell.css`, `index.html`, `public/`, `.github/`, `README.md` | Dev 1 |
| `src/components/Navbar.jsx`, `Footer.jsx`, `PaletaComandos.jsx`, `AyudaAtajos.jsx`, `Tecla.jsx`, `Graficos.jsx`, `Esqueleto.jsx`, `EstadoVacio.jsx`, `src/hooks/useAtajosTeclado.js`, `src/pages/Home.jsx`, `src/styles/vistas.css`, `docs/capturas/` | Dev 2 |
| `src/components/DesembarqueForm.jsx`, `src/pages/Registro.jsx`, `src/utils/validarDesembarque.js`, `src/constants/desembarques.js`, `src/hooks/useGuardiaCambios.js` | Dev 3 |
| `src/context/*`, `src/hooks/useLocalStorage.js`, `useShell.js`, `useToast.js`, `useCapaModal.js`, `src/components/AlertMessage.jsx`, `Modal.jsx`, `Drawer.jsx`, `ConfirmModal.jsx`, `LoginModal.jsx`, `src/styles/capas.css`, `docs/informe/`, PDF | Dev 4 |
| `db.json`, `src/services/apiService.js`, `src/utils/formato.js`, `operaciones.js`, `colores.js`, `src/hooks/useConteoOperaciones.js`, `src/pages/Lista.jsx`, `src/components/TablaDesembarques.jsx`, `TarjetaDesembarque.jsx`, `DetalleDesembarque.jsx`, `InsigniaEspecie.jsx`, `Loading.jsx`, `src/styles/especies.css` | Dev 5 |
| `SPRINTS.md` | Todos (solo su propia fila) |

## Ritual mínimo

- **Daily (mensaje en el grupo, 2 min):** ¿qué hice ayer? ¿qué haré hoy? ¿algo me bloquea?
- **Cierre de sprint:** todos los PRs del sprint fusionados; lo que no llegó pasa al siguiente sprint (cambia el milestone de la issue).
- **Retro (3 líneas al final de cada sprint):**

### Retro Sprint 1
- Bien:
- Mejorar:
- Acción:

### Retro Sprint 2
- Bien:
- Mejorar:
- Acción:

### Retro Sprint 3
- Bien:
- Mejorar:
- Acción:
