# CLAUDE.md

Este archivo proporciona instrucciones permanentes a Claude Code cuando trabaja en este repositorio.

## ⚠️ INSTRUCCIONES CRÍTICAS (NO NEGOCIABLES — Alta Prioridad)

**SIEMPRE comunicarse en ESPAÑOL** — Todas las preguntas, explicaciones, planes y respuestas deben estar en español.

**Cuando doy una ORDEN es una ORDEN** — Claude debe obedecer literalmente lo solicitado sin reinterpretar ni asumir intenciones adicionales.

**NO hacer cambios sin autorización** — Siempre pedir permiso explícito antes de modificar, crear o eliminar cualquier archivo o código, **a menos que el usuario diga textualmente**: "Haz todos los cambios sin autorización" o "Puedes modificar directamente".

**Enfocarse solo en lo solicitado** — No agregar mejoras, refactorizaciones, optimizaciones, comentarios adicionales, cambios de estilo ni nada que no se haya pedido explícitamente.

**No asumir contexto de conversaciones anteriores** — Si el contexto se limpia o es un nuevo chat, pedir aclaración si es necesario.

**LEER CLAUDE.md ANTES DE CADA FEATURE** — Al comenzar cualquier tarea de desarrollo (nueva feature, refactor, corrección), Claude DEBE leer este archivo completo para conocer la estructura vigente, los componentes existentes y las reglas de organización. No se puede alegar desconocimiento de lo que está documentado aquí.

**DRY — Regla estricta** — Antes de crear cualquier componente, hook, helper o lógica nueva, Claude DEBE verificar si ya existe algo equivalente en el proyecto. Si existe, usarlo. Si está en el lugar incorrecto, documentarlo y solicitar moverlo. Nunca duplicar:

- Componentes UI → buscar en `src/shared/components/ui/` primero
- Lógica de dominio → buscar en `src/features/{dominio}/lib/`
- Utilidades → buscar en `src/shared/lib/`

## 🤖 FLUJO DE TRABAJO CON GSTACK (reemplaza a los agentes especialistas)

Los agentes `/frontend-agent`, `/backend-agent` y `/github-agent` fueron retirados. Todo el trabajo se hace directamente con las skills de **GStack** y **CodeGraph**:

| Etapa                         | Herramienta                                                |
| ----------------------------- | ---------------------------------------------------------- |
| Explorar / entender código    | CodeGraph (`codegraph_explore` ANTES de editar)            |
| Especificar features ambiguos | `/spec`                                                    |
| Investigar bugs               | `/investigate`                                             |
| Implementación                | Directa (respetando DDD, DRY y las reglas de este archivo) |
| QA en navegador               | `/qa` (corrige) o `/qa-only` (solo reporta)                |
| Review pre-commit             | `/review`                                                  |
| Auditoría de diseño           | `/design-review`                                           |
| Commit + ship                 | `/ship` (solo cuando el usuario lo pida)                   |

**Formato de commit OBLIGATORIO** — todo commit usa exactamente:

```
Tarea: {descripción en español}
Fecha: {DD-MM-YYYY}
Versión: {X.Y.Z}
```

