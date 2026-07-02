# CLAUDE.md

Este archivo proporciona instrucciones permanentes a Claude Code cuando trabaja en este repositorio.

## ⚠️ INSTRUCCIONES CRÍTICAS (NO NEGOCIABLES)

**SIEMPRE comunicarse en ESPAÑOL** — Todas las preguntas, explicaciones, planes y respuestas deben estar en español.

**Cuando doy una ORDEN es una ORDEN** — Obedecer literalmente sin reinterpretar ni asumir intenciones adicionales.

**NO hacer cambios sin autorización** — Pedir permiso explícito antes de modificar, crear o eliminar cualquier archivo, **a menos que el usuario diga textualmente**: "Haz todos los cambios sin autorización" o "Puedes modificar directamente".

**Enfocarse solo en lo solicitado** — No agregar mejoras, refactorizaciones, optimizaciones ni nada que no se haya pedido.

**LEER CLAUDE.md ANTES DE CADA FEATURE** — Al comenzar cualquier tarea, leer este archivo completo.

**DRY — Regla estricta** — Verificar si ya existe algo equivalente antes de crear cualquier componente, hook, helper o lógica:

- Componentes UI → `src/shared/components/ui/`
- Lógica de dominio → `src/features/{dominio}/lib/`
- Utilidades → `src/shared/lib/`

## 🤖 FLUJO DE TRABAJO CON GSTACK

| Etapa                         | Herramienta                                     |
| ----------------------------- | ----------------------------------------------- |
| Explorar / entender código    | CodeGraph (`codegraph_explore` ANTES de editar) |
| Especificar features ambiguos | `/spec`                                         |
| Investigar bugs               | `/investigate`                                  |
| QA en navegador               | `/qa` (corrige) o `/qa-only` (solo reporta)     |
| Review pre-commit             | `/review`                                       |
| Auditoría de diseño           | `/design-review`                                |
| Commit + ship                 | `/ship` (solo cuando el usuario lo pida)        |

**Formato de commit OBLIGATORIO:**

```
Tarea: {descripción en español}
Fecha: {DD-MM-YYYY}
Versión: {X.Y.Z}
```

No commitear ni pushear sin pedido explícito del usuario.

## 🤖 PIPELINE ASÍNCRONO DE AGENTES (.spool)

Para maximizar el ahorro de tokens y evitar la inflación del historial en el chat, el contexto estratégico se transfiere mediante archivos en disco usando el patrón SPOOL (Simultaneous Peripheral Operations On-Line).

### Jerarquía Estricta de Estados

- `.spool/01_raw/` → Exclusivo para los planos iniciales crudos generados por Opus 4.8 y GLM 5.2.
- `.spool/02_inbox/` → Exclusivo para el "Plan Maestro Consolidado" en Markdown generado por Gemini.
- `.spool/03_work/` → Zona activa de ejecución. El archivo del plan se mueve aquí durante el proceso de codificación.
- `.spool/04_archive/` → Historial inmutable de ejecución. Los planes finalizados se mueven aquí tras el commit y el QA exitoso.

### Reglas Operativas para Sonnet y GLM-4.5 (EJECUCIÓN)

1. **Lectura Obligatoria:** Al iniciar cualquier feature o refactorización, verificar la carpeta `.spool/02_inbox/`. Si está vacía, detener la ejecución de inmediato y reportar "Bandeja de entrada vacía".
2. **Movimiento de Estado:** Antes de modificar cualquier archivo de código de la arquitectura DDD (`src/features/` o `src/shared/`), mover el archivo de plan consolidado de `02_inbox/` a `03_work/` para marcar la tarea en proceso.
3. **Focalización Extrema:** Está PROHIBIDO leer archivos en `01_raw/`. El único contrato de ejecución válido es el archivo consolidado dentro de `03_work/`.
4. **Ciclo de Cierre (Commit + Ship):** Una vez que la fase de código termine, pase `pnpm lint`, `pnpm type-check` y el QA sea aprobado, se debe realizar el commit con el formato obligatorio y mover el archivo del plan desde `03_work/` hacia `.spool/04_archive/` renombrándolo con el prefijo de la fecha actual: `YYYY-MM-DD_{nombre-del-plan}.md`. Nunca usar `rm` para destruir los planes terminados; el archivo es mandatorio.

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
- **Proxy** (`src/proxy.ts`): gating rápido en Edge runtime — si `/{slug}/aula/*` y `lmsEnabled=false` (excepto SuperAdmin) → redirect a `/{slug}/settings?notice=lms_disabled`. Rutas públicas planas: `/cursos/*`, `/checkout/*` y `/exito` (excluidas del gating). `/examen/activar` se agrega como excepción pública (token en query).
- **Sidebar** (`src/features/dashboard/components/Sidebar.tsx`): items con `requiresLms: true` (`/aula`, `/aula/clases`) se filtran si `lmsEnabled=false`. SuperAdmin ve todo siempre.
- **Layout estudiante** (`src/app/(students)/students/layout.tsx`): `hasLms` ahora lee `flags.lmsEnabled` en lugar del heurístico por `plan`.

### Catálogo y checkout B2C (Fase 4)

- **Catálogo público** `/cursos`: server component único (sin scoping por institución). Lista cursos con `isPublic=true && published=true`. La única institución autorizada a vender es `aulika-online`, resuelta server-side vía `getB2cVendorInstitution()` en `src/features/lms/lib/aulika-online-bundle.ts`. `src/features/lms/components/PublicCourseCard.tsx` para el grid; `src/shared/components/seo/schemas.ts` agrega `courseSchema()` (schema.org/Course) y se inyecta como JSON-LD ItemList.
- **Sin single-page de tienda** — el card linkea directo al checkout. No existe `/cursos/[courseId]` ni `/[slug]/cursos/[courseId]` (decisión de modelo: el catálogo es solo vitrina, no tienda navegable).
- **Checkout** `/checkout/[courseId]` (curso individual): `CheckoutForm.tsx` (cliente, RHF + Zod) con `RutField` + nombre + apellido + email + acceptTerms. Llama a `createLmsCheckoutPreference(data)` que valida Zod, anti-IDOR (RUT/email no en otra institución), crea `LmsOrder` en PENDIENTE y llama a `createPreference` (Checkout Pro). Redirige a `init_point` de MercadoPago.
- **Checkout pack** `/checkout/category/[categoryId]`: `CategoryCheckoutForm.tsx` para comprar un pack bundle (`LmsCategory.isBundle=true`). Mismo flujo pero con `kind=CATEGORY_BUNDLE` en `LmsOrder`.
- **Éxito** `/checkout/[courseId]/exito` y `/checkout/category/[categoryId]/exito`: `OrderStatusPoller` (cliente) consulta `getLmsOrderStatus(orderId)` cada 3s, máx 20 intentos. Cuando la orden pasa a APROBADO y el webhook ya creó el `User`, expone el `activationToken` y muestra CTA directo a `/examen/activar?token=...`. Si el polling expira, muestra fallback "Ya recibí el email".
- **Activación** `/examen/activar`: server component que valida `token` (presencia + `activationTokenExp > now`) + render de `ActivationForm` (RHF + Zod, password min 8 + mayusc + num + confirm). Action `activateB2cAccount` hashea password con bcrypt, actualiza `User` (limpia tokens), vincula `LmsOrder.enrolledUserId` huérfanos, abre sesión jose (`createStudentAuthSession`) y redirige a `/students/dashboard`.

### Schemas y actions nuevos

