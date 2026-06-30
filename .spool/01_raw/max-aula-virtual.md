# INV-2026-MAX-AULA — De Aulika a Aula Virtual (LMS)

> **Tipo:** Investigación + Plan estratégico (raw, sin refinar)
> **Fecha:** 2026-06-29
> **Estado:** Plano inicial — NO ejecutable todavía
> **Próximo paso (Gemini):** consolidar en `.spool/02_inbox/max-aula-virtual.md`
> **Próximo paso (Sonnet/GLM):** ejecutar tras mover a `.spool/03_work/`
> **Stack de referencia:** Next.js 16 (App Router) · React 19 · TypeScript Strict · PostgreSQL · Prisma 7 · Vercel

---

## 0. Resumen Ejecutivo

Aulika es hoy un sistema de **evaluación en línea + gestión institucional** robusto, multi-tenant por `slug`, con notas 1–7, login por RUT para estudiantes y NextAuth para administradores/profesores. La base ya construida (RBAC, banco de preguntas, ventana horaria, proctoring básico, jerarquía académica chilena por `InstitutionType`) es un excelente punto de partida — pero el producto se percibe como **"herramienta de pruebas"**, no como **"lugar donde ocurre el aprendizaje"**.

El objetivo de esta investigación es **mapear exactamente lo que falta** entre Aulika hoy y un Aula Virtual / LMS de nivel producción, **sin romper el producto en producción** y **sin duplicar datos**. Se propone una evolución incremental en **6 fases** bajo el principio rector: **"Aulika examen sigue funcionando exactamente igual; el LMS cuelga al lado y hereda usuarios/instituciones/exámenes".**

Tres decisiones arquitectónicas no negociables (ya aprobadas por ingeniería):

1. **Tabla única de usuarios** (`User`); el estudiante del aula es el mismo `User` que rinde exámenes.
2. **Un solo PostgreSQL + un único schema Prisma unificado**; las tablas existentes no se tocan, se extienden.
3. **Subdominio `aula.aulika.cl`** reescrito internamente a `/aula/*` en el mismo deploy de Vercel, con cookie cross-subdomain `.aulika.cl`.

---

## 1. ¿Qué es un Aula Virtual / LMS?

### 1.1 Definición operativa

Un **Learning Management System (LMS)** es una plataforma de software diseñada para **administrar, documentar,.trackear,reportar y entregar cursos educativos o programas de capacitación**. Según la definición canónica de la industria (analogous.org, Brandon-Hall, ADL):

- **Course delivery:** entrega contenido multimedia (texto, video, audio, PDF, SCORM/xAPI).
- **Learner tracking:** registra cada interacción (qué vio, qué entregó, cuánto tiempo, en qué intentó).
- **Assessment engine:** aplica evaluaciones con retroalimentación.
- **Communication fabric:** une docentes y estudiantes (foros, mensajería, anuncios, videoconferencia).
- **Administration layer:** matricula, certifica, factura y audita.
- **Reporting & analytics:** produce indicadores para docentes, instituciones y reguladores.

### 1.2 Aulika hoy vs. Aula Virtual completa

| Dimensión                  | **Aulika hoy**                                           | **Aula Virtual completa**                                                              |
| -------------------------- | -------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| **Propósito central**      | Evaluar (medir aprendizaje en una ventana)               | Acompañar el aprendizaje de principio a fin (antes, durante, después)                  |
| **Contenido**              | Solo enunciados de preguntas + opcional PDF en consigna  | Módulos → lecciones (video, PDF, lectura, link, embed)                                 |
| **Evaluación**             | Exámenes cronometrados con banco, proctoring y notas 1–7 | Examen + tareas + ensayos + rúbricas + quizzes formativos                              |
| **Entrega del estudiante** | Click → rendir → nota                                    | Avance por lección, entregas con archivos, fechas de vencimiento, re-entregas          |
| **Comunicación**           | Inexistente entre personas; solo emails transaccionales  | Foros por ramo, anuncios, mensajería 1-a-1, notificaciones in-app, opc. videollamada   |
| **Progreso**               | Binario: rindió o no                                     | % avance por curso, lesson-progress, last-accessed, prerequisites                      |
| **Calificación**           | Nota única por examen (1.0–7.0)                          | Gradebook ponderado por curso (columnas: tareas, examen, participación, etc.)          |
| **Certificación**          | No existe                                                | Certificado PDF con QR verificable + opcional blockchain                               |
| **Analítica**              | Conteos (N exámenes, N rendidos)                         | Analítica por estudiante (tiempo en plataforma, dominios débiles, riesgo de deserción) |
| **Gamificación**           | No existe                                                | Puntos, badges, rachas, leaderboards                                                   |
| **Identidad**              | RUT único, sin SSO, sin OAuth                            | RUT + opcional Google/Microsoft + SSO + credenciales verificables                      |
| **Videoconferencia**       | No existe                                                | Aulas en vivo integradas o embebidas (Zoom/Meet/Daily/Jitsi)                           |
| **Mobile**                 | Responsive pero no mobile-first                          | App-first (PWA instalable, offline básico, push notifications)                         |
| **Modelo de negocio**      | Suscripción por plan de exámenes                         | Exámenes + LMS en dos SKUs independientes con bundle en plan superior                  |
| **Compliance**             | Mínima (Ley 19.628 + Decreto 678/2018)                   | + trazabilidad de progreso, exportación SCORM/xAPI, retención de datos configurable    |

> **Lectura clave:** Aulika resuelve la columna vertebral del LMS (**evaluación autenticada y con identidad**). Le falta todo lo relativo a **entrega de contenido**, **seguimiento longitudinal del estudiante** y **comunicación**.

---

## 2. Cómo Funciona un Aula Virtual

### 2.1 Flujo general (Docente ↔ Plataforma ↔ Estudiante)

```
+------------------+                          +-------------------+                          +------------------+
|     DOCENTE      |                          |     PLATAFORMA    |                          |    ESTUDIANTE    |
+------------------+                          +-------------------+                          +------------------+
        |                                              |                                              |
        |  (1) Crea curso                              |                                              |
        |--------------------------------------------->|                                              |
        |     [módulos, lecciones, pesos gradebook]    |                                              |
        |                                              |                                              |
        |  (2) Publica + asigna a grupos               |                                              |
        |--------------------------------------------->|                                              |
        |     [EnrollmentGroup]                        |                                              |
        |                                              |                                              |
        |  (3) Adjunta material                        |                                              |
        |--------------------------------------------->|                                              |
        |     [Upload PDF / video URL / link externo]  |                                              |
        |                                              |                                              |
        |                                              |   (4) Login + ver cursos matriculados       |
        |                                              |<---------------------------------------------|
        |                                              |     [Dashboard estudiante]                  |
        |                                              |                                              |
        |                                              |   (5) Marca lección como vista              |
        |                                              ||<--------------------------------------------|
        |                                              |     [LessonProgress: viewed=true]           |
        |                                              |                                              |
        |                                              |   (6) Entrega tarea / rinde quiz            |
        |                                              ||<--------------------------------------------|
        |                                              |     [Submission / ExamAttempt → Result]    |
        |                                              |                                              |
        |  (7) Revisa entregas / califica con rúbrica |                                              |
        |<---------------------------------------------|                                              |
        |     [Score, feedback, allow-resubmit]        |                                              |
        |                                              |                                              |
        |  (8) Publica nota en gradebook               |                                              |
        |--------------------------------------------->|                                              |
        |                                              |   (9) Ve nota + feedback                    |
        |                                              |--------------------------------------------->|
        |                                              |                                              |
        |  (10) Analítica: progreso, riesgo deserción  |                                              |
        |<---------------------------------------------|                                              |
        |     [Dashboards + alertas]                   |                                              |
        |                                              |                                              |
        |  (11) Emite certificado si aprueba           |                                              |
        |--------------------------------------------->|                                              |
        |                                              |   (12) Descarga certificado con QR          |
        |                                              |--------------------------------------------->|
        |                                              |                                              |
```

### 2.2 Modalidades de aprendizaje soportadas

| Modalidad         | Definición                                                 | Herramientas mínimas en el LMS                                  | Estado en Aulika | Acción requerida                             |
| ----------------- | ---------------------------------------------------------- | --------------------------------------------------------------- | ---------------- | -------------------------------------------- |
| **Sincrónico**    | Misma hora, mismo lugar virtual; docente y alumnos en vivo | Videoconferencia integrada, chat en vivo, pizarrón colaborativo | ❌               | Fase 6 — wrapper Daily.co / Jitsi / Zoom SDK |
| **Asincrónico**   | Cada uno a su ritmo; contenido + tareas + foros            | LMS clásico (lecciones, tareas, foros)                          | ❌               | Fases 1–3                                    |
| **Blended**       | Mix sincrónico + asincrónico                               | Ambas capacidades                                               | ❌               | Fases 1–6 sumadas                            |
| **HyFlex**        | Estudiante elige: presencial / sincrónico / asincrónico    | Grabación de clases + asistencia múltiple                       | ❌               | Diferido (Fase 7+)                           |
| **Microlearning** | Píldoras cortas (3–7 min) + repetición espaciada           | Lecciones cortas + push reminders + flashcards                  | ❌               | Diferido (Fase 7+)                           |

