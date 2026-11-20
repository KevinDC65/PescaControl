# Sistema de diseño de PescaControl

Documento del sistema visual implementado en `src/index.css` y `src/styles/*.css`. Describe lo que está construido; si cambias un token, actualiza también esta guía.

## Idea

**El muelle al amanecer y la carta náutica.** La app es una herramienta de trabajo: la navegación, los controles y las tablas son los estándar de Bootstrap; el mundo pesquero aporta solo paleta, tipografía, densidad y un gesto propio.

- **Gesto propio:** la carta náutica. En Inicio, la cifra principal (toneladas desembarcadas) está en una *pizarra* de océano nocturno con isóbatas y sondas muy tenues, y las toneladas por puerto se dibujan como una **carta del litoral**: cada puerto a su latitud real (Paita 5°S → Ilo 17,6°S) sobre la franja de arena de la costa, con su barra saliendo hacia el mar, la franja somera tintada y las isóbatas punteadas como en una carta del servicio hidrográfico.
- **Escena pública:** fuera de la app (página principal `/` y acceso) el mismo mundo se vuelve paisaje: el muelle al amanecer en el tema claro y de noche en el oscuro, con costa al este, una embarcación de cerco en el horizonte, la boya de señal y capas de oleaje. La pizarra y la carta náutica reaparecen como cifras en vivo y como carta del litoral de Tumbes a Tacna.
- **Detalles del oficio:** regla de marea (escala graduada) bajo la marca en la barra lateral; banda con el color de la especie y un oleaje muy fino en tarjetas, fichas y detalle; matrícula y código con letra de casco pintado (Saira semicondensada, cifras tabulares); la boya naranja como única señal de atención.

## Color

Estrategia *restringida con paleta de datos*: neutrales de espuma fría, un azul de mar para la acción y siete tonos de especie que solo aparecen en datos. Tokens `--pc-*` para claro (`:root`) y oscuro (`[data-bs-theme='dark']`); Bootstrap toma estos valores por sus variables `--bs-*`.

| Rol | Claro | Oscuro | Uso |
|---|---|---|---|
| `--pc-fondo` | `#eef3f4` | `#071620` | Lienzo (espuma fría / océano nocturno) |
| `--pc-superficie` | `#ffffff` | `#0d2230` | Paneles, tablas, tarjetas, modales |
| `--pc-superficie-2` | `#e6edef` | `#12293a` | Superficie hundida: cabecera de tabla, pies de modal |
| `--pc-texto` | `#0f2533` | `#e3edf0` | Tinta principal |
| `--pc-texto-suave` | `#45606e` | `#9fb6c0` | Texto secundario |
| `--pc-texto-tenue` | `#526a76` | `#86a0ab` | Ayudas y metadatos (AA sobre fondo y superficies) |
| `--pc-borde` / `-fuerte` | `#d5e0e3` / `#b3c4ca` | `#1c3547` / `#2c4a5f` | Bordes de paneles y controles |
| `--pc-mar` | `#0b5277` | `#6cc3e8` | Acción principal, enlaces, foco, selección, barras del litoral |
| `--pc-boya` | `#e8611a` | `#ff8c47` | **Solo** "requiere atención": punto de la cifra y del filtro, alerta de la barra lateral, badge Observado |
| `--pc-boya-texto` / `-suave` | `#9a3c08` / `#fdeee3` | `#ffb27f` / `#3a2112` | Texto y fondo de la señal de atención |
| `--pc-profundo` | `#0c2b3e` | `#0a3047` | Pizarra de Inicio y carta del 404 |
| `--pc-isobata` | `rgba(167,214,233,.26)` | `rgba(167,214,233,.22)` | Isóbatas y sondas de la pizarra |
| `--pc-arena` | `#ece3cf` | `#2a2a20` | Tierra en la carta del litoral |
| `--pc-riel` | `#0a1e2c` | `#04111a` | Barra lateral y barra de selección |
| `--pc-riel-acento` | `#6cc3e8` | `#6cc3e8` | Ícono activo y foco dentro de la barra lateral |
| `--pc-exito` | `#1d6f5f` | `#5cc6ad` | Verde agua: validación correcta, Descargado, confirmaciones |
| `--pc-info` | `#0e6e8c` | `#6fc9e3` | En descarga |
| `--pc-peligro` | `#b4232f` | `#f2877c` | Eliminar y errores |
| `--pc-escena-cielo-alto/medio/bajo` | `#c4d9e2` / `#e2eaea` / `#f1e2c4` | `#020b12` / `#061827` / `#0e3048` | Cielo de la portada (amanecer / noche) |
| `--pc-escena-astro` | `#f7dca8` (sol) | `#e3edf0` (luna) | Astro sobre el horizonte, con su halo `--pc-escena-astro-halo` |
| `--pc-escena-mar-1…4` | `#86adbe` → `#0c2b3e` | `#0f3a52` → `#04131c` | Capas de oleaje de lejos a cerca (la última también es el pie público) |
| `--pc-escena-costa-lejos/cerca`, `--pc-escena-silueta` | `#a9bcc2`, `#8aa3ad`, `#23404f` | `#0a2232`, `#061a26`, `#01080d` | Costa, embarcación y mástil de la boya |
| `--pc-escena-texto/-suave` | `#0f2533` / `#2f4b59` | `#e9f1f3` / `#b4c9d1` | Texto sobre el cielo de la portada (AA en ambos temas) |

