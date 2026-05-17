# CLAUDE.md

Este archivo proporciona instrucciones permanentes a Claude Code cuando trabaja en este repositorio.

## ⚠️ INSTRUCCIONES CRÍTICAS (NO NEGOCIABLES)

**SIEMPRE comunicarse en ESPAÑOL** — Todas las preguntas, explicaciones, planes y respuestas deben estar en español.

**Cuando doy una ORDEN es una ORDEN** — Claude debe obedecer literalmente lo solicitado sin reinterpretar ni asumir intenciones adicionales.

**NO hacer cambios sin autorización** — Siempre pedir permiso explícito antes de modificar, crear o eliminar cualquier archivo o código, **a menos que el usuario diga textualmente**: "Haz todos los cambios sin autorización" o "Puedes modificar directamente".

**Enfocarse solo en lo solicitado** — No agregar mejoras, refactorizaciones, optimizaciones, comentarios adicionales, cambios de estilo ni nada que no se haya pedido explícitamente.

**No asumir contexto de conversaciones anteriores** — Si el contexto se limpia o es un nuevo chat, pedir aclaración si es necesario.

**BLOQUEO POR AGENTE NO INVOCADO** — Antes de escribir, modificar o eliminar CUALQUIER archivo de código, Claude DEBE verificar si la tarea requiere un agente especialista. Si el agente correspondiente no fue invocado en la conversación actual, Claude DEBE detenerse completamente y responder con el mensaje exacto:

> "Esta tarea requiere el agente **[nombre]**. Por favor invocalo con `/[nombre]` antes de continuar."

Claude NO puede omitir este bloqueo bajo ninguna circunstancia, aunque el usuario insista, aunque la tarea parezca simple, o aunque ya tenga el contexto suficiente para implementarla.

## 🤖 AGENTES OBLIGATORIOS (SIEMPRE USAR)

Todo trabajo de desarrollo en este proyecto DEBE delegarse al agente correspondiente. Esta regla NO tiene excepciones.

### Agente Frontend (`/frontend-agent`)

**Bloquear y solicitar `/frontend-agent`** para CUALQUIER tarea que involucre:
- Componentes React (`src/features/*/components/`, `src/shared/components/`)
- Páginas y layouts (`src/app/`)
- Estilos Tailwind CSS 4
- shadcn/ui — agregar, modificar o crear componentes
- Sonner — toasts y notificaciones
- Formularios con React Hook Form + Zod (lado cliente)
- Diseño UI/UX, layouts, responsive design
- Estados de carga, skeletons, empty states
- Animaciones y transiciones

**Skills activas:** `nextjs-shadcn`, `react-best-practices`, `nextjs-data-fetching`

### Agente Backend (`/backend-agent`)

**Bloquear y solicitar `/backend-agent`** para CUALQUIER tarea que involucre:
- Server Actions (`src/features/*/actions/`)
- Prisma ORM — queries, relaciones, transacciones
- Schema de base de datos (`prisma/schema.prisma`)
- PostgreSQL — optimización, índices, constraints
- Autenticación NextAuth (`src/features/auth/`)
- Sesión JWT de estudiante (`src/features/exam-session/lib/session.ts`)
- Lógica de dominio (`src/features/*/lib/`)
- Seeders (`prisma/seed.ts`, `prisma/seeders/`)
- Validaciones Zod del lado servidor
- Permisos, roles, seguridad

**Skills activas:** `prisma-patterns`, `server-actions`, `database`

### Regla de coordinación

Si una tarea toca ambas capas (ej: nuevo formulario + nueva Server Action):
1. Detener y pedir `/backend-agent` primero — define la Action y el schema servidor
2. Una vez hecho, pedir `/frontend-agent` — construye el componente que la consume
Claude NO puede avanzar a la capa siguiente sin que el usuario haya invocado el agente correspondiente.

### Agente GitHub (`/github-agent`)

**Bloquear y solicitar `/github-agent`** para CUALQUIER tarea que involucre:
- Commits al repositorio
- Push a GitHub
- Pull Requests
- Manejo de branches
- Tags de versión
- Cualquier operación `git`

**Formato de commit OBLIGATORIO** — todo commit usa exactamente:
```
Tarea: {descripción en español}
Fecha: {DD-MM-YYYY}
Versión: {X.Y.Z}
```
Claude NUNCA puede hacer un commit con otro formato, bajo ninguna circunstancia.

