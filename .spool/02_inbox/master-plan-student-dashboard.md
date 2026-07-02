# Plan Maestro Consolidado: Dashboard Unificado del Estudiante

> **Estado:** Propuesta de Plan Consolidado (Gemini 3.5)  
> **Destinatarios:** Sonnet (UI, UX & Lógica Next.js 16.2) y MiniMax-M3 (Base de datos, Integraciones & QA)  
> **Fase del Pipeline:** `.spool/02_inbox/master-plan-student-dashboard.md`

---

## 1. Visión y Objetivos

El objetivo de esta especificación es rediseñar y unificar la experiencia del estudiante en **Aulika**, fusionando los Route Groups `(student)` y `(aula)` bajo un layout unificado con un sidebar responsivo. Se adaptará la navegación e indicadores del panel según el plan comercial contratado por la institución (FREE vs. LMS/Aula Virtual), mejorando el rendimiento mediante carga asíncrona granular (`<Suspense>`) y garantizando la robustez con pruebas E2E.

### 1.1 Principios de Negocio y Reglas Técnicas

- **Next.js 16.2:** Todo el desarrollo se rige por las convenciones de Next.js 16.2 (Server Components, Route Groups y Server Actions).
- **Independencia por Plan:** Si `plan === 'FREE'`, el estudiante no tiene acceso al LMS. Si `plan !== 'FREE'` (tiers DOCENTE, COLEGIO, INSTITUCIONAL), se activa el Aula Virtual de forma integrada.
- **Preservación del Examen:** Queda prohibido modificar la lógica interna del motor de exámenes (`ExamCarousel`, `beginExam`, `submitAnswer`, `finishExam` o `gradeAttempt`).
- **Estilos y Componentes:** Uso estricto de TailwindCSS 4.\* (sin mezclar con inline styles). Uso obligatorio de `Link` de `next/link` e `Image` de `next/image` de Next.js.
- **Organización DDD y DRY:** Componentes transversales en `src/shared/`, componentes de dominio en `src/features/students/` y vistas en `src/app/(student)/`.

---

## 2. Nueva Estructura de Archivos

Se fusionarán las vistas moviendo el contenido de `src/app/(aula)/aula/` dentro de `src/app/(student)/aula/`, eliminando el layout independiente del aula virtual.