### 2.3 Roles habituales en un LMS

| Rol                     | En Aulika hoy | En LMS                                                  |
| ----------------------- | ------------- | ------------------------------------------------------- |
| **SuperAdmin**          | ✅            | ✅ (gestiona plataformas, planes, facturación)          |
| **Admin institucional** | ✅            | ✅ (gestiona su colegio: usuarios, cursos, matrícula)   |
| **Docente**             | ✅            | ✅ (autor de cursos, calificador, facilitador de foros) |
| **Tutor / Ayudante**    | ❌            | 🆕 (sub-rol del docente; califica pero no edita curso)  |
| **Estudiante**          | ✅            | ✅ (consume cursos, entrega, rinde, comenta)            |
| **Apoderado**           | ❌            | 🆕 (vista de solo-lectura del progreso de su hijo)      |
| **Invitado / Auditor**  | ❌            | 🆕 (ej. MINEDUC: revisa sin editar)                     |

---

## 3. Arquitectura Técnica

### 3.1 Diagrama multicapa (estilo C4 simplificado)

```
+============================================================================+
|                      CAPA DE PRESENTACIÓN (Browser / Mobile)              |
|   Next.js 16 SSR + RSC · React 19 · Tailwind 4 · shadcn/ui · PWA          |
|   Dominios: app.aulika.cl (examen) · aula.aulika.cl (LMS) · /config       |
+============================================================================+
                                    |
                                    | HTTPS / cookies .aulika.cl
                                    v
+============================================================================+
|                    CAPA DE BORDE (Vercel Edge Network)                    |
|   proxy.ts (rewrite, auth, geo, rate-limit, x-robots)                      |
|   WAF + CDN assets + Image Optimization                                  |
+============================================================================+
                                    |
                                    v
+============================================================================+
|               CAPA DE NEGOCIO (Next.js Route Handlers + RSC)              |
|   - Server Actions por dominio (exams, courses, enrollment, gradebook)    |
|   - Feature modules en src/features/{exams,courses,...}                    |
|   - Validación Zod en cliente y servidor                                  |
|   - Auth: NextAuth v5 (admin/profesor) + jose JWT (estudiante)            |
|   - Multi-tenant scoping (slug + aulaVirtualEnabled flag)                  |
+============================================================================+
                                    |
                                    v
+============================================================================+
|                  CAPA DE DATOS (PostgreSQL único · Prisma 7)              |
|   Schema unificado: User, AcademicInstitution, Course, Module, Lesson,    |
|   Enrollment, LessonProgress, Assignment, Submission, ForumThread, etc.    |
|   Row-Level Security por tenantId cuando aplique                          |
|   Conexión: Vercel Postgres (Neon) + AWS S3 para archivos                 |
+============================================================================+
                                    |
                                    v
+============================================================================+
|                  SERVICIOS EXTERNOS (API + Webhooks)                      |
|   Google AI SDK   → generación de preguntas / resúmenes                  |
|   MercadoPago     → suscripciones (examen SKU + aula SKU)                |
|   Cloudflare R2   → video streaming (fase 6+)                            |
|   Brevo           → email transaccional                                 |
|   Daily.co / Jitsi→ videoconferencia (fase 6)                            |
|   Sentry          → observabilidad                                       |
+============================================================================+
```

### 3.2 Patrones arquitectónicos evaluados

| Patrón                   | Madurez    | Ventajas                                               | Desventajas                                              | Veredicto para Aulika                                     |
| ------------------------ | ---------- | ------------------------------------------------------ | -------------------------------------------------------- | --------------------------------------------------------- |
| **Monolito modular**     | ⭐⭐⭐⭐⭐ | Despliegue atómico, types compartidos, refactor seguro | Acoplamiento si no se cuidan límites                     | ✅ **Elegido** — coherente con el modelo actual           |
| **Microservicios**       | ⭐⭐⭐     | Equipos independientes, escalado granular              | Doble escritura, red, versionado, hasta 10x costo DevOps | ❌ Sobredimensionado para <100 instituciones en Chile     |
| **Serverless (FaaS)**    | ⭐⭐       | Paga por uso, escala infinito                          | Cold start, debugging difícil, vendor lock               | ⚠️ Vercel ya da serverless a nivel request, no forzar más |
| **Event-driven (queue)** | ⭐⭐⭐⭐   | Desacopla tareas pesadas (video transcode, PDF, mail)  | Complejidad operacional, requiere DLQ + retry            | ✅ **Adoptar gradualmente** (Inngest / Trigger.dev)       |

> **Decisión:** mantener **monolito modular** con **DDD por features** (convención ya instaurada: `src/features/{dominio}`), sumar **eventos asíncronos livianos** solo para trabajos pesados (generación de certificados PDF, transcripción de video, resúmenes con IA). Se rechaza la migración a microservicios.

---

## 4. Módulos Fundamentales

### 4.1 Núcleo Educativo (Core)

#### 4.1.1 Gestión de cursos

- Jerarquía: **Curso → Módulo → Lección → (Actividad | Examen)**.
- `Course`: slug, título, descripción, cover image, `academicInstitutionId`, `instructorId` (User), `publishedAt`, `aulaVirtualEnabled` (heredable).
- `Module`: pertenece a un curso; `order` (int), `title`, `description`.
- `Lesson`: pertenece a un módulo; `type` enum (`VIDEO | PDF | TEXT | LINK | QUIZ | EXAM | ASSIGNMENT`); `order`, `content`, `attachmentUrl`, `durationSec`, **opcional `examId` (FK → Exam existente) si `type = EXAM`**.
- `LessonProgress`: por `(userId, lessonId)`: `viewed`, `viewedAt`, `timeSpentSec`, `completed`. **Unique constraint** `(userId, lessonId)`.
- `Prerequisite`: `lessonId` requiere otro `lessonId`. Validación cíclica en el server.

#### 4.1.2 Roles y permisos

- Reutilizar `UserRole` actual + agregar `TUTOR` y `APODERADO` como valores derivados (no requiere migración si se modelan por relación many-to-many):
    - `CourseInstructor(userId, courseId, role: 'OWNER' | 'ASSISTANT' | 'GRADER')`.
    - `ParentChildLink(parentUserId, childUserId)` para vista de apoderado.
- **Tres capas de enforcement:** `proxy.ts` (rutas), RSC/pages (UI condicional), Server Actions (escritura).

#### 4.1.3 Banco de preguntas con anti-trampa

- Modelo `QuestionBank` ya existente (`Question` con `points`, `order`).
- **Extender** con: `Question.bankId` (FK opcional para reusar entre cursos), `Question.difficultyLevel` (`EASY | MEDIUM | HARD`), `Question.tags String[]`.
- **Anti-trampa existente en Aulika:** ventana horaria, proctoring básico (bloqueo pestaña/IP). **Agregar (Fase 5):** bancos rotativos aleatorios (`Question.bankPoolSize N → tomar K`), ventana móvil por estudiante, snapshot diff de respuestas.

#### 4.1.4 Libro de Calificaciones (Gradebook)

- **Estado actual:** `Result` con `score`, `maxScore`, `passed`. Falta composición por curso.
- **Aulika-LMS Fase 2:**
    - `GradebookColumn(courseId, name, type: 'ASSIGNMENT' | 'EXAM' | 'PARTICIPATION' | 'MANUAL', weight, dropLowest N, maxScore)`.
    - `GradebookScore(columnId, userId, score, comment, gradedBy)`. Unique `(columnId, userId)`.
    - **Cálculo de nota final:** servidor, función pura en `src/features/gradebook/lib/compute.ts`:
        ```
        finalGrade = Σ(columnScore / columnMaxScore × columnWeight × 100)  // % final
        mapChile(finalGrade)  // E → 2.0, …, A → 7.0
        ```
    - Configurable por institución: rango 1–7 o 1–100.

### 4.2 Comunicación e Interacción

#### 4.2.1 Foros anidados

- `ForumThread(courseId, title, authorId, pinnedAt, lockedAt)`.
- `ForumPost(threadId, parentPostId null|post, authorId, bodyMarkdown, editedAt, deletedAt)`.
- **Threading ilimitado:** índice `(parentPostId)`, render recursivo client-side con virtualización.
- **Moderación:** soft-delete, flag/reporte, rol Docente puede fijar/bloquear.
- **Notification fanout:** nuevo post → enqueue `notifications.send` (async).

#### 4.2.2 Mensajería

- **Scope:** 1-a-1 entre usuarios de la misma institución; eventualmente grupal (course-scoped).
- `MessageThread(participantIds: many-to-many)`.
- `Message(threadId, authorId, body, attachments, readBy: jsonb)`.
- **In-app notifications:** bell icon topbar, badge no-leídas, push vía service worker (PWA).
- **Email opcional** throttle: máximo 1 digest/día salvo menciones directas.

