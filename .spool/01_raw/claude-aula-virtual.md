# Aulika → Aula Virtual (LMS): Investigación Técnica y de Negocio + Roadmap Estratégico

> **Documento:** Plano de ingeniería (raw / Opus 4.8)
> **Producto:** Aulika — Sistema de Evaluación en Línea (mercado chileno)
> **Objetivo estratégico:** Evolucionar Aulika a un **Aula Virtual / LMS completo** sin romper producción ni duplicar datos.
> **Año:** 2026
> **Stack base:** Next.js 16 (App Router) · React 19 · TypeScript strict · PostgreSQL · Prisma 7 · NextAuth v5 + Jose · Vercel · `@ai-sdk/google` (Gemini) · MercadoPago

---

## Índice

1. [¿Qué es un Aula Virtual / LMS?](#1-qué-es-un-aula-virtual--lms)
2. [Cómo funciona un Aula Virtual](#2-cómo-funciona-un-aula-virtual)
3. [Arquitectura técnica](#3-arquitectura-técnica)
4. [Módulos fundamentales](#4-módulos-fundamentales)
5. [Principales plataformas del mercado](#5-principales-plataformas-del-mercado)
6. [Repositorios GitHub y librerías de referencia](#6-repositorios-github-y-librerías-de-referencia)
7. [Tendencias 2024–2026 en EdTech](#7-tendencias-20242026-en-edtech)
8. [Contexto latinoamericano y chileno](#8-contexto-latinoamericano-y-chileno)
9. [Modelos de negocio y monetización](#9-modelos-de-negocio-y-monetización)
10. [Aulika — Estado actual (análisis de entorno)](#10-aulika--estado-actual-análisis-de-entorno)
11. [Análisis GAP (brecha técnica)](#11-análisis-gap-brecha-técnica)
12. [Roadmap estratégico incremental (6 fases)](#12-roadmap-estratégico-incremental-6-fases)
13. [Stack técnico propuesto para la evolución](#13-stack-técnico-propuesto-para-la-evolución)
14. [Riesgos y mitigaciones de ingeniería](#14-riesgos-y-mitigaciones-de-ingeniería)
15. [Conclusión, viabilidad y posicionamiento de mercado](#15-conclusión-viabilidad-y-posicionamiento-de-mercado)
16. [Decisiones definitivas de arquitectura](#16-decisiones-definitivas-de-arquitectura)

---

## 1. ¿Qué es un Aula Virtual / LMS?

### Definición operativa y conceptual

Un **LMS (Learning Management System)** es una plataforma de software que **planifica, entrega, gestiona, evalúa y mide** procesos de aprendizaje de forma centralizada. A diferencia de una herramienta puntual (un corrector de exámenes, un repositorio de PDFs), un LMS modela el **ciclo de vida completo del aprendizaje**:

- **Entrega de contenido estructurado** (cursos → módulos → lecciones → actividades).
- **Gestión de inscripciones** (enrollment) y cohortes.
- **Evaluación** (formativa y sumativa) y **libro de calificaciones** (gradebook) ponderado.
- **Seguimiento de progreso** (completitud, tiempo, intentos, ruta).
- **Comunicación e interacción** (foros, mensajería, anuncios, video).
- **Analítica** (reportes por rol, alertas tempranas de deserción).
- **Certificación** (constancias verificables).

Conceptualmente, un LMS responde a tres preguntas que una herramienta de evaluación **no** responde por sí sola: *¿Qué debe aprender el estudiante?* (currículo), *¿cómo lo aprende?* (contenido + interacción) y *¿cómo demuestro que aprendió?* (evaluación + certificación). Aulika hoy resuelve sólo la tercera.

### Tabla comparativa: Aulika hoy vs. Aula Virtual completa

| Dimensión | **Aulika hoy (herramienta de evaluación)** | **Aula Virtual completa (LMS)** |
|---|---|---|
| **Unidad central** | Examen (`Exam`) | Curso (`Course` → `Module` → `Lesson`) |
| **Contenido didáctico** | ❌ No existe (solo preguntas) | ✅ Videos, documentos, texto enriquecido, SCORM/H5P |
| **Inscripción** | Implícita por grupo (`Group`) | ✅ Enrollment explícito con estados y fechas |
| **Progreso del alumno** | Solo intento de examen (`ExamAttempt`) | ✅ `LessonProgress`, % curso, racha, ruta |
| **Evaluación** | ✅ Exámenes con ventana horaria, anti-trampa, nota 1–7 | ✅ Exámenes **+ tareas con entrega de archivos + rúbricas** |
| **Calificación** | ✅ All-or-nothing por pregunta → `Result` | ✅ **Gradebook ponderado** (exámenes + tareas + participación) |
| **Comunicación** | ❌ | ✅ Foros anidados, anuncios, mensajería, notificaciones |
| **Sincronía** | Asíncrono puntual (rendir examen) | ✅ Asíncrono + Sincrónico (clases en vivo) + Blended/HyFlex |
| **Gamificación** | ❌ | ✅ Puntos, badges, rachas, leaderboards |
| **Certificación** | ❌ | ✅ PDF con QR verificable |
| **Analítica** | Resultados en vivo / finales por examen | ✅ Dashboards por rol + analítica predictiva de deserción |
| **Multi-tenant** | ✅ Por `slug` de institución | ✅ Igual + white-label opcional |
| **Roles** | SuperAdmin / Admin / Profesor / Estudiante | Mismos + matices (autor de contenido, moderador foro) |
| **Modelo de negocio** | 1 SaaS (planes Free/Docente/Colegio/Institucional) | **2 SaaS** (Exámenes ⊂ Aula Virtual) |

**Conclusión de la sección:** Aulika es hoy el **subsistema de evaluación** de lo que será un LMS. La evolución no es un reemplazo, es una **envoltura** que añade contenido, comunicación y certificación alrededor del motor de exámenes existente.

---

## 2. Cómo funciona un Aula Virtual

### Diagrama de flujo: Docente ↔ Plataforma ↔ Estudiante

```
        ┌──────────────────────────────────────────────────────────────────────┐
        │                          PLATAFORMA (Aula Virtual)                      │
        │                                                                          │
  DOCENTE                                                              ESTUDIANTE  │
  ───────                                                              ──────────  │
   │ 1. Crea curso ──────────►  [ Course / Module / Lesson ]                       │
   │ 2. Sube material ───────►  [ Storage: video, PDF, texto ]  ◄── 5. Consume ────┤  │
   │ 3. Publica tarea ───────►  [ Assignment ]  ──────────────►  6. Entrega ───────┤  │
   │                            [ Submission ]  ◄──────────────                     │  │
   │ 4. Crea examen ─────────►  [ Exam (motor Aulika actual) ] ◄─ 7. Rinde ─────────┤  │
   │                            [ Result / ExamAttempt ]                            │  │
   │ 8. Califica/rúbrica ◄───►  [ GradebookItem / Grade ]  ───►  9. Ve nota 1–7 ────┤  │
   │ 10. Modera foro ────────►  [ Forum / Thread / Post ]  ◄──── 11. Participa ─────┤  │
   │ 12. Lee analítica ◄─────►  [ Analytics / LessonProgress ]                      │  │
   │                            [ Notifications ] ─────────────►  13. Recibe avisos │  │
   │                            [ Certificate (PDF+QR) ] ──────►  14. Descarga ─────┤  │
        │                                                                          │
        └──────────────────────────────────────────────────────────────────────┘
                 ▲                                                    ▲
                 │  NextAuth v5 (JWT, admin/docente)                  │  Jose HS256 (cookie RUT, estudiante)
                 └────────────────────  AUTH  ──────────────────────┘
```

El **intercambio de datos** es bidireccional: el docente **produce** estructura y contenido; el estudiante **consume** y **produce evidencia** (entregas, respuestas, posts); la plataforma **persiste, califica y reporta**. El motor de exámenes actual (`Exam`/`Result`) queda como un **nodo más** del grafo, invocado cuando una lección es de tipo evaluación.

### Modalidades de aprendizaje y herramientas requeridas

| Modalidad | Definición | Herramientas requeridas |
|---|---|---|
| **Asincrónico** | El alumno aprende a su ritmo, sin coincidencia temporal con el docente. | Lecciones con video/documentos, foros, tareas con deadline, progreso persistido. |
| **Sincrónico** | Docente y alumnos coinciden en tiempo real. | Videoconferencia integrada, pizarrón colaborativo, chat en vivo, asistencia. |
| **Blended (semipresencial)** | Combina presencial + online; lo online complementa el aula física. | Repositorio de material, tareas, exámenes en línea, anuncios. |
| **HyFlex** | El alumno elige por sesión: presencial, sincrónico-remoto o asincrónico. | Grabación automática de clases en vivo, equivalencia de actividades en los 3 canales, asistencia flexible. |
| **Microlearning** | Unidades muy cortas (3–7 min) y autocontenidas, ideal mobile. | Lecciones atómicas, quizzes rápidos, push notifications, racha/gamificación, diseño mobile-first. |

> **Para Chile:** el predominio **mobile-first** y la conectividad intermitente hacen del **asincrónico + microlearning** la modalidad de mayor ROI inicial; el **sincrónico** (Fase 6) es valioso pero costoso y debe ser opcional.

---

## 3. Arquitectura técnica

### Diagrama conceptual multicapa (ASCII)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  CAPA DE PRESENTACIÓN (React 19 / Next.js App Router)                           │
│  · Server Components (render por defecto)   · Client Components ("use client") │
│  · /examen (estudiante)  · /[slug] (admin)  · /config (superadmin)             │
│  · NUEVO: /aula (LMS) servido en aula.aulika.cl vía rewrite                    │
└───────────────────────────────────────┬───────────────────────────────────────┘
                                         │  Server Actions  /  Route Handlers
┌───────────────────────────────────────▼───────────────────────────────────────┐
│  CAPA DE NEGOCIO (Domain-Driven Design, src/features/*)                         │
│  auth · students · groups · exams · exam-session · results · subscriptions     │
│  NUEVO: lms (courses · lessons · assignments · gradebook · forums · certs)     │
│  · Validación Zod  · Scoping/roles  · Auth-guard  · Reglas de negocio          │
└───────────────────────────────────────┬───────────────────────────────────────┘
                                         │  Prisma 7 (singleton)
┌───────────────────────────────────────▼───────────────────────────────────────┐
│  CAPA DE DATOS (PostgreSQL único + schema Prisma unificado)                     │
│  EXISTENTE: User · AcademicInstitution · Exam · Result · Group · CourseSection │
│  NUEVO (extensión): Course · Module · Lesson · LessonProgress · Assignment ·   │
│  Submission · Enrollment · Forum · Thread · Post · GradebookItem · Certificate │
└───────────────────────────────────────┬───────────────────────────────────────┘
                                         │
┌───────────────────────────────────────▼───────────────────────────────────────┐
│  SERVICIOS EXTERNOS                                                             │
│  Vercel Blob/S3 (archivos) · Mux/Cloudflare Stream (video) · Gemini (IA) ·     │
│  MercadoPago (pagos) · Brevo (email) · LiveKit/Daily (videoconf, Fase 6) ·     │
│  Resend/Web Push (notificaciones)                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Análisis de patrones arquitectónicos

| Patrón | Descripción | ¿Apto para Aulika/Next.js? |
|---|---|---|
| **Monolito modular** | Un solo deployable, organizado en módulos de dominio con fronteras claras. | ✅ **RECOMENDADO.** Es lo que Aulika ya hace con DDD (`src/features/*`). Cero overhead operacional, transacciones ACID nativas, un solo deploy en Vercel. |
| **Microservicios** | Servicios independientes por dominio, comunicados por red. | ❌ Sobre-ingeniería para el tamaño actual. Introduce latencia, consistencia eventual, DevOps complejo. No se justifica con un equipo pequeño. |
| **Serverless / Functions** | Cómputo efímero por request (Vercel Functions). | ✅ **Ya es el modelo de Vercel.** Server Actions y Route Handlers corren serverless. Ideal; cuidar cold starts y límites de payload para uploads grandes (usar uploads directos a blob). |
| **Event-Driven** | Componentes reaccionan a eventos (cola/bus). | ⚠️ **Selectivo.** Útil para gamificación (motor de puntos/badges), notificaciones y procesamiento de video (webhooks de Mux). Implementar como **eventos in-process + jobs/cron**, no un bus dedicado. |

**Dictamen:** **Monolito modular serverless** sobre Next.js, con **toques event-driven** (webhooks + cron de Vercel, ya usados para MercadoPago y demo-reset) para tareas asíncronas (transcoding de video, eventos de gamificación, notificaciones). Esto extiende el patrón actual sin reescritura.

---

## 4. Módulos fundamentales

### 4.1 Núcleo educativo (Core)

- **Gestión de cursos jerárquica** — `Course → Module → Lesson → Activity`. Una lección tiene un `type` (VIDEO, DOCUMENT, TEXT, EXAM, ASSIGNMENT, LIVE). Reordenamiento drag-and-drop (ya hay `@dnd-kit` instalado). *Implicancia:* árbol de contenido con `order` por nivel; render server-side; navegación "siguiente/anterior" con gating por progreso.
- **Roles y permisos jerárquicos** — reutilizar los 4 roles existentes (`SuperAdministrador`, `Administrador`, `Profesor`, `Estudiante`) + el scoping por institución/grupo/programa ya implementado (`src/shared/lib/scoping.ts`, `ProgramCoordinator`). *Implicancia:* el LMS **no introduce un nuevo sistema de permisos**, hereda el de Aulika. Profesor acotado a sus cursos/grupos.
- **Banco de preguntas con anti-trampa** — **ya existe** (`BankQuestion`/`BankOption`, clonado a `Question` al usar; `antiCheatEnabled`, `lockTabSwitch`, `uniqueIp`, `randomizeQuestions`, `TabSwitchEvent`). *Implicancia:* la lección tipo examen reutiliza todo esto vía `examId` (ver §16.5).
- **Libro de calificaciones (Gradebook)** — `GradebookItem` por curso (examen, tarea, participación) con `weight` (ponderación). Nota final = Σ(nota_item × peso) normalizada a escala 1–7. *Implicancia:* el cálculo de notas determinista (sin IA) se preserva; el gradebook **agrega** la capa de ponderación que hoy no existe (hoy cada `Result` es independiente).

### 4.2 Comunicación e interacción

- **Foros anidados** — `Forum` (por curso/ramo) → `Thread` → `Post` (con `parentId` para respuestas anidadas). Moderación por docente. *Implicancia:* árbol auto-referencial; paginación; notificaciones en nuevas respuestas; markdown/rich-text sanitizado.
- **Mensajería** — directa (1:1) y por cohorte. *Implicancia:* `Message`/`Conversation`; entrega in-app + email (Brevo ya integrado). MVP: anuncios broadcast antes que mensajería 1:1.
- **Videoconferencia** — **integración**, no construcción propia. LiveKit/Daily/Jitsi embebido. *Implicancia:* es la pieza más cara y se deja para Fase 6, opcional y por plan superior.

### 4.3 Analítica, gamificación y administración

- **Dashboards por rol** — extender los dashboards actuales: alumno (mi progreso, mis notas, próximas entregas), docente (avance de cohorte, entregas pendientes de corregir), admin (uso por curso/institución). *Implicancia:* queries agregadas con índices; reutilizar `stat-tile`/`AdminTopBar`.
- **Analítica predictiva de deserción** — señales: inactividad (días sin login), baja completitud, notas en descenso, entregas atrasadas. MVP heurístico (reglas) → fase posterior con IA (Gemini). *Implicancia:* job/cron que computa "riesgo" y alerta al docente.
- **Gamificación** — puntos por completar lecciones/entregar a tiempo, badges por hitos, rachas (días consecutivos). *Implicancia:* **motor de eventos** (`GamificationEvent`) que reacciona a acciones; idempotente; configurable por institución.
- **Multi-tenant / White-label** — multi-tenant **ya existe** (slug). White-label = logo/colores/dominio propio por institución. *Implicancia:* tema dinámico por tenant (CSS variables, ya usado en el proyecto); habilitación por plan.

---

## 5. Principales plataformas del mercado

### Open Source (gigantes)

| Plataforma | Stack técnico | Fortalezas | Debilidades | Infraestructura |
|---|---|---|---|---|
| **Moodle** | PHP + MySQL/PostgreSQL/MariaDB; tema Mustache; plugins PHP | Madurez extrema, +20 años, ecosistema de plugins masivo, estándar de facto en universidades, SCORM/LTI, gratuito | UX anticuada, mobile-first débil, monolito PHP pesado, mantenimiento operacional alto, "feo" para colegios | Servidor LAMP propio o Moodle Cloud; requiere DBA y sysadmin |
| **Canvas LMS** | Ruby on Rails + PostgreSQL; frontend React; Redis | UI moderna, excelente API REST/GraphQL, fuerte en educación superior, SpeedGrader, app móvil sólida | Pesado de auto-hospedar (Rails + servicios), curva de despliegue alta, orientado a grandes instituciones | Multi-servicio (Rails, Postgres, Redis, Canvabadges…); normalmente SaaS (Instructure) |
| **Open edX** | Python/Django + MySQL + MongoDB + Node; microservicios (Tutor/Docker) | Escala MOOC masiva, contenido estructurado (XBlocks), analítica avanzada, usado por edX/MIT | Complejidad de despliegue muy alta (varios servicios), overkill para colegios, requiere equipo dedicado | Kubernetes/Docker (Tutor); pesado en recursos |

### SaaS comerciales

| Plataforma | Enfoque | Pricing aprox. | Notas |
|---|---|---|---|
| **TalentLMS** | Corporate training, PYMEs | Por usuario activo/mes | Setup rápido, gamificación nativa |
| **Teachable** | Creadores / cursos individuales | % de ventas + mensualidad | Foco en monetizar cursos, no en colegios |
| **Thinkific** | Creadores / negocios de cursos | Plano mensual | Similar a Teachable, sin transaction fees en planes altos |
| **Kajabi** | Creadores + marketing all-in-one | Premium ($$$) | Incluye email marketing, funnels, no académico |
| **Google Classroom** | Colegios (K-12) | Gratis (Workspace for Education) | **Competidor directo en Chile**; simple, pero no es un LMS completo ni tiene evaluación robusta ni notas 1–7 nativas |

### Nueva generación LMS en JavaScript/TypeScript

- **LearnHouse** — Next.js + FastAPI/Python; moderno, open source, orientado a organizaciones; editor de contenido tipo Notion.
- **ClassroomIO** — SvelteKit + Supabase; open source; foco en bootcamps/cursos; multi-tenant.
- **Frigade / Curio / otros** — micro-LMS embebibles.

> **Relevancia para Aulika:** la nueva generación valida que **un LMS moderno en TS/React/Postgres es viable y competitivo**. Aulika parte con ventaja: ya tiene multi-tenant, evaluación robusta y contexto chileno (RUT, notas 1–7) que ninguno de estos resuelve nativamente.

---

## 6. Repositorios GitHub y librerías de referencia

### Repositorios open source para estudiar lógica

| Repo | URL | Qué estudiar |
|---|---|---|
| **moodle/moodle** | github.com/moodle/moodle | Modelo de gradebook ponderado, completion tracking, roles/capabilities |
| **instructure/canvas-lms** | github.com/instructure/canvas-lms | API design, SpeedGrader (corrección), assignments + rubrics |
| **openedx/edx-platform** | github.com/openedx/edx-platform | XBlocks (contenido modular), analítica de aprendizaje |
| **learnhouse/learnhouse** | github.com/learnhouse/learnhouse | LMS Next.js moderno, estructura de cursos, editor |
| **classroomio/classroomio** | github.com/classroomio/classroomio | Multi-tenant, modelo de datos curso/lección en Postgres |

### Librerías npm / servicios externos idóneos

| Necesidad | Opción recomendada | Alternativas | Nota |
|---|---|---|---|
| **Editor Rich Text** | **Tiptap** (ProseMirror, React) | Lexical (Meta), Plate, BlockNote | Tiptap = headless, extensible, JSON serializable; ideal para lecciones y foros |
| **Video streaming (CDN)** | **Mux** (`@mux/mux-node`, `@mux/mux-player-react`) | Cloudflare Stream, Bunny Stream, api.video | Transcoding adaptativo (HLS), webhooks de "ready", analytics; no servir video desde Vercel |
| **Almacenamiento de archivos** | **Vercel Blob** (`@vercel/blob`) | AWS S3 (`@aws-sdk/client-s3`), Cloudflare R2 | Uploads directos cliente→blob (evita límite de payload serverless); R2 sin egress fees para escala |
| **Pizarrón colaborativo** | **tldraw** (`@tldraw/tldraw`) | Excalidraw (`@excalidraw/excalidraw` — ya en ecosistema), Liveblocks para colab realtime | tldraw + Liveblocks/Yjs para multiusuario |
| **Generación de PDF (certificados)** | **@react-pdf/renderer** | Puppeteer (server), pdf-lib, jsPDF | React-PDF = declarativo, server-side; para QR usar `qrcode` |
| **QR verificable** | **qrcode** + endpoint de verificación | — | QR apunta a `aula.aulika.cl/verificar/{certId}` |
| **Videoconferencia integrada** | **LiveKit** (`@livekit/components-react`) | Daily (`@daily-co/daily-js`), Jitsi (embed gratis) | LiveKit open source self-host o cloud; Jitsi = MVP gratis |
| **Notificaciones in-app/push** | **Novu** (open source) o Web Push nativo | Knock, Resend (email) | Brevo ya cubre email transaccional |
| **Realtime (foros/notif live)** | **Pusher** / **Ably** / **Supabase Realtime** | SSE nativo de Next.js | Para MVP, polling + revalidate alcanza |

---

## 7. Tendencias 2024–2026 en EdTech

### IA como infraestructura central

La IA dejó de ser un "feature" para ser **capa transversal**:

- **Rutas de aprendizaje adaptativas** — el contenido se reordena según desempeño (refuerzo donde el alumno falla). Aulika ya tiene `difficulty` en preguntas → base para adaptatividad.
- **Proctoring con IA** — detección de comportamiento anómalo (mirada, múltiples rostros, audio). Aulika tiene proctoring básico (tab-switch, IP única); la IA es el siguiente nivel (caro y sensible a privacidad — ver §8 Mineduc).
- **Transcripción y subtítulos** — clases en vivo/grabadas transcritas automáticamente (accesibilidad + búsqueda). Gemini/Whisper.
- **Evaluación de ensayos / respuestas abiertas** — IA asiste en corrección de texto libre (**con supervisión humana obligatoria** — la política legal de Aulika ya prohíbe que la IA califique sola).
- **Generación de contenido** — Aulika ya usa Gemini (`@ai-sdk/google`) para generar preguntas; extensible a resúmenes de lecciones, flashcards, quizzes automáticos.

> **Principio rector (alineado a la política legal de Aulika):** IA = **asistente**, nunca **juez**. La calificación final es matemática y determinista; la IA sugiere, el humano decide.

### Credenciales digitales verificables (QR / Blockchain)

- **Certificados con QR** — cada certificado lleva un QR que apunta a un endpoint de verificación pública. **Suficiente para el 95% de los casos** y de bajo costo. → Implementar en Fase 5.
- **Open Badges / Verifiable Credentials (W3C)** — estándar de credenciales portables entre plataformas.
- **Blockchain** — anclaje inmutable del hash del certificado. **Alto costo/complejidad, bajo ROI** para colegios chilenos hoy. Marcar como "Moderada/Futura". El QR + registro en DB cubre la necesidad real de antifraude.

---

## 8. Contexto latinoamericano y chileno

### Desafíos regionales

- **Conectividad heterogénea** — zonas rurales (Chiloé, sur austral) con internet intermitente. → Diseño tolerante: contenido descargable, autosave agresivo, reanudación de sesión (Aulika ya reanuda intentos con `ExamAttempt`).
- **Mobile-first** — gran parte de estudiantes accede **solo por celular**. → UI responsive obligatoria, microlearning, video ligero adaptativo.
- **Brecha digital** — alfabetización digital desigual entre docentes. → UX simple, onboarding/tour guiado (Aulika ya tiene Driver.js), defaults sensatos.

### Adaptación al ecosistema chileno

- **Sistema de notas 1,0–7,0** — **ya implementado** en Aulika (`maxGrade`, `passingGrade`, escala 60% aprobación). El gradebook ponderado debe respetar esta escala. Ninguna plataforma extranjera lo hace nativamente.
- **Validación de identidad por RUT** — **ya implementado** (login estudiante por RUT, validación de dígito verificador, `@/shared/lib/rut.ts`). Diferenciador clave.
- **Regulaciones Mineduc** — Decreto Exento Nº 678/2018 (protección de datos escolares), Ley 19.628 + Ley 21.719 (datos personales). Aulika ya tiene marco legal cubierto (políticas, encargado/responsable del tratamiento). El LMS añade más datos sensibles (interacciones, contenido del alumno) → reforzar consentimiento y retención.
- **Competencia local** — Google Classroom (gratis, dominante en colegios pero limitado), Canvas/Blackboard (universidades, caro y extranjero), Moodle (universidades, técnico). **Hueco de mercado:** un LMS **nativo chileno, mobile-first, con RUT + notas 1–7 + evaluación robusta + precio en CLP**, para **colegios y liceos** (no solo universidades).

> **Oportunidad:** ser el **"Google Classroom chileno con dientes de evaluación"** — la simplicidad de Classroom + la robustez evaluativa de Moodle + adaptación local total.

---

## 9. Modelos de negocio y monetización

### Modelos posibles

| Modelo | Descripción | Aplicabilidad a Aulika |
|---|---|---|
| **Por asiento (per-seat)** | Precio por estudiante/usuario activo. | ⚠️ Penaliza colegios grandes; difícil de presupuestar para directores. |
| **Por uso (usage-based)** | Precio por examen rendido, GB de video, etc. | ⚠️ Impredecible; mejor para overage, no como base. |
| **Freemium** | Tier gratis con límites; pago para escalar. | ✅ **Ya es el modelo de Aulika** (plan FREE). Excelente para adopción docente individual. |
| **Institucional (flat/tiered)** | Cuota fija por institución según tamaño/features. | ✅ **Recomendado** para colegios; presupuestable, B2B. |

**Estrategia recomendada:** **Freemium + Institucional por tiers** (lo que Aulika ya hace), extendido al Aula Virtual con **dos líneas de producto** (ver §16.6).

### Propuesta de estructura de precios

> Reutiliza el enum `Plan` existente (`FREE`, `DOCENTE`, `COLEGIO`, `INSTITUCIONAL`) y `PlanLimits`/`CustomPlan`. Se añade una **dimensión Aula Virtual**.

| Plan | Público | Exámenes (SaaS actual) | Aula Virtual (nuevo) | Límites ejemplo |
|---|---|---|---|---|
| **FREE** | Docente individual / prueba | ✅ básico | ❌ (o demo) | 1 grupo, 30 alumnos, exámenes limitados |
| **DOCENTE** | Profesor que paga | ✅ completo | ⚠️ 1 curso | 100 alumnos, almacenamiento básico |
| **COLEGIO** | Colegio/liceo | ✅ completo | ✅ completo (incluye exámenes) | N grupos, video con cuota, foros, certificados |
| **INSTITUCIONAL** | Universidad/red | ✅ completo | ✅ completo + white-label + video alto + soporte | A medida (`CustomPlan`) |

**Regla de oro (§16.6):** *suscribirse al Aula Virtual de un tier incluye automáticamente los Exámenes de ese tier* (Aula Virtual ⊃ Exámenes). Pero **se pueden vender por separado** (un colegio puede querer solo exámenes).

---

## 10. Aulika — Estado actual (análisis de entorno)

### Lo que Aulika YA tiene (verificado contra el código)

| Capacidad | Implementación real |
|---|---|
| **Multi-tenant por slug** | `AcademicInstitution.slug` único; proxy enruta `/[slug]/*` |
| **Roles definidos** | `UserRole` (4 roles) + scoping por grupo/programa (`ProgramCoordinator`, `scoping.ts`) |
| **Jerarquía académica chilena** | `Program` (Carrera/Nivel) · `AcademicPeriod` (Semestre/Año) · `CourseSection` (Ramo/Asignatura) · `Group`; labels dinámicos por `InstitutionType` |
| **Banco de exámenes** | `BankQuestion`/`BankOption` reutilizable por institución, clonado a `Question`/`Option` |
| **Ventana horaria** | `Exam.scheduledAt` / `closesAt`; gating en `startSelectedExam` |
| **Proctoring básico** | `antiCheatEnabled`, `lockTabSwitch`, `uniqueIp`, `randomizeQuestions`, `TabSwitchEvent` |
| **Notas 1–7** | `maxGrade`, `passingGrade`, `passingPercentage`; corrección all-or-nothing → `Result` |
| **Reanudación de intento** | `ExamAttempt` (startedAt/endsAt), auto-entrega al vencer |
| **Login por RUT (estudiante)** | Jose HS256, cookie propia, validación de DV |
| **NextAuth (admin/docente)** | NextAuth v5 beta.25, Credentials + JWT, `institutionSlug` en token |
| **Suscripciones/pagos** | `Subscription`/`Payment`/`Plan`/`PlanLimits`/`CustomPlan` + MercadoPago (preapproval) |
| **IA para preguntas** | `@ai-sdk/google` (Gemini) |
| **Auditoría** | `AuditLog` |
| **Modo demo público** | Institución `aulika-demo`, aislamiento por `demoSessionId`, limpieza por sesión/cron |
| **SEO + legal** | Sitemap, JSON-LD, robots, páginas legales (Ley 19.628/21.719, Mineduc) |

### Lo que le FALTA para ser un LMS

| Falta | Impacto |
|---|---|
| **Materiales/contenido didáctico** | ❌ No hay cursos, módulos ni lecciones — **lo más crítico** |
| **Streaming de video** | ❌ No hay pipeline de video |
| **Upload de archivos** | ❌ No hay storage de documentos |
| **Tareas con entrega** | ❌ Solo exámenes de opción múltiple, sin entrega de archivos |
| **Gradebook ponderado** | ❌ Cada `Result` es independiente; no hay nota de curso ponderada |
| **Foros / comunicación** | ❌ Sin foros, mensajería ni anuncios |
| **Notificaciones** | ❌ Sin sistema in-app |
| **Certificados** | ❌ Sin generación de constancias |
| **Inscripción explícita (enrollment)** | ⚠️ Implícita por grupo; falta enrollment a curso |
| **Gamificación / analítica de progreso** | ❌ Sin puntos/badges ni `LessonProgress` |

---

## 11. Análisis GAP (brecha técnica)

```
                       AULIKA HOY                 AULA VIRTUAL (LMS)
                  ┌──────────────────┐        ┌──────────────────────┐
  EVALUACIÓN      │ ████████████ 100%│  ───►  │ ████████████ + tareas │   ✅ base sólida
  AUTH/ROLES      │ ████████████ 100%│  ───►  │ ████████████ reutiliza│   ✅ reutilizable
  MULTI-TENANT    │ ████████████ 100%│  ───►  │ ████████████ + w-label│   ✅ reutilizable
  JERARQUÍA ACAD. │ ████████████ 100%│  ───►  │ ████████████ + cursos │   ✅ reutilizable
  PAGOS/PLANES    │ ████████████ 100%│  ───►  │ ████████░░░░ + 2ª línea│   ⚠️ extender
  ─────────────────────────────────────────────────────────────────────
  CONTENIDO       │ ░░░░░░░░░░░░   0%│  ───►  │ ████████████ requerido│   🔴 CRÍTICO
  VIDEO/STORAGE   │ ░░░░░░░░░░░░   0%│  ───►  │ ████████████ requerido│   🔴 CRÍTICO
  GRADEBOOK POND. │ ░░░░░░░░░░░░   0%│  ───►  │ ████████████ requerido│   🔴 CRÍTICO
  TAREAS/ENTREGAS │ ░░░░░░░░░░░░   0%│  ───►  │ ████████████ requerido│   🟠 IMPORTANTE
  FOROS/COMUNIC.  │ ░░░░░░░░░░░░   0%│  ───►  │ ████████████ requerido│   🟠 IMPORTANTE
  NOTIFICACIONES  │ ░░░░░░░░░░░░   0%│  ───►  │ ████████████ requerido│   🟠 IMPORTANTE
  GAMIFICACIÓN    │ ░░░░░░░░░░░░   0%│  ───►  │ ████████░░░░ deseable  │   🟡 MODERADA
  CERTIFICADOS    │ ░░░░░░░░░░░░   0%│  ───►  │ ████████░░░░ deseable  │   🟡 MODERADA
  ANALÍTICA PRED. │ ░░░░░░░░░░░░   0%│  ───►  │ ██████░░░░░░ futura    │   🟡 MODERADA
  CLASES EN VIVO  │ ░░░░░░░░░░░░   0%│  ───►  │ ██████░░░░░░ futura/opt│   🟡 MODERADA
```

### Clasificación de brechas

| Prioridad | Brechas | Justificación |
|---|---|---|
| 🔴 **Críticas** | Contenido (cursos/módulos/lecciones), Video/Storage, Gradebook ponderado | Sin esto **no es un LMS**. Son el corazón de la propuesta de valor. |
| 🟠 **Importantes** | Tareas con entrega, Foros, Notificaciones, Enrollment | Diferenciadores de engagement; esperables en un LMS serio. |
| 🟡 **Moderadas/Futuras** | Gamificación, Certificados, Analítica predictiva, Clases en vivo, White-label, Blockchain | Alto valor percibido pero no bloquean el lanzamiento; iterables post-MVP. |

---

## 12. Roadmap estratégico incremental (6 fases)

> **Principio rector:** *No romper lo que ya funciona en producción.* Cada fase es **aditiva** (nuevas tablas, nuevas rutas bajo `/aula`), nunca destructiva. Las migraciones Prisma sólo **agregan** columnas/tablas nullable. Flag `aulaVirtualEnabled` controla la exposición.

### Fase 1 — Fundamentos de curso
**Objetivo:** estructura de contenido + entrega de material.
- Modelos: `Course`, `Module`, `Lesson`, `Enrollment`, `LessonProgress`.
- Upload de archivos (Vercel Blob) + streaming de video nativo (Mux/Cloudflare Stream).
- Rutas `/aula` (subdominio `aula.aulika.cl`), navegación curso→módulo→lección.
- Reutiliza: roles, scoping, multi-tenant, jerarquía académica (`CourseSection` ↔ `Course`).
- **Entregable:** un docente publica un curso con videos/PDFs; el alumno lo consume y se trackea progreso.

### Fase 2 — Evaluaciones enriquecidas
**Objetivo:** tareas + libro de calificaciones.
- Modelos: `Assignment`, `Submission` (con archivos), `GradebookItem`, `Grade`.
- Lección tipo examen → FK `examId` al **motor existente** (rinde y guarda `Result` actual — §16.5).
- Gradebook con ponderaciones configurables, nota final 1–7.
- **Entregable:** docente crea tareas y exámenes dentro del curso; nota final ponderada visible al alumno.

### Fase 3 — Comunicación y comunidad
**Objetivo:** interacción.
- Modelos: `Forum`, `Thread`, `Post` (anidados), `Announcement`, `Notification`.
- Notificaciones in-app + email (Brevo).
- **Entregable:** foros por ramo, anuncios del docente, alumno recibe avisos de notas/entregas.

### Fase 4 — Gamificación y motivación
**Objetivo:** engagement.
- Modelos: `GamificationEvent`, `Badge`, `UserBadge`, `PointsLedger`, `Streak`.
- Motor de eventos in-process (reacciona a completar lección, entregar a tiempo, aprobar).
- **Entregable:** puntos, badges y rachas visibles; leaderboard opcional por curso.

### Fase 5 — Certificados y analítica avanzada
**Objetivo:** valor de salida + insights.
- Modelos: `Certificate` (con `verificationCode`), `RiskScore`.
- PDF con `@react-pdf/renderer` + QR verificable (`aula.aulika.cl/verificar/{code}`).
- IA (Gemini) para resúmenes de lecciones y señales de deserción.
- **Entregable:** certificado descargable verificable + alerta de riesgo al docente.

### Fase 6 — Clases en vivo
**Objetivo:** sincronía (opcional, plan superior).
- Integración videoconferencia (LiveKit/Daily/Jitsi) + pizarrón (tldraw + Liveblocks).
- Modelos: `LiveSession`, `Attendance`.
- **Entregable:** sesión en vivo agendada, grabada (HyFlex), con asistencia.

```
Fase 1 ──► Fase 2 ──► Fase 3 ──► Fase 4 ──► Fase 5 ──► Fase 6
Contenido  Tareas+    Foros+     Gamific.   Certs+     Clases
+Video     Gradebook  Notif.                Analítica  en vivo
[CRÍTICO]  [CRÍTICO]  [IMPORT.]  [MODER.]   [MODER.]   [FUTURO/OPT]
```

---

## 13. Stack técnico propuesto para la evolución

### Dependencias npm sugeridas (sin duplicar lo ya instalado)

> Ya instalado y reutilizable: `@ai-sdk/google` (IA), `@dnd-kit/*` (reorden), `framer-motion`, `zod`, `react-hook-form`, `mercadopago`, `jose`, `xlsx`, `radix-ui`, `sonner`.

| Necesidad | Paquete nuevo | Fase |
|---|---|---|
| Editor rich text | `@tiptap/react` `@tiptap/starter-kit` | 1 |
| Almacenamiento archivos | `@vercel/blob` (o `@aws-sdk/client-s3` para R2/S3) | 1 |
| Video | `@mux/mux-node` `@mux/mux-player-react` | 1 |
| Sanitización HTML | `sanitize-html` (o `isomorphic-dompurify`) | 3 |
| PDF certificados | `@react-pdf/renderer` | 5 |
| QR | `qrcode` | 5 |
| Videoconferencia | `@livekit/components-react` `livekit-client` (o `@daily-co/daily-js`) | 6 |
| Pizarrón | `@tldraw/tldraw` (+ `@liveblocks/client` para colab) | 6 |
| Notificaciones realtime (opcional) | `pusher`/`pusher-js` o `ably` | 3 |

### Extensión del schema de Prisma (código)

> **Regla:** las tablas existentes **no se tocan**; sólo se **extienden** con relaciones nuevas y se agregan modelos. Todo lo nuevo cuelga del `User`, `AcademicInstitution`, `Exam`, `Result` y `CourseSection` **existentes**. FK nullable donde aplique para no romper datos previos.

```prisma
// ─── LMS · Enums ─────────────────────────────────────────────────────────────
enum LessonType {
  VIDEO
  DOCUMENTO
  TEXTO
  EXAMEN        // mapea al motor de exámenes existente vía examId
  TAREA
  EN_VIVO
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
}

// ─── LMS · Núcleo de contenido ───────────────────────────────────────────────
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
  certificates          Certificate[]
  createdAt             DateTime            @default(now())
  updatedAt             DateTime            @updatedAt

  @@index([academicInstitutionId])
  @@index([courseSectionId])
  @@index([published])
}

model Module {
  id        String   @id @default(uuid()) @db.Uuid
  title     String
  order     Int      @default(0)
  courseId  String   @db.Uuid
  course    Course   @relation(fields: [courseId], references: [id], onDelete: Cascade)
  lessons   Lesson[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([courseId])
}

model Lesson {
  id            String           @id @default(uuid()) @db.Uuid
  title         String
  type          LessonType       @default(TEXTO)
  order         Int              @default(0)
  // Contenido según type:
  contentJson   Json?            // texto enriquecido (Tiptap)
  videoAssetId  String?          // id del asset en Mux/Cloudflare
  fileUrl       String?          // documento en Blob/S3
  durationSec   Int?
  // REUTILIZACIÓN DEL MOTOR DE EXÁMENES (§16.5):
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
  lastSeenSec Int?     // posición de reproducción de video
  completedAt DateTime?
  updatedAt   DateTime @updatedAt

  @@unique([userId, lessonId])
  @@index([lessonId])
}

// ─── LMS · Tareas y entregas ─────────────────────────────────────────────────
model Assignment {
  id          String       @id @default(uuid()) @db.Uuid
  lessonId    String       @unique @db.Uuid
  lesson      Lesson       @relation(fields: [lessonId], references: [id], onDelete: Cascade)
  instructions String?
  dueAt       DateTime?
  maxScore    Int          @default(100)
  submissions Submission[]
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
}

model Submission {
  id           String           @id @default(uuid()) @db.Uuid
  assignmentId String           @db.Uuid
  assignment   Assignment       @relation(fields: [assignmentId], references: [id], onDelete: Cascade)
  studentId    String           @db.Uuid
  student      User             @relation(fields: [studentId], references: [id], onDelete: Cascade)
  fileUrl      String?
  textContent  String?
  status       SubmissionStatus @default(PENDIENTE)
  score        Float?           // lo asigna el docente (humano), escala del assignment
  feedback     String?
  submittedAt  DateTime?
  gradedAt     DateTime?
  createdAt    DateTime         @default(now())
  updatedAt    DateTime         @updatedAt

  @@unique([assignmentId, studentId])
  @@index([studentId])
}

// ─── LMS · Libro de calificaciones (ponderado, escala 1–7) ───────────────────
model GradebookItem {
  id        String            @id @default(uuid()) @db.Uuid
  courseId  String            @db.Uuid
  course    Course            @relation(fields: [courseId], references: [id], onDelete: Cascade)
  title     String
  type      GradebookItemType
  weight    Float             @default(1) // peso relativo en la nota final
  // Origen de la nota (uno u otro):
  examId    String?           @db.Uuid    // → Result existente
  exam      Exam?             @relation(fields: [examId], references: [id], onDelete: SetNull)
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
  value           Float         // nota 1.0–7.0 (determinista, sin IA)
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  @@unique([gradebookItemId, studentId])
  @@index([studentId])
}

// ─── LMS · Foros y comunicación ──────────────────────────────────────────────
model Forum {
  id        String   @id @default(uuid()) @db.Uuid
  courseId  String   @db.Uuid
  course    Course   @relation(fields: [courseId], references: [id], onDelete: Cascade)
  title     String
  threads   Thread[]
  createdAt DateTime @default(now())

  @@index([courseId])
}

model Thread {
  id        String   @id @default(uuid()) @db.Uuid
  forumId   String   @db.Uuid
  forum     Forum    @relation(fields: [forumId], references: [id], onDelete: Cascade)
  title     String
  authorId  String?  @db.Uuid
  author    User?    @relation(fields: [authorId], references: [id], onDelete: SetNull)
  posts     Post[]
  createdAt DateTime @default(now())

  @@index([forumId])
}

model Post {
  id        String   @id @default(uuid()) @db.Uuid
  threadId  String   @db.Uuid
  thread    Thread   @relation(fields: [threadId], references: [id], onDelete: Cascade)
  authorId  String?  @db.Uuid
  author    User?    @relation(fields: [authorId], references: [id], onDelete: SetNull)
  // Anidamiento (respuestas a respuestas)
  parentId  String?  @db.Uuid
  parent    Post?    @relation("PostReplies", fields: [parentId], references: [id], onDelete: Cascade)
  replies   Post[]   @relation("PostReplies")
  content   String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([threadId])
  @@index([parentId])
}

model Notification {
  id        String   @id @default(uuid()) @db.Uuid
  userId    String   @db.Uuid
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  type      String   // 'grade' | 'announcement' | 'forum_reply' | 'due_soon' ...
  title     String
  body      String?
  link      String?
  read      Boolean  @default(false)
  createdAt DateTime @default(now())

  @@index([userId, read])
}

// ─── LMS · Certificados verificables ─────────────────────────────────────────
model Certificate {
  id               String   @id @default(uuid()) @db.Uuid
  courseId         String   @db.Uuid
  course           Course   @relation(fields: [courseId], references: [id], onDelete: Cascade)
  studentId        String   @db.Uuid
  student          User     @relation(fields: [studentId], references: [id], onDelete: Cascade)
  verificationCode String   @unique // codifica el QR público
  finalGrade       Float
  issuedAt         DateTime @default(now())

  @@unique([courseId, studentId])
  @@index([verificationCode])
}
```

> **Relaciones inversas a agregar en modelos existentes** (sólo nuevas líneas, sin tocar campos previos): en `User` → `enrollments Enrollment[]`, `lessonProgress LessonProgress[]`, `submissions Submission[]`, `grades Grade[]`, `notifications Notification[]`, `createdCourses Course[] @relation("CourseCreatedBy")`, `threads Thread[]`, `posts Post[]`, `certificates Certificate[]`. En `AcademicInstitution` → `courses Course[]` + campo `aulaVirtualEnabled Boolean @default(false)` (§16.4). En `Exam` → `lessons Lesson[]` + `gradebookItems GradebookItem[]`. En `CourseSection` → `courses Course[]`.

### Estructura de carpetas (Next.js App Router)

```
src/
├── app/
│   ├── (aula)/                      ← NUEVO grupo de rutas del LMS (servido en aula.aulika.cl)
│   │   └── aula/
│   │       ├── page.tsx             → /aula  (mis cursos)
│   │       ├── cursos/[courseId]/
│   │       │   ├── page.tsx         → temario del curso
│   │       │   └── lecciones/[lessonId]/page.tsx
│   │       ├── tareas/[assignmentId]/page.tsx
│   │       ├── foros/[forumId]/page.tsx
│   │       ├── calificaciones/page.tsx
│   │       └── (admin)/[slug]/courses/...   → gestión docente de cursos
│   │   └── verificar/[code]/page.tsx        → verificación pública de certificado
│   └── ... (rutas existentes intactas)
├── features/
│   └── lms/                         ← NUEVO dominio DDD
│       ├── courses/    (actions, components, schemas, lib)
│       ├── lessons/
│       ├── assignments/
│       ├── gradebook/  (lib/grade-weighted.ts — reutiliza results/lib/grade)
│       ├── forums/
│       ├── notifications/
│       └── certificates/
└── shared/
    └── lib/
        ├── blob.ts                  ← wrapper de upload (Vercel Blob/S3)
        └── video.ts                 ← wrapper de Mux
```

---

## 14. Riesgos y mitigaciones de ingeniería

| Riesgo | Prob. | Impacto | Mitigación |
|---|---|---|---|
| **Scope creep** (querer todo el LMS de una) | Alta | Alto | Roadmap por fases estricto; flag `aulaVirtualEnabled`; cada fase entrega valor independiente; no empezar Fase N+1 sin cerrar N en producción. |
| **Degradación de performance por video** | Media | Alto | **Nunca** servir video desde Vercel; usar CDN (Mux/Cloudflare Stream) con HLS adaptativo; uploads directos cliente→blob; lazy-load del player. |
| **Costos de almacenamiento cloud** | Media | Medio | Cuotas de storage por plan (`PlanLimits`); video con expiración/archivado; R2 (sin egress) para escala; monitoreo de uso por institución. |
| **Deuda técnica en la base de datos** | Media | Alto | Sólo migraciones aditivas (`pnpm db:migrate`, nunca SQL manual); FK nullable; índices desde el día 1; no tocar tablas existentes; revisión de schema en cada PR. |
| **Romper producción (motor de exámenes)** | Baja | Crítico | El LMS **consume** el motor vía `examId`, no lo modifica; tests E2E (Playwright) del flujo de examen como regresión; feature-flag por institución. |
| **Complejidad de auth cross-subdomain** | Media | Medio | Cookies con `domain: '.aulika.cl'` (§16.3); reutilizar NextAuth/Jose existentes sin bifurcar; probar SSO entre `www` y `aula`. |
| **Privacidad de datos (Mineduc/Ley 21.719)** | Media | Alto | Consentimiento explícito; retención y borrado; el contenido del alumno es dato sensible; IA con supervisión humana (sin calificación automática). |
| **Proctoring/IA: falsos positivos y sesgo** | Media | Medio | IA asiste, humano decide; transparencia con el alumno; no bloquear automáticamente. |

---

## 15. Conclusión, viabilidad y posicionamiento de mercado

### Dictamen técnico

**La base de Next.js multi-tenant de Aulika es plenamente apta para esta evolución.** Razones concretas:

1. **Arquitectura ya correcta** — DDD por features, monolito modular serverless: exactamente el patrón que un LMS de este tamaño necesita. No requiere reescritura.
2. **Activos reutilizables de alto valor** — el motor de exámenes (con proctoring, banco, notas 1–7), el sistema de roles/scoping, el multi-tenant por slug, la jerarquía académica chilena y la infraestructura de pagos **ya existen y son justo lo más caro de construir** en un LMS.
3. **Stack moderno** — Next 16 / React 19 / Prisma 7 / Vercel soporta sin fricción contenido, uploads (Blob), video (CDN) y serverless. Gemini ya integrado habilita la capa de IA.
4. **Extensión, no reemplazo** — la estrategia de schema unificado + tablas aditivas + `examId` como puente garantiza que **el producto en producción no se rompe**.

**Riesgo principal no es técnico, es de foco:** la disciplina de ejecutar el roadmap por fases sin dispersarse. El video y los costos de storage son los puntos a vigilar operacionalmente.

### Posicionamiento de mercado

Aulika debe posicionarse como el **LMS chileno nativo para colegios y liceos**, llenando el hueco entre la simplicidad limitada de Google Classroom y la pesadez universitaria de Moodle/Canvas — con lo que nadie más ofrece de fábrica: **RUT, notas 1,0–7,0, evaluación robusta con proctoring y precio en CLP**.

**Propuestas de eslogan:**

- *"Aulika: del examen al aula completa. El LMS hecho en Chile, para Chile."*
- *"Tu colegio en línea, con notas de 1 a 7 y la robustez que Google Classroom no tiene."*
- *"Evaluar, enseñar y certificar. Todo en un solo lugar, en español y en CLP."*

---

## 16. Decisiones definitivas de arquitectura

> Estas 6 directrices están **aprobadas por ingeniería** y la propuesta se alinea estrictamente a ellas.

### 16.1 Tabla de usuarios: ÚNICA y compartida

El estudiante que rinde exámenes **es el mismo** que entra al aula virtual, identificado por su `rut` (único). **No se crea una segunda tabla de usuarios.** El modelo `User` existente se extiende con relaciones LMS (`enrollments`, `lessonProgress`, `submissions`, `grades`, etc.). Un alumno logueado por RUT en `/examen` ya existe en `/aula` con el mismo registro.

### 16.2 Base de datos: un PostgreSQL, un schema Prisma unificado

Un único PostgreSQL y un único `schema.prisma`. **Las tablas existentes no se tocan, se extienden.** Todos los modelos LMS (§13) se agregan al mismo schema con FK a los modelos reales (`User`, `Course→CourseSection`, `Lesson→Exam`, etc.). Migraciones **siempre aditivas** vía `pnpm db:migrate` (nunca SQL manual ni `db execute`).

### 16.3 Subdominio y enrutamiento: `aula.aulika.cl` en el mismo proyecto Vercel

El Aula Virtual corre en `aula.aulika.cl` apuntando al **mismo proyecto/repo de Vercel**. El `proxy.ts` actual (que ya envuelve todo con `auth()` de NextAuth) detecta el **hostname** y hace `rewrite` interno hacia `/aula`, sin alterar las rutas de exámenes/admin en `www.aulika.cl`.

```ts
// src/proxy.ts — integración del rewrite por hostname (esquema)
import { auth } from '@/features/auth/auth';
import { USER_ROLE } from '@/shared/lib/roles';
import type { Session } from 'next-auth';
import { type NextRequest, NextResponse } from 'next/server';

type NextAuthRequest = NextRequest & { auth: Session | null };

const AULA_HOST = 'aula.aulika.cl';

export default auth((req: NextAuthRequest) => {
    const { pathname } = req.nextUrl;
    const host = req.headers.get('host') ?? '';

    // 1) Reescritura por subdominio: aula.aulika.cl/* → /aula/*  (interno, sin redirect)
    if (host === AULA_HOST && !pathname.startsWith('/aula')) {
        const url = req.nextUrl.clone();
        url.pathname = `/aula${pathname}`;
        return NextResponse.rewrite(url); // la URL del navegador sigue siendo aula.aulika.cl/...
    }

    // 2) ... resto del proxy actual intacto (PUBLIC_PREFIXES, /config, /[slug], roles) ...
    return NextResponse.next();
});

export const config = {
    matcher: [
        '/((?!_next|favicon\\.ico|sitemap.*\\.xml|robots\\.txt|manifest\\.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?|ttf|otf|eot)$).*)',
    ],
};
```

**Cookies cross-subdomain:** para que la sesión sea compartida entre `www.aulika.cl` y `aula.aulika.cl`, las cookies de NextAuth y la cookie de estudiante (Jose) deben emitirse con `domain: '.aulika.cl'` (punto inicial = válida en todos los subdominios), `secure: true`, `sameSite: 'lax'`. En NextAuth v5 se configura en `cookies` del config; en la cookie de estudiante, al hacer `cookies().set(...)` se añade `domain: '.aulika.cl'` en producción. Así un login en cualquiera de los dos hosts vale para ambos.

### 16.4 Habilitación por flag en la institución

Se agrega `aulaVirtualEnabled Boolean @default(false)` a `AcademicInstitution`. El acceso a `/aula` se controla con esta flag (más el plan). Instituciones sólo-exámenes quedan en `false` y nada cambia para ellas. El proxy/guard verifica la flag antes de servir el LMS.

### 16.5 Reutilización del motor de exámenes vía `examId`

Si una lección es de tipo `EXAMEN`, `Lesson.examId` apunta (FK) al `Exam` existente. El alumno rinde con el **mismo flujo y modelos actuales** (`ExamAttempt`, `Answer`, corrección determinista) y el resultado se guarda en el **`Result` existente**. El Gradebook lee ese `Result` vía `GradebookItem.examId`. **Cero duplicación de lógica de evaluación.**

```
Lesson(type=EXAMEN, examId) ──► Exam (motor actual)
                                  │  rinde → ExamAttempt / Answer
                                  ▼
                                Result (modelo actual, nota 1–7)
                                  ▲
GradebookItem(examId) ────────────┘  (pondera en la nota final del curso)
```

### 16.6 Estrategia de pricing: dos suscripciones independientes

Dos líneas de producto SaaS separadas, sobre la infraestructura de `Subscription`/`Plan` existente:

- **SaaS Exámenes** (producto actual) — se puede contratar solo.
- **SaaS Aula Virtual** (nuevo) — **incluye por defecto** el acceso completo a los exámenes de ese mismo tier (Aula Virtual ⊃ Exámenes).

Implementación: distinguir el "producto" de la suscripción (p. ej. campo `product` en `Subscription` o un `SubscriptionType`), y la flag `aulaVirtualEnabled` se activa cuando la institución tiene una suscripción de Aula Virtual vigente. Un cliente con Aula Virtual no necesita pagar Exámenes aparte; uno con sólo Exámenes no ve `/aula`.

```
┌─────────────────────────────────────────────┐
│  SaaS AULA VIRTUAL (tier X)                  │
│  ┌───────────────────────────────────────┐  │
│  │  SaaS EXÁMENES (tier X)  ← incluido     │  │
│  └───────────────────────────────────────┘  │
│  + cursos · video · tareas · gradebook ·    │
│    foros · certificados                      │
└─────────────────────────────────────────────┘
       (Exámenes puede venderse solo, aparte)
```

---

> **Fin del plano raw.** Próximo paso del pipeline SPOOL: consolidación por Gemini en `.spool/02_inbox/`.
