# Spec.md — Aulika

> Documento de especificación funcional y técnica de **Aulika**, sistema de evaluación en línea para colegios y universidades.
> Fuente de verdad operativa complementaria: `CLAUDE.md` (convenciones de desarrollo).

---

## 1. Resumen

**Aulika** es una plataforma SaaS de evaluaciones en línea (tipo "quiz/examen") dirigida a instituciones educativas chilenas (colegios, liceos técnicos, preuniversitarios, universidades, institutos profesionales y CFT).

Permite a docentes y administradores **crear exámenes** con preguntas de selección (única/múltiple), **asignarlos a grupos de estudiantes**, y que los alumnos los **rindan en línea** dentro de una ventana horaria con cronómetro, anti-trampas y entrega automática. Los resultados se calculan y muestran en tiempo real, con notas configurables según el sistema chileno (escala 1–7, nota de aprobación 4).

### Áreas del producto

| Área | URL | Acceso |
| ---- | --- | ------ |
| Landing / marketing | `/` y `/empresa`, `/audiencias/*`, `/recursos/*` | Público |
| Registro self-service | `/registro/{free,colegio,docente}` | Público |
| Demo pública | `/demo` → `/aulika-demo` | Público (Profesor) |
| Estudiantes | `/examen/*` | Login por RUT, sin contraseña |
| Admin / Profesor (institución) | `/[slug]/*` | NextAuth (Credentials) |
| SuperAdministrador (plataforma) | `/config/*` | NextAuth (rol SuperAdministrador) |

---

## 2. Objetivos

- **Digitalizar evaluaciones** eliminando el papel y la corrección manual.
- **Escenarios de examen controlados**: ventana horaria (`scheduledAt`/`closesAt`), límite de tiempo, intento único, bloqueo de cambio de pestaña, IP única.
- **Reanudación robusta**: el estudiante puede recerrar sesión y volver sin perder tiempo ni respuestas.
- **Multi-institución** con aislamiento estricto por `slug` y jerarquía académica (Carrera → Semestre → Ramo).
- **Monetización** por planes (FREE, DOCENTE, COLEGIO, INSTITUCIONAL) vía MercadoPago, con límites por plan y planes internos a medida.

---

## 3. Stack tecnológico

| Capa | Tecnología |
| ---- | ---------- |
| Framework | Next.js 16 (App Router, Turbopack, React 19) |
| Lenguaje | TypeScript 5.7 (`strict: true`) |
| Base de datos | PostgreSQL (Docker local, Vercel prod) |
| ORM | Prisma 7 |
| Auth admin | NextAuth v5 beta.25 (Credentials, JWT) |
| Auth estudiante | Jose HS256 (cookie propia) |
| Estilos | Tailwind CSS 4 |
| UI primitivos | shadcn/ui + Radix UI |
| Formularios | React Hook Form + Zod |
| Íconos | Lucide React |
| Drag & Drop | @dnd-kit |
| Toasts | Sonner |
| Email | Brevo (`@getbrevo/brevo`) |
| Pagos | MercadoPago SDK |
| IA | AI SDK (`ai` + `@ai-sdk/google`) — generación de preguntas |
| Excel | `xlsx` (importación de estudiantes) |
| Linter | Biome 2 |
| Formatter | Prettier + prettier-plugin-tailwindcss |
| Tests unitarios | Vitest + Testing Library |
| Tests E2E | Playwright |
| Package manager | pnpm 10 |
| Hosting | Vercel |

---

## 4. Arquitectura

Domain-Driven Design sobre App Router. Server Components por defecto; `'use client'` solo cuando es necesario.