**Especies (serie de datos)**, en `utils/colores.js` (`colorEspecie`) para el tema claro y aclaradas en `styles/especies.css` para el oscuro: Anchoveta `#1b4965` / `#4f86b8`, Jurel `#2a9d8f` / `#3fbfae`, Caballa `#3d8fc4` / `#7cc3ea`, Bonito `#d1495b` / `#ec7083`, Perico `#b98a1b` / `#f0c75a`, Pota `#9a4b2f` / `#d07a48`, Merluza `#6a994e` / `#8dbd6f`; sin especie `#6f7f8c`. Todos superan 3:1 sobre su superficie y ninguno se confunde con el naranja de boya. Destino: consumo humano directo en azul de mar, harina y aceite en `#a68c52` / `#cbb47f`.

**Estados** (`clasesBadgeEstado`): Programado secundario, En descarga info, Descargado éxito, Observado aviso (boya); cada badge lleva además su ícono (calendario, flecha de descarga, check, rombo).

El panel marino de acceso, la pizarra de cifras en vivo y el pie público son siempre de océano nocturno: llevan `data-bs-theme="dark"` local para que las especies y los controles tomen sus tonos oscuros.

**Roles** (`InsigniaRol.tsx`, `.pc-rol`): Jefe en azul de mar suave con escudo, Operador neutro con credencial; siempre ícono + texto.

Reglas: el azul de mar es la única acción; el naranja de boya solo marca atención; el rojo solo errores y eliminar; los colores de especie solo aparecen en datos y siempre junto al nombre.

## Tipografía

Google Fonts: **Saira** (variable, ejes `wdth` 75–100 y `wght` 500–700) para títulos, cifras, códigos y matrículas; **Barlow** (400–700) para la interfaz y el texto corrido.

| Elemento | Familia | Tamaño | Peso | Ancho |
|---|---|---|---|---|
| Título de página (`.pc-titulo-pagina`) | Saira | 2.25rem (1.875rem en móvil) | 650 | 86 |
| Cifra principal (`.pc-cifra-xl`) | Saira | `min(3.25rem, 15cqi)` | 600 | 78 |
| Cifras (`.pc-cifra`) | Saira | `min(2.125rem, 12.5cqi)` | 600 | 82 |
| Toneladas en tarjeta | Saira | 1.625rem | 600 | 84 |
| Título de panel / sección | Saira | 1.0625–1.125rem | 650 | 92 |
| Código y matrícula (`.pc-codigo`, `.pc-matricula`) | Saira | 0.8125rem, `letter-spacing: .05em` | 600 | 88 |
| Cuerpo | Barlow | 0.9688rem, interlineado 1.5 | 400 | — |
| Etiquetas de formulario | Barlow | 0.875rem | 600 | — |

Las cifras de Inicio usan *container queries* para no desbordar su celda. Números con `tabular-nums` en tablas, toneladas y montos. Los inputs usan 1rem para evitar el zoom de iOS.

## Forma y espacio

- Radios: 0.3125rem (badges de estado), 0.375rem (botones, inputs, chips, opciones), 0.5rem (paneles, tarjetas, tabla), 0.75rem (modales y paleta).
- Paneles con borde de 1px `--pc-borde`, sin sombra; las sombras (`--pc-sombra-1/2/3`) quedan para capas flotantes y el hover de tarjetas.
- Márgenes de página: `clamp(1rem, 3.2vw, 2.75rem)`; ancho máximo 90rem.
- Objetivos táctiles de 44 px en móvil (`pointer: coarse`).

## Layout

