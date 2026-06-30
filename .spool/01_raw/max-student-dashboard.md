# PROMPT DE IMPLEMENTACIÓN: Dashboard Unificado del Estudiante — Aulika (v2.0)

> **Versión mejorada.** Reemplaza y amplía `student-dashboard.md`. Mantiene la intención original (dashboard unificado bajo route group `(student)` + merge con `(aula)`), pero agrega: tipos TypeScript completos, contratos explícitos con archivos del codebase, manejo de errores con boundaries, consideraciones de accesibilidad/a11y, suspensión granular con `<Suspense>` para no bloquear toda la página, variantes tipadas del sidebar según plan, contrato de tests E2E, y orden de implementación con puntos de control verificables.

---

## 0. RESUMEN EJECUTIVO (TL;DR)

| # | Entregable | Tipo | Prioridad |
|---|------------|------|-----------|
| 1 | `StudentSidebar` con variante LMS/NO-LMS | Componente nuevo | 🔴 Crítica |
| 2 | `(student)/layout.tsx` con sidebar + provider | Layout nuevo | 🔴 Crítica |
| 3 | Mover `/aula/*` desde `(aula)/aula/` a `(student)/aula/` (URLs sin cambio) | Refactor | 🔴 Crítica |
| 4 | Layout anidado `(student)/examen/[examId]/layout.tsx` que suprime el sidebar durante examen activo | Layout anidado | 🔴 Crítica |
| 5 | `/dashboard` con widgets granulares (`<Suspense>`) | Página nueva | 🟡 Alta |
| 6 | `/mis-materias`, `/calendario`, `/configuracion` | Páginas nuevas | 🟡 Alta |
| 7 | Botón "Volver al inicio" → `/dashboard` en resultado | Cambio mínimo | 🟢 Baja |
| 8 | `post-login` → redirect a `/dashboard` | Cambio mínimo | 🟢 Baja |
| 9 | Verificar `src/proxy.ts` y limpiar `PUBLIC_PREFIXES` de `/post-login` | Verificación | 🟡 Alta |
| 10 | Tests E2E de los nuevos flujos Playwright | Tests | 🟡 Alta |
| 11 | Actualizar `CLAUDE.md` + `AGENTS.md` con la nueva sección | Docs | 🟢 Baja |

---

## 1. CONTEXTO Y OBJETIVO

**Proyecto:** Aulika (`next-quiz`), Next.js 16 (App Router) + React 19 + TypeScript strict + Tailwind 4 + shadcn/ui + Prisma 6 + PostgreSQL. Auth de estudiante propia (jose, cookie `aulika-student-auth`). Auth de admin/prof/superadmin vía NextAuth v5.

**Objetivo:**

1. **Crear un dashboard profesional para el estudiante** con sidebar de navegación, KPI tiles, progreso, calendario y actividad reciente.
2. **Unificar los route groups `(student)` y `(aula)`** bajo un único layout con sidebar — eliminar el header simple actual de `(aula)`.
3. **Adaptar la navegación según el plan de la institución** (FREE vs LMS).
4. **Cambiar el botón "Volver al inicio" en `/examen/resultado/[resultId]`** para que lleve a `/dashboard` en vez de `/examen/seleccion`.
5. **NO tocar la lógica interna del flujo de examen** — ni `ExamCarousel`, ni `beginExam`, ni `submitAnswer`, ni `finishExam`, ni `gradeAttempt`. Solo el botón de regreso en resultado.

**Lo que cambia (resumen para el implementador):**

- Los **URLs públicos no cambian**. `/aula/cursos/[id]` sigue siendo `/aula/cursos/[id]`; solo cambia de qué route group cuelga en disco.
- Se crea una **nueva ruta `/dashboard`** que hoy no existe.
- Hay tres URLs internas nuevas: `/dashboard`, `/mis-materias`, `/calendario`, `/configuracion`.
- `post-login` se simplifica a un redirect puro (era una pantalla de 466 líneas).

---

## 2. ESTADO ACTUAL (lo que hay hoy en el repo)

### 2.1 Route groups existentes

```
src/app/
├── (student)/
│   ├── layout.tsx                        ← passthrough de 4 líneas (src/app/(student)/layout.tsx)
│   ├── post-login/page.tsx               ← dashboard actual (466 líneas, REEMPLAZAR con redirect)
│   ├── examen/login/page.tsx
│   ├── examen/seleccion/page.tsx         ← NO TOCAR (lógica de selección)
│   ├── examen/[examId]/page.tsx          ← ExamCarousel — NO TOCAR
│   ├── examen/[examId]/intro/page.tsx    ← NO TOCAR
│   └── examen/resultado/[resultId]/page.tsx ← solo cambiar los 2 Links a /dashboard
│
└── (aula)/
    ├── layout.tsx                        ← header simple con logo + nav + NotificationBell (70 líneas)
    └── aula/
        ├── page.tsx                       "Mis Cursos"
        ├── logros/page.tsx
        ├── clases/page.tsx
        ├── clases/[sessionId]/page.tsx
        ├── cursos/[id]/page.tsx
        ├── cursos/[id]/clases/page.tsx
        ├── cursos/[id]/leccion/[lessonId]/page.tsx
        ├── cursos/[id]/logros/page.tsx
        ├── cursos/[id]/foro/page.tsx
        └── cursos/[id]/foro/[threadId]/page.tsx
```

### 2.2 Archivos críticos (LEYENDO ANTES DE IMPLEMENTAR — ya analizados)

| Archivo | Hallazgo clave que afecta la implementación |
|---|---|
| `src/proxy.ts:8-22` | `PUBLIC_PREFIXES` incluye `/aula`, `/post-login` y `/examen`. **No requieren cambios** porque el chequeo de estudiante se hace en el layout con `getStudentAuthSession()`. **Pero:** `/post-login` debería seguir funcionando como redirect, no como ruta pública por sí sola. Después de esta tarea, `post-login` puede dejarse en `PUBLIC_PREFIXES` o removerse (es un redirect instantáneo). |
| `src/proxy.ts:47-49` | El proxy bypassa NextAuth para `/aula/*` y deja que el layout valide con la sesión de estudiante. **Crítico:** con la unificación, **todas** las rutas bajo `(student)/` (que incluye `/dashboard`, `/mis-materias`, etc.) necesitan este mismo bypass. Hay dos opciones: (a) agregar prefijos al bypass, o (b) validar siempre con `getStudentAuthSession()` en cada layout. **Recomendado (b)** — es lo que hoy ya hace el layout de `(aula)`. Asegurarse de que **`/(student)/<cualquier ruta>`** tenga un layout que valide sesión. |
| `src/features/dashboard/components/Sidebar.tsx` | Sidebar del admin: 748 líneas, `'use client'`, usa `usePathname`, soporta command palette, secciones colapsables, mobile drawer con `Sheet`. **Patrón canónico a imitar** — pero **no reutilizar tal cual**: la versión estudiante no necesita `institutionList` (jefe de carrera) ni `coordinatedProgramIds`. Crear versión específica. |
| `src/app/(aula)/layout.tsx:16-27` | Hoy se obtienen `notifications`, `unreadCount`, `getUnseenBadges()` en paralelo. Reutilizar exactamente este patrón. |
| `src/features/exam-session/lib/session.ts:82-93` | `getStudentAuthSession()` retorna `{ studentId, groupId }`. **Importante:** el payload **no** trae nombre, plan ni grupo — esos hay que fetchearlos en el layout. |
| `src/features/lms/components/NotificationBell.tsx` | Bell con dropdown, polling al `markAsRead`/`markAllRead`. Acepta `initialNotifications` + `initialUnreadCount`. Reutilizar tal cual — pasando los valores desde el nuevo layout. |
| `src/features/lms/components/BadgeUnlockProvider.tsx` | Provider cliente que muestra toasts de insignias nuevas (usa `framer-motion`). Acepta `initialUnseenBadges: AchievementBadge[]`. Reutilizar tal cual. |
| `src/shared/components/ui/stat-tile.tsx` | Componente canónico de KPI tile: `tone: 'default'\|'primary'\|'ink'\|'lime'`. **OBLIGATORIO** usar este para todos los tiles del dashboard. **No** crear variantes locales. |
| `src/shared/components/ui/avatar.tsx` | `Avatar` con `name` y `color` opcional. **OBLIGATORIO** para el avatar del sidebar del estudiante. |
| `src/shared/lib/grade.ts:1-19` | `calcGrade(score, maxScore, maxGrade, passingGrade, passingPercentage)` retorna 1.0–7.0 con clipping. Reutilizar en Mis Materias y Últimas Calificaciones. |
| `src/features/lms/lib/gradebook.ts:76-97` | `calculateCourseFinalGrade(studentId, items)` retorna `CourseFinalGrade` con `passed: boolean | null`. Reutilizar en Mis Materias para la sección LMS. |
| `src/features/lms/actions/gamification.ts:352` | `getUnseenBadges()` — ya devuelve `AchievementBadge[]` listo para `BadgeUnlockProvider`. Reutilizar tal cual. |
| `src/features/exam-session/actions/mutations.ts:365` | `logoutStudent()` Server Action. Reutilizar. |
| `src/app/(student)/examen/resultado/[resultId]/page.tsx:191,352` | Los dos Links exactos a cambiar de `/examen/seleccion` → `/dashboard`. **Ya se documentaron en este prompt.** |

