# Plan Maestro Consolidado: Lecciones LMS basadas en enlaces + editor enriquecido

> **Estado:** Plan Consolidado y Asignado (MiniMax-M3 / Sonnet)  
> **Fase del Pipeline:** `.spool/02_inbox/master-plan-lms-lecciones-enlaces.md`  
> **Decisión confirmada por Edgardo:** Reemplazo total de Mux (Fase 1 LMS) y Daily.co (Fase 6 LMS). Aprobada la instalación de `@tiptap/*` y `react-dropzone`.

---

## 1. Visión y Objetivos

El Aula Virtual deja de depender de servicios externos pagos (Mux para video upload, Daily.co para clases sincrónicas) y se reconvierte a un modelo 100 % basado en **enlaces**:

- Los docentes suben contenido apuntando a servicios de video y conferencias que el espectador ya conoce (YouTube, Vimeo, Google Meet, Zoom).
- El visor del estudiante embebe el video cuando es YouTube/Vimeo o muestra el enlace con instrucciones cuando es Meet/Zoom.
- Las lecciones de tipo TEXTO y TAREA usan un editor enriquecido (Tiptap) en lugar de un `<textarea>` plano.
- Las lecciones de tipo DOCUMENTO suben el archivo mediante una zona de drop visual (react-dropzone) con previsualización.

Esto simplifica drásticamente la superficie operativa (sin uploads de video, sin videollamadas embebidas, sin pizarra, sin chat en vivo, sin grabación, sin claves Mux/Daily) y elimina el costo recurrente asociado a esos servicios.

### 1.1 Cambios por tipo de lección

| Tipo | Antes | Después |
| --- | --- | --- |
| TEXTO | `<Textarea>` → JSON Tiptap minimal | Editor Tiptap completo (negrita, cursiva, listas, links, headings) |
| TAREA | `<Textarea>` para instrucciones | Editor Tiptap para instrucciones |
| DOCUMENTO | `<Input type="file">` simple | Dropzone visual con previsualización y validación de tipo/tamaño |
| VIDEO | Aviso "subida no disponible" + Mux upload | Input URL validado: dominios `youtube.com`, `youtu.be`, `vimeo.com`. Visor: iframe embed |
| EN_VIVO | Aviso "se programa desde Clases en vivo" + Daily.co | Selector Proveedor (Google Meet / Zoom) + Input URL validado por dominio. Visor: tarjeta con botón "Unirme" + instrucciones |
| ENLACE | Sin cambios | Sin cambios |
| EXAMEN | Sin cambios | Sin cambios |

### 1.2 Principios y reglas

- **Cero uploads, 100 % enlaces.** No se sube video ni se transmiten clases dentro de Aulika. Docentes pegan URLs externas.
- **DRY estricto.** Cualquier helper nuevo vive en `src/features/lms/lib/` (validadores de dominio URL) o en componentes UI de shadcn. No se duplica lógica de Tiptap, ya hay `RichTextContent` que renderiza el JSON — solo agregamos el editor de escritura.
- **Atómico en código, atómico en DB.** Cada migración Prisma toca una sola cosa; cada commit referencia un solo hito.
- **Idempotencia y migraciones.** Siempre `pnpm db:migrate` (nunca SQL manual). Los drop de columnas y modelos son destructivos: los assets de Mux previos dejan de funcionar — los docentes deben re-pegar el enlace manualmente.
- **Sin tests nuevos sobre lo eliminado.** Los ~70 tests de Fase 6 (`live-session-state`, `live-attendance`, `live-chat`, `sanitize-chat`, `daily`) desaparecen con el código.
- **Estética y accesibilidad.** El editor Tiptap hereda el patrón visual del sitio (border, radius, fondo blanco). La dropzone respeta foco visible y soporte teclado.

### 1.3 Modelos intervinientes

| Rol | Modelo | Alcance |
| --- | --- | --- |
| Ejecutor backend / infra / DB / tests / docs | **MiniMax-M3** | Migraciones Prisma, schemas Zod, server actions, wrappers, libs, crons, webhooks, settings infra, validación final, documentación técnica |
| Ejecutor UI / componentes / rutas / estilos | **Sonnet** | Reescritura de `LessonFormDialog`, visor del estudiante, dropzone, eliminación de rutas y sidebar live, cards de settings |