```
src/
├── proxy.ts                ← Protección de rutas (Next.js 16 usa proxy.ts en lugar de middleware.ts)
├── app/                    ← Solo archivos Next.js especiales (page, layout, route, loading, error)
│   ├── (public)/           → Landing, empresa, audiencias, recursos
│   ├── (signup)/registro/  → Registro self-service
│   ├── (demo)/             → Demo pública
│   ├── (student)/examen/   → Portal del estudiante
│   ├── (admin)/[slug]/     → Panel de institución (Admin/Profesor)
│   ├── (admin)/config/     → Panel global (SuperAdmin)
│   ├── (paes)/             → Módulo PAES
│   └── api/                → Auth, webhooks, cron, AI
├── features/               ← Lógica de dominio por feature
│   ├── auth/               ← NextAuth, AdminLoginForm, schemas
│   ├── students/           ← Mutaciones, auth estudiante, StudentsClient
│   ├── groups/             ← Mutaciones, GroupsClient
│   ├── exams/              ← Mutaciones, ExamsClient, ExamEditorClient
│   ├── exam-session/       ← ExamCarousel, session, attempt, grade
│   ├── results/            ← ResultsClient, LiveResultsClient, PrintButton, grade.ts
│   ├── questions/          ← Preguntas y banco de preguntas
│   ├── professors/         ← Cuerpo docente
│   ├── programs/           ← Carreras/niveles
│   ├── periods/            ← Períodos académicos
│   ├── courses/            ← Ramos/asignaturas (CourseSection)
│   ├── coordinators/       ← Jefes de carrera
│   ├── institutions/       ← CRUD instituciones (SuperAdmin)
│   ├── admin-users/        ← Gestión de usuarios admin
│   ├── admin-plan/         ← Planes internos
│   ├── subscriptions/      ← Upgrade, MercadoPago, planes
│   ├── audit/              ← Auditoría
│   ├── ai-question-gen/    ← Generación de preguntas con IA
│   ├── dashboard/          ← Sidebar, DashboardClient
│   ├── profile/            ← Perfil de usuario
│   ├── config/             ← Config global
│   ├── demo/               ← Modo demo
│   ├── paes/               ← Módulo PAES
│   ├── landing/            ← Componentes de marketing
│   └── help/               ← Centro de ayuda
└── shared/                 ← Transversal
    ├── components/
    │   ├── ui/             ← shadcn/ui + rut-field, table-paginator, timer, stat-tile
    │   ├── layout/         ← AdminTopBar
    │   └── branding/       ← logo
    └── lib/                ← prisma, utils (cn), rut, roles, scoping, auth-guard, academic-labels
```

### Reglas de organización

- `src/app/` — solo archivos Next.js especiales. Prohibido componentes/helpers aquí.
- `src/features/{dominio}/` — toda la lógica de ese dominio (actions, components, schemas, types, lib).
- `src/shared/` — solo lo verdaderamente transversal.

---

## 5. Usuarios y roles

| Rol | Valor DB | Panel | Institución |
| --- | -------- | ----- | ----------- |
| SuperAdministrador | `SuperAdministrador` | `/config` | null (global) |
| Administrador | `Administrador` | `/[slug]` | requerida |
| Profesor | `Profesor` | `/[slug]` | requerida |
| Estudiante | `Estudiante` | `/examen` | requerida |

> **SuperAdministrador** es la llave maestra: opera en cualquier ruta y nunca es bloqueado/redirigido por el proxy. Cuando su rol es `SuperAdministrador`, las Server Actions que requieren `institutionSlug` lo resuelven desde el JWT o la URL.

### Jerarquía académica adicional (no es un rol)

- **ProgramCoordinator (Jefe de Carrera)** — vínculo Profesor↔Programa que otorga alcance extendido dentro de su carrera, resuelto en Server Actions vía `src/shared/lib/scoping`.

---

## 6. Matriz de permisos (institución `/[slug]`)

Aplicada en tres capas: `src/proxy.ts`, páginas y Server Actions (`requireInstitutionAccess` + `src/shared/lib/scoping.ts`).
✅ permitido · ⚠️ alcance limitado · ❌ denegado

| Recurso / Acción | SuperAdmin | Admin | Profesor |
| ---------------- | ---------- | ----- | -------- |
| Dashboard | ✅ | ✅ | ⚠️ sus grupos |
| Ajustes institución | ✅ | ✅ | ❌ |
| Estudiantes — ver/crear/editar/activar | ✅ | ✅ | ⚠️ sus grupos |
| Estudiantes — eliminar | ✅ | ✅ | ❌ |
| Importar Excel | ✅ | ✅ | ⚠️ sus grupos |
| Cuerpo docente — ver | ✅ | ✅ | ✅ |
| Cuerpo docente — CRUD | ✅ | ✅ | ❌ |
| Grupos — ver | ✅ | ✅ | ⚠️ asignados |
| Grupos — CRUD | ✅ | ✅ | ❌ |
| Exámenes — CRUD/publicar/eliminar | ✅ | ✅ | ⚠️ sus grupos |
| Preguntas — CRUD/importar | ✅ | ✅ | ⚠️ sus grupos |
| Resultados finales y en vivo | ✅ | ✅ | ⚠️ sus grupos |

---

## 7. Funcionalidades principales

### 7.1 Panel de institución (`/[slug]`)

