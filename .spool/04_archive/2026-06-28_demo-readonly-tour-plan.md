# Plan Maestro Consolidado: Demo Read-Only Mode + Driver.js Guided Tour

**Generado:** 2026-06-28
**Estado:** Fase 1 ✅ completa — Fase 2 ✅ completa

## Contexto y Objetivos

El modo demo actual (`aulika-demo`, `isDemo=true`) sufre una acumulación de datos (usuarios, estudiantes) creados por los visitantes. Para evitar este problema sin afectar la experiencia visual del visitante, la solución es convertir el panel de la institución demo en un **modo de solo lectura**.

Los modales seguirán abriéndose para mostrar la estructura y funcionamiento del sistema, pero todos los campos y acciones mutables estarán deshabilitados. Adicionalmente, se implementará un **Tour Guiado** mediante `driver.js` para guiar a los usuarios por la plataforma.

---

## Fase 1 — Demo Mode: Formularios Read-Only ✅

### 1. Server Pages

- [x] `src/app/(admin)/[slug]/page.tsx` — pasa `isDemo` a `DashboardClient`
- [x] `src/app/(admin)/[slug]/students/page.tsx` — pasa `isDemo` a `StudentsClient`
- [x] `src/app/(admin)/[slug]/professors/page.tsx` — pasa `isDemo` a `ProfessorsClient` y `NewProfessorButton`
- [x] `src/app/(admin)/[slug]/groups/page.tsx` — pasa `isDemo` a `GroupsClient` y `NewGroupButton`
- [x] `src/app/(admin)/[slug]/exams/page.tsx` — pasa `isDemo` a `ExamsClient`
- [x] `src/app/(admin)/[slug]/exams/[id]/edit/page.tsx` — pasa `isDemo` a `ExamEditorClient`
- [x] `src/app/(admin)/[slug]/programs/page.tsx` — extrae `isDemo`, pasa a `NewProgramButton` y `ProgramsClient`
- [x] `src/app/(admin)/[slug]/periods/page.tsx` — extrae `isDemo`, pasa a `PeriodsClient`
- [x] `src/app/(admin)/[slug]/courses/page.tsx` — extrae `isDemo`, pasa a `CoursesClient`

### 2. Client Components

- [x] `DashboardClient.tsx` — `isDemo` conectado a los 3 sub-dialogs (`CreateGroupDialog`, `CreateStudentDialog`, `CreateExamDialog`); nota demo en footers
- [x] `StudentsClient.tsx` — inputs + botón guardar/eliminar deshabilitados; nota demo en footer
- [x] `ProfessorsClient.tsx` — inputs + botón guardar/eliminar deshabilitados; nota demo en footer
- [x] `ExamsClient.tsx` — inputs + botón guardar/publicar/eliminar deshabilitados; nota demo en footer
- [x] `ExamEditorClient.tsx` — toolbar (IA, importar, banco, agregar) + inputs pregunta/opción + guardar deshabilitados; nota demo en footer
- [x] `GroupsClient.tsx` — `isDemo` añadido a Props; pasa `disabled` a `GroupForm`; botón eliminar deshabilitado
- [x] `GroupForm.tsx` — prop `disabled?` añadida; todos los inputs (nombre, especialidad, tutor, carrera, semestre, ramos) + botón guardar deshabilitados; nota demo en footer
- [x] `NewGroupButton.tsx` — `isDemo` añadido a Props; pasa `disabled={isDemo}` a `GroupForm`
- [x] `NewProfessorButton.tsx` — `isDemo` añadido; todos los inputs + select rol + checkboxes grupos + botón guardar deshabilitados; nota demo en footer
- [x] `NewProgramButton.tsx` — `isDemo` añadido; inputs nombre/código/descripción + botón guardar deshabilitados; nota demo en footer
- [x] `ProgramsClient.tsx` — inputs + botón guardar + botón eliminar deshabilitados; nota demo en footer
- [x] `PeriodsClient.tsx` — inputs año/tipo/nombre/fechas + checkbox activo + botón guardar + botón eliminar deshabilitados; nota demo en footer
- [x] `CoursesClient.tsx` — inputs nombre/código + selects programa/período/grupo + botón guardar + botón eliminar deshabilitados; nota demo en footer

### 3. QA Fase 1

- [x] `pnpm lint` — sin errores nuevos
- [x] `pnpm type-check` — sin errores
- [ ] Testear `demo@aulika.cl` — verificar que todos los modales abren pero no permiten guardar
- [ ] Testear usuario normal — verificar que todo sigue editable

---

## Fase 2 — Driver.js Guided Tour ✅

### 1. Instalación

- [x] `pnpm add driver.js`

### 2. Archivos a crear

- [x] `src/features/tour/lib/tour-steps.ts` — pasos del tour con elementos `[data-tour="..."]`
- [x] `src/features/tour/components/TourButton.tsx` — botón flotante fijo + auto-disparo con `localStorage`

### 3. Data attributes en componentes existentes

- [x] `Sidebar.tsx` — `data-tour="sidebar"` en el `<aside>` desktop (línea 705)
- [x] `DashboardClient.tsx` — `data-tour` en: `stat-tiles`, `new-exam-btn`, `active-exams`, `recent-results`

### 4. Integración en layout

- [x] `src/app/(admin)/[slug]/layout.tsx` — `<TourButton />` renderizado antes del cierre del `<div>` raíz

### 5. Estilos CSS Driver.js

- [x] CSS override en `globals.css` — clase `.aulika-tour-popover`: border-radius 16px, colores del design system, botones con `--primary`

### 6. QA Fase 2

- [ ] Abrir `/aulika-demo` en incógnito → tour auto-inicia después de ~1.5s
- [ ] Cerrar tour → `localStorage` registra `aulika-tour-seen-v1`
- [ ] Segunda visita → tour no auto-inicia, botón `?` disponible
- [x] `pnpm lint` — sin errores nuevos
- [x] `pnpm type-check` — sin errores

---

**Restricciones:** No modificar `cleanup.ts` (la acumulación se detiene por UI read-only).
