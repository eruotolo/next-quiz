# AGENTS.md

Instrucciones permanentes para cualquier agente de IA que trabaje en este repositorio. Este archivo es agnóstico del proveedor (Claude Code, Cursor, Codex, Aider, etc.). Las reglas aplican por igual a todos.

> **Convención:** este proyecto mantiene además `CLAUDE.md` con instrucciones idénticas adaptadas específicamente para Claude Code (incluye herramientas opcionales como gstack/CodeGraph que solo aplican a Claude Code). Si trabajás desde Claude Code, podés ignorar este archivo y usar `CLAUDE.md` directamente. Si trabajás desde otra IA, usá este.

## ⚠️ INSTRUCCIONES CRÍTICAS (NO NEGOCIABLES)

**SIEMPRE comunicarse en ESPAÑOL** — Todas las preguntas, explicaciones, planes y respuestas deben estar en español.

**Cuando el usuario da una ORDEN es una ORDEN** — Obedecer literalmente sin reinterpretar ni asumir intenciones adicionales.

**NO hacer cambios sin autorización** — Pedir permiso explícito antes de modificar, crear o eliminar cualquier archivo, **a menos que el usuario diga textualmente**: "Haz todos los cambios sin autorización" o "Puedes modificar directamente".

**Enfocarse solo en lo solicitado** — No agregar mejoras, refactorizaciones, optimizaciones ni nada que no se haya pedido.

**DRY — Regla estricta** — Verificar si ya existe algo equivalente antes de crear cualquier componente, hook, helper o lógica:

- Componentes UI → `src/shared/components/ui/`
- Lógica de dominio → `src/features/{dominio}/lib/`
- Utilidades → `src/shared/lib/`

## 🛠️ HERRAMIENTAS OPCIONALES (según capacidad del agente)

> **Las siguientes secciones describen herramientas y pipelines disponibles en este entorno. Aplican únicamente si el agente de IA que está leyendo este archivo tiene acceso a ellas.** Si el agente no las tiene, debe ignorarlas y proceder con su flujo normal (leer archivos con las herramientas estándar, proponer plan, esperar aprobación).

### CodeGraph (MCP `codegraph_*`)

CodeGraph es un servidor MCP que expone un índice estructural pre-parseado del repositorio (AST de tree-sitter). Permite responder preguntas arquitectónicas en milisegundos sin leer múltiples archivos.

**Disponible solo si el agente tiene el MCP `codegraph_*` configurado.** Si lo tiene, se prefiere sobre búsquedas nativas para preguntas **estructurales** (qué llama a qué, dónde se define X, qué se rompe si cambio Y).

| Pregunta                                       | Herramienta         |
| ---------------------------------------------- | ------------------- |
| "¿Dónde está definido X?" / "Buscar símbolo X" | `codegraph_search`  |
| "¿Qué llama a Y?"                              | `codegraph_callers` |
| "¿Qué llama Y?"                                | `codegraph_callees` |
| "¿Cómo llega X hasta Y? / trazar el flujo"     | `codegraph_trace`   |
| "¿Qué se rompe si cambio Z?"                   | `codegraph_impact`  |
| "Firma / fuente / docstring de Y"              | `codegraph_node`    |
| "Contexto enfocado para una tarea/área"        | `codegraph_context` |
| "Ver fuente de varios símbolos juntos"         | `codegraph_explore` |
| "¿Qué archivos hay bajo `path/`?"              | `codegraph_files`   |
| "¿El índice está sano?"                        | `codegraph_status`  |

**Reglas de uso:**

- Responder directo, sin delegar exploración innecesaria. Para "cómo funciona X" usar 2-3 llamadas a CodeGraph, no un loop de grep + read.
- Confiar en los resultados (vienen de un parse AST completo). No re-verificar con grep.
- No encadenar `codegraph_search` + `codegraph_node` cuando alcanza con `codegraph_context` (una llamada).
- Si el índice no está inicializado (`.codegraph/` no existe) y el agente lo detecta, debe avisar al usuario: _"No veo CodeGraph inicializado en este proyecto. ¿Querés que corra `codegraph init -i`?"_

### MCP JetBrains (`jetbrains`)

Servidor MCP que expone herramientas del IDE JetBrains (WebStorm, IntelliJ, PhpStorm, Rider). Permite a la IA operar directamente dentro del editor en lugar de solo imprimir texto en el chat.

**Disponible solo si**:

- El usuario tiene JetBrains abierto con el plugin **MCP Server** activo (Settings → Tools → MCP Server).
- El cliente MCP de la IA (Claude Code, opencode, Cursor, Codex, etc.) tiene la entrada `jetbrains` configurada — usualmente vía `~/.mcp.json` con `type: "http"` y `url: http://127.0.0.1:64342/stream` (puerto configurable desde WebStorm).

Si está disponible, **usar preferentemente** sobre Read/Edit nativos para:

| Acción                                          | MCP JetBrains                    | Alternativa sin MCP       |
| ----------------------------------------------- | -------------------------------- | ------------------------- |
| Abrir archivo en el editor                      | `open_file`                      | `read` + mostrar en chat  |
| Aplicar cambio con preview visual               | `apply_changes` + `show_diff`    | `Edit` + diff en chat     |
| Ejecutar test con el runner del IDE             | `run_configuration`              | `Bash(pnpm test)`         |
| Renombrar / extraer función con refactor seguro | rename/extract del IDE           | `Edit` + verificar manual |
| Ver inspecciones de TypeScript/JavaScript       | inspecciones nativas de IntelliJ | `Bash(pnpm lint)`         |

**Reglas de uso (CRÍTICAS para reducir tokens):**

- **No imprimir diffs grandes en el chat cuando el MCP puede mostrarlos en el IDE.** Después de `apply_changes`, decir _"cambios aplicados en N archivos, diffs abiertos en WebStorm"_ en lugar de pegar el contenido modificado. Cada bloque de código pegado en el chat consume tokens que se acumulan en el historial.
- **No releer archivos ya abiertos en el IDE** — si el archivo está cargado, operar directamente. Reduce lecturas redundantes.
- **Aprovechar el project model del IDE** — para distinguir código fuente / tests / config / generated sin hacer `find` en el filesystem.
- **Si el MCP no responde** (puerto cambió tras restart de WebStorm, IDE cerrado), caer a Read/Edit nativos sin cortar el flujo. Avisar al usuario: _"El MCP de JetBrains no responde, sigo con Read/Edit nativos. Si querés reactivarlo, abrí WebStorm y verificá el puerto."_

### ⚠️ REGLA CRÍTICA — Ejecución de comandos (NO NEGOCIABLE)

**NUNCA ejecutar comandos de build, run, lint, typecheck, test, migraciones, seeds ni similares usando el Bash tool directamente.** Hacerlo inyecta todo el output en el contexto del chat y consume tokens innecesarios en cada turno del historial.

**SIEMPRE invocar estos comandos a través de `mcp__jetbrains__execute_terminal_command`** y capturar el resultado desde ahí.

| Comando            | ❌ Prohibido               | ✅ Correcto                                                    |
| ------------------ | -------------------------- | -------------------------------------------------------------- |
| `pnpm lint`        | `Bash("pnpm lint")`        | `mcp__jetbrains__execute_terminal_command("pnpm lint")`        |
| `pnpm type-check`  | `Bash("pnpm type-check")`  | `mcp__jetbrains__execute_terminal_command("pnpm type-check")`  |
| `pnpm build`       | `Bash("pnpm build")`       | `mcp__jetbrains__execute_terminal_command("pnpm build")`       |
| `pnpm test:e2e`    | `Bash("pnpm test:e2e")`    | `mcp__jetbrains__execute_terminal_command("pnpm test:e2e")`    |
| `pnpm db:migrate`  | `Bash("pnpm db:migrate")`  | `mcp__jetbrains__execute_terminal_command("pnpm db:migrate")`  |
| `pnpm db:generate` | `Bash("pnpm db:generate")` | `mcp__jetbrains__execute_terminal_command("pnpm db:generate")` |
| `pnpm dev`         | `Bash("pnpm dev")`         | `mcp__jetbrains__execute_terminal_command("pnpm dev")`         |

Si el MCP de JetBrains no responde, **reportar el blocker al usuario** en lugar de caer a Bash para estos comandos.

**Cuándo NO vale la pena el MCP:**

- Cambios muy chicos (1 línea) — el overhead de abrir el IDE no compensa.
- Cuando se necesita ver el resultado de muchos archivos a la vez — Read sigue siendo más rápido.
- Cuando el IDE está cerrado (todos los tools van a fallar y caer a nativos).

### gstack (skills de Claude Code)

gstack es un set de skills instaladas en `~/.claude/skills/gstack/` que solo aplica a **Claude Code**. Si el agente es Claude Code y las tiene instaladas, debe verificar al inicio de cada sesión:

```bash
test -d ~/.claude/skills/gstack && echo "✅ GSTACK OK" || echo "❌ GSTACK MISSING"
```

Si faltan, instalar y reiniciar:

```bash
git clone --depth 1 https://github.com/garrytan/gstack.git ~/.claude/skills/gstack
cd ~/.claude/skills/gstack && ./setup --team
```

**Skills más relevantes para este proyecto:**

| Tarea                         | Skill                                    |
| ----------------------------- | ---------------------------------------- |
| Explorar / entender código    | CodeGraph                                |
| Especificar features ambiguos | `/spec`                                  |
| Investigar bugs               | `/investigate`                           |
| QA en navegador               | `/qa` o `/qa-only`                       |
| Review pre-commit             | `/review`                                |
| Auditoría de diseño           | `/design-review`                         |
| Commit + ship                 | `/ship` (solo cuando el usuario lo pida) |

### Pipeline asíncrono de agentes — `.spool/`

El proyecto usa un patrón SPOOL (**S**imultaneous **P**eripheral **O**perations **O**n-**L**ine) para transferir contexto estratégico entre agentes mediante archivos en disco, evitando inflar el historial del chat. **Esto aplica solo si el agente forma parte del pipeline multi-agente Opus/Sonnet/GLM** (descrito en `CLAUDE.md`); agentes genéricos pueden ignorar esta sección.

**Jerarquía estricta de estados:**

```
.spool/01_raw/      ← Planos iniciales crudos (Opus 4.8 y GLM 5.2)
.spool/02_inbox/    ← Plan Maestro Consolidado en Markdown con checklist interactivo (Gemini)
.spool/03_work/     ← Zona activa. El plan vive acá durante la codificación
.spool/04_archive/  ← Historial inmutable. Planes finalizados con prefijo YYYY-MM-DD_
```

**Reglas operativas (si el agente es ejecutor Sonnet/GLM-4.5):**