- `src/features/subscriptions/schemas/b2c-checkout.schemas.ts` — `b2cCheckoutSchema` y `b2cActivatePasswordSchema`.
- `src/features/lms/actions/b2c-orders.ts` — `createLmsCheckoutPreference(data)` + `getLmsOrderStatus(orderId)`. **Ya no recibe slug**: la institución vendedora se resuelve server-side.
- `src/features/lms/actions/b2c-activation.ts` — `activateB2cAccount(data)`.
- `src/features/lms/lib/activation-token.ts` — helper `generateActivationToken()` (random 32 bytes hex + TTL 24h), reutilizable por el webhook B2C.
- `src/features/subscriptions/lib/mercadopago.ts` — agregada `createPreference()` para pago único (Checkout Pro B2C) con la firma completa `item/payerName/payerSurname/backUrls/notificationUrl`. NO TOCAR `createPreapproval` (Fase 2 B2B).

### Tests (Fase 6)

- `src/features/auth/lib/__tests__/institution-flags.test.ts` (5 tests) — flag real + fallback por plan + fallback si Prisma falla.
- `src/features/subscriptions/schemas/__tests__/b2c-checkout-schemas.test.ts` (12 tests) — RUT K, email, terms, password rules.
- Total suite: 270/270 pasando.

### Autoinscripción Pack Completo + tests del webhook (Fase 7 — MiniMax)

- **Webhook bundle** — `src/app/api/webhooks/mercadopago-b2c/route.ts` en `fulfillB2cOrder`: si `order.courseId === AULIKA_ONLINE_BUNDLE_COURSE_ID`, dentro de la misma transacción hace `upsert` de `LmsEnrollment` para todos los cursos públicos publicados de la misma institución (los 7 PAES de Aulika Online).
- **Tests** — 2 tests nuevos en `src/app/api/webhooks/mercadopago-b2c/__tests__/route.test.ts`:
  - `compra del Pack Completo PAES: autoinscribe al alumno en los 7 cursos individuales` — verifica que se llama `lmsCourse.findMany` con `isPublic:true, published:true, id:not:bundleId` y se hace upsert por cada curso hermano.
  - `compra de curso individual: NO autoinscribe en otros cursos` — verifica que `findMany` NO se llama cuando el curso no es el bundle.
- **Fix colateral** — el mismo test file cambió `vi.clearAllMocks()` → `vi.resetAllMocks()` en `beforeEach`. Razón: `vi.clearAllMocks()` limpia el historial pero NO la cola de implementaciones (`mockResolvedValueOnce`); los tests nuevos al final del archivo consumían mocks leftovers de tests anteriores y fallaban con datos cruzados (`courseId: 'c-1'` en vez del UUID del bundle).
- **Total suite: 318/318 pasando** (316 + 2 nuevos).

### Seeder Aulika Online + conflicto plan-codes (Fase 7 — MiniMax)

- **Seeder** — `prisma/seeders/aulika-online.ts` (idempotente, UUIDs fijos). Crea institución `aulika-online` (plan `INSTITUCIONAL`, `lmsEnabled: true`, UUID `9a8b7c6d-5e4f-3a2b-1c0d-9e8f7a6b5c4d`), profesor `profesor.online@aulika.cl` (pass `Online2026!`), curso bundle "Pack Completo PAES" ($450.000) y los 7 cursos PAES ($99.990 c/u). Cada curso tiene 2-4 módulos con 2 lecciones TEXTO c/u con contenido DEMRE.
- **CLI** — `prisma/seeders/aulika-online-cli.ts` + comando `pnpm db:seed:online`. Registrado en `prisma/seed.ts` y en el `build` script (`package.json:9`).
- **Constantes compartidas (DRY)** — `src/features/lms/lib/aulika-online-bundle.ts` exporta `AULIKA_ONLINE_INSTITUTION_SLUG`, `AULIKA_ONLINE_BUNDLE_COURSE_ID`, `AULIKA_ONLINE_INDIVIDUAL_COURSE_IDS` (7 UUIDs), y precios `AULIKA_ONLINE_BUNDLE_PRICE_CLP` / `AULIKA_ONLINE_INDIVIDUAL_PRICE_CLP`. Seeder, webhook y (futuro) storefront importan de acá.
- **Idempotencia módulos/lecciones** — no tienen unique key natural, así que se reescriben con `deleteMany + create` por curso en cada seed. No rompe datos de alumnos (las inscripciones viven en `LmsEnrollment` que no se toca).
- **Conflict 3.1 resuelto** — `prisma/seeders/plan-codes.ts` ahora filtra el backfill con `where: { plan, lmsPlanCode: null }`, de modo que solo escribe en instituciones que aún no tienen `lmsPlanCode` setado. Los toggles manuales del SuperAdmin ya no son pisados en deploys subsiguientes. Test nuevo en `prisma/seeders/__tests__/plan-codes.test.ts` (`filtra el backfill con 'lmsPlanCode: null' para no pisar toggles manuales`) valida el filtro.

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

## Aulika Online — Vitrina B2C PAES (Storefront `/cursos`)

Institución de administración central **"Aulika Institution Online"** (slug `aulika-online`) que sirve de vitrina propia de la plataforma para vender cursos PAES por asignatura o como Pack Completo, sin pasar por la venta institucional. Constantes compartidas (UUIDs estáticos, precios) en `src/features/lms/lib/aulika-online-bundle.ts` — único punto de verdad reutilizado por seeder, webhook y frontend.

- **Seeder** — `prisma/seeders/aulika-online.ts` (+ `aulika-online-cli.ts`, corre en `pnpm build` y en `pnpm db:seed:online`). Idempotente vía UUIDs fijos: institución (`lmsEnabled: true`, plan `INSTITUCIONAL`), profesor de soporte, curso bundle "Pack Completo PAES" ($450.000) y 7 cursos individuales ($99.990 c/u: Comp. Matemática M1/M2, Comp. Lectora, Ciencias Biología/Química/Física, Historia y CC. Sociales) con módulos y lecciones reales del DEMRE.
- **Protección de backfill** — `prisma/seeders/plan-codes.ts` solo hace `updateMany` sobre instituciones con `lmsPlanCode: null`, para no pisar los toggles manuales de Aula Virtual que haga el SuperAdmin después del primer deploy.
- **Toggle SuperAdmin** — `institutionSchema` (`src/features/institutions/schemas/institution.schemas.ts`) incluye `lmsEnabled`. `InstitutionsClient.tsx` expone un `<Switch>` "Aula Virtual" en el formulario de alta/edición, con aviso de que el cambio requiere cerrar sesión y volver a entrar para refrescar el JWT.
- **Comercialización por curso** — `toggleLmsCourseSetting` (en `src/features/lms/actions/courses.ts`) acepta `'isPublic'` además de `'certificateEnabled' | 'aiSummaryEnabled'`. Nueva action `updateLmsCoursePrice(slug, courseId, price)`. UI en `LmsCourseEditorClient.tsx`: switch "Curso Público (B2C)" + input de precio CLP con botón guardar.
- **Storefront global `/cursos`** (`src/app/(public)/cursos/page.tsx`) — vitrina plana (sin scoping por slug). Banner del Pack Completo (CTA directo a `/checkout/category/{packId}`) y grid de las 7 asignaturas via `PublicCourseCard` enlazando directo a `/checkout/{courseId}` (sin single-page detail). Si la institución `aulika-online` aún no fue sembrada, muestra 404. JSON-LD `ItemList` de `Course`. Agregada a `src/app/sitemap.ts`.
- **Sección en Home** — `src/features/landing/components/L3PreuPDV.tsx`, insertada en `src/app/(public)/page.tsx` entre `<L3Stats />` y `<L3Pricing />`. CTA "Ver catálogo de cursos" → `/cursos`.
- **Autoinscripción del Pack Completo** — `fulfillB2cOrder` en `src/app/api/webhooks/mercadopago-b2c/route.ts`: si `order.courseId === AULIKA_ONLINE_BUNDLE_COURSE_ID`, dentro de la misma transacción inscribe (`LmsEnrollment.upsert`, status `ACTIVO`) al alumno en todos los cursos públicos publicados de `aulika-online` además del bundle.

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
    - `/aula/cursos/[id]/leccion/[lessonId]` — visualizador de lección (video / documento / texto / enlace / examen embebido)