---

## 3. DECISIONES DE ARQUITECTURA (importantes, leelas antes de codear)

### 3.1 Router groups y merge

Estrategia: **mover archivos, no duplicar**. Los URLs públicos no cambian.

```
ANTES:                              DESPUÉS:
src/app/(aula)/aula/page.tsx        src/app/(student)/aula/page.tsx
src/app/(aula)/aula/cursos/...       src/app/(student)/aula/cursos/...
…                                   …

src/app/(aula)/layout.tsx           ELIMINAR
                                    (su responsabilidad queda en src/app/(student)/layout.tsx)
```

> **Regla crítica de merge:** el merge funciona porque `(aula)/aula/page.tsx` resuelve a la URL `/aula`, y `(student)/aula/page.tsx` también. Las dos route groups pueden coexistir momentáneamente si quisiéramos, pero **el objetivo es fusionar en `(student)`** para tener un único layout de sidebar.

> **⚠️ Verificación previa al merge:** confirmar que `(aula)/aula/` no tenga ningún import relativo que suba más de un nivel (ej: `../../../features/...`). Hoy todos usan imports absolutos `@/`, así que el merge es **mecánico**.

### 3.2 Sesión: validar una sola vez en el layout

El layout `(student)/layout.tsx` será el **único punto** que llama `getStudentAuthSession()`. Si no hay sesión → redirect a `/examen/login`. Como **cada página bajo `(student)` está anidada bajo este layout**, la validación se hereda automáticamente.

**Excepción crítica:** las páginas `/examen/[examId]` y `/examen/[examId]/intro` usan su propio `StudentTopBar` (con `logoutStudent` y breadcrumb). Durante un examen activo **el sidebar del dashboard estorba**. Solución: **layout anidado** en `src/app/(student)/examen/[examId]/layout.tsx` que simplemente renderice `{children}` (sin sidebar). El layout padre provee sesión; este layout hijo la **suprime visualmente** pero no rompe la cadena de validación.

```tsx
// src/app/(student)/examen/[examId]/layout.tsx
export default function ActiveExamLayout({ children }: { children: ReactNode }) {
    return <>{children}</>;
}
```

> **Justificación de minimalismo:** durante un examen activo necesitamos pantalla completa, no full-screen estricto (los estudiantes pueden tener ventanas chicas). El `<StudentTopBar>` ya se encarga del branding + logout + breadcrumb. Si quisiéramos full-screen absoluto, `<>{}` es lo correcto.

### 3.3 Variante del sidebar según plan

**Regla DRY:** NO hacer dos sidebars (`StudentSidebarWithLms`, `StudentSidebarFree`). En su lugar, **un solo `StudentSidebar`** que recibe por prop la lista de items resuelta por el server (preserva Server Component para datos sensibles y minimiza bundle JS del cliente).

```ts
// src/features/students/components/StudentSidebar.tsx
type StudentNavItem = {
    label: string;
    href: string;
    icon: ComponentType<{ size?: number; className?: string }>;
};

interface StudentSidebarProps {
    studentName: string;
    groupName: string | null;
    notificationCount: number;
    hasLms: boolean;          // false → oculta "Mis Cursos"
}
```

Luego en el layout:

```ts
const hasLms = plan !== 'FREE';
const navItems: StudentNavItem[] = hasLms
    ? [
        { label: 'Dashboard',   href: '/dashboard',        icon: LayoutDashboard },
        { label: 'Mis Cursos',  href: '/aula',             icon: GraduationCap },
        { label: 'Mis Materias',href: '/mis-materias',     icon: BookOpen },
        { label: 'Calendario',  href: '/calendario',       icon: CalendarDays },
        { label: 'Exámenes',    href: '/examen/seleccion', icon: ClipboardList },
        { label: 'Configuración',href:'/configuracion',    icon: Settings },
      ]
    : [
        { label: 'Dashboard',   href: '/dashboard',        icon: LayoutDashboard },
        { label: 'Mis Materias',href: '/mis-materias',     icon: BookOpen },
        { label: 'Calendario',  href: '/calendario',       icon: CalendarDays },
        { label: 'Exámenes',    href: '/examen/seleccion', icon: ClipboardList },
        { label: 'Configuración',href:'/configuracion',    icon: Settings },
      ];
```

### 3.4 `<Suspense>` granular en el dashboard

El dashboard hace 9 fetches en paralelo. Si una sola falla o tarda, el resto no debería esperar. **Streaming con Suspense:**

```tsx
export default function DashboardPage() {
    return (
        <PageHeader />
        <Suspense fallback={<StatTilesSkeleton />}>
            <StatTilesGrid />
        </Suspense>
        <div className="grid gap-6 lg:grid-cols-2">
            <Suspense fallback={<UpcomingSkeleton />}>
                <UpcomingWidget />
            </Suspense>
            <Suspense fallback={<CoursesSkeleton />}>
                <MyCoursesWidget />
            </Suspense>
            <Suspense fallback={<GradesSkeleton />}>
                <RecentGradesWidget />
            </Suspense>
            <Suspense fallback={<ActivitySkeleton />}>
                <RecentActivityWidget />
            </Suspense>
        </div>
    );
}
```

> Esto requiere convertir cada widget en su propio **async component** que hace sus propias queries. Beneficio: si `LmsPointEvent` falla, no se rompe el dashboard entero.

### 3.5 Manejo de errores con boundaries

Para cada widget con `<Suspense>`, agregar un **Error Boundary** que muestre un fallback degradado. En Next.js 16 esto se hace con `error.tsx` por segmento, pero a nivel de **sub-componente** se puede usar la sintaxis experimental `<Suspense fallback={<ErrorFallback />}>` con un wrapper manual. Para no exceder el scope de esta tarea, **usar `error.tsx` por página** (`dashboard/error.tsx`, `mis-materias/error.tsx`, etc.) en lugar de boundaries por widget. Si el dashboard entero falla, se muestra una pantalla amigable.

### 3.6 Convenciones de estilo y patrones visuales

- **Tokens:** `bg-paper`, `bg-paper-warm`, `text-ink`, `text-ink-dim`, `text-mute`, `border-border`, `bg-primary-wash`, `text-primary`, `text-success`, `text-destructive`, `bg-danger-wash`. **NO** inventar colores nuevos.
- **Tipografía:** `font-display` para títulos, `font-mono` para microcopy/eyebrows, `font-sans` para body.
- **Bordes redondeados:** `rounded-[10px]` (chips), `rounded-[12px]` (cards chicas), `rounded-[14px]` (cards medianas), `rounded-[18px]`/`rounded-[20px]` (cards grandes).
- **Espaciado:** múltiplos de 4px (clases Tailwind 4).
- **Sombras:** `shadow-sm` por defecto en cards, `shadow-xl` en hover.
- **Gradientes:** solo en hero cards con CSS variables (`'--promo-bg': '…'`).
- **Sin emojis en el código** salvo los que ya existen en `BadgeUnlockProvider` (🏅). El eyebrow "🔥 N días" del prompt original **debe** reemplazarse por el ícono `Flame` de Lucide.

---

## 4. NUEVA ESTRUCTURA DE ARCHIVOS

### 4.1 Archivos nuevos a crear

