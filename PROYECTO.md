# Información del proyecto

## Objetivo

Desarrollar una aplicación web con React, Bootstrap y servicios REST que permita **gestionar las operaciones pesqueras y el desembarque** en los puertos del litoral peruano: registrar cada desembarque (embarcación, especie, captura, puerto y estado de la descarga), consultarlos, editarlos y eliminarlos, aplicando rutas, formularios controlados, validaciones, hooks de React, contexto global y persistencia en `localStorage`.

## Alcance

**Incluye**
- **Página principal pública** (Home) que explica el sistema, y páginas para **ingresar** y **crear cuenta**.
- Páginas del sistema (con sesión): **Panel** de operaciones, **Registro** y **Lista** de desembarques, **Usuarios** (solo Jefe) y página 404.
- CRUD completo de desembarques contra json-server (`db.json`), servido detrás de un servidor Express con autenticación.
- **Autenticación real**: contraseñas cifradas con bcrypt, sesión con JWT en una cookie `httpOnly`, límite de intentos y **roles** (Operador y Jefe).
- Indicadores de operación: toneladas desembarcadas, valor desembarcado, desembarques que requieren atención, toneladas por especie y por puerto.
- Contexto global: usuario autenticado, tema claro/oscuro y configuración.
- Custom hook `useLocalStorage` para persistir preferencias y borradores.
- Indicador `Loading...` y mensajes de confirmación/error.
- Código en **TypeScript** estricto y pruebas automáticas de la API (Vitest + Supertest).

**No incluye**
- Base de datos relacional ni despliegue en producción (los datos viven en archivos JSON).
- Recuperación de contraseña por correo ni verificación de correo.
- Registro de tripulación, zarpes, cuotas de pesca ni facturación.

> **Sobre TypeScript y seguridad.** TypeScript agrega **tipado estático**: detecta errores antes de ejecutar y hace el código más fácil de mantener, pero en el navegador todo termina siendo JavaScript. La **seguridad** del sistema la da el servidor: contraseñas cifradas, sesión en cookie `httpOnly`, verificación del rol en cada petición, validación de los datos y límite de intentos.

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

## Modelo de datos: `Usuario`

Se guarda en `server/data/usuarios.json` (separado de `db.json`, nunca expuesto por json-server). La API nunca devuelve la contraseña ni su hash.

| Campo | Tipo | Regla |
|---|---|---|
| `id` | string | UUID generado por el servidor |
| `nombre` | string | 2–60 caracteres |
| `correo` | string | Correo válido y único (se guarda en minúsculas) |
| `rol` | string | `operador` o `jefe` |
| `activo` | boolean | Una cuenta desactivada no puede ingresar |
| `creadoEn` | string | Fecha y hora ISO 8601 |
| `hash` | string | Solo en el servidor: contraseña cifrada con bcrypt (coste 12) |

Contraseña: 8–72 caracteres con al menos una letra y un número.

### Roles

| Acción | Operador | Jefe |
|---|---|---|
| Ver panel y desembarques | ✅ | ✅ |
| Registrar y editar desembarques | ✅ | ✅ |
| Eliminar desembarques (individual y en lote) | — | ✅ |
| Gestionar usuarios (cambiar rol, activar/desactivar) | — | ✅ |

- La **primera cuenta** creada en el sistema es Jefe; las siguientes son Operador hasta que un Jefe las promueva.
- Siempre debe quedar al menos un Jefe activo, y un Jefe no puede desactivarse ni quitarse el rol a sí mismo.
- El servidor vuelve a leer el rol del usuario en cada petición: un cambio de rol o una desactivación se aplica al instante.

## API REST

El navegador habla solo con `/api` (en desarrollo, Vite lo redirige al servidor Express en el puerto 3001). Los errores siempre llegan como `{ "error": "mensaje", "campos": { ... } }`.

### Autenticación (`src/services/authService.ts`)

| Método | Endpoint | Función | Respuestas |
|---|---|---|---|
| POST | `/api/auth/registro` | `registrarse(datos)` | 201 + cookie · 400 datos inválidos · 409 correo repetido · 429 demasiados intentos |
| POST | `/api/auth/ingreso` | `iniciarSesion(credenciales)` | 200 + cookie · 401 credenciales incorrectas · 403 cuenta desactivada · 429 |
| POST | `/api/auth/salida` | `cerrarSesion()` | 204, borra la cookie |
| GET | `/api/auth/sesion` | `obtenerSesion()` | 200 con el usuario · 401 sin sesión |

### Desembarques (`src/services/apiService.ts`, json-server detrás de la autenticación)

| Método | Endpoint | Función | Rol |
|---|---|---|---|
| GET | `/api/desembarques` | `getAll()` | Operador y Jefe |
| GET | `/api/desembarques/:id` | `getById(id)` | Operador y Jefe |
| POST | `/api/desembarques` | `add(desembarque)` | Operador y Jefe |
| PUT | `/api/desembarques/:id` | `update(id, desembarque)` | Operador y Jefe |
| DELETE | `/api/desembarques/:id` | `remove(id)` | Solo Jefe (403 para Operador) |

El servidor valida cada POST/PUT con las mismas reglas del formulario (`src/utils/validarDesembarque.ts`) y responde 400 con los errores por campo.

### Usuarios (`src/services/usuariosService.ts`, solo Jefe)

| Método | Endpoint | Función |
|---|---|---|
| GET | `/api/usuarios` | `listarUsuarios()` |
| PATCH | `/api/usuarios/:id` | `actualizarUsuario(id, { rol?, activo? })` |

### Público (`src/services/publicoService.ts`, sin sesión)

| Método | Endpoint | Función |
|---|---|---|
| GET | `/api/publico/resumen` | `obtenerResumenPublico()`: solo cifras agregadas para la página principal |

### Seguridad

- **Contraseñas:** bcrypt con coste 12. El ingreso responde lo mismo y tarda lo mismo si el correo no existe.
- **Sesión:** JWT HS256 de 8 h en la cookie `pc_sesion`, con `httpOnly` (el JavaScript del navegador no la puede leer), `SameSite=Strict` y `Secure` en HTTPS.
- **Límite de intentos:** 5 ingresos fallidos y 5 registros por IP cada 15 minutos.
- **Entrada:** validación con zod, cuerpo de 20 kB como máximo y cabeceras de seguridad con helmet.
- **Errores:** nunca muestran detalles internos del servidor.
- **Secretos:** `JWT_SECRET` vive en `.env`, que no se versiona.

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