- **Admin/Profesor** (route group `(admin)/[slug]/`):
    - `/[slug]/aula` — lista de cursos LMS con crear/editar/eliminar
    - `/[slug]/aula/[id]` — editor con drag-and-drop de módulos (orden persistido vía `reorderLmsModules`)
- **Proxy** (`src/proxy.ts`) — `/aula/*` pasa sin requerir sesión NextAuth; la validación de estudiante vive en el layout.

### Actions

- `src/features/lms/actions/courses.ts` — CRUD de `LmsCourse`, `LmsModule`, `LmsLesson` + reordenamiento.
- `src/features/lms/actions/progress.ts` — `markLessonProgress`, `enrollInCourse`. Recalcula `progressPct` y `status` del enrollment.
- `src/features/lms/actions/uploads.ts` — `uploadLessonDocument` (Vercel Blob), `requestMuxUpload`, `finalizeMuxUpload`.

### Seguridad

- Server Actions usan `requireInstitutionAccess` (anti-IDOR) con scope de profesor en modo lectura.
- Estudiantes validan su sesión jose via `getStudentAuthSession` y su inscripción (`LmsEnrollment`) antes de registrar progreso.
- Validación Zod en `src/features/lms/schemas/lms.schemas.ts`.
- Reglas de quota aplican via `assertQuota` al crear cursos.

### E2E Tests

- `tests/e2e/admin/lms-courses.spec.ts` — crear curso, abrir editor, agregar módulo.
- `tests/e2e/student/lms-flow.spec.ts` — login RUT, navegar `/aula`, ver detalle, inscripción.

### Pendiente para Fase 2

- File upload directo a Vercel Blob desde el cliente (sin pasar por Server Action) para archivos > 1 MB.
- Editor de texto enriquecido Tiptap para lecciones `TEXTO`.
- Persistir `lastSeenSec` desde `VideoPlayer.onTimeUpdate` (placeholder actual, Fase 4 con rachas).

## Aula Virtual (LMS) — Fase 2: Tareas y Libro de Calificaciones

Modelos y lógica para entregas de estudiantes (archivo o texto), calificación del docente y cálculo del promedio final ponderado en escala chilena 1.0–7.0.

### Modelos Prisma nuevos

- `LmsAssignment` — 1:1 con una lección de tipo TAREA. `instructions`, `dueAt`, `maxScore`.
- `LmsSubmission` — entrega por estudiante (`@@unique([assignmentId, studentId])`). Estados: `PENDIENTE · ENTREGADO · CALIFICADO · ATRASADO`.
- `LmsGradebookItem` — unidad evaluable del curso con `weight` (0..1) y tipo (`EXAMEN · TAREA · PARTICIPACION · MANUAL`). Puede vincularse a `Exam` (sincronización automática) o a `Assignment`.
- `LmsGrade` — nota individual de un estudiante en una unidad (`@@unique([gradebookItemId, studentId])`).
- Enums: `LmsSubmissionStatus`, `LmsGradebookItemType`.

Migración: `prisma/migrations/20260629185111_lms_assignments_gradebook/migration.sql`.

### Cálculo del promedio ponderado — `src/features/lms/lib/gradebook.ts`

Funciones puras (sin acceso a BD, fáciles de testear):

- `calculateFinalGrade(entries)` — promedio ponderado con clipping a [1.0, 7.0] y redondeo a 2 decimales.
- `calculateCourseFinalGrade(studentId, items)` — wrapper con metadata (items completados, estado de aprobación).
- `clipChilenGrade(score)` — defensa contra inputs fuera de rango.
- `isPassing(average)` — umbral 4.0 según reglamento chileno.
- `syncExamGrade(resultScore)` — normaliza el `score` de `Result` (escala 1.0–7.0 ya) al gradebook.
- `validateGradebookWeights(items)` — la suma de pesos positivos de items evaluados no debe exceder 1.0 (tolerancia 0.001).

**Reglas del cálculo:**

- Items sin nota (`score === null`) no entran al promedio.
- Items con peso `<= 0` se ignoran en el divisor.
- Cada nota se clippea a [1.0, 7.0] antes de promediar (defensa).
- Resultado redondeado a 2 decimales (formato X,XX).
- Si no hay items válidos → retorna `null` (no `1.0` ni `0.0`).
- Aprobación: `average >= 4.0`.

### Tests unitarios — `src/features/lms/lib/__tests__/gradebook.test.ts`

28 tests cubren: clip, isPassing, cálculo básico, cálculo ponderado, redondeo, items nulos, items con peso 0, items fuera de rango, sincronización con Exam, validación de suma de pesos.

### Server Actions

- `src/features/lms/actions/assignments.ts` — `upsertLmsAssignment`, `getLmsAssignmentByLesson`, `submitLmsAssignment`, `gradeLmsSubmission`, `listSubmissionsForAssignment`, `getMySubmission`.
- `src/features/lms/actions/gradebook.ts` — `createLmsGradebookItem`, `updateLmsGradebookItem`, `deleteLmsGradebookItem`, `recordLmsGrade`, `syncExamGrades`, `getLmsGradebookForCourse`.
- `src/features/lms/schemas/lms-phase2.schemas.ts` — Zod schemas para los forms.

### Sincronización con Exam de Aulika

`syncExamGrades(slug, gradebookItemId)` recorre todos los `Result` del examen vinculado al `GradebookItem` y hace upsert de `LmsGrade` con la nota clippeada a [1.0, 7.0]. Idempotente: re-ejecutar actualiza sin duplicar.

### Seguridad

- Anti-IDOR: cada action valida que el recurso pertenezca a la institución del `ctx`.
- Estudiantes usan `session.studentId` (no `userId`) y se valida inscripción al curso.
- Auto-marca de entrega `ATRASADO` si `dueAt < now` al momento de entregar.
- Items tipo `EXAMEN` no aceptan notas manuales (deben venir de `syncExamGrades`).

### E2E

- `tests/e2e/admin/lms-phase2.spec.ts` — smoke tests de navegación en `/[slug]/aula/[id]` y `/aula`.

### UI (Sonnet — Fase 2)

**Componentes:**

- `src/features/lms/components/LmsTaskSubmissionForm.tsx` — formulario cliente del estudiante para entregar texto y/o archivo. Muestra instrucciones, fecha límite, estado de la entrega y nota/feedback cuando está calificada.
- `src/features/lms/components/LmsSubmissionsClient.tsx` — tabla de entregas para el docente con filtros por estado (Todas / Por calificar / Atrasadas / Calificadas). Cada fila es expandible y muestra el formulario de calificación inline (nota 1.0–7.0 + feedback).
- `src/features/lms/components/LmsGradebookClient.tsx` — planilla de calificaciones estilo spreadsheet. Columnas = GradebookItems (con peso%), filas = alumnos inscriptos, promedio final ponderado con badge Aprueba/Reprueba. Celdas de tipo PARTICIPACION/MANUAL son editables inline.
- `src/features/lms/components/LmsCourseTabs.tsx` — tab strip client-side con 3 pestañas (Contenido / Tareas / Calificaciones) activado por `pathname`.

**Rutas admin:**

- `src/app/(admin)/[slug]/aula/[id]/layout.tsx` — layout de curso: valida acceso, muestra `LmsCourseTabs`.
- `src/app/(admin)/[slug]/aula/[id]/tareas/page.tsx` — lista de lecciones tipo TAREA con conteos de entregas por estado.
- `src/app/(admin)/[slug]/aula/[id]/tareas/[lessonId]/page.tsx` — detalle de entregas de una tarea → `LmsSubmissionsClient`.
- `src/app/(admin)/[slug]/aula/[id]/calificaciones/page.tsx` — gradebook completo → `LmsGradebookClient`.