```
src/features/students/components/StudentSidebar.tsx      ← NUEVO
src/app/(student)/dashboard/page.tsx                      ← NUEVO
src/app/(student)/dashboard/loading.tsx                  ← NUEVO (skeleton del dashboard)
src/app/(student)/dashboard/error.tsx                    ← NUEVO (boundary del dashboard)
src/app/(student)/mis-materias/page.tsx                  ← NUEVO
src/app/(student)/calendario/page.tsx                    ← NUEVO
src/app/(student)/configuracion/page.tsx                 ← NUEVO
src/app/(student)/examen/[examId]/layout.tsx             ← NUEVO (suprime sidebar durante examen)
src/app/(student)/examen/[examId]/intro/layout.tsx       ← NUEVO (suprime sidebar durante intro)
src/features/students/components/dashboard/              ← NUEVO sub-directorio
    ├── StatTilesGrid.tsx           (async)
    ├── UpcomingWidget.tsx         (async)
    ├── MyCoursesWidget.tsx        (async)
    ├── RecentGradesWidget.tsx     (async)
    ├── RecentActivityWidget.tsx   (async)
    └── WelcomeHeader.tsx          (async, lee el nombre)
```

### 4.2 Archivos modificados

```
src/app/(student)/layout.tsx                            ← REEMPLAZAR (sidebar layout)
src/app/(student)/post-login/page.tsx                   ← SIMPLIFICAR (solo redirect)
src/app/(student)/examen/resultado/[resultId]/page.tsx  ← 2 Links cambiados
```

### 4.3 Archivos movidos (contenido intacto)

```
DE:                               A:
src/app/(aula)/aula/page.tsx       src/app/(student)/aula/page.tsx
src/app/(aula)/aula/logros/        src/app/(student)/aula/logros/
src/app/(aula)/aula/clases/        src/app/(student)/aula/clases/
src/app/(aula)/aula/cursos/        src/app/(student)/aula/cursos/
```

### 4.4 Archivos eliminados

```
src/app/(aula)/layout.tsx          ← el layout queda absorbido por (student)
src/app/(aula)/                    ← carpeta completa queda vacía; eliminarla del FS
```

> **Verificación previa a borrar `(aula)/`:** confirmar que `(student)/aula/` ya tiene los mismos archivos y que `/aula/*` sigue respondiendo desde la nueva ubicación.

---

## 5. ESPECIFICACIÓN DEL `StudentSidebar`

### 5.1 Comportamiento responsive

| Breakpoint | Layout | Ancho | Mecanismo |
|---|---|---|---|
| `<lg` (<1024px) | Drawer mobile | `100%` (Sheet side=left) | Hamburger fijo top-left |
| `lg–xl` (1024–1280px) | Sidebar fijo | `240px` | Clamps a `240px` |
| `≥xl` (≥1280px) | Sidebar fijo | `280px` | Más holgado |

### 5.2 Estructura interna del sidebar (de arriba a abajo)

```
┌─────────────────────────────────┐
│  [Logo Aulika]      [Nombre inst]│  ← Header (sin collapsible)
├─────────────────────────────────┤
│  [Bell con badge] [Search ⌘K]   │  ← Search bar mock (v2: sin search real)
├─────────────────────────────────┤
│  ▸ Dashboard                    │
│  ▸ Mis Cursos                   │  ← Items de navegación
│  ▸ Mis Materias                 │     (variant según plan)
│  ▸ Calendario                   │
│  ▸ Exámenes                     │
│  ▸ Configuración                │
│  ...                             │
├─────────────────────────────────┤
│  Avatar + Nombre                 │  ← User block
│  Juan Pérez · 4° Medio A         │     + Rol + Grupo
│  [Cerrar sesión]                 │
└─────────────────────────────────┘
```

### 5.3 API TypeScript del componente

```ts
// src/features/students/components/StudentSidebar.tsx
'use client';

import type { ComponentType, CSSProperties } from 'react';

export interface StudentNavItem {
    label: string;
    href: string;
    icon: ComponentType<{ size?: number; className?: string }>;
    /** Si true, match exacto (no prefijo). Para rutas top-level como /dashboard. */
    exact?: boolean;
}

export interface StudentSidebarProps {
    studentName: string;
    groupName: string | null;
    institutionName: string;
    notificationCount: number;
    navItems: StudentNavItem[];
}

export function StudentSidebar({
    studentName,
    groupName,
    institutionName,
    notificationCount,
    navItems,
}: StudentSidebarProps) {
    const pathname = usePathname();
    // ... implementación
}
```

> **Importante:** El sidebar es **Client Component** (necesita `usePathname` y `useState` para drawer mobile). El layout padre pasa los datos pre-fetcheados como props serializables (todo string/number/array de objetos planos con `icon: ComponentType` válido porque Lucide icons son client-safe).

### 5.4 Variante colapsada (opcional para Fase 2)

Para esta entrega, el sidebar es **siempre ancho completo** (240–280px). El colapso a 64px solo íconos queda fuera de scope. Si se quisiera incluir, el toggle es un client state persistido en `localStorage` con key `aulika-student-sidebar-collapsed`.

### 5.5 Estados de cada ítem

| Estado | Visual |
|---|---|
| Activo (pathname exacto o prefijo) | `bg-primary-wash text-primary font-bold` |
| Hover | `bg-paper-warm text-ink` |
| Inactivo | `text-ink-dim` |
| Focus visible | `focus-visible:ring-2 focus-visible:ring-ring outline-none` |

### 5.6 Cierre de sesión

```tsx
<form action={logoutStudent}>
    <button type="submit" className="…" aria-label="Cerrar sesión de estudiante">
        <LogOut size={16} />
        <span>Cerrar sesión</span>
    </button>
</form>
```

### 5.7 Accesibilidad

- `<aside aria-label="Navegación principal">` envuelve el sidebar desktop.
- El drawer mobile usa el `SheetTitle` con `className="sr-only"` (igual que `Sidebar` admin línea 742).
- Cada `<Link>` tiene `aria-current="page"` cuando está activo.
- El hamburger tiene `aria-label="Abrir menú"` y `aria-expanded` bound a `mobileOpen`.
- Focus trap del Sheet lo provee shadcn/ui.
- Contraste de texto inactivo: `text-ink-dim` sobre `bg-white` ya cumple WCAG AA.

---

## 6. ESPECIFICACIÓN DEL `(student)/layout.tsx`

### 6.1 Estructura de fetches (paralelos con `Promise.all`)

```ts
const session = await getStudentAuthSession();
if (!session) redirect('/examen/login');

const [
    student,
    notifications,
    unreadCount,
    unseenBadges,
] = await Promise.all([
    prisma.user.findUnique({
        where: { id: session.studentId },
        select: {
            name: true,
            lastname: true,
            academicInstitutionId: true,
            academicInstitution: {
                select: { name: true, plan: true, slug: true },
            },
            group: { select: { name: true } },
        },
    }),
    prisma.lmsNotification.findMany({
        where: { userId: session.studentId, type: { not: 'BADGE_ACK' } },
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: { id: true, type: true, message: true, link: true, read: true, createdAt: true },
    }),
    prisma.lmsNotification.count({
        where: { userId: session.studentId, read: false, type: { not: 'BADGE_ACK' } },
    }),
    getUnseenBadges(),
]);

if (!student) redirect('/examen/login');

const hasLms = student.academicInstitution?.plan !== 'FREE';
const studentName = `${student.name} ${student.lastname}`.trim();
const groupName = student.group?.name ?? null;
const institutionName = student.academicInstitution?.name ?? 'Aulika';
```

### 6.2 Render

```tsx
<BadgeUnlockProvider initialUnseenBadges={unseenBadges}>
    <div className="bg-paper flex min-h-screen">
        <StudentSidebar
            studentName={studentName}
            groupName={groupName}
            institutionName={institutionName}
            notificationCount={unreadCount}
            navItems={hasLms ? LMS_NAV_ITEMS : FREE_NAV_ITEMS}
        />
        <main className="flex-1 lg:ml-60 xl:ml-70">
            {children}
        </main>
    </div>
</BadgeUnlockProvider>
```