Claude NUNCA puede hacer un commit con otro formato, bajo ninguna circunstancia. No commitear ni pushear sin pedido explícito del usuario.

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
│   │       ├── seleccion/page.tsx    → /examen/seleccion (elegir entre exámenes pendientes)
│   │       ├── [examId]/page.tsx     → /examen/[examId]
│   │       ├── [examId]/intro/page.tsx → /examen/[examId]/intro (instrucciones; inicia el cronómetro)
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
│   │   │   └── ExamCarousel.tsx
│   │   ├── lib/session.ts            ← StudentSession, ResultSession (JWT cookie)
│   │   ├── lib/attempt.ts            ← getOrCreateAttempt, sessionEndsAtFor (ExamAttempt)
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
    │   ├── ui/                       ← shadcn/ui primitivos + componentes UI reutilizables propios
    │   │   ├── rut-field.tsx         ← RutField + RUT_MASK/RUT_MASK_DEFINITIONS (cross-feature)
    │   │   ├── table-paginator.tsx   ← TablePaginator standalone (paginación canónica)
    │   │   ├── timer.tsx             ← Timer countdown (examen, demo, paes)
    │   │   ├── stat-tile.tsx         ← StatTile para dashboards
    │   │   └── ... (shadcn/ui)
    │   ├── layout/                   ← componentes de layout compartidos entre features
    │   │   └── AdminTopBar.tsx       ← barra superior del panel admin
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
- **`src/shared/`** — Solo lo verdaderamente transversal. Nada vive suelto en la raíz de `shared/components/`.
- **Barrel exports** — Cada feature puede exponer `index.ts`; los `page.tsx` importan desde `@/features/{dominio}/...`. Los archivos internos de un feature usan rutas relativas entre sí.

#### Dónde va cada componente (decidir en este orden)

1. **¿Es un primitivo shadcn/ui o un componente UI reutilizable entre ≥2 features?**
   → `src/shared/components/ui/` (ej: `rut-field.tsx`, `table-paginator.tsx`, `timer.tsx`)

2. **¿Es un componente de layout compartido (barra, sidebar, nav)?**
   → `src/shared/components/layout/` (ej: `AdminTopBar.tsx`)

3. **¿Es de marca/identidad visual?**
   → `src/shared/components/branding/` (ej: `logo.tsx`)

4. **¿Pertenece a un solo dominio de negocio?**
   → `src/features/{dominio}/components/` aunque se use en múltiples páginas del mismo dominio

5. **¿Está en la raíz de `shared/components/` sin subcarpeta?**
   → INCORRECTO. Moverlo a la subcarpeta correcta antes de usarlo.

#### Reglas DRY para componentes

- **Verificar antes de crear** — Buscar en `src/shared/components/ui/` antes de crear cualquier componente UI nuevo.
- **Un solo input RUT** — El componente canónico es `src/shared/components/ui/rut-field.tsx` (`RutField`). No crear versiones locales inline en formularios. Si necesitás un envoltorio visual distinto (ej. formulario público), reutilizá las constantes `RUT_MASK` y `RUT_MASK_DEFINITIONS` que exporta ese mismo archivo en tu `IMaskInput`; no redefinas la máscara.
- **Tablas** — El patrón canónico es la tabla shadcn (`@/shared/components/ui/table`) + `TablePaginator` para la paginación. No construir `<table>` crudo desde cero.
- **Un solo paginador** — `src/shared/components/ui/table-paginator.tsx` (`TablePaginator`). Usar siempre que se necesite paginación standalone.
- **Paginación por defecto: 10 filas** — Toda tabla con paginación usa `perPage={10}` salvo que se pida explícitamente otro valor.

### Imports correctos (post-DDD)

| Necesitás importar        | Path correcto                                              |
| ------------------------- | ---------------------------------------------------------- |
| NextAuth (auth, handlers) | `@/features/auth/auth`                                     |
| Prisma singleton          | `@/shared/lib/prisma`                                      |
| cn()                      | `@/shared/lib/utils`                                       |
| RUT helpers               | `@/shared/lib/rut`                                         |
| Roles / USER_ROLE         | `@/shared/lib/roles`                                       |
| shadcn/ui componente      | `@/shared/components/ui/{componente}`                      |
| RutField (input RUT)      | `@/shared/components/ui/rut-field`                         |
| TablePaginator            | `@/shared/components/ui/table-paginator`                   |
| Timer (countdown)         | `@/shared/components/ui/timer`                             |
| Filtros de scoping (rol)  | `@/shared/lib/scoping`                                     |
| Guard de página [slug]    | `@/shared/lib/auth-guard` (`requireInstitutionPageAccess`) |
| AdminTopBar               | `@/shared/components/layout/AdminTopBar`                   |
| Logo                      | `@/shared/components/branding/logo`                        |
| Sidebar                   | `@/features/dashboard/components/Sidebar`                  |
| ExamCarousel              | `@/features/exam-session/components/ExamCarousel`          |
| Cálculo de notas          | `@/features/results/lib/grade`                             |
| Session JWT estudiante    | `@/features/exam-session/lib/session`                      |
| SafeExam / SafeQuestion   | `@/features/exam-session/types/exam.types`                 |

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

