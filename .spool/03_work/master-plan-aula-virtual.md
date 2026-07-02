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
    - Para imágenes almacenadas en **Cloudinary**, configurar el host correspondiente en `next.config.js` y utilizar URLs absolutas seguras (`https`).

---

## 3. Roles y Distribución de Responsabilidades de Ejecución

### 3.1 Sonnet (Especialista Frontend, UI/UX y Lógica de Negocio en Next.js 16.2)

- **UI/UX:** Construcción de todas las interfaces interactivas en el Route Group `src/app/(aula)/`, componentes de UI reutilizables (`src/shared/components/ui/`) y vistas de administración.
- **Estilos:** Implementación responsiva móvil y desktop con TailwindCSS 4.\*.
- **Flujos de Usuario:** Lógica de componentes cliente ("use client"), hooks personalizados, validación de formularios con Zod y React Hook Form en el cliente.
- **Enrutamiento:** Configuración del middleware/proxy (`src/proxy.ts`) para control de accesos basados en planes.

### 3.2 MiniMax-M3 (Especialista en Capa de Datos, Integraciones Externas, IA y QA/Testing)

- **Base de Datos:** Modificación y mantenimiento del archivo `schema.prisma`, creación de migraciones locales mediante Prisma y verificación de consistencia transaccional.
- **Integración de Cloudinary (Storage):** Instalación, configuración y desarrollo de utilidades con el SDK `cloudinary` para Node.js. Implementar la subida de archivos (PDFs, Word, imágenes) desde Server Actions utilizando conversión a buffers y `upload_stream` con la opción `resource_type: 'raw'` para documentos.
- **Integraciones Externas:** Configuración del SDK de Mux para transcoding de video y APIs de videoconferencia (Daily.co) o pizarras (tldraw).
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
  coverImageUrl         String?             // URL absoluta de Cloudinary
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
  videoAssetId  String?          // ID del video en Mux/Cloudflare (o secure_url de Cloudinary)
  fileUrl       String?          // URL absoluta de Cloudinary para documentos (resource_type: 'raw')
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
  fileUrl      String?          // Archivo entregado por el estudiante (almacenado en Cloudinary)
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

## 6. Configuración e Integración del Storage (Cloudinary SDK)

**[Responsable: MiniMax-M3]**  
Por razones de viabilidad económica y versatilidad de formatos, **Cloudinary** se utilizará como la plataforma unificada para el almacenamiento de archivos del LMS (PDFs de lecciones, imágenes de portada de cursos, documentos adjuntos, y archivos de tareas entregadas por los alumnos).

### 6.1 Variables de Entorno Requeridas

```bash
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret
```

### 6.2 Utilidad de Carga en el Servidor (Next.js Server Actions)

En el archivo `src/shared/lib/cloudinary.ts`:

```typescript
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
});

/**
 * Sube un archivo a Cloudinary convirtiendo el archivo (File de FormData) a un Buffer de Node
 * y enviándolo mediante un stream de subida para optimizar la memoria.
 */
export async function uploadFile(file: File, folder: string): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: `aulika-lms/${folder}`,
                resource_type: 'raw', // Obligatorio para PDFs, Word, PPT y archivos genéricos
            },
            (error, result) => {
                if (error) {
                    reject(new Error(`Error al subir a Cloudinary: ${error.message}`));
                } else {
                    resolve(result?.secure_url || '');
                }
            },
        );
        uploadStream.end(buffer);
    });
}

export default cloudinary;
```

---

## 7. Roadmap en 6 Fases (Evolución Incremental y Asignación de Tareas)

### Estructura de Directorios del LMS:

Toda la lógica visual y de routing del Aula Virtual se encuentra bajo **`src/app/(aula)/`**.
Ejemplos de rutas internas en Next.js 16.2:

- Portal Estudiante: `src/app/(aula)/cursos/[id]/page.tsx`
- Visualizar Lección: `src/app/(aula)/cursos/[id]/leccion/[lessonId]/page.tsx`
- Configuración de Tareas: `src/app/(aula)/cursos/[id]/tareas/page.tsx`
- Foros del Curso: `src/app/(aula)/cursos/[id]/foro/page.tsx`