> **Decisión de layout CSS:** usar `flex` con margen izquierdo en el `<main>` en lugar de `position: fixed` en el sidebar. **Justificación:** la sidebar del admin usa `position: fixed` (Sidebar.tsx línea 731), pero eso obliga a calcular el ancho en cada breakpoint. Como nuestro sidebar es **siempre ancho completo** (no colapsable en esta fase), un flex simple con `ml-60 xl:ml-70` es más limpio. Si en el futuro agregamos colapso, refactorizamos a `fixed`.

### 6.3 Memoización opcional con React `cache`

Para evitar que el layout y cada página hija vuelvan a fetchear `student`, considerar `cache()`:

```ts
// src/features/students/lib/get-student.ts
import { cache } from 'react';

export const getStudent = cache(async (studentId: string) => {
    return prisma.user.findUnique({
        where: { id: studentId },
        select: { /* ... */ },
    });
});
```

**Beneficio:** si el dashboard y `MyCoursesWidget` (dentro del dashboard) piden lo mismo, se cachea per-render. Sin embargo, **en este caso el layout es el único que lo pide**, así que `cache()` no aporta valor inmediato. **Decisión:** implementar `cache()` solo si en el futuro vemos doble-fetch.

---

## 7. ESPECIFICACIÓN DEL DASHBOARD (`/dashboard`)

### 7.1 Streams y `Promise.all` por widget (no global)

Cada widget es un async component independiente. **Ventaja:** si uno falla, los otros rinden. **Costo:** ligeramente más boilerplate.

```tsx
// src/features/students/components/dashboard/WelcomeHeader.tsx
export async function WelcomeHeader() {
    const session = await getStudentAuthSession();
    if (!session) return null; // layout ya redirigió, fallback null es seguro
    const student = await prisma.user.findUnique({
        where: { id: session.studentId },
        select: {
            name: true,
            lastname: true,
            academicInstitution: { select: { name: true } },
            group: { select: { name: true } },
        },
    });
    if (!student) return null;
    const fullName = `${student.name ?? ''} ${student.lastname ?? ''}`.trim();
    const firstName = fullName.split(/\s+/)[0] || 'estudiante';
    return ( /* … */ );
}
```

> **Por qué fetchear de nuevo si el layout ya tiene los datos:** en este momento el layout solo pasa nombre + grupo + institución al sidebar. Para evitar doble-fetch, **extraer la query del layout a `getStudent(studentId)` cacheada** (ver §6.3) **y exportarla**. Cada widget importa la misma función. Esto es lo recomendado.

### 7.2 Layout visual del dashboard

```
┌───────────────────────────────────────────────────────────┐
│ Bienvenido, Juan 👋                       [Aula Virtual]  │ ← WelcomeHeader
│ 4° Medio A · Universidad de Los Lagos                      │   (server)
├─────────────────┬────────────────┬─────────────┬──────────┤
│ Promedio        │ Progreso LMS   │ Racha 🔥    │ Puntos   │ ← StatTilesGrid
│ 5.4 / 7.0       │ 64%            │ 7 días      │ ⭐ 320   │   (async, Suspense)
├─────────────────┴────────────────┴─────────────┴──────────┤
│ ┌─────────────────────────┐ ┌──────────────────────────┐ │
│ │ Próximos Exámenes       │ │ Mis Cursos               │ │ ← 2 col lg
│ │ (examen en 2 días)      │ │ [Card] [Card] [Card]    │ │
│ │ (tarea en 5 días)       │ │                          │ │
│ └─────────────────────────┘ └──────────────────────────┘ │
│ ┌─────────────────────────┐ ┌──────────────────────────┐ │
│ │ Últimas Calificaciones  │ │ Actividad Reciente       │ │
│ │ (lista 5 últimos)       │ │ (feed de puntos XP)      │ │
│ └─────────────────────────┘ └──────────────────────────┘ │
└───────────────────────────────────────────────────────────┘
```

### 7.3 Contrato de cada Stat Tile

**OBLIGATORIO usar `<StatTile>` de `@/shared/components/ui/stat-tile.tsx`.** No crear variantes nuevas.

| Tile | Condición | Fuente | Tone | Icon |
|---|---|---|---|---|
| Promedio general | Siempre | `avg(score/maxScore * 7)` de todos los `Result` del estudiante | `'default'` | `BarChart3` |
| Progreso LMS | Solo si `hasLms` | `Math.round(avg of enrollments.progressPct WHERE status='ACTIVO')` | `'primary'` | `TrendingUp` |
| Racha activa | Solo si `hasLms` | `LmsStreak.currentStreak` días | `'default'` (fire icon a la derecha) | `Flame` |
| Puntos XP | Solo si `hasLms` | `SUM(LmsPointEvent.amount) WHERE userId` | `'lime'` | `Sparkles` |

> **Plan FREE:** solo se renderizan 2 tiles: **Promedio general** + **Exámenes rendidos** (count). El segundo tile reemplaza Progreso LMS por `value = totalResults`, `sub = "exámenes rendidos"`.

### 7.4 Widget "Próximos Exámenes / Tareas"

**Lógica de selección (igual que `(student)/post-login/page.tsx:101-118`):**

```ts
const now = Date.now();
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const exams = await prisma.exam.findMany({
    where: {
        academicInstitutionId: institutionId,
        groups: { some: { id: groupId } },
        questions: { some: {} },
        OR: [{ active: true }, { results: { some: { studentId } } }],
        scheduledAt: { gte: new Date(now), lte: new Date(now + WEEK_MS) },
    },
    select: {
        id: true,
        title: true,
        scheduledAt: true,
        closesAt: true,
        results: { where: { studentId }, select: { id: true }, take: 1 },
    },
});
const pendingExams = exams
    .filter((e) => e.results.length === 0)
    .filter((e) => (e.scheduledAt?.getTime() ?? 0) <= (e.closesAt?.getTime() ?? Infinity))
    .sort((a, b) => (a.scheduledAt?.getTime() ?? 0) - (b.scheduledAt?.getTime() ?? 0))
    .slice(0, 5);

const pendingAssignments = hasLms
    ? await prisma.lmsSubmission.findMany({
        where: {
            studentId,
            status: 'PENDIENTE',
            assignment: { dueAt: { gte: new Date(now) } },
        },
        select: {
            id: true,
            assignment: { select: { title: true, dueAt: true, course: { select: { title: true } } } },
        },
        orderBy: { assignment: { dueAt: 'asc' } },
        take: 3,
    })
    : [];
```

**Render unificado:** un solo listado bajo el header "Próximos vencimientos". Cada item: ícono (📝 examen o ✏️ tarea), título, badge de urgencia, fecha relativa.

**Badges de urgencia** (helper en `src/features/students/lib/urgency.ts`):

```ts
export type UrgencyLevel = 'critical' | 'warning' | 'normal';
export function urgencyOf(dueAt: Date, now: Date = new Date()): UrgencyLevel {
    const hours = (dueAt.getTime() - now.getTime()) / 3_600_000;
    if (hours <= 24) return 'critical';
    if (hours <= 72) return 'warning';
    return 'normal';
}
```

**Visualización:**

| Level | Color | Clases |
|---|---|---|
| critical | rojo | `bg-red-50 text-red-700` |
| warning | amarillo | `bg-amber-50 text-amber-700` |
| normal | verde | `bg-emerald-50 text-emerald-700` |

**Empty state:** "Todo al día por esta semana ✓" en `text-success`, ícono `CheckCircle2`.

### 7.5 Widget "Mis Cursos"

- Grid de hasta **3 cards** de `LmsEnrollment` con `status='ACTIVO'`.
- Cada card: `<LmsCourseCard>` (reutilizar el que ya existe en `LmsCoursesListClient` si es reutilizable, o crear uno minimalista).
- Cada card muestra: título del curso, barra de `progressPct`, promedio del gradebook si existe (con `calculateFinalGrade`).
- Link: `/aula/cursos/[id]`.
- Empty state: "Aún no estás inscripto en cursos →" con link a `/aula`.

### 7.6 Widget "Últimas Calificaciones"

- 5 últimos `Result` del estudiante.
- Una **tabla compacta** (NO usar `Table` shadcn — usar `<div>` con grid utility, más liviano para mobile). Columnas:

  ```tsx
  <div className="grid grid-cols-[1fr_auto_auto] gap-3 items-center px-4 py-3 border-b border-border last:border-0 hover:bg-paper-warm">
      <p className="text-ink text-[13px] truncate">{exam.title}</p>
      <GradeBadge score={grade} passing={passing} />
      <p className="text-mute font-mono text-[11px]">{formatDistanceToNow(completedAt, { addSuffix: true, locale: es })}</p>
  </div>
  ```