- **Dashboard** con métricas y accesos rápidos.
- **Estudiantes** — CRUD, activación, importación masiva por Excel, scoping por grupo.
- **Grupos** — CRUD con cascada Carrera → Semestre → Ramos.
- **Cuerpo docente** — CRUD de profesores.
- **Académico** — Carreras (`/programs`), Períodos (`/periods`), Ramos (`/courses`), con labels dinámicos según `InstitutionType`.
- **Exámenes** — Listado, creación, edición (`/exams/[id]/edit`), publicación.
- **Preguntas** — CRUD e importación; banco de preguntas reutilizable por institución (`BankQuestion`).
- **Resultados** — Finales (`/results`) y en vivo (`/liveresults`).
- **Ajustes** (`/settings`) — configuración de la institución.
- **Ayuda** (`/ayuda`) — centro de ayuda con capturas por rol.
- **Upgrade** (`/upgrade`) — cambio de plan (solo Administrador).

### 7.2 Panel global (`/config`) — SuperAdmin

CRUD de: instituciones, administradores, planes internos, límites de plan, grupos, programas, períodos, estudiantes, exámenes, suscripciones, pagos, facturación, auditoría y configuración global.

### 7.3 Portal del estudiante (`/examen`)

- Login por **RUT** sin contraseña → aterriza siempre en `/examen/seleccion`.
- Clasificación: **Disponible ahora**, **Próximos**, **Ya rendidos**.
- Instrucciones (`/examen/[examId]/intro`) → **Comenzar examen** inicia cronómetro (`beginExam`).
- Carrusel de preguntas (`ExamCarousel`) con guardado por `attemptKey`.
- **Auto-entrega** al agotarse el tiempo.
- Reanudación segura: si vuelve con intento vencido, se califica y redirige a resultado (nunca vuelve al login por intento vencido).

### 7.4 Registro self-service (`/registro`)

- **Free** (`/registro/free`) — alta inmediata.
- **Docente** y **Colegio** (`/registro/docente`, `/registro/colegio`) — post-pago vía MercadoPago.
- Páginas de éxito/error por flujo.

---

## 8. Modelo de datos

PostgreSQL con IDs UUID nativos. Esquema completo en `prisma/schema.prisma`.

### Entidades principales

| Modelo | Propósito |
| ------ | --------- |
| `UserRole` | Catálogo de 4 roles |
| `AcademicInstitution` | Institución (`slug` único, `isDemo`, `plan`, `type`, `customPlanId`, SEO) |
| `Program` | Carrera / Nivel / Área según `InstitutionType` |
| `AcademicPeriod` | Período (2025 - Semestre 1…), `name` único por institución |
| `CourseSection` | Ramo/asignatura — cruza programa + período + profesores (N:M) + grupo |
| `ProgramCoordinator` | Vínculo Profesor↔Programa (Jefe de Carrera) |
| `Group` | Grupo de estudiantes (Carrera + Semestre + Ramos) |
| `User` | Usuario (email y RUT únicos) |
| `Exam` | Examen (timeLimit, notas, anti-cheat, ventana horaria, M2M grupos, `demoSessionId`) |
| `Question` | Pregunta (puntos, orden, tipo, dificultad, tags, feedback) |
| `Option` | Opción (`isCorrect`) |
| `Answer` | Respuesta del estudiante (unique por `attemptKey + questionId`) |
| `ExamAttempt` | Intento en curso (permite reanudar; `endsAt` nulo = no comenzó) |
| `TabSwitchEvent` | Evento de cambio de pestaña (anti-cheat) |
| `Result` | Resultado final (unique por `studentId + examId`) |
| `BankQuestion` / `BankOption` | Banco de preguntas reutilizable por institución |
| `AuditLog` | Trazas de auditoría |
| `PlanLimits` | Límites por plan comercial |
| `CustomPlan` | Plan interno a medida (no comercial) |
| `Subscription` | Suscripción (MercadoPago) |
| `Payment` | Pago |
| `WebhookEvent` | Webhooks entrantes (idempotencia) |
| `AppConfig` | Configuración global key/value |

### Enums

`Plan`, `SubscriptionStatus`, `PaymentStatus`, `InstitutionType`, `PeriodType`, `QuestionType` (UNICA/MULTIPLE), `QuestionDifficulty` (FACIL/MEDIA/DIFICIL).

---

## 9. Flujos clave

### 9.1 Flujo del examen (estudiante)