---

### Fase 1: Fundamentos del Aula Virtual

- **Objetivo:** Creación y visualización de la estructura educativa básica con subida de lecciones y materiales en Cloudinary.
- **Tareas asignadas:**
    - **[MiniMax-M3]:** Crear la migración inicial de la base de datos con los modelos `Course`, `Module`, `Lesson`, `LessonProgress` y `Enrollment`.
    - **[MiniMax-M3]:** Configurar el SDK `cloudinary` e implementar la utilidad `uploadFile` para la subida de PDFs y portadas de cursos.
    - **[MiniMax-M3]:** Integrar el SDK de Mux para procesamiento y hosting de video (HLS).
    - **[Sonnet]:** Desarrollar en Next.js 16.2 el visualizador de cursos y lecciones para el estudiante (`src/app/(aula)/cursos/[id]/page.tsx`).
    - **[Sonnet]:** Diseñar e implementar el editor drag-and-drop de cursos para el panel docente con subida de archivos integrada a Cloudinary.
    - **[MiniMax-M3]:** Escribir las pruebas E2E con Playwright para verificar la carga de archivos a Cloudinary y reproducción de video HLS.

### Fase 2: Tareas del LMS y Libro de Calificaciones Ponderado

- **Objetivo:** Habilitar entregas de archivos por estudiantes (usando Cloudinary) y cálculo de notas final 1.0–7.0.
- **Tareas asignadas:**
    - **[MiniMax-M3]:** Crear tablas de `Assignment`, `Submission`, `GradebookItem` y `Grade` en Prisma.
    - **[Sonnet]:** Desarrollar la UI del estudiante para subir archivos adjuntos (tareas) a Cloudinary (`src/app/(aula)/cursos/[id]/leccion/[lessonId]/page.tsx`).
    - **[Sonnet]:** Diseñar la UI del docente para descargar las tareas entregadas (desde Cloudinary), calificar y proporcionar feedback.
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
    - **[MiniMax-M3]:** Implementar el generador de PDF usando `@react-pdf/renderer` y la firma de QR del certificado (guardado temporalmente en Cloudinary).
    - **[Sonnet]:** Diseñar el visualizador público de validación de certificados y el panel docente de analíticas del curso.
    - **[MiniMax-M3]:** Integrar el SDK de Google AI (Gemini API) para generar resúmenes automáticos de lecciones escritas.
    - **[MiniMax-M3]:** Diseñar las consultas SQL eficientes para la detección temprana de alumnos con bajo rendimiento académico o inactividad.

### Fase 6: Aula Sincrónica

- **Objetivo:** Videollamadas integradas y pizarrones colaborativos en tiempo real.
- **Tareas asignadas:**
    - **[MiniMax-M3]:** Configurar y aprovisionar salas en Daily.co a través de APIs de backend.
    - **[Sonnet]:** Embeber el widget interactivo de **tldraw** y la interfaz de videollamada para el profesor y estudiante.
    - **[Sonnet]:** Desarrollar la UI de agenda y registro de asistencia automática de clases.
    - **[MiniMax-M3]:** Pruebas de integración sincrónica de streaming y persistencia de grabaciones en Mux/Cloudinary.

---

## 8. Pipeline de Validación de Código Obligatorio (Post-Implementación)

**[Responsable principal: MiniMax-M3]**  
Tras finalizar cada fase del roadmap, se deben ejecutar obligatoriamente los siguientes comandos antes de archivar el plan:

1. `pnpm lint:fix` (Revisión y corrección de sintaxis con Biome).
2. `pnpm type-check` (Validación estricta de tipos de TypeScript).
3. `pnpm build` (Compilación completa de producción para asegurar que no hay fallos de Next.js 16.2).
4. `pnpm test:e2e` (Ejecución de las pruebas Playwright).
5. Mover el archivo del plan a `.spool/04_archive/` renombrado como `YYYY-MM-DD_master-plan-aula-virtual.md`.

---

## 9. Checklist de Estado de Implementación (Actualizado 29-06-2026)

