# PROMPT DE IMPLEMENTACIÓN: Dashboard Unificado del Estudiante — Aulika

---

## CONTEXTO Y OBJETIVO

Estás trabajando en **Aulika** (`next-quiz`), una plataforma de evaluación online para colegios y universidades construida con Next.js 16 App Router, React 19, TypeScript strict, Tailwind CSS 4, shadcn/ui, Prisma 6 y PostgreSQL.

El objetivo de esta tarea es:

1. **Crear un dashboard profesional para el estudiante** con sidebar de navegación, widgets de KPIs, progreso, calendario y actividad reciente.
2. **Unificar los route groups `(student)` y `(aula)`** bajo un único layout con sidebar, eliminando el header simple actual de `(aula)`.
3. **Adaptar la navegación según el plan de la institución**: con LMS o sin LMS.
4. **Cambiar el botón "Volver al inicio" en `/examen/resultado/[resultId]`** para que lleve a `/dashboard` en vez de `/examen/seleccion`.
5. **NO tocar la lógica interna del flujo de examen** — ni `ExamCarousel`, ni `beginExam`, ni `submitAnswer`, ni `finishExam`, ni `gradeAttempt`. Solo el botón de regreso en `resultado`.

---

## ARQUITECTURA ACTUAL (entender antes de modificar)

### Route groups hoy:

```
src/app/
├── (student)/
│   ├── layout.tsx                        ← passthrough de 4 líneas, sin layout visual
│   ├── post-login/page.tsx               ← dashboard actual (466 líneas, reemplazar con redirect)
│   ├── examen/login/page.tsx
│   ├── examen/seleccion/page.tsx
│   ├── examen/[examId]/page.tsx          ← ExamCarousel — NO TOCAR
│   ├── examen/[examId]/intro/page.tsx    — NO TOCAR
│   └── examen/resultado/[resultId]/page.tsx ← solo cambiar el botón "Volver al inicio"
│
└── (aula)/
    ├── layout.tsx                        ← header simple con logo + nav + NotificationBell
    ├── aula/page.tsx                     ← "Mis Cursos"
    ├── aula/logros/page.tsx
    ├── aula/clases/page.tsx
    ├── aula/clases/[sessionId]/page.tsx
    ├── aula/cursos/[id]/page.tsx
    ├── aula/cursos/[id]/clases/page.tsx
    ├── aula/cursos/[id]/leccion/[lessonId]/page.tsx
    ├── aula/cursos/[id]/logros/page.tsx
    ├── aula/cursos/[id]/foro/page.tsx
    └── aula/cursos/[id]/foro/[threadId]/page.tsx
```

### Autenticación del estudiante:

- Los estudiantes **NO usan NextAuth**. Usan cookies JWT propias.
- Cookie `aulika-student-auth`: payload `{ studentId, groupId }`, TTL 2h.
- Se obtiene con `getStudentAuthSession()` de `@/features/exam-session/lib/session`.
- Si no hay sesión → redirect a `/examen/login`.

### Plan de la institución:

- `AcademicInstitution.plan`: enum `Plan` con valores `FREE | DOCENTE | COLEGIO | INSTITUCIONAL`.
- **FREE** = solo motor de exámenes, sin LMS.
- **DOCENTE / COLEGIO / INSTITUCIONAL** = incluye Aula Virtual (LMS).
- El estudiante tiene `academicInstitutionId` via su relación `group → academicInstitutionId` (o directo en `User.academicInstitutionId`).

### Modelos Prisma relevantes para el dashboard:

```prisma
// Exámenes rendidos
Result { studentId, examId, score, maxScore, completedAt }

// LMS
LmsEnrollment { userId, courseId, progressPct, status, completedAt }
LmsLessonProgress { userId, lessonId, completed, completedAt }
LmsSubmission { studentId, assignmentId, status, grade, feedback, deliveredAt }
LmsGrade { studentId, gradebookItemId, score }
LmsGradebookItem { courseId, title, weight, type }

// Gamificación
LmsStreak { userId, currentStreak, longestStreak, lastActiveOn }
LmsPointEvent { userId, amount, reason, sourceType, createdAt }
LmsUserBadge { userId, badgeId, awardedAt }

// Notificaciones
LmsNotification { userId, type, message, link, read, createdAt }

// Exámenes disponibles (vía grupos)
Exam { title, scheduledAt, closesAt, groups[] }
Group { id, name } (el estudiante tiene groupId)

// Sesiones en vivo
LmsLiveSession { courseId, title, scheduledAt, status }
```