- `<GradeBadge>` (componente local en el mismo archivo): pill de color según nota.
- Link al final: "Ver historial completo →" a `/mis-materias`.

### 7.7 Widget "Actividad Reciente" (solo LMS)

- Últimos 8 `LmsPointEvent`.
- Por evento:
  - Ícono según `sourceType` (helper `iconForSourceType(sourceType)`):
    | sourceType | Ícono Lucide |
    |---|---|
    | `LESSON_COMPLETED` | `BookOpen` |
    | `ASSIGNMENT_SUBMITTED` | `Send` |
    | `ASSIGNMENT_GRADED` | `CheckCircle2` |
    | `EXAM_PASSED` | `Trophy` |
    | `FORUM_POST` | `MessageSquare` |
    | `MANUAL` | `Sparkles` |
    | `STREAK_BONUS` | `Flame` |
  - `reason` truncado a 60 chars con tooltip.
  - `+N XP` en `text-success` con `ArrowUp`.
  - `formatDistanceToNow(createdAt, { addSuffix: true, locale: es })`.
- Empty state: "Sin actividad reciente. ¡Empezá con una lección!"

### 7.8 `loading.tsx` y `error.tsx`

```tsx
// src/app/(student)/dashboard/loading.tsx
export default function DashboardLoading() {
    return (
        <div className="mx-auto max-w-6xl px-6 py-8">
            <div className="bg-paper-warm h-12 w-64 animate-pulse rounded-[10px]" />
            <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
                {[0,1,2,3].map((i) => (
                    <div key={i} className="bg-paper-warm h-32 animate-pulse rounded-[14px]" />
                ))}
            </div>
            <div className="mt-6 grid gap-6 lg:grid-cols-2">
                {[0,1].map((i) => (
                    <div key={i} className="bg-paper-warm h-64 animate-pulse rounded-[14px]" />
                ))}
            </div>
        </div>
    );
}
```

```tsx
// src/app/(student)/dashboard/error.tsx
'use client';
export default function DashboardError({ error, reset }: { error: Error; reset: () => void }) {
    return (
        <div className="mx-auto max-w-md px-6 py-16 text-center">
            <p className="text-mute font-mono text-[10px] tracking-[0.12em] uppercase">Error</p>
            <h2 className="font-display text-ink mt-2 text-2xl font-bold">Algo falló al cargar tu dashboard</h2>
            <p className="text-ink-dim mt-2 text-[14px]">{error.message}</p>
            <button onClick={reset} className="bg-primary text-paper mt-6 rounded-full px-5 py-2.5 text-[13px] font-semibold">
                Reintentar
            </button>
        </div>
    );
}
```

---

## 8. ESPECIFICACIÓN DE `/mis-materias`

### 8.1 Estructura de la página

```
┌─────────────────────────────────────────────────────────┐
│ Mis Materias                                            │ ← Page title
│ Historial académico completo                             │
├─────────────────────────────────────────────────────────┤
│ Exámenes rendidos (N)                                   │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Examen | Materia | Fecha | Nota | Estado           │ │
│ │ ...                                                │ │ ← Tabla
│ └─────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────┤
│ Calificaciones LMS                                      │ ← Solo si hasLms
│ ┌─────────────────────────────────────────────────────┐ │
│ │ ▼ Programación I                                   │ │
│ │   - Item título    Peso    Nota                     │ │
│ │   ...                                              │ │ ← Acordeón
│ │   Promedio final: 5.4 ✓ Aprueba                   │ │
│ └─────────────────────────────────────────────────────┘ │
│ ...                                                     │
└─────────────────────────────────────────────────────────┘
```

### 8.2 Sección "Exámenes rendidos"

```tsx
const results = await prisma.result.findMany({
    where: { studentId },
    include: {
        exam: {
            select: {
                title: true,
                maxGrade: true,
                passingGrade: true,
                passingPercentage: true,
                maxScore: true,
                groups: { select: { courseSection: { select: { name: true } } } },
            },
        },
    },
    orderBy: { completedAt: 'desc' },
});
```

- Tabla con `Table` shadcn (canónico para tablas en desktop) + `TablePaginator` si hay más de 10.
- Columna **Materia**: viene de `courseSection.name` (vía `groups.courseSection`). Si no hay, dejar "—".
- Columna **Nota**: `calcGrade(score, maxScore, maxGrade, passingGrade, passingPercentage)` + badge de color.
- Columna **Estado**: "Aprobado" / "Reprobado" (calculado como `nota >= passingGrade`).
- Click en fila → `/examen/resultado/[resultId]`.
- Empty state: "Aún no has rendido ningún examen".

### 8.3 Sección "Calificaciones LMS" (acordeón)

```tsx
const enrollments = await prisma.lmsEnrollment.findMany({
    where: { userId: studentId },
    select: {
        courseId: true,
        progressPct: true,
        course: { select: { id: true, title: true } },
        // traer items con sus notas
    },
});

// Por cada enrollment, fetchear gradebook:
const items = await prisma.lmsGradebookItem.findMany({
    where: { courseId, },
    select: {
        id: true, title: true, weight: true, type: true,
        grades: { where: { studentId }, select: { score: true } },
    },
});

const grade = calculateCourseFinalGrade(studentId, items.map(it => ({
    id: it.id, title: it.title, weight: it.weight,
    score: it.grades[0]?.score ?? null,
})));
```

Componente acordeón **client component simple** (sin librería externa):

```tsx
'use client';
function Accordion({ title, defaultOpen = false, children }) {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div>
            <button onClick={() => setOpen(o => !o)} aria-expanded={open}>
                {title}
            </button>
            {open && children}
        </div>
    );
}
```

Si en el repo ya existe un componente acordeón en `@/shared/components/ui`, **reutilizarlo**. Si no existe, el snippet de arriba es suficiente.

---

## 9. ESPECIFICACIÓN DE `/calendario`

### 9.1 Server Component + isla cliente

El grid de días puede ser Server Component con `Date` derivado de la URL (`?mes=YYYY-MM` opcional), pero **la navegación mes anterior/siguiente** requiere estado cliente. Patrón: usar un `<CalendarClient>` que tome `initialEvents` del server y maneje el mes internamente.

### 9.2 Eventos a mostrar

| Tipo | Ícono | Color |
|---|---|---|
| Examen programado | `ClipboardList` | 🔴 rojo |
| Cierre de examen | `Clock` | 🟠 naranja |
| Tarea LMS pendiente | `BookOpen` | 🟡 amarillo |
| Clase en vivo | `Video` | 🔵 azul |
| Examen rendido (histórico) | `CheckCircle2` | 🟢 verde |

### 9.3 Query de eventos del mes

```ts
const monthStart = new Date(year, month, 1);
const monthEnd = new Date(year, month + 1, 0, 23, 59, 59);

// Promise.all las 4 queries
const [exams, assignments, liveSessions, results] = await Promise.all([
    prisma.exam.findMany({
        where: {
            academicInstitutionId,
            groups: { some: { id: groupId } },
            OR: [
                { scheduledAt: { gte: monthStart, lte: monthEnd } },
                { closesAt: { gte: monthStart, lte: monthEnd } },
            ],
        },
        select: { id: true, title: true, scheduledAt: true, closesAt: true },
    }),
    hasLms ? prisma.lmsAssignment.findMany({
        where: {
            course: { enrollments: { some: { userId: studentId } } },
            dueAt: { gte: monthStart, lte: monthEnd },
        },
        select: { id: true, title: true, dueAt: true },
    }) : Promise.resolve([]),
    hasLms ? prisma.lmsLiveSession.findMany({
        where: {
            course: { enrollments: { some: { userId: studentId, status: 'ACTIVO' } } },
            status: { in: ['SCHEDULED', 'LIVE'] },
            scheduledAt: { gte: monthStart, lte: monthEnd },
        },
        select: { id: true, title: true, scheduledAt: true },
    }) : Promise.resolve([]),
    prisma.result.findMany({
        where: {
            studentId,
            completedAt: { gte: monthStart, lte: monthEnd },
        },
        select: { id: true, completedAt: true, exam: { select: { title: true } } },
    }),
]);
```