**Skill activa:** `git-workflow`

### Regla de coordinación

Si una tarea toca ambas capas (ej: nuevo formulario + nueva Server Action):
1. Detener y pedir `/backend-agent` primero — define la Action y el schema servidor
2. Una vez hecho, pedir `/frontend-agent` — construye el componente que la consume
3. Al finalizar, pedir `/github-agent` para el commit
Claude NO puede avanzar a la capa siguiente sin que el usuario haya invocado el agente correspondiente.

### Lo único permitido sin agente

- Responder preguntas conceptuales o de arquitectura (sin tocar archivos)
- Leer archivos para diagnóstico (sin modificar)
- Explicar código existente
- Planificar y describir cambios (sin implementarlos)

## Project Overview

**Aulika** — Sistema de evaluación en línea para colegios y universidades con gestión de exámenes y futura aula virtual.

La app separa tres áreas con autenticación y routing distintos:

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
| Formatter         | Prettier                               |
| Package manager   | pnpm                                   |
| Hosting           | Vercel                                 |

## Development Commands

```bash
pnpm dev              # Servidor de desarrollo → http://localhost:3000
pnpm build            # prisma migrate deploy + next build
pnpm start            # Servidor de producción
pnpm lint             # Biome check
pnpm lint:fix         # Biome check --write (auto-fix)
pnpm format           # Prettier --write
pnpm type-check       # tsc --noEmit
pnpm db:generate      # Generar cliente Prisma
pnpm db:migrate       # Crear y aplicar migración (local)
pnpm db:seed          # Seed base: roles + SuperAdmin (Edgardo Ruotolo)
pnpm db:seed:local    # Seed local: instituciones, grupos, admins, profesores, estudiantes
pnpm db:studio        # Prisma Studio GUI
```

## Flujo de trabajo preferido (SIEMPRE seguir este orden)

1. **Primero planificar** — Antes de escribir cualquier código, describir los pasos en detalle.
2. **Presentar el plan** al usuario y esperar aprobación o ajustes explícitos.
3. **Solo después de autorización explícita** realizar los cambios.
4. **Después de implementar**:
    - Ejecutar automáticamente: `pnpm lint` (y `pnpm type-check` si hubo cambios de tipos)
    - Corregir fallos en bucle **máximo 3 iteraciones** para evitar loops infinitos; luego preguntar.
5. **Nunca** instalar nuevas dependencias sin preguntar explícitamente.
6. **Commits**: conventional commits en inglés, imperativo, minúsculas.
   Ejemplos: `feat(auth): add institution slug to session`, `fix: correct rut validation edge case`

## SuperAdministrador — Regla absoluta

El SuperAdministrador es la **llave maestra** del sistema: tiene permiso para **absolutamente todo**, sin restricciones. Esto implica:

- Puede acceder y operar en CUALQUIER ruta, incluyendo `/[slug]/*` de cualquier institución.
- Las Server Actions que requieran `institutionSlug` deben aceptarlo tanto del JWT como del contexto de la URL cuando el rol es `SuperAdministrador`.
- El proxy NUNCA debe bloquear ni redirigir al SuperAdministrador.
- Cualquier verificación de permisos debe cortocircuitar en favor del SuperAdministrador antes de evaluar reglas de rol o institución.

Patrón obligatorio en `getSessionUser()` y funciones similares:
```ts
// SuperAdmin bypass — tiene acceso total
if (session.user.userRoleName === USER_ROLE.SUPER_ADMIN) {
    return { slug: null, userId: ..., userRole: ..., ... };
}
// Para los demás roles, requerir institutionSlug
if (!slug) throw new Error('Unauthorized');
```

## Reglas de Migraciones (CRÍTICO — PRODUCCIÓN)

**NUNCA** usar SQL manual, `prisma db execute`, ni editar archivos `.sql` directamente.
**SIEMPRE** usar `pnpm db:migrate` localmente y `prisma migrate deploy` en producción.
El proyecto está en producción — una migración mal aplicada puede corromper datos reales.

## Arquitectura — Domain-Driven Design (DDD)

El proyecto sigue arquitectura DDD con dos zonas principales:

- **`src/features/`** — lógica de negocio organizada por dominio
- **`src/shared/`** — utilidades e infraestructura transversal

