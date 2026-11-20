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

---

## Sprint 1 · 20/11 – 24/11

> Meta: cada rol deja su pieza base lista para que el Sprint 2 pueda conectarse.

| Estado | Issue | Dev | Tarea |
|---|---|---|---|
| [ ] | #1 | Dev 1 | Shell de la aplicación y encabezado con el título |
| [ ] | #2 | Dev 1 | Tokens de diseño marino y estilos base |
| [ ] | #3 | Dev 2 | Navegación lateral y barra móvil con `NavLink` |
| [ ] | #4 | Dev 2 | Pie de página y estados vacíos |
| [ ] | #5 | Dev 3 | Formulario controlado `DesembarqueForm` |
| [ ] | #6 | Dev 4 | Contexto global `AppContext` |
| [ ] | #7 | Dev 5 | `db.json` con desembarques de prueba |
| [ ] | #8 | Dev 5 | `services/apiService.js` (getAll, getById, add, update, remove) |

## Sprint 2 · 25/11 – 29/11

> Meta: la app ya lista desembarques reales desde la API y el formulario valida.

| Estado | Issue | Dev | Tarea |
|---|---|---|---|
| [ ] | #9 | Dev 1 | Página `NotFound` (404) |
| [ ] | #10 | Dev 1 | Verificar CI y README de instalación |
| [ ] | #11 | Dev 2 | Panel de operaciones en Inicio |
| [ ] | #12 | Dev 3 | Validaciones: alertas y estilos condicionales |
| [ ] | #13 | Dev 3 | `useRef`: foco automático en el formulario |
| [ ] | #14 | Dev 4 | Custom hook `useLocalStorage` y persistencia |
| [ ] | #15 | Dev 4 | `AlertMessage` y notificaciones tipo toast |
| [ ] | #16 | Dev 5 | Lista: tabla, `Loading...` y botón Eliminar |

## Sprint 3 · 30/11 – 04/12

> Meta: CRUD completo (crear y editar desde el formulario) y experiencia pulida.

| Estado | Issue | Dev | Tarea |
|---|---|---|---|
| [ ] | #17 | Dev 2 | Paleta de comandos, atajos y tema claro/oscuro |
| [ ] | #18 | Dev 3 | Guardar y editar: `add()` y `update()` desde Registro |
| [ ] | #19 | Dev 3 | Controles visuales y vista previa en vivo |
| [ ] | #20 | Dev 4 | Modales, panel lateral e inicio de sesión simulado |
| [ ] | #21 | Dev 5 | Vista de tarjetas, detalle y eliminación en lote |
| [ ] | #22 | Dev 5 | Filtros en la URL y orden |

## Entrega · 05/12 – 06/12

| Estado | Issue | Dev | Tarea |
|---|---|---|---|
| [ ] | #23 | Dev 1 | Integración final y pruebas cruzadas |
| [ ] | #24 | Dev 2 | Capturas de pantalla |
| [ ] | #25 | Dev 4 | Documento PDF de entrega |

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
