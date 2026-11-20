# Reglas del equipo

Estas reglas existen para que 5 personas trabajen en paralelo sin romper `main`. Son obligatorias.

## 1. Antes de empezar

1. Elige una issue de **tu rol** y del **sprint actual** en [SPRINTS.md](SPRINTS.md).
2. **Asígnatela** en GitHub (`Assignees → yourself`) antes de escribir código. Una issue = una persona.
3. Revisa la sección *Dependencias* de la issue. Si depende de otra aún abierta, coordina por el grupo o usa un mock temporal.
4. Actualiza tu copia: `git checkout main && git pull`.

## 2. Ramas

`main` está **protegida**: nadie hace push directo, todo entra por Pull Request.

| Tipo | Formato | Ejemplo |
|---|---|---|
| Funcionalidad | `feature/<n°issue>-descripcion-corta` | `feature/5-formulario-registro` |
| Corrección | `fix/<n°issue>-descripcion` | `fix/16-eliminar-no-refresca` |
| Documentación | `docs/<n°issue>-descripcion` | `docs/25-documento-pdf` |

```bash
git checkout -b feature/5-formulario-registro
```

## 3. Commits (Conventional Commits, en español)

```
<tipo>(<ámbito>): <descripción en minúscula, imperativo>
```

Tipos: `feat`, `fix`, `docs`, `style`, `refactor`, `chore`.
Ámbitos sugeridos: `layout`, `navbar`, `home`, `registro`, `lista`, `context`, `hooks`, `api`, `docs`.

Ejemplos:
- `feat(registro): agregar formulario controlado de desembarque`
- `fix(lista): refrescar tabla tras eliminar`
- `docs(readme): completar tabla del equipo`

Commits pequeños y frecuentes. Nada de `"cambios"` o `"avance"`.

## 4. Pull Requests

- Título = mensaje del commit principal.
- En la descripción: `Closes #<n°issue>` (cierra la issue al fusionar).
- Antes de abrir el PR, en local:
  ```bash
  npm run lint
  npm run typecheck
  npm test
  npm run format
  npm run build
  ```
- Requiere **1 aprobación** de otro integrante y **CI en verde**.
- Si `main` avanzó: `git pull origin main` en tu rama, resuelve conflictos y vuelve a subir.
- Fusiona con **Squash and merge**. Borra la rama después.
- Revisa al menos un PR de un compañero por sprint.

## 5. Propiedad de archivos

Cada rol es dueño de ciertos archivos (ver tabla en [SPRINTS.md](SPRINTS.md#responsables-por-archivo)). Si necesitas cambiar un archivo de otro rol:
- Cambios pequeños (un import, una prop): hazlo y menciona al dueño en el PR.
- Cambios grandes: pídelo en su issue o abre una nueva.

`db.json` solo lo modifica la issue #7 (y quien necesite datos nuevos lo pide al Dev 5). `package.json`: avisa en el grupo antes de instalar una dependencia nueva.

## 6. Estilo de código

- Solo **componentes funcionales** y hooks. Nada de clases.
- **TypeScript estricto** (`strict`, sin `any`; si algo es incierto, `unknown` y estrechamiento). Extensión `.tsx` para archivos con JSX y `.ts` para el resto. `npm run typecheck` debe pasar.
- Estilos: **clases de Bootstrap primero**; CSS propio solo en `src/index.css` (tokens) y `src/styles/*.css`, usando las variables definidas en [DESIGN.md](DESIGN.md).
- Textos de la interfaz, nombres de variables y commits **en español**.
- La API solo se llama desde `src/services/` (`apiService.ts`, `authService.ts`, `usuariosService.ts`, `publicoService.ts`). Los componentes nunca usan `axios`/`fetch` directo.
- Toda regla de permisos se aplica en el **servidor**; la interfaz solo oculta lo que el rol no puede hacer.
- Nada de `console.log` en el PR final (sí `console.error` para errores reales).
- Formato automático con Prettier (`npm run format`).

## 7. Definition of Done (cuándo una issue está terminada)

- [ ] Cumple todos los criterios de aceptación de la issue.
- [ ] Lint, typecheck, pruebas (`npm test`), formato y build pasan.
- [ ] Probado en el navegador con `npm run dev:all`, sin errores en consola.
- [ ] Se ve bien en móvil (ancho ~375 px) y escritorio.
- [ ] PR aprobado y fusionado; la issue se cerró sola.
- [ ] Tu fila en `SPRINTS.md` marcada como `[x]`.

## 8. Autoría y firmas

- Cada commit y PR tiene como **único autor al integrante** que lo sube, con su cuenta de GitHub.
- **Prohibido** añadir trailers `Co-authored-by:`, firmas automáticas ("Generated with…", "Created by…") o menciones a herramientas en commits, PRs, issues, comentarios del código o documentación.
- Solo se versiona código y documentación del proyecto: nada de archivos de configuración personal de tu editor o herramientas. Revisa `git status` antes de cada commit.
- Si usas cualquier herramienta de apoyo, configúrala para que no firme y **revisa el mensaje del commit antes de subirlo**. Eres responsable de todo lo que subes.
- La CI rechaza automáticamente los PRs con commits que incumplan esta regla. Para corregirlo:
  ```bash
  git commit --amend          # edita el mensaje y borra la línea
  git push --force-with-lease # solo en TU rama, nunca en main
  ```

## 9. Guía técnica

[AGENTS.md](AGENTS.md) resume en un solo archivo el stack, comandos, contrato de la API y reglas duras. Léelo antes de empezar cada issue.