La regla de oro: **Sonnet y MiniMax-M3 no editan los mismos archivos** en el mismo hito. Donde haya solapamiento, se hace secuencial (uno termina antes de que arranque el otro).

---

## 2. Estructura y Archivos Afectados

```
prisma/
└── schema.prisma                                          ← MODIFICAR [MiniMax-M3]: drop videoAssetId/videoUploadId; drop models LmsLiveSession/Attendance/ChatMessage/WhiteboardSnapshot; drop enums LiveSessionStatus/LiveAttendanceRole/LiveRecordingStatus

src/
├── app/
│   ├── (admin)/[slug]/aula/[id]/
│   │   ├── clases/
│   │   │   ├── nueva/page.tsx                            ← ELIMINAR [Sonnet]
│   │   │   ├── [sessionId]/page.tsx                      ← ELIMINAR [Sonnet]
│   │   │   └── [sessionId]/asistencia/page.tsx           ← ELIMINAR [Sonnet]
│   │   └── page.tsx                                      ← MODIFICAR [Sonnet]: quitar botones "Clases" / "Nueva clase"
│   ├── (students)/students/
│   │   ├── aula/
│   │   │   ├── clases/page.tsx                           ← ELIMINAR [Sonnet]
│   │   │   └── cursos/[id]/
│   │   │       ├── clases/page.tsx                       ← ELIMINAR [Sonnet]
│   │   │       └── page.tsx                              ← MODIFICAR [Sonnet]: quitar tab/CTA de clases en vivo
│   │   └── aula/cursos/[id]/leccion/[lessonId]/page.tsx  ← MODIFICAR [Sonnet]: pasa Video a iframe, EN_VIVO a tarjeta
│   ├── api/
│   │   ├── cron/live-reminders/route.ts                  ← ELIMINAR [MiniMax-M3]
│   │   └── webhooks/daily/route.ts                       ← ELIMINAR [MiniMax-M3]
│   └── (admin)/config/
│       └── settings/page.tsx + components/AppSettingsClient.tsx ← MODIFICAR [Sonnet]: quitar card Daily.co
├── features/
│   ├── lms/
│   │   ├── schemas/lms.schemas.ts                        ← MODIFICAR [MiniMax-M3]: quitar videoAssetId/videoUploadId; agregar refinamientos por tipo
│   │   ├── actions/
│   │   │   ├── courses.ts                                ← MODIFICAR [MiniMax-M3]: buildLessonPayload reescrito + lmsLessonSchema por tipo
│   │   │   ├── live-sessions.ts                          ← ELIMINAR [MiniMax-M3]
│   │   │   ├── live-chat.ts                              ← ELIMINAR [MiniMax-M3]
│   │   │   └── whiteboard.ts                             ← ELIMINAR [MiniMax-M3]
│   │   ├── lib/
│   │   │   ├── live-session-state.ts                     ← ELIMINAR [MiniMax-M3]
│   │   │   ├── live-attendance.ts                        ← ELIMINAR [MiniMax-M3]
│   │   │   ├── live-chat.ts                              ← ELIMINAR [MiniMax-M3]
│   │   │   ├── live-notifications.ts                     ← ELIMINAR [MiniMax-M3]
│   │   │   ├── mux-recording.ts                          ← ELIMINAR [MiniMax-M3]
│   │   │   ├── daily.ts                                  ← ELIMINAR [MiniMax-M3] (validar primero si se reusa en certificados)
│   │   │   ├── mux.ts                                    ← ELIMINAR [MiniMax-M3] (si no se usa fuera del LMS)
│   │   │   ├── lesson-url-validators.ts                  ← NUEVO [MiniMax-M3]: parseVideoEmbedUrl, parseLiveSessionUrl, providerFromUrl
│   │   │   └── __tests__/
│   │   │       ├── live-session-state.test.ts            ← ELIMINAR [MiniMax-M3]
│   │   │       ├── live-attendance.test.ts               ← ELIMINAR [MiniMax-M3]
│   │   │       ├── live-chat.test.ts                     ← ELIMINAR [MiniMax-M3]
│   │   │       ├── sanitize-chat.test.ts                 ← ELIMINAR [MiniMax-M3]
│   │   │       └── lesson-url-validators.test.ts         ← NUEVO [MiniMax-M3]
│   │   ├── components/
│   │   │   ├── LessonFormDialog.tsx                      ← MODIFICAR [Sonnet]: TiptapEditor + Dropzone + VIDEO/EN_VIVO inputs
│   │   │   ├── LmsLessonViewer.tsx                       ← MODIFICAR [Sonnet]: VIDEO iframe + EN_VIVO tarjeta
│   │   │   ├── VideoPlayer.tsx                           ← ELIMINAR [Sonnet] (Mux)
│   │   │   ├── DocumentViewer.tsx                        ← ELIMINAR [Sonnet] (reemplazar por dropzone directa, sin visor aparte)
│   │   │   ├── live/
│   │   │   │   ├── DailyCallFrame.tsx                    ← ELIMINAR [Sonnet]
│   │   │   │   ├── LiveChat.tsx                          ← ELIMINAR [Sonnet]
│   │   │   │   ├── LiveSessionForm.tsx                   ← ELIMINAR [Sonnet]
│   │   │   │   ├── LiveSessionListClient.tsx             ← ELIMINAR [Sonnet]
│   │   │   │   ├── LiveSessionRoomClient.tsx             ← ELIMINAR [Sonnet]
│   │   │   │   └── StudentRoomClient.tsx                 ← ELIMINAR [Sonnet]
│   │   │   └── (nuevos) TiptapEditor.tsx + Dropzone.tsx  ← NUEVOS [Sonnet]
│   ├── dashboard/
│   │   └── components/Sidebar.tsx                        ← MODIFICAR [Sonnet]: quitar items Clases en vivo (admin y estudiante)
│   └── admin-plan/
│       └── components/AppSettingsClient.tsx              ← MODIFICAR [Sonnet]: quitar card Daily.co
└── shared/
    └── lib/
        └── prisma.ts                                      ← sin cambios (sanity check durante Fase 2)

vercel.json                                                ← MODIFICAR [MiniMax-M3]: quitar entry /api/cron/live-reminders
```