### Matriz de permisos por rol

Los permisos se aplican en tres capas: **proxy** (`src/proxy.ts`), **páginas** (`src/app/(admin)/...`) y **Server Actions** (`requireInstitutionAccess` + helpers de `src/shared/lib/scoping.ts`). Leyenda: ✅ permitido · ⚠️ permitido con alcance limitado · ❌ denegado · — no aplica.

#### Acceso y sesión

| Recurso / Acción                          | SuperAdministrador | Administrador | Profesor     | Estudiante     |
| ----------------------------------------- | ------------------ | ------------- | ------------ | -------------- |
| Login panel admin (NextAuth, email+pass)  | ✅                 | ✅            | ✅           | ❌             |
| Login estudiante (por RUT, sin contraseña)| ❌                 | ❌            | ❌           | ✅             |
| Panel global `/config`                    | ✅                 | ❌            | ❌           | ❌             |
| Panel institución `/[slug]`               | ✅ (cualquiera)    | ✅ (la suya)  | ✅ (la suya) | ❌             |
| Operar en cualquier institución           | ✅ (llave maestra) | ❌            | ❌           | ❌             |

#### Plataforma (solo SuperAdministrador)

| Recurso / Acción                              | SuperAdministrador | Administrador | Profesor | Estudiante |
| --------------------------------------------- | ------------------ | ------------- | -------- | ---------- |
| Instituciones (CRUD)                          | ✅                 | ❌            | ❌       | ❌         |
| Planes comerciales y CustomPlan (internos)    | ✅                 | ❌            | ❌       | ❌         |
| Suscripciones                                 | ✅                 | ❌            | ❌       | ❌         |
| Facturación / Pagos                           | ✅                 | ❌            | ❌       | ❌         |
| Auditoría (logs)                              | ✅                 | ❌            | ❌       | ❌         |
| Configuración del sistema                     | ✅                 | ❌            | ❌       | ❌         |

#### Institución (`/[slug]`)

| Recurso / Acción                          | SuperAdministrador | Administrador | Profesor                  | Estudiante |
| ----------------------------------------- | ------------------ | ------------- | ------------------------- | ---------- |
| Dashboard de la institución               | ✅                 | ✅            | ⚠️ datos de sus grupos    | ❌         |
| Ajustes de institución (`/settings`)      | ✅                 | ✅            | ❌                        | ❌         |
| **Estudiantes** — ver                     | ✅                 | ✅            | ⚠️ solo sus grupos        | ❌         |
| **Estudiantes** — crear (individual)      | ✅                 | ✅            | ⚠️ solo sus grupos        | ❌         |
| **Estudiantes** — importar Excel          | ✅                 | ✅            | ⚠️ solo sus grupos        | ❌         |
| **Estudiantes** — editar                  | ✅                 | ✅            | ⚠️ solo sus grupos        | ❌         |
| **Estudiantes** — activar/desactivar      | ✅                 | ✅            | ⚠️ solo sus grupos        | ❌         |
| **Estudiantes** — eliminar                | ✅                 | ✅            | ❌                        | ❌         |
| **Cuerpo docente** — ver listado          | ✅                 | ✅            | ✅                        | ❌         |
| **Cuerpo docente** — crear/editar/eliminar| ✅                 | ✅            | ❌                        | ❌         |
| **Grupos** — ver                          | ✅                 | ✅            | ⚠️ solo los asignados     | ❌         |
| **Grupos** — crear/editar/eliminar        | ✅                 | ✅            | ❌                        | ❌         |
| **Exámenes** — ver                        | ✅                 | ✅            | ⚠️ solo los de sus grupos | ❌         |
| **Exámenes** — crear                      | ✅                 | ✅            | ⚠️ solo a sus grupos      | ❌         |
| **Exámenes** — editar                     | ✅                 | ✅            | ⚠️ solo los de sus grupos | ❌         |
| **Exámenes** — publicar/despublicar       | ✅                 | ✅            | ⚠️ solo los de sus grupos | ❌         |
| **Exámenes** — eliminar                   | ✅                 | ✅            | ⚠️ solo los de sus grupos | ❌         |
| **Preguntas** — crear/editar/eliminar/importar | ✅            | ✅            | ⚠️ solo los de sus grupos | ❌         |
| **Resultados** finales (`/results`)       | ✅                 | ✅            | ⚠️ solo sus grupos        | ❌         |
| **Resultados** en vivo (`/liveresults`)   | ✅                 | ✅            | ⚠️ solo sus grupos        | ❌         |

