# Información del proyecto

## Objetivo

Desarrollar una aplicación web con React, Bootstrap y servicios REST que permita **gestionar las operaciones pesqueras y el desembarque** en los puertos del litoral peruano: registrar cada desembarque (embarcación, especie, captura, puerto y estado de la descarga), consultarlos, editarlos y eliminarlos, aplicando rutas, formularios controlados, validaciones, hooks de React, contexto global y persistencia en `localStorage`.

## Alcance

**Incluye**
- 3 páginas principales: **Inicio** (panel de operaciones), **Registro** y **Lista** de desembarques (+ página 404).
- CRUD completo de desembarques contra json-server (`db.json`).
- Indicadores de operación: toneladas desembarcadas, valor desembarcado, desembarques que requieren atención, toneladas por especie y por puerto.
- Contexto global: usuario autenticado (simulado), tema claro/oscuro y configuración.
- Custom hook `useLocalStorage` para persistir preferencias y borradores.
- Indicador `Loading...` y mensajes de confirmación/error.

**No incluye**
- Backend real, base de datos ni autenticación real (el login es simulado).
- Registro de tripulación, zarpes, cuotas de pesca ni facturación.
- TypeScript, librerías de UI distintas de Bootstrap, ni tests automatizados obligatorios.

## Modelo de datos: `Desembarque`

| Campo | Tipo | Regla |
|---|---|---|
| `id` | string | Lo genera json-server |
| `codigo` | string | Obligatorio, único, formato `DSB-000` (ej. `DSB-014`) |
| `embarcacion` | string | Nombre de la embarcación, 3–60 caracteres |
| `matricula` | string | Formato `AA-00000-AA` (ej. `CO-21345-PM`); el prefijo es la capitanía |
| `especie` | string | `Anchoveta`, `Jurel`, `Caballa`, `Bonito`, `Perico`, `Pota`, `Merluza` |
| `artePesca` | string | `Cerco`, `Arrastre`, `Espinel`, `Pinta`, `Enmalle` |
| `puerto` | string | `Paita`, `Chimbote`, `Callao`, `Pisco`, `Ilo` |
| `destino` | string | `Consumo humano directo`, `Harina y aceite` |
| `toneladas` | number | Mayor que 0, máximo 2 decimales y hasta 1 500 t |
| `precioTonelada` | number | Precio en soles por tonelada, mayor que 0 |
| `fechaDesembarque` | string | `YYYY-MM-DD`, no puede ser futura |
| `estado` | string | `Programado`, `En descarga`, `Descargado`, `Observado` |

Ejemplo:

```json
{
  "id": "1",
  "codigo": "DSB-001",
  "embarcacion": "Don Lucho II",
  "matricula": "CE-21345-PM",
  "especie": "Anchoveta",
  "artePesca": "Cerco",
  "puerto": "Chimbote",
  "destino": "Harina y aceite",
  "toneladas": 420.5,
  "precioTonelada": 1850,
  "fechaDesembarque": "2026-10-03",
  "estado": "Descargado"
}
```

**Requiere atención** = estado `Observado` o `En descarga` (lo usa el panel de Inicio).
**Valor del desembarque** = `toneladas × precioTonelada`.

Prefijos de capitanía por puerto (referenciales): Paita `PT`, Chimbote `CE`, Callao `CO`, Pisco `PS`, Ilo `IO`.

## API REST (json-server)

Base: `http://localhost:3001` (configurable con `VITE_API_URL`).

| Método | Endpoint | Función en `apiService.js` | Descripción |
|---|---|---|---|
| GET | `/desembarques` | `getAll()` | Obtener todos los desembarques |
| GET | `/desembarques/:id` | `getById(id)` | Obtener un desembarque (modo edición) |
| POST | `/desembarques` | `add(desembarque)` | Registrar un desembarque |
| PUT | `/desembarques/:id` | `update(id, desembarque)` | Actualizar un desembarque |
| DELETE | `/desembarques/:id` | `remove(id)` | Eliminar un desembarque |

## Trazabilidad: requisitos de la práctica → issues

| Requisito de la práctica | Issue |
|---|---|
| Crear proyecto React, instalar Bootstrap | Sprint 0 · #2 |
| `App.js` con encabezado | #1 |
| Componentes de la aplicación | #1, #3, #4, #19, #20 |
| `react-router-dom` con Home, Registro, Lista | Sprint 0 · #9 |
| `Navbar.js` con `Link` | #3 |
| Formulario controlado en `Registro.js` | #5 |
| Comunicación con `props` | #5, #15, #19 |
| Validaciones: alertas y estilos condicionales | #12 |
| `useState` / `useEffect` | #5, #11, #16 |
| `useRef` | #13 |
| `useContext` (usuario, configuración, tema) | #6, #17 |
| Custom Hook `localStorage` | #14 |
| `services/apiService.js` con getAll/add/remove/update | #8 |
| Axios para listar y agregar | #16, #18 |
| Botón Eliminar con `DELETE` | #16, #21 |
| Indicador `Loading...` | #16, #11 |
| Mensajes de confirmación/error | #15, #16, #18 |
| `db.json` con datos de prueba | #7 |
| Capturas de pantalla | #24 |
| Documento PDF | #25 |
| Carpeta completa del proyecto | #23 |

## Entregables

1. Repositorio/carpeta completa del proyecto funcionando.
2. `db.json` con datos de prueba.
3. Capturas en `docs/capturas/`.
4. PDF breve (estructura, servicios REST, capturas) en `docs/`.