- **Escritorio (≥ 992 px):** barra lateral de océano nocturno (`Navbar.jsx`, 15.5rem, contraíble a 4.75rem, estado en `localStorage`) con regla de marea y alerta "requieren atención" + cabecera fija translúcida (`Header.jsx`: título "PescaControl" como `<h1>`, migas, buscador Ctrl+K).
- **Móvil:** cabecera compacta + barra inferior de 5 pestañas (Inicio, Desembarques, Registrar destacado, Buscar, Más) con *safe areas*; "Más" abre una hoja inferior.
- **Inicio:** saludo + bajada con el resumen en una frase; banda de 4 cifras (pizarra de toneladas, valor S/, desembarques, requieren atención con enlace a la lista filtrada); Requieren atención + toneladas por especie; carta del litoral por puerto + destino y estados; últimos desembarques en bitácora.
- **Desembarques:** barra de filtros en dos filas (búsqueda, atención, vista / especie, puerto, estado, rango de fechas, orden) sincronizada con la URL; tabla densa o tarjetas; panel lateral de detalle (`?desembarque=<id>`); barra flotante de selección.
- **Página principal (`/`, pública):** barra superior fija (transparente sobre la portada, superficie translúcida al bajar) → portada a pantalla completa → el problema (planilla de muelle escrita a mano) → cómo funciona (sección fija de 300vh con tres pasos) → módulos (rejilla 7/5 con vistas previas hechas con los componentes reales) → cifras en vivo (pizarra) → carta del litoral → roles (tabla de permisos) → cierre sobre el agua → pie. Contenedor `.pc-envoltura` de 76rem con margen `--pc-margen-publico` (16 px en móvil).
- **Acceso (`/ingresar`, `/crear-cuenta`):** dos columnas desde 992 px (panel marino fijo + formulario de 27rem centrado); en móvil una franja marina de 8.5rem sobre el formulario.
- **Usuarios (`/usuarios`, solo Jefe):** tabla con nombre (insignia "Tú"), correo, rol (select), estado (interruptor) y alta; bajo 480 px cada fila es una tarjeta.
- **Registro:** secciones Embarcación, Captura y Operación en paneles + vista previa fija a la derecha con la misma tarjeta de la lista; en móvil, barra de acciones fija abajo.

## Componentes

| Componente | Archivo | Notas |
|---|---|---|
| Insignia de especie | `InsigniaEspecie.jsx`, `styles/especies.css` | Punto, ficha con iniciales sobre oleaje o punto con nombre |
| Insignia de estado | `InsigniaEstado.jsx` | Badge de Bootstrap con ícono propio por estado |
| Tarjeta de desembarque | `TarjetaDesembarque.jsx` | Vista Tarjetas y vista previa del formulario |
| Tabla | `TablaDesembarques.jsx` | Encabezados ordenables con `ORDENES` (`aria-sort`), selección con casilla indeterminada, columnas que se ocultan por ancho |
| Detalle | `DetalleDesembarque.jsx` en `Drawer.jsx` | Banda de especie, toneladas y valor, ficha completa |
| Formulario | `DesembarqueForm.jsx` | Controlado, especie como opciones con su color, arte y destino como chips, estado segmentado, stepper de toneladas, valor estimado en vivo |
| Gráficos | `Graficos.jsx` | `ComposicionEspecies`, `LitoralPuertos`, `RepartoDestino`, `ConteoEstados`, `Isobatas`; HTML y CSS con `role="img"` y cifras escritas |
| Modal | `Modal.jsx`, `ConfirmModal.jsx`, `LoginModal.jsx` | Foco inicial en la opción segura |
| Paleta de comandos | `PaletaComandos.jsx` | Busca por embarcación, código o matrícula; sin animación de apertura |
| Toasts | `context/ToastProvider.jsx` | Renderizan `AlertMessage`; pausa al pasar el puntero, enfocar u ocultar la pestaña |
| Carga | `Loading.jsx` ("Loading...", boya que se mece sobre el oleaje), `Esqueleto.jsx` | Desembarques y edición usan Loading; Inicio usa esqueletos |
| Estados vacíos | `EstadoVacio.jsx` | Ilustraciones de línea: muelle vacío, lupa sobre isóbatas, boya a la deriva |
| Escena marina | `escena/Escena.tsx`, `styles/escena.css` | `Ola` (franja de oleaje en bucle sin costura), `Boya`, `Embarcacion`, `CartaIsobatas`; decorativas |
| Acceso | `acceso/PanelMarino.tsx`, `LayoutAcceso.tsx`, `CampoContrasena.tsx`, `MedidorFortaleza.tsx` | Mostrar/ocultar con `aria-pressed`; medidor `role="meter"` con nivel escrito y requisitos |
| Página principal | `principal/*.tsx`, `styles/publico.css` | `Portada`, `Problema`, `ComoFunciona`, `Modulos`, `CifrasEnVivo` (`Contador`), `CartaLitoral`, `Roles`, `Cierre`/`PiePublico`, `BarraPublica` |
| Roles | `RutaProtegida.tsx`, `Permiso.tsx`, `InsigniaRol.tsx` | Rutas por sesión y rol; `<Permiso rol="jefe">` oculta lo que el rol no puede hacer |
| Marca | `Marca.jsx`, `public/favicon.svg` | Boya de señal naranja sobre dos líneas de oleaje en recuadro de océano nocturno |