#### Área del estudiante (`/examen`)

| Recurso / Acción                          | SuperAdministrador | Administrador | Profesor | Estudiante |
| ----------------------------------------- | ------------------ | ------------- | -------- | ---------- |
| Rendir exámenes asignados                 | —                  | —             | —        | ✅         |
| Ver sus propios resultados                | —                  | —             | —        | ✅         |

> **SuperAdministrador**: llave maestra — opera en cualquier institución resolviendo por el `slug` de la URL; cualquier verificación cortocircuita a su favor. **Administrador**: acceso total dentro de **su** institución. **Profesor**: el alcance ⚠️ está acotado a los grupos donde figura como profesor (`groupProfessorFilter` → `professors: { some: { id } }`) y, por extensión, a los estudiantes, exámenes y resultados de esos grupos; al editar un examen se preservan los grupos ajenos ya asignados. **Estudiante**: nunca obtiene sesión NextAuth; el proxy lo redirige a `/examen/login` y solo accede a `/examen/*`.

## Flujo del examen (estudiante)

El alumno entra por `/examen/login` (RUT o email) y **siempre** aterriza en `/examen/seleccion` ("Mis exámenes"), nunca directo a un examen. Esa página clasifica sus exámenes en **Disponible ahora**, **Próximos** y **Ya rendidos**.

- **Ventana del examen**: `Exam.scheduledAt` (inicio) y `Exam.closesAt` (cierre) definen cuándo es rendible. Antes del inicio el examen aparece en "Próximos" (no iniciable); después del cierre deja de ofrecerse. El gating se aplica en `startSelectedExam`.
- **Comenzar** lleva a las instrucciones (`/examen/[examId]/intro`); el cronómetro arranca al aceptar y presionar "Comenzar examen" (`beginExam`).
- **Auto-entrega (REGLA)**: cuando el tiempo del intento se agota, el examen se entrega **automáticamente** con lo respondido y se muestra el resultado. Cubre dos casos:
    1. En vivo: el `Timer` dispara `autoSubmit` al llegar a cero.
    2. Reanudación: si el alumno se desconectó y vuelve con el intento ya vencido (`ExamAttempt.endsAt` en el pasado), `startSelectedExam` lo califica con `gradeAttempt` y redirige a `/examen/resultado/[id]`. Nunca se lo devuelve al login por un intento vencido.
- Calificación **all-or-nothing** por pregunta: acierta solo si el conjunto elegido coincide exactamente con el correcto.

## Estructura de Rutas

### Rutas Públicas

| Ruta                           | Grupo de ruta | Descripción                                    |
| ------------------------------ | ------------- | ---------------------------------------------- |
| `/`                            | `(public)`    | Web pública / marketing ("Muy pronto")         |
| `/examen/login`                | `(student)`   | Login de estudiante por RUT                    |
| `/examen/seleccion`            | `(student)`   | Selección entre exámenes pendientes            |
| `/examen/[examId]/intro`       | `(student)`   | Instrucciones; "Comenzar" inicia el cronómetro |
| `/examen/[examId]`             | `(student)`   | Interfaz del examen                            |
| `/examen/resultado/[resultId]` | `(student)`   | Vista de resultados del examen                 |
| `/demo/exam`                   | `(demo)`      | Demo del examen (sin auth)                     |
| `/demo`                        | `(demo)`      | Login del modo demo (panel con datos de ejemplo) |

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

