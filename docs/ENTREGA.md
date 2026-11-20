# Guía de entrega

## Entregables

| N.º | Entregable | Dónde |
|---|---|---|
| 1 | Carpeta completa del proyecto React | Este repositorio (zip desde GitHub o sin `node_modules`) |
| 2 | `db.json` con datos de prueba | Raíz del repositorio |
| 3 | Capturas de pantalla | `docs/capturas/` (#24) |
| 4 | Documento PDF | `docs/PescaControl_PC3.pdf` (#25) |

## Capturas requeridas (#24)

Nombre: `NN-descripcion.png`, a 1280 px de ancho (y una móvil a 375 px).

1. `01-home.png` — Inicio con el panel de operaciones.
2. `02-registro-vacio.png` — Formulario vacío con foco en el primer campo.
3. `03-registro-validacion.png` — Errores de validación (campos en rojo + alerta).
4. `04-registro-exito.png` — Mensaje de confirmación tras guardar.
5. `05-lista-loading.png` — Indicador `Loading...` (simular red lenta en DevTools).
6. `06-lista.png` — Tabla de desembarques.
7. `07-eliminar-confirmacion.png` — Modal/confirmación de eliminación.
8. `08-edicion.png` — Formulario en modo edición.
9. `09-error-servidor.png` — Mensaje de error con json-server apagado.
10. `10-tema-oscuro.png` — App en tema oscuro con usuario logueado.
11. `11-movil.png` — Vista móvil con menú desplegado.
12. `12-404.png` — Página no encontrada.
13. `13-db-json.png` — `http://localhost:3001/desembarques` en el navegador.

## Cómo regenerar el PDF

El PDF se exporta desde [informe/informe.html](informe/informe.html). Para actualizarlo (por ejemplo, para completar docente e integrantes en la portada):

1. Edita `docs/informe/informe.html`.
2. Sirve la carpeta `docs/` con cualquier servidor estático (por ejemplo, `npx serve docs`) y abre `/informe/informe.html` en Chrome o Edge.
3. Imprime con `Ctrl + P` → *Guardar como PDF*, tamaño A4, márgenes predeterminados y "Gráficos de fondo" activado.
4. Guarda el resultado como `docs/PescaControl_PC3.pdf`.

## Contenido del PDF (#25)

Breve (6–10 páginas), en español:

1. **Portada:** curso, docente, integrantes, fecha.
2. **Descripción:** qué es PescaControl y para qué sirve.
3. **Estructura del proyecto:** árbol de carpetas (de `ESTRUCTURA.md`) y explicación de cada carpeta.
4. **Componentes y hooks:** dónde se usa `useState`, `useEffect`, `useRef`, `useContext` y `useLocalStorage`, con un fragmento de código corto de cada uno.
5. **Servicios REST:** tabla de `apiService.js` (método, endpoint, función), cómo se usa Axios, manejo de `Loading...` y de errores.
6. **Capturas de interfaz:** las del punto anterior con un pie de una línea.
7. **Conclusiones** y reparto de trabajo (tabla del equipo con sus issues).