## Movimiento

Curvas: `--pc-ease-out: cubic-bezier(0.23, 1, 0.32, 1)` y `--pc-ease-drawer: cubic-bezier(0.32, 0.72, 0, 1)`.

| Qué | Duración | Por qué |
|---|---|---|
| Presión de botones, chips y opciones | 140 ms, `scale(0.97)` | Respuesta inmediata |
| Entrada de página | 260 ms, opacidad + 6 px | Continuidad al navegar |
| Barras del litoral (Inicio) | 650 ms, `scaleX` desde la costa, escalonadas 70 ms de norte a sur | Momento propio de la vista: las barras "zarpan" |
| Franja de especies y de destino | 700–800 ms, `clip-path` de izquierda a derecha, una vez | Lectura de la composición |
| Tarjetas | 360 ms, escalonadas 32 ms (máx. 12) | Entrada de la vista Tarjetas |
| Panel lateral / hoja | 320 ms entrada, 220 ms salida | Relación espacial con su borde |
| Modales | 220 ms entrada, 150 ms salida | |
| Toasts | Transiciones (no keyframes), colapso de altura al salir | Interrumpibles |
| Boya de "Loading..." | 1.6 s, vaivén ±6° y oleaje continuo | Indica espera |
| Paleta de comandos | Sin animación | Se usa muchas veces al día |
| Portada: entrada | Titular desde su máscara (`y` 108 % → 0, 1 s, escalonado 90 ms); bajada, acciones y puertos con opacidad + 14 px (0.8 s, 360–580 ms); el mar sube por capas (`y` 18 % → 0, 1.3 s); la boya cae con resorte (`bounce` 0.22) | Una sola coreografía al cargar (Motion) |
| Portada: oleaje y parallax | Cuatro franjas que derivan en bucle (70 s lejos → 21 s cerca, CSS en el compositor); al hacer scroll se desplazan con `useScroll`/`useTransform` (−6 % a −40 %, más rápido lo más cercano); el texto nunca tiene parallax | Profundidad |
| Embarcación | Cruza el horizonte en 64 s lineales y cabecea ±1.3° | Vida en el horizonte |
| Boya | Vaivén ±5° en 3.6 s y destello de luz cada 4 s | Señal de canal |
| Cómo funciona | Riel `scaleY` ligado al scroll; paso activo según el avance; escenas con fundido + 18 px (520 ms) y campos escalonados 110 ms | Explicación |
| Problema | Tachón rojo con `clip-path` (0.5 s) y nota "¿revisar?" con resorte, una vez al entrar | Explicación |
| Cifras en vivo | Contadores de 0 al valor (1.6 s, `[0.16, 1, 0.3, 1]`) escritos directo en el DOM, con el ancho final reservado | Sin saltos de layout |
| Carta del litoral | Línea de lectura que baja con el scroll (`y`); cada puerto se enciende al alcanzarlo y su barra zarpa (`scaleX`, 900 ms) | Momento propio de la sección |
| Vistas previas de módulos | Bucles CSS (matrícula inválida ↔ válida en 5 s, estado de la tarjeta cada 2.8 s) solo mientras están en pantalla | Mostrar la app real |
| Acceso | Carta que se descubre de derecha a izquierda (`clip-path`, 1.4 s), frase línea a línea, boya con resorte | Una vez al abrir |

El botón **"Pausar el oleaje"** de la portada detiene todo el movimiento continuo de la página principal (`data-pausado`, recordado en `localStorage`), y la portada fuera de pantalla deja de animarse. Con movimiento reducido (CSS y `MotionConfig reducedMotion="user"`) no hay desplazamientos: todo aparece en su sitio, la embarcación queda quieta en el horizonte y los puertos de la carta encendidos.

`prefers-reduced-motion: reduce` deja solo fundidos de opacidad y detiene esqueletos, franjas, barras y oleaje.

## Accesibilidad

Enlace "Saltar al contenido", foco visible en azul de mar (celeste dentro de la barra lateral), trampas de foco y Esc en todas las capas (pila de capas en `useCapaModal`), `aria-live` en toasts, resultados y valor estimado, `aria-sort` en la tabla, `aria-pressed` en filtros y vistas, `role="switch"` en el tema, contraste AA en claro y oscuro, especie y estado siempre con texto además del color.

## Atajos

`Ctrl/⌘ K` paleta · `?` ayuda · `N` nuevo desembarque · `/` buscar en Desembarques · `G` luego `I`/`L`/`R` · `Ctrl/⌘ S` guardar el formulario · `Esc` cerrar.