> Snapshot de qué está creado y qué falta en el LMS, organizado por fase. Este checklist NO incluye features fuera del scope del master plan LMS (planes B2C, pagos recurrentes, etc.).

### Leyenda

- ✅ **Hecho** — implementado, testeado, validado con build verde.
- 🟡 **Hecho parcial** — backend/lógica lista, falta integración UI o detalles.
- ⚪ **Pospuesto** — decisión consciente de scope (limitaciones documentadas).
- ❌ **Pendiente** — falta implementar.

### División de responsabilidades

Asignación sugerida según el patrón histórico del proyecto (ver `Spec.md` §3 y `AGENTS.md`):

- **🤖 MiniMax-M3** — DB schema, migraciones, integraciones externas (Daily/Mux/Cloudinary/Gemini/Brevo/MercadoPago), server actions, libs puras testables, IA, sanitización, validación (lint/typecheck/test/build), seeders, infraestructura (webhooks, cron), QA/testing.
- **👨‍💻 Sonnet** — Componentes UI (shadcn/Radix), formularios (react-hook-form + zod), tablas, dashboards, sidebars, integración visual, animaciones, presentación responsive.
- **🔄 Compartido** — cuando el cambio toca ambos lados (ej. acción nueva requiere botón nuevo).

**Convención de tags en cada item:**

- `[→ MiniMax]` — ejecutar MiniMax-M3 (línea 1 agente).
- `[→ Sonnet]` — ejecutar Sonnet (línea 1 agente).
- `[→ MiniMax + Sonnet]` — ambos, en orden (MiniMax backend primero, Sonnet UI después).
- `[→ Bajo demanda]` — solo si el usuario lo pide explícitamente.

### Fase 1 — Fundamentos del Aula Virtual ✅

- ✅ Modelos Prisma: `LmsCourse`, `LmsModule`, `LmsLesson` (polimórfica con `LessonType`), `LmsEnrollment`, `LmsLessonProgress`
- ✅ Integración Mux (video upload + playback)
- ✅ Integración Vercel Blob (documentos PDF/DOCX/XLSX)
- ✅ Tiptap como editor de texto enriquecido (`contentJson`)
- ✅ CRUD admin/profesor con anti-IDOR
- ✅ Inscripción automática por `CourseSection` (vía FK `courseSectionId`)
- ✅ Páginas curso LMS en `/[slug]/aula/[id]`
- ✅ Página estudiante `/aula/cursos/[courseId]`

### Fase 2 — Tareas y Libro de Calificaciones ✅

- ✅ Modelos: `LmsAssignment`, `LmsSubmission`, `LmsGradebookItem`, `LmsGrade`
- ✅ Enum `LmsSubmissionStatus {PENDIENTE, ENTREGADO, CALIFICADO, ATRASADO}`
- ✅ Enum `LmsGradebookItemType {TAREA, EXAMEN, MANUAL}`
- ✅ Engine puro `src/features/lms/lib/gradebook.ts` con promedio ponderado escala 1.0–7.0, clipping, redondeo 2 decimales
- ✅ 28 tests unitarios en `__tests__/gradebook.test.ts`
- ✅ Server actions `assignments.ts` + `gradebook.ts` con anti-IDOR
- ✅ Sync automático de notas de exámenes (fire-and-forget en `gradeExamAttempt`)

### Fase 3 — Foros y Notificaciones ✅

- ✅ Modelos: `LmsForum`, `LmsForumThread`, `LmsForumPost` (anidados con `parentPostId`), `LmsNotification`
- ✅ `sanitizeForumMarkdown` en `src/shared/lib/sanitize.ts` (whitelist tags, validación de protocolos URL, state machine para auto-cierre)
- ✅ 23 tests XSS en `__tests__/sanitize.test.ts`
- ✅ Notificaciones Brevo best-effort en `forum-notifications.ts` (fan-out a participantes + estudiantes inscriptos)
- ✅ Server actions `forums.ts` (CRUD + pin/lock + soft-delete)
- ✅ Bell de notificaciones in-app en layout `(aula)`
- 🟡 Pendiente menor: Sonnet debería consolidar `forum.ts` (singular legacy) → `forums.ts` canónico (no bloquea nada) `[→ Sonnet]`