---

## NUEVA ARQUITECTURA A IMPLEMENTAR

### Estrategia de merge:

Mover todos los archivos de `(aula)/` dentro de `(student)/`. Los URLs `/aula/*` **permanecen idénticos** — solo cambia la ubicación en disco del route group. Eliminar `(aula)/layout.tsx` y reemplazar con el layout unificado en `(student)/layout.tsx`.

### Nueva estructura de archivos a crear/modificar:

```
src/app/(student)/
├── layout.tsx                          ← REEMPLAZAR: nuevo layout con StudentSidebar
├── dashboard/page.tsx                  ← CREAR: dashboard principal
├── mis-materias/page.tsx               ← CREAR: historial de exámenes + notas
├── calendario/page.tsx                 ← CREAR: vista de calendario
├── configuracion/page.tsx              ← CREAR: configuración del estudiante
├── post-login/page.tsx                 ← MODIFICAR: solo redirect → /dashboard
│
├── examen/login/
├── examen/seleccion/                   ← SIN CAMBIOS
├── examen/[examId]/                    ← SIN CAMBIOS internamente
├── examen/[examId]/intro/              ← SIN CAMBIOS
├── examen/resultado/[resultId]/        ← SOLO cambiar botón "Volver al inicio"
│
└── aula/                               ← MOVER desde (aula)/aula/ — URLs sin cambio
    ├── page.tsx                        (Mis Cursos)
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

### Componente a crear:

```
src/features/students/components/StudentSidebar.tsx
```

---

## ESPECIFICACIÓN DEL SIDEBAR (`StudentSidebar`)

### Comportamiento:

- Desktop (≥1024px): sidebar fijo a la izquierda, 240px de ancho, colapsable a 64px (solo íconos).
- Mobile (<1024px): sidebar oculto, hamburger en el header lo despliega como drawer.
- Mostrar nombre del estudiante y grupo en la parte superior.
- Indicador visual en el ítem activo (basado en `usePathname()`).
- `NotificationBell` integrado en el header del sidebar o en el top del área principal.
- `BadgeUnlockProvider` envolviendo todo (ya existe).

### Ítems de navegación — Con LMS (`plan !== 'FREE'`):

| Ícono (Lucide)    | Label         | URL                 |
| ----------------- | ------------- | ------------------- |
| `LayoutDashboard` | Dashboard     | `/dashboard`        |
| `GraduationCap`   | Mis Cursos    | `/aula`             |
| `BookOpen`        | Mis Materias  | `/mis-materias`     |
| `CalendarDays`    | Calendario    | `/calendario`       |
| `ClipboardList`   | Exámenes      | `/examen/seleccion` |
| `Settings`        | Configuración | `/configuracion`    |

### Ítems de navegación — Solo exámenes (`plan === 'FREE'`):

| Ícono (Lucide)    | Label         | URL                 |
| ----------------- | ------------- | ------------------- |
| `LayoutDashboard` | Dashboard     | `/dashboard`        |
| `BookOpen`        | Mis Materias  | `/mis-materias`     |
| `CalendarDays`    | Calendario    | `/calendario`       |
| `ClipboardList`   | Exámenes      | `/examen/seleccion` |
| `Settings`        | Configuración | `/configuracion`    |

### Sección inferior del sidebar:

- Nombre completo del estudiante + grupo asignado.
- Botón "Cerrar sesión" (llama a `logoutStudent` action existente).

---

## ESPECIFICACIÓN DEL LAYOUT (`(student)/layout.tsx`)

Este layout reemplaza ambos layouts actuales (`(student)/layout.tsx` passthrough + `(aula)/layout.tsx` header).

```typescript
// Server Component
export default async function StudentLayout({ children }) {
  const session = await getStudentAuthSession()
  if (!session) redirect('/examen/login')

  // Fetch data del estudiante: name, lastname, group.name, institution.plan
  // Fetch notifications para NotificationBell
  // Fetch unseenBadges para BadgeUnlockProvider
  // Pasar plan (FREE|DOCENTE|etc.) al StudentSidebar para mostrar ítems correctos

  return (
    <BadgeUnlockProvider initialUnseenBadges={unseenBadges}>
      <div className="flex min-h-screen">
        <StudentSidebar
          studentName={fullName}
          groupName={groupName}
          plan={plan}
          notifications={notifications}
          unreadCount={unreadCount}
        />
        <main className="flex-1 ...">
          {children}
        </main>
      </div>
    </BadgeUnlockProvider>
  )
}
```

**Importante**: Las páginas `/examen/[examId]` y `/examen/[examId]/intro` tienen su propio `StudentTopBar` que ya funciona. Para que el sidebar no interfiera con esas páginas durante un examen activo, crear un layout anidado dentro de `examen/[examId]/layout.tsx` que suprima el sidebar (renderizando solo `children` con `overflow-hidden` para el modo examen).

---

## ESPECIFICACIÓN DEL DASHBOARD (`/dashboard`)

Server Component que agrega los datos del estudiante desde múltiples fuentes.

### Datos a fetchear en paralelo con `Promise.all`:

```typescript
const [
  student,                // name, lastname, group.name, institution.name, institution.plan
  recentResults,          // últimos 5 Result con exam.title, score, maxScore, completedAt
  upcomingExams,          // Exams disponibles próximos (scheduledAt <= now < closesAt OR scheduledAt > now), via grupos
  enrollments,            // LmsEnrollment status ACTIVO con course.title, progressPct (si plan != FREE)
  pendingTasks,           // LmsSubmission PENDIENTE con assignment.dueAt (si plan != FREE)
  streak,                 // LmsStreak.currentStreak, longestStreak (si plan != FREE)
  totalPoints,            // SUM de LmsPointEvent.amount WHERE userId (si plan != FREE)
  recentBadges,           // Últimas 3 LmsUserBadge con badge.name, badge.icon (si plan != FREE)
  upcomingLiveSessions,   // LmsLiveSession SCHEDULED próximas 7 días (si plan != FREE)
] = await Promise.all([...])
```

### Layout visual del dashboard (grid):

```
┌─────────────────────────────────────────────────────────┐
│  Bienvenido, {nombre} 👋              [institución]      │
│  {grupo}                                                 │
├──────────────┬──────────────┬──────────────┬───────────┤
│  Promedio    │  Progreso    │  Racha       │  Puntos   │
│  general     │  LMS         │  🔥 N días   │  ⭐ NNN  │
│  X.X / 7.0  │  XX%         │              │  XP       │
│  (siempre)   │  (solo LMS)  │  (solo LMS)  │ (solo LMS)│
├──────────────────────────────┬────────────────────────┤
│  PRÓXIMOS EXÁMENES / TAREAS  │  MIS CURSOS (si LMS)   │
│  Lista cronológica de:       │  Cards de los cursos   │
│  - Exámenes programados      │  activos con barra de  │
│  - Tareas pendientes LMS     │  progreso y nota       │
│  (vacío: "Todo al día ✓")   │  promedio              │
├──────────────────────────────┼────────────────────────┤
│  ÚLTIMAS CALIFICACIONES      │  ACTIVIDAD RECIENTE    │
│  5 últimos Result del est.   │  Feed de LmsPointEvent │
│  exam.title | nota | fecha   │  lección completada,   │
│  link → /mis-materias        │  badge, nota publicada │
└──────────────────────────────┴────────────────────────┘
```

### Stat Tiles:

| Tile             | Condición           | Fuente                                           |
| ---------------- | ------------------- | ------------------------------------------------ |
| Promedio general | Siempre             | `avg(score/maxScore * 7)` de todos los `Result`  |
| Progreso LMS     | Solo `plan != FREE` | Promedio de `progressPct` de enrollments ACTIVOS |
| Racha activa     | Solo `plan != FREE` | `LmsStreak.currentStreak` días                   |
| Puntos XP        | Solo `plan != FREE` | `SUM(LmsPointEvent.amount)`                      |

Para plan FREE: mostrar 2 tiles (Promedio + Exámenes rendidos).

### Widget "Próximos Exámenes / Tareas":

- **Exámenes**: `Exam` donde `scheduledAt <= now < closesAt` OR `scheduledAt > now` (hasta 7 días), filtrado por grupo del estudiante, ordenados por `scheduledAt ASC`, máximo 5 ítems.
- **Tareas LMS** (solo `plan != FREE`): `LmsSubmission` con `status = PENDIENTE` y `assignment.dueAt > now`, máximo 3 ítems.
- Badge de urgencia: rojo si < 24h, amarillo si < 3 días, verde si ≥ 3 días.
- Estado vacío: "Todo al día ✓" en verde.

### Widget "Mis Cursos" (solo `plan != FREE`):

- Grid de hasta 3 cards de `LmsEnrollment` con `status = ACTIVO`.
- Cada card: título, barra de `progressPct`, nota promedio del gradebook si existe.
- Link a `/aula/cursos/[id]`.
- Estado vacío: "Explorá los cursos disponibles →" con link a `/aula`.

### Widget "Últimas Calificaciones":

- 5 últimos `Result` del estudiante.
- Columnas: `exam.title | nota calculada con calcGrade() | fecha relativa`.
- Color verde si ≥ `passingGrade`, rojo si no.
- Link "Ver historial completo →" a `/mis-materias`.

### Widget "Actividad Reciente" (solo `plan != FREE`):

- Últimos 8 `LmsPointEvent`.
- Por evento: ícono según `sourceType`, `reason`, `+N XP`, tiempo relativo con `date-fns`.

---

## ESPECIFICACIÓN DE "MIS MATERIAS" (`/mis-materias`)

Server Component. Historial académico completo.

### Sección 1 — Exámenes rendidos:

- Tabla: Examen | Materia | Fecha | Nota | Estado (Aprobado/Reprobado).
- Nota calculada con `calcGrade()` de `@/shared/lib/grade`.
- Verde si aprobó, rojo si no.
- Link en cada fila a `/examen/resultado/[resultId]`.
- Estado vacío: "Aún no has rendido ningún examen".

### Sección 2 — Calificaciones LMS (solo `plan != FREE`):

- Por cada curso inscripto: acordeón expandible con `LmsGradebookItem` + `LmsGrade`.
- Promedio ponderado con `calculateCourseFinalGrade()` de `@/features/lms/lib/gradebook`.
- Badge "Aprueba" / "Reprueba" con `isPassing(average)` del mismo módulo.

---

## ESPECIFICACIÓN DE "CALENDARIO" (`/calendario`)

- Grid del mes actual con puntos de color en días con eventos.
- 🔴 Examen o cierre de examen.
- 🟡 Tarea pendiente (`dueAt`).
- 🔵 Clase en vivo programada.
- Lista cronológica lateral de todos los eventos del mes.
- Navegación mes anterior/siguiente con estado cliente mínimo.
- Sin drag-and-drop ni integración externa en esta fase.

---

## ESPECIFICACIÓN DE "CONFIGURACIÓN" (`/configuracion`)

- Mostrar datos del estudiante: nombre, RUT enmascarado, email, grupo, institución.
- Botón "Cerrar sesión" → `logoutStudent`.
- Sin campos editables en esta primera fase.

---

## CAMBIO EN RESULTADO DE EXAMEN

Archivo: `src/app/(student)/examen/resultado/[resultId]/page.tsx`

**Solo cambiar estos dos links (líneas 191 y 352 aprox.):**

```tsx
// ANTES:
<Link href="/examen/seleccion">Volver al inicio</Link>