#### 4.2.3 Videoconferencia

- **Fase 6, integración opcional,** no-native.
- Modelo: `LiveSession(courseId, startsAt, endsAt, provider: 'DAILY' | 'JITSI' | 'ZOOM', joinUrl, recordingUrl)`.
- El docente crea la sesión desde la lección ("Iniciar clase ahora"); backend aprovisiona room en Daily.co y guarda `joinUrl`.
- Grabación opcional → upload a R2 → URL firmada.

### 4.3 Analítica, Gamificación y Administración

#### 4.3.1 Dashboards por rol

- **Estudiante:** mis cursos (progreso %), próximas entregas, últimas notas, anuncios.
- **Docente:** cursos que dicta, lista de estudiantes en riesgo, promedios, alertas.
- **Admin:** cohorte, retención, uso de plataforma, MRR de su plan.
- **SuperAdmin (sin cambios):** panel `/config` global.

#### 4.3.2 Analítica predictiva de deserción

- **Fase 5+, low-cost ML:** features simples (días sin login, % progreso, últimas 3 notas).
- **Modelo:** regresión logística on-device entrenada con datos institucionales; score de riesgo 0–100.
- **Output:** badge amarillo/rojo en dashboard del docente por estudiante.
- **NO usar LLM para esto** (costo, determinismo).

#### 4.3.3 Gamificación

- `PointEvent(userId, courseId, kind, points, createdAt)` — event-sourced, append-only.
- `Badge(userId, badgeCode, awardedAt)`.
- `Streak(userId, currentDays, longestDays, lastActiveDate)`.
- **Reglas** configurable por institución (`GamificationConfig(institutionId, pointsPerLesson, pointsPerExam5to7, etc.)`).
- **Leaderboard opt-in** (cumplir LGPD chilena, algunos colegios no lo quieren).

#### 4.3.4 Multi-tenant / White-label

- **Ya existe** multi-tenant por `slug`. Mantener.
- **Extensión:** `aulaVirtualEnabled: Boolean` en `AcademicInstitution`.
- **White-label opcional (fase futura):** tema por institución, dominio custom (ej. `aula.colegio.cl`). **Diferido.**

---

## 5. Principales Plataformas del Mercado

### 5.1 Open Source gigantes

| Plataforma     | Stack                                            | Fortalezas                                                           | Debilidades                                                          | Recursos mínimos (self-host)               |
| -------------- | ------------------------------------------------ | -------------------------------------------------------------------- | -------------------------------------------------------------------- | ------------------------------------------ |
| **Moodle**     | PHP 8.x + MySQL/MariaDB + Bootstrap + Plugins    | Ecosistema maduro (>200M usuarios), SCORM/xAPI, plugins infinitos    | UI anticuada, performance pesado en instancias grandes, no-API-first | 2 vCPU / 4 GB RAM mínimo; 8 GB recomendado |
| **Canvas LMS** | Ruby on Rails + GraphQL + React + PostgreSQL     | UX moderna, mobile-first, APIs robustas, hosting oficial Instructure | Difícil de customizar; comunidad OSS más pequeña                     | 4 vCPU / 8 GB RAM                          |
| **Open edX**   | Python (Django) + MySQL + React + XBlock runtime | Usado por MIT/Harvard, soporta contenido MOOC avanzado               | Complejidad operativa altísima; ciclo de release lento               | 8 vCPU / 16 GB RAM                         |

### 5.2 SaaS Comerciales

| Plataforma           | Modelo             | Pros                                      | Contras                                         | Mercado objetivo           |
| -------------------- | ------------------ | ----------------------------------------- | ----------------------------------------------- | -------------------------- |
| **TalentLMS**        | Per-seat           | Fácil de usar, buen reporting             | Pobre mobile, gamificación básica               | PYMEs y capacitación       |
| **Thinkific**        | % revenue + planes | Creación de cursos tipo contenido         | No academic-first                               | Creadores, infoproductores |
| **Teachable**        | % revenue          | Buen branding para venta de cursos        | No-gradebook complejo                           | Creadores                  |
| **Kajabi**           | Plan mensual alto  | Marketing + LMS + email todo-en-uno       | Muy caro, no-academic                           | Coaches                    |
| **Google Classroom** | Gratis             | Cero fricción si ya usan Google Workspace | Sin gradebook real, sin analítica, sin reportes | Educación básica global    |

> **Insight para Chile:** Google Classroom domina colegios por inercia (gratis). Canvas está en universidades selectas (USACH, UDP). Hay **hueco claro** para un LMS **nativo chileno** con RBAC, RUT y gradebook 1–7.

### 5.3 Nueva generación JS/TS

| Plataforma       | URL                                | Stack                       | Por qué mirarla                            |
| ---------------- | ---------------------------------- | --------------------------- | ------------------------------------------ |
| **LearnHouse**   | github.com/learnhouse/learnhouse   | Next.js + FastAPI + Python  | Demo bonita, modular, UI educativa decente |
| **ClassroomIO**  | github.com/classroomio/classroomio | Next.js + Tailwind + Convex | Multi-tenant SaaS-ready, AI features       |
| **StudyX / OEW** | github.com/sueをおこなう           | Node + Mongo                | Pizarrón colaborativo open source          |

> **Aprendizaje accionable:** la **arquitectura Next.js multi-tenant + FastAPI en backend** (LearnHouse) es la que más se parece a lo que Aulika debería apuntar; pero Aulika ya tiene todo en Next.js (server actions + Prisma), lo que es **más simple y suficiente**.

---

## 6. Repositorios GitHub y Librerías de Referencia

### 6.1 Repos para estudiar

| Repo                      | Para qué sirve mirar                                               |
| ------------------------- | ------------------------------------------------------------------ |
| `moodle/moodle`           | Modelo de dominio completo (course → module → activity); gradebook |
| `instructure/canvas-lms`  | Permisos por rol y APIs GraphQL bien diseñadas                     |
| `openedx/edx-platform`    | Cómo manejan inscripción, cohortes, certificados                   |
| `learnhouse/learnhouse`   | Referencia Next.js + LMS; copiar estructuras de `app/(lms)/...`    |
| `classroomio/classroomio` | Multi-tenant SaaS en Next.js; patrones de auth + switching de org  |
| `tldraw/tldraw`           | Pizarrón colaborativo de referencia                                |
| `excalidraw/excalidraw`   | Pizarrón open source de calidad (alternativa a tldraw)             |
| `nextauthjs/next-auth`    | Ya lo usamos; revisar v5 patterns                                  |
| `prisma/prisma`           | Ya lo usamos; revisar multi-schema tips                            |

### 6.2 Librerías npm / servicios por categoría

| Necesidad                  | Recomendación primaria                                  | Alternativa          | Notas                                  |
| -------------------------- | ------------------------------------------------------- | -------------------- | -------------------------------------- |
| Editor Rich Text           | `tiptap` (v2) + extensiones (`@tiptap/extension-image`) | Lexical              | Output JSON + markdown export; ya rico |
| Video upload + transcoding | `@aws-sdk/client-s3` + `mediaconvert` + `cloudfront`    | Mux                  | Mux es más simple (paga por uso)       |
| Video player               | `@mux/mux-player-react` o `vidstack`                    | nativo `<video>` HLS | Soporte HLS sin DRM en MVP             |
| Pizarrón colaborativo      | `tldraw` embed o `excalidraw` embed                     | fabric.js DIY        | Tldraw es lo mejor del mercado         |
| Generación PDF             | `@react-pdf/renderer`                                   | puppeteer            | React-PDF no requiere Chromium         |
| QR + verificación          | `qrcode` + endpoint público `/verify/[code]`            | -                    | Firmar con `AUTH_SECRET`               |
| Videoconferencia           | `@daily-co/daily-js`                                    | Jitsi embed          | Daily: 10K min/mes gratis              |
| Markdown seguro            | `react-markdown` + `rehype-sanitize`                    | -                    | Para foros                             |
| File upload directo        | `uploadthing` (Next.js-friendly)                        | S3 SDK directo       | Quitar intermediario después           |
| Background jobs            | `inngest` o `trigger.dev`                               | BullMQ               | Inngest tiene DX Next.js-native        |
| Search                     | Postgres FTS (`tsvector`)                               | Meilisearch          | MVP con FTS, Meili si crece            |
| Cache                      | `unstable_cache` Next + Vercel KV                       | Redis                | Vercel KV gratis hasta 256 MB          |
| Observabilidad             | `@sentry/nextjs`                                        | -                    |                                        |

---

## 7. Tendencias 2024–2026 en EdTech

### 7.1 IA como infraestructura central