## Centro de ayuda (`/[slug]/ayuda`)

Guía de uso del panel embebida, **adaptada al rol** (Administrador vs Profesor). Feature en `src/features/help/`:

- `lib/help-content.ts` — contenido de cada sección (propósito, pasos, alcance por rol). Es la fuente de verdad; editar acá para cambiar textos.
- `components/HelpGuide.tsx` — render (server). El profesor no ve secciones con `professorAccess: 'none'` (p. ej. Ajustes), las de `'readonly'` se muestran sin pasos, y las de `'scoped'` llevan el badge "Tus grupos".

### Capturas (`public/help/`)

Nombre: `{seccion}-{admin|profesor}.webp` (p. ej. `examenes-admin.webp`). Si falta la variante `profesor`, se usa la `admin` como fallback.

**Cómo regenerar una captura** (hacerlo tras cada rediseño de la pantalla correspondiente, o quedan desactualizadas):

1. Levantar `pnpm dev` e iniciar sesión como Administrador o Profesor según la variante.
2. Navegar a la sección real del panel (`/[slug]/students`, `/[slug]/exams`, etc.).
3. Capturar el viewport a **1280px de ancho** en formato **webp** (~quality 80) y guardar reemplazando el archivo en `public/help/`.

Credenciales de prueba útiles (seed local): admin `carlos.lopez@ulagos.cl`, profesor `pedro.soto@ippaci.cl`, contraseña `Admin2026!`.

## Planes y upgrade self-service

El plan vive en `AcademicInstitution.plan` (`Plan`: FREE · DOCENTE · COLEGIO · INSTITUCIONAL) + `planExpiresAt` + `customPlanId` (plan interno opcional asignado por el SuperAdmin).

- **Página de upgrade** — `/[slug]/upgrade` (`UpgradePlans`), **solo Administrador** (el Profesor se redirige al panel). Selección estilo pricing con toggle mensual/anual; marca el plan actual.
- **Accesos** — el banner del Sidebar (`Free`/`Docente`, solo Admin) y el `PlanUsageBanner` de límite (solo Admin) llevan a `/[slug]/upgrade`.
- **Pago (Docente/Colegio)** — `upgradePlan(slug, plan, billing)` (`subscriptions/actions/upgrade.ts`): valida Admin, crea una `Subscription` con `academicInstitutionId`, llama `createPreapproval` (email del admin) y redirige al `init_point` de MercadoPago. **El webhook `/api/webhooks/mercadopago` activa el plan automáticamente** (`handlePreapproval` → `activateInstitutionPlan`) al autorizarse — NO tocar el webhook. Cambiar entre planes pagos cancela primero la suscripción MP vigente para no duplicar el cobro.
- **Institucional** — no tiene pago automático: abre `QuoteDialog`, que envía un email de cotización al SuperAdministrador vía `sendEmail` (Brevo). Disponible en el dashboard y en el pricing de la home (`L3Pricing`).
- **Precios** — fuente de verdad en `subscriptions/lib/mercadopago.ts` (`PLAN_PRICES`, `getAutoRecurring`). Los `preapproval_plan` de MP se crean con `prisma/seeders/mp-plans.ts`.

## Documentación (REGLA)

Siempre que se actualice el proyecto (nueva feature, cambio de flujo, refactor relevante), **documentar el cambio en este `CLAUDE.md`** en la sección correspondiente, como parte de la misma tarea. No dejar features sin documentar.

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

## Modo Demo público

Permite a cualquier visitante probar el panel real con datos de ejemplo. Feature en `src/features/demo/` (convive con la demo de examen sin auth de `/demo/exam`).