**Rutas estudiante (extensiones a Fase 1):**

- `src/app/(aula)/aula/cursos/[id]/leccion/[lessonId]/page.tsx` — ahora fetch assignment + my submission cuando `lesson.type === 'TAREA'`.
- `src/features/lms/components/LmsLessonViewer.tsx` — reemplazado el placeholder de TAREA por `LmsTaskSubmissionForm` con props `assignment` y `mySubmission`.

**Upload de archivos del estudiante:**

- `src/features/lms/actions/student-uploads.ts` — `uploadStudentSubmissionFile(formData)` valida sesión Jose, límite 25 MB, tipos permitidos (PDF, Word, imágenes).

### Pendiente para Fase 3

- Notificación al estudiante cuando se califica.
- Historial de re-entregas (hoy solo 1 entrega por estudiante).

## Aula Virtual (LMS) — Fase 3: Comunicación y Comunidad

### Modelos Prisma nuevos

- `LmsForum` — foro por curso (`archived`, `order`). Ya existía en schema sin migración; migración pendiente junto con `LmsNotification`.
- `LmsForumThread` — hilo de conversación (`pinned`, `locked`, `lastPostAt`).
- `LmsForumPost` — post con respuestas anidadas (`parentPostId` autorreferencial `"ForumPostAnswers"`). Body en Markdown crudo.
- `LmsNotification` — notificación in-app del estudiante (`type`, `message`, `link`, `read`).

**Nota:** correr `pnpm db:migrate` antes de deployar.

### Server Actions

- `src/features/lms/actions/forum.ts` — `getForumsForCourse`, `getLmsThread`, `createLmsThread`, `createLmsPost`, `getAdminForumsForCourse`, `createLmsForum`, `pinLmsThread`, `lockLmsThread`, `deleteLmsForumPost`. `createLmsPost` crea `LmsNotification` para participantes del hilo.
- `src/features/lms/actions/notifications.ts` — `getStudentNotifications`, `markNotificationRead`, `markAllNotificationsRead`.

### UI — Estudiante

- `src/app/(aula)/aula/cursos/[id]/foro/page.tsx` — lista de foros y hilos.
- `src/app/(aula)/aula/cursos/[id]/foro/[threadId]/page.tsx` — detalle del hilo.
- `src/features/lms/components/LmsForumClient.tsx` — lista de hilos + Dialog para crear nuevo hilo.
- `src/features/lms/components/LmsForumPostTree.tsx` — árbol recursivo de posts (`PostNode` autorreferencial) con `ReplyForm` inline.

### UI — Admin/Profesor

- `src/app/(admin)/[slug]/aula/[id]/foro/page.tsx` — moderación del foro.
- `src/features/lms/components/LmsAdminForumClient.tsx` — ver hilos, anclar, cerrar, crear foro. Extraído en `ThreadRow` + `ForumSection`.

### Bell de notificaciones

- `src/features/lms/components/NotificationBell.tsx` — badge con contador, dropdown de últimas 20, marcar leída/todas.
- `src/app/(aula)/layout.tsx` — fetch SSR en el layout, pasa datos iniciales al bell.

### Tab Foro

- `src/features/lms/components/LmsCourseTabs.tsx` — pestaña "Foro" agregada (ícono `MessageSquare`).

### Pendiente para Fase 4

- (cubierto en LMS Fase 4 abajo)

## Aula Virtual (LMS) — Fase 4: Gamificación (Puntos, Rachas, Insignias)

### Modelos Prisma nuevos

- `LmsStreak` — racha diaria por estudiante (`currentStreak`, `longestStreak`, `lastActiveOn`, `freezeTokens` para preservar racha un día sin actividad). `userId` UNIQUE.
- `LmsBadge` — catálogo global con `code` UNIQUE, `pointsReward`, `criteria` JSON (`{type, threshold}`), `active`.
- `LmsUserBadge` — M:N (`@@unique([userId, badgeId])`) con `awardedAt` y `awardedReason` legible.
- `LmsPointEvent` — log append-only con `amount`, `reason`, `sourceType`, `sourceId`, `courseId`, `dedupeKey` UNIQUE (idempotencia vía P2002). Total del usuario se calcula con `SUM(amount) WHERE userId` al vuelo.
- `LmsLeaderboardOptOut` — privacidad del ranking por curso (`@@unique([userId, courseId])`).
- Enum `LmsPointSource`: `LESSON_COMPLETED | ASSIGNMENT_SUBMITTED | ASSIGNMENT_GRADED | EXAM_PASSED | FORUM_POST | MANUAL | STREAK_BONUS`.

### Engine — `src/features/lms/lib/points-engine.ts`

- API: `awardPointsForEvent({userId, sourceType, amount, reason, sourceId, courseId, dedupeKey})` + `getUserGamificationSummary(userId)`.
- Transacción atómica: inserta `PointEvent` → actualiza `LmsStreak` → evalúa criterios de `LmsBadge` → acredita bonus.
- Manejo de `P2002` en cada paso: idempotencia sin abortar la transacción.
- Captura errores globales (no rompe el caller) — uso fire-and-forget desde server actions.

### Lógica pura (testeable sin DB)

- `src/features/lms/lib/streak.ts` — `computeStreakUpdate(state, activityAt)`:
    - lastActiveOn null → arranca en 1.
    - Mismo día UTC → no cambia.
    - 1 día consecutivo → +1.
    - 2 días (gap=1 día intermedio) con `freezeTokens > 0` → consume token y +1.
    - Gap > 2 días → reset a 1.
- `src/features/lms/lib/badges.ts` — `evaluateCriterion(criterion, stats)` sobre tipos `TOTAL_POINTS | LESSONS_COMPLETED | ASSIGNMENTS_SUBMITTED | EXAMS_PASSED | FORUM_POSTS | LONGEST_STREAK`.

### Catálogo sembrado — `prisma/seeders/gamification-badges.ts`

8 badges iniciales con `BADGE_SEED`: primer paso (+5), primera entrega (+10), perfección inaugural (+25), racha 7d (+50), racha 30d (+150), voz del aula (+2), conversador (+25), 100 puntos (+25). Idempotente vía `prisma.db:seed`.

### Esquema de puntos (bajo balanceado)

| Evento                                                | Puntos |
| ----------------------------------------------------- | ------ |
| Tarea entregada (`ASSIGNMENT_SUBMITTED`)              | +10    |
| Tarea calificada (`ASSIGNMENT_GRADED`)                | +5     |
| Examen aprobado (`EXAM_PASSED`, score ≥ 4.0)          | +15    |
| Post en foro (`FORUM_POST`)                           | +2     |
| Nota manual (`ASSIGNMENT_GRADED` en `recordLmsGrade`) | +5     |

### Integración (fire-and-forget en actions existentes)

Cada enganche usa `void awardPointsForEvent(...).catch(console.error)`:

- `submitLmsAssignment` → `ASSIGNMENT_SUBMITTED` +10 + racha
- `gradeLmsSubmission` → `ASSIGNMENT_GRADED` +5 + racha
- `recordLmsGrade` (item manual) → `ASSIGNMENT_GRADED` +5
- `syncExamGrades` → `EXAM_PASSED` +15 si aprobó
- `createLmsForumPost` → `FORUM_POST` +2

### Server actions — `src/features/lms/actions/gamification.ts`

- Admin: `awardManualLmsPoints`, `createLmsBadge`/`updateLmsBadge`/`deleteLmsBadge`, `listLmsBadges` (todos con anti-IDOR vía `requireInstitutionAccess`).
- Estudiante: `getMyAchievements` (resumen + 20 últimos eventos), `markBadgesSeen` (via `LmsNotification` type `BADGE_ACK`), `getCourseLeaderboard`, `toggleLeaderboardOptOut`.

