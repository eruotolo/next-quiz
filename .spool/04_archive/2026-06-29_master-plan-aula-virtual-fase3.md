# Plan Maestro Consolidado: Evolución de Aulika a Aula Virtual (LMS)

> **Estado:** Propuesta de Plan Consolidado (Gemini 3.5)  
> **Destinatarios:** Sonnet (UI, UX & Lógica Next.js 16.2) y MiniMax-M3 (Base de datos, Integraciones & QA)  
> **Fase del Pipeline:** `.spool/02_inbox/master-plan-aula-virtual.md`

---

## 1. Visión y Estrategia de Negocio: Independencia de Productos

Aulika y Aula Aulika se conciben como **dos productos independientes pero integrables**, respondiendo a necesidades comerciales y operativas distintas:

1. **Aulika (Sistema de Exámenes / Evaluaciones):** Foco exclusivo en la creación, aplicación, control (anti-trampas) y calificación determinista de exámenes con escala 1.0–7.0.
2. **Aula Aulika (LMS / Aula Virtual):** Foco en el ciclo completo de aprendizaje asincrónico y sincrónico: entrega de contenido (módulos, lecciones, video streaming), comunicación (foros, anuncios), tareas con entrega de archivos y libro de calificaciones ponderado.

### 1.1 Modelo de Monetización e Independencia Comercial

Las instituciones o docentes individuales pueden adquirir estos productos bajo tres modalidades:

- **Solo Exámenes (Aulika):** Acceso únicamente a la gestión de pruebas, banco de preguntas y resultados. Las rutas del LMS estarán bloqueadas.
- **Solo Aula Virtual (Aula Aulika):** Acceso a cursos, lecciones, tareas y foros. El motor de exámenes completo de Aulika no está disponible como producto independiente, pero el Aula Virtual cuenta con un módulo de cuestionarios/tareas formativas básicas.
- **Ambos (Pack Integrado):** Permite embeber exámenes avanzados de Aulika directamente como lecciones del Aula Virtual.

---

## 2. Principios de Código y Buenas Prácticas (Obligatorio)

Tanto Sonnet como MiniMax-M3 deben seguir estrictamente las siguientes reglas del proyecto durante el desarrollo:

- **Next.js 16.2 como Framework Principal:** Seguir las mejores prácticas de la documentación oficial de Next.js 16.2 (Server Components por defecto, Route Groups, Server Actions y estrategias de caché y revalidación).
- **Organización del Proyecto (DDD y DRY):**
    - Toda la lógica de la UI del Aula Virtual se agrupará en el Route Group **`src/app/(aula)/`** (no afectará la estructura de URL externa gracias a los grupos de ruta).
    - Lógica de negocio organizada por dominio en `src/features/{dominio}/` (mutaciones/actions, componentes específicos del dominio, tipos y esquemas).
    - Utilidades, componentes UI básicos y elementos transversales en `src/shared/`.
    - Regla DRY estricta: antes de crear cualquier helper, botón o hook, verificar la existencia de un homólogo en `src/shared/components/ui/`, `src/shared/lib/` o en los features de dominio existentes.
- **Estilos con TailwindCSS 4.\*:**
    - Uso exclusivo de clases utility de TailwindCSS 4.
    - **Prohibido** mezclar `className` con estilos inline (`style={{ color, width, ... }}`) en un mismo elemento.
    - Excepción: variables CSS puras para propiedades dinámicas, ej. `style={{ '--dynamic-w': `${percent}%` } as CSSProperties}`.
- **Componentes de Navegación y Multimedia:**
    - Usar obligatoriamente **`Link` de `next/link`** para todas las navegaciones internas de la app.
    - Usar obligatoriamente **`Image` de `next/image`** para todos los assets gráficos y de imagen con sus correspondientes optimizaciones de tamaño y lazy loading.

---

## 3. Roles y Distribución de Responsabilidades de Ejecución