### 2.1 Archivos nuevos (Sonnet)

- `src/features/lms/components/TiptapEditor.tsx` — wrapper compartido de `@tiptap/react` con toolbar sobrio (bold, italic, listas, headings, link) y output `JSONContent` serializable.
- `src/features/lms/components/Dropzone.tsx` — wrapper de `react-dropzone` con previsualización (icono por tipo), validación de tamaño (25 MB) y lista blanca de MIME types.
- `src/features/lms/components/VideoEmbed.tsx` — iframe responsivo 16:9 a partir de `parseVideoEmbedUrl`.
- `src/features/lms/components/LiveSessionLinkCard.tsx` — tarjeta con badge del proveedor + instrucciones.
- `src/features/lms/lib/lesson-url-validators.ts` (es MiniMax-M3 pero lo listo acá también) — validadores puros.

---

## 3. Checklist de Implementación y Modelos Asignados

### Fase 0: Prerrequisitos (YA COMPLETADO)
*Asignado a: **MiniMax-M3***
- [x] Instalar `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/pm`, `react-dropzone` vía `pnpm add`.

---

### Fase 1: Poda de Fase 6 (Daily.co) — UI primero

*Orden secuencial estricto: Sonnet termina → MiniMax-M3 arranca.*

#### 1.1 SonneT (UI / rutas / settings / sidebar) — ✅ COMPLETADO 2026-07-02

> Autorizado explícitamente por Edgardo ("procedé con la poda 1.1") tras el bloqueo inicial del
> clasificador de auto-modo. `pnpm type-check` (0 errores), `pnpm lint` (0 errores, solo warnings
> preexistentes) y `pnpm exec vitest run` (32 archivos / 350 tests, todos verdes) tras la poda.

- [x] **Eliminar `src/app/(admin)/[slug]/aula/[id]/clases/`:**
  Borrada toda la carpeta `clases/` (nueva, [sessionId], [sessionId]/asistencia).
- [x] **Eliminar `src/app/(students)/students/aula/clases/`:**
  Borrada (incluye `[sessionId]/`).