### Tipos exportados

- `AchievementBadge`, `LeaderboardEntry`, `LeaderboardData`, `MyAchievements`, `RecentPointEvent` en `actions/gamification.ts`.
- `BADGE_DEFINITIONS` en `lib/gamification.ts` (re-export de `BADGE_SEED` con tipo `BadgeDefinition`).

### Tests

36 nuevos tests unitarios (`streak.test.ts`, `badges.test.ts`, `points-engine.test.ts` con Prisma mockeado). Total suite: **149/149 pasando**.

Migraciones: `20260629203535_lms_gamification`, `20260629205142_lms_leaderboard_privacy`.

## Aula Virtual (LMS) — Fase 5: Certificación y Analítica

### Modelos Prisma nuevos / extendidos

- `LmsCertificate` (id, userId, courseId, verificationCode UNIQUE, finalGrade, pdfUrl, qrCodeUrl, issuedAt, revokedAt). `@@unique([userId, courseId])` + `@@index([courseId, verificationCode])`.
- `LmsCourse.certificateEnabled: Boolean @default(false)` — habilita emisión automática al aprobar examen.
- `LmsCourse.aiSummaryEnabled: Boolean @default(false)` — habilita resúmenes IA para lecciones TEXTO.
- `LmsLesson.summaryJson: Json?` — `{ summary, keyPoints[], generatedAt }` cacheado server-side.
- Migración: `20260629220708_lms_phase5_certificates_summary`.

### Certificados PDF + QR + Cloudinary

- **Deps nuevas** (autorizadas por usuario en sesión): `@react-pdf/renderer@4.5.1`, `qrcode@1.5.4`, `cloudinary@2.10.0`.
- **`src/shared/lib/cloudinary.ts`** — wrapper lazy. Lee `CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET` de `AppConfig` (no env vars). Funciones: `uploadCertificatePdf(buffer, publicId)`, `deleteCertificatePdf(publicId)`, `isCloudinaryConfigured()`. Sin credenciales → `{uploaded:false, error:'Configurá las credenciales de Cloudinary en Configuración…'}` (modo degradado, no rompe el flujo).
- **`src/features/lms/lib/certificate-pdf.tsx`** — plantilla A4 landscape con `<Document>/<Page>` de react-pdf, QR embebido vía `qrcode.toDataURL()`. `generateCertificatePdfBuffer(input)` retorna `Promise<Buffer>`.
- **`src/features/lms/lib/certificate-issuer.ts`** — `tryIssueCertificate({userId, courseId, finalGrade?, slug?})` retorna `{ok, verificationCode?, pdfUrl?, error?}`. Idempotente: si ya existe certificado válido con `pdfUrl`, no regenera. **Sin** `'use server'` para permitir reuso desde server actions y hooks fire-and-forget.
- **`actions/certificates.ts`** (Sonnet) extendido: `issueLmsCertificate` ahora usa `tryIssueCertificate`. Retorna `{verificationCode, pdfUrl}`. `verifyCertificate` y `getMyCourseCertificate` ahora incluyen `pdfUrl` en la respuesta.
- **Hook fire-and-forget** en `syncExamGrades` (Fase 2): `if (normalizedScore >= 4.0) void tryIssueCertificate(...).catch(console.error)`. Solo emite si `course.certificateEnabled === true`.

### Configuración via `/config/settings` (SuperAdmin)