// DESPUÉS:
<Link href="/dashboard">Volver al dashboard</Link>
```

**No tocar nada más en ese archivo.**

---

## CAMBIO EN POST-LOGIN

Archivo: `src/app/(student)/post-login/page.tsx`

Reemplazar todo el contenido con:

```typescript
import { redirect } from 'next/navigation';
export default function PostLoginPage() {
    redirect('/dashboard');
}
```

---

## CONSIDERACIONES DE DISEÑO

### Tokens visuales:

- Seguir el sistema existente: `bg-paper`, `text-ink`, `text-ink-dim`, `text-mute`, `border-border`.
- El `StudentSidebar` sigue el mismo patrón visual que `src/features/dashboard/components/Sidebar.tsx` — leerlo antes de crear el componente.

### Componentes a reutilizar:

- `StatTile` de `@/shared/components/ui/stat-tile`.
- `NotificationBell` de `@/features/lms/components/NotificationBell`.
- `BadgeUnlockProvider` de `@/features/lms/components/BadgeUnlockProvider`.
- `LogoLockup` de `@/shared/components/branding/logo`.

### Colores de notas (escala chilena 1.0–7.0):

- `>= 4.0` → `text-emerald-700 bg-emerald-50`
- `3.0 – 3.9` → `text-amber-700 bg-amber-50`
- `< 3.0` → `text-red-700 bg-red-50`

### Fechas:

- Usar `date-fns` (ya instalado): `formatDistanceToNow`, `format`.

---

## ORDEN DE IMPLEMENTACIÓN

1. `StudentSidebar` component — base de todo lo demás.
2. `(student)/layout.tsx` — reemplazar passthrough con layout de sidebar.
3. Mover archivos de `(aula)/aula/` → `(student)/aula/` sin tocar el contenido.
4. Eliminar `(aula)/layout.tsx`.
5. Crear layout anidado `(student)/examen/[examId]/layout.tsx` que suprima el sidebar.
6. `/dashboard/page.tsx` — dashboard con todos los widgets.
7. `/mis-materias/page.tsx` — historial académico.
8. `/calendario/page.tsx` — vista de calendario.
9. `/configuracion/page.tsx` — configuración básica.
10. Modificar `resultado/[resultId]/page.tsx` — solo los dos links.
11. Modificar `post-login/page.tsx` — solo el redirect.
12. Verificar `src/proxy.ts` — que `/dashboard`, `/mis-materias`, `/calendario`, `/configuracion` no estén en rutas públicas.

---

## ARCHIVOS DE REFERENCIA OBLIGATORIOS

Leer **antes** de escribir cualquier código:

| Archivo                                         | Por qué leerlo                         |
| ----------------------------------------------- | -------------------------------------- |
| `src/features/dashboard/components/Sidebar.tsx` | Patrón de sidebar del admin a replicar |
| `src/app/(aula)/layout.tsx`                     | Layout a reemplazar                    |
| `src/app/(student)/post-login/page.tsx`         | Queries existentes a reutilizar        |
| `src/features/exam-session/lib/session.ts`      | API de sesión de estudiante            |
| `src/shared/components/ui/stat-tile.tsx`        | Componente a reutilizar                |
| `src/features/lms/lib/gradebook.ts`             | Cálculo de promedios ponderados        |
| `src/shared/lib/grade.ts`                       | `calcGrade()` para exámenes            |
| `src/proxy.ts`                                  | Verificar routing de nuevas rutas      |

---

## RESTRICCIONES ABSOLUTAS

- **NO modificar** lógica de examen: `mutations.ts`, `ExamCarousel`, `intro/page.tsx`, `seleccion/page.tsx`.
- **NO instalar** nuevas dependencias sin consultar.
- **NO usar** `any` — `unknown` + narrowing o tipos propios.
- **NO usar** `style={{ ... }}` con valores dinámicos — solo CSS variables como `CSSProperties`.
- **NO importar** `React` por defecto — el proyecto usa `react-jsx` transform.
- Correr `pnpm type-check` y `pnpm lint` con `mcp__jetbrains__execute_terminal_command` después de cada paso.
- Commits solo cuando se pida explícitamente, formato: `Tarea: ... | Fecha: DD-MM-YYYY | Versión: X.Y.Z`.