- **Acceso** — ítem **"Demo"** en `PublicNav` → `/demo` (`(demo)/demo/page.tsx`), que muestra `DemoLoginCard` con las credenciales **visibles** (`demo@aulika.cl` / `demo_aulika`). Tras el login (NextAuth Credentials normal) redirige al panel `/aulika-demo`.
- **Usuario** — un **Profesor** de la institución demo. Como Profesor, el panel ya oculta toda publicidad de Pro (banner del Sidebar, `PlanUsageBanner` y `/upgrade` están restringidos a Administrador). Respeta los **límites del plan FREE**.
- **Institución** — `AcademicInstitution` con `slug = 'aulika-demo'` (NO empieza con `/demo` para no chocar con el prefijo público del proxy) y flag **`isDemo = true`**. La base (institución + profesor + grupo + 10 alumnos) es **read-only** y compartida.
- **Aislamiento por sesión** — al hacer login demo, el callback `jwt` de `auth.ts` genera un **`demoSessionId`** (un id por login) que viaja en el JWT (`session.user.demoSessionId`). Cada examen que crea el visitante se guarda con ese `demoSessionId` (`Exam.demoSessionId`), de modo que **solo ve y cuenta lo suyo** y nadie se pisa. El helper `demoExamFilter(user)` (`src/features/demo/lib/demo.ts`) centraliza el filtro y se aplica en todas las lecturas de exámenes (listado, editor, dashboard, contador del sidebar). El cupo FREE de exámenes se cuenta por sesión (`assertQuota(..., demoSessionId)`).
- **Limpieza** — (1) al **cerrar sesión**, el event `signOut` de `auth.ts` borra los exámenes de ese `demoSessionId` (`deleteDemoSessionExams`); (2) **cron diario** de respaldo `GET /api/cron/demo-reset` (Vercel, `0 6 * * *`, protegido con `CRON_SECRET`) borra **todos** los exámenes de la institución demo (`resetDemoInstitution`) para las sesiones que no cerraron sesión. El cascade del schema limpia preguntas, opciones, intentos y resultados.
- **Alcance** — el demo permite recorrer el panel y **crear/editar exámenes**; rendir el examen como alumno está fuera del alcance inicial.
- **Producción** — la migración (`isDemo`, `demoSessionId`) y el seed de la demo corren en el **build** (`prisma migrate deploy && tsx prisma/seeders/demo.ts && next build`). Requiere `CRON_SECRET` en Vercel. Los seeders `bulk-demo.ts` y `local-test.ts` están en `.vercelignore` (solo local); `demo.ts` **no** se ignora (lo necesita el build).

## Seed