| Uso                         | Madurez                 | Implementación propuesta                                              | Costo |
| --------------------------- | ----------------------- | --------------------------------------------------------------------- | ----- |
| **Rutas adaptativas**       | Media                   | Pre-test → clasificador → recomendar módulos                          | Bajo  |
| **Proctoring avanzado**     | Alta                    | Cámara + mic + movimiento de ojos (ya hay cámaras nativas en browser) | Medio |
| **Transcripción de clases** | Alta                    | Whisper API → texto → embeddings para search                          | Medio |
| **Evaluación de ensayos**   | Alta                    | LLM como primer calificador + revisión humana obligatoria             | Medio |
| **Resumen de lecciones**    | Alta                    | LLM al final del módulo → PDF                                         | Bajo  |
| **Tutor IA 1-a-1**          | Temprana                | Agentes con RAG sobre el contenido del curso                          | Alto  |
| **Generación de preguntas** | **Ya existe en Aulika** | Mantener Google AI SDK actual                                         | Bajo  |

### 7.2 Credenciales digitales verificables

- **QR verificable:** firmar JSON `{userId, courseId, grade, issuedAt}` con HMAC SHA-256 → QR → endpoint público `/verify?code=...`.
- **Blockchain (opcional, Fase 7+):** anclar hash del certificado en Polygon/Base. Caro de operar, **NO** para MVP.
- **Open Badges 3.0:** estándar IMS Global; permite interoperabilidad entre LMS.

---

## 8. Contexto Latinoamericano y Chileno

### 8.1 Desafíos estructurales

| Desafío                             | Implicancia                                        | Mitigación en Aulika                                             |
| ----------------------------------- | -------------------------------------------------- | ---------------------------------------------------------------- |
| **Conectividad irregular**          | Rural y sur de Chile con mala conexión 4G          | PWA con cache de lección vista; video HLS con bitrate adaptativo |
| **Mobile-first**                    | 70% del tráfico esperado desde celular             | UI responsivo desde día 1; PWA instalable                        |
| **Brecha digital docente**          | Profesores mayores con poca alfabetización digital | Onboarding in-app + tour guiado (ya implementado)                |
| **Equipamiento escolar compartido** | Estudiantes sin computador personal                | Diseño que funcione en celular + tablet                          |
| **Pago en cuotas y boleta**         | MercadoPago con Webpay es el standard              | Ya integrado MercadoPago; considerar Webpay en Fase 7            |

### 8.2 Adaptación al ecosistema chileno

- ✅ **Sistema de notas 1–7** (ya implementado).
- ✅ **RUT como identidad** (ya implementado).
- 🆕 **Mineduc Decreto 678/2018** — exige trazabilidad de datos escolares + retención mínima. **Cumplir agregando export de bitácora de accesos por estudiante.**
- 🆕 **Ley 21.719 (vacatio legis dic-2026)** — agregaremos derecho al olvido con verificación.
- 🆕 **Planes Docentes (persona natural)** ya en Mineduc: Aulika debe aceptar RUT + boleta honorarios.
- ⚠️ **Competencia local:** Google Classroom (gratis), Canvas (universidades), Edufilia, Aprobado (startup local).
- 🎯 **Oportunidad:** un **LMS chileno con RUT, notas 1-7, Ministerio-friendly, opción de pago en UF mensual** no existe.

---

## 9. Modelos de Negocio y Monetización

### 9.1 SKUs propuestos (dos suscripciones independientes)

| Plan SKU        | Target                  | Precio referencial CLP/mes | Estudiantes máx           | Cursos     | Storage               | Videollamadas |
| --------------- | ----------------------- | -------------------------- | ------------------------- | ---------- | --------------------- | ------------- |
| **LMS Free**    | Docentes individuales   | $0                         | 1 curso, 30 estudiantes   | 1          | 1 GB                  | ❌            |
| **LMS Docente** | Docentes individuales   | $9.990                     | 5 cursos, 100 estudiantes | 5          | 10 GB                 | 10 hrs/mes    |
| **LMS Colegio** | Instituciones pequeñas  | $49.990 + $500/estudiante  | Ilimitados                | Ilimitados | 100 GB + $50/GB extra | 100 hrs/mes   |
| **LMS Inst.**   | Universidades/corporate | Cotización                 | Ilimitados                | Ilimitados | Custom                | Custom        |

> **Regla crítica:** el plan **Aula Virtual ya incluye** acceso completo a Examenes del mismo tier. Quien paga Colegio en Aula Virtual, no paga Colegio en Examen — **es la misma suscripción**, solo cambia el producto/entregable.

### 9.2 Pricing additives

- **Storage extra:** medido, no bloqueante (aviso + oferta de upgrade).
- **Live class hours:** reloj; si excede, cobramos adicional.
- **Certificados premium** (firmados notarialmente vía Open Badges 3.0): upsell.

### 9.3 Unit economics tentativos

| Concepto           | Valor                          |
| ------------------ | ------------------------------ |
| **ARPU target Y1** | $35.000 CLP/mes                |
| **Churn target**   | <3% mensual                    |
| **LTV target**     | 12 meses                       |
| **CAC target**     | <$80.000 CLP (SEO + referidos) |
| **Payback target** | <4 meses                       |

---

## 10. Aulika — Estado Actual (Análisis de Entorno)

### 10.1 Lo que ya tenemos (y funciona en producción)

- ✅ Multi-tenant por `slug` en `AcademicInstitution`.
- ✅ RBAC con 4 roles (`SuperAdministrador | Administrador | Profesor | Estudiante`).
- ✅ Jerarquía académica chilena (`InstitutionType` + `Program | CourseSection | AcademicPeriod`).
- ✅ Banco de exámenes con ventana horaria (`Exam.scheduledAt` + `closesAt`).
- ✅ Proctoring básico (bloqueo de pestaña, IP).
- ✅ Calificación 1–7 determinista (all-or-nothing por pregunta).
- ✅ Login por RUT vía JWT/Jose para estudiantes.
- ✅ NextAuth v5 para admin/profesor.
- ✅ Next.js 16 + Prisma 7 + PostgreSQL único.
- ✅ Sitemap + X-Robots-Tag + JSON-LD SEO.
- ✅ Tour guiado (Driver.js).
- ✅ GA4.
- ✅ Centro de ayuda + páginas legales.

### 10.2 Lo que nos falta para ser un LMS

| Categoría        | Feature faltante                                           | Criticidad    |
| ---------------- | ---------------------------------------------------------- | ------------- |
| **Contenido**    | Módulos y lecciones, upload de archivos, video streaming   | 🔴 Crítica    |
| **Progreso**     | LessonProgress, % avance por curso, prerequisites          | 🔴 Crítica    |
| **Tareas**       | Modelo de Assignment + Submission (archivos, fechas, late) | 🔴 Crítica    |
| **Gradebook**    | Gradebook ponderado por curso (no solo Result suelto)      | 🔴 Crítica    |
| **Foros**        | Modelo ForumThread + ForumPost + anidamiento               | 🟠 Importante |
| **Mensajería**   | Mensajería interna 1-a-1 + notificaciones in-app           | 🟠 Importante |
| **Anuncios**     | Anuncios por curso (Push a la cohorte)                     | 🟠 Importante |
| **Gamificación** | Points, badges, streaks                                    | 🟡 Moderada   |
| **Certificados** | PDF con QR verificable                                     | 🟡 Moderada   |
| **IA en LMS**    | Resúmenes automáticos de lecciones, tutor IA               | 🟡 Moderada   |
| **Live classes** | Videoconferencia + pizarrón                                | 🔵 Futura     |
| **Mobile app**   | PWA instalable con push + offline                          | 🔵 Futura     |
| **Multi-idioma** | Soporte EN/ES (preparación para LATAM)                     | 🔵 Futura     |
| **SCORM/xAPI**   | Importar paquetes SCORM existentes de editoriales          | 🔵 Futura     |

---

## 11. Análisis GAP (Brecha Técnica)

```
+-----------------------------------+-------------------+--------------------------+
| ÁREA                              | AULIKA HOY        | NECESARIO PARA LMS       |
+-----------------------------------+-------------------+--------------------------+
|                                   |                   |                          |
| CONTENIDO                         |  [⚠] parcial      |  [✅] requerido          |
|  - Lecciones / Módulos            |                   |                          |
|  - Video streaming                |                   |                          |
|  - Upload archivos                |                   |                          |
|                                   |                   |                          |
| PROGRESO                          |  [❌] no          |  [✅] requerido          |
|  - LessonProgress                 |                   |                          |
|  - % avance por curso             |                   |                          |
|                                   |                   |                          |
| TAREAS                            |  [❌] no          |  [✅] requerido          |
|  - Assignment + Submission        |                   |                          |
|  - Late / re-entrega              |                   |                          |
|                                   |                   |                          |
| GRADEBOOK                         |  [⚠] parcial     |  [✅] requerido          |
|  - Solo nota de examen            |                   |                          |
|  - Sin columnas                   |                   |                          |
|  - Sin ponderación                |                   |                          |
|                                   |                   |                          |
| COMUNICACIÓN                      |  [❌] no          |  [🟠] alta prioridad     |
|  - Foros                          |                   |                          |
|  - Mensajería                     |                   |                          |
|                                   |                   |                          |
| ANALÍTICA                         |  [⚠] parcial     |  [🟠] alta prioridad     |
|  - Conteos simples                |                   |                          |
|  - Riesgo deserción               |                   |                          |
|                                   |                   |                          |
| GAMIFICACIÓN                      |  [❌] no          |  [🟡] moderada           |
|                                   |                   |                          |
| CERTIFICADOS                      |  [❌] no          |  [🟡] moderada           |
|                                   |                   |                          |
| LIVE CLASSES                      |  [❌] no          |  [🔵] futuro             |
|                                   |                   |                          |
| MOBILE PWA                        |  [⚠] parcial     |  [🔵] futuro             |
|                                   |                   |                          |
+-----------------------------------+-------------------+--------------------------+

LEYENDA: ✅ listo  ⚠ parcial  ❌ no existe   🔴 crítica  🟠 importante  🟡 moderada  🔵 futura
```