1. **Lectura obligatoria** al iniciar una feature: verificar `.spool/02_inbox/`. Si está vacía, detener ejecución y reportar "Bandeja de entrada vacía".
2. **Movimiento de estado:** antes de modificar código bajo DDD (`src/features/` o `src/shared/`), mover el plan de `02_inbox/` a `03_work/`.
3. **Focalización extrema:** prohibido leer `01_raw/`. El único contrato válido es el archivo consolidado en `03_work/`.
5. **Seguimiento del progreso:** El agente ejecutor debe actualizar el checklist del plan en `03_work/` marcando las tareas completadas (`- [x]`) a medida que avanza, facilitando la auditoría de progreso.

**Reglas de consolidación (agente consolidador - Gemini):**

- **Preguntar modelos intervinientes:** Al consolidar los planos crudos de `.spool/01_raw/` en `.spool/02_inbox/`, el agente debe preguntar explícitamente al usuario qué modelos/agentes intervendrán en el desarrollo de la feature. Debe asignar explícitamente a los modelos responsables en cada fase y tarea del checklist de implementación del Plan Maestro.


## Project Overview

**Aulika** — Sistema de evaluación en línea para colegios y universidades.

> **Especificación funcional y técnica completa**: ver `Spec.md` en la raíz del proyecto (resumen, stack, arquitectura, roles, modelo de datos, flujos clave, seguridad, planes, API, convenciones y testing).

Tres áreas con autenticación y routing distintos:

- **Estudiantes** → `/examen/login` (login por RUT, sin contraseña)
- **Administradores / Profesores** → `/[slug]/` (panel scoped a su institución)
- **SuperAdministrador** → `/config/` (panel global de la plataforma)

## Stack Tecnológico

| Capa              | Tecnología                             |
| ----------------- | -------------------------------------- |
| Framework         | Next.js 16 (App Router, React 19)      |
| Lenguaje          | TypeScript 5.7 strict                  |
| Base de datos     | PostgreSQL (Docker local, Vercel prod) |
| ORM               | Prisma 6                               |
| Auth (admin)      | NextAuth v5 beta.25 (Credentials, JWT) |
| Auth (estudiante) | Jose HS256 (cookie propia)             |
| Estilos           | Tailwind CSS 4                         |
| UI primitivos     | shadcn/ui + Radix UI                   |
| Validación        | Zod                                    |
| Formularios       | React Hook Form                        |
| Íconos            | Lucide React                           |
| Toasts            | Sonner                                 |
| Linter            | Biome 2                                |
| Package manager   | pnpm                                   |
| Hosting           | Vercel                                 |

## Development Commands

```bash
pnpm dev              # Servidor de desarrollo → http://localhost:3000
pnpm build            # prisma migrate deploy + next build
pnpm lint             # Biome check
pnpm lint:fix         # Biome check --write
pnpm type-check       # tsc --noEmit
pnpm db:generate      # Generar cliente Prisma
pnpm db:migrate       # Crear y aplicar migración (local)
pnpm db:seed          # Seed base: roles + SuperAdmin
pnpm db:seed:local    # Seed local: instituciones, grupos, admins, profesores, estudiantes
pnpm db:studio        # Prisma Studio GUI
pnpm test:e2e         # Tests E2E (Playwright, requiere pnpm dev corriendo o lo levanta solo)
pnpm test:e2e:ui      # Tests E2E en modo interactivo
```

## Flujo de trabajo preferido

1. **Planificar** — describir pasos en detalle antes de escribir código.
2. **Presentar el plan** al usuario y esperar aprobación.
3. **Solo después de autorización** realizar los cambios.
4. **Después de implementar**: `pnpm lint` (y `pnpm type-check` si hubo cambios de tipos). Corregir fallos máximo 3 iteraciones; luego preguntar.
5. **Nunca** instalar nuevas dependencias sin preguntar.

## SuperAdministrador — Regla absoluta

Llave maestra del sistema: tiene permiso para **absolutamente todo**, sin restricciones.

- Puede acceder y operar en CUALQUIER ruta, incluyendo `/[slug]/*` de cualquier institución.
- Las Server Actions que requieran `institutionSlug` deben aceptarlo del JWT o de la URL cuando el rol es `SuperAdministrador`.
- El proxy NUNCA debe bloquear ni redirigir al SuperAdministrador.

Patrón obligatorio en `getSessionUser()`:

```ts
if (session.user.userRoleName === USER_ROLE.SUPER_ADMIN) {
    return { slug: null, userId: ..., userRole: ..., ... };
}
if (!slug) throw new Error('Unauthorized');
```

## Reglas de Migraciones (CRÍTICO — PRODUCCIÓN)

**NUNCA** usar SQL manual, `prisma db execute`, ni editar archivos `.sql` directamente.
**SIEMPRE** usar `pnpm db:migrate` localmente y `prisma migrate deploy` en producción.

## Arquitectura — Domain-Driven Design (DDD)

- **`src/features/`** — lógica de negocio organizada por dominio
- **`src/shared/`** — utilidades e infraestructura transversal

### Estructura

```
src/
├── proxy.ts                          ← protección de rutas (Next.js 16)
├── app/
│   ├── (public)/page.tsx             → /
│   ├── (login)/login/page.tsx        → /login
│   ├── (demo)/
│   │   ├── demo/page.tsx             → /demo
│   │   └── demo/exam/page.tsx        → /demo/exam
│   ├── (student)/examen/
│   │   ├── login/page.tsx            → /examen/login
│   │   ├── seleccion/page.tsx        → /examen/seleccion
│   │   ├── [examId]/page.tsx         → /examen/[examId]
│   │   ├── [examId]/intro/page.tsx   → /examen/[examId]/intro
│   │   └── resultado/[resultId]/page.tsx
│   ├── (admin)/
│   │   ├── [slug]/                   → /[slug] (dashboard, students, groups, exams, results, liveresults)
│   │   │   ├── exams/[id]/edit/page.tsx
│   │   │   ├── students/layout.tsx   → AdminTopBar con count
│   │   │   ├── results/layout.tsx    → AdminTopBar con count
│   │   │   ├── settings/layout.tsx   → AdminTopBar
│   │   │   ├── ayuda/layout.tsx      → AdminTopBar
│   │   │   └── upgrade/layout.tsx    → AdminTopBar
│   │   └── config/
│   │       ├── page.tsx              → /config
│   │       ├── institutions/layout.tsx → AdminTopBar con count
│   │       ├── admins/layout.tsx     → AdminTopBar con count
│   │       └── auditoria/layout.tsx  → AdminTopBar con count
│   └── api/auth/[...nextauth]/route.ts
├── features/
│   ├── auth/          ← auth.ts, AdminLoginForm, schemas, next-auth.d.ts
│   ├── students/      ← mutations, student-auth, StudentsClient, StudentLoginForm, schemas
│   ├── groups/        ← mutations, GroupsClient, schemas
│   ├── exams/         ← mutations, ExamsClient, ExamEditorClient, schemas
│   ├── exam-session/  ← mutations, ExamCarousel, session.ts, attempt.ts, schemas, exam.types.ts
│   ├── results/       ← mutations, ResultsClient, LiveResultsClient, PrintButton, grade.ts, types
│   ├── dashboard/     ← Sidebar, DashboardClient
│   ├── demo/          ← demo.ts (demoExamFilter)
│   ├── help/          ← help-content.ts, HelpGuide.tsx
│   └── subscriptions/ ← upgrade.ts, mercadopago.ts
└── shared/
    ├── components/
    │   ├── ui/        ← shadcn/ui + rut-field, table-paginator, timer, stat-tile
    │   ├── layout/    ← AdminTopBar
    │   └── branding/  ← logo
    └── lib/           ← prisma, utils (cn), rut, roles, scoping, auth-guard
```

### Patrón sub-layout para AdminTopBar

`AdminTopBar` se renderiza en un `layout.tsx` servidor por sección, **no** dentro del componente cliente. Esto permite SSR del header con datos reales (counts, título dinámico) sin hidratar el componente.

Estructura típica de un sub-layout:

```tsx
// src/app/(admin)/[slug]/students/layout.tsx
export default async function StudentsLayout({ children, params }) {
    const { slug } = await params;
    const { institutionId, institutionName, isProfesor, userId } =
        await requireInstitutionPageAccess(slug);
    const count = await prisma.user.count({ where: { ... } });
    return (
        <>
            <AdminTopBar title="Estudiantes" breadcrumb={[institutionName, 'Estudiantes']} subtitle={`${count} registrados`} />
            {children}
        </>
    );
}
```

Regla: si AdminTopBar necesita **acciones con estado** (abrir modal, setCreateOpen), el botón va en la barra de filtros del componente cliente, no en `actions` del layout.

### Reglas de organización