- [x] **Eliminar `src/app/(students)/students/aula/cursos/[id]/clases/`:**
  Borrada. No existía tab de clases en `cursos/[id]/page.tsx` (verificado — no hubo nada que quitar ahí).
- [x] **Eliminar carpeta `src/features/lms/components/live/`:**
  Borrados los 7 archivos (incluye `Whiteboard.tsx`, no listado explícitamente en el plan original).
- [x] **Eliminar `src/features/lms/components/VideoPlayer.tsx`** — reemplazado por `VideoEmbed.tsx` (Fase 4).
- [x] **Eliminar `src/features/lms/components/DocumentViewer.tsx`** — lógica inlineada como `DocumentPreview` en `LmsLessonViewer.tsx` (Fase 4).
- [x] **Modificar `src/features/dashboard/components/Sidebar.tsx`:**
  Quitado el item "Clases en vivo" de `ADMIN_NAV` y `PROFESOR_NAV`. Actualizado comentario stale que
  mencionaba `/aula/clases` como ejemplo.
- [x] **Modificar `src/features/config/components/AppSettingsClient.tsx`** (ruta real, no `admin-plan/` como decía el plan):
  Quitada la card "Daily.co — Aulas sincrónicas".
- [x] **Eliminar `src/app/(admin)/[slug]/aula/clases/page.tsx`** (hallazgo no listado originalmente) — borrado.
- [x] **Modificar `src/app/(admin)/[slug]/aula/[id]/page.tsx`** (hallazgo no listado originalmente):
  Quitado el botón/link "Clases en vivo" que apuntaba a la ruta eliminada.
- [x] **Modificar `src/shared/components/layout/SlugTopBar.tsx`** (hallazgo no listado originalmente):
  Quitada la rama de resolución de título para `/aula/clases` y `clases` dentro de `sectionMap`;
  variable `s1` quedó sin uso y se eliminó.
- [x] **Modificar `src/shared/components/layout/StudentTopBar.tsx`** (hallazgo no listado originalmente):
  Quitadas las ramas de título para `/students/aula/clases/` y `.includes('/clases')`.
- [x] **Actualizar `src/features/dashboard/components/__tests__/Sidebar.test.ts`** (hallazgo no listado originalmente):
  El fixture `lmsChildren` tenía `/aula/clases` como tercer hijo sintético; renombrado a `/aula/foro`
  para no implicar una ruta inexistente (el test es puro sobre el helper `isItemActiveInGroup`, no
  importaba el `Sidebar.tsx` real, así que no fallaba, pero quedaba engañoso).
- [x] **Eliminar `tests/e2e/admin/lms-phase6-live.spec.ts`** (hallazgo no listado originalmente):
  spec Playwright completo sobre rutas de clases en vivo ahora inexistentes.

#### 1.2 MiniMax-M3 (actions / libs / tests / cron / webhook)
- [ ] **Eliminar `src/features/lms/actions/live-sessions.ts`, `live-chat.ts`, `whiteboard.ts`.**
- [ ] **Eliminar `src/features/lms/lib/live-session-state.ts`, `live-attendance.ts`, `live-chat.ts`, `live-notifications.ts`, `mux-recording.ts`.**
- [ ] **Eliminar `src/shared/lib/daily.ts`** (validar primero que no lo consuma certificados ni AppConfig más allá del LMS).
- [ ] **Eliminar sus tests:** `live-session-state.test.ts`, `live-attendance.test.ts`, `live-chat.test.ts`, `sanitize-chat.test.ts`, y cualquier test del webhook de Daily.
- [ ] **Eliminar `src/app/api/cron/live-reminders/route.ts`.**
- [ ] **Eliminar `src/app/api/webhooks/daily/route.ts`.**
- [ ] **Verificar** que ningún archivo del LMS aún importa los módulos eliminados con `pnpm type-check`.

---

### Fase 2: Migración Prisma (MiniMax-M3)

#### 2.1 Drop de campos Mux en `LmsLesson`
*Asignado a: **MiniMax-M3***
- [ ] **Modificar `prisma/schema.prisma`** — quitar de `LmsLesson`:
  ```prisma
  videoAssetId     String?
  videoUploadId    String?
  ```