```
Login RUT → /examen/seleccion
            ├─ Disponible ahora → /examen/[examId]/intro → beginExam (arranca cronómetro)
            │                                              → ExamCarousel (guarda por attemptKey)
            │                                              → auto-entrega al agotar tiempo
            │                                              → /examen/resultado/[resultId]
            ├─ Próximos (fuera de ventana)
            └─ Ya rendidos
```

- **Ventana horaria**: `Exam.scheduledAt` (inicio) / `Exam.closesAt` (cierre). Gating en `startSelectedExam`.
- **Calificación**: all-or-nothing por pregunta. Escala configurable (`maxGrade`, `passingGrade`, `passingPercentage`).

### 9.2 Autenticación (dos sistemas)

- **Admin (NextAuth v5)** — Credentials (email + bcrypt). JWT con `id`, `name`, `email`, `userRoleName`, `academicInstitutionId`, `institutionSlug`. Config en `src/features/auth/auth.ts`.
- **Estudiante (Jose HS256)** — Login por RUT sin contraseña. Cookie independiente de NextAuth. Lógica en `src/features/exam-session/lib/session.ts` + `src/features/students/actions/student-auth.ts`.

### 9.3 Upgrade de plan

- Plan comercial en `AcademicInstitution.plan` (`FREE` · `DOCENTE` · `COLEGIO` · `INSTITUCIONAL`).
- **Docente/Colegio** — `upgradePlan()` crea `Subscription`, llama `createPreapproval` y redirige al `init_point` de MercadoPago. El webhook `/api/webhooks/mercadopago` activa el plan automáticamente.
- **Institucional** — abre `QuoteDialog`, envía email de cotización al SuperAdmin vía Brevo.
- Precios fuente de verdad: `src/features/subscriptions/lib/mercadopago.ts` (`PLAN_PRICES`, `getAutoRecurring`).

---

## 10. Proxy y seguridad

`src/proxy.ts` (Next.js 16 reemplaza `middleware.ts` por `proxy.ts`):

1. Rutas públicas (`/_next`, `/api`, `/favicon.ico`, `/examen`, `/demo`, `/login`, `/`, `/registro`, `/empresa`, `/recursos`, `/audiencias`) → pasan sin validar.
2. `/config/*` → requiere `userRoleName === 'SuperAdministrador'`, sino redirige a `/login`.
3. `/[slug]/*` → requiere sesión con `institutionSlug` coincidente. SuperAdmin pasa; institución incorrecta redirige a su propio slug.
4. Estudiante sin sesión NextAuth → redirige a `/examen/login`.

**Reglas de seguridad**: validación Zod en boundaries, escapes por contexto, never exponer secrets, Server Actions con `requireInstitutionAccess` + scoping anti-IDOR.

---

## 11. Planes, límites y monetización

| Plan | Descripción |
| ---- | ----------- |
| FREE | Básico, incluye demo |
| DOCENTE | Pago recurrente (MercadoPago) |
| COLEGIO | Pago recurrente (MercadoPago) |
| INSTITUCIONAL | Cotización a medida (Brevo) |

- `PlanLimits` — límites por plan (grupos, admins, profesores, estudiantes, exámenes/año, programas, cursos).
- `CustomPlan` — plan interno creado por SuperAdmin; sus límites tienen prioridad sobre el comercial si está asignado.
- Cron de limpieza de suscripciones: `/api/cron/cleanup-subscriptions`.

---

## 12. Modo demo público

- Institución `slug = 'aulika-demo'`, `isDemo = true`, plan FREE.
- Acceso: `/demo` → `DemoLoginCard` (credenciales visibles) → panel como Profesor.
- **Aislamiento** por `demoSessionId` (generado en callback `jwt`), viaja en JWT y se guarda en `Exam.demoSessionId`.
- **Limpieza** triple: (1) al `signOut`, (2) seed `prisma/seeders/demo.ts` en cada deploy, (3) cron diario `/api/cron/demo-reset` (`0 6 * * *` UTC, protegido con `CRON_SECRET`).

---

## 13. API y webhooks

| Ruta | Método | Propósito |
| ---- | ------ | --------- |
| `/api/auth/[...nextauth]` | — | Handlers NextAuth |
| `/api/ai/generate-questions` | POST | Generación de preguntas con IA (Google AI) |
| `/api/webhooks/mercadopago` | POST | Activación de planes por suscripción (idempotente vía `WebhookEvent`) |
| `/api/cron/demo-reset` | GET | Purga diaria de la demo (CRON_SECRET) |
| `/api/cron/cleanup-subscriptions` | GET | Limpieza de suscripciones |

---

## 14. Convenciones técnicas

