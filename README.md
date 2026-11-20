# PescaControl

**Sistema de Gestión de Operaciones Pesqueras y Desembarque**, desarrollado en **React + TypeScript** como práctica integradora (PC3) del curso en la Universidad Tecnológica del Perú (UTP).

Permite registrar cada desembarque en los puertos del litoral peruano (embarcación, matrícula, especie, arte de pesca, toneladas, precio, puerto, destino y estado de la descarga), consultarlos, editarlos y eliminarlos, y seguir la operación desde un panel con indicadores. Incluye una página principal pública, cuentas de usuario con contraseña y roles (**Operador** y **Jefe**), y un servidor **Express** que protege la API REST de **json-server**.

![CI](https://github.com/KevinDC65/PescaControl/actions/workflows/ci.yml/badge.svg)

## Stack

| Tecnología | Uso |
|---|---|
| React 19 + Vite + **TypeScript** (estricto) | Interfaz y entorno de desarrollo |
| react-router-dom 7 | Rutas públicas y protegidas |
| Bootstrap 5 + Bootstrap Icons | Estilos y componentes visuales |
| Motion (para React) | Animaciones de la página principal y del acceso |
| Axios | Cliente HTTP en `src/services/` |
| Express 5 | Servidor de la API: autenticación, roles y validación |
| bcryptjs + jsonwebtoken | Contraseñas cifradas y sesión en cookie `httpOnly` |
| helmet + express-rate-limit + zod | Cabeceras de seguridad, límite de intentos y validación de entrada |
| json-server 0.17 | API REST de desembarques a partir de `db.json`, detrás del servidor |
| Vitest + Supertest | Pruebas automáticas de la API |
| oxlint + Prettier | Calidad y formato de código |

> **¿Por qué Vite y no `create-react-app`?** La práctica menciona CRA, pero CRA está deprecado oficialmente por el equipo de React y falla con versiones actuales de Node. Vite cumple el mismo objetivo y es la herramienta recomendada hoy. La estructura de `src/` sigue la propuesta de la práctica.

> **¿Por qué TypeScript?** Aporta **tipado estático**: detecta errores antes de ejecutar y hace el código más fácil de mantener. No es una medida de seguridad por sí sola (en el navegador todo es JavaScript); la seguridad la da el servidor. Detalle en [PROYECTO.md](PROYECTO.md#seguridad).

## Requisitos

- Node.js **20.19 o superior** (`node -v`)
- Git

## Instalación

```bash
git clone https://github.com/KevinDC65/PescaControl.git
cd PescaControl
npm install
cp .env.example .env
npm run seed
```

- Edita `.env` y cambia `JWT_SECRET` por una cadena larga y aleatoria (mínimo 32 caracteres). Sin `.env` el servidor arranca igual en desarrollo con un secreto temporal (las sesiones se pierden al reiniciarlo).
- `npm run seed` crea dos **usuarios de demostración** con los correos y contraseñas de `DEMO_*` en `.env` (por defecto los de `.env.example`): un **Jefe** y un **Operador**. Son solo para pruebas locales.
- Si no ejecutas el seed, la **primera cuenta** que crees en `/crear-cuenta` será Jefe.

## Ejecutar

```bash
npm run dev:all
```

Levanta a la vez:
- Aplicación: http://localhost:5173 (página principal pública; el sistema está en `/panel` tras ingresar)
- API (Express): http://localhost:3001/api (Vite redirige `/api` a este puerto)

| Script | Qué hace |
|---|---|
| `npm run dev` | Solo el frontend |
| `npm run server` | Solo la API (Express + json-server, puerto `API_PORT`, 3001 por defecto) |
| `npm run dev:all` | Frontend + API |
| `npm run seed` | Crea los usuarios de demostración (no duplica si ya existen) |
| `npm test` | Pruebas automáticas de la API (Vitest + Supertest) |
| `npm run typecheck` | Verificación de tipos de TypeScript |
| `npm run lint` | Revisa el código con oxlint |
| `npm run format` | Formatea `src/` y `server/` con Prettier |
| `npm run build` | Compila el frontend para producción en `dist/` |

## Funcionalidades

- **Página principal pública** (`/`): explica el sistema con animaciones (océano, embarcación, pasos, módulos, cifras en vivo, carta del litoral y roles) y lleva a crear cuenta o ingresar.
- **Acceso** (`/ingresar`, `/crear-cuenta`): formularios con validación en vivo, medidor de fortaleza de contraseña, mostrar/ocultar contraseña y mensajes claros (credenciales incorrectas, cuenta desactivada, demasiados intentos).
- **Roles:** el **Operador** registra y edita desembarques; el **Jefe** además elimina y gestiona usuarios en `/usuarios` (cambiar rol, activar/desactivar). El servidor aplica los permisos y la interfaz oculta lo que el rol no puede hacer.
- **Shell del sistema:** barra lateral contraíble con contadores, usuario y rol; barra inferior en móvil; paleta de comandos (`Ctrl+K`); atajos de teclado (`?` muestra la ayuda) y notificaciones tipo toast.
- **Panel de operaciones** (`/panel`): toneladas desembarcadas, valor desembarcado, desembarques y los que requieren atención; toneladas por especie y por puerto; listas de "Requieren atención" y "Últimos desembarques".
- **Registro y edición** (`/registro`, `/registro/:id`): formulario controlado en secciones con validación en vivo (también validado por el servidor), valor estimado, vista previa, guardado con `Ctrl+S`, borrador en `localStorage` y aviso al salir con cambios sin guardar.
- **Desembarques** (`/lista`): tabla o tarjetas; búsqueda y filtros guardados en la URL; detalle en panel lateral; eliminación individual y en lote (Jefe).
- **Estados:** `Loading...`, esqueletos, mensajes de éxito y error, página 404, tema claro/oscuro y diseño adaptado a móvil.

| Atajo | Acción |
|---|---|
| `Ctrl+K` | Paleta de comandos y búsqueda de desembarques |
| `N` | Registrar desembarque |
| `/` | Buscar en la lista |
| `G` y luego `I` / `L` / `R` / `U` | Ir al Panel / Lista / Registro / Usuarios (Jefe) |
| `Ctrl+S` | Guardar el formulario |
| `?` | Ayuda de atajos |

![Inicio](docs/capturas/01-home.png)

## Problemas comunes

| Síntoma | Solución |
|---|---|
| "No se pudo conectar con el servidor" | La API no está levantada: usa `npm run dev:all` o `npm run server` |
| `EADDRINUSE` en el puerto 3001 | Cierra el otro servidor o cambia `API_PORT` en `.env` y el destino del proxy en `vite.config.ts` |
| "JWT_SECRET: debe tener al menos 32 caracteres" | Usa en `.env` un secreto más largo |
| Al recargar se pierde la sesión | Sin `.env` el secreto es temporal: crea `.env` a partir de `.env.example` |
| "Demasiados intentos" | El límite es de 5 intentos cada 15 minutos por equipo; espera o reinicia el servidor en desarrollo |
| Vite usa otro puerto (5174…) | El 5173 está ocupado; la app funciona igual en el puerto que indique la consola |
| Error de sintaxis al ejecutar Vite | Actualiza Node a 20.19 o superior |
| `db.json` aparece modificado tras probar | json-server reescribe el archivo; revisa con `git diff db.json` y restaura los 16 desembarques originales con `git checkout -- db.json` (reinicia el servidor después) |
| Quiero empezar sin usuarios | Deja `server/data/usuarios.json` como `{ "usuarios": [] }` y reinicia el servidor |

## Entrega

- Informe: [docs/PescaControl_PC3.pdf](docs/PescaControl_PC3.pdf) (fuente editable en [docs/informe/informe.html](docs/informe/informe.html)).
- Capturas: [docs/capturas/](docs/capturas/).
- Datos de prueba: [db.json](db.json).

## Documentación del proyecto

| Archivo | Para qué sirve |
|---|---|
| [PROYECTO.md](PROYECTO.md) | Objetivo, alcance, modelo de datos, endpoints y trazabilidad de requisitos |
| [PRODUCT.md](PRODUCT.md) | Usuarios y propósito del producto |
| [DESIGN.md](DESIGN.md) | Sistema visual: paleta, tipografía, componentes y movimiento |
| [ESTRUCTURA.md](ESTRUCTURA.md) | Carpetas, responsabilidades y flujo de datos |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Reglas del equipo: ramas, commits, PR y estilo |
| [SPRINTS.md](SPRINTS.md) | Sprints, issues por desarrollador y seguimiento |
| [AGENTS.md](AGENTS.md) | Guía técnica rápida: todo el contexto del proyecto en un archivo |
| [docs/ENTREGA.md](docs/ENTREGA.md) | Guía para el PDF y las capturas de la entrega |

## Equipo

| Rol | Responsable | Área |
|---|---|---|
| Dev 1 | _por asignar_ | Shell, layout, calidad e integración |
| Dev 2 | _por asignar_ | Navegación, Inicio, paleta de comandos y capturas |
| Dev 3 | _por asignar_ | Formulario de desembarque, validaciones y edición |
| Dev 4 | _por asignar_ | Estado global, hooks, capas y documento PDF |
| Dev 5 | _por asignar_ | Datos, servicios REST y listado |