**Brechas críticas para llegar a MVP de LMS:** Contenido + Progreso + Tareas + Gradebook.
**Brechas importantes para producto competitivo:** Comunicación + Analítica.
**Brechas moderadas/futuras:** Certificados + IA + Live + PWA.

---

## 12. Roadmap Estratégico Incremental (Por Fases)

> **Principio rector:** "No romper lo que ya funciona en producción." Cada fase mergea un cambio aditivo. Cada fase termina con release a producción + smoke E2E + commit con formato obligatorio + archivo `.spool` movido a `04_archive/`.

### Fase 1 — Fundamentos de Curso (módulos + lecciones + upload + video)

**Objetivo:** estructura básica `Course → Module → Lesson` + subida de materiales + video streaming nativo.
**Duración estimada:** 8–10 semanas (2 ingenieros + 1 diseño).

- [ ] Schemas Prisma: `Course`, `Module`, `Lesson`, `LessonAttachment`, `LessonProgress`.
- [ ] Rutas `/aula/*` con proxy rewrite desde `aula.aulika.cl`.
- [ ] UI profesor: editor de curso drag-and-drop (módulos → lecciones).
- [ ] UI estudiante: dashboard "Mis cursos" con barra de progreso.
- [ ] Upload de archivos via **UploadThing** (PDF, PPT, IMG hasta 100 MB).
- [ ] Video upload + transcoding via **Mux** (o alternativamente Cloudflare Stream).
- [ ] HLS player (`vidstack` o Mux player).
- [ ] Cookie cross-subdomain `.aulika.cl` con SameSite=Lax.
- [ ] Feature flag: `aulaVirtualEnabled` en `AcademicInstitution`.

**Definition of done:** un profesor crea curso con 3 módulos y 5 lecciones (mezcla video + PDF + lectura); un estudiante matriculado ve el curso, marca progreso, ve los videos.

---

### Fase 2 — Evaluaciones Enriquecidas + Gradebook

**Objetivo:** tareas con entregas + gradebook ponderado.
**Duración estimada:** 6–8 semanas.

- [ ] Schemas: `Assignment`, `Submission`, `GradebookColumn`, `GradebookScore`.
- [ ] Editor de Assignment (texto + adjuntos + fecha límite + late penalty).
- [ ] UI de entregas: estudiante sube archivos; docente ve lista + califica con rúbrica.
- [ ] Generación de columnas de Gradebook automática desde exámenes existentes (`Result.score` → columna).
- [ ] Motor de cálculo de nota final (`features/gradebook/lib/compute.ts`).
- [ ] Configuración de pesos por institución.
- [ ] UI gradebook: tabla maestra con edición inline + export CSV.

**Definition of done:** un profesor configura gradebook con 3 columnas (tarea 30%, examen 50%, participación 20%), publica notas, estudiante ve su promedio ponderado.

---

### Fase 3 — Comunicación y Comunidad

**Objetivo:** foros por curso + anuncios + notificaciones in-app + mensajería 1-a-1.
**Duración estimada:** 6–8 semanas.

- [ ] Schemas: `ForumThread`, `ForumPost`, `MessageThread`, `Message`, `Notification`.
- [ ] UI foros: vistas anidadas, búsqueda, moderación.
- [ ] Anuncios del docente: ping a la cohorte.
- [ ] Notificaciones in-app: bell icon + Web Push API (service worker).
- [ ] Mensajería 1-a-1 con attachments.
- [ ] Email digest opcional (vía Brevo).

**Definition of done:** un docente postea anuncio; estudiantes reciben push + email; foro del curso tiene 3 hilos activos; mensajería 1-a-1 funciona.

---

### Fase 4 — Gamificación y Motivación

**Objetivo:** motor de eventos → puntos, badges, rachas.
**Duración estimada:** 3–4 semanas.

- [ ] Schemas: `PointEvent`, `Badge`, `Streak`, `GamificationConfig`.
- [ ] Reglas configurables por institución (puntos por lección vista, examen con nota ≥4, etc.).
- [ ] UI: leaderboard opt-in, badges wall, perfil de usuario con racha.

**Definition of done:** estudiante gana puntos por completar lección; recibe badge "Primera entrega a tiempo"; racha de 5 días activa.

---

### Fase 5 — Certificados y Analítica Avanzada

**Objetivo:** certificado PDF con QR + IA para resúmenes + predicción de deserción.
**Duración estimada:** 5–6 semanas.

- [ ] Schemas: `Certificate`, `CertificateVerification`.
- [ ] Generación PDF con `@react-pdf/renderer` + QR firmado.
- [ ] Endpoint público `/verify/[code]` con verificación HMAC.
- [ ] Modelo de riesgo de deserción (regresión on-device).
- [ ] Dashboard del docente: badges de riesgo (verde/amarillo/rojo).
- [ ] Resumen de lección generado por IA (cron en background con Inngest).
- [ ] Almacenamiento de embeddings en Postgres `pgvector` para búsqueda semántica.

**Definition of done:** estudiante aprueba curso → recibe certificado PDF descargable → QR verifica en `/verify` → IA resume lección automáticamente al cerrar módulo.

---

### Fase 6 — Clases en Vivo y Pizarra Colaborativa

**Objetivo:** videollamadas + pizarrón interactivo.
**Duración estimada:** 4–6 semanas.

- [ ] Schema: `LiveSession`, `LiveAttendance`, `WhiteboardSnapshot`.
- [ ] Integración Daily.co (provider principal) o Jitsi embed.
- [ ] Sala virtual generada al click "Iniciar clase" desde una lección.
- [ ] Asistencia registrada al join + duración.
- [ ] Pizarrón embebido Tldraw (o Excalidraw) por sesión.
- [ ] Grabación automática → upload a R2 → URL firmada en la lección.

**Definition of done:** docente inicia sesión en vivo; 30 estudiantes se conectan; asistencia registrada; grabación disponible como lección posterior.

---

## 13. Stack Técnico Propuesto para la Evolución

### 13.1 Dependencias npm sugeridas

| Paquete                 | Versión target | Para             | Notas                          |
| ----------------------- | -------------- | ---------------- | ------------------------------ |
| `@aws-sdk/client-s3`    | ^3             | Storage          | Directo (sin uploadthing)      |
| `uploadthing`           | ^7             | Upload UI        | DX Next.js-native              |
| `@mux/mux-node`         | ^9             | Video upload     | SDK oficial                    |
| `@mux/mux-player-react` | ^3             | Video player     |                                |
| `@tiptap/react`         | ^2.10          | Rich text        | Editor de lecciones y anuncios |
| `@react-pdf/renderer`   | ^4             | Certificados     | No requiere Chromium           |
| `qrcode`                | ^1.5           | QR certificados  |                                |
| `react-markdown`        | ^9             | Render markdown  | Foros                          |
| `rehype-sanitize`       | ^6             | XSS-safe         | Foros y anuncios               |
| `@daily-co/daily-js`    | ^0.65          | Videoconferencia | F6                             |
| `@tldraw/tldraw`        | ^2             | Pizarrón         | F6                             |
| `inngest`               | ^3             | Background jobs  | Certificados + resúmenes IA    |
| `date-fns`              | ^4             | Fechas relativas | Ya probablemente instalado     |
| `@sentry/nextjs`        | ^8             | Observabilidad   |                                |
| `pgvector`              | ^0.2           | Embeddings IA    | F5                             |

### 13.2 Extensión propuesta del schema Prisma (extracto)