- `APP_CONFIG_KEY` extendido con `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.
- `AppSettingsClient` reemplazó el card "IA próximamente" por "Cloudinary — Almacenamiento de certificados" con 3 inputs (Cloud Name, API Key, API Secret tipo password).
- Misma acción `saveAppConfig` ya validaba con Zod; ahora cubre las 3 keys nuevas.

### Resúmenes IA con Gemini

- **`src/features/lms/lib/lesson-summarizer.ts`** — `summarizeLessonText(content)` valida longitud (200–50000 chars), llama `generateText({model: google('gemini-2.5-flash')})` con prompt que fuerza JSON, parsea con `extractJson` (tolerante a markdown fences), valida estructura y persiste `LessonSummary`. Sin API key → error claro "Configurá la API key de Google Generative AI…".
- **`actions/lesson-summary.ts`** — `generateLessonSummary(slug, lessonId)` valida lección TEXTO con `aiSummaryEnabled`, extrae texto de Tiptap JSON recursivamente, llama summarizer, persiste en `LmsLesson.summaryJson`. `getLessonSummary(lessonId)` para estudiante enrolado. `clearLessonSummary` para admin.

### Detección temprana de bajo rendimiento

- **`src/features/lms/lib/at-risk-detector.ts`** (lib pura testeable): `identifyAtRiskStudents(enrollments, grades, options?)` con score 0-100 multi-factor:
    - `progressPct < threshold` → +40 pts
    - `daysSinceLastActivity ≥ inactivityDays` → +30 pts
    - `averageGrade < gradeThreshold` → +40 pts
    - `riskLevel`: BAJO (<25), MEDIO (25-49), ALTO (≥50)
    - Sort por `riskScore` desc
- `identifyInactiveStudents(progress, options?)` — usuarios sin actividad en N días.
- `identifyFailingCourses(courseId, enrollments, grades, atRisk, gradeThreshold?)` — métricas agregadas (total, averageGrade, approvedCount, failedCount, approvalRate, atRiskCount).
- **`actions/analytics.ts`** refactorizado: `getCourseAnalytics` ahora delega el cómputo a `identifyAtRiskStudents`. Mantiene interface `AtRiskStudent` (con `lastname`) que la UI ya consumía. El campo `riskLevel`, `reasons` y `averageGrade` ahora están disponibles para Sonnet (UI actualizada en `LmsAnalyticsClient.tsx:114` con tipo `RiskLevel` y `RISK_BADGE: Record<RiskLevel, …>`).

### Tests (34 nuevos)

- `at-risk-detector.test.ts` (17 tests): factor progress, factor inactividad, factor notas, score cap a 100, exclude RETIRADO/COMPLETADO, sort por score, thresholds custom, mix de Date y string.
- `lesson-summarizer.test.ts` (10 tests): validaciones de longitud, sin API key, JSON válido, JSON en fences, sin keyPoints, cap a 8, errores de IA, garbage response.
- `cloudinary.test.ts` (7 tests): isConfigured true/false, upload ok, upload error, delete ok, delete sin config.
- **Total suite: 183/183 pasando** (`pnpm test:run`).

### Verificación de cierre (vía MCP JetBrains)

- `devBuild` (Next.js build) → ✅ `Compiled successfully in 3.6s` + `Finished TypeScript in 5.3s` + 58 rutas generadas.
- `pnpm test:run` → ✅ 183/183 en 14 files.
- Las nuevas rutas detectadas en build: `/[slug]/aula/[id]/certificados`, `/aula/cursos/[id]/logros`, `/aula/logros`, `/certificado/[code]` — la UI de verificación de certificados ya existe (Sonnet).

### Fixes colaterales (causados por nuevos campos en `LmsLesson`)

- `LmsAnalyticsClient.tsx` — `RISK_BADGE: Record<string,…>` → `Record<RiskLevel,…>` con `type RiskLevel = 'BAJO'|'MEDIO'|'ALTO'`. Acceso directo `RISK_BADGE[student.riskLevel]` sin `??` fallback porque el Record es exhaustivo.
- `app/(aula)/aula/cursos/[id]/page.tsx` — agregados `summaryJson: l.summaryJson` al mapping manual y `summaryJson: true` al `select` de Prisma.
- `app/(admin)/[slug]/aula/[id]/page.tsx` — agregado `summaryJson: true` al `select` de Prisma (la interface `LessonWithMeta extends LmsLesson` lo requiere).

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

### UI — Fase 4 (Sonnet)

**`getUnseenBadges()`** — agregado a `gamification.ts`: cruza `LmsUserBadge` contra `LmsNotification(type=BADGE_ACK)` y devuelve insignias sin ACK para el toast animado.

**Componentes:**

- `BadgeUnlockProvider.tsx` (`'use client'`) — recibe `initialUnseenBadges: AchievementBadge[]` del layout SSR. Muestra cada insignia con Framer Motion (`AnimatePresence` + slide desde abajo). Cada toast dura 5.5s con barra de progreso animada y llama `markBadgesSeen([badge.code])` al cerrar (fire-and-forget).
- `LmsAchievementsClient.tsx` (`'use client'`) — "Mis Logros" con 4 stat cards (puntos totales, racha actual, racha máxima, total insignias), grid de todas las insignias del catálogo (ganadas en dorado, bloqueadas en gris), historial de últimos puntos.
- `LmsLeaderboard.tsx` (`'use client'`) — top 10 por puntos, íconos de podio (Trophy/Medal), toggle de privacidad que llama `toggleLeaderboardOptOut(courseId)`, anonimiza nombre con "Estudiante anónimo" para opt-outs ajenos.

**Páginas:**

- `src/app/(aula)/aula/logros/page.tsx` — SSR llama `getMyAchievements()`, renderiza `LmsAchievementsClient`.
- `src/app/(aula)/aula/cursos/[id]/logros/page.tsx` — SSR valida inscripción + llama `getCourseLeaderboard(courseId)`, renderiza `LmsLeaderboard`.

**Actualizaciones:**

- `src/app/(aula)/layout.tsx` — agrega `getUnseenBadges()` en paralelo a las notificaciones, envuelve con `BadgeUnlockProvider`. Filtra BADGE_ACK del contador de unread del Bell. Agrega link "Mis logros" con ícono Trophy en el nav.
- `LmsCourseTabs.tsx` — pestaña "Ranking" con ícono `Trophy` → `/${slug}/aula/${courseId}/ranking`.

**Pendiente para Fase 5:**

- Página `/[slug]/aula/[id]/ranking` en el panel admin.
- Seeder de badges (`gamification-badges.ts`) que corra `pnpm db:seed` para poblar `LmsBadge` en producción antes de que los badges sean funcionales.

## Aula Virtual (LMS) — Fase 3: Foros y Notificaciones

Modelo de datos para discusión asíncrona por curso y sistema de notificaciones in-app.

### Modelos Prisma nuevos

- `LmsForum` — tablero dentro de un curso (`archived` para "sólo lectura", `order` para orden visual).
- `LmsForumThread` — hilo individual con `pinned`, `locked`, `lastPostAt` (para ordenar por actividad).
- `LmsForumPost` — respuesta con `parentPostId` nullable (respuestas anidadas tipo Reddit/GitHub). El body es Markdown crudo (sanitizado server-side en server actions).
- `LmsNotification` — bell icon de la navbar. `type` libre (NEW_POST, GRADE_POSTED, ANNOUNCEMENT). `read` marca leído/no leído.
- Relaciones inversas: `User.forumThreads`, `User.forumPosts`, `User.lmsNotifications`; `LmsCourse.forums`.

Migraciones: `20260629191306_lms_forums`, `20260629191923_lms_notifications`.

### Sanitización anti-XSS — `src/shared/lib/sanitize.ts`

Implementación sin dependencias (no se instaló `sanitize-html` ni `dompurify` para mantener el bundle). Cobertura battle-tested:

- Whitelist de tags (`p`, `br`, `b`, `strong`, `i`, `em`, `u`, `s`, `ul`, `ol`, `li`, `blockquote`, `code`, `pre`, `h3`, `h4`, `a`).
- Atributos: solo `href` y `title` en `<a>`, con validación de protocolo (`http`, `https`, `mailto`).
- Strip por defecto de cualquier tag, atributo, protocolo desconocido.
- State machine con pila de tags abiertos para auto-cerrar al final.
- `sanitizeForumMarkdown(input)`: cubre `**bold**`, `__bold__`, `*italic*`, `_italic_`, `\`code\``, `[label](url)`, fenced code con lang, blockquote, listas (ordenadas/no ordenadas), headings `###`/`####`.
- Defensa en 3 capas: todo el texto suelto pasa por `escapeHtml`, los tokens inline reconocidos se re-emiten seguros, URLs se validan contra allowlist.

Vector XSS cubierto: `<script>`, `<img onerror>`, `<style>`, `<iframe>`, `<object>`, `javascript:`, `data:`, `&#x3c;script&#x3e;`, tags sin cerrar.

23 tests unitarios en `src/shared/lib/__tests__/sanitize.test.ts` cubren vectores OWASP XSS Filter Evasion. **Regla crítica: nunca persistir HTML crudo del usuario.** La BD guarda Markdown; el render siempre pasa por `sanitizeForumMarkdown()`.

### Notificaciones Brevo — `src/features/lms/lib/forum-notifications.ts`

- `buildNewForumPostEmail({...})` — plantilla HTML consistente con `buildExamResultEmail` / `buildAdminWelcomeEmail`.
- `notifyNewForumPost({ threadId, postId, authorId, siteUrl })` — fan-out best-effort a:
    - Todos los autores previos del hilo (dedupeado por `distinct authorId`).
    - Estudiantes inscriptos activos en el curso.
    - Excluye al autor del nuevo post.
- `notifyNewForumPostBackground(...)` — fire-and-forget (`void Promise`), nunca lanza errores al caller; logs con `console.error`.
- Las notas internas de estudiantes viven en `LmsNotification` (Bell Icon UI lo levanta Sonnet).

### Server Actions del Foro — `src/features/lms/actions/forums.ts`

| Action                                  | Rol            | Descripción                                                     |
| --------------------------------------- | -------------- | --------------------------------------------------------------- |
| `createLmsForum(slug, data)`            | ADMIN/PROFESOR | Crear foro dentro de curso.                                     |
| `updateLmsForum(slug, data)`            | ADMIN/PROFESOR | Editar título / archivar.                                       |
| `createLmsForumThread(slug, data)`      | ADMIN/PROFESOR | Inicia hilo + primer post en transacción.                       |
| `toggleForumThreadPin(slug, threadId)`  | ADMIN/PROFESOR | Pin / unpin.                                                    |
| `toggleForumThreadLock(slug, threadId)` | ADMIN/PROFESOR | Lock / unlock.                                                  |
| `createLmsForumPost(data)`              | Estudiante     | Responder desde `/aula`. Pasa body por `sanitizeForumMarkdown`. |
| `createLmsForumPostAdmin(slug, data)`   | ADMIN/PROFESOR | Responder desde panel admin.                                    |
| `editLmsForumPost(slug, data)`          | ADMIN/PROFESOR | Editar post.                                                    |
| `deleteLmsForumPost(slug, data)`        | ADMIN/PROFESOR | Soft-delete (body → `[contenido eliminado por el moderador]`).  |

Validación de acceso anti-IDOR en cada acción: requiere `academicInstitutionId` del curso coincida con la sesión.

### Tests

- `src/shared/lib/__tests__/sanitize.test.ts` — 23 unit tests XSS.
- `tests/e2e/admin/lms-phase3-forums.spec.ts` — smoke test E2E.

### Pendiente para Fase 5+ (Certificación y Analítica)

- Diff side-by-side en UI de edición de post.

Feature en `src/features/demo/`. Institución `slug = 'aulika-demo'`, `isDemo = true`, plan FREE.