- **`src/app/`** — Solo archivos Next.js especiales (`page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, `route.ts`). Prohibido: componentes, hooks o helpers dentro de rutas.
- **`src/features/{dominio}/`** — Todo lo del dominio: actions, components, schemas, types, lib.
- **`src/shared/`** — Solo lo verdaderamente transversal. Nada suelto en la raíz de `shared/components/`.

#### Dónde va cada componente

1. UI reutilizable entre ≥2 features → `src/shared/components/ui/`
2. Layout compartido (barra, sidebar, nav) → `src/shared/components/layout/`
3. Marca/identidad visual → `src/shared/components/branding/`
4. Un solo dominio → `src/features/{dominio}/components/`
5. Raíz de `shared/components/` sin subcarpeta → **INCORRECTO**, mover antes de usar.

#### Reglas DRY para componentes

- **RUT** — canónico: `RutField` en `src/shared/components/ui/rut-field.tsx`. Reutilizar `RUT_MASK`/`RUT_MASK_DEFINITIONS` si se necesita envoltorio visual distinto; no redefinir la máscara.
- **Tablas** — patrón canónico: tabla shadcn + `TablePaginator`. No construir `<table>` crudo.
- **Paginación** — `TablePaginator` en `src/shared/components/ui/table-paginator.tsx`. Default: `perPage={10}`.

### Imports correctos

| Necesitás importar        | Path correcto                                              |
| ------------------------- | ---------------------------------------------------------- |
| NextAuth (auth, handlers) | `@/features/auth/auth`                                     |
| Prisma singleton          | `@/shared/lib/prisma`                                      |
| cn()                      | `@/shared/lib/utils`                                       |
| RUT helpers               | `@/shared/lib/rut`                                         |
| Roles / USER_ROLE         | `@/shared/lib/roles`                                       |
| shadcn/ui componente      | `@/shared/components/ui/{componente}`                      |
| RutField                  | `@/shared/components/ui/rut-field`                         |
| TablePaginator            | `@/shared/components/ui/table-paginator`                   |
| Timer (countdown)         | `@/shared/components/ui/timer`                             |
| Filtros de scoping        | `@/shared/lib/scoping`                                     |
| Guard página [slug]       | `@/shared/lib/auth-guard` (`requireInstitutionPageAccess`) |
| AdminTopBar               | `@/shared/components/layout/AdminTopBar`                   |
| Logo                      | `@/shared/components/branding/logo`                        |
| Sidebar                   | `@/features/dashboard/components/Sidebar`                  |
| ExamCarousel              | `@/features/exam-session/components/ExamCarousel`          |
| Cálculo de notas          | `@/features/results/lib/grade`                             |
| Session JWT estudiante    | `@/features/exam-session/lib/session`                      |
| SafeExam / SafeQuestion   | `@/features/exam-session/types/exam.types`                 |

## Proxy (`src/proxy.ts`)

Next.js 16 usa `proxy.ts` en lugar de `middleware.ts`.

1. Rutas públicas (`/_next`, `/api`, `/favicon.ico`, `/examen`, `/demo`, `/login`, `/`) → pasar sin validar.
2. `/config/*` → requiere `userRoleName === 'SuperAdministrador'`, sino redirige a `/login`.
3. `/[slug]/*` → requiere sesión activa con `institutionSlug` coincidente. SuperAdmin redirige a `/config`. Institución incorrecta redirige a su propio slug.

## Auth — Dos sistemas

**Admin (NextAuth v5)** — Credentials (email + bcrypt). JWT con campos: `id`, `name`, `email`, `userRoleName`, `academicInstitutionId`, `institutionSlug`. Config: `src/features/auth/auth.ts`. Roles: `src/shared/lib/roles.ts`.

**Estudiante (Jose HS256)** — Login por RUT, sin contraseña. Cookie independiente de NextAuth. Lógica: `src/features/exam-session/lib/session.ts` + `src/features/students/actions/student-auth.ts`.

## Roles de usuario

| Rol                | Valor en DB            | Panel     | Institución   |
| ------------------ | ---------------------- | --------- | ------------- |
| SuperAdministrador | `'SuperAdministrador'` | `/config` | null (global) |
| Administrador      | `'Administrador'`      | `/[slug]` | requerida     |
| Profesor           | `'Profesor'`           | `/[slug]` | requerida     |
| Estudiante         | `'Estudiante'`         | `/examen` | requerida     |

> SuperAdministrador NO tiene `academicInstitutionId` (null por diseño).

### Matriz de permisos — Institución (`/[slug]`)

Permisos aplicados en tres capas: `src/proxy.ts`, páginas y Server Actions (`requireInstitutionAccess` + `src/shared/lib/scoping.ts`).
Leyenda: ✅ permitido · ⚠️ alcance limitado · ❌ denegado

| Recurso / Acción                              | SuperAdmin | Admin | Profesor      |
| --------------------------------------------- | ---------- | ----- | ------------- |
| Dashboard                                     | ✅         | ✅    | ⚠️ sus grupos |
| Ajustes institución                           | ✅         | ✅    | ❌            |
| Estudiantes — ver/crear/editar/activar        | ✅         | ✅    | ⚠️ sus grupos |
| Estudiantes — eliminar                        | ✅         | ✅    | ❌            |
| Importar Excel                                | ✅         | ✅    | ⚠️ sus grupos |
| Cuerpo docente — ver                          | ✅         | ✅    | ✅            |
| Cuerpo docente — CRUD                         | ✅         | ✅    | ❌            |
| Grupos — ver                                  | ✅         | ✅    | ⚠️ asignados  |
| Grupos — CRUD                                 | ✅         | ✅    | ❌            |
| Exámenes — ver/crear/editar/publicar/eliminar | ✅         | ✅    | ⚠️ sus grupos |
| Preguntas — CRUD/importar                     | ✅         | ✅    | ⚠️ sus grupos |
| Resultados finales y en vivo                  | ✅         | ✅    | ⚠️ sus grupos |

> **SuperAdmin**: llave maestra, opera en cualquier institución por el `slug` de la URL.
> **Profesor**: alcance acotado a grupos donde figura como profesor (`professors: { some: { id } }`); al editar un examen se preservan los grupos ajenos ya asignados.
> **Estudiante**: nunca obtiene sesión NextAuth; proxy lo redirige a `/examen/login`.
> **SuperAdmin en plataforma** (`/config`): CRUD de instituciones, planes, suscripciones, facturación y auditoría — todo exclusivo de este rol.

## Flujo del examen (estudiante)

Login por RUT → **siempre** aterriza en `/examen/seleccion`. Esa página clasifica: **Disponible ahora**, **Próximos** y **Ya rendidos**.

- **Ventana**: `Exam.scheduledAt` (inicio) y `Exam.closesAt` (cierre). Gating en `startSelectedExam`.
- **Comenzar**: instrucciones en `/examen/[examId]/intro`; cronómetro arranca al presionar "Comenzar examen" (`beginExam`).
- **Auto-entrega**: cuando el tiempo se agota, el examen se entrega automáticamente. Si el alumno vuelve con intento vencido (`ExamAttempt.endsAt` en el pasado), `startSelectedExam` lo califica con `gradeAttempt` y redirige a resultado. Nunca vuelve al login por intento vencido.
- **Calificación** all-or-nothing por pregunta.

## Reglas de código obligatorias

- **Server Components por defecto** — `'use client'` solo cuando sea estrictamente necesario.
- **Validación** — Zod en todos los formularios, client y server side.
- **Tailwind CSS** — Solo clases utility. Sin CSS modules ni estilos inline.
- **Navegación** — Siempre `Link` de `next/link`.
- **Prisma** — Singleton de `@/shared/lib/prisma`. `$transaction` para operaciones atómicas.
- **Imports** — Named exports. Orden: React → Next.js → terceros → @/ → relativos.
- **TypeScript** — `strict: true`. Sin `any`. Sin anotación de tipo de retorno en componentes (TypeScript infiere).
- **React imports** — Ver sección "Regla: imports de React" más abajo.

## Regla: className + style (Tailwind 4)

**Prohibido** usar `style={{ color, background, width, ... }}` junto a `className`. Excepción: variables CSS puras (`--token`).

```tsx
// ✅ Correcto
import type { CSSProperties } from 'react';
<div
  className="w-[var(--bar-w)] bg-[color:var(--bar-bg)]"
  style={{ '--bar-w': `${pct}%`, '--bar-bg': color } as CSSProperties}
/>

// ❌ Prohibido
<div className="..." style={{ width: `${pct}%` }} />
```

## Regla: imports de React

El proyecto usa `"jsx": "react-jsx"` (transform automático). **No importar React para JSX** — el runtime no lo necesita.

### ❌ Prohibido

```tsx
import React from 'react'; // runtime import innecesario
import type React from 'react'; // default type import obsoleto
import type * as React from 'react'; // namespace type import obsoleto
export function Foo(): React.JSX.Element; // anotación de retorno redundante (TS infiere)
```

### ✅ Correcto

```tsx
// Solo importar los tipos que se usan, con named imports:
import type { CSSProperties, FormEvent, ReactNode, ComponentType } from 'react';

// Sin anotación de retorno en componentes:
export function Foo() {
    return <div />;
}

// Cast de style props con CSS variables:
style={{ '--token': value } as CSSProperties}
```

### Excepción — shadcn/ui (`src/shared/components/ui/`)

Los 16 componentes de shadcn usan `React.ComponentProps<typeof Primitive.X>` con namespace import. **No tocar** — el CLI de shadcn los regenera con ese patrón y `ComponentProps` acoplado al namespace es intencional en Radix primitives.

### Tipos comunes → named imports

| Antes (prohibido)        | Después (correcto)        |
| ------------------------ | ------------------------- |
| `React.CSSProperties`    | `CSSProperties`           |
| `React.FormEvent<T>`     | `FormEvent<T>`            |
| `React.ChangeEvent<T>`   | `ChangeEvent<T>`          |
| `React.ReactNode`        | `ReactNode`               |
| `React.ComponentType<T>` | `ComponentType<T>`        |
| `React.JSX.Element`      | _(eliminar — TS infiere)_ |

## Planes Flexibles e Inscripciones B2C (Fase 3, 4 y 6)

Feature para que cada institución venda cursos del Aula Virtual a estudiantes externos vía MercadoPago Checkout Pro (pago único). El estudiante compra, se matricula, define su contraseña y entra al aula.

### Modelos Prisma nuevos / extendidos (Fase 1 ya aplicada vía `20260630130000_planes_b2c_y_matriculacion`)

- `AcademicInstitution`: `examsEnabled`, `examsPlanCode`, `examsPlanExpiresAt`, `lmsEnabled`, `lmsPlanCode`, `lmsPlanExpiresAt`. Backfill: `examsEnabled=true`, `lmsEnabled=false`.
- `LmsCourse`: `isPublic: Boolean @default(false)`, `price: Float?` (CLP; `null`/`0` = gratis).
- `PlanLimits`: drop `@@unique([plan])` → `@@unique([plan, planCode])`. Planes heredados usan `planCode: null`.
- `User`: `activationToken: String? @unique`, `activationTokenExp: DateTime?` (TTL 24h).
- `LmsOrder`: orden B2C con `studentRut`, `studentName`, `studentLastname`, `studentEmail`, `courseId`, `amount`, `status: OrderStatus`, `mpPreferenceId`, `mpPaymentId @unique`, `enrolledUserId`, `enrollmentId`.
- `enum OrderStatus { PENDIENTE, APROBADO, RECHAZADO }`.

### Gating de producto por flag (Fase 3)

- **Helper**: `src/features/auth/lib/institution-flags.ts` — `getInstitutionFlags(institutionId, plan)` lee `examsEnabled`/`lmsEnabled` con fallback al heurístico `plan !== 'FREE'` (defensa si la migración no corrió).
- **JWT/sesión**: `next-auth.d.ts` y `auth.ts` (callbacks `jwt` y `session`) propagan los flags. Carga via `getInstitutionFlags` en el `authorize` y en el callback `jwt` (rama google).
- **Proxy** (`src/proxy.ts`): gating rápido en Edge runtime — si `/{slug}/aula/*` y `lmsEnabled=false` (excepto SuperAdmin) → redirect a `/{slug}/settings?notice=lms_disabled`. Rutas públicas por slug: `/{slug}/cursos/*` y `/{slug}/checkout/*` se identifican via `isPublicBySlugPath`. `/examen/activar` se agrega como excepción pública (token en query).
- **Sidebar** (`src/features/dashboard/components/Sidebar.tsx`): items con `requiresLms: true` (`/aula`, `/aula/clases`) se filtran si `lmsEnabled=false`. SuperAdmin ve todo siempre.
- **Layout estudiante** (`src/app/(students)/students/layout.tsx`): `hasLms` ahora lee `flags.lmsEnabled` en lugar del heurístico por `plan`.

### Catálogo y checkout B2C (Fase 4)

- **Catálogo público** `/{slug}/cursos`: server component. Lista cursos con `isPublic=true && published=true`. `src/features/lms/components/PublicCourseCard.tsx` para el grid; `src/shared/components/seo/schemas.ts` agrega `courseSchema()` (schema.org/Course) y se inyecta como JSON-LD ItemList en la grilla y como Course individual en el detalle. `generateMetadata` con SEO institucional.
- **Detalle curso** `/{slug}/cursos/[courseId]`: preview de módulos/lecciones, precio, CTA → checkout. JSON-LD Course.
- **Layout público** `src/app/(public)/[slug]/layout.tsx`: header minimal con logo Aulika + nombre institución + link a cursos. `notFound()` si la institución está inactiva o no existe.
- **Checkout** `/{slug}/checkout/[courseId]`: `CheckoutForm.tsx` (cliente, RHF + Zod) con `RutField` + nombre + apellido + email + acceptTerms. Llama a `createLmsCheckoutPreference(slug, data)` que valida Zod, anti-IDOR (RUT/email no en otra institución), crea `LmsOrder` en PENDIENTE y llama a `createPreference` (Checkout Pro). Redirige a `init_point` de MercadoPago.
- **Éxito** `/{slug}/checkout/[courseId]/exito`: `OrderStatusPoller` (cliente) consulta `getLmsOrderStatus(orderId)` cada 3s, máx 20 intentos. Cuando la orden pasa a APROBADO y el webhook ya creó el `User`, expone el `activationToken` y muestra CTA directo a `/examen/activar?token=...`. Si el polling expira, muestra fallback "Ya recibí el email".
- **Activación** `/examen/activar`: server component que valida `token` (presencia + `activationTokenExp > now`) + render de `ActivationForm` (RHF + Zod, password min 8 + mayusc + num + confirm). Action `activateB2cAccount` hashea password con bcrypt, actualiza `User` (limpia tokens), vincula `LmsOrder.enrolledUserId` huérfanos, abre sesión jose (`createStudentAuthSession`) y redirige a `/students/dashboard`.

### Schemas y actions nuevos

- `src/features/subscriptions/schemas/b2c-checkout.schemas.ts` — `b2cCheckoutSchema` y `b2cActivatePasswordSchema`.
- `src/features/lms/actions/b2c-orders.ts` — `createLmsCheckoutPreference(slug, data)` + `getLmsOrderStatus(orderId)`.
- `src/features/lms/actions/b2c-activation.ts` — `activateB2cAccount(data)`.
- `src/features/lms/lib/activation-token.ts` — helper `generateActivationToken()` (random 32 bytes hex + TTL 24h), reutilizable por el webhook B2C.
- `src/features/subscriptions/lib/mercadopago.ts` — agregada `createPreference()` para pago único (Checkout Pro B2C) con la firma completa `item/payerName/payerSurname/backUrls/notificationUrl`. NO TOCAR `createPreapproval` (Fase 2 B2B).

### Tests (Fase 6)

- `src/features/auth/lib/__tests__/institution-flags.test.ts` (5 tests) — flag real + fallback por plan + fallback si Prisma falla.
- `src/features/subscriptions/schemas/__tests__/b2c-checkout-schemas.test.ts` (12 tests) — RUT K, email, terms, password rules.
- Total suite: 270/270 pasando.

### Aulika Online — Vitrina PAES y Pack Completo (Fase 7)

Habilita la comercialización directa de cursos B2C por parte de Aulika a través de la institución interna `aulika-online` (plan `INSTITUCIONAL`, `lmsEnabled=true`, `slug: aulika-online`, UUID fijo `9a8b7c6d-5e4f-3a2b-1c0d-9e8f7a6b5c4d`).

- **Constantes compartidas** — `src/features/lms/lib/aulika-online-bundle.ts` exporta `AULIKA_ONLINE_INSTITUTION_SLUG`, `AULIKA_ONLINE_PAES_CATEGORY_ID` (`8b1b1f8e-4f3d-4d2e-9f8a-7c6b5a4d3e2f`), `AULIKA_ONLINE_INDIVIDUAL_COURSE_IDS` (7 UUIDs) y los precios `AULIKA_ONLINE_BUNDLE_PRICE_CLP` (450.000) / `AULIKA_ONLINE_INDIVIDUAL_PRICE_CLP` (99.990). El seeder y el webhook importan de acá (DRY).
- **Seeder** — `prisma/seeders/aulika-online.ts` (idempotente, UUIDs fijos). Crea la institución, 1 profesor (`profesor.online@aulika.cl` / `Online2026!`), la categoría `PAES` (con `isBundle=true`, `bundlePrice=450.000`, `isPublic=true`) y los 7 cursos PAES (Matemática M1, Matemática M2, Competencia Lectora, Biología, Química, Física, Historia y Ciencias Sociales) con módulos y lecciones reales (TEXTO) basadas en temario DEMRE. Los 7 cursos se asocian a la categoría PAES vía `LmsCourseCategory`. Módulos/lecciones se reescriben por `deleteMany + create` (no tienen unique key natural).
- **CLI** — `prisma/seeders/aulika-online-cli.ts` y comando `pnpm db:seed:online`. Registrado en `prisma/seed.ts` y en el `build` script (`package.json:9`).
- **Webhook bundle** — `src/app/api/webhooks/mercadopago-b2c/route.ts` en `fulfillB2cOrder` resuelve el producto vía `resolveOrderProduct(tx, orderId)` (lee `LmsOrder.kind`, `course` y `category` anidados). Si `kind=CATEGORY_BUNDLE`, autoinscribe al alumno en TODOS los `LmsCourseCategory.courseId` de la categoría. Si `kind=COURSE`, inscribe solo al course único. Todo dentro de la misma `$transaction`. Idempotente.
- **Conflict 3.1 resuelto (seeder vs toggle manual)** — `prisma/seeders/plan-codes.ts` filtra el backfill con `where: { plan, lmsPlanCode: null }`, de modo que solo escribe en instituciones sin `lmsPlanCode` seteado. Los toggles manuales del SuperAdmin ya no son pisados.
- **Edición de `isPublic` / `price` en LMS** — `src/features/lms/actions/courses.ts`: `toggleLmsCourseSetting` rechaza `isPublic` y `updateLmsCoursePrice` rechaza cambios de precio si la institución no es `aulika-online` (excepto SuperAdmin). Helper `assertCanSellCourses(slug, isSuperAdmin)` en `aulika-online-bundle.ts`. La UI en `LmsCourseEditorClient` oculta los controles B2C para instituciones distintas a `aulika-online`; el precio se edita solo desde el modal "Editar Curso".

### Aulika Online — Categorías LMS y packs flexibles (Fase 8)

- **CRUD de categorías** — `/[slug]/aula/categorias` (Admin). `LmsCategory { id, name, slug, isBundle, bundlePrice, isPublic, ... }` y `LmsCourseCategory` (junction N a N). Actions: `createLmsCategory`, `updateLmsCategory`, `deleteLmsCategory`, `setCourseCategories` (diff contra el set actual). UI en `LmsCategoriesListClient` + `LmsCategoryDialog`.
- **Multi-select en editor de curso** — `CourseCategoriesPanel` (en `LmsCourseEditorClient`) lista las categorías disponibles con buscador y permite marcar/desmarcar; guarda vía `setCourseCategories` con diff atómico.
- **Venta unificada (curso O pack, sin carrito)** — `LmsOrder.kind: 'COURSE' | 'CATEGORY_BUNDLE'`, `courseId` opcional, `categoryId` opcional. El checkout detecta según el producto: cursos individuales en `/checkout/[courseId]`, packs en `/checkout/category/[categoryId]`. Schema `b2cCheckoutSchema` con `discriminated union` (refine que valide presencia condicional). BackURLs distintas según `kind`.
- **Catálogo público `/cursos`** — URL plana única (sin scoping por institución). Banner arriba del pack (`LmsCategory` con `isBundle=true`, `bundlePrice != null`, `isPublic=true`); filtro por categoría abajo (`CategoryFilter` con chips que actualizan `?category=slug`); grid de `PublicCourseCard` con badges de categorías. La única institución autorizada a vender es `aulika-online`, resuelta server-side vía `getB2cVendorInstitution()` en `aulika-online-bundle.ts`.
- **Rutas planas (sin `[slug]`)** — `/cursos`, `/checkout/[courseId]`, `/checkout/[courseId]/exito`, `/checkout/category/[categoryId]`, `/checkout/category/[categoryId]/exito`. La URL pública no expone la institución vendedora; `createLmsCheckoutPreference(data)` ya no recibe slug.
- **Webhook con `kind`** — `resolveOrderProduct(tx, orderId)` resuelve el producto desde `LmsOrder` (no requiere 2 queries separadas); si `kind=CATEGORY_BUNDLE` lee `category.courses` (los `LmsCourseCategory.courseId`) y autoinscribe a todos en la misma transacción. Defensa en profundidad: si `product.institutionSlug !== 'aulika-online'` rechaza.
- **Eliminación del "course bundle"** — Antes había un `LmsCourse` "Pack Completo PAES" (`99a07384-b113-4ec2-a53b-c10bde486c90`) que ahora se despublica vía el seeder (`isPublic=false, published=false`). El modelo correcto es la categoría como pack: cualquier curso futuro puede ser bundle simplemente creando una categoría con `isBundle=true`.

### Catálogo público `/cursos`

- URL plana única; sin scoping por institución.
- Banner del Pack Completo arriba (lee `LmsCategory.isBundle=true`).
- Filtro de categorías abajo (chips con `?category=slug`).
- Cards con badges de categorías asignadas (`PublicCourseCard.categoryNames`).
- Resolución server-side del vendor: `getB2cVendorInstitution()` → `slug === 'aulika-online'`.
- No hay **single-page de tienda**: el card linkea directo al checkout (sin detail de catálogo).

### Sidebar — gating LMS unificado (Fase 8)

- `src/proxy.ts`: el gating LMS corre también para SuperAdmin (JWT no tiene `lmsEnabled` para SuperAdmin → la regla se aplica por institución visitada).
- `Sidebar.tsx`: `visibleLmsFilter = (item) => !item.requiresLms || lmsEnabled` (sin bypass de SuperAdmin).
- `src/app/(admin)/[slug]/layout.tsx`: pasa `flags.lmsEnabled` de la institución visitada al Sidebar (sin hardcodear `true` para SuperAdmin).
- `src/features/auth/lib/auth-guard.ts`: nueva función `requireLmsAccess(slug)` — defensa en profundidad: si la institución visitada NO tiene `lmsEnabled=true` (incluso para SuperAdmin), redirige a `/config?notice=lms_disabled`. Reemplaza `requireInstitutionPageAccess` en todas las páginas `/[slug]/aula/*`.

### Columna "Productos" en `/config/institutions`

- `getInstitutions` query incluye `lmsEnabled` y `examsEnabled`.
- Nueva columna "Productos" en la tabla con badges "Aula Virtual" / "Exámenes" (success si activo, outline si no).

## Centro de ayuda (`/[slug]/ayuda`)

Feature en `src/features/help/`:

- `lib/help-content.ts` — fuente de verdad del contenido de cada sección.
- `components/HelpGuide.tsx` — render (server). Profesor no ve secciones con `professorAccess: 'none'`; `'readonly'` se muestra sin pasos; `'scoped'` lleva badge "Tus grupos".

Capturas en `public/help/` con nombre `{seccion}-{admin|profesor}.webp`. Si falta variante `profesor`, se usa `admin` como fallback. Regenerar a 1280px ancho, formato webp ~80q tras cada rediseño.

Credenciales de prueba: admin `carlos.lopez@ulagos.cl`, profesor `pedro.soto@ippaci.cl`, contraseña `Admin2026!`.

## Planes y upgrade self-service

Plan en `AcademicInstitution.plan` (`Plan`: FREE · DOCENTE · COLEGIO · INSTITUCIONAL) + `planExpiresAt` + `customPlanId`.

- **Upgrade** — `/[slug]/upgrade` (`UpgradePlans`), solo Administrador.
- **Pago (Docente/Colegio)** — `upgradePlan()` en `subscriptions/actions/upgrade.ts`: crea `Subscription`, llama `createPreapproval` y redirige al `init_point` de MercadoPago. **Webhook `/api/webhooks/mercadopago` — NO TOCAR**; activa el plan automáticamente. Cambiar entre planes pagos cancela primero la suscripción MP vigente.
- **Institucional** — abre `QuoteDialog`, envía email de cotización al SuperAdmin vía Brevo (`sendEmail`).
- **Precios** — fuente de verdad: `subscriptions/lib/mercadopago.ts` (`PLAN_PRICES`, `getAutoRecurring`).

## InstitutionType y jerarquía académica

`AcademicInstitution.type` (`InstitutionType`: COLEGIO · LICEO_TECNICO · PREUNIVERSITARIO · UNIVERSIDAD · INSTITUTO_PROFESIONAL · CFT · OTRO) define las etiquetas de cara al usuario para `Program`, `CourseSection` y `AcademicPeriod`. Default `OTRO` para datos previos (no requiere backfill).

- **Fuente única (DRY)** — `src/shared/lib/academic-labels.ts`: `academicLabel(type)` devuelve los labels (Carrera/Nivel/Área…, Ramo/Asignatura/Materia…, Semestre/Año escolar/Proceso…); `INSTITUTION_TYPE_OPTIONS` alimenta todos los selects; `institutionTypeSchema` (z.enum derivado) reusa el enum en los schemas sin duplicar valores.
- **Dónde se setea** — `/registro/free` (`signupFreeSchema`), `/registro/colegio` y `/registro/docente` post-pago (`registrationSchema`), `/config/institutions` crear/editar (`institutionSchema`), `/[slug]/settings` (`institutionSettingsSchema`). Las actions persisten `type` vía `parsed.data` / spread `...rest` sin lógica extra.
- **Sidebar dinámico** — `[slug]/layout.tsx` pasa `institutionType` al `Sidebar`; la sección "Académico" muestra los 3 items (`/programs`, `/periods`, `/courses`) con labels según el tipo. `/[slug]/settings` revalida el layout al guardar, así que cambiar el `type` refresca el sidebar.
- **Modelo de Grupo** — `Group` tiene **Carrera** (`programId`), **Semestre** (`periodId`, nullable) y **Ramos** (los `CourseSection` con `groupId` = este grupo, relación 1:N). El formulario compartido `GroupForm` (`src/features/groups/components/GroupForm.tsx`) lo usan tanto el modal de `/[slug]/groups` como `NewGroupButton`; filtra los ramos disponibles por carrera+semestre (coherencia). `groups/actions/mutations.ts` persiste `periodId` y reasigna ramos (`updateMany` de `courseSection` con filtro anti-IDOR). El autocreate de materia en universidades (`courses/actions/mutations.ts`) hereda `periodId` en el grupo generado.
- **Asignación a Exámenes** — `ExamAcademicPicker` maneja la cascada (Carrera → Semestre → Ramo) en el modal de creación de exámenes. Seleccionar un ramo (CourseSection) auto-selecciona opcionalmente su `groupId` asociado. Los profesores están acotados (`courseSectionProfessorFilter`) a crear exámenes solo para los ramos donde dictan clases (`assertCourseSectionBelongsToProfessor`).

## Aula Virtual (LMS) — Fundamentos (Fase 1)

Feature en `src/features/lms/` y Route Group `src/app/(aula)/` para evolucionar Aulika a un LMS independiente pero integrable con el motor de exámenes.

### Modelos Prisma (prefijo `Lms*` para no colisionar con `CourseSection`)

- `LmsCourse` — curso del LMS, FK opcional a `CourseSection` (materia) y a `AcademicInstitution`.
- `LmsModule` — módulo dentro de un curso (`order`, `title`).
- `LmsLesson` — lección polimórfica (`LessonType`: VIDEO, DOCUMENTO, TEXTO, ENLACE, EXAMEN, TAREA, EN_VIVO). Soporta `videoAssetId` (Mux), `fileUrl` (Vercel Blob), `externalLink`, `contentJson` (Tiptap) y FK a `Exam` para embeber exámenes Aulika.
- `LmsEnrollment` — inscripción de estudiante a un curso (`@@unique([userId, courseId])`, `status` ∈ `ACTIVO | COMPLETADO | RETIRADO`).
- `LmsLessonProgress` — progreso por lección (`completed`, `lastSeenSec` para videos, `@@unique([userId, lessonId])`).

### Enums

- `LessonType`: VIDEO · DOCUMENTO · TEXTO · ENLACE · EXAMEN · TAREA · EN_VIVO.
- `EnrollmentStatus`: ACTIVO · COMPLETADO · RETIRADO.

### Integraciones externas

- **`src/shared/lib/mux.ts`** — wrapper lazy del SDK `@mux/mux-node`. Funciones: `createMuxDirectUpload`, `getMuxAssetFromUpload`, `getMuxAssetStatus`, `muxPlaybackId`, `deleteMuxAsset`. Requiere `MUX_TOKEN_ID` y `MUX_TOKEN_SECRET`. Cliente se inicializa on-demand para no romper el build sin envs.
- **`src/shared/lib/blob.ts`** — wrapper de `@vercel/blob`. Funciones: `uploadLmsFile`, `deleteLmsFile`, `listLmsFiles`. Limita a 25 MB y tipos permitidos (PDF, DOCX, XLSX, imágenes).
- **`src/features/lms/components/VideoPlayer.tsx`** — `@mux/mux-player-react` con autoplay, accent color del design system y callback de progreso.
- **`src/features/lms/components/DocumentViewer.tsx`** — iframe para PDFs y enlace para otros tipos.

### Rutas

- **Estudiante** (route group `(aula)/`, valida sesión jose):
    - `/aula` — lista de cursos inscriptos y disponibles
    - `/aula/cursos/[id]` — detalle del curso con módulos y lecciones
    - `/aula/cursos/[id]/leccion/[lessonId]` — visualizador de lección
- **Admin/Profesor** (route group `(admin)/[slug]/`):
    - `/[slug]/aula` — lista de cursos LMS
    - `/[slug]/aula/[id]` — editor con drag-and-drop de módulos

### Pendiente para Fase 2

- File upload directo a Vercel Blob desde el cliente para archivos > 1 MB.
- Editor de texto enriquecido Tiptap para lecciones `TEXTO`.

## Aula Virtual (LMS) — Fase 2: Tareas y Libro de Calificaciones

- Modelos: `LmsAssignment` (1:1 con lección TAREA), `LmsSubmission` (`@@unique([assignmentId, studentId])`), `LmsGradebookItem` (peso, tipo, vínculos a Exam o Assignment), `LmsGrade` (`@@unique([gradebookItemId, studentId])`). Enums `LmsSubmissionStatus`, `LmsGradebookItemType`.
- Cálculo en `src/features/lms/lib/gradebook.ts`: funciones puras de promedio ponderado escala chilena 1.0–7.0 con clipping, redondeo a 2 decimales y validación de suma de pesos. Tests unitarios en `__tests__/gradebook.test.ts` (28 tests).
- Actions: `assignments.ts` (CRUD asignación + submit + grade + list) y `gradebook.ts` (CRUD item + record grade + sync exam + lectura del gradebook del curso).
- `syncExamGrades` lee `Result` del examen vinculado y hace upsert de `LmsGrade` (idempotente, notas normalizadas).
- Migración: `prisma/migrations/20260629185111_lms_assignments_gradebook/`.

## Aula Virtual (LMS) — Fase 3: Foros y Notificaciones

- Modelos: `LmsForum`, `LmsForumThread`, `LmsForumPost` (con `parentPostId` para respuestas anidadas) y `LmsNotification` (Bell Icon in-app).
- Sanitización HTML/Markdown sin dependencias externas en `src/shared/lib/sanitize.ts` (whitelist de tags, validación de protocolos de URL, state machine para auto-cierre de tags). 23 tests XSS en `__tests__/sanitize.test.ts`.
- Notificaciones Brevo best-effort en `src/features/lms/lib/forum-notifications.ts`: fan-out a participantes + estudiantes inscriptos, fire-and-forget.
- Server actions: `src/features/lms/actions/forums.ts` (CRUD foro, hilo, post, pin/lock, soft-delete). Anti-IDOR en todas.
- Migraciones: `20260629191306_lms_forums`, `20260629191923_lms_notifications`.

## Aula Virtual (LMS) — Fase 4: Gamificación (Puntos, Rachas, Insignias)

- Modelos: `LmsStreak` (racha diaria + freeze tokens), `LmsBadge` (catálogo global, `criteria` JSON con reglas declarativas), `LmsUserBadge` (M:N estudiante-insignia con `awardedReason`), `LmsPointEvent` (log append-only con `dedupeKey` UNIQUE para idempotencia), `LmsLeaderboardOptOut` (privacidad del ranking por curso).
- Enum `LmsPointSource`: `LESSON_COMPLETED | ASSIGNMENT_SUBMITTED | ASSIGNMENT_GRADED | EXAM_PASSED | FORUM_POST | MANUAL | STREAK_BONUS`.
- **Engine**: `src/features/lms/lib/points-engine.ts` con API `awardPointsForEvent({userId, sourceType, amount, reason, sourceId, courseId, dedupeKey})`. Total puntos se calcula `SUM(amount) WHERE userId` al vuelo (evita drift). Acreditación + racha + badges en **una sola transacción** con manejo de P2002 para idempotencia.
- **Lógica pura de racha** en `src/features/lms/lib/streak.ts`: `computeStreakUpdate(state, activityAt)` testable sin DB. Reglas: día consecutivo +1, mismo día no cambia, gap 2 días con freeze token +1, gap >2 días reset a 1. Funciones puras con tests.
- **Criterios de insignia** en `src/features/lms/lib/badges.ts` + `user-stats.ts`: switch sobre tipos declarativos (`TOTAL_POINTS`, `LESSONS_COMPLETED`, `ASSIGNMENTS_SUBMITTED`, `EXAMS_PASSED`, `FORUM_POSTS`, `LONGEST_STREAK`).
- **Catálogo sembrado**: 8 badges iniciales en `prisma/seeders/gamification-badges.ts` (`BADGE_SEED`): primer paso, primera entrega, perfección inaugural, racha 7d, racha 30d, voz del aula, conversador, 100 puntos.
- **Esquema de puntos** (bajo balanceado): tarea +10, tarea calificada +5, examen aprobado +15, post foro +2.
- **Integración** (fire-and-forget con `void ... .catch(console.error)` en cada action existente):
    - `submitLmsAssignment` → +10 ASSIGNMENT_SUBMITTED + racha.
    - `gradeLmsSubmission` → +5 ASSIGNMENT_GRADED + racha.
    - `recordLmsGrade` (item manual) → +5.
    - `syncExamGrades` → +15 EXAM_PASSED solo si `score >= 4.0`.
    - `createLmsForumPost` → +2 FORUM_POST.
- **Server actions admin** en `src/features/lms/actions/gamification.ts`: `awardManualLmsPoints`, `createLmsBadge`/`updateLmsBadge`/`deleteLmsBadge`, `listLmsBadges`, `getMyAchievements`, `markBadgesSeen`, `getCourseLeaderboard`, `toggleLeaderboardOptOut`. Anti-IDOR con `requireInstitutionAccess` y `getStudentAuthSession`.
- **Tipos exportados** desde `actions/gamification.ts`: `AchievementBadge`, `LeaderboardEntry`, `LeaderboardData`, `MyAchievements`, `RecentPointEvent`. `BADGE_DEFINITIONS` en `lib/gamification.ts`.
- **Tests**: 36 nuevos tests unitarios (racha + badges + engine con Prisma mockeado). Total: **149/149 pasando**.
- Migraciones: `20260629203535_lms_gamification`, `20260629205142_lms_leaderboard_privacy`.

Feature en `src/features/demo/`. Institución `slug = 'aulika-demo'`, `isDemo = true`, plan FREE.

- **Acceso** — `/demo` → `DemoLoginCard` (credenciales visibles: `demo@aulika.cl` / `demo_aulika`) → panel `/aulika-demo` como Administrador.
- **Aislamiento** — `demoSessionId` generado en callback `jwt` de `auth.ts`, viaja en JWT y se guarda en `Exam.demoSessionId`. `demoExamFilter(user)` en `src/features/demo/lib/demo.ts` centraliza el filtro.
- **Limpieza** (tres mecanismos): (1) `signOut` borra exámenes del `demoSessionId`; (2) cada deploy ejecuta `prisma/seeders/demo.ts` que purga todos los exámenes de la institución demo; (3) cron diario `GET /api/cron/demo-reset` (`0 6 * * *` UTC, protegido con `CRON_SECRET`).
- **Producción** — seed corre en el build (`prisma migrate deploy && tsx prisma/seeders/demo.ts && next build`). `demo.ts` **no** está en `.vercelignore`.

## Seed

- **`pnpm db:seed`** (`prisma/seed.ts`) — 4 roles + SuperAdministrador. Credenciales desde `ADMIN_*` env vars.
- **`pnpm db:seed:local`** (`prisma/seeders/local-test.ts`) — 2 instituciones, grupos, admins, profesores, 10 estudiantes. Password: `Admin2026!`.
- **`pnpm db:seed:demo`** (`prisma/seeders/demo.ts`) — institución demo + purga exámenes acumulados. Idempotente. Corre también en el build.

## Tests End-to-End (Playwright)

Estructura en `tests/e2e/`:

```
tests/e2e/
├── global-setup.ts       ← autentica admin y superadmin, guarda cookies en .auth/
├── .auth/                ← cookies de sesión (gitignored)
├── public/               ← páginas sin auth (admin-login, student-login)
├── admin/                ← panel de institución autenticado como carlos.lopez@ulagos.cl
├── superadmin/           ← panel /config autenticado como ADMIN_EMAIL
└── student/              ← flujo de estudiante (login incluido en cada test)
```

**Credenciales de prueba (local-test seed):**

- Admin: `carlos.lopez@ulagos.cl` / `Admin2026!` → `universidad-de-los-lagos`
- Profesor: `laura.jimenez@ulagos.cl` / `Admin2026!`
- Estudiante: RUT `55.555.555-5` (juan.perez@test.cl)
- SuperAdmin: `ADMIN_EMAIL` / `ADMIN_PASSWORD` (env vars de `.env.local`)

**Prerrequisito:** `pnpm db:seed:local` debe haber corrido antes de ejecutar los tests.

## Aula Virtual (LMS) — Fase 5: Certificación y Analítica

### Modelos Prisma nuevos / extendidos

- `LmsCertificate` (id, userId, courseId, verificationCode UNIQUE, finalGrade, pdfUrl, qrCodeUrl, issuedAt, revokedAt). `@@unique([userId, courseId])` + `@@index([courseId, verificationCode])`.
- `LmsCourse.certificateEnabled: Boolean @default(false)` — emisión automática al aprobar examen.
- `LmsCourse.aiSummaryEnabled: Boolean @default(false)` — resúmenes IA en lecciones TEXTO.
- `LmsLesson.summaryJson: Json?` — `{ summary, keyPoints[], generatedAt }`.
- Migración: `20260629220708_lms_phase5_certificates_summary`.

### Certificados PDF + QR + Cloudinary

- **Deps nuevas** (autorizadas por usuario): `@react-pdf/renderer@4.5.1`, `qrcode@1.5.4`, `cloudinary@2.10.0`.
- **`src/shared/lib/cloudinary.ts`** — wrapper lazy. Lee credenciales de `AppConfig` (no env vars). Funciones: `uploadCertificatePdf`, `deleteCertificatePdf`, `isCloudinaryConfigured`. Sin credenciales → modo degradado (no rompe el flujo).
- **`src/features/lms/lib/certificate-pdf.tsx`** — plantilla A4 landscape con QR embebido. `generateCertificatePdfBuffer(input): Promise<Buffer>`.
- **`src/features/lms/lib/certificate-issuer.ts`** — `tryIssueCertificate(input)` idempotente, sin `'use server'` (reusable desde actions y hooks).
- **`actions/certificates.ts`** (Sonnet) extendido: `issueLmsCertificate` usa `tryIssueCertificate`. Retorna `{verificationCode, pdfUrl}`.
- **Hook fire-and-forget** en `syncExamGrades` (Fase 2): `if (normalizedScore >= 4.0) void tryIssueCertificate(...).catch(console.error)`. Solo emite si `course.certificateEnabled === true`.

### Configuración via `/config/settings` (SuperAdmin)

- `APP_CONFIG_KEY` extendido: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.
- `AppSettingsClient` reemplazó "IA próximamente" por card "Cloudinary — Almacenamiento de certificados" (3 inputs).
- Validación Zod ya cubre las 3 keys nuevas.

### Resúmenes IA con Gemini

- **`src/features/lms/lib/lesson-summarizer.ts`** — `summarizeLessonText(content)`. Valida 200-50000 chars, llama `generateText({model: google('gemini-2.5-flash')})`, parsea JSON tolerante, valida estructura.
- **`actions/lesson-summary.ts`** — `generateLessonSummary(slug, lessonId)` extrae texto de Tiptap JSON recursivo, llama summarizer, persiste. `getLessonSummary(lessonId)` para estudiante. `clearLessonSummary` para admin.

### Detección temprana (lib pura)

- **`src/features/lms/lib/at-risk-detector.ts`** — funciones puras testeables sin DB:
    - `identifyAtRiskStudents(enrollments, grades, options?)` → score 0-100 multi-factor (progressPct +40, inactividad +30, nota <4.0 +40), `riskLevel: BAJO|MEDIO|ALTO`.
    - `identifyInactiveStudents(progress, options?)` → usuarios sin actividad en N días.
    - `identifyFailingCourses(courseId, enrollments, grades, atRisk, gradeThreshold?)` → métricas agregadas.
- **`actions/analytics.ts`** refactorizado: `getCourseAnalytics` delega a `identifyAtRiskStudents`. Mantiene interface `AtRiskStudent` (con `lastname`) que la UI ya consumía.

### Tests (34 nuevos)

- `at-risk-detector.test.ts` (17), `lesson-summarizer.test.ts` (10), `cloudinary.test.ts` (7). Total suite: **183/183 pasando**.

### Verificación

- `devBuild` (Next.js build vía MCP JetBrains) → ✅ Compiled successfully, Finished TypeScript 5.3s, 58 rutas.
- `pnpm test:run` → ✅ 183/183.

### Fixes colaterales

- `LmsAnalyticsClient.tsx` — `RISK_BADGE: Record<RiskLevel,…>` con tipo `RiskLevel = 'BAJO'|'MEDIO'|'ALTO'`.
- `app/(aula)/aula/cursos/[id]/page.tsx` y `app/(admin)/[slug]/aula/[id]/page.tsx` — agregados `summaryJson: true` al `select` Prisma (requeridos por interface `LmsLesson` extendida).

## LMS — Lecciones basadas en enlaces (modelo vigente)

Reemplaza las antiguas Fases 1 (video Mux) y 6 (aula sincrónica Daily.co) por un modelo **100 % basado en enlaces**. Los docentes suben contenido apuntando a servicios externos (YouTube, Vimeo, Google Meet, Zoom) en lugar de subir archivos a Aulika o transmitir clases dentro de la plataforma. Esto elimina la dependencia de servicios pagos (Mux, Daily.co) y reduce la superficie operativa a uploads de documentos + URLs validadas.

### Reglas por tipo de lección (`LmsLesson.type`)

| Tipo | Antes | Ahora |
| --- | --- | --- |
| `TEXTO` | `<Textarea>` → JSON Tiptap minimal | Editor Tiptap completo (`TiptapEditor.tsx`): bold, italic, listas, headings, links, undo/redo. Output `JSONContent`. |
| `TAREA` | `<Textarea>` para instrucciones | Editor Tiptap para instrucciones; `dueAt` + `maxScore` sin cambios. |
| `DOCUMENTO` | `<Input type="file">` simple | Dropzone visual (`Dropzone.tsx`) con previsualización, MIME whitelist (PDF/DOC/DOCX/XLS/XLSX/PNG/JPG/WEBP), tope 25 MB. Sube via `uploadLessonDocument` (Vercel Blob). |
| `VIDEO` | Aviso "subida no disponible" + Mux upload | `<Input type="url">` validado por dominio (`parseVideoEmbedUrl`). Visor: iframe 16:9 (`VideoEmbed.tsx`). |
| `EN_VIVO` | Aviso "se programa desde Clases en vivo" + Daily.co | Selector Proveedor (Google Meet / Zoom) + `<Input type="url">` validado por dominio (`parseLiveSessionUrl`). Visor: tarjeta con botón "Unirme" + instrucciones (`LiveSessionLinkCard.tsx`). |
| `ENLACE` | Sin cambios | Sin cambios. |
| `EXAMEN` | Sin cambios | Sin cambios. |

### Validadores de URL (`src/features/lms/lib/lesson-url-validators.ts`)

Funciones puras sin DB, testeables:

- `parseVideoEmbedUrl(url): { kind: 'youtube' \| 'vimeo', embedUrl: string } \| null`
    - YouTube: acepta `youtube.com/watch?v=ID`, `youtu.be/ID`, `youtube.com/embed/ID`, `m.youtube.com/*`. Devuelve `https://www.youtube.com/embed/ID`.
    - Vimeo: acepta `vimeo.com/ID`, `player.vimeo.com/video/ID`. Devuelve `https://player.vimeo.com/video/ID`. Solo IDs numéricos.
- `parseLiveSessionUrl(url): { provider: 'google_meet' \| 'zoom' } \| null`
    - Google Meet: `meet.google.com`.
    - Zoom: `zoom.us`, `*.zoom.us`, `zoom.com`.
- `isValidExternalLinkForType(type, url): boolean` — wrapper que une los dos validadores anteriores según `LessonType`. Para `ENLACE` acepta cualquier URL válida.

El schema Zod (`lmsLessonSchema`) usa `.superRefine()` para validar `externalLink` por tipo: si `type ∈ {VIDEO, ENLACE, EN_VIVO}`, el link es obligatorio y debe pasar `isValidExternalLinkForType`.

### Schema Zod y server actions

- `src/features/lms/schemas/lms.schemas.ts` — `lmsLessonSchema` con `superRefine` por tipo. Sin campos Mux (`videoAssetId`/`videoUploadId` fueron dropeados de Prisma).
- `src/features/lms/actions/courses.ts` — `buildLessonPayload` arma el payload Prisma sin campos Mux; `externalLink` se persiste según `LINK_TYPES = ['VIDEO', 'ENLACE', 'EN_VIVO']`.
- `src/features/lms/actions/uploads.ts` — solo `uploadLessonDocument` (Vercel Blob). Las antiguas `requestMuxUpload` / `finalizeMuxUpload` fueron eliminadas.

### Migración Prisma

- `prisma/migrations/20260702000000_drop_lms_mux_and_phase6_models/migration.sql`:
    - Drop columnas `LmsLesson.videoAssetId` y `videoUploadId`.
    - Drop modelos `LmsLiveSession`, `LmsLiveAttendance`, `LmsLiveChatMessage`, `LmsWhiteboardSnapshot`.
    - Drop enums `LiveSessionStatus`, `LiveAttendanceRole`, `LiveRecordingStatus`.
    - Drop relaciones inversas en `User` y `LmsCourse`.

### Variables de entorno deprecadas

- `DAILY_API_KEY` y `DAILY_WEBHOOK_SECRET` — eliminadas de `APP_CONFIG_KEY` y `app-config.ts`. Si quedaron registradas en la tabla `AppConfig` (DB), son inertes (no se consumen). Limpieza opcional.
- `MUX_TOKEN_ID` y `MUX_TOKEN_SECRET` — ya no se usan en código (`src/shared/lib/mux.ts` fue eliminado). Las dependencias `@mux/mux-node` y `@mux/mux-player-react` en `package.json` quedaron como código muerto pero no rompen el build. Limpieza opcional.
- Cron `/api/cron/live-reminders` y webhook `/api/webhooks/daily` eliminados (rutas completas + entries en `vercel.json`).

### Auditoría

Las acciones `lms.live_session.{create,update,start,end,cancel,join,leave,recording_ready}` fueron removidas de `AUDIT_ACTION` (`src/features/audit/lib/actions.ts`).

### Tests

- `src/features/lms/lib/__tests__/lesson-url-validators.test.ts` (17 tests): YouTube (3 formatos + rechazos), Vimeo (2 formatos), Google Meet (2 formatos), Zoom (2 formatos + rechazos), `isValidExternalLinkForType` por tipo.
- Total suite: **297/297 pasando** (los ~70 tests de Fase 6 fueron eliminados con el código).

### Seeder de testing (`pnpm db:seed:aula`)

- Cubre LMS basado en enlaces. El bloque de Fase 6 (3 `LmsLiveSession` + attendances + chat + whiteboard) fue removido. La lección "Introducción a Python (video)" usa `externalLink: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'` en lugar de `videoAssetId`.

### Limitaciones conocidas

1. **Datos históricos irrecuperables**: lecciones que tenían `videoAssetId` apuntando a assets Mux previos dejan de funcionar. Los docentes deben re-pegar manualmente las URLs de YouTube/Vimeo. No hay script de migración de assets.
2. **Sin live nativo**: las clases sincrónicas dependen de Google Meet/Zoom (externos). Aulika no aporta chat, pizarra, ni grabación para estas sesiones — todo eso vive en el proveedor elegido.

### Verificación

- `pnpm type-check` ✅ 0 errores.
- `pnpm lint` ✅ 0 errores nuevos (los 6 errors + 77 warnings son pre-existentes en otros archivos).
- `pnpm test:run` ✅ 297/297.
- `pnpm build` ✅ todas las rutas `/aula/*` y `/students/aula/*` siguen compilando; las rutas de live y los cron/webhooks de Fase 6 ya no aparecen.

## Notificaciones in-app del estudiante (campanita + 3 triggers)

Reemplaza el item "Notificaciones" del sidebar del estudiante por una **campanita desplegable en el `StudentTopBar`** (justo antes del avatar). El menú es un dropdown sin links: cada item solo se puede **marcar como leída** o **eliminar** (cruz a la derecha). Página `/students/notificaciones` y componente `NotificationsListClient` fueron eliminados.

### Migración

- `prisma/migrations/20260701093000_lms_notification_updated_at/migration.sql` — agrega `updatedAt @updatedAt` y `dedupeKey String?` (indexado) a `LmsNotification`. `updatedAt` se actualiza automáticamente cuando el estudiante marca leída (patrón `@updatedAt`); `dedupeKey` permite deduplicar entre runs del cron.

### Schema

- `LmsNotification.updatedAt: DateTime @updatedAt` — sustenta el cron de limpieza "24h después de marcar leída".
- `LmsNotification.dedupeKey: String?` + `@@index([dedupeKey])` — clave para deduplicar entre ejecuciones del cron. Convención: `<TYPE>:<scopeId>` (ej: `ASSIGNMENT_DUE_SOON:<assignmentId>:<userId>`).

### UI (`StudentTopBar` + `NotificationBell`)

- **`src/shared/components/layout/StudentTopBar.tsx`**: reemplaza el `<Link href="/students/notificaciones">` por `<NotificationBell initialNotifications={...} initialUnreadCount={...} />`. Cambia prop `notificationCount: number` por `notifications: LmsNotificationItem[]` + `unreadCount: number`. Quita la rama `/students/notificaciones` de `resolvePageTitle`.
- **`src/features/lms/components/NotificationBell.tsx`**: dropdown con header (título + "Leer todo" + cerrar), lista scrolleable (`max-h-96`), cada item con mensaje + `timeAgo` + botón "Marcar leída" (solo si no leída) + botón "X" para eliminar. Cierra al click-outside.
- **`src/features/students/components/layout/StudentSidebar.tsx`**: quita `NotificationLink` y prop `notificationCount`. El sidebar ya no muestra ningún item de notificaciones.

### Server actions (`src/features/lms/actions/notifications.ts`)

- **`markNotificationRead(id)`** — sin cambios. Set `read=true`, dispara `updatedAt = now` automáticamente.
- **`markAllNotificationsRead()`** — sin cambios.
- **`deleteNotification(id)`** (nuevo) — `deleteMany` filtrado por `id` + `userId` (anti-IDOR).
- ~~`getStudentNotifications`~~ — eliminado (era huérfano tras quitar la página).

### 3 tipos de notificación

- **Constantes y formatters** en `src/features/lms/lib/notification-events.ts` (lib pura testeable):
  - `NOTIFICATION_TYPE.LMS_PLAN_EXPIRING` → "Tu plan del Aula Virtual vence el {fecha larga}."
  - `NOTIFICATION_TYPE.COURSE_NEW_ITEM` → "{docente} agregó '{lección}' a {curso}." (fallback "Un docente" si no hay nombre)
  - `NOTIFICATION_TYPE.ASSIGNMENT_DUE_SOON` → "La tarea '{assignment}' de {curso} vence el {fecha corta}."
- **Fan-out** en `src/features/lms/lib/notification-fanout.ts`: 3 funciones fire-and-forget (`void .catch(console.error)`) que crean `LmsNotification` con `dedupeKey` cuando aplica.

### Triggers

- **`COURSE_NEW_ITEM`** — en `src/features/lms/actions/courses.ts` → `createLmsLesson`:
  - Inmediatamente después de `prisma.lmsLesson.create`, dispara `void notifyCourseNewItem({...})` con `teacherUserId = ctx.userId`, `lessonTitle`, `courseId`, `courseTitle`.
  - Fan-out a todos los `LmsEnrollment` con `status='ACTIVO'` del curso.
  - Una vez por lección creada (sin dedupe, porque la inserción ocurre 1 sola vez por lección).

- **`LMS_PLAN_EXPIRING`** + **`ASSIGNMENT_DUE_SOON`** — cron diario `/api/cron/student-notifications`:
  - **`LMS_PLAN_EXPIRING`**: ventana `lmsPlanExpiresAt` entre hoy+6d y hoy+8d. `dedupeKey = LMS_PLAN_EXPIRING:<institutionId>`. Por cada institución, si ya existe la dedupeKey, skip; si no, fan-out a enrollados activos del LMS.
  - **`ASSIGNMENT_DUE_SOON`**: ventana `LmsAssignment.dueAt` entre hoy+12h y hoy+30h. Filtra assignments donde el estudiante ya entregó. `dedupeKey = ASSIGNMENT_DUE_SOON:<assignmentId>:<userId>`. Cron diario a las 9am UTC (`0 9 * * *`) asegura 1 sola captura por tarea gracias a la ventana fija.
  - Idempotente vía `dedupeKey` + check `findFirst` antes del insert.

### Cron de limpieza (`/api/cron/cleanup-read-notifications`)

- **Job**: `deleteMany where: { read: true, updatedAt: { lt: now - 24h } }`.
- **Schedule**: `0 5 * * *` (5am UTC).
- **Usa `updatedAt`** (no `createdAt`) para garantizar el contrato "24h después de marcar como leída", no "24h después de creada".

### `vercel.json`

```json
{ "path": "/api/cron/cleanup-read-notifications", "schedule": "0 5 * * *" },
{ "path": "/api/cron/student-notifications",        "schedule": "0 9 * * *" }
```

### Tests (`src/features/lms/lib/__tests__/notification-events.test.ts`)

- 6 tests puros: constantes de `NOTIFICATION_TYPE`, formato de fechas, fallback `Un docente` para `teacherName` null/vacío.
- Total suite: 324/324 pasando (incremento +6 desde 270 — los demás tests existentes siguen pasando).

### Verificación

- `pnpm type-check` ✅ 0 errores.
- `pnpm lint` ✅ 0 errores en archivos tocados (los 4 warnings pre-existentes siguen iguales).
- `pnpm test:run` ✅ 324/324.
- `pnpm exec next build` ✅ compiló correctamente. La ruta `/students/notificaciones` ya no aparece en el build output.

### Notas operacionales

- **No romper** los tipos existentes (`BADGE_ACK`, `LIVE_SESSION_SCHEDULED`) — siguen funcionando, ahora sin link y con opción de eliminar.
- Para el fan-out en `createLmsLesson` se hace una query extra (`prisma.lmsModule.findUnique` con `course.title`) — evita una llamada adicional `prisma.user.findUnique` pasando el `teacherName` como argumento al action.
- Los crones son best-effort. Si Vercel pierde una corrida, la siguiente ventana los captura (con dedupe, no se duplica).
- **No commitear sin pedido explícito de Edgardo.**

## Variables de entorno requeridas

**Flujo completo de examen del estudiante:** Los tests en `student/exam-flow.spec.ts` se saltean automáticamente si no hay un examen activo asignado al grupo del estudiante. Para activar estos tests: crear un examen publicado y asignarlo al grupo de Juan Pérez.

## Variables de entorno requeridas

```bash
DATABASE_URL           # PostgreSQL connection string
AUTH_SECRET            # NextAuth secret
AUTH_URL               # URL base de la app
STUDENT_SESSION_SECRET # Secret para cookies de estudiante (jose)
ADMIN_PASSWORD         # Password del SuperAdmin (seed)
ADMIN_NAME             # Nombre del SuperAdmin
ADMIN_LASTNAME         # Apellido del SuperAdmin
ADMIN_EMAIL            # Email del SuperAdmin
ADMIN_RUT              # RUT del SuperAdmin (sin puntos ni guión)
CRON_SECRET            # Secret para los cron de Vercel
```

## Modelos Prisma

| Modelo                | Descripción                                                          |
| --------------------- | -------------------------------------------------------------------- |
| `UserRole`            | Catálogo de 4 roles                                                  |
| `AcademicInstitution` | Institución con `slug` único, `isDemo`, `plan`, `demoSessionId`      |
| `User`                | Email único, RUT único, FK a rol, institución, grupo                 |
| `Group`               | Grupo de estudiantes, M2M con exámenes                               |
| `Exam`                | Examen con timeLimit, notas, anti-cheat, grupos M2M, `demoSessionId` |
| `Question`            | Pregunta con puntos y orden                                          |
| `Option`              | Opción con `isCorrect`                                               |
| `Answer`              | Respuesta del estudiante (unique por `attemptKey + questionId`)      |
| `Result`              | Resultado final (unique por `studentId + examId`)                    |

## Convenciones de RUT chileno

- Almacenado sin puntos ni guión (ej: `270396356`).
- Validación matemática del dígito verificador obligatoria.
- Utilities: `@/shared/lib/rut.ts`. Input UI canónico: `RutField` en `@/shared/components/ui/rut-field.tsx`.

## SEO y Sitemap (REGLA)

**Sitemap automático:** Next.js genera `/sitemap.xml` desde `src/app/sitemap.ts`. Siempre que **se agregue una nueva página pública**, actualizar `sitemap.ts` para incluirla. Las rutas públicas linkeadas en el footer **DEBEN estar en el sitemap**. No esperar a que se descubra después.

Rutas **NO indexables** (excluir del sitemap):

- Rutas protegidas: `/[slug]/*`, `/config/*`, `/examen/[examId]/*`
- Rutas de autenticación: `/auth/*`, `/login`, `/examen/login`
- API routes: `/api/*`
- Páginas operacionales: `/recursos/estado`, `/demo/exam`, `/registro/*/exito`, `/registro/*/error`

**Schema Markup (JSON-LD):** componentes en `src/shared/components/seo/`:

- `JsonLd.tsx` — componente genérico para inyectar cualquier schema
- `schemas.ts` — exports: `organizationSchema`, `softwareApplicationSchema`, `websiteSchema`, `faqSchema(faqs)`

La Home importa y renderiza los 4 schemas. Agregar schema específico a nuevas páginas importantes (blog posts → `Article`, páginas de precio → `PriceSpecification`).

**Protección de rutas con X-Robots-Tag:** el proxy (`src/proxy.ts`) emite `X-Robots-Tag: noindex, nofollow` en todas las respuestas de rutas protegidas (admin panels, `/config`, `/perfil`). No requiere mantenimiento manual.

**H1 semántico en Landing:** `L3Hero` tiene un `<h1 className="sr-only">` con keywords para Google, seguido de un `<p aria-hidden="true">` con el texto de impacto visual. No cambiar esta estructura en rediseños.

**robots.txt:** bloquea `/api/`, `/config/`, `/examen/`, `/perfil/`, `/demo/exam`, `/login`, `/recursos/estado` y bots de IA (GPTBot, Google-Extended, CCBot, anthropic-ai, Claude-Web).

**FAQ SEO:** `L3FAQ` exporta `FAQS` (array) y `FaqItem` (tipo). La Home importa `FAQS` para alimentar tanto `<L3FAQ faqs={FAQS} />` como `<JsonLd data={faqSchema(FAQS)} />`. Si cambian las preguntas, solo actualizar `L3FAQ.tsx`.

## Páginas Legales

Ubicadas en `src/app/(public)/empresa/`:

- `/empresa/privacidad` — Política de Privacidad y Tratamiento de Datos
- `/empresa/terminos` — Términos y Condiciones de Uso

**Marco legal cubierto:**

- Ley Nº 19.628 (vigente) + Ley Nº 21.719 (vacatio legis hasta dic. 2026)
- Decreto Exento MINEDUC Nº 678/2018 (protección datos escolares)
- Ley Nº 17.336 Propiedad Intelectual
- Boletín Nº 16821-19 (Proyecto IA Chile)

**Datos legales de la empresa:**

- Razón social: Crow Advance EIRL — RUT 27.039.635-6
- Representante: Edgardo Ruotolo Cardozo
- Domicilio: Centenario 493, Chonchi, Chiloé, Región de Los Lagos, Chile
- Email legal: edgardoruotolo@crowadvance.com

**Puntos clave:**

- Crow Advance = Encargado del Tratamiento; Institución educativa = Responsable
- IA solo para generación de preguntas (MCP), con supervisión humana obligatoria
- IA no corrige ni califica exámenes (calificación matemática determinista)
- Servidores en EE.UU. (Vercel + Neon / AWS us-east-1) — declarado en Política de Privacidad
- Derechos ARCO vía institución o directo a edgardoruotolo@crowadvance.com (plazo 15 días hábiles)
- SLA 99% mensual, notificación de brechas en 72 horas
- Al término del contrato: 30 días para exportar datos, luego eliminación segura

**Footer:** links "Privacidad" y "Términos" agregados en la barra inferior con RUT y razón social legal.

## Documentación (REGLA)

Siempre que se actualice el proyecto, **documentar el cambio en `CLAUDE.md` o `AGENTS.md`** en la sección correspondiente, como parte de la misma tarea. Mantener ambos sincronizados.

Al finalizar, también hacer append en Obsidian:

```bash
cat >> "/Users/edgardoruotolo/SitesDoc/nextjs_projects/next-quiz/next-quiz.md" << 'EOF'

### $(date +%Y-%m-%d) — TÍTULO DEL CAMBIO
- Descripción del cambio realizado
EOF
```

## Convenciones de Git

- Mensajes de commit en inglés, imperativo, minúsculas: `feat: add user auth`, `fix: null session crash`.
- Commits atómicos y descriptivos — enfocados en el "por qué".
- NUNCA `git push --force`, `git reset --hard` sin confirmación explícita.
- NUNCA `--no-verify` al commitear.
- NUNCA commitear archivos `.env`, credenciales o secretos.
- No agregar co-autoría de AI en commits salvo que se pida explícitamente.

**Formato de commit específico del proyecto (alternativo, requerido por el usuario):**

```
Tarea: {descripción en español}
Fecha: {DD-MM-YYYY}
Versión: {X.Y.Z}
```

No commitear ni pushear sin pedido explícito del usuario.

## Notas por proveedor

Este archivo aplica a **todos** los agentes IA. Las siguientes son notas de uso específico:

- **Claude Code** — usa preferentemente `CLAUDE.md` (mismo contenido + extras como gstack/CodeGraph). Puede leer `AGENTS.md` también.
- **Cursor / Windsurf / Aider / Codex / otros** — usan `AGENTS.md` directamente.
- Si el agente tiene acceso a **MCP `codegraph`**, usarlo ANTES de editar para entender la arquitectura (`codegraph_explore`, `codegraph_search`, `codegraph_callers`, `codegraph_callees`).