### 3.1 Sonnet (Especialista Frontend, UI/UX y Lógica de Negocio en Next.js 16.2)

- **UI/UX:** Construcción de todas las interfaces interactivas en el Route Group `src/app/(aula)/`, componentes de UI reutilizables (`src/shared/components/ui/`) y vistas de administración.
- **Estilos:** Implementación responsiva móvil y desktop con TailwindCSS 4.\*.
- **Flujos de Usuario:** Lógica de componentes cliente ("use client"), hooks personalizados, validación de formularios con Zod y React Hook Form en el cliente.
- **Enrutamiento:** Configuración del middleware/proxy (`src/proxy.ts`) para control de accesos basados en planes.

### 3.2 MiniMax-M3 (Especialista en Capa de Datos, Integraciones Externas, IA y QA/Testing)

- **Base de Datos:** Modificación y mantenimiento del archivo `schema.prisma`, creación de migraciones locales mediante Prisma y verificación de consistencia transaccional.
- **Integraciones Externas:** Configuración del SDK de Mux para transcoding de video, Vercel Blob/S3 para almacenamiento de archivos, y APIs de videoconferencia (Daily.co) o pizarras (tldraw).
- **Capa de IA (Gemini):** Integración de `@ai-sdk/google` para funciones de resúmenes automáticos, generación de contenidos y el motor heurístico/predictivo de deserción.
- **Calidad y Testing (QA):** Escritura de pruebas End-to-End con Playwright (`tests/e2e/`), ejecución de scripts de auditoría (`pnpm lint`, `pnpm type-check`) y backfills/seeding de base de datos.

---

## 4. Extensiones del Esquema de Base de Datos (Prisma)

**[Responsable: MiniMax-M3]**  
Se extenderá la base de datos de PostgreSQL sin modificar la estructura funcional de las tablas existentes, garantizando retrocompatibilidad.