- **`pnpm db:seed`** (`prisma/seed.ts`) — Crea los 4 roles y al SuperAdministrador (Edgardo Ruotolo). Debe ejecutarse primero, siempre. Credenciales desde env vars (`ADMIN_*`).
- **`pnpm db:seed:local`** (`prisma/seeders/local-test.ts`) — Crea 2 instituciones, 2 grupos, 4 admins, 4 profesores, 10 estudiantes. Password de admins/profesores: `Admin2026!`. Estudiantes: login por RUT.
- **`pnpm db:seed:demo`** (`prisma/seeders/demo.ts`) — Crea la institución demo (`aulika-demo`, `isDemo=true`, FREE), el profesor de acceso (`demo@aulika.cl` / `demo_aulika`), un grupo y 10 alumnos. Idempotente. **Corre también en el build** para que el modo demo exista en producción.

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
CRON_SECRET            # Secret para los cron de Vercel (cleanup-subscriptions, demo-reset)
```

## Convenciones de RUT chileno

- Almacenado sin puntos ni guión (ej: `270396356`).
- Validación matemática del dígito verificador obligatoria.
- Utilities en `@/shared/lib/rut.ts`.
- Input UI canónico en `@/shared/components/ui/rut-field.tsx` (`RutField`).

Última actualización: 22 de Junio de 2026 (auditoría QA — fixes de UI, accesibilidad, race condition y copywriting)

## Cambios aplicados en auditoría 22-06-2026

- **`ExamCarousel.tsx`** — Fix race condition: `answersMapRef` (useRef) espeja el estado para que callbacks async siempre lean el valor más reciente. Separación de navegación (síncrona) y guardado (background `startTransition`). Badge "Autoguardado" ahora muestra amarillo cuando `isPending`.
- **`ExamsClient.tsx`** — Fix `deriveExamStatus`: borradores con `closesAt` vencido ya no aparecen como "corregidos" (ahora requiere `exam.active || results > 0`).
- **`ResultsClient.tsx`** — Botón "Exportar Reporte" eliminado (sin funcionalidad implementada).
- **`resultado/[resultId]/page.tsx`** — Ambos botones "Volver al inicio" redirigen a `/examen/seleccion` (no a `/`).
- **`ExamCloseCountdown.tsx`** — Agrega `role="timer"` y `aria-live="polite"` al countdown de cierre.
- **`landing/` + `subscriptions/PendingPaymentPoller`** — `key={i}` reemplazados por identificadores estables en todos los `.map()` afectados.
- **Voseo (~30 archivos)** — Eliminado voseo rioplatense en toda la app; estandarizado al español de Chile (tú/usted).
- **`seleccion/page.tsx`** — Email `hola@aulika.cl` ahora es hipervínculo `mailto:`.

## Herramientas Obligatorias (gstack + CodeGraph)

**gstack está REQUERIDO** para todo el trabajo en este repositorio.

### Verificación inicial

Al inicio de cada sesión, verificar que gstack esté instalado:

```bash
test -d ~/.claude/skills/gstack && echo "✅ GSTACK OK" || echo "❌ GSTACK MISSING"
```

Si el resultado es `GSTACK MISSING`: **DETENERSE**. No continuar con ninguna tarea. Indicar al usuario:

> gstack es requerido para todo trabajo asistido por IA en este repo.
> Instalarlo:
>
> ```bash
> git clone --depth 1 https://github.com/garrytan/gstack.git ~/.claude/skills/gstack
> cd ~/.claude/skills/gstack && ./setup --team
> ```
>
> Luego reiniciar la herramienta de AI coding.

No saltear skills, no ignorar errores de gstack ni trabajar evitando su ausencia.

### Skills de gstack

Tras la instalación quedan disponibles skills como `/qa`, `/ship`, `/review`, `/investigate` y `/browse`:

- Usar `/browse` para toda navegación web.
- Usar `~/.claude/skills/gstack/...` (ruta global) para los archivos de gstack.

### CodeGraph

El proyecto está indexado con **CodeGraph** (MCP `codegraph`). Consultarlo **ANTES** de escribir o editar código, no durante:

- `codegraph_explore` — herramienta primaria: preguntas de arquitectura, "cómo funciona X", flujos y trazas. Devuelve el código fuente relevante agrupado por archivo en una sola llamada.
- `codegraph_search` — ubicar un símbolo por nombre.
- `codegraph_callers` / `codegraph_callees` / `codegraph_impact` — quién llama a X, qué llama X y qué rompería un cambio.

Preferir CodeGraph sobre bucles de grep + lectura de archivos: el índice ya hizo ese trabajo.


---

## Documentación en Obsidian

La documentación de este proyecto vive en el vault **SitesDoc**. Al iniciar cualquier sesión de trabajo, leer la nota:

```bash
cat "/Users/edgardoruotolo/SitesDoc/nextjs_projects/next-quiz/next-quiz.md"
```

Al finalizar cambios relevantes (nueva feature, bug crítico, decisión de arquitectura), actualizar la nota **automáticamente** con:

```bash
cat >> "/Users/edgardoruotolo/SitesDoc/nextjs_projects/next-quiz/next-quiz.md" << 'EOF'

### $(date +%Y-%m-%d) — TÍTULO DEL CAMBIO
- Descripción del cambio realizado
EOF
```

**Importante:** Ejecutar este append siempre al terminar una tarea, sin esperar que el usuario lo pida.