- [ ] **Generar migración con `pnpm db:migrate dev --name drop_lms_video_mux_fields`.**
- [ ] **Verificar** en `prisma/migrations/<timestamp>_drop_lms_video_mux_fields/migration.sql` que solo dropea esas dos columnas. Sin SQL manual (regla).
- [ ] **Correr `pnpm db:generate` y `pnpm type-check`.**

#### 2.2 Drop de modelos Fase 6 + enums
*Asignado a: **MiniMax-M3***
- [ ] **Modificar `prisma/schema.prisma`** — eliminar los siguientes modelos y enums:
  - `model LmsLiveSession`
  - `model LmsLiveAttendance`
  - `model LmsLiveChatMessage`
  - `model LmsWhiteboardSnapshot`
  - `enum LiveSessionStatus`
  - `enum LiveAttendanceRole`
  - `enum LiveRecordingStatus`
- [ ] **Verificar** relaciones inversas en otros modelos (`LmsCourse.liveSessions`) y quitarlas si quedaron huérfanas.
- [ ] **Generar migración con `pnpm db:migrate dev --name drop_lms_phase6_live_models`.**
- [ ] **Correr `pnpm db:generate` y `pnpm type-check`.**
- [ ] **Auditar queries huérfanas** que consulten estas tablas — debería estar limpio tras Fase 1, pero confirmar con `pnpm grep` "LmsLive".

---

### Fase 3: Reescritura del Modal de Lección (Sonnet) — ✅ COMPLETADO 2026-07-02

*Asignado a: **Sonnet***
- [x] **Crear `src/features/lms/components/TiptapEditor.tsx`:**
  Wrapper de `useEditor` con `@tiptap/starter-kit` (Link incluido en el bundle v3, no requirió
  `@tiptap/extension-link` aparte). Toolbar: bold, italic, H2/H3, listas, link (input inline propio,
  **no `window.prompt()`** — precedente ya documentado en CLAUDE.md), undo/redo. Exporta también
  `renderLessonHtml()` (usa `generateHTML` de `@tiptap/core`, reexportado vía `@tiptap/react` porque
  `@tiptap/core` no es dependencia directa y `tsc` no resolvía el import) para el visor de Fase 4.
- [x] **Crear `src/features/lms/components/Dropzone.tsx`:**
  Wrapper de `react-dropzone` con los tipos y tope de 25 MB pedidos.
- [x] **Reescribir `src/features/lms/components/LessonFormDialog.tsx`:**
  - TEXTO usa TiptapEditor con `contentJson` (Json en DB) directo, sin conversión.
  - TAREA usa TiptapEditor pero `LmsAssignment.instructions` sigue siendo `String?` en el schema
    actual (no tocado, es alcance de MiniMax-M3) — se extrae texto plano del doc Tiptap al guardar
    y se reconstruye un doc simple al cargar. Pierde formato rico por ahora; si se quiere formato
    real en tareas hace falta migrar `instructions` a `Json` (fuera de este plan).
  - DOCUMENTO con Dropzone, VIDEO y EN_VIVO con validación de dominio vía
    `lesson-url-validators.ts` (ver nota Fase 5.1 abajo). ENLACE/EXAMEN sin cambios.
- [x] `pnpm type-check` y `pnpm lint` verdes sobre los archivos tocados (1 warning `noArrayIndexKey`
  preexistente sin tocar, no introducido por este cambio).

---

### Fase 4: Reescritura del Visor del Estudiante (Sonnet) — ✅ COMPLETADO 2026-07-02

*Asignado a: **Sonnet***
- [x] **Crear `src/features/lms/components/VideoEmbed.tsx`** — igual al spec.
- [x] **Crear `src/features/lms/components/LiveSessionLinkCard.tsx`** — igual al spec.
- [x] **Modificar `src/features/lms/components/LmsLessonViewer.tsx`:**
  - Quitados `VideoPlayer`, `DocumentViewer`, `playbackId`, `initialLastSeenSec`, `videoAssetId` del
    componente y de su `Props`. `RichTextContent` ahora renderiza HTML real vía `renderLessonHtml()`
    (antes solo extraía texto plano, perdiendo negrita/listas/links del editor viejo).
  - DOCUMENTO: lógica de `DocumentViewer.tsx` inlineada como `DocumentPreview` local (el archivo
    viejo sigue existiendo, huérfano, hasta que se apruebe la Fase 1.1).
  - También se actualizó el consumidor
    `src/app/(students)/students/aula/cursos/[id]/leccion/[lessonId]/page.tsx` (no listado
    explícitamente en la sección 2 de este plan pero es el único caller): se quitó el import de
    `muxPlaybackId`, el cómputo de `playbackId` y los campos `videoAssetId`/`durationSec` del select
    y del objeto `lesson` pasado al viewer.