```prisma
// ─── 1. EXTENSIÓN DE ACADEMIC INSTITUTION (Habilitación de Planes) ───────────

model AcademicInstitution {
  // ... campos existentes ...

  // Habilitación comercial independiente
  examsPlan             Plan                @default(FREE)
  examsPlanExpiresAt    DateTime?
  lmsPlan               Plan                @default(FREE)
  lmsPlanExpiresAt      DateTime?

  // Relaciones nuevas del LMS
  courses               Course[]

  // ... resto de campos existentes ...
}

// ─── 2. ENUMS DEL LMS ────────────────────────────────────────────────────────

enum LessonType {
  VIDEO
  DOCUMENTO
  TEXTO
  ENLACE
  EXAMEN        // Integración con el motor de exámenes Aulika
  TAREA         // Actividad de entrega de archivos (LMS)
  EN_VIVO       // Clases sincrónicas (Fase 6)
}

enum EnrollmentStatus {
  ACTIVO
  COMPLETADO
  RETIRADO
}

enum SubmissionStatus {
  PENDIENTE
  ENTREGADO
  CALIFICADO
  ATRASADO
}

enum GradebookItemType {
  EXAMEN
  TAREA
  PARTICIPACION
  MANUAL
}

// ─── 3. MODELOS NÚCLEO DEL LMS ───────────────────────────────────────────────

model Course {
  id                    String              @id @default(uuid()) @db.Uuid
  title                 String
  description           String?
  coverImageUrl         String?
  published             Boolean             @default(false)
  academicInstitutionId String              @db.Uuid
  academicInstitution   AcademicInstitution @relation(fields: [academicInstitutionId], references: [id], onDelete: Cascade)

  // Vínculo opcional a la jerarquía académica chilena ya existente
  courseSectionId       String?             @db.Uuid
  courseSection         CourseSection?      @relation(fields: [courseSectionId], references: [id], onDelete: SetNull)

  createdById           String?             @db.Uuid
  createdBy             User?               @relation("CourseCreatedBy", fields: [createdById], references: [id], onDelete: SetNull)

  modules               Module[]
  enrollments           Enrollment[]
  gradebookItems        GradebookItem[]
  forums                Forum[]
  createdAt             DateTime            @default(now())
  updatedAt             DateTime            @updatedAt

  @@index([academicInstitutionId])
  @@index([courseSectionId])
  @@index([published])
}

model Module {
  id          String   @id @default(uuid()) @db.Uuid
  title       String
  description String?
  order       Int      @default(0)
  courseId    String   @db.Uuid
  course      Course   @relation(fields: [courseId], references: [id], onDelete: Cascade)
  lessons     Lesson[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([courseId])
}

model Lesson {
  id            String           @id @default(uuid()) @db.Uuid
  title         String
  type          LessonType       @default(TEXTO)
  order         Int              @default(0)

  // Contenido de la lección
  contentJson   Json?            // Texto enriquecido en formato JSON (Tiptap)
  videoAssetId  String?          // ID del video en Mux/Cloudflare
  fileUrl       String?          // URL del documento adjunto (Vercel Blob / S3)
  externalLink  String?          // Enlace externo de apoyo
  durationSec   Int?             // Duración estimada (para videos/lecturas)

  // INTEGRACIÓN CON EXÁMENES (Módulo independiente Aulika)
  examId        String?          @db.Uuid
  exam          Exam?            @relation(fields: [examId], references: [id], onDelete: SetNull)

  moduleId      String           @db.Uuid
  module        Module           @relation(fields: [moduleId], references: [id], onDelete: Cascade)
  progress      LessonProgress[]
  assignment    Assignment?
  createdAt     DateTime         @default(now())
  updatedAt     DateTime         @updatedAt

  @@index([moduleId])
  @@index([examId])
}

model Enrollment {
  id          String           @id @default(uuid()) @db.Uuid
  userId      String           @db.Uuid
  user        User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  courseId    String           @db.Uuid
  course      Course           @relation(fields: [courseId], references: [id], onDelete: Cascade)
  status      EnrollmentStatus @default(ACTIVO)
  progressPct Int              @default(0)
  enrolledAt  DateTime         @default(now())
  completedAt DateTime?

  @@unique([userId, courseId])
  @@index([courseId])
  @@index([userId])
}

model LessonProgress {
  id          String   @id @default(uuid()) @db.Uuid
  userId      String   @db.Uuid
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  lessonId    String   @db.Uuid
  lesson      Lesson   @relation(fields: [lessonId], references: [id], onDelete: Cascade)
  completed   Boolean  @default(false)
  lastSeenSec Int?     // Progreso de reproducción para videos
  completedAt DateTime?
  updatedAt   DateTime @updatedAt

  @@unique([userId, lessonId])
  @@index([lessonId])
}

// ─── 4. TAREAS Y ENTREGAS DEL LMS ────────────────────────────────────────────

model Assignment {
  id           String       @id @default(uuid()) @db.Uuid
  lessonId     String       @unique @db.Uuid
  lesson       Lesson       @relation(fields: [lessonId], references: [id], onDelete: Cascade)
  instructions String?      // Instrucciones detalladas de entrega
  dueAt        DateTime?    // Fecha límite de entrega
  maxScore     Int          @default(100)
  submissions  Submission[]
  createdAt    DateTime     @default(now())
  updatedAt    DateTime     @updatedAt
}

model Submission {
  id           String           @id @default(uuid()) @db.Uuid
  assignmentId String           @db.Uuid
  assignment   Assignment       @relation(fields: [assignmentId], references: [id], onDelete: Cascade)
  studentId    String           @db.Uuid
  student      User             @relation(fields: [studentId], references: [id], onDelete: Cascade)
  fileUrl      String?          // Archivo entregado por el estudiante
  textContent  String?          // Respuesta en texto
  status       SubmissionStatus @default(PENDIENTE)
  score        Float?           // Calificación manual asignada por el docente
  feedback     String?          // Retroalimentación del docente
  submittedAt  DateTime?
  gradedAt     DateTime?
  createdAt    DateTime         @default(now())
  updatedAt    DateTime         @updatedAt

  @@unique([assignmentId, studentId])
  @@index([studentId])
}

// ─── 5. LIBRO DE CALIFICACIONES (GRADEBOOK) ──────────────────────────────────

model GradebookItem {
  id        String            @id @default(uuid()) @db.Uuid
  courseId  String            @db.Uuid
  course    Course            @relation(fields: [courseId], references: [id], onDelete: Cascade)
  title     String
  type      GradebookItemType
  weight    Float             @default(1) // Porcentaje de peso (ej: 0.20 para 20%)

  // Vínculos a las actividades evaluadas
  assignmentId String?        @db.Uuid
  examId       String?        @db.Uuid    // Módulo de exámenes Aulika

  grades    Grade[]
  createdAt DateTime          @default(now())
  updatedAt DateTime          @updatedAt

  @@index([courseId])
}

model Grade {
  id              String        @id @default(uuid()) @db.Uuid
  gradebookItemId String        @db.Uuid
  gradebookItem   GradebookItem @relation(fields: [gradebookItemId], references: [id], onDelete: Cascade)
  studentId       String        @db.Uuid
  student         User          @relation(fields: [studentId], references: [id], onDelete: Cascade)
  score           Float         // Nota final calculada o ingresada manualmente
  feedback        String?
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  @@unique([gradebookItemId, studentId])
  @@index([studentId])
}

// ─── 6. FOROS DE INTERACCIÓN ──────────────────────────────────────────────────

model Forum {
  id        String        @id @default(uuid()) @db.Uuid
  courseId  String        @db.Uuid
  course    Course        @relation(fields: [courseId], references: [id], onDelete: Cascade)
  title     String
  threads   ForumThread[]
  createdAt DateTime      @default(now())
  updatedAt DateTime      @updatedAt

  @@index([courseId])
}

model ForumThread {
  id        String      @id @default(uuid()) @db.Uuid
  forumId   String      @db.Uuid
  forum     Forum       @relation(fields: [forumId], references: [id], onDelete: Cascade)
  title     String
  authorId  String      @db.Uuid
  author    User        @relation(fields: [authorId], references: [id], onDelete: Cascade)
  posts     ForumPost[]
  pinned    Boolean     @default(false)
  locked    Boolean     @default(false)
  createdAt DateTime    @default(now())
  updatedAt DateTime    @updatedAt

  @@index([forumId])
}

model ForumPost {
  id           String      @id @default(uuid()) @db.Uuid
  threadId     String      @db.Uuid
  thread       ForumThread @relation(fields: [threadId], references: [id], onDelete: Cascade)
  parentPostId String?     @db.Uuid // Autorreferencia para respuestas anidadas
  parentPost   ForumPost?  @relation("PostAnswers", fields: [parentPostId], references: [id], onDelete: Cascade)
  answers      ForumPost[] @relation("PostAnswers")
  authorId     String      @db.Uuid
  author       User        @relation(fields: [authorId], references: [id], onDelete: Cascade)
  body         String      @db.Text
  createdAt    DateTime    @default(now())
  updatedAt    DateTime    @updatedAt

  @@index([threadId])
  @@index([parentPostId])
}
```

