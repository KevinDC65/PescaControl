# Product

## Platform

web

## Users

- **Jefe de desembarque u operaciones en puerto** de una empresa pesquera peruana (Paita, Chimbote, Callao, Pisco, Ilo). Registra cada desembarque cuando la embarcación atraca, actualiza su estado mientras se descarga y revisa qué operaciones están observadas o siguen en descarga. Trabaja en la oficina del muelle o en planta, en escritorio, y consulta desde el celular junto a la chata o la tolva, muchas veces de madrugada.
- **Supervisor de planta** que necesita saber en segundos cuántas toneladas llegaron, de qué especie, a qué puerto y con qué destino (consumo humano directo o harina y aceite) para planificar la recepción.
- **Docente del curso** (UTP) que evalúa la práctica: recorre las rutas, prueba el CRUD y busca en la interfaz y en el código los conceptos pedidos (rutas, formulario controlado, props, validaciones, hooks, contexto, custom hook, servicio REST, `Loading...`, mensajes de confirmación y error).

## Product Purpose

PescaControl registra y da seguimiento a los desembarques pesqueros: alta, listado, edición y eliminación contra una API REST simulada (json-server). Éxito = saber al instante cuántas toneladas y cuánto valor se desembarcó, qué operaciones requieren atención y cómo se reparte la captura por especie, puerto y destino; y registrar o corregir un desembarque sin errores de captura.

## Positioning

Sistema de operaciones hecho para el muelle, no un CRUD genérico: cada desembarque se describe con el vocabulario del puerto (embarcación, matrícula de capitanía `CE-21345-CM`, especie, arte de pesca, toneladas, precio por tonelada, destino, estado) y la interfaz lo hace visible: la especie se reconoce por su color, el estado por su insignia y los puertos se leen de norte a sur, como en la costa.

## Operating Context

- Uso diario y repetitivo: buscar por embarcación, código o matrícula; filtrar por especie, puerto, estado y rango de fechas; registrar varios desembarques seguidos.
- Datos en soles (S/) y toneladas (t), fechas en español, cifras con punto decimal.
- "Requiere atención" = estado Observado o En descarga.
- Sin backend real ni autenticación real: el inicio de sesión es simulado (solo un nombre).

## Capabilities and Constraints

- Rutas obligatorias: `/`, `/registro`, `/registro/:id`, `/lista`, `*` (404).
- Stack fijo: React 19 + Vite, react-router-dom 7, Bootstrap 5.3 + Bootstrap Icons, Axios, json-server 0.17. Sin librerías nuevas, sin TypeScript ni Tailwind.
- `apiService.js` es el único acceso HTTP (getAll, getById, add, update, remove) sobre `/desembarques`.
- Modelo `Desembarque`: codigo (`DSB-000`, único), embarcacion (3–60), matricula (`AA-00000-AA`), especie (7), artePesca (5), puerto (5, de norte a sur), destino (2), toneladas (> 0, hasta 1500, 2 decimales), precioTonelada (> 0), fechaDesembarque (no futura), estado (Programado, En descarga, Descargado, Observado).
- Requisitos visibles de la práctica: `Header.jsx` con el título de la app, `Navbar.jsx` con `Link`/`NavLink`, `Loading` con el texto "Loading...", `AlertMessage` para confirmaciones y errores, formulario controlado con `is-invalid`/`is-valid`.
- Interfaz, variables y comentarios en español.

## Brand Commitments

- Nombre: **PescaControl**. Subtítulo: Sistema de Gestión de Operaciones Pesqueras y Desembarque. Institución: Universidad Tecnológica del Perú.
- Sin menciones a herramientas de generación en ningún archivo ni texto.

## Evidence on Hand

- `db.json`: 16 desembarques de prueba realistas (anchoveta de cerco para harina en Chimbote, Callao, Pisco e Ilo; pota de pinta y merluza de arrastre en Paita; jurel, caballa, bonito y perico para consumo humano directo).
- No hay fotografías, logotipo propio ni testimonios; no se deben inventar.

## Product Principles

1. Claridad antes que ingenio: cada concepto evaluado debe poder señalarse en pantalla.
2. El muelle a la vista: especie, puerto y estado son información, no decoración.
3. Rápido para el uso repetido: teclado, búsqueda y filtros compartibles por URL.
4. Nunca perder trabajo: borrador persistido, aviso de cambios sin guardar, confirmación antes de eliminar.

## Accessibility & Inclusion

Contraste AA en claro y oscuro, foco visible, navegación completa por teclado, `prefers-reduced-motion` respetado, objetivos táctiles de 44 px en móvil, estado y especie nunca comunicados solo con color.