- **Server Components por defecto**; `'use client'` solo cuando es estrictamente necesario.
- **TypeScript strict**, sin `any` (usar `unknown` + narrowing). Sin anotación de retorno en componentes (TS infiere).
- **Imports de React**: `jsx: react-jsx` (transform automático) → no importar `React` para JSX. Tipos comunes vía named imports (`CSSProperties`, `FormEvent`, `ReactNode`…).
- **Tailwind 4** — solo clases utility. Prohibido `style={{ ... }}` con valores directos junto a `className` (excepción: variables CSS puras `--token`).
- **Validación** Zod en todos los formularios (client y server).
- **Navegación** siempre `Link` de `next/link`.
- **Prisma** singleton (`@/shared/lib/prisma`); `$transaction` para operaciones atómicas.
- **Imports absolutos** (`@/...`); orden: React → Next.js → terceros → `@/` → relativos.
- **RUT chileno** almacenado sin puntos ni guión (ej: `270396356`) con validación matemática del dígito verificador. Utilities en `@/shared/lib/rut.ts`; UI canónica `RutField`.
- **DRY** — reutilizar `RutField`, `TablePaginator`, `Timer`, `AdminTopBar` antes de crear nuevos.

### Sub-layout AdminTopBar

`AdminTopBar` se renderiza en un `layout.tsx` servidor (no en el cliente) para SSR del header con datos reales. Si necesita acciones con estado, el botón va en la barra de filtros del componente cliente.

---

## 15. Comandos de desarrollo

```bash
pnpm dev              # Servidor (Turbopack) → http://localhost:3000
pnpm build            # prisma generate + migrate deploy + seed demo + next build
pnpm lint             # Biome check
pnpm lint:fix         # Biome check --write
pnpm type-check       # tsc --noEmit
pnpm test             # Vitest (watch)
pnpm test:run         # Vitest run
pnpm test:e2e         # Playwright
pnpm db:migrate       # Crear y aplicar migración (local)
pnpm db:seed          # Seed base: roles + SuperAdmin
pnpm db:seed:local    # Seed local: instituciones, grupos, admins, profesores, estudiantes
pnpm db:seed:demo     # Seed demo + purge
pnpm db:studio        # Prisma Studio GUI
```

> **Migraciones**: NUNCA SQL manual ni `prisma db execute`. Siempre `pnpm db:migrate` (local) y `prisma migrate deploy` (prod).

---

## 16. Variables de entorno

```bash
DATABASE_URL            # PostgreSQL connection string
AUTH_SECRET             # NextAuth secret
AUTH_URL                # URL base de la app
STUDENT_SESSION_SECRET  # Secret cookies estudiante (Jose)
ADMIN_PASSWORD          # Password SuperAdmin (seed)
ADMIN_NAME              # Nombre SuperAdmin
ADMIN_LASTNAME          # Apellido SuperAdmin
ADMIN_EMAIL             # Email SuperAdmin
ADMIN_RUT               # RUT SuperAdmin (sin puntos ni guión)
CRON_SECRET             # Secret para crons de Vercel
```

(Más credenciales de MercadoPago, Brevo y Google AI según el entorno.)

---

## 17. Testing

### Unitarios (Vitest)
`pnpm test` / `pnpm test:run` / `pnpm test:coverage`.

### E2E (Playwright)
Estructura en `tests/e2e/`:

```
tests/e2e/
├── global-setup.ts    ← autentica admin y superadmin, guarda cookies en .auth/
├── public/            ← páginas sin auth
├── admin/             ← panel institución (carlos.lopez@ulagos.cl)
├── superadmin/        ← panel /config
└── student/           ← flujo estudiante (login incluido)
```

**Credenciales (seed local):**
- Admin: `carlos.lopez@ulagos.cl` / `Admin2026!` → `universidad-de-los-lagos`
- Profesor: `laura.jimenez@ulagos.cl` / `Admin2026!`
- Estudiante: RUT `55.555.555-5`
- SuperAdmin: `ADMIN_EMAIL` / `ADMIN_PASSWORD`

**Prerrequisito:** `pnpm db:seed:local` antes de los tests E2E.

---

## 18. Fuente de verdad

- **Convenciones de desarrollo y flujos detallados** → `CLAUDE.md`
- **Esquema de datos** → `prisma/schema.prisma`
- **Labels académicos** → `src/shared/lib/academic-labels.ts`
- **Roles** → `src/shared/lib/roles.ts`
- **Precios de planes** → `src/features/subscriptions/lib/mercadopago.ts`