---

## 5. Estrategia de Enrutamiento y Control de Acceso (Proxy)

**[Responsable: Sonnet]**  
Se modificará el archivo `src/proxy.ts` para validar las suscripciones activas del cliente B2B y redirigir según corresponda. El enrutamiento de la UI del Aula Virtual usará internamente el Route Group `src/app/(aula)`.

```typescript
// Lógica conceptual del proxy de Aulika/Aula Aulika (Next.js 16.2)
export async function handleRouting(request: NextRequest) {
    const session = await getSession(request);
    const hostname = request.headers.get('host') || '';
    const path = request.nextUrl.pathname;

    // 1. Identificar si es acceso al Aula Virtual (LMS)
    const isLmsSubdomain = hostname.startsWith('aula.');
    const isLmsPath = path.startsWith('/aula');

    if (isLmsSubdomain || isLmsPath) {
        if (!session) {
            return NextResponse.redirect(new URL('/login', request.url));
        }

        const institution = await getInstitutionInfo(session.user.institutionId);

        // Verificar si la institución tiene contratado el plan LMS
        if (!institution || !isPlanActive(institution.lmsPlan, institution.lmsPlanExpiresAt)) {
            return NextResponse.redirect(new URL('/sin-suscripción-lms', request.url));
        }

        // Rewrite interno para mapear al Route Group (aula)
        if (isLmsSubdomain && !isLmsPath) {
            return NextResponse.rewrite(new URL(`/aula${path}`, request.url));
        }
    }

    // 2. Identificar si es acceso al Motor de Exámenes (Aulika)
    if (path.startsWith('/examen') || path.includes('/exams')) {
        if (!session) return NextResponse.redirect(new URL('/login', request.url));

        const institution = await getInstitutionInfo(session.user.institutionId);

        // Verificar si la institución tiene contratado el plan de exámenes
        if (!institution || !isPlanActive(institution.examsPlan, institution.examsPlanExpiresAt)) {
            return NextResponse.redirect(new URL('/sin-suscripción-examenes', request.url));
        }
    }

    return NextResponse.next();
}
```