- **Acceso** — `/demo` → `DemoLoginCard` (credenciales visibles: `demo@aulika.cl` / `demo_aulika`) → panel `/aulika-demo` como Administrador.
- **Aislamiento** — `demoSessionId` generado en callback `jwt` de `auth.ts`, viaja en JWT y se guarda en `Exam.demoSessionId`. `demoExamFilter(user)` en `src/features/demo/lib/demo.ts` centraliza el filtro.
- **Limpieza** (tres mecanismos): (1) `signOut` borra exámenes del `demoSessionId`; (2) cada deploy ejecuta `prisma/seeders/demo.ts` que purga todos los exámenes de la institución demo; (3) cron diario `GET /api/cron/demo-reset` (`0 6 * * *` UTC, protegido con `CRON_SECRET`).
- **Producción** — seed corre en el build (`prisma migrate deploy && tsx prisma/seeders/demo.ts && next build`). `demo.ts` **no** está en `.vercelignore`.

## Aula Virtual (LMS) — UI de autoría de lecciones (post-QA)

La creación/edición de lecciones desde el panel admin/profesor ya no usa `window.prompt()`. `src/features/lms/components/LessonFormDialog.tsx` es un modal con selector de los 7 tipos (`LESSON_TYPE_OPTIONS` en `src/features/lms/lib/lesson-types.ts`) y campos específicos por tipo, reutilizado tanto para crear como para editar (click en el título de la lección en `LmsCourseEditorClient.tsx`):

- **TEXTO** — textarea; se persiste como doc Tiptap mínimo (un párrafo, un text node por línea) compatible con `RichTextContent` del viewer.
- **ENLACE** — input URL.
- **EXAMEN** — select con los exámenes reales de la institución (`availableExams`, query nueva en `aula/[id]/page.tsx`).
- **TAREA** — instructions/dueAt/maxScore vía `upsertLmsAssignment` (ya existía, estaba desconectada de la UI).
- **DOCUMENTO** — input file vía `uploadLessonDocument` (Vercel Blob, ya existía).
- **EN_VIVO** — sin campos propios; el viewer del estudiante linkea a `/students/aula/cursos/{id}/clases`.
- **VIDEO** — **no implementado**: la subida directa a Mux requiere protocolo TUS (no un PUT simple), lo que implicaría agregar la dependencia `tus-js-client`. Decisión de producto (no técnica): el diálogo muestra un aviso y el equipo debe vincular el asset manualmente por fuera de la plataforma hasta que se decida agregar la dependencia.

**Otros fixes relacionados (QA 2026-07-01):**
- `gradeLmsSubmission` (`src/features/lms/actions/assignments.ts`) ahora sincroniza automáticamente al `LmsGradebookItem` tipo TAREA vinculado (si existe), igual que `syncExamGrades` para exámenes. No es retroactivo.
- Panel admin del foro: cada hilo en `LmsAdminForumClient.tsx` linkea a `src/app/(admin)/[slug]/aula/[id]/foro/[threadId]/page.tsx`, que reutiliza `LmsForumPostTree` con la prop `adminSlug` para responder como staff vía `createLmsForumPostAdmin`.
- `/students/notificaciones` (`NotificationsListClient.tsx`) — listado completo con paginación local, antes daba 404.

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

**Flujo completo de examen del estudiante:** Los tests en `student/exam-flow.spec.ts` se saltean automáticamente si no hay un examen activo asignado al grupo del estudiante. Para activar estos tests: crear un examen publicado y asignarlo al grupo de Juan Pérez.

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

## ExamsClient — rediseño de vista (v0.4.x)

`src/app/(admin)/[slug]/exams/page.tsx` y `src/features/exams/components/ExamsClient.tsx`:

- **Stats tiles**: 4 tiles clicables (Borrador / Programado / En curso / Corregido) visibles sobre la lista; funcionan como atajos de filtro y muestran los conteos de un vistazo.
- **Filtro por grupo**: nuevo `SearchableSelect` en la barra de filtros cuando `groups.length > 1`.
- **Tabs mejorados**: los pills de tab ahora incluyen un dot de color por estado.
- **Cards context-aware**:
    - Título: muestra solo `exam.title` (se eliminó el prefijo `exam.subject`).
    - Preguntas: "N preg." en lugar de "N q.".
    - Columna participantes: `—` para borradores/programados, `X/Y` para en-curso (entregados/total alumnos del grupo), `N` para corregidos.
    - Columna info: "Sin publicar" (borrador), "Abre en Xd Yh" (programado), fecha relativa (en-curso), "Prom. X.X · YY% apr." en verde (corregido).
- **Data server**: `page.tsx` incluye `results: { score, maxScore }` en la query de exámenes y hace una query adicional para contar alumnos por grupo. Computa `avgGrade`, `passRate` y `totalStudents` en el servidor antes de pasar al cliente.
- **Helpers extraídos**: `formatCountdown`, `getParticipantsText`, `getInfoText` como funciones módulo-nivel para reducir complejidad cognitiva.

## Tour guiado (Driver.js)

Feature en `src/features/tour/`:

- **`lib/tour-steps.ts`** — define `DASHBOARD_TOUR_STEPS: DriveStep[]` con 5 pasos apuntando a atributos `data-tour` en el dashboard.
- **`components/TourButton.tsx`** — client component con lógica de auto-inicio y navegación cross-page.

**Pasos del tour (targets `data-tour`):**

| #   | Atributo         | Descripción                                            |
| --- | ---------------- | ------------------------------------------------------ |
| 1   | `sidebar`        | Sidebar desktop (`<aside>`) en `Sidebar.tsx`           |
| 2   | `stat-tiles`     | Grid de 4 tiles de métricas en `DashboardClient.tsx`   |
| 3   | `new-exam-btn`   | Botón dropdown "Nuevo examen" en `DashboardClient.tsx` |
| 4   | `active-exams`   | Card "Exámenes en curso" en `DashboardClient.tsx`      |
| 5   | `recent-results` | Card "Últimos resultados" en `DashboardClient.tsx`     |

**Lógica de TourButton:**

- Se renderiza en `src/app/(admin)/[slug]/layout.tsx` → aparece en las 11 subpáginas del panel.
- `localStorage` keys: `aulika-tour-seen-v1` (flag de "ya visto") y `aulika-tour-pending` (trigger cross-page).
- Primera visita al dashboard → auto-inicia con 1500ms delay.
- Click en `?` desde otro subpage → pone `aulika-tour-pending` y navega al dashboard; el tour se auto-inicia con 800ms delay.
- Click en `?` estando en el dashboard → inicia el tour inmediatamente.
- `onDestroyStarted` → guarda `aulika-tour-seen-v1` en localStorage.

**Botón en Sidebar:**

- "Tour de bienvenida" (icono `Sparkles`) en la sección SISTEMA, solo para no-SuperAdmin.
- Al hacer click: borra `aulika-tour-seen-v1` y navega al dashboard → el tour se re-inicia.

**CSS:**

- Overrides en `src/app/globals.css` con selector `.driver-popover.aulika-tour-popover` (doble especificidad + `!important` en border-radius y botones).
- `border-radius: 16px`, fondo blanco, botón principal `#1f2eff`, botón secundario outline.
- Config: `popoverClass: 'aulika-tour-popover'` en el objeto `driver({...})`.

## Google Analytics (GA4)

Implementación en `src/shared/components/analytics/`:

**Componentes y exports:**

- `GoogleAnalytics` — inyecta scripts de GA4 en el RootLayout
- `AnalyticsProvider` — envuelve el hook `useAnalytics` con Suspense (necessary para `useSearchParams`)
- `useAnalytics(measurementId?)` — hook que auto-trackea cambios de ruta y expone `track` para eventos
- `trackPageView(url, measurementId?)` — función helper para trackear página manualmente (standalone)
- `trackEvent(eventName, params?)` — función helper para trackear eventos personalizados (standalone)

**Variables de entorno:**