### 9.4 Render

- Header con `< >` para cambiar mes, día de hoy destacado con anillo.
- Grid 7×N con días del mes. Días con eventos: punto de color (`bg-{color}-500 size-1.5 rounded-full`) debajo del número.
- Click en día → scroll a la lista lateral de ese día.
- Lista cronológica lateral: agrupada por día, con ícono + título + hora.

### 9.5 Sin drag-and-drop ni integración externa

Específicamente **fuera de scope**: edición de eventos, suscripción a Google Calendar, drag de tareas.

---

## 10. ESPECIFICACIÓN DE `/configuracion`

### 10.1 Server Component minimal

```tsx
export default async function ConfiguracionPage() {
    const session = await getStudentAuthSession();
    if (!session) redirect('/examen/login');
    const student = await prisma.user.findUnique({
        where: { id: session.studentId },
        select: {
            name: true, lastname: true, rut: true, email: true,
            group: { select: { name: true } },
            academicInstitution: { select: { name: true, plan: true } },
        },
    });
    if (!student) redirect('/examen/login');
    // RUT enmascarado: "12.***.***-5"
    const maskedRut = maskRut(student.rut);
    return ( /* … */ );
}
```

### 10.2 Visualización

Card centrada con los datos del estudiante en dos columnas (label + value). RUT enmascarado salvo el dígito verificador. Botón "Cerrar sesión" rojo al pie.

### 10.3 Sin campos editables en esta versión

Cualquier feature de edición está **fuera de scope**. Si en el futuro se quiere editar email/notificaciones, eso es una tarea separada.

---

## 11. CAMBIOS QUIRÚRGICOS

### 11.1 Botón "Volver" en `resultado/[resultId]/page.tsx`

**Único cambio:** reemplazar los dos `href="/examen/seleccion"` por `href="/dashboard"`. **Cambiar también el texto** del Link de "Volver al inicio" a "Volver al dashboard" para coherencia.

```diff
- <Link href="/examen/seleccion">Volver al inicio</Link>
+ <Link href="/dashboard">Volver al dashboard</Link>
```

Aplicar en líneas **191 y 352** del archivo actual (verificado). **No tocar nada más en ese archivo.**

> **Advertencia:** hay un bloque similar (líneas 351-354) que dice:
> ```tsx
> <Button asChild variant="ink" size="lg" className="rounded-full">
>     <Link href="/examen/seleccion">Volver al inicio</Link>
> </Button>
> ```
> **También cambiar este.** El archivo tiene 2 ocurrencias de "Volver al inicio" apuntando a `/examen/seleccion`.

### 11.2 `post-login/page.tsx`

Reemplazar **todo** el contenido del archivo (las 466 líneas) por:

```tsx
import { redirect } from 'next/navigation';

export default function PostLoginPage() {
    redirect('/dashboard');
}
```

> **¿Por qué dejar `post-login/page.tsx` en lugar de eliminarlo?** Si alguien tiene un bookmark antiguo o si `student-auth.ts` apunta a `/post-login`, el redirect sigue funcionando. Después de un sprint se puede eliminar y ajustar el callback.

> **Verificar `src/features/students/actions/student-auth.ts`** — buscar si hay un `redirect('/post-login')`. Si lo hay, actualizarlo a `redirect('/dashboard')`. Si no, dejar el redirect en la página para defensa.

### 11.3 `src/proxy.ts`

**Análisis:** actualmente `/post-login`, `/examen`, `/aula` están en `PUBLIC_PREFIXES`. Esto significa que el proxy **NO verifica sesión** para esas URLs y deja que el layout (o la página) las valide.

**Decisión:** mantener el comportamiento actual. **No tocar `proxy.ts`.** Razones:
1. La ruta `/post-login` se reduce a un redirect instantáneo (`<1ms`); no hay datos sensibles expuestos.
2. `/examen/*` es la ruta pública de login + examen activo; ya está protegida por el layout de la página específica.
3. `/aula/*` y las nuevas rutas viven bajo `(student)/layout.tsx`, que valida con `getStudentAuthSession()`. El proxy las deja pasar (porque `/aula` está en `PUBLIC_PREFIXES`), pero el layout las bloquea en server-side.

> **Si en algún momento se quisiera endurecer:** mover la validación de sesión de estudiante **al proxy** (con `jose` directo, sin NextAuth). Esto es **fuera de scope de esta tarea** y merece un PR separado.

---

## 12. CONSIDERACIONES DE DISEÑO

### 12.1 Tokens visuales (recordatorio)

- `bg-paper`, `bg-paper-warm`, `bg-surface`, `bg-primary-wash`, `bg-lime`, `bg-ink`
- `text-ink`, `text-ink-dim`, `text-mute`, `text-primary`, `text-success`, `text-destructive`, `text-coral`
- `border-border`
- **NO** inventar colores nuevos.

### 12.2 Componentes a reutilizar (obligatorio)

| Componente | Path | Uso |
|---|---|---|
| `StatTile` | `@/shared/components/ui/stat-tile` | KPI tiles del dashboard |
| `Avatar` | `@/shared/components/ui/avatar` | Avatar del sidebar |
| `AvatarBadge` / `AvatarGroup` | mismo path | (opcional) |
| `Sheet`, `SheetContent`, `SheetTitle` | `@/shared/components/ui/sheet` | Drawer mobile del sidebar |
| `LogoLockup`, `LogoMark` | `@/shared/components/branding/logo` | Branding del sidebar |
| `NotificationBell` | `@/features/lms/components/NotificationBell` | Campana del sidebar/header |
| `BadgeUnlockProvider` | `@/features/lms/components/BadgeUnlockProvider` | Toasts de insignias nuevas |
| `Table`, `TableBody`, etc. | `@/shared/components/ui/table` | Tabla de Mis Materias |
| `TablePaginator` | `@/shared/components/ui/table-paginator` | Paginación de tablas largas |
| `Button` | `@/shared/components/ui/button` | Todos los CTAs |
| `calcGrade` | `@/shared/lib/grade` | Cálculo de notas (exámenes) |
| `calculateCourseFinalGrade`, `isPassing` | `@/features/lms/lib/gradebook` | Cálculo de notas (LMS) |
| `logoutStudent` | `@/features/exam-session/actions/mutations` | Server Action de logout |
| `getStudentAuthSession` | `@/features/exam-session/lib/session` | Validación de sesión |
| `getUnseenBadges` | `@/features/lms/actions/gamification` | Toast de badges |

### 12.3 Tipografía

| Nivel | Clase | Uso |
|---|---|---|
| H1 | `font-display text-[34px] leading-tight font-semibold tracking-[-0.025em]` | "Mis Materias", "Calendario" |
| H2 | `font-display text-[24px] leading-tight font-semibold` | "Últimas Calificaciones" |
| Eyebrow | `font-mono text-[10px] tracking-[0.12em] uppercase text-mute` | Etiquetas de sección |
| Body | `text-[14px] leading-relaxed text-ink-dim` | Texto común |
| Caption | `text-[12px] text-mute font-sans` | Metadata (fechas, sub-texto) |

### 12.4 Colores de notas (escala chilena 1.0–7.0)

| Rango | Background | Text | Border (opcional) |
|---|---|---|---|
| `>= 4.0` (aprueba) | `bg-emerald-50` | `text-emerald-700` | `border-emerald-200` |
| `3.0 – 3.9` (limítrofe) | `bg-amber-50` | `text-amber-700` | `border-amber-200` |
| `< 3.0` (reprueba) | `bg-red-50` | `text-red-700` | `border-red-200` |

Implementar como helper en `src/features/students/lib/grade-color.ts`:

```ts
export function gradeColorClass(grade: number): string {
    if (grade >= 4.0) return 'bg-emerald-50 text-emerald-700';
    if (grade >= 3.0) return 'bg-amber-50 text-amber-700';
    return 'bg-red-50 text-red-700';
}
```

### 12.5 Fechas

- Usar `date-fns` con `import { es } from 'date-fns/locale'`.
- `formatDistanceToNow(date, { addSuffix: true, locale: es })` para tiempos relativos ("hace 2 horas").
- `format(date, "d 'de' MMMM", { locale: es })` para fechas absolutas ("15 de junio").
- **No usar** `Intl.DateTimeFormat` directamente (inconsistente entre SSR y cliente).