---

## 6. Roadmap en 6 Fases (Evolución Incremental y Asignación de Tareas)

### Estructura de Directorios del LMS:

Toda la lógica visual y de routing del Aula Virtual se encuentra bajo **`src/app/(aula)/`**.
Ejemplos de rutas internas en Next.js 16.2:

- Portal Estudiante: `src/app/(aula)/cursos/[id]/page.tsx`
- Visualizar Lección: `src/app/(aula)/cursos/[id]/leccion/[lessonId]/page.tsx`
- Configuración de Tareas: `src/app/(aula)/cursos/[id]/tareas/page.tsx`
- Foros del Curso: `src/app/(aula)/cursos/[id]/foro/page.tsx`

---

### Fase 1: Fundamentos del Aula Virtual

- **Objetivo:** Creación y visualización de la estructura educativa básica.
- **Tareas asignadas:**
    - **[MiniMax-M3]:** Crear la migración inicial de la base de datos con los modelos `Course`, `Module`, `Lesson`, `LessonProgress` y `Enrollment`.
    - **[MiniMax-M3]:** Integrar el SDK de Mux para procesamiento y hosting de video, y la API de Vercel Blob para PDFs.
    - **[Sonnet]:** Desarrollar en Next.js 16.2 el visualizador de cursos y lecciones para el estudiante (`src/app/(aula)/cursos/[id]/page.tsx`).
    - **[Sonnet]:** Diseñar e implementar el editor drag-and-drop de cursos para el panel docente.
    - **[MiniMax-M3]:** Escribir las pruebas E2E con Playwright para verificar la carga de archivos y reproducción de video HLS.

### Fase 2: Tareas del LMS y Libro de Calificaciones Ponderado

- **Objetivo:** Habilitar entregas de archivos por estudiantes y cálculo de notas final 1.0–7.0.
- **Tareas asignadas:**
    - **[MiniMax-M3]:** Crear tablas de `Assignment`, `Submission`, `GradebookItem` y `Grade` en Prisma.
    - **[Sonnet]:** Desarrollar la UI del estudiante para subir archivos adjuntos en sus tareas (`src/app/(aula)/cursos/[id]/leccion/[lessonId]/page.tsx`).
    - **[Sonnet]:** Diseñar la UI del docente para calificar entregas y proporcionar feedback en texto.
    - **[Sonnet]:** Construir la planilla del Libro de Calificaciones (Gradebook) del curso con cálculos en tiempo real en Next.js 16.2.
    - **[MiniMax-M3]:** Implementar el cálculo matemático del promedio final ponderado adaptado a la escala chilena y sincronización de notas de exámenes de Aulika.
    - **[MiniMax-M3]:** Implementar suite de testing para validar consistencia de notas con tests unitarios y E2E.