- `NEXT_PUBLIC_GA_MEASUREMENT_ID` — ID de medición de GA4 (formato: `G-XXXXXXXXXX`)
- `NEXT_PUBLIC_GA_DISABLED` — desabilita GA completamente cuando es `'true'` (útil para demo, GDPR, desarrollo)

**Características:**

- ✅ No duplica `page_view` — `send_page_view: false` en el script + tracking manual en `useAnalytics`
- ✅ Guardias de disponibilidad — verifica si `gtag` está cargado y si GA no está deshabilitado antes de trackear
- ✅ Logging en desarrollo — `console.debug` con tag `[Analytics]` para debugging
- ✅ Funciones helper standalone — permiten trackear eventos desde cualquier contexto (Server Actions, etc.)

**Uso en componentes:**

```tsx
'use client';
import { useAnalytics } from '@/shared/components/analytics';

export function MyComponent() {
    const { track } = useAnalytics();

    const handleClick = () => {
        track('button_clicked', { label: 'submit_quiz' });
    };

    return <button onClick={handleClick}>Enviar</button>;
}
```

**Uso fuera de componentes (Server Actions, helpers):**

```ts
import { trackEvent } from '@/shared/components/analytics';

export async function createExam(formData: FormData) {
    // ... lógica
    trackEvent('exam_created', { title: formData.get('title') });
}
```

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

## Aula Virtual (LMS) — Fase 1: Fundamentos

Feature en `src/features/lms/`. Evolución de Aulika hacia LMS completo ("Aula Aulika").

### Modelos Prisma (prefijo `Lms`)

| Modelo              | Descripción                                                              |
| ------------------- | ------------------------------------------------------------------------ |
| `LmsCourse`         | Curso LMS. FK a `AcademicInstitution`, `CourseSection`, `User` (creador) |
| `LmsModule`         | Módulo dentro de un curso. Campo `order` para drag-and-drop              |
| `LmsLesson`         | Lección dentro de un módulo. `type: LessonType`, `order`                 |
| `LmsEnrollment`     | Inscripción de estudiante. `progressPct`, `status: EnrollmentStatus`     |
| `LmsLessonProgress` | Progreso por lección. `completed`, `lastSeenSec` (para videos)           |

**Enums:**

- `LessonType`: `VIDEO | DOCUMENTO | TEXTO | ENLACE | EXAMEN | TAREA | EN_VIVO`
- `EnrollmentStatus`: `ACTIVO | COMPLETADO | RETIRADO`

### Feature domain (`src/features/lms/`)

- **`schemas/lms.schemas.ts`** — Zod schemas: `lmsCourseSchema`, `lmsModuleSchema`, `lmsLessonSchema`, `reorderModulesSchema`, `reorderLessonsSchema`, `markLessonProgressSchema`
- **`actions/courses.ts`** — Server Actions CRUD para cursos, módulos y lecciones. Usa `requireInstitutionAccess` de `@/features/auth/lib/auth-guard`
- **`actions/progress.ts`** — `markLessonProgress`, `enrollInCourse`, `recomputeEnrollmentProgress`
- **`lib/access.ts`** — `requireLmsViewer(institutionId)`, `isLmsEnrolled(userId, courseId)`

**Componentes:**

- `LmsCoursesListClient.tsx` — tabla de cursos con CRUD (Dialog + AlertDialog). Admin panel.
- `LmsCourseEditorClient.tsx` — editor drag-and-drop de módulos/lecciones con `@dnd-kit/core` + `@dnd-kit/sortable`
- `LmsStudentView.tsx` — vista de curso para el estudiante con progreso y enroll
- `LmsLessonViewer.tsx` — viewer de lección para los 7 tipos. Botón "marcar como vista"
- `VideoPlayer.tsx` — player Mux con `@mux/mux-player-react`
- `DocumentViewer.tsx` — PDF en iframe o link de descarga

### Panel docente (`src/app/(admin)/[slug]/aula/`)

- `layout.tsx` — AdminTopBar "Aula Virtual"
- `page.tsx` — lista de cursos → `LmsCoursesListClient`
- `[id]/page.tsx` — editor de curso → `LmsCourseEditorClient`

### Portal estudiante (`src/app/(aula)/`)

Route Group `(aula)`. Usa sesión de estudiante (`getStudentAuthSession`). Header propio con logo + nav.

- `layout.tsx` — auth guard → `/examen/login`. Header con "Mis cursos" y "Ir a exámenes"
- `aula/page.tsx` — catálogo: "En curso" + "Disponibles" en grid de cards
- `aula/cursos/[id]/page.tsx` — detalle del curso → `LmsStudentView`
- `aula/cursos/[id]/leccion/[lessonId]/page.tsx` — viewer de lección → `LmsLessonViewer` + Mux playback

### Sidebar

`MonitorPlay` (Lucide) agregado a `ADMIN_NAV` y `PROFESOR_NAV` → `/aula`.

### Dependencias agregadas

- `@dnd-kit/core` + `@dnd-kit/sortable` — drag-and-drop módulos
- `@mux/mux-player-react` — reproductor de video

### Utilidad Mux

`src/shared/lib/mux.ts` — `muxPlaybackId(assetId)` resuelve el playback ID desde la API de Mux.

### Fases pendientes

- Fase 2: Tareas (entrega de archivos), Quizzes embebidos
- Fase 3: Panel de progreso grupal para profesores
- Fase 4: Notificaciones (nuevas lecciones, recordatorios)
- Fase 5: Contenido generado con IA (Gemini)
- Fase 6: Clases en vivo (EN_VIVO)

## Documentación (REGLA)

Siempre que se actualice el proyecto, **documentar el cambio en este `CLAUDE.md`** en la sección correspondiente, como parte de la misma tarea.

Al finalizar, también hacer append en Obsidian:

```bash
cat >> "/Users/edgardoruotolo/SitesDoc/nextjs_projects/next-quiz/next-quiz.md" << 'EOF'

### $(date +%Y-%m-%d) — TÍTULO DEL CAMBIO
- Descripción del cambio realizado
EOF
```

## Herramientas Obligatorias (gstack + CodeGraph + MCP JetBrains)

**gstack está REQUERIDO**. Verificar al inicio de sesión:

```bash
test -d ~/.claude/skills/gstack && echo "✅ GSTACK OK" || echo "❌ GSTACK MISSING"
```

Si falta, instalar y reiniciar antes de continuar:

```bash
git clone --depth 1 https://github.com/garrytan/gstack.git ~/.claude/skills/gstack
cd ~/.claude/skills/gstack && ./setup --team
```

**CodeGraph** (MCP `codegraph`) — consultar ANTES de editar:

- `codegraph_explore` — herramienta primaria: arquitectura, flujos, "cómo funciona X".
- `codegraph_search` — ubicar símbolo por nombre.
- `codegraph_callers` / `codegraph_callees` — quién llama a X, qué llama X.

**MCP JetBrains** (`jetbrains`) — preferir sobre Read/Edit nativos para aplicar cambios con preview visual:

- `open_file`, `apply_changes`, `show_diff` — diffs se renderizan en el IDE, no en el chat.
- `run_configuration` — tests con runner del IDE.
- Rename/extract con refactor seguro del IDE.

**Regla crítica para reducir tokens:**

- **No imprimir diffs grandes en el chat cuando el MCP puede mostrarlos en el IDE.** Después de `apply_changes`, decir _"cambios aplicados en N archivos, diffs abiertos en WebStorm"_ en lugar de pegar el contenido modificado.
- Si el MCP no responde (puerto 64342 cambió tras restart de WebStorm), caer a Read/Edit nativos sin cortar el flujo.

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

**Documentación en Obsidian** — al inicio de cada sesión de trabajo:

```bash
cat "/Users/edgardoruotolo/SitesDoc/nextjs_projects/next-quiz/next-quiz.md"
```