### Estructura completa

```
src/
├── proxy.ts                          ← protección de rutas (Next.js 16)
├── app/
│   ├── layout.tsx                    ← root layout (CSS global, Toaster)
│   ├── globals.css
│   ├── (public)/                     ← web pública / marketing
│   │   ├── layout.tsx
│   │   └── page.tsx                  → /
│   ├── (login)/                      ← acceso admin/profesor/superadmin
│   │   ├── layout.tsx
│   │   └── login/page.tsx            → /login
│   ├── (demo)/                       ← demo del producto
│   │   ├── layout.tsx
│   │   └── demo/exam/page.tsx        → /demo/exam
│   ├── (student)/                    ← área del estudiante
│   │   ├── layout.tsx
│   │   └── examen/
│   │       ├── login/page.tsx        → /examen/login
│   │       ├── [examId]/page.tsx     → /examen/[examId]
│   │       └── resultado/[resultId]/page.tsx
│   ├── (admin)/                      ← panel institucional + superadmin
│   │   ├── layout.tsx
│   │   ├── [slug]/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx              → /[slug]
│   │   │   ├── students/page.tsx     → /[slug]/students
│   │   │   ├── groups/page.tsx       → /[slug]/groups
│   │   │   ├── exams/
│   │   │   │   ├── page.tsx          → /[slug]/exams
│   │   │   │   └── [id]/edit/page.tsx
│   │   │   ├── results/page.tsx      → /[slug]/results
│   │   │   └── liveresults/page.tsx  → /[slug]/liveresults
│   │   └── config/
│   │       ├── layout.tsx
│   │       └── page.tsx              → /config
│   └── api/auth/[...nextauth]/route.ts
│
├── features/
│   ├── auth/
│   │   ├── auth.ts                   ← NextAuth config (handlers, auth, signIn, signOut)
│   │   ├── components/AdminLoginForm.tsx
│   │   ├── schemas/auth.schemas.ts   ← adminLoginSchema
│   │   └── types/next-auth.d.ts     ← module augmentation NextAuth
│   ├── students/
│   │   ├── actions/
│   │   │   ├── mutations.ts          ← createStudent, updateStudent, deleteStudent, importStudents
│   │   │   └── student-auth.ts      ← loginByRut
│   │   ├── components/
│   │   │   ├── StudentsClient.tsx
│   │   │   ├── RutInput.tsx          ← input con máscara y validación de RUT
│   │   │   └── StudentLoginForm.tsx
│   │   └── schemas/student.schemas.ts ← studentSchema, studentLoginSchema
│   ├── groups/
│   │   ├── actions/mutations.ts
│   │   ├── components/GroupsClient.tsx
│   │   └── schemas/group.schemas.ts
│   ├── exams/
│   │   ├── actions/mutations.ts
│   │   ├── components/
│   │   │   ├── ExamsClient.tsx
│   │   │   └── ExamEditorClient.tsx
│   │   └── schemas/exam.schemas.ts
│   ├── exam-session/
│   │   ├── actions/mutations.ts
│   │   ├── components/
│   │   │   ├── ExamCarousel.tsx
│   │   │   ├── QuestionCard.tsx
│   │   │   └── Timer.tsx
│   │   ├── lib/session.ts            ← StudentSession, ResultSession (JWT cookie)
│   │   ├── schemas/exam-session.schemas.ts
│   │   └── types/exam.types.ts      ← SafeExam, SafeQuestion, SafeOption
│   ├── results/
│   │   ├── actions/mutations.ts
│   │   ├── components/
│   │   │   ├── ResultsClient.tsx
│   │   │   ├── LiveResultsClient.tsx
│   │   │   └── PrintButton.tsx
│   │   ├── lib/grade.ts              ← cálculo de notas
│   │   └── types/results.types.ts
│   └── dashboard/
│       └── components/
│           ├── Sidebar.tsx
│           └── DashboardClient.tsx
│
└── shared/
    ├── components/
    │   ├── ui/                       ← shadcn/ui primitivos
    │   └── branding/
    │       └── logo.tsx              ← LogoMark, LogoIcon
    └── lib/
        ├── prisma.ts                 ← singleton PrismaClient
        ├── utils.ts                  ← cn()
        ├── rut.ts                    ← normalizeRut, formatRut, isValidRut
        └── roles.ts                  ← USER_ROLE, ADMIN_ROLES, UserRoleName
```