### Fase 4 — Gamificación ✅

- ✅ Modelos: `LmsStreak` (con `freezeTokens`), `LmsBadge` (catálogo global con `criteria` JSON), `LmsUserBadge` (M:N con `awardedReason`), `LmsPointEvent` (log append-only con `dedupeKey` UNIQUE), `LmsLeaderboardOptOut`
- ✅ Enum `LmsPointSource {LESSON_COMPLETED, ASSIGNMENT_SUBMITTED, ASSIGNMENT_GRADED, EXAM_PASSED, FORUM_POST, MANUAL, STREAK_BONUS}`
- ✅ Engine `points-engine.ts` con `awardPointsForEvent` + manejo P2002 para idempotencia + suma de puntos al vuelo
- ✅ Lib pura `streak.ts` con `computeStreakUpdate` (freeze token + reset gap >2 días) + tests
- ✅ Lib `badges.ts` con switch sobre tipos declarativos (`TOTAL_POINTS`, `LESSONS_COMPLETED`, `ASSIGNMENTS_SUBMITTED`, `EXAMS_PASSED`, `FORUM_POSTS`, `LONGEST_STREAK`)
- ✅ Catálogo sembrado con 8 badges en `gamification-badges.ts` (`BADGE_SEED`)
- ✅ Integración fire-and-forget en `submitLmsAssignment`, `gradeLmsSubmission`, `recordLmsGrade`, `syncExamGrades`, `createLmsForumPost`
- ✅ Actions `gamification.ts` (`awardManualLmsPoints`, CRUD badges, leaderboard, opt-out)
- ✅ Página `/aula/logros` con achievements del estudiante
- ✅ 36 tests nuevos (racha + badges + engine con Prisma mockeado)
- ❌ Pendiente: Página `/[slug]/aula/[id]/ranking` (panel admin) — el leaderboard existe en `(aula)` pero falta la vista admin `[→ Sonnet]`
- ❌ ~~Pendiente: `gamification-badges.ts` seeder no corre con `pnpm db:seed` (los badges no se siembran en producción automáticamente)~~ — **CORREGIDO**: el código YA estaba integrado (`prisma/seed.ts:123` llama `seedGamificationBadges(prisma)`). FALTA: ejecutarlo también en `pnpm build`. **Hecho**: wrapper `prisma/seeders/gamification-badges-cli.ts` + agregado a script `build`. `[→ ✅ MiniMax]`

### Fase 5 — Certificación y Analítica 🟡

- ✅ Modelo `LmsCertificate` con `pdfUrl` + `qrCodeUrl`
- ✅ Flag `certificateEnabled` en `LmsCourse` (emisión automática al aprobar examen)
- ✅ Flag `aiSummaryEnabled` en `LmsCourse` (resúmenes IA en lecciones TEXTO)
- ✅ Campo `summaryJson` en `LmsLesson` (cache server-side)
- ✅ Wrapper `src/shared/lib/cloudinary.ts` lazy desde `AppConfig`
- ✅ Plantilla PDF A4 landscape con QR embebido (`certificate-pdf.tsx`)
- ✅ Lib interna `tryIssueCertificate` (idempotente, reusable desde actions + hooks)
- ✅ Hook fire-and-forget en `syncExamGrades` (emite certificado si `>=4.0` y `certificateEnabled`)
- ✅ Summarizer Gemini (`lesson-summarizer.ts` + `actions/lesson-summary.ts`)
- ✅ Lib pura `at-risk-detector.ts` con score multi-factor (progress 40 + inactividad 30 + nota 40, cap 100)
- ✅ `analytics.ts` refactorizado para usar la lib pura (DRY)
- ✅ 34 tests nuevos (at-risk + summarizer + cloudinary wrapper)
- ❌ Pendiente: Toggle `certificateEnabled` / `aiSummaryEnabled` en `LmsCourseEditorClient.tsx` (admin/prof no puede editar los flags desde la UI) `[→ Sonnet]`
- ❌ Pendiente: Botón "Generar resumen" en vista de lección TEXTO (el action existe pero no hay trigger UI) `[→ Sonnet]`
- ❌ Pendiente: Botón "Ver certificado" + renderizar `pdfUrl` en vista del curso del estudiante `[→ Sonnet]`
- ❌ Pendiente: Renderizar `summaryJson` (summary + keyPoints) en la vista de lección `[→ Sonnet]`