---

### Fase 5: Backend (MiniMax-M3)

#### 5.1 Helpers puros en `lesson-url-validators.ts`
*Asignado a: **MiniMax-M3*** — ⚠️ **Archivo ya creado por Sonnet (2026-07-02)**, era dependencia
bloqueante de Fase 3/4 (VideoEmbed, LiveSessionLinkCard y la validación de VIDEO/EN_VIVO en el
modal). Implementa exactamente la firma pedida abajo (`parseVideoEmbedUrl`, `parseLiveSessionUrl`,
`isValidExternalLinkForType`), con `parseYoutubeUrl`/`parseVimeoUrl` extraídas aparte para bajar la
complejidad ciclomática por debajo del límite de Biome. **MiniMax-M3: no recrear el archivo, solo
falta escribir los tests.**
- [x] ~~Crear `src/features/lms/lib/lesson-url-validators.ts`~~ (hecho por Sonnet, ver nota arriba):
  - `parseVideoEmbedUrl(url): { kind: 'youtube' | 'vimeo', embedUrl: string } | null`
    - YouTube: acepta `youtube.com/watch?v=ID`, `youtu.be/ID`, `youtube.com/embed/ID`, devuelve `https://www.youtube.com/embed/ID`.
    - Vimeo: acepta `vimeo.com/ID`, `player.vimeo.com/video/ID`, devuelve `https://player.vimeo.com/video/ID`.
  - `parseLiveSessionUrl(url): { provider: 'google_meet' | 'zoom' } | null`
    - Google Meet: contiene `meet.google.com`.
    - Zoom: contiene `zoom.us` o `zoom.com`.
  - `isValidExternalLinkForType(type, url): boolean` — wrapper que une los dos validadores anteriores según `LessonType`.
- [ ] **Tests** en `src/features/lms/lib/__tests__/lesson-url-validators.test.ts` (pendiente, MiniMax-M3):
  - YouTube: 3 formatos válidos, 1 inválido.
  - Vimeo: 2 formatos válidos.
  - Google Meet: 2 formatos, 1 inválido.
  - Zoom: 2 formatos, 1 inválido.
  - `isValidExternalLinkForType` por tipo.

#### 5.2 Schema Zod + Server Actions
*Asignado a: **MiniMax-M3***
- [ ] **Modificar `src/features/lms/schemas/lms.schemas.ts`:**
  - Quitar `videoAssetId`, `videoUploadId` de `lmsLessonSchema`.
  - Agregar superRefine para validar `externalLink` por `type`:
    ```ts
    if (['VIDEO','ENLACE','EN_VIVO'].includes(data.type) && !data.externalLink) { … }
    if (data.type === 'VIDEO' && !parseVideoEmbedUrl(data.externalLink)) { … }
    if (data.type === 'EN_VIVO' && !parseLiveSessionUrl(data.externalLink)) { … }
    ```
- [ ] **Modificar `src/features/lms/actions/courses.ts` — `buildLessonPayload`:**
  - Reemplazar el ternario de `externalLink`:
    ```ts
    externalLink: ['VIDEO','ENLACE','EN_VIVO'].includes(type) ? externalLink.trim() || null : null,
    videoAssetId: null,
    videoUploadId: null,
    fileUrl: type === 'DOCUMENTO' ? (lesson?.fileUrl ?? null) : null,
    ```
- [ ] **Limpiar imports** en `actions/courses.ts` que ya no se usen (mux, daily).

---

### Fase 6: Infra y Configuración (MiniMax-M3)