```prisma
// src/prisma/schema.prisma — AULIKA + AULA EXTENSIÓN

model AcademicInstitution {
  id                  String   @id @default(cuid())
  slug                String   @unique
  isDemo              Boolean  @default(false)
  // ... (campos actuales)

  // 🆕 AULA VIRTUAL
  aulaVirtualEnabled  Boolean  @default(false)
  gamificationConfig  GamificationConfig?

  courses             Course[]
}

model User {
  id        String  @id @default(cuid())
  // ... (campos actuales sin cambios)
  coursesTaught   CourseInstructor[]
  enrollments     Enrollment[]
  lessonProgress  LessonProgress[]
  submissions     Submission[]
  messages        Message[]
  pointEvents     PointEvent[]
  badges          Badge[]
  streak          Streak?

  parentLinks  ParentChildLink[] @relation("parent")
  childLinks   ParentChildLink[] @relation("child")
}

// === FASE 1 ===
model Course {
  id                  String   @id @default(cuid())
  slug                String
  title               String
  description         String?
  coverImageUrl       String?
  publishedAt         DateTime?
  institutionId       String
  institution         AcademicInstitution @relation(fields: [institutionId], references: [id])
  modules             Module[]
  enrollments         Enrollment[]
  instructors         CourseInstructor[]
  gradebookColumns    GradebookColumn[]
  forumThreads        ForumThread[]
  liveSessions        LiveSession[]
  certificateTemplate String? // HTML/MJML para PDF
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  @@unique([institutionId, slug])
  @@index([institutionId, publishedAt])
}

model Module {
  id        String  @id @default(cuid())
  courseId  String
  course    Course  @relation(fields: [courseId], references: [id], onDelete: Cascade)
  title     String
  order     Int
  lessons   Lesson[]
  createdAt DateTime @default(now())

  @@index([courseId, order])
}

model Lesson {
  id              String   @id @default(cuid())
  moduleId        String
  module          Module   @relation(fields: [moduleId], references: [id], onDelete: Cascade)
  title           String
  type            LessonType
  order           Int
  // contenido:
  contentMarkdown String?  // para TEXT
  videoAssetId     String?  // Mux asset ID para VIDEO
  videoPlaybackId  String?  // Mux playback ID
  attachmentUrl    String?  // S3/R2 URL para PDF u otros adjuntos
  externalUrl      String?  // para LINK
  durationSec      Int?     // sugerido para micro-learning
  // 🔗 REUTILIZACIÓN: si es EXAM, referencia el motor existente
  examId           String?  @unique
  exam             Exam?    @relation(fields: [examId], references: [id])
  // asignación (opcional)
  dueAt            DateTime?
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  progress        LessonProgress[]
  prerequisites   Lesson[] @relation("LessonPrerequisite")
  prerequisiteFor Lesson[] @relation("LessonPrerequisite")

  @@index([moduleId, order])
}

enum LessonType {
  VIDEO
  PDF
  TEXT
  LINK
  QUIZ         // quiz rápido dentro del curso
  EXAM         // reusa motor de Examen existente
  ASSIGNMENT   // tarea con entrega (F2)
}

model LessonProgress {
  id            String   @id @default(cuid())
  userId        String
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  lessonId      String
  lesson        Lesson   @relation(fields: [lessonId], references: [id], onDelete: Cascade)
  viewed        Boolean  @default(false)
  viewedAt      DateTime?
  timeSpentSec  Int      @default(0)
  completed     Boolean  @default(false)
  completedAt   DateTime?

  @@unique([userId, lessonId])
  @@index([userId, completed])
}

model Enrollment {
  id         String   @id @default(cuid())
  userId     String
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  courseId   String
  course     Course   @relation(fields: [courseId], references: [id], onDelete: Cascade)
  enrolledAt DateTime @default(now())
  role       EnrollmentRole @default(STUDENT)
  active     Boolean  @default(true)

  @@unique([userId, courseId])
  @@index([courseId, active])
}

enum EnrollmentRole {
  STUDENT
  ASSISTANT
  GRADER
}

model CourseInstructor {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  courseId  String
  course    Course   @relation(fields: [courseId], references: [id], onDelete: Cascade)
  role      InstructorRole
  addedAt   DateTime @default(now())

  @@unique([userId, courseId])
}

enum InstructorRole {
  OWNER
  ASSISTANT
  GRADER
}

model ParentChildLink {
  id             String @id @default(cuid())
  parentUserId   String
  parent         User   @relation("parent", fields: [parentUserId], references: [id])
  childUserId    String
  child          User   @relation("child", fields: [childUserId], references: [id])
  createdAt      DateTime @default(now())

  @@unique([parentUserId, childUserId])
}

// === FASE 2 — TAREAS Y GRADEBOOK ===
model Assignment {
  id          String   @id @default(cuid())
  lessonId    String   @unique
  lesson      Lesson   @relation(fields: [lessonId], references: [id], onDelete: Cascade)
  description String
  maxScore    Float
  dueAt       DateTime
  allowLate   Boolean  @default(true)
  latePenaltyPercent Float @default(10)
  maxResubmits Int     @default(1)
  submissions Submission[]
  columnSource GradebookColumn?
}

model Submission {
  id           String   @id @default(cuid())
  assignmentId String
  assignment   Assignment @relation(fields: [assignmentId], references: [id], onDelete: Cascade)
  userId       String
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  attempt      Int      @default(1)
  files        Json     // [{ url, name, mimeType, size }]
  textResponse String?
  submittedAt  DateTime @default(now())
  score        Float?
  feedback     String?
  gradedById   String?
  gradedAt     DateTime?
  status       SubmissionStatus @default(SUBMITTED)

  @@unique([assignmentId, userId, attempt])
  @@index([userId])
}

enum SubmissionStatus {
  SUBMITTED
  LATE
  GRADED
  RETURNED
}

model GradebookColumn {
  id          String   @id @default(cuid())
  courseId    String
  course      Course   @relation(fields: [courseId], references: [id], onDelete: Cascade)
  name        String
  type        GradebookColumnType
  weight      Float
  dropLowest  Int      @default(0)
  maxScore    Float    @default(100)
  order       Int
  // source optional:
  examId      String?
  assignmentId String? @unique
  assignment  Assignment? @relation(fields: [assignmentId], references: [id])
  scores      GradebookScore[]

  @@index([courseId, order])
}

enum GradebookColumnType {
  ASSIGNMENT
  EXAM
  PARTICIPATION
  MANUAL
}

model GradebookScore {
  id        String   @id @default(cuid())
  columnId  String
  column    GradebookColumn @relation(fields: [columnId], references: [id], onDelete: Cascade)
  userId    String
  score     Float
  comment   String?
  gradedById String?
  updatedAt DateTime @updatedAt

  @@unique([columnId, userId])
}

// === FASE 3 — COMUNICACIÓN ===
model ForumThread {
  id        String   @id @default(cuid())
  courseId  String
  course    Course   @relation(fields: [courseId], references: [id], onDelete: Cascade)
  authorId  String
  title     String
  pinnedAt  DateTime?
  lockedAt  DateTime?
  deletedAt DateTime?
  posts     ForumPost[]
  createdAt DateTime @default(now())

  @@index([courseId, createdAt])
}

model ForumPost {
  id          String   @id @default(cuid())
  threadId    String
  thread      ForumThread @relation(fields: [threadId], references: [id], onDelete: Cascade)
  parentPostId String?
  parentPost   ForumPost?  @relation("PostReply", fields: [parentPostId], references: [id])
  replies      ForumPost[] @relation("PostReply")
  authorId    String
  bodyMarkdown String
  editedAt    DateTime?
  deletedAt   DateTime?
  createdAt   DateTime @default(now())

  @@index([threadId, createdAt])
  @@index([parentPostId])
}

model MessageThread {
  id            String @id @default(cuid())
  participants  MessageThreadParticipant[]
  messages      Message[]
  lastMessageAt DateTime?
  createdAt     DateTime @default(now())
}

model MessageThreadParticipant {
  id        String @id @default(cuid())
  threadId  String
  thread    MessageThread @relation(fields: [threadId], references: [id], onDelete: Cascade)
  userId    String
  joinedAt  DateTime @default(now())
  lastReadAt DateTime?

  @@unique([threadId, userId])
}

model Message {
  id          String @id @default(cuid())
  threadId    String
  thread      MessageThread @relation(fields: [threadId], references: [id], onDelete: Cascade)
  authorId    String
  author      User   @relation(fields: [authorId], references: [id])
  body        String
  attachments Json?
  createdAt   DateTime @default(now())

  @@index([threadId, createdAt])
}

model Notification {
  id        String @id @default(cuid())
  userId    String
  kind      String   // 'ANNOUNCEMENT' | 'FORUM_REPLY' | 'GRADE_PUBLISHED' | etc.
  payload   Json
  readAt    DateTime?
  createdAt DateTime @default(now())

  @@index([userId, createdAt])
}

// === FASE 4 — GAMIFICACIÓN ===
model GamificationConfig {
  id                  String @id @default(cuid())
  institutionId       String @unique
  institution         AcademicInstitution @relation(fields: [institutionId], references: [id])
  enabled             Boolean @default(false)
  pointsPerLesson     Int @default(5)
  pointsPerAssignmentOnTime Int @default(10)
  pointsPerExamPassed Int @default(20)
  badgesEnabled       Boolean @default(true)
  leaderboardEnabled  Boolean @default(true)
}

model PointEvent {
  id        String @id @default(cuid())
  userId    String
  user      User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  courseId  String?
  kind      String  // 'LESSON_COMPLETED' | 'ASSIGNMENT_ONTIME' | 'EXAM_PASSED' | etc.
  points    Int
  createdAt DateTime @default(now())

  @@index([userId, createdAt])
}

model Badge {
  id         String @id @default(cuid())
  userId     String
  user       User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  badgeCode  String  // catálogo finito
  awardedAt  DateTime @default(now())

  @@unique([userId, badgeCode])
}

model Streak {
  userId         String @id
  user           User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  currentDays    Int @default(0)
  longestDays    Int @default(0)
  lastActiveDate DateTime?
}

// === FASE 5 — CERTIFICADOS Y ANALÍTICA ===
model Certificate {
  id          String @id @default(cuid())
  userId      String
  courseId    String
  issuedAt    DateTime @default(now())
  verificationCode String @unique
  signature   String   // HMAC SHA-256
  pdfUrl      String
  revokedAt   DateTime?
  revokedReason String?

  @@unique([userId, courseId])
  @@index([verificationCode])
}

model LiveSession {
  id           String @id @default(cuid())
  courseId     String
  course       Course @relation(fields: [courseId], references: [id], onDelete: Cascade)
  lessonId     String?
  provider     LiveProvider
  roomUrl      String
  startsAt     DateTime
  endsAt       DateTime?
  recordingUrl String?
  createdById  String
  attendance   LiveAttendance[]
  createdAt    DateTime @default(now())

  @@index([courseId, startsAt])
}

enum LiveProvider {
  DAILY
  JITSI
  ZOOM
}

model LiveAttendance {
  id         String @id @default(cuid())
  sessionId  String
  session    LiveSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  userId     String
  joinedAt   DateTime
  leftAt     DateTime?
  durationSec Int?

  @@index([sessionId, userId])
}
```