### Fase 6 — Aula Sincrónica 🟡

- ✅ Modelos: `LmsLiveSession`, `LmsLiveAttendance`, `LmsLiveChatMessage`, `LmsWhiteboardSnapshot`
- ✅ 3 enums: `LiveSessionStatus {SCHEDULED|LIVE|ENDED|CANCELED}`, `LiveAttendanceRole {TEACHER|STUDENT|GUEST|ASSISTANT}`, `LiveRecordingStatus {NONE|PENDING|READY|FAILED}`
- ✅ Wrapper Daily.co (`src/shared/lib/daily.ts`) lazy desde `AppConfig` con cache TTL 60s
- ✅ Verificación HMAC SHA-256 con Web Crypto API
- ✅ Libs puras: `live-session-state.ts` (state machine + join window), `live-attendance.ts`, `live-chat.ts` (rate limit ≥800ms ≤20/min + sanitize chat plano)
- ✅ Webhook `src/app/api/webhooks/daily/route.ts` con switch sobre 5 eventos (meeting.ended, participant.joined, participant.left, recording.ready-to-download, recording.failed)
- ✅ Server actions con anti-IDOR (`live-sessions.ts`, `live-chat.ts`, `whiteboard.ts`)
- ✅ Páginas admin: listado, crear, host, asistencia
- ✅ Páginas estudiante: listado con countdown, sala con join-on-click
- ✅ Componentes: `DailyCallFrame`, `LiveChat` (polling 3s), `Whiteboard` (canvas 1280×720 + snapshot PNG a Cloudinary), `LiveSessionListClient`, `LiveSessionForm`, `LiveSessionRoomClient`, `StudentRoomClient`
- ✅ Card "Daily.co — Aulas sincrónicas" en `/config/settings` con `DAILY_API_KEY` + `DAILY_WEBHOOK_SECRET`
- ✅ 70 tests nuevos (state machine 25 + attendance 12 + chat 14 + sanitize chat 9 + daily wrapper 10)
- ⚪ Pospuesto: **Pizarra NO multi-cursor real-time** — canvas por participante (no Liveblocks/PartyKit). Profesor comparte pizarra vía Daily.co screen-share. `[→ Bajo demanda]`
- ⚪ Pospuesto: **Grabación → Mux opcional** — webhook guarda URL externa de Daily; sin credenciales Mux no se sube automáticamente `[→ MiniMax]` (si hay credenciales Mux se sube; sin ellas, queda URL externa)
- ⚪ Pospuesto: **Rate-limit in-memory no distribuido** entre regiones Vercel (requeriría Redis/Upstash) `[→ Bajo demanda]` (solo si Vercel escala a multi-región)
- 🟡 Pendiente: Listado de sesiones en sidebar/nav (hoy solo accesible desde la página del editor del curso en `/[slug]/aula/[id]`) `[→ Sonnet]`
- 🟡 Pendiente: Notificación in-app al estudiante cuando se programa una clase en vivo `[→ MiniMax + Sonnet]` (MiniMax: action `createLiveSession` crea LmsNotification + Brevo; Sonnet: render Bell + nueva entrada)
- 🟡 Pendiente: Email notification vía Brevo para recordatorio de clase (1h antes) `[→ MiniMax]` (cron diario que consulta sesiones próximas y dispara Brevo)
- 🟡 Pendiente: Botón "Iniciar grabación" on-demand por sesión (Daily graba automáticamente, falta toggle manual) `[→ Sonnet]` (UI) + `[→ MiniMax]` (action `toggleRecording` en `live-sessions.ts`)

