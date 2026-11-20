# Guía de entrega

## Entregables

| N.º | Entregable | Dónde |
|---|---|---|
| 1 | Carpeta completa del proyecto React | Este repositorio (zip desde GitHub o sin `node_modules`) |
| 2 | `db.json` con datos de prueba | Raíz del repositorio |
| 3 | Capturas de pantalla | `docs/capturas/` (#24) |
| 4 | Documento PDF | `docs/PescaControl_PC3.pdf` (#25) |

## Capturas requeridas (#46)

Nombre: `NN-descripcion.png`, a 1280 px de ancho (las móviles a 375 px).

1. `01-principal.png` — Página principal: portada con el océano y los botones de acceso.
2. `02-principal-secciones.png` — Página principal: "Cómo funciona" o "Módulos".
3. `03-principal-cifras.png` — Página principal: cifras en vivo o carta del litoral.
4. `04-crear-cuenta.png` — Crear cuenta con validación y medidor de fortaleza.
5. `05-ingresar-error.png` — Ingresar con el mensaje "Correo o contraseña incorrectos.".
6. `06-panel.png` — Panel de operaciones con sesión de Jefe.
7. `07-registro-validacion.png` — Errores de validación del formulario.
8. `08-registro-exito.png` — Confirmación tras registrar un desembarque.
9. `09-lista-loading.png` — Indicador `Loading...`.
10. `10-lista.png` — Tabla de desembarques (Jefe).
11. `11-eliminar-confirmacion.png` — Confirmación de eliminación (Jefe).
12. `12-edicion.png` — Formulario en modo edición.
13. `13-operador.png` — Lista vista por un Operador (sin Eliminar ni Usuarios).
14. `14-usuarios.png` — Gestión de usuarios (Jefe).
15. `15-error-servidor.png` — Mensaje de error con la API detenida.
16. `16-tema-oscuro.png` — Sistema en tema oscuro.
17. `17-movil.png` — Página principal o sistema en móvil.
18. `18-404.png` — Página no encontrada.
19. `19-api-401.png` — `http://localhost:3001/api/desembarques` sin sesión: respuesta 401.

## Cómo regenerar el PDF

El PDF se exporta desde [informe/informe.html](informe/informe.html). Para actualizarlo (por ejemplo, para completar docente e integrantes en la portada):

1. Edita `docs/informe/informe.html`.
2. Sirve la carpeta `docs/` con cualquier servidor estático (por ejemplo, `npx serve docs`) y abre `/informe/informe.html` en Chrome o Edge.
3. Imprime con `Ctrl + P` → *Guardar como PDF*, tamaño A4, márgenes predeterminados y "Gráficos de fondo" activado.
4. Guarda el resultado como `docs/PescaControl_PC3.pdf`.

## Contenido del PDF (#25, #47)

Breve (8–12 páginas), en español:

1. **Portada:** curso, docente, integrantes, fecha.
2. **Descripción:** qué es PescaControl y para qué sirve.
3. **Seguridad y autenticación:** cuentas, roles, contraseñas cifradas, sesión en cookie, límite de intentos; y por qué TypeScript no es una medida de seguridad por sí solo.
4. **Estructura del proyecto:** árbol de carpetas (de `ESTRUCTURA.md`) y explicación de cada carpeta.
5. **Componentes y hooks:** dónde se usa `useState`, `useEffect`, `useRef`, `useContext` y `useLocalStorage`, con un fragmento de código corto de cada uno.
6. **Servicios REST:** tablas de los servicios (`apiService.ts`, `authService.ts`, `usuariosService.ts`, `publicoService.ts`), cómo se usa Axios, manejo de `Loading...` y de errores.
7. **Capturas de interfaz:** las del punto anterior con un pie de una línea.
8. **Conclusiones** y reparto de trabajo (tabla del equipo con sus issues).