### 13.3 Estructura de carpetas propuesta (Next.js App Router)

```
src/
├── app/
│   ├── (public)/           # actual
│   ├── (login)/            # actual
│   ├── (demo)/             # actual
│   ├── (student)/          # actual (examen)
│   ├── (admin)/            # actual (panel admin + config)
│   └── (aula)/             # 🆕 AULA VIRTUAL
│       └── aula/
│           ├── layout.tsx             # layout con sidebar LMS
│           ├── page.tsx               # dashboard del estudiante/docente
│           ├── courses/
│           │   ├── page.tsx           # lista cursos
│           │   ├── [courseId]/
│           │   │   ├── page.tsx       # vista del curso
│           │   │   ├── modules/[moduleId]/page.tsx
│           │   │   ├── lessons/[lessonId]/page.tsx
│           │   │   ├── assignments/[assignmentId]/page.tsx
│           │   │   ├── gradebook/page.tsx
│           │   │   ├── forum/page.tsx
│           │   │   ├── live/page.tsx
│           │   │   └── certificates/page.tsx
│           ├── inbox/                # mensajería
│           ├── notifications/        # notificaciones in-app
│           ├── certificates/[code]/  # descarga
│           └── settings/             # perfil + preferencias
├── features/
│   ├── (existentes)
│   ├── courses/            # 🆕
│   │   ├── actions/        # createCourse, addModule, addLesson, etc.
│   │   ├── components/     # CourseEditor, LessonCard, ModuleList, etc.
│   │   ├── schemas/        # courseSchema, lessonSchema, etc.
│   │   └── lib/            # progress.ts, prerequisites.ts
│   ├── assignments/        # 🆕
│   ├── gradebook/          # 🆕
│   ├── forum/              # 🆕
│   ├── messaging/          # 🆕
│   ├── notifications/      # 🆕
│   ├── gamification/       # 🆕
│   ├── certificates/       # 🆕
│   ├── live-sessions/      # 🆕
│   └── analytics/          # 🆕
├── shared/
│   ├── components/
│   │   ├── ui/             # ya existe
│   │   ├── layout/         # ya existe
│   │   ├── aula/           # 🆕 AulaShell, CourseSidebar, LessonNavigation
│   │   └── branding/       # ya existe
│   └── lib/
│       ├── prisma.ts       # ya existe
│       ├── aula-scoping.ts # 🆕 tenancy helpers para aula
│       └── ...
```

---

## 14. Riesgos y Mitigaciones de Ingeniería

| #   | Riesgo                                                           | Probabilidad | Impacto | Mitigación                                                                                                                            |
| --- | ---------------------------------------------------------------- | ------------ | ------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Scope creep** (querer agregar todo de golpe)                   | Alta         | Alto    | Roadmap por fases; cada fase = release independiente; no merge a main sin QA + smoke E2E                                              |
| 2   | **Degradación de performance por video streaming**               | Alta         | Alto    | Usar Mux/Cloudflare (no auto-hospedar transcoding); HLS adaptive; compresión al upload; cache CDN; jamás servir MP4 directo           |
| 3   | **Costos de almacenamiento descontrolados**                      | Media        | Alto    | Límites por plan; compresión automática en upload; cleanup job de archivos huérfanos; monitoreo semanal                               |
| 4   | **Deuda técnica en Prisma por extensión masiva**                 | Media        | Media   | Migraciones en commits pequeños y nombradas; revisar índices por cada tabla nueva; usar `prisma migrate diff` antes de mergear        |
| 5   | **Cookie cross-subdomain no funciona en Safari ITP**             | Media        | Alta    | Setear `SameSite=None; Secure` correctamente; fallback a `?token=` para Safari si persiste                                            |
| 6   | **Concurrencia en gradebook (race conditions)**                  | Alta         | Alta    | Postgres UPSERT + transacción; optimistic UI con detección de conflicto; revisión manual final                                        |
| 7   | **Reutilización de Exam mal mapeada a lecciones**                | Media        | Alta    | Contrato claro: `Lesson.examId` UNIQUE → enforce. Validar en UI antes de seleccionar examen                                           |
| 8   | **Proctoring actual insuficiente para examen rendido desde LMS** | Alta         | Alta    | Reusar motor de examen tal cual está (incluye ventana horaria + tab lock + IP); añadir cámara solo si usuario pide modo "alto riesgo" |
| 9   | **Subdominio aula.aulika.cl sin DNS wildcard**                   | Baja         | Media   | Configurar en Vercel + proveedor DNS en setup; documentar paso a paso                                                                 |
| 10  | **IA excede presupuesto**                                        | Media        | Alta    | Límite mensual por institución; usar IA solo cuando ROI claro; cachear respuestas; revisar costos semanalmente                        |
| 11  | **Archivos sensibles subidos por menores**                       | Media        | Crítica | Scan antivirus en upload (ClamAV o servicio); moderación de foros; guardar logs de acceso                                             |
| 12  | **Caída durante transmisión de video**                           | Baja         | Alta    | Reanudable desde donde quedó (HLS range requests); UI muestra "paquete perdido"                                                       |

---

## 15. Conclusión, Viabilidad y Posicionamiento de Mercado

### 15.1 Viabilidad técnica

**Veredicto:** SÍ, la base actual de Aulika es apta para evolucionar hacia un LMS.

**Por qué:**

1. Multi-tenant + RBAC + jerarquía académica chilena ya resueltos.
2. Motor de exámenes reusable vía FK `Lesson.examId`.
3. Schema de Prisma unificado, sin necesidad de migrar datos.
4. Deploy único en Vercel simplifica CI/CD.
5. TypeScript estricto en todo el código reduce regresiones.

**Por qué NO empezar de cero:**

- Costo de reconstruir RBAC + RUT + NextAuth + notas 1–7 ≈ **6 meses-hombre**.
- Migrar instituciones existentes (cursos ya creados en `Group`) implica mapear `Group → Course` (1:1) sin perder datos.

### 15.2 Posicionamiento de mercado

**Slogan propuesto:**

> **"Aulika — El aula virtual chilena, con la identidad que tu colegio ya usa."**

**Tagline extendido:**

> "Notas 1–7, RUT, Mineduc. La plataforma que entiende cómo funciona un colegio en Chile."

**Ventajas competitivas:**

- 🇬🇱🇨🇱 Primer LMS con RUT como identidad nativa (no retrofit).
- 🇨🇱 Gradebook 1–7 ya implementado, no es adaptación.
- 🏛️ Cumplimiento Decreto 678/2018 + Ley 21.719 desde el diseño.
- 💳 MercadoPago + boleta honorarios ya integrados.
- 🧪 Probar antes de pagar: `DemoLoginCard` ya permite probar como colegio demo sin registrar tarjeta.

**Tracción objetivo Year 1:** 50 instituciones, 2,500 estudiantes activos, MRR $1.5M CLP.

---

## 16. Decisiones Definitivas de Arquitectura

### 16.1 Tabla de usuarios única y compartida

✅ **DECIDIDO.** El mismo `User` que rinde exámenes es el estudiante del aula. Sin migraciones de usuario. Nueva data:

```ts
User {
  ... (actual)
  coursesTaught   CourseInstructor[]
  enrollments     Enrollment[]
  lessonProgress  LessonProgress[]
  submissions     Submission[]
}
```

**Implicancia:** Los actuales `User.role = ESTUDIANTE` automáticamente son estudiantes válidos del aula. No requiere cambio de rol.

---

### 16.2 Base de datos única, schema unificado