```
src/app/(student)/
├── layout.tsx                              ← REEMPLAZAR: Layout unificado con StudentSidebar
├── dashboard/
│   ├── page.tsx                            ← NUEVO: Panel de control con widgets en Suspense
│   ├── loading.tsx                         ← NUEVO: Skeletons del panel
│   └── error.tsx                           ← NUEVO: Boundary de errores del panel
├── mis-materias/
│   └── page.tsx                            ← NUEVO: Historial académico de exámenes y LMS
├── calendario/
│   └── page.tsx                            ← NUEVO: Calendario de actividades, entregas y clases
├── configuracion/
│   └── page.tsx                            ← NUEVO: Datos básicos de lectura del estudiante
├── post-login/
│   └── page.tsx                            ← MODIFICAR: Redirección simple a /dashboard
├── examen/[examId]/
│   └── layout.tsx                          ← NUEVO: Suprime el sidebar durante un examen activo
├── examen/[examId]/intro/
│   └── layout.tsx                          ← NUEVO: Suprime el sidebar durante la introducción del examen
├── examen/resultado/[resultId]/
│   └── page.tsx                            ← MODIFICAR: Cambiar links de retorno a /dashboard
└── aula/                                   ← MOVIDO desde (aula)/aula/ (URLs sin cambios)
    ├── page.tsx                            (Mis Cursos)
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

---

## 3. Asignación de Roles y Responsabilidades

### 3.1 Sonnet (UI, UX & Lógica Next.js 16.2)

- **Creación de `StudentSidebar`:** Desarrollar el sidebar responsivo colapsable en mobile mediante `Sheet` de shadcn/ui.
- **Layout Unificado `(student)/layout.tsx`:** Implementar el cascarón visual que contiene al sidebar, el área de contenido principal y los providers (`BadgeUnlockProvider`).
- **Layouts de Exclusión:** Crear los layouts anidados en `examen/[examId]` y `examen/[examId]/intro` para suprimir el renderizado del sidebar en pantalla completa.
- **Estructura de Vistas:** Maquetar las interfaces responsivas de `/dashboard`, `/mis-materias`, `/calendario` y `/configuracion` utilizando TailwindCSS 4.\* y tokens del sistema (`bg-paper`, `text-ink`, etc.).
- **Flujos e Interfaces Simples:** Modificar el redireccionador en `post-login` y los botones de retorno en `resultado/[resultId]/page.tsx`.

### 3.2 MiniMax-M3 (Base de datos, Integraciones, Caching & QA)

- **Refactor de Directorios:** Mover físicamente los archivos del Aula Virtual al route group `(student)/aula/` y borrar la carpeta vacía `(aula)/`.
- **Componentes Asíncronos del Dashboard:** Desarrollar los componentes del servidor en `src/features/students/components/dashboard/` que realizan las consultas a Prisma en paralelo con `Promise.all` y `cache()` de React:
    - `WelcomeHeader` (Identidad y metadatos)
    - `StatTilesGrid` (KPIs de Notas, Progreso, Racha y Puntos)
    - `UpcomingWidget` (Exámenes y tareas próximas)
    - `MyCoursesWidget` (Cards con progreso del LMS)
    - `RecentGradesWidget` (Tabla compacta con las últimas 5 notas)
    - `RecentActivityWidget` (Feed de eventos de gamificación)
- **Lógica del Historial y Calendario:** Implementar los queries en el servidor para `/mis-materias` (calificaciones acumuladas ponderadas del LMS y exámenes) y `/calendario` (agrupamiento de eventos del mes).
- **Manejo de Carga y Errores:** Diseñar los archivos `loading.tsx` (skeletons animados) y `error.tsx` (boundaries de error).
- **Verificación de Seguridad y Proxy:** Asegurar que `src/proxy.ts` proteja correctamente las nuevas rutas de `/dashboard`, `/mis-materias`, `/calendario` y `/configuracion`.
- **Calidad y Testing (QA):** Escribir tests E2E en Playwright (`tests/e2e/student-dashboard.spec.ts`) validando el flujo del estudiante para planes FREE y LMS. Ejecutar validaciones de Biome y TypeScript.

---

## 4. Especificación de Componentes Clave

### 4.1 StudentSidebar

**[Responsable: Sonnet]**

- **Comportamiento:** Fijo a la izquierda en desktop (240px en `lg`, 280px en `xl`). En mobile (`<1024px`) se oculta y se invoca desde un botón hamburguesa mediante un drawer (`Sheet` de shadcn/ui).
- **Navegación Dinámica:** Recibe `navItems` pre-calculados en el server layout según el plan:
    - **Con LMS (`plan !== 'FREE'`):** Dashboard (`/dashboard`), Mis Cursos (`/aula`), Mis Materias (`/mis-materias`), Calendario (`/calendario`), Exámenes (`/examen/seleccion`), Configuración (`/configuracion`).
    - **Solo Exámenes (`plan === 'FREE'`):** Oculta "Mis Cursos" de la lista de navegación.
- **Sección Inferior:** Avatar del estudiante (usando `@/shared/components/ui/avatar`), nombre completo, grupo y botón de cierre de sesión (envía el formulario con `logoutStudent`).

### 4.2 Layout Unificado `(student)/layout.tsx`

**[Responsable: Sonnet (Layout/UI) & MiniMax-M3 (Fetches)]**  
Realiza las consultas base en paralelo en el servidor y renderiza la estructura con el sidebar:

```typescript
// src/app/(student)/layout.tsx
export default async function StudentLayout({ children }: { children: ReactNode }) {
  const session = await getStudentAuthSession();
  if (!session) redirect('/examen/login');

  const [student, notifications, unreadCount, unseenBadges] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.studentId },
      select: {
        name: true,
        lastname: true,
        academicInstitution: { select: { name: true, plan: true } },
        group: { select: { name: true } }
      }
    }),
    prisma.lmsNotification.findMany({
      where: { userId: session.studentId, type: { not: 'BADGE_ACK' } },
      orderBy: { createdAt: 'desc' },
      take: 20
    }),
    prisma.lmsNotification.count({
      where: { userId: session.studentId, read: false, type: { not: 'BADGE_ACK' } }
    }),
    getUnseenBadges() // Del feature de gamificación
  ]);

  if (!student) redirect('/examen/login');

  const hasLms = student.academicInstitution?.plan !== 'FREE';

  return (
    <BadgeUnlockProvider initialUnseenBadges={unseenBadges}>
      <div className="bg-paper flex min-h-screen">
        <StudentSidebar
          studentName={`${student.name} ${student.lastname}`}
          groupName={student.group?.name ?? null}
          institutionName={student.academicInstitution?.name ?? 'Aulika'}
          notificationCount={unreadCount}
          hasLms={hasLms}
        />
        <main className="flex-1 lg:ml-60 xl:ml-70 p-6">
          {children}
        </main>
      </div>
    </BadgeUnlockProvider>
  );
}
```

---

## 5. Especificación de Páginas y Widgets

### 5.1 Dashboard (`/dashboard`)

- **WelcomeHeader [Sonnet & MiniMax-M3]:** Saludo personalizado, nombre de la institución y grupo académico del alumno.
- **StatTilesGrid [MiniMax-M3]:** Renderiza 4 KPI tiles usando el componente canónico `StatTile` de `shared/components/ui/stat-tile.tsx`:
    - _Promedio General (Siempre):_ Promedio de notas transformadas a escala 1.0-7.0 de todos los registros en `Result`.
    - _Progreso LMS (Solo LMS):_ Promedio del % de progreso (`progressPct`) de los cursos activos en `LmsEnrollment`. En plan `FREE` se sustituye por el conteo total de exámenes rendidos.
    - _Racha Activa (Solo LMS):_ Días consecutivos en `LmsStreak.currentStreak` (icono `Flame` de Lucide, no emojis).
    - _Puntos XP (Solo LMS):_ Suma de `amount` en `LmsPointEvent` (icono `Sparkles` de Lucide).
- **UpcomingWidget [MiniMax-M3]:** Combina exámenes programados asignados al grupo del alumno (`scheduledAt` próximo) y tareas del LMS con entregas pendientes (`LmsSubmission` en estado `PENDIENTE`). Calcula el nivel de urgencia (`critical` < 24h, `warning` < 72h, `normal` >= 72h) y renderiza badges de colores. Si no hay pendientes, muestra el empty state "Todo al día por esta semana ✓" en color `success`.
- **MyCoursesWidget [Sonnet & MiniMax-M3] (Solo LMS):** Grid con hasta 3 cards de los cursos en los que el alumno está activo, mostrando su barra de progreso y su nota acumulada.
- **RecentGradesWidget [MiniMax-M3]:** Tabla compacta responsiva (usando divs estructurados) con las últimas 5 calificaciones de exámenes (`Result`) calculadas con `calcGrade()`.
- **RecentActivityWidget [MiniMax-M3] (Solo LMS):** Historial tipo feed vertical con los últimos 8 eventos de puntos obtenidos (`LmsPointEvent`), formateados con tiempo relativo utilizando `date-fns`.

### 5.2 Mis Materias (`/mis-materias`)

**[Sonnet (UI/UX) & MiniMax-M3 (Queries & Notas)]**

- **Sección Exámenes:** Tabla interactiva que lista todos los exámenes rendidos por el estudiante, su fecha, nota final (escala 1.0-7.0 mediante `calcGrade()`), estado (Aprobado/Reprobado) y enlace directo a `/examen/resultado/[resultId]`.
- **Sección LMS (Solo LMS):** Acordeón por cada curso inscrito. Muestra el desglose de ítems calificados (`LmsGradebookItem` + `LmsGrade`) y calcula el promedio final acumulado ponderado utilizando `calculateCourseFinalGrade()`.

### 5.3 Calendario (`/calendario`)

**[Sonnet (UI/UX) & MiniMax-M3 (Queries)]**

- Grid mensual interactivo. El servidor calcula los eventos del mes actual en base a la URL (`?mes=YYYY-MM`).
- Renderiza marcadores de color para identificar el tipo de evento:
    - 🔴 Exámenes activos o cierres de examen.
    - 🟡 Tareas pendientes (`dueAt`).
    - 🔵 Clases sincrónicas programadas (`LmsLiveSession`).
- Muestra un panel lateral con la lista cronológica detallada de actividades para el mes consultado.

### 5.4 Configuración (`/configuracion`)

**[Sonnet]**  
Vista de lectura simple con los datos de cuenta del estudiante: Nombre, RUT enmascarado, Email, Grupo, Institución y un botón de cierre de sesión destacado. Sin campos editables en esta fase.

---

## 6. Pipeline de Calidad y Entregables

**[Responsable: MiniMax-M3]**  
Antes de dar por finalizada la tarea, el agente ejecutor debe:

1. Ejecutar Biome para validar estilos de código: `pnpm lint:fix`.
2. Validar que no existan errores de tipado de TypeScript: `pnpm type-check`.
3. Compilar el proyecto en producción: `pnpm build`.
4. Ejecutar las pruebas E2E correspondientes con Playwright: `pnpm test:e2e`.
5. Mover este plan consolidado desde `.spool/02_inbox/` a `.spool/04_archive/` renombrado como `YYYY-MM-DD_master-plan-student-dashboard.md`.
