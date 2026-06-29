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
| Evento | Puntos |
|---|---|
| Tarea entregada (`ASSIGNMENT_SUBMITTED`) | +10 |
| Tarea calificada (`ASSIGNMENT_GRADED`) | +5 |
| Examen aprobado (`EXAM_PASSED`, score ≥ 4.0) | +15 |
| Post en foro (`FORUM_POST`) | +2 |
| Nota manual (`ASSIGNMENT_GRADED` en `recordLmsGrade`) | +5 |

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

| Action | Rol | Descripción |
| --- | --- | --- |
| `createLmsForum(slug, data)` | ADMIN/PROFESOR | Crear foro dentro de curso. |
| `updateLmsForum(slug, data)` | ADMIN/PROFESOR | Editar título / archivar. |
| `createLmsForumThread(slug, data)` | ADMIN/PROFESOR | Inicia hilo + primer post en transacción. |
| `toggleForumThreadPin(slug, threadId)` | ADMIN/PROFESOR | Pin / unpin. |
| `toggleForumThreadLock(slug, threadId)` | ADMIN/PROFESOR | Lock / unlock. |
| `createLmsForumPost(data)` | Estudiante | Responder desde `/aula`. Pasa body por `sanitizeForumMarkdown`. |
| `createLmsForumPostAdmin(slug, data)` | ADMIN/PROFESOR | Responder desde panel admin. |
| `editLmsForumPost(slug, data)` | ADMIN/PROFESOR | Editar post. |
| `deleteLmsForumPost(slug, data)` | ADMIN/PROFESOR | Soft-delete (body → `[contenido eliminado por el moderador]`). |

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

| # | Atributo | Descripción |
|---|----------|-------------|
| 1 | `sidebar` | Sidebar desktop (`<aside>`) en `Sidebar.tsx` |
| 2 | `stat-tiles` | Grid de 4 tiles de métricas en `DashboardClient.tsx` |
| 3 | `new-exam-btn` | Botón dropdown "Nuevo examen" en `DashboardClient.tsx` |
| 4 | `active-exams` | Card "Exámenes en curso" en `DashboardClient.tsx` |
| 5 | `recent-results` | Card "Últimos resultados" en `DashboardClient.tsx` |

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

| Modelo | Descripción |
|--------|-------------|
| `LmsCourse` | Curso LMS. FK a `AcademicInstitution`, `CourseSection`, `User` (creador) |
| `LmsModule` | Módulo dentro de un curso. Campo `order` para drag-and-drop |
| `LmsLesson` | Lección dentro de un módulo. `type: LessonType`, `order` |
| `LmsEnrollment` | Inscripción de estudiante. `progressPct`, `status: EnrollmentStatus` |
| `LmsLessonProgress` | Progreso por lección. `completed`, `lastSeenSec` (para videos) |

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

- **No imprimir diffs grandes en el chat cuando el MCP puede mostrarlos en el IDE.** Después de `apply_changes`, decir *"cambios aplicados en N archivos, diffs abiertos en WebStorm"* en lugar de pegar el contenido modificado.
- Si el MCP no responde (puerto 64342 cambió tras restart de WebStorm), caer a Read/Edit nativos sin cortar el flujo.

**Documentación en Obsidian** — al inicio de cada sesión de trabajo:

```bash
cat "/Users/edgardoruotolo/SitesDoc/nextjs_projects/next-quiz/next-quiz.md"
```