### 12.6 Sin emojis en el código (regla del proyecto)

- `🔥` → `Flame` de Lucide
- `⭐` → `Sparkles` de Lucide
- `🎉` → `PartyPopper` (ya está disponible)
- `👋` (saludo "Bienvenido") → eliminar, solo decir "Bienvenido, Juan"
- El `🏅` que ya existe en `BadgeUnlockProvider` se conserva (es preexistente, fuera de scope).

---

## 13. CONSIDERACIONES DE PERFORMANCE

### 13.1 Estrategia de fetching

| Acción | Decisión | Justificación |
|---|---|---|
| Fetches en layout | `Promise.all` | Igual que `(aula)/layout.tsx:16-27` actual |
| Fetches en dashboard | Cada widget async + `<Suspense>` | Falla aislada, mejor TTFB |
| Memoización con `cache()` | Opcional, justificada solo si vemos doble-fetch | El layout ya hace lo suyo |
| `useSWR` / `react-query` | **NO** usar en esta tarea | El dashboard es estático hasta refresh |
| Revalidación | `revalidate = 60` en cada widget que muestra datos que pueden cambiar (próximos exámenes, actividad) | Balance freshness/performance |

> **`revalidate = 60`** solo se aplica si los datos son Server Components cacheables. En la práctica, para esta entrega dejamos el default de Next (server components dinámicos) y optimizamos si medimos problema.

### 13.2 Bundle size

- El sidebar es Client Component. Mantener dependencias a: `lucide-react`, `next/link`, `next/navigation`, `@/shared/lib/utils`, `@/shared/components/branding/logo`, `@/shared/components/ui/sheet`, `@/features/exam-session/actions/mutations` (solo para `logoutStudent`).
- No importar iconos individuales con `lucide-react/icons/...` (la optimización de barrel se hace en el build, pero explícito es mejor).
- Cada widget del dashboard es **server component**, no suma JS al bundle.

### 13.3 Imágenes y avatares

- `Avatar` (sin `src`) usa iniciales, **cero requests** de imagen.
- Si se quisiera avatar del usuario real, agregar `src` opcional a `Avatar` (ya soportado) y field `imageUrl` en `User` (no existe hoy, sería migración nueva — **fuera de scope**).

---

## 14. ACCESIBILIDAD (a11y)

| Aspecto | Implementación |
|---|---|
| Landmarks | `<aside>`, `<nav>`, `<main>`, `<section>` semánticos |
| Headings | H1 único por página; H2 por sección; H3 por widget |
| Focus visible | `focus-visible:ring-2 focus-visible:ring-ring outline-none` en todos los interactivos |
| Skip link | `<a href="#main" class="sr-only focus:not-sr-only">Saltar al contenido</a>` al inicio del `<body>` (Next.js metadata) |
| `aria-current="page"` | En el Link activo del sidebar |
| `aria-expanded` | En acordeones y drawer mobile |
| `aria-label` | En botones icónicos (hamburger, bell, logout) |
| Color no es único indicador | Badges de urgencia tienen ícono + texto, no solo color |
| Reduced motion | `framer-motion` respeta `prefers-reduced-motion` por default |
| Contraste | Todos los pares color/bg cumplen WCAG AA (verificado con tokens existentes) |
| Screen reader | `sr-only` para iconos decorativos, `aria-label` para significativos |

---

## 15. SEGURIDAD

### 15.1 Validaciones obligatorias en cada layout/página nueva

```ts
const session = await getStudentAuthSession();
if (!session) redirect('/examen/login');
```

Esto ya está en el layout `(student)`. **Pero cada página nueva (`/dashboard`, `/mis-materias`, etc.) debe asumir que el layout es la única defensa y NO depender exclusivamente de él** (defense in depth). Para páginas server, agregar el mismo check.

### 15.2 Anti-IDOR en queries

Todas las queries a `LmsEnrollment`, `Result`, `LmsSubmission`, etc. **deben filtrar por `studentId = session.studentId`**. Nunca confiar en `params` o `searchParams` para filtrar.

### 15.3 Sanitización

- Mensajes de notificaciones: ya vienen de la DB (no de input del usuario en su mayoría) pero validar que `link` no sea `javascript:`.
- `exam.title`, `course.title`: vienen de la DB del admin/profesor; confiar pero validar longitud máxima (truncar a 100 chars en la UI).

### 15.4 Logout

- El botón "Cerrar sesión" llama a `logoutStudent()` (Server Action existente). No requiere cambios.
- Después del logout, redirigir a `/examen/login`.

---

## 16. TESTING

### 16.1 Tests E2E (Playwright) — nuevos

**Archivo:** `tests/e2e/student/dashboard.spec.ts`

| Test | Pasos | Aserción |
|---|---|---|
| Estudiante FREE ve sidebar sin "Mis Cursos" | Login FREE → /dashboard | Sidebar no contiene "Mis Cursos" |
| Estudiante LMS ve sidebar completo | Login LMS → /dashboard | Sidebar contiene "Mis Cursos" + 6 items |
| Dashboard muestra promedio correcto | Sembrar 3 Results con notas conocidas | Tile "Promedio" muestra `5.4` (±0.1) |
| /mis-materias lista exámenes y LMS | Sembrar datos | Tabla "Exámenes rendidos" tiene 3 filas |
| /calendario muestra eventos del mes | Sembrar exam + tarea + clase en vivo en el mes actual | Día con eventos tiene 3 puntos de colores |
| /configuracion muestra datos personales | Login → /configuracion | Ver nombre, RUT enmascarado, grupo |
| Botón "Volver al dashboard" funciona | Login → examen → resultado | Click redirige a /dashboard |
| Mobile drawer se abre/cierra | Resize a <1024px | Hamburger abre drawer, X lo cierra |
| Active item del sidebar resalta | Login → click /mis-materias | `aria-current="page"` en item activo |
| Logout desde sidebar | Click "Cerrar sesión" | Redirect a /examen/login + cookie limpia |

**Setup previo:** requerir `pnpm db:seed:aula` para tener un estudiante LMS y un estudiante FREE sembrados. Para el FREE puro, considerar crear `tests/e2e/student/free-plan.spec.ts` con datos mínimos (1 institución FREE, 1 grupo, 1 estudiante).

### 16.2 Tests unitarios

| Archivo | Qué testear |
|---|---|
| `src/features/students/lib/urgency.test.ts` | `urgencyOf()` con fechas críticas/warning/normal |
| `src/features/students/lib/grade-color.test.ts` | `gradeColorClass()` con notas 1.0, 3.5, 5.4, 7.0 |
| `src/features/students/lib/mask-rut.test.ts` | Enmascarar RUT dejando solo el DV |

### 16.3 Tests manuales (checklist QA)

- [ ] Login con RUT válido → aterriza en `/dashboard` (no `/post-login`).
- [ ] Click en cada ítem del sidebar → navegación correcta sin parpadeo.
- [ ] En `/examen/[examId]` activo **no se ve** el sidebar (debe estar pantalla limpia con solo el `StudentTopBar`).
- [ ] Página `/calendario` con mes vacío no rompe.
- [ ] Con 0 notas el dashboard muestra estado vacío del widget.
- [ ] Resize a <1024px muestra drawer; en >1024px muestra sidebar fijo.
- [ ] Logout limpia la cookie `aulika-student-auth` (verificar en DevTools → Application).

---

## 17. MIGRACIÓN DE ARCHIVOS — PASO A PASO

> **Orden estricto.** Cada paso tiene un punto de control verificable.

### Paso 1 — Copiar archivos primero, eliminar después

```bash
# Copiar (no mover todavía) — para verificar que las URLs no cambian
cp -r src/app/\(aula\)/aula src/app/\(student\)/aula
```

**Verificación:** `pnpm dev` y `curl http://localhost:3000/aula` debe devolver el mismo HTML que antes. Si hay imports rotos (no debería porque todos son `@/`), corregir antes de continuar.

### Paso 2 — Crear `StudentSidebar`

- Path: `src/features/students/components/StudentSidebar.tsx`.
- `'use client'`.
- API según §5.3.
- Verificar con un test rápido: armar un page.tsx temporal que renderice solo `<StudentSidebar studentName="Test" groupName="4°A" institutionName="Inst" notificationCount={0} navItems={[]} />` y abrir.