✅ **DECIDIDO.** Un solo PostgreSQL (`DATABASE_URL` actual), un solo `schema.prisma`. Las tablas actuales NO se renombran. Las nuevas tablas conviven:

- `Exam`, `Question`, `Result` → **sin cambios.**
- `Course`, `Module`, `Lesson`, etc. → **agregadas Fase 1.**

Reglas:

- Toda migración nueva → `pnpm db:migrate` local + `prisma migrate deploy` prod (regla existente).
- Índices revisados en cada tabla nueva.

---

### 16.3 Subdominio `aula.aulika.cl` apuntando al mismo Vercel

✅ **DECIDIDO.** Configuración DNS: `*.aulika.cl` → wildcard a Vercel.

#### Ejemplo de `src/proxy.ts` (Next.js 16 — sustituye `middleware.ts`)

```ts
// src/proxy.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
    const url = request.nextUrl;
    const host = request.headers.get('host') ?? '';

    // 🆕 AULA VIRTUAL: aula.aulika.cl y *.aula.aulika.cl → rewrite interno a /aula/*
    if (host.startsWith('aula.') || host === 'aula.aulika.cl') {
        const rewritten = url.clone();
        // Ya viene como /cursos o /dashboard; lo movemos a /aula/...
        if (rewritten.pathname === '/') {
            rewritten.pathname = '/aula';
        } else if (!rewritten.pathname.startsWith('/aula/')) {
            rewritten.pathname = `/aula${rewritten.pathname}`;
        }
        return NextResponse.rewrite(rewritten);
    }

    // Lógica existente (admin, examen, config):
    // ... (sin tocar)
    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for:
         * - api routes
         * - _next/static
         * - favicon.ico
         * - public files (con extensión)
         */
        '/((?!api|_next/static|_next/image|favicon.ico|.*\\.).*)',
    ],
};
```

#### Configuración de cookies cross-subdominio (`.aulika.cl`)

```ts
// al setear el JWT del estudiante:
const response = NextResponse.json({ ok: true });
response.cookies.set('aulika_session', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax', // 'none' si Safari ITP molesta
    domain: '.aulika.cl', // 🔑 permite compartir entre app.aulika.cl y aula.aulika.cl
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
});
return response;
```

**Y同理 para NextAuth (admin/profesor):** configurar `cookies.sessionToken` con `domain: '.aulika.cl'` en `src/features/auth/auth.ts`.

#### Vercel config necesario

```
# En Vercel Dashboard → Project → Settings → Domains
aula.aulika.cl → añadir como dominio
app.aulika.cl → dominio primario (actual)
config.aulika.cl → ya funciona (ya existía)

# DNS en proveedor (Cloudflare/Route53):
*.aulika.cl  CNAME  cname.vercel-dns.com
```

El subdominio `aula.` es opcional en code — `*.aulika.cl` cubre todo wildcard. Si querés reservar solo `aula.aulika.cl`, agregá ese CNAME puntual.

---

### 16.4 Flag de habilitación `aulaVirtualEnabled`

✅ **DECIDIDO.**

```prisma
model AcademicInstitution {
  // ... (existente)
  aulaVirtualEnabled Boolean @default(false)
}
```

#### Enforcement en tres capas

1. **Proxy (`src/proxy.ts`):**

    ```ts
    if (pathname.startsWith('/aula')) {
        const inst = await getInstitutionBySlug(cookieSlug);
        if (!inst?.aulaVirtualEnabled) {
            return NextResponse.redirect(new URL('/sin-acceso-aula', request.url));
        }
    }
    ```

2. **Páginas/Server Actions:** helper `requireAulaAccess()` en `src/shared/lib/aula-guard.ts`.

3. **UI:** menú del sidebar muestra sección "Aula Virtual" solo si flag activo.

---

### 16.5 Reutilización del motor de exámenes

✅ **DECIDIDO.**

#### Mapeo

```prisma
// src/prisma/schema.prisma
model Lesson {
  // ...
  type      LessonType   // puede ser EXAM
  examId    String?  @unique
  exam      Exam?     @relation(fields: [examId], references: [id])
}

enum LessonType {
  VIDEO
  PDF
  TEXT
  LINK
  QUIZ
  EXAM      // ← reutiliza el motor existente
  ASSIGNMENT
}
```

#### Flow del estudiante

```
[Lección tipo EXAM en el aula]
        ↓ click "Iniciar evaluación"
[Valida ventana horaria del Exam]
        ↓
[Crea/atacha ExamAttempt con la misma lógica actual]
        ↓
[El estudiante rinde en /examen/[examId] — RUTA YA EXISTENTE]
        ↓
[Al terminar, gradeAttempt guarda Result en la MISMA tabla]
        ↓
[Al volver al aula, LessonProgress.completed = true]
```

#### Reglas críticas

- **NO** crear `AulaExam` separado. **NO** duplicar `Result`. **NO** migrar tabla `Exam`.
- `Lesson.examId` debe ser **UNIQUE** (una lección no puede apuntar a dos exámenes).
- El examen publicado dentro de un curso hereda los `groups` ya configurados en ese examen, pero en el aula el `Enrollment` es la fuente de quién puede rendir.
- Validación en server action: `if (lesson.type === 'EXAM' && !lesson.examId) throw new Error('Lesson de tipo EXAM requiere examId')`.

---

### 16.6 Estrategia de pricing — dos suscripciones independientes

✅ **DECIDIDO.**

#### Modelo de SKUs

| SKU Aula Virtual       | Incluye Examen del mismo tier? |
| ---------------------- | ------------------------------ |
| Aula LMS Free          | Examen Free                    |
| Aula LMS Docente       | Examen Docente                 |
| Aula LMS Colegio       | Examen Colegio                 |
| Aula LMS Institucional | Examen Institucional           |

**Regla:** el plan de Aula Virtual incluye **por defecto acceso completo a Examen del mismo tier**. Suscripciones separadas en DB (modelo `Subscription` con `product: 'AULA' | 'EXAMEN'`), pero **un solo pago** se acreditará a ambos productos del mismo tier — el sistema valida que ambos estén activos.

#### Implementación sugerida en Prisma

```prisma
model Subscription {
  id             String @id @default(cuid())
  institutionId  String
  product        SubscriptionProduct   // 'AULA' | 'EXAMEN'
  tier           Plan                  // 'FREE' | 'DOCENTE' | 'COLEGIO' | 'INSTITUCIONAL'
  mpPreapprovalId String?
  status         String                // 'active' | 'cancelled' | etc.
  startsAt       DateTime
  endsAt         DateTime?
  createdAt      DateTime @default(now())
  @@unique([institutionId, product, tier])
}

enum SubscriptionProduct {
  AULA
  EXAMEN
}
```

#### Lógica de acceso

```ts
// src/features/subscriptions/lib/access.ts
export async function hasAulaAccess(institutionId: string): Promise<boolean> {
    const sub = await prisma.subscription.findFirst({
        where: {
            institutionId,
            product: 'AULA',
            status: 'active',
            OR: [{ endsAt: null }, { endsAt: { gt: new Date() } }],
        },
    });
    return !!sub;
}

// Examen: si el aula ya está activa, el examen del mismo tier está libre.
export async function hasExamenAccess(institutionId: string): Promise<boolean> {
    // Prioridad: suscripción EXAMEN propia
    const examSub = await prisma.subscription.findFirst({
        where: { institutionId, product: 'EXAMEN', status: 'active' /* ... */ },
    });
    if (examSub) return true;
    // Fallback: si tiene AULA activa, Examen incluido
    return await hasAulaAccess(institutionId);
}
```

#### Flujo de upgrade

- Admin va a `/[slug]/upgrade` → elige Aula Colegio.
- Webhook MP activa `Subscription(product=AULA, tier=COLEGIO)`.
- **Bonus automático:** activa también `Subscription(product=EXAMEN, tier=COLEGIO)` (mismo pago).
- UI muestra: "Tu plan Aula Colegio incluye Examen Colegio sin costo adicional."

#### Webhook — handler compartido

```ts
// src/app/api/webhooks/mercadopago/route.ts — EXISTENTE, ampliar:
if (payment.product === 'AULA') {
    await activateSubscription({ institutionId, product: 'AULA', tier: payment.tier });
    await activateSubscription({ institutionId, product: 'EXAMEN', tier: payment.tier });
}
```

---

## 17. Próximos pasos concretos

1. **Hoy (inmediato):** crear `.spool/02_inbox/max-aula-virtual.md` con la versión consolidada por Gemini (Opus si aplica).
2. **Semana 1:** revisión cruzada con stakeholders (product, ingeniería, comercial).
3. **Semana 2:** formalizar Fase 1 en `backlog.md` con tickets derivados.
4. **Semana 3:** kick-off Fase 1 — implementación módulos + lecciones + upload.
5. **Mes 2:** revisar métricas de adopción y ajustar roadmap.

---

> **FIN del documento.**
> Hash interno: `INV-2026-MAX-AULA-v0.1`
> Próxima acción programada: mover a `.spool/02_inbox/` para consolidación Gemini, luego a `03_work/` para ejecución Sonnet.