### Fase 3: Comunicación y Comunidad

- **Objetivo:** Habilitar la interacción y notificaciones transaccionales.
- **Tareas asignadas:**
    - **[MiniMax-M3]:** Generar esquema de base de datos para `Forum`, `ForumThread` y `ForumPost`.
    - **[Sonnet]:** Construir la UI del foro por curso (`src/app/(aula)/cursos/[id]/foro/page.tsx`) y render recursivo de respuestas anidadas.
    - **[Sonnet]:** Diseñar el sistema in-app de notificaciones de la barra de navegación (Bell Icon).
    - **[MiniMax-M3]:** Programar el envío de correos asíncronos ante nuevos posts o anuncios utilizando Brevo.
    - **[MiniMax-M3]:** Validar la sanitización de entradas HTML y Markdown en foros para evitar inyecciones XSS.

### Fase 4: Gamificación y Retención

- **Objetivo:** Incorporar sistemas de puntos, insignias y rachas consecutivas.
- **Tareas asignadas:**
    - **[MiniMax-M3]:** Crear modelos de `Streak`, `Badge` y `PointEvent` y programar el event-listener para registro de puntos.
    - **[Sonnet]:** Implementar la UI de "Mis Logros" del estudiante y el componente del Leaderboard con controles de privacidad.
    - **[Sonnet]:** Integrar alertas animadas con Framer Motion cuando un estudiante desbloquee una insignia.
    - **[MiniMax-M3]:** Pruebas de integración para certificar la consistencia del acumulador de puntos en base de datos.

### Fase 5: Certificación y Analítica Avanzada

- **Objetivo:** Emisión de certificados verificables y analíticas para prevenir la deserción.
- **Tareas asignadas:**
    - **[MiniMax-M3]:** Implementar el generador de PDF usando `@react-pdf/renderer` y la firma de QR del certificado.
    - **[Sonnet]:** Diseñar el visualizador público de validación de certificados y el panel docente de analíticas del curso.
    - **[MiniMax-M3]:** Integrar el SDK de Google AI (Gemini API) para generar resúmenes automáticos de lecciones escritas.
    - **[MiniMax-M3]:** Diseñar las consultas SQL eficientes para la detección temprana de alumnos con bajo rendimiento académico o inactividad.

### Fase 6: Aula Sincrónica

- **Objetivo:** Videollamadas integradas y pizarrones colaborativos en tiempo real.
- **Tareas asignadas:**
    - **[MiniMax-M3]:** Configurar y aprovisionar salas en Daily.co a través de APIs de backend.
    - **[Sonnet]:** Embeber el widget interactivo de **tldraw** y la interfaz de videollamada para el profesor y estudiante.
    - **[Sonnet]:** Desarrollar la UI de agenda y registro de asistencia automática de clases.
    - **[MiniMax-M3]:** Pruebas de integración sincrónica de streaming y persistencia de grabaciones en R2.

---

## 7. Pipeline de Validación de Código Obligatorio (Post-Implementación)

**[Responsable principal: MiniMax-M3]**  
Tras finalizar cada fase del roadmap, se deben ejecutar obligatoriamente los siguientes comandos antes de archivar el plan:

1. `pnpm lint:fix` (Revisión y corrección de sintaxis con Biome).
2. `pnpm type-check` (Validación estricta de tipos de TypeScript).
3. `pnpm build` (Compilación completa de producción para asegurar que no hay fallos de Next.js 16.2).
4. `pnpm test:e2e` (Ejecución de las pruebas Playwright).
5. Mover el archivo del plan a `.spool/04_archive/` renombrado como `YYYY-MM-DD_master-plan-aula-virtual.md`.