### Paso 3 — Crear el nuevo `(student)/layout.tsx`

- Path: `src/app/(student)/layout.tsx`.
- Reemplazar el passthrough de 4 líneas con el layout completo según §6.
- Mientras `(aula)/aula/` aún existe, este layout affecta a `/dashboard`, `/mis-materias`, `/calendario`, `/configuracion`, `/post-login`, y **`/aula/*` también** (porque `(student)/aula/page.tsx` ya existe desde el paso 1). Eso es **el objetivo**.

### Paso 4 — Verificar que `/aula` ahora se sirve desde el layout de `(student)`

```bash
# Debería devolver 200 con el sidebar presente
curl http://localhost:3000/aula | grep -i "sidebar\|cerrar sesión"
```

Si falla, las páginas probablemente tienen un `await getStudentAuthSession()` propio que está chocando con el del layout. **Investigar antes de eliminar `(aula)`.**

### Paso 5 — Eliminar `(aula)`

```bash
rm -rf src/app/\(aula\)
```

**Verificación:** `curl http://localhost:3000/aula/cursos/abc123` sigue devolviendo 200. Si el test E2E falla, falta mover un archivo.

### Paso 6 — Crear layouts anidados para examen activo

```bash
mkdir -p src/app/\(student\)/examen/\[examId\]
mkdir -p src/app/\(student\)/examen/\[examId\]/intro
```

- `src/app/(student)/examen/[examId]/layout.tsx` → `<>{children}</>`
- `src/app/(student)/examen/[examId]/intro/layout.tsx` → `<>{children}</>`

> **Verificación crítica:** abrir manualmente `/examen/<examId>` con sesión activa. No debe verse el sidebar.

### Paso 7 — Crear `/dashboard`

- Path: `src/app/(student)/dashboard/page.tsx` + `loading.tsx` + `error.tsx`.
- Cada widget en `src/features/students/components/dashboard/`.
- Suspense granular según §3.4.

### Paso 8 — Crear `/mis-materias`, `/calendario`, `/configuracion`

- Server Components como en §8, §9, §10.
- Usar `loading.tsx` solo en las que tardan (ej. `/mis-materias` con LMS activo puede tardar).

### Paso 9 — Modificar `resultado/[resultId]/page.tsx`

- Solo líneas 191 y 352 (verificadas).
- Cambio de href + texto.

### Paso 10 — Simplificar `post-login/page.tsx`

- Reemplazar 466 líneas por 5 líneas de redirect.

### Paso 11 — Verificación final

```bash
pnpm type-check
pnpm lint
pnpm build
pnpm test:run
pnpm dev   # luego abrir y validar manualmente
```

---

## 18. DOCUMENTACIÓN A ACTUALIZAR

> **Regla del proyecto (CLAUDE.md / AGENTS.md):** todo cambio requiere actualizar documentación en la misma tarea.

### 18.1 Agregar al final de la sección "## Stack Tecnológico" en `CLAUDE.md` y `AGENTS.md`

```markdown
## Dashboard del Estudiante

- **Ruta** `/dashboard` — Server Component con widgets en `<Suspense>` granular.
- **Sidebar** `src/features/students/components/StudentSidebar.tsx` — variante según plan (LMS vs FREE).
- **Layout unificado** `src/app/(student)/layout.tsx` reemplaza los antiguos `(student)` y `(aula)`. Valida sesión con `getStudentAuthSession()`.
- **Rutas nuevas** `/dashboard`, `/mis-materias`, `/calendario`, `/configuracion`. **Examen activo** suprime el sidebar vía layout anidado `src/app/(student)/examen/[examId]/layout.tsx`.
- **post-login** quedó como redirect puro a `/dashboard`.
```

### 18.2 Actualizar `Spec.md` si existe

Si hay una sección que menciona `post-login` como dashboard del estudiante, actualizar la ruta a `/dashboard`.

### 18.3 En Obsidian (opcional)

```bash
cat >> "/Users/edgardoruotolo/SitesDoc/nextjs_projects/next-quiz/next-quiz.md" << 'EOF'

### $(date +%Y-%m-%d) — Dashboard unificado del estudiante
- Merge de route groups (student) + (aula) bajo sidebar único
- 4 páginas nuevas: /dashboard, /mis-materias, /calendario, /configuracion
- Lazy widgets con <Suspense> granular
- Sidebar variante según plan (LMS vs FREE)
- Resultado del examen ahora redirige a /dashboard
EOF
```

---

## 19. ARCHIVOS DE REFERENCIA — LISTA MAESTRA

> Antes de escribir cualquier código, **leer TODOS estos archivos** en este orden:

1. `src/features/dashboard/components/Sidebar.tsx` — patrón a imitar
2. `src/app/(aula)/layout.tsx` — lógica de fetch de notificaciones/badges a reusar
3. `src/app/(student)/post-login/page.tsx` — algoritmos de upcoming/available (líneas 82-118)
4. `src/features/exam-session/lib/session.ts` — `getStudentAuthSession`
5. `src/features/exam-session/actions/mutations.ts` (línea 365) — `logoutStudent`
6. `src/shared/components/ui/stat-tile.tsx` — `StatTile`
7. `src/shared/components/ui/avatar.tsx` — `Avatar`
8. `src/shared/components/ui/sheet.tsx` — `Sheet`, `SheetContent`
9. `src/shared/components/branding/logo.tsx` — `LogoLockup`, `LogoMark`
10. `src/features/lms/components/NotificationBell.tsx` — `NotificationBell`
11. `src/features/lms/components/BadgeUnlockProvider.tsx` — `BadgeUnlockProvider`
12. `src/features/lms/lib/gradebook.ts` — `calculateCourseFinalGrade`, `isPassing`
13. `src/shared/lib/grade.ts` — `calcGrade`
14. `src/proxy.ts` — confirmar que NO requiere cambios
15. `src/app/(student)/examen/resultado/[resultId]/page.tsx` — solo líneas 191 y 352
16. Al menos una página existente de `src/app/(aula)/aula/cursos/[id]/page.tsx` para entender el patrón al mover

---

## 20. RESTRICCIONES ABSOLUTAS (REPETIDAS POR ÉNFASIS)

- **NO modificar** lógica de examen: `mutations.ts` (excepto `logoutStudent` que ya es read-only), `ExamCarousel`, `intro/page.tsx`, `seleccion/page.tsx`.
- **NO instalar** nuevas dependencias sin consultar.
- **NO usar** `any` — `unknown` + narrowing o tipos propios.
- **NO usar** `style={{ ... }}` con valores dinámicos — solo CSS variables como `CSSProperties`.
- **NO importar** `React` por defecto — el proyecto usa `react-jsx` transform.
- **NO usar emojis** en código (sustituir por íconos Lucide).
- **NO crear** variantes locales de `StatTile`/`Avatar`/etc. — reutilizar siempre los canónicos.
- **NO duplicar** lógica entre `(aula)` y `(student)` — el merge es total.
- Commits solo cuando se pida explícitamente (formato: `Tarea: ... | Fecha: DD-MM-YYYY | Versión: X.Y.Z`).
- Correr `pnpm type-check`, `pnpm lint`, `pnpm test:run`, `pnpm build` (en orden) con `mcp__jetbrains__execute_terminal_command` después de cada paso significativo.

---

## 21. CHECKLIST FINAL DE ENTREGA

- [ ] `pnpm type-check` → 0 errores
- [ ] `pnpm lint` → 0 errores
- [ ] `pnpm test:run` → 100% passing (incluyendo nuevos)
- [ ] `pnpm build` → success, todas las rutas nuevas listadas
- [ ] `pnpm test:e2e` (Playwright) → 10/10 nuevos specs passing
- [ ] Manual QA en navegador (checklist §16.3) → todas las casillas marcadas
- [ ] `CLAUDE.md` y `AGENTS.md` actualizados con la sección §18.1
- [ ] Captura de pantalla de `/dashboard` para anexar al PR
- [ ] PR abierto con descripción siguiendo el template del repo (si existe)

---

**Fin del prompt. Cualquier duda, consultar Edgardo antes de tomar decisiones arquitectónicas. NO improvisar.**
