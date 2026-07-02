# 🎓 Aulas Virtuales — Investigación Completa & Roadmap Aulika

> **Documento generado por:** Antigravity AI  
> **Fecha:** 2026-06-26  
> **Proyecto:** Aulika — Sistema de evaluación en línea → Aula Virtual

---

## 📋 Tabla de Contenidos

1. [¿Qué es un Aula Virtual / LMS?](#1-qué-es-un-aula-virtual--lms)
2. [Cómo Funciona un Aula Virtual](#2-cómo-funciona-un-aula-virtual)
3. [Arquitectura Técnica](#3-arquitectura-técnica)
4. [Módulos Fundamentales](#4-módulos-fundamentales)
5. [Principales Plataformas del Mercado](#5-principales-plataformas-del-mercado)
6. [Repositorios GitHub de Referencia](#6-repositorios-github-de-referencia)
7. [Tendencias 2024–2025](#7-tendencias-2024-2025)
8. [Contexto Latinoamericano](#8-contexto-latinoamericano)
9. [Modelos de Negocio / Monetización](#9-modelos-de-negocio--monetización)
10. [Aulika — Estado Actual](#10-aulika--estado-actual)
11. [Análisis GAP: Aulika vs. Aula Virtual Completa](#11-análisis-gap-aulika-vs-aula-virtual-completa)
12. [Roadmap Estratégico: Aulika → Aula Virtual](#12-roadmap-estratégico-aulika--aula-virtual)
13. [Stack Técnico Propuesto para la Evolución](#13-stack-técnico-propuesto-para-la-evolución)
14. [Riesgos y Mitigaciones](#14-riesgos-y-mitigaciones)
15. [Conclusión y Recomendaciones](#15-conclusión-y-recomendaciones)

---

## 1. ¿Qué es un Aula Virtual / LMS?

Un **Aula Virtual** (también llamada **LMS** — _Learning Management System_) es un ecosistema digital diseñado para replicar y superar la experiencia del aula presencial. Va mucho más allá de ser un simple repositorio de archivos: es una plataforma integral que gestiona **todo el ciclo de vida del aprendizaje**.

### Definición operativa

> Un LMS es una aplicación web multi-rol que centraliza la creación, distribución, seguimiento y evaluación de contenidos educativos, permitiendo la interacción sincrónica y asincrónica entre docentes y estudiantes, con trazabilidad completa del proceso de aprendizaje.

### Diferencia clave: Herramienta de evaluación vs. Aula Virtual

| Dimensión             | Herramienta de evaluación (ej: Aulika hoy) | Aula Virtual completa                           |
| --------------------- | ------------------------------------------ | ----------------------------------------------- |
| **Foco**              | Exámenes / quizzes                         | Proceso completo de enseñanza-aprendizaje       |
| **Contenido**         | Preguntas y opciones                       | Videos, PDFs, lecturas, foros, tareas           |
| **Interacción**       | Estudiante ↔ Examen                        | Estudiante ↔ Profesor ↔ Pares                   |
| **Tiempo**            | Ventana horaria acotada                    | Continuo (semestres, ciclos)                    |
| **Seguimiento**       | Nota final                                 | Progreso, participación, engagement             |
| **Retroalimentación** | Automática (correcta/incorrecta)           | Multidimensional (rúbricas, comentarios, pares) |
| **Certificación**     | No contemplado                             | Certificados digitales automáticos              |

---

## 2. Cómo Funciona un Aula Virtual

### 2.1 Flujo General de Operación

```
DOCENTE                           PLATAFORMA                        ESTUDIANTE
  │                                   │                                 │
  ├─ Crea curso/materia ────────────► │ Estructura el contenido          │
  ├─ Sube materiales ───────────────► │ Gestiona archivos/media          │
  ├─ Configura actividades ─────────► │ Programa entregas/fechas         │
  ├─ Abre foro/clase en vivo ──────► │ Gestiona videoconf./chat         │
  │                                   │ ◄────────── Accede al curso ─────┤
  │                                   │ ◄────────── Descarga material ───┤
  │                                   │ ◄────────── Participa en foros ──┤
  │                                   │ ◄────────── Rinde evaluaciones ──┤
  │ ◄── Revisa entregas ────────────  │ ◄────────── Entrega tareas ──────┤
  │ ◄── Ve analytics ───────────────  │ Calcula progreso y notas         │
  │ ◄── Recibe alertas ──────────────  │ Detecta riesgo deserción        │
  │                                   │ ─────────── Entrega certificado ►│
```

### 2.2 Tipos de aprendizaje soportados

| Tipo                | Descripción                         | Herramientas                               |
| ------------------- | ----------------------------------- | ------------------------------------------ |
| **Sincrónico**      | En tiempo real, todos a la vez      | Videoconferencia, chat en vivo, whiteboard |
| **Asincrónico**     | Cada uno a su ritmo                 | Videos grabados, foros, documentos         |
| **Blended/Híbrido** | Combinación presencial + virtual    | Dashboard de asistencia mixta              |
| **HyFlex**          | Simultáneamente presencial + remoto | Streaming de clase presencial              |
| **Microlearning**   | Píldoras de contenido breve         | Módulos de 5–10 min, flashcards            |

---

## 3. Arquitectura Técnica

### 3.1 Arquitectura Multi-Capa (Modelo Típico)

```
┌─────────────────────────────────────────────────────┐
│                    CAPA DE PRESENTACIÓN              │
│  Web App (Next.js/React)  │  Mobile App / PWA        │
│  Teacher Dashboard        │  Student Portal           │
└────────────────────────┬────────────────────────────┘
                         │ HTTPS / REST / Server Actions
┌────────────────────────▼────────────────────────────┐
│                    CAPA DE NEGOCIO                   │
│  Auth  │ Courses │ Assessments │ Gradebook │ Notif. │
│  Users │ Media   │ Forums      │ Analytics │ Certs. │
│  Plans │ AI Gen  │ Calendar    │ Payments  │ Audit  │
└────────────────────────┬────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────┐
│                    CAPA DE DATOS                     │
│  PostgreSQL  │  Redis (cache/sessions)               │
│  S3/CDN (media/videos)  │  Elasticsearch (búsqueda)  │
└─────────────────────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────┐
│                SERVICIOS EXTERNOS                    │
│  Zoom/Jitsi/BBB (video) │ Brevo/SendGrid (email)    │
│  Stripe/MercadoPago     │ Google AI / OpenAI        │
│  CDN (CloudFront/Vercel) │ Monitoring (Sentry)      │
└─────────────────────────────────────────────────────┘
```

### 3.2 Patrones Arquitectónicos Comunes

- **Monolito Modular**: Un único sistema bien organizado (ej: Moodle, Aulika actual). Ideal para el inicio.
- **Microservicios**: Servicios independientes por dominio (ej: Open edX en escala masiva). Alta complejidad.
- **Serverless/Edge**: Funciones en el borde (ej: Vercel Edge Functions). Ideal para evaluaciones y notificaciones.
- **Event-Driven**: Eventos para notificaciones, análisis y automatizaciones.

---

## 4. Módulos Fundamentales

### 4.1 Núcleo Educativo (Core)

#### Gestión de Cursos

- Creación de cursos con estructura de **módulos → lecciones → actividades**
- Soporte de tipos de contenido: video, PDF, texto enriquecido, SCORM, audio
- **Prerequisitos**: una lección desbloquea la siguiente solo si se completa la anterior
- **Contenido Drip**: publicación programada de módulos por fecha
- Plantillas de cursos reutilizables

#### Gestión de Usuarios y Roles

- Roles típicos: Super Admin → Admin Institución → Coordinador → Docente → Auxiliar → Estudiante
- Matriculación masiva (CSV/Excel)
- Grupos y cohortes
- Transferencia entre grupos mid-semester

#### Sistema de Evaluaciones (Assessment)

- **Tipos de preguntas**: selección única, múltiple, verdadero/falso, respuesta corta, ensayo, arrastrar/soltar, completar espacios, ordenar, emparejar
- **Banco de preguntas** con tags y niveles de dificultad
- **Selección aleatoria** de preguntas del banco
- **Anti-trampa**: IP única, bloqueo de pestaña, proctoring por cámara
- **Rúbricas**: evaluación de tareas con criterios definidos
- **Evaluación entre pares** (peer assessment)

#### Libro de Calificaciones (Gradebook)

- Ponderación de actividades (ej: examen 40%, tarea 30%, participación 30%)
- Escala configurable (1–7 chilena, 0–100, A–F, etc.)
- Curvas de notas
- Exportación a Excel/PDF
- Historial de modificaciones auditado

### 4.2 Comunicación e Interacción

#### Foros y Discusiones

- Foros por curso, por módulo, por grupo
- Hilos anidados
- Suscripción a notificaciones
- Moderación docente

#### Videoconferencia Integrada

- Integración con **Zoom**, **Google Meet**, **BigBlueButton** (open source), **Jitsi**
- Grabación automática y almacenamiento
- Salas de grupos (breakout rooms)
- Pizarrón interactivo (whiteboard)
- Asistencia automática

#### Mensajería Interna

- Mensajes directos entre usuarios
- Notificaciones push (web/móvil)
- Email digest configurable
- Anuncios a toda la clase

### 4.3 Analítica y Reportería

#### Dashboards

- **Docente**: tasa de completado, notas promedio, tiempo en plataforma, actividad por alumno
- **Estudiante**: progreso personal, posición en ranking (opcional), próximas entregas
- **Admin**: métricas institucionales, cursos activos, tasa de deserción

#### Analítica Predictiva (AI)

- Detección temprana de **estudiantes en riesgo** de abandono
- Predicción de rendimiento basada en patrones de acceso
- Recomendación de material de refuerzo

### 4.4 Gamificación

- **Puntos** por completar actividades, participar en foros, entregar a tiempo
- **Badges/Insignias** (logros desbloqueables)
- **Tablero de posiciones** (leaderboard) — opcional, configurable
- **Niveles** de progreso
- **Rachas** de días consecutivos de estudio

### 4.5 Administración y Configuración

- **Multi-tenant**: una plataforma, múltiples instituciones aisladas
- **White-label**: branding personalizado por institución (logo, colores)
- **Gestión de planes y límites**: cuota de estudiantes, almacenamiento, cursos activos
- **Auditoría**: log de todas las acciones críticas
- **Configuración académica**: períodos, carreras, asignaturas

---

## 5. Principales Plataformas del Mercado

### 5.1 Open Source — Los Gigantes

#### Moodle

- **Repositorio**: https://github.com/moodle/moodle (7k+ stars)
- **Stack**: PHP 8, PostgreSQL/MySQL, JavaScript
- **Fortalezas**: Máxima flexibilidad, +1700 plugins, soporte en 100+ idiomas, 250M usuarios globales
- **Debilidades**: UI anticuada, curva de aprendizaje administrativa, pesado en servidor
- **Ideal para**: Universidades con equipo técnico dedicado
- **Precio**: Gratis (auto-hospedado) / Moodle Cloud desde USD 120/año

#### Canvas LMS

- **Repositorio**: https://github.com/instructure/canvas-lms (5k+ stars)
- **Stack**: Ruby on Rails, PostgreSQL, React
- **Fortalezas**: UI moderna, API REST poderosa, integraciones nativas (Google, Microsoft), mobile-first
- **Debilidades**: Requiere infraestructura significativa para auto-hospedado
- **Ideal para**: Instituciones grandes que quieren modernidad y escalabilidad

#### Open edX

- **Repositorio**: https://github.com/openedx/openedx-platform (7k+ stars)
- **Stack**: Python (Django), MySQL, MongoDB, React
- **Fortalezas**: Escala masiva (MOOC), gamificación nativa, SCORM/xAPI
- **Debilidades**: Complejidad de instalación extrema, orientado a MOOCs no a colegios
- **Ideal para**: Cursos masivos abiertos en línea

### 5.2 SaaS Comerciales Relevantes

| Plataforma         | Foco                    | Precio base          | Diferenciador                   |
| ------------------ | ----------------------- | -------------------- | ------------------------------- |
| **TalentLMS**      | Empresas y capacitación | USD 69/mes           | Simplicidad y rapidez           |
| **Teachable**      | Creadores de contenido  | USD 29/mes           | Monetización de cursos          |
| **Thinkific**      | Creadores B2C           | USD 49/mes           | Comunidades y membresías        |
| **Kajabi**         | Marketing + educación   | USD 149/mes          | Funnels y email marketing       |
| **LearnDash** (WP) | WordPress               | USD 199/año          | Flexibilidad con WP             |
| **iSpring Learn**  | Corporativo             | USD 2.29/usuario/mes | SCORM nativo, PowerPoint import |
| **Blackboard**     | Educación superior      | Precio empresarial   | Legacy institucional            |

### 5.3 Nuevos Jugadores (Next-Gen LMS)

#### LearnHouse (stack Next.js — muy relevante para Aulika)

- **Repositorio**: https://github.com/learnhouse/learnhouse
- Stack: TypeScript/Next.js — mismo que Aulika
- Generación de contenido con IA, pizarras colaborativas, ejecución de código en tiempo real

#### ClassroomIO

- **Repositorio**: https://github.com/classroomio/classroomio
- Alternativa moderna y simple, orientada a empresas y equipos pequeños

#### Agora Flat (Aula Virtual Sincrónica)

- **Repositorio**: https://github.com/netless-io/flat
- Pizarrón interactivo en tiempo real, videoconferencia integrada

---

## 6. Repositorios GitHub de Referencia

### Para estudio técnico profundo

| Repositorio                 | Stars | Tecnología    | Lo que enseña                        |
| --------------------------- | ----- | ------------- | ------------------------------------ |
| moodle/moodle               | 7k+   | PHP           | Estructura modular, roles, gradebook |
| instructure/canvas-lms      | 5k+   | Ruby/React    | API REST, UI moderna, multi-tenancy  |
| openedx/openedx-platform    | 7k+   | Python/Django | Escala, SCORM, certificados          |
| learnhouse/learnhouse       | 2k+   | Next.js/TS    | Stack similar a Aulika, IA integrada |
| classroomio/classroomio     | 1k+   | SvelteKit     | Simplicidad, UX moderna              |
| bigbluebutton/bigbluebutton | 8k+   | Java/React    | Videoconferencia open source         |
| netless-io/flat             | 3k+   | TypeScript    | Pizarrón y clases en vivo            |

### Librerías clave para implementar features

| Feature               | Librería/Servicio                   | Notas                                 |
| --------------------- | ----------------------------------- | ------------------------------------- |
| Video player          | video.js / plyr / react-player      | Para reproductor de lecciones         |
| Editor de contenido   | tiptap / quill / Slate.js           | Rich text para materiales             |
| Pizarrón colaborativo | excalidraw / tldraw                 | Open source y embedable               |
| Video streaming       | Mux / Cloudflare Stream / Bunny.net | CDN de video para cursos              |
| Generación AI         | Vercel AI SDK (ya en Aulika)        | Para generar preguntas/resúmenes      |
| Videoconferencia      | Jitsi (open) / Zoom SDK / Daily.co  | Para clases en vivo                   |
| SCORM/xAPI            | scorm-again / xapi-js               | Compatibilidad con contenido estándar |
| Certificados PDF      | react-pdf / pdfkit                  | Generación de certificados            |
| Notificaciones push   | web-push / Firebase FCM             | Para recordatorios                    |

---

## 7. Tendencias 2024–2025

### 7.1 Inteligencia Artificial Integrada

La IA ya no es un feature extra — es infraestructura central:

- **Generación automática de contenido**: a partir de un PDF o video, generar resúmenes, quizzes, flashcards (Aulika ya tiene generación de preguntas con Google AI ✅)
- **Asistente virtual 24/7**: chatbot que responde preguntas del material del curso
- **Rutas de aprendizaje adaptativas**: el sistema ajusta la dificultad según el desempeño
- **Detección de riesgo de deserción**: alertas al docente cuando un estudiante lleva N días sin ingresar
- **Transcripción automática** de videos con búsqueda de texto completo
- **Evaluación de ensayos** con retroalimentación automática

### 7.2 Aprendizaje Adaptativo y Personalizado

- Cada estudiante recibe una experiencia diferente según su ritmo y nivel
- Contenido que se "desbloquea" progresivamente
- Recomendaciones de refuerzo antes de evaluaciones

### 7.3 Microlearning

- Módulos de 5–10 minutos máximo
- Flashcards y tarjetas de repaso espaciado (spaced repetition)
- Compatibilidad con consumo desde celular (mobile-first)

### 7.4 Gamificación Sofisticada

- No solo puntos y badges: narrativas, desafíos por equipos, simulaciones
- Gamificación adaptada por IA al estilo de aprendizaje
- Social learning: competir y colaborar con pares

### 7.5 Analítica Predictiva

- Dashboards que predicen el rendimiento futuro
- Medición del ROI de la capacitación
- Alertas proactivas antes de la evaluación

### 7.6 Modelo HyFlex

- Soporte simultáneo de estudiantes presenciales y remotos
- Grabación automática de clases presenciales
- Material accesible offline

### 7.7 Credenciales Digitales

- Certificados verificables con QR
- **Blockchain credentials** (Open Badges, Blockcerts)
- Integración con LinkedIn Learning

### 7.8 Integración de Ecosistema

- **LTI (Learning Tools Interoperability)**: estándar para integrar herramientas externas
- **SCORM / xAPI**: estándares de contenido intercambiable
- **APIs abiertas**: para conectar con SIS (Student Information Systems), ERPs
- Integración con Google Workspace, Microsoft Teams

---

## 8. Contexto Latinoamericano

### 8.1 Particularidades de la Región

| Desafío                    | Impacto                               | Solución                                        |
| -------------------------- | ------------------------------------- | ----------------------------------------------- |
| **Conectividad desigual**  | Zonas sin acceso estable              | Mobile-first, modo offline, apps livianas       |
| **Predominio del celular** | 70%+ acceso por smartphone            | PWA, interfaz responsive, bajo consumo de datos |
| **Brecha digital docente** | Adopción tecnológica lenta            | UX intuitiva, tutoriales integrados             |
| **Costo del software**     | Presupuestos educativos limitados     | Planes freemium, precio por estudiante activo   |
| **Regulación de datos**    | Leyes de protección de datos por país | Hosting en región, cumplimiento normativo       |

### 8.2 Contexto Chileno (Relevante para Aulika)

- **Mineduc** promueve activamente la digitalización educativa
- **Sistema de notas 1–7** (ya implementado en Aulika ✅)
- **RUT como identificador único** (ya implementado en Aulika ✅)
- Alta penetración de **smartphones** en estudiantes secundarios y universitarios
- **Mercado objetivo de Aulika**: colegios, liceos técnicos, universidades, institutos

### 8.3 Competencia en Chile/LATAM

| Plataforma           | Origen    | Presencia Chile      | Modelo                      |
| -------------------- | --------- | -------------------- | --------------------------- |
| **Moodle**           | Australia | Alta (universidades) | Open source (gratis)        |
| **Canvas**           | EE.UU.    | Alta (U. Chile, PUC) | Licencia institucional      |
| **Blackboard**       | EE.UU.    | Media (legacy)       | Licencia empresarial        |
| **Google Classroom** | EE.UU.    | Muy alta (colegios)  | Gratis con Google Workspace |
| **Seesaw**           | EE.UU.    | Media (básica)       | Freemium                    |

**Oportunidad de Aulika**: Ser la alternativa **chilena, local, con soporte en español y a precio accesible** frente a plataformas internacionales que no comprenden el contexto educativo local.

---

## 9. Modelos de Negocio / Monetización

### 9.1 Modelos Principales en el Mercado

#### Por Asientos (Seat-Based)

- Cobro por número de usuarios activos/mes
- Predecible para el cliente, fácil de entender

#### Por Uso (Usage-Based)

- Cobro por consumo real (videos transmitidos, exámenes tomados, GB almacenados)
- Flexible pero difícil de presupuestar para el cliente

#### Freemium (modelo actual de Aulika)

- Plan gratuito con limitaciones para captar usuarios
- Planes pagos con más funcionalidades / más usuarios
- Tasa de conversión típica: 2–5% de usuarios free → pago

#### Institucional

- Precio negociado según tamaño de la institución
- Soporte dedicado, SLA, customizaciones
- Contrato anual o plurianual

### 9.2 Estructura de Planes Sugerida para Aulika Aula Virtual

| Plan              | Precio mensual | Límites                         | Features clave                             |
| ----------------- | -------------- | ------------------------------- | ------------------------------------------ |
| **FREE**          | $0             | 30 est, 1 docente, 2 cursos     | Exámenes básicos, materiales               |
| **DOCENTE**       | USD 19         | 100 est, 3 docentes, 10 cursos  | Todo FREE + video, foros, gamificación     |
| **COLEGIO**       | USD 69         | 500 est, 20 docentes, ilimitado | Todo DOCENTE + analítica, certificados, IA |
| **INSTITUCIONAL** | Cotizar        | Ilimitado                       | Todo + white-label, API, soporte dedicado  |

### 9.3 Ingresos Adicionales (Add-ons)

- **Almacenamiento extra** (GB adicionales para videos)
- **IA avanzada** (generación de contenido completo de cursos)
- **Proctoring** (supervisión de exámenes con IA/cámara)
- **Certificados personalizados** con blockchain
- **Módulo de clases en vivo** con videoconferencia
- **Marketplace de cursos** (comisión sobre ventas entre instituciones)

---

## 10. Aulika — Estado Actual

### 10.1 Lo que Aulika tiene HOY ✅

Aulika es actualmente un **sistema de evaluaciones en línea** robusto con:

**Gestión institucional completa:**

- ✅ Multi-institución con aislamiento por `slug`
- ✅ Roles: SuperAdmin, Administrador, Profesor, Estudiante
- ✅ Jerarquía académica: Carrera → Semestre → Ramo → Grupo
- ✅ CRUD de estudiantes con importación Excel
- ✅ Cuerpo docente con asignación a ramos
- ✅ Planes de suscripción: FREE, DOCENTE, COLEGIO, INSTITUCIONAL
- ✅ Pago vía MercadoPago
- ✅ Auditoría de acciones

**Sistema de evaluaciones:**

- ✅ Exámenes con preguntas de selección única/múltiple
- ✅ Banco de preguntas institucional
- ✅ Generación de preguntas con IA (Google AI SDK)
- ✅ Ventana horaria (scheduledAt / closesAt)
- ✅ Límite de tiempo con cronómetro
- ✅ Anti-trampas: bloqueo de pestaña, IP única, intento único
- ✅ Auto-entrega al agotar tiempo
- ✅ Reanudación segura
- ✅ Resultados en tiempo real (LiveResults)
- ✅ Notas escala 1–7 chilena
- ✅ Calificación automática

**Autenticación:**

- ✅ Admin: NextAuth v5 (email + bcrypt)
- ✅ Estudiante: login por RUT sin contraseña (Jose HS256)

**Infraestructura:**

- ✅ Next.js 16 + App Router + React 19
- ✅ PostgreSQL + Prisma 7
- ✅ Vercel (hosting)
- ✅ Demo pública aislada
- ✅ Modo registro self-service

### 10.2 Lo que Aulika NO tiene aún ❌

- ❌ Materiales de curso (videos, PDFs, documentos)
- ❌ Módulos / lecciones estructuradas
- ❌ Foros de discusión
- ❌ Tareas y entregas (assignments)
- ❌ Gradebook ponderado
- ❌ Videoconferencia / clases en vivo
- ❌ Pizarrón interactivo
- ❌ Mensajería interna
- ❌ Gamificación (badges, puntos, ranking)
- ❌ Certificados automáticos
- ❌ Analítica predictiva (riesgo deserción)
- ❌ Rutas de aprendizaje / prerequisitos
- ❌ Contenido drip / publicación programada
- ❌ Mobile app nativa
- ❌ SCORM / xAPI
- ❌ White-label visual por institución

---

## 11. Análisis GAP: Aulika vs. Aula Virtual Completa

```
AULIKA HOY                              AULA VIRTUAL COMPLETA
─────────────────────────────────────────────────────────────

[✅] Gestión institución multi-tenant   [✅] Gestión institución multi-tenant
[✅] Roles y permisos granulares        [✅] Roles y permisos granulares
[✅] Jerarquía académica compleja       [✅] Jerarquía académica
[✅] Gestión de estudiantes             [✅] Gestión de estudiantes
[✅] Gestión de profesores              [✅] Gestión de profesores
[✅] Grupos y asignaciones              [✅] Grupos y cohortes
[✅] Exámenes + banco de preguntas      [✅] Evaluaciones avanzadas
[✅] Resultados en tiempo real          [✅] Gradebook completo
[✅] IA para generar preguntas          [✅] IA avanzada (rutas, asistente)
[✅] Planes y suscripción               [✅] Monetización
[✅] Auditoría                          [✅] Auditoría

[❌] MATERIALES DE CURSO                GAP CRÍTICO
[❌] MÓDULOS Y LECCIONES               GAP CRÍTICO
[❌] FOROS DE DISCUSIÓN                GAP IMPORTANTE
[❌] TAREAS/ENTREGAS                   GAP IMPORTANTE
[❌] GRADEBOOK PONDERADO               GAP IMPORTANTE
[❌] VIDEOCONFERENCIA                  GAP IMPORTANTE
[❌] MENSAJERÍA INTERNA                GAP MODERADO
[❌] GAMIFICACIÓN                      GAP MODERADO
[❌] CERTIFICADOS                      GAP MODERADO
[❌] ANALÍTICA PREDICTIVA              GAP MODERADO
[❌] LEARNING PATHS                    GAP FUTURO
[❌] MOBILE APP                        GAP FUTURO
[❌] SCORM/xAPI                        GAP FUTURO
```

**Conclusión del GAP**: Aulika tiene una base técnica **excepcional** que cubre el 40–50% de los features de un LMS completo. Los gaps críticos son la gestión de materiales de curso y la estructura de módulos/lecciones. El resto son features que pueden agregarse iterativamente.

---

## 12. Roadmap Estratégico: Aulika → Aula Virtual

> **Principio guía**: No romper lo que funciona. Aulika es hoy una plataforma estable con usuarios reales. La evolución debe ser incremental, sin regresiones.

### Fase 1 — Fundamentos de Curso (2–3 meses)

_Convertir los "ramos" de Aulika en "cursos" con materiales_

**1.1 Modelo de Materiales**

- Nuevo modelo `Lesson`: `id`, `courseSectionId`, `title`, `content` (rich text), `type` (VIDEO/PDF/DOCUMENT/LINK/TEXT), `fileUrl`, `order`, `publishedAt`, `isVisible`
- Nuevo modelo `LessonModule`: agrupa lecciones en semanas/unidades
- UI para docente: editor de lecciones con Tiptap (rich text), upload de PDFs
- UI para estudiante: visualizador de lecciones, progreso por lección

**1.2 Integración de Video**

- Integrar `Mux` o `Cloudflare Stream` para upload y streaming de videos
- Reproductor con marcado de progreso (`LessonProgress`)
- Control de acceso: solo estudiantes del ramo pueden ver el contenido

**1.3 Progreso del Estudiante**

- Indicador visual de completado por módulo (barra de progreso)
- Dashboard estudiante: "Mis cursos" con progreso general

**Entregables Fase 1:**

- [ ] Modelos Prisma: `LessonModule`, `Lesson`, `LessonProgress`
- [ ] Vista docente: editor de módulos y lecciones
- [ ] Vista estudiante: lista de lecciones con reproductor
- [ ] Upload de archivos PDF/video
- [ ] Barra de progreso del estudiante

---

### Fase 2 — Evaluaciones Enriquecidas (1–2 meses)

_Expandir el sistema de evaluaciones existente_

**2.1 Tipos de Pregunta adicionales**

- Verdadero/Falso
- Respuesta corta (texto libre, evaluación manual)
- Emparejar columnas (drag & drop con @dnd-kit, ya instalado)
- Completar espacio en blanco

**2.2 Tareas y Entregas**

- Modelo `Assignment`: título, descripción, fecha de entrega, puntos máximos
- Modelo `Submission`: archivo subido, texto, URL, nota asignada, feedback docente
- UI estudiante: formulario de entrega con upload
- UI docente: vista de entregas, calificación con feedback

**2.3 Gradebook Ponderado**

- Configuración de ponderaciones: examen 40%, tareas 30%, quizzes 20%, participación 10%
- Nota final calculada automáticamente
- Vista docente tipo hoja de cálculo

**Entregables Fase 2:**

- [ ] Modelos Prisma: `Assignment`, `Submission`, `GradeConfig`
- [ ] Vista entregas docente y estudiante
- [ ] Gradebook con ponderación configurable
- [ ] Exportación de calificaciones a Excel

---

### Fase 3 — Comunicación y Comunidad (1–2 meses)

**3.1 Foros de Discusión**

- Modelos: `Forum`, `ForumThread`, `ForumPost`
- Foros por ramo/módulo, threads anidados
- Notificación por email al docente de nuevo post

**3.2 Anuncios del Curso**

- El docente publica anuncios que aparecen a todos los estudiantes del ramo
- Notificación email opcional

**3.3 Notificaciones In-App**

- Alertas para: nueva lección publicada, resultado disponible, tarea próxima a vencer
- Sistema de alertas en el dashboard

**Entregables Fase 3:**

- [ ] Modelos Prisma: `Forum`, `Thread`, `Post`, `Announcement`
- [ ] Vista foro por ramo
- [ ] Sistema de anuncios docente
- [ ] Notificaciones in-app

---

### Fase 4 — Gamificación y Motivación (1 mes)

**4.1 Sistema de Puntos y Badges**

- Puntos por: completar lección, rendir examen con nota ≥ 5, entregar tarea antes, participar en foro
- Catálogo de badges con criterios de desbloqueo

**4.2 Dashboard de Logros**

- Vista estudiante: "Mis logros" con badges obtenidos
- Ranking opcional por ramo (configurable por institución)

**4.3 Rachas de Estudio**

- Contador de días consecutivos ingresados
- Notificación de mantenimiento de racha

**Entregables Fase 4:**

- [ ] Modelos Prisma: `Badge`, `StudentBadge`, `StudentPoints`
- [ ] Motor de eventos para otorgar puntos/badges
- [ ] Vista "Mis logros" en portal estudiante
- [ ] Leaderboard por ramo configurable

---

### Fase 5 — Certificados y Analítica (1–2 meses)

**5.1 Certificados Automáticos**

- Generación de PDF: nombre del estudiante, nombre del curso, nota, fecha, firma digital
- Emisión automática al completar el curso con nota aprobatoria
- URL pública con QR de verificación

**5.2 Analítica Avanzada**

- Dashboard institucional: tasa de aprobación, tiempo promedio de estudio
- Reporte de riesgo: estudiantes con bajo completado previo al examen
- Exportación analytics a Excel/PDF

**5.3 IA de Resúmenes y Asistente**

- Botón "Resumir esta lección" → llama a Gemini API
- Chatbot simple sobre el contenido del curso

**Entregables Fase 5:**

- [ ] Generador de certificados PDF (react-pdf)
- [ ] Vista "Mis certificados" en portal estudiante
- [ ] Dashboard analítica institucional
- [ ] Resumen de lecciones con IA

---

### Fase 6 — Clases en Vivo (opcional, 2–3 meses)

**6.1 Videoconferencia Integrada**

- Integración con **Jitsi Meet** (open source, sin costo por usuario)
- Desde el panel docente: "Crear clase en vivo" → genera sala + link
- Grabación automática almacenada como lección

**6.2 Pizarrón Colaborativo**

- Integrar **Excalidraw** (open source) como widget embebido
- Disponible durante clases en vivo y de forma asincrónica

**Entregables Fase 6:**

- [ ] Modelo `LiveSession`: courseSectionId, scheduledAt, jitsiRoomId, recordingUrl
- [ ] Vista "Próximas clases" en portal estudiante
- [ ] Widget Excalidraw embebido

---

## 13. Stack Técnico Propuesto para la Evolución

La evolución **no requiere cambiar el stack actual**. Se extiende con:

### Nuevas Dependencias

| Feature                 | Paquete                                   | Justificación                             |
| ----------------------- | ----------------------------------------- | ----------------------------------------- |
| Editor rich text        | `@tiptap/react`                           | Usado en LearnHouse, potente y extensible |
| Video upload/streaming  | `@mux/mux-node` + `@mux/mux-player-react` | CDN de video profesional                  |
| Generación PDF          | `@react-pdf/renderer`                     | Certificados y reportes                   |
| Pizarrón                | `@excalidraw/excalidraw`                  | Open source, embebible                    |
| Notificaciones push     | `web-push`                                | Recordatorios al estudiante               |
| Videoconferencia        | `@jitsi/react-sdk`                        | Open source, sin costo                    |
| Almacenamiento archivos | AWS S3 / Cloudflare R2                    | PDFs de estudiantes                       |
| Real-time               | Server-Sent Events (Next.js built-in)     | Notificaciones en vivo                    |

### Nuevos Modelos Prisma (resumen)

```prisma
model LessonModule {
  id              String        @id @default(uuid())
  courseSectionId String
  title           String
  order           Int
  lessons         Lesson[]
  courseSection   CourseSection @relation(fields: [courseSectionId], references: [id])
}

model Lesson {
  id          String         @id @default(uuid())
  moduleId    String
  title       String
  type        LessonType     // VIDEO | PDF | DOCUMENT | LINK | TEXT
  content     String?        // Rich text (Tiptap JSON)
  fileUrl     String?
  videoId     String?        // Mux video ID
  order       Int
  publishedAt DateTime?
  progress    LessonProgress[]
  module      LessonModule   @relation(fields: [moduleId], references: [id])
}

model LessonProgress {
  id            String    @id @default(uuid())
  studentId     String
  lessonId      String
  completedAt   DateTime?
  watchedSeconds Int      @default(0)
  student       User      @relation(fields: [studentId], references: [id])
  lesson        Lesson    @relation(fields: [lessonId], references: [id])
  @@unique([studentId, lessonId])
}

model Assignment {
  id              String        @id @default(uuid())
  courseSectionId String
  title           String
  description     String
  maxPoints       Float
  dueAt           DateTime?
  type            AssignmentType // UPLOAD | TEXT | LINK
  submissions     Submission[]
  courseSection   CourseSection @relation(fields: [courseSectionId], references: [id])
}

model Submission {
  id           String     @id @default(uuid())
  assignmentId String
  studentId    String
  fileUrl      String?
  textContent  String?
  linkUrl      String?
  grade        Float?
  feedback     String?
  submittedAt  DateTime   @default(now())
  assignment   Assignment @relation(fields: [assignmentId], references: [id])
  student      User       @relation(fields: [studentId], references: [id])
  @@unique([assignmentId, studentId])
}
```

### Nuevas Rutas (App Router)

```
src/app/
├── (student)/examen/
│   ├── cursos/[courseSectionId]/
│   │   ├── page.tsx                → Lecciones del ramo
│   │   └── leccion/[id]/page.tsx   → Visualizar lección
├── (admin)/[slug]/
│   ├── courses/[id]/
│   │   ├── edit/page.tsx           → Editor de módulos/lecciones
│   │   ├── assignments/page.tsx    → Tareas del ramo
│   │   └── forum/page.tsx          → Foro del ramo
│   └── analytics/page.tsx          → Dashboard analítica
```

---

## 14. Riesgos y Mitigaciones

| Riesgo                                                                | Probabilidad | Impacto | Mitigación                                                           |
| --------------------------------------------------------------------- | ------------ | ------- | -------------------------------------------------------------------- |
| **Scope creep**: querer hacer todo a la vez                           | Alta         | Alto    | Roadmap por fases, MVP de cada feature                               |
| **Deuda técnica**: modelos sin limpiar los existentes                 | Media        | Alto    | Revisar Prisma schema antes de cada fase                             |
| **Performance con videos**: degradar la experiencia                   | Media        | Alto    | Usar CDN de video (Mux/Cloudflare), nunca servir video desde Next.js |
| **Complejidad de permisos**: nuevos modelos que rompan el scoping     | Alta         | Alto    | Extender `requireInstitutionAccess` antes de cada feature            |
| **Abandono de la feature de exámenes**: los usuarios actuales la usan | Baja         | Alto    | Las fases no tocan el módulo de exámenes existente                   |
| **Costo de almacenamiento**: usuarios suben GB de videos              | Media        | Medio   | Límites por plan, Cloudflare R2 (muy económico)                      |
| **Adopción lenta por docentes**                                       | Alta         | Medio   | Onboarding guiado, tutoriales en la plataforma                       |

---

## 15. Conclusión y Recomendaciones

### ¿Es viable convertir Aulika en un Aula Virtual?

**Sí, absolutamente. Y la base técnica de Aulika es excepcionalmente sólida para lograrlo.**

### Ventajas competitivas de Aulika para la evolución

1. **Stack moderno**: Next.js 16, React 19, Prisma, TypeScript strict — el mismo stack que LearnHouse (el LMS de próxima generación más prometedor)
2. **Multi-tenancy implementado**: el sistema de instituciones, slugs, roles y permisos ya funciona — es el componente más difícil de construir en un LMS
3. **Evaluaciones de clase mundial**: el módulo de exámenes con anti-trampas, ventana horaria y auto-calificación es más robusto que el de muchos LMS open source
4. **IA ya integrada**: la generación de preguntas con Vercel AI SDK + Google AI es una ventaja enorme
5. **Monetización funcionando**: MercadoPago, planes, suscripciones — lista para escalar
6. **Contexto chileno nativo**: RUT, escala 1–7, tipos de institución chilena — Google Classroom y Canvas no tienen esto

### Recomendación de Inicio

**Comenzar por la Fase 1**: materiales de curso y lecciones. Este es el gap crítico que transforma Aulika de "herramienta de exámenes" a "aula virtual". Es conceptualmente simple de implementar dado el modelo de `CourseSection` ya existente.

**Tiempo estimado para MVP de Aula Virtual**: 4–6 meses implementando las Fases 1–3.

**Tiempo para plataforma completa**: 10–14 meses implementando todas las fases.

### Posicionamiento de Mercado Sugerido

> **"Aulika: El aula virtual hecha para Chile"**  
> La única plataforma educativa que entiende el sistema chileno: RUT, escala 1–7, MINEDUC, con evaluaciones de clase mundial y la facilidad de uso que tus docentes necesitan.

---

## Referencias y Recursos

- Moodle GitHub: https://github.com/moodle/moodle
- Canvas LMS GitHub: https://github.com/instructure/canvas-lms
- Open edX Platform GitHub: https://github.com/openedx/openedx-platform
- LearnHouse GitHub (referencia directa — Next.js): https://github.com/learnhouse/learnhouse
- ClassroomIO GitHub: https://github.com/classroomio/classroomio
- BigBlueButton GitHub (videoconferencia open source): https://github.com/bigbluebutton/bigbluebutton
- Excalidraw GitHub (pizarrón colaborativo): https://github.com/excalidraw/excalidraw
- Tiptap Editor: https://tiptap.dev/
- Mux Video CDN: https://mux.com/
- Jitsi Meet: https://jitsi.org/
- Cloudflare R2 (almacenamiento): https://developers.cloudflare.com/r2/

---

## 16. Decisiones de Arquitectura — Respuestas Definitivas (2026-06-26)

> Esta sección registra las decisiones confirmadas en conversación y las propuestas para los puntos pendientes.

---

### ✅ Decisión 1 — Tabla de usuarios: COMPARTIDA

**Decisión tomada**: La tabla `User` es la misma para ambos productos. El login funciona igual que hoy.

**Implicancias:**

- Un estudiante registrado en Aulika Exámenes **ya existe** en el Aula Virtual sin hacer nada extra
- El login por RUT sin contraseña se mantiene para el portal de estudiante en ambos productos
- El login por email+contraseña (NextAuth) se mantiene para el panel docente/admin en ambos
- No hay duplicación de registros de usuarios
- Un cambio de datos en un producto se refleja automáticamente en el otro

**Sin cambios en el modelo `User`** — solo se agregan nuevas relaciones (lecciones completadas, foros, etc.)

---

### ✅ Decisión 2 — Base de datos: LA MISMA

**Decisión tomada**: Un único PostgreSQL, un único schema de Prisma. Se extiende con nuevas tablas.

**Implicancias:**

- Las tablas actuales de Aulika Exámenes no se tocan
- Se agregan nuevas tablas: `LessonModule`, `Lesson`, `LessonProgress`, `Assignment`, `Submission`, `Forum`, `Badge`, etc.
- Un único `prisma migrate deploy` en producción maneja todo
- Los datos entre productos son naturalmente relacionados (un `Exam` puede ser la actividad de una `Lesson`)

---

### ✅ Decisión 3 — Subdominio: `aula.aulika.cl` en el MISMO proyecto Vercel

**Decisión tomada**: Subdominio `aula.aulika.cl` en el **mismo proyecto Vercel**, sin crear un proyecto separado.

#### ¿Cómo funciona técnicamente?

Vercel soporta múltiples dominios en un mismo deployment. El routing interno se maneja en `proxy.ts` leyendo el `hostname` del request — no requiere un proyecto nuevo.

**Paso 1 — Vercel Dashboard (Settings → Domains)**

```
aulika.cl          ← dominio principal (actual)
aula.aulika.cl     ← agregar este subdominio al mismo proyecto
```

**Paso 2 — DNS en tu proveedor de dominio**

```
CNAME   aula   →   cname.vercel-dns.com
```

**Paso 3 — `src/proxy.ts` (extensión de la lógica actual)**

```typescript
export function middleware(request: NextRequest) {
    const hostname = request.headers.get('host') ?? '';
    const isAulaSubdomain = hostname.startsWith('aula.');

    if (isAulaSubdomain) {
        // El usuario ve: aula.aulika.cl/[slug]/cursos
        // Next.js sirve internamente: /aula/[slug]/cursos
        const url = request.nextUrl.clone();
        url.pathname = `/aula${url.pathname}`;
        return NextResponse.rewrite(url);
    }

    // ... lógica actual de Aulika Exámenes sin tocar ...
}
```

**Paso 4 — Estructura de carpetas `src/app/` (lo que se agrega)**

```
src/app/
├── (actual — sin cambios)
│   ├── (public)/
│   ├── (student)/examen/
│   └── (admin)/[slug]/
│
└── aula/                       ← NUEVA carpeta raíz del Aula Virtual
    ├── (student)/              → aula.aulika.cl/cursos/...
    │   ├── login/page.tsx
    │   ├── cursos/page.tsx
    │   └── cursos/[id]/page.tsx
    └── (admin)/[slug]/         → aula.aulika.cl/[slug]/...
        ├── page.tsx            → Dashboard Aula Virtual
        ├── cursos/page.tsx
        ├── cursos/[id]/edit/page.tsx
        └── foros/page.tsx
```

**Ventajas:**

- ✅ Un solo repositorio, un solo deployment, un solo `pnpm build`
- ✅ Comparten BD, usuarios y sesiones NextAuth
- ✅ Cookies cross-subdomain configurando `domain: '.aulika.cl'`
- ✅ Documentado por Vercel en su [Platforms Starter Kit](https://github.com/vercel/platforms)
- ✅ Zero costo adicional de infraestructura

**Configuración de cookies para cross-subdomain:**

```typescript
// En auth.ts — los usuarios quedan logueados en ambos subdominios
cookies: {
  sessionToken: {
    options: {
      domain: '.aulika.cl',  // El punto inicial cubre todos los subdominios
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
    }
  }
}
```

---

### 💡 Propuesta 4 — Compartir usuarios entre productos

**Los usuarios son exactamente los mismos registros.** Lo que cambia es si la institución tiene el Aula Virtual habilitada.

**Mecanismo: campo `aulaVirtualEnabled` en `AcademicInstitution`**

```prisma
model AcademicInstitution {
  // ... campos actuales sin cambios ...

  // Nuevo: control del Aula Virtual
  aulaVirtualEnabled       Boolean   @default(false)
  aulaVirtualPlan          AulaPlan  @default(FREE_AULA)
  aulaVirtualPlanExpiresAt DateTime?
}

enum AulaPlan {
  FREE_AULA
  STARTER
  PRO
  INSTITUCIONAL
}
```

**Flujo de acceso del estudiante:**

```
Mismo RUT → login en aula.aulika.cl/login
          → sistema busca el User por RUT (misma tabla User)
          → verifica AcademicInstitution.aulaVirtualEnabled
          → true  → accede al Aula Virtual de su institución
          → false → "Tu institución no tiene acceso al Aula Virtual aún"
```

**El SuperAdmin** activa/desactiva el Aula Virtual por institución desde `/config/institutions`.  
El proceso de upgrade al Aula Virtual tiene su propia suscripción en MercadoPago, independiente de la suscripción de exámenes.

---

### 💡 Propuesta 5 — Los exámenes del Aula Virtual son los MISMOS de Aulika

**El motor de exámenes de Aulika es un módulo compartido.** El Aula Virtual lo consume, no lo duplica.

**Relación en el schema:**

```prisma
model Lesson {
  id     String  @id @default(uuid())
  type   LessonType  // VIDEO | PDF | TEXT | DOCUMENT | LINK | EXAM
  // ...
  examId String?  // Si type = EXAM, referencia al Exam de Aulika
  exam   Exam?    @relation(fields: [examId], references: [id])
}
```

**¿Qué significa en la práctica?**

| Acción            | En Aulika Exámenes                         | En Aulika Aula Virtual                                             |
| ----------------- | ------------------------------------------ | ------------------------------------------------------------------ |
| Crear evaluación  | Profesor crea `Exam` en `/[slug]/exams`    | Profesor agrega una lección tipo EXAM y vincula/crea un `Exam`     |
| Rendir            | Estudiante entra a `aulika.cl/examen/[id]` | Estudiante llega a la lección → redirige al mismo flujo de examen  |
| Ver resultado     | `/[slug]/results`                          | El Aula Virtual muestra el resultado dentro del progreso del curso |
| Registro `Result` | Un solo registro                           | El mismo registro — no hay duplicación                             |

**Resultado**: El profesor puede gestionar sus exámenes desde ambos dashboards. Los datos son siempre los mismos.

---

### 💡 Propuesta 6 — Pricing: dos suscripciones independientes

**Cada producto tiene su propia suscripción.** Una institución puede tener solo exámenes, solo el Aula Virtual, o ambos (con descuento bundle si se desea).

#### Aulika Exámenes — Planes actuales (sin cambios)

| Plan          | Precio     | Descripción                        |
| ------------- | ---------- | ---------------------------------- |
| FREE          | $0         | Acceso básico, límites actuales    |
| DOCENTE       | USD 12/mes | Para docentes individuales         |
| COLEGIO       | USD 39/mes | Para colegios y liceos             |
| INSTITUCIONAL | Cotizar    | Universidades e institutos grandes |

#### Aulika Aula Virtual — Nueva suscripción

| Plan              | Precio     | Límites                    | Features principales                               |
| ----------------- | ---------- | -------------------------- | -------------------------------------------------- |
| **FREE AULA**     | $0         | 20 est, 1 doc, 1 curso     | PDF/texto, sin video                               |
| **STARTER**       | USD 19/mes | 100 est, 3 doc, 5 cursos   | Video (5h), foros, tareas, progreso                |
| **PRO**           | USD 59/mes | 500 est, 20 doc, ilimitado | Todo + gamificación, certificados, analítica, IA   |
| **INSTITUCIONAL** | Cotizar    | Ilimitado                  | Todo + white-label, API, Jitsi clases en vivo, SLA |

> **El módulo de Exámenes de Aulika está incluido en todos los planes del Aula Virtual.** Las instituciones con el Aula Virtual no necesitan pagar también por Aulika Exámenes.

#### Modelos del mercado que inspiraron esta estructura

| Empresa    | Modelo                                       | Aplicable a Aulika                                  |
| ---------- | -------------------------------------------- | --------------------------------------------------- |
| **Notion** | Un plan por workspace, escala por miembros   | ✅ Un plan por institución                          |
| **Canva**  | Freemium agresivo, conversión a Pro          | ✅ FREE generoso para captar instituciones          |
| **GitHub** | Free/Pro/Team/Enterprise con features claros | ✅ Tiers diferenciados por feature, no por cantidad |
| **Linear** | Por seat, precio decreciente a escala        | Para futuro con muchos usuarios                     |

#### Estrategia de go-to-market sugerida

1. **Lanzar en beta** con plan FREE AULA para las instituciones ya usuarias de Aulika Exámenes → adopción orgánica
2. **Conversion trigger**: cuando superen 20 estudiantes activos → upgrade a STARTER
3. **Bundle discount**: si tiene Aulika Exámenes COLEGIO + Aula Virtual PRO → 15% de descuento
4. **Institucional**: proceso de cotización igual al actual vía email/QuoteDialog

---

### Resumen ejecutivo de todas las decisiones

| #   | Pregunta                     | Decisión                                                                                         |
| --- | ---------------------------- | ------------------------------------------------------------------------------------------------ |
| 1   | ¿Misma tabla de usuarios?    | ✅ **Sí** — mismo `User`, mismo login por RUT                                                    |
| 2   | ¿Misma base de datos?        | ✅ **Sí** — mismo PostgreSQL, Prisma schema extendido                                            |
| 3   | ¿Subdominio en Vercel?       | ✅ **Sí, mismo proyecto** — `aula.aulika.cl` en Vercel, routed en `proxy.ts`                     |
| 4   | ¿Cómo se comparten usuarios? | ✅ **Son los mismos** — se activa por institución con `aulaVirtualEnabled`                       |
| 5   | ¿Mismos exámenes?            | ✅ **Sí** — `Lesson` de tipo EXAM referencia el `Exam` de Aulika                                 |
| 6   | ¿Pricing?                    | ✅ **Dos suscripciones independientes** — Aulika Exámenes (actual) + Aulika Aula Virtual (nueva) |

---

_Documento generado por Antigravity AI — Investigación realizada: 2026-06-26_
_Actualizado: 2026-06-26 — Decisiones de arquitectura finales confirmadas en conversación_
_Próxima revisión sugerida: Al iniciar el diseño técnico del schema Prisma del Aula Virtual_