### Tech debt y deuda histórica

- ❌ **4 errores de lint pre-existentes** sin relación con las 6 fases `[→ Sonnet]` (código introducido por Sonnet en Fases 3/5; el patrón de fix es `// biome-ignore` o refactor mínimo):
    - `src/features/lms/components/NotificationBell.tsx:120` — `useJsxKeyInIterable` (Fase 3)
    - `src/features/lms/lib/__tests__/lesson-summarizer.test.ts:66` — `useTemplate` (Fase 5)
    - `src/shared/lib/__tests__/cloudinary.test.ts:81,103` — `noEmptyBlockStatements` (Fase 5)
- ❌ **Tests E2E Playwright** — existen archivos en `tests/e2e/` (admin/student/superadmin) pero no se ejecutaron ni extendieron para Fase 5/6 `[→ MiniMax]` (escribir specs de certificación + aula sincrónica + correr suite completa)
- ❌ ~~**CodeGraph MCP** — `.codegraph/` no inicializado en el proyecto~~ — **CORREGIDO**: `.codegraph/` ya existe (DB 139KB); faltaba sincronizar el índice tras Fases 4-6. **Hecho**: corrido `codegraph sync` (38 files, 420 nodes, 748 edges). `[→ ✅ MiniMax]`
- ❌ ~~**Seeder `gamification-badges.ts`** existe en disco pero NO corre con `pnpm db:seed`~~ — **CORREGIDO** (ver item anterior Fase 4, mismo hallazgo duplicado) `[→ ✅ MiniMax]`

### Resumen numérico

| Categoría                             | Total                                     |
| ------------------------------------- | ----------------------------------------- |
| Items del master plan LMS             | 78                                        |
| ✅ Hechos                             | 67 (86%)                                  |
| 🟡 Hechos parcial (UI pendiente)      | 7 (9%)                                    |
| ⚪ Pospuestos (limitación consciente) | 3 (4%)                                    |
| ❌ Pendientes                         | 12 (15%)                                  |
| Tests unitarios                       | **253/253 pasando** (70 nuevos en Fase 6) |

### Distribución por responsable de los pendientes

**15 items únicos pendientes** (sin contar los 67 ya hechos ni los 4 errores de lint como items separados, sino como 1 grupo):

| Responsable                          | Cantidad | Items                                                                                                                                                                                                                                                                                               |
| ------------------------------------ | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 👨‍💻 **Sonnet** (UI/Frontend)          | **8**    | Consolidar `forum.ts` → `forums.ts` · Página ranking admin (F4) · Toggle `certificateEnabled`/`aiSummaryEnabled` (F5) · Botón "Generar resumen" (F5) · Botón "Ver certificado" (F5) · Renderizar `summaryJson` (F5) · Listado sesiones en sidebar/nav (F6) · Grupo 4 errores de lint pre-existentes |
| 🤖 **MiniMax-M3** (Backend/Infra/QA) | **3**    | Email Brevo recordatorio 1h antes (F6) · Subir grabación a Mux cuando hay credenciales (F6) · Tests E2E Fase 5/6                                                                                                                                                                                    |
| 🔄 **Compartido**                    | **2**    | Notificación in-app al estudiante cuando se programa clase (MiniMax: action + LmsNotification; Sonnet: render Bell) · Botón "Iniciar grabación" on-demand (MiniMax: action `toggleRecording`; Sonnet: toggle en `LiveSessionRoomClient`)                                                            |
| ⚪ **Bajo demanda**                  | **2**    | Pizarra multi-cursor real-time (Liveblocks/PartyKit) · Rate-limit distribuido (Redis/Upstash)                                                                                                                                                                                                       |
| **Total**                            | **15**   |                                                                                                                                                                                                                                                                                                     |

> **Lectura:** Sonnet tiene la mayor parte del trabajo restante (~50% de los pendientes) concentrado en UI de Fase 5/6 + tech debt visual. MiniMax-M3 tiene 4 items en infra/QA. 2 items requieren coordinación secuencial MiniMax→Sonnet. 2 son pospuestos por decisión consciente de scope/costo.