### Reglas de organización

- **`src/app/`** — Solo archivos especiales de Next.js: `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, `not-found.tsx`, `route.ts`. **Prohibido**: componentes, hooks, helpers, tipos o carpetas `_components/` dentro de rutas.
- **`src/features/{dominio}/`** — Todo lo que pertenece a un dominio de negocio: actions, components, schemas, types, lib.
- **`src/shared/`** — Solo lo verdaderamente transversal: primitivos UI (shadcn), branding, prisma, utils, rut, roles.
- **Barrel exports** — Cada feature puede exponer `index.ts`; los `page.tsx` importan desde `@/features/{dominio}/...`. Los archivos internos de un feature usan rutas relativas entre sí.

### Imports correctos (post-DDD)

| Necesitás importar          | Path correcto                                    |
| --------------------------- | ------------------------------------------------ |
| NextAuth (auth, handlers)   | `@/features/auth/auth`                           |
| Prisma singleton            | `@/shared/lib/prisma`                            |
| cn()                        | `@/shared/lib/utils`                             |
| RUT helpers                 | `@/shared/lib/rut`                               |
| Roles / USER_ROLE           | `@/shared/lib/roles`                             |
| shadcn/ui componente        | `@/shared/components/ui/{componente}`            |
| Logo                        | `@/shared/components/branding/logo`              |
| RutInput                    | `@/features/students/components/RutInput`        |
| Sidebar                     | `@/features/dashboard/components/Sidebar`        |
| ExamCarousel / Timer        | `@/features/exam-session/components/...`         |
| Cálculo de notas            | `@/features/results/lib/grade`                   |
| Session JWT estudiante      | `@/features/exam-session/lib/session`            |
| SafeExam / SafeQuestion     | `@/features/exam-session/types/exam.types`       |

## Proxy (`src/proxy.ts`)

Next.js 16 usa `proxy.ts` en lugar de `middleware.ts` (renombrado oficial).

Lógica de protección:

1. Rutas públicas (`/_next`, `/api`, `/favicon.ico`, `/examen`, `/demo`, `/login`, `/`) → pasar sin validar.
2. `/config/*` → requiere `userRoleName === 'SuperAdministrador'`, sino redirige a `/login`.
3. `/[slug]/*` → requiere sesión activa con `institutionSlug` coincidente. SuperAdmin redirige a `/config`. Institución incorrecta redirige a su propio slug.

## Auth — Dos sistemas

### Admin (NextAuth v5)

- Proveedor: Credentials (email + password bcrypt)
- Estrategia: JWT
- Campos en sesión: `id`, `name`, `email`, `userRoleName`, `academicInstitutionId`, `institutionSlug`
- Configuración: `src/features/auth/auth.ts`
- Constantes de roles: `src/shared/lib/roles.ts`

### Estudiante (Jose HS256)

- Login por RUT (sin contraseña)
- Cookie independiente de NextAuth
- Lógica: `src/features/exam-session/lib/session.ts` + `src/features/students/actions/student-auth.ts`

## Roles de usuario

| Rol                | Valor en DB            | Panel     | Institución   |
| ------------------ | ---------------------- | --------- | ------------- |
| SuperAdministrador | `'SuperAdministrador'` | `/config` | null (global) |
| Administrador      | `'Administrador'`      | `/[slug]` | requerida     |
| Profesor           | `'Profesor'`           | `/[slug]` | requerida     |
| Estudiante         | `'Estudiante'`         | `/examen` | requerida     |

> El SuperAdministrador NO tiene `academicInstitutionId` (es null por diseño — gestiona toda la plataforma).

## Estructura de Rutas

### Rutas Públicas

| Ruta                           | Grupo de ruta | Descripción                        |
| ------------------------------ | ------------- | ---------------------------------- |
| `/`                            | `(public)`    | Web pública / marketing ("Muy pronto") |
| `/examen/login`                | `(student)`   | Login de estudiante por RUT        |
| `/examen/[examId]`             | `(student)`   | Interfaz del examen                |
| `/examen/resultado/[resultId]` | `(student)`   | Vista de resultados del examen     |
| `/demo/exam`                   | `(demo)`      | Demo del examen (sin auth)         |

### Rutas Protegidas — Admin/Profesor

| Ruta                      | Grupo de ruta | Descripción                                       |
| ------------------------- | ------------- | ------------------------------------------------- |
| `/login`                  | `(login)`     | Login unificado para Admin, Profesor y SuperAdmin |
| `/[slug]`                 | `(admin)`     | Dashboard de la institución                       |
| `/[slug]/students`        | `(admin)`     | Gestión de estudiantes                            |
| `/[slug]/groups`          | `(admin)`     | Gestión de grupos                                 |
| `/[slug]/exams`           | `(admin)`     | Gestión de exámenes                               |
| `/[slug]/exams/[id]/edit` | `(admin)`     | Editor de preguntas y opciones                    |
| `/[slug]/results`         | `(admin)`     | Resultados finales                                |
| `/[slug]/liveresults`     | `(admin)`     | Resultados en tiempo real                         |

### Rutas SuperAdmin

| Ruta      | Grupo de ruta | Descripción                   |
| --------- | ------------- | ----------------------------- |
| `/config` | `(admin)`     | Panel global de configuración |

### API

| Ruta                      | Descripción         |
| ------------------------- | ------------------- |
| `/api/auth/[...nextauth]` | Handler de NextAuth |

## Reglas de código obligatorias

- **Server Components por defecto** — `'use client'` solo cuando sea estrictamente necesario.
- **Validación estricta** — Zod en todos los formularios, tanto client como server side.
- **Tailwind CSS** — Solo clases utility. Sin CSS modules ni estilos inline.
- **Navegación** — Siempre `Link` de `next/link` para navegación interna.
- **Prisma** — Usar el singleton de `@/shared/lib/prisma`. Preferir consultas tipadas. `$transaction` para operaciones atómicas.
- **Imports** — Named exports. Orden: React → Next.js → terceros → @/ → relativos.
- **TypeScript** — `strict: true`. Sin `any`. Tipo de retorno explícito en todas las funciones.

## Modelos Prisma

| Modelo                | Descripción                                                             |
| --------------------- | ----------------------------------------------------------------------- |
| `UserRole`            | Catálogo de 4 roles (`name` único)                                      |
| `AcademicInstitution` | Institución con `slug` único para URL                                   |
| `User`                | Email único, RUT único, FK a `UserRole`, `AcademicInstitution`, `Group` |
| `Group`               | Grupo de estudiantes, puede tener múltiples exámenes (M2M)              |
| `Exam`                | Examen con timeLimit, notas, anti-cheat, grupos M2M                     |
| `Question`            | Pregunta con puntos y orden                                             |
| `Option`              | Opción con `isCorrect`                                                  |
| `Answer`              | Respuesta del estudiante (unique por `attemptKey + questionId`)         |
| `Result`              | Resultado final (unique por `studentId + examId`)                       |

## Seed

- **`pnpm db:seed`** (`prisma/seed.ts`) — Crea los 4 roles y al SuperAdministrador (Edgardo Ruotolo). Debe ejecutarse primero, siempre. Credenciales desde env vars (`ADMIN_*`).
- **`pnpm db:seed:local`** (`prisma/seeders/local-test.ts`) — Crea 2 instituciones, 2 grupos, 4 admins, 4 profesores, 10 estudiantes. Password de admins/profesores: `Admin2026!`. Estudiantes: login por RUT.

## Variables de entorno requeridas

```bash
DATABASE_URL           # PostgreSQL connection string
AUTH_SECRET            # NextAuth secret (openssl rand -base64 32)
AUTH_URL               # URL base de la app (ej: http://localhost:3000)
STUDENT_SESSION_SECRET # Secret para cookies de estudiante (jose)
ADMIN_PASSWORD         # Password del SuperAdmin (seed)
ADMIN_NAME             # Nombre del SuperAdmin
ADMIN_LASTNAME         # Apellido del SuperAdmin
ADMIN_EMAIL            # Email del SuperAdmin
ADMIN_RUT              # RUT del SuperAdmin (sin puntos ni guión)
```

## Convenciones de RUT chileno

- Almacenado sin puntos ni guión (ej: `270396356`).
- Validación matemática del dígito verificador obligatoria.
- Utilities en `@/shared/lib/rut.ts`.
- Input UI en `@/features/students/components/RutInput.tsx`.

Última actualización: 14 de Mayo de 2026