*Asignado a: **MiniMax-M3***
- [ ] **Modificar `vercel.json`:** quitar el entry del cron `live-reminders`. Mantener `cleanup-read-notifications` y `student-notifications`.
- [ ] **Documentar variables de entorno en `AGENTS.md`:**
  - `DAILY_API_KEY` y `DAILY_WEBHOOK_SECRET` → deprecadas, pueden removerse de `.env.example` y Vercel.
  - `MUX_TOKEN_ID` y `MUX_TOKEN_SECRET` → deprecadas, mismas consideraciones. Solo si tampoco las usa el sistema de certificados (`certificate-pdf.tsx`).
  - Verificar que `src/shared/lib/cloudinary.ts` no se rompa.
- [ ] **Actualizar `AppConfig`** (vía DB): limpiar `DAILY_API_KEY` y `DAILY_WEBHOOK_SECRET` si quedaron registradas. Dejar nota en el schema si se mantuvieron para evitar error de import.

---

### Fase 7: Validación Final (MiniMax-M3)

*Asignado a: **MiniMax-M3***
- [ ] **`pnpm type-check`** → 0 errores.
- [ ] **`pnpm lint`** → 0 errores nuevos (los warnings pre-existentes pueden mantenerse; documentar si bajan).
- [ ] **`pnpm test:run`** → todos los tests restantes pasan. Confirmar que se eliminaron los ~70 tests de Fase 6. Esperar ~250 tests pasando.
- [ ] **`pnpm devBuild`** (Next.js build): todas las rutas `/aula/*` y `/students/aula/*` siguen compilando. Las rutas de live y el cron ya no aparecen.
- [ ] Verificación manual QA según `.doc/qa-aula-e2e.md` ajustado al nuevo modelo (sin reproducir pasos de clases en vivo ni videos Mux).

---

### Fase 8: Documentación (MiniMax-M3)

*Asignado a: **MiniMax-M3***
- [ ] **Actualizar `AGENTS.md` y `CLAUDE.md`:** reemplazar las secciones sobre "Aula Virtual (LMS) — Fase 6" por una nueva sección "LMS — Lecciones basadas en enlaces". Documentar:
  - Regla de tipos por lección (TEXTO/VIDEO/DOCUMENTO/EN_VIVO/ENLACE/EXAMEN/TAREA).
  - Validadores de URL por tipo.
  - La transición de Mux/Daily a enlaces externos.
- [ ] **Actualizar `Spec.md`** si existe referencia a Fase 6 o Mux/Daily en LMS.
- [ ] **Append en Obsidian** (`/Users/edgardoruotolo/SitesDoc/nextjs_projects/next-quiz/next-quiz.md`) con fecha, título del cambio y resumen técnico.
- [ ] **Mover este plan** a `.spool/04_archive/` con prefijo `YYYY-MM-DD_`.

---

## 4. Riesgos y Heads-up

1. **Datos históricos:** lecciones con `videoAssetId` quedan apuntando a assets Mux irrecuperables. El docente debe re-pegar manualmente las URLs de YouTube/Vimeo.
2. **Tests rotos en cascada:** las dependencias de Fase 6 (~70 tests) se eliminan con el código. Esperar suite final ~250 tests.
3. **AppConfig en producción:** si la DB tiene claves DAILY_API_KEY / DAILY_WEBHOOK_SECRET, quedan inertes pero el código ya no las consume — limpiar en migración si se desea.
4. **Estudiantes con sesiones futuras en live:** no aplica en este flujo (no había live persistente con cron activo al momento de corte).
5. **Certificados PDF:** si `cloudinary.ts` o `mux.ts` se usan también para emitir certificados, **no** eliminar de la poda sin antes auditar con `grep -r "from.*mux\|from.*daily" src/`.

---

## 5. Criterios de "Done"

- [ ] El modal de lección muestra TiptapEditor para TEXTO/TAREA y Dropzone para DOCUMENTO.
- [ ] El modal acepta URLs de YouTube/Vimeo para VIDEO y Google Meet/Zoom para EN_VIVO, validando el dominio.
- [ ] El visor del estudiante embebe videos YouTube/Vimeo y muestra tarjeta con instrucciones para Meet/Zoom.
- [ ] No existen referencias a Mux ni Daily.co en `src/features/lms/` ni en `src/app/(students)/students/aula/`.
- [ ] `pnpm type-check && pnpm lint && pnpm test:run && pnpm build` pasa todo en verde.
- [ ] Plan archivado en `.spool/04_archive/`.
- [ ] Obsidian doc actualizado.
