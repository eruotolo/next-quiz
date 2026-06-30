# Plan crudo: Demo Read-Only Mode + Driver.js Guided Tour

**Generado:** 2026-06-28  
**Estado:** raw — pendiente de consolidación en `02_inbox/`

---

## Contexto

El modo demo actual (`aulika-demo`, `isDemo=true`) permite que visitantes creen profesores y estudiantes que persisten en la DB indefinidamente. La cleanup solo borra `Exam`, dejando acumulación de usuarios reales.

**Decisión de diseño:** en lugar de bloquear en la Server Action, cambiar la UX del panel demo para que sea de solo lectura visual — los modales se abren para que el visitante vea la estructura de los formularios, pero todos los campos y botones están deshabilitados.

**Impacto en usuarios reales:** cero. `isDemo=true` solo existe en la institución `aulika-demo`. Todos los admins/profesores de instituciones reales tienen `isDemo=false` y ven el panel completamente funcional.

---

## Fase 1 — Demo Mode: Formularios Read-Only

### Cómo llega `isDemo` al cliente

```
AcademicInstitution.isDemo (DB)
  → auth.ts authorize callback → JWT token.isDemo
  → requireInstitutionPageAccess() → retorna { isDemo }
  → page.tsx (Server Component) → prop isDemo a Client component
  → Client component → disabled en inputs y botones
```

### Estado actual de props de permisos

| Componente         | Props hoy                            | Necesita            |
| ------------------ | ------------------------------------ | ------------------- |
| `GroupsClient`     | `canMutate: boolean`                 | + `isDemo: boolean` |
| `StudentsClient`   | `canCreate/Edit/Delete/ToggleActive` | + `isDemo: boolean` |
| `ProfessorsClient` | ❌ ninguna                           | + `isDemo: boolean` |
| `ExamsClient`      | ❌ ninguna                           | + `isDemo: boolean` |
| `DashboardClient`  | ❌ ninguna                           | + `isDemo: boolean` |
| `ExamEditorClient` | ❌ ninguna                           | + `isDemo: boolean` |

### Comportamiento en demo

- Botones "Nuevo / Editar" → **siguen visibles** (el visitante puede abrir el modal y ver la UI)
- Dentro del modal → todos los `<Input>`, `<Select>`, `<Textarea>`, `<Checkbox>` con `disabled`
- Botón Save/Submit → `disabled={isDemo || isPending}`
- Items Delete/Publicar en dropdown → `pointer-events-none opacity-50`
- Nota inline en cada modal demo → `"En modo demo no podés guardar cambios."` (texto xs, color mute)

### Archivos a modificar

**Server pages** — extraer `isDemo` y pasar como prop:

```
src/app/(admin)/[slug]/page.tsx
src/app/(admin)/[slug]/students/page.tsx
src/app/(admin)/[slug]/professors/page.tsx
src/app/(admin)/[slug]/groups/page.tsx
src/app/(admin)/[slug]/exams/page.tsx
src/app/(admin)/[slug]/exams/[id]/edit/page.tsx
```

Patrón en cada page.tsx:

```tsx
const { isDemo, ... } = await requireInstitutionPageAccess(slug);
return <FooClient isDemo={isDemo} ... />;
```

**Client components** — agregar `isDemo: boolean` a Props:

```
src/features/dashboard/components/DashboardClient.tsx
  → dialogs inline (CreateGroupDialog, CreateStudentDialog, CreateExamDialog)
  → todos los inputs: disabled={isDemo}
  → botones submit: disabled={isDemo || isPending}

src/features/students/components/StudentsClient.tsx
  → formulario del Dialog: disabled={isDemo}
  → dropdown Edit/Delete: deshabilitado si isDemo

src/features/professors/components/ProfessorsClient.tsx
  → agregar isDemo a Props interface
  → formulario: disabled={isDemo}
  → submit: disabled={isDemo || isPending}

src/features/exams/components/ExamsClient.tsx
  → agregar isDemo a Props interface
  → modal creación: disabled={isDemo}
  → acciones Publicar/Archivar/Eliminar: deshabilitadas si isDemo

src/features/exams/components/ExamEditorClient.tsx
  → agregar isDemo a Props
  → botones Agregar pregunta, Importar, IA, Guardar: disabled={isDemo}
  → inputs de pregunta/opción: disabled={isDemo}

src/features/groups/components/GroupsClient.tsx
  → agregar isDemo a Props (mantener canMutate existente)
  → GroupForm.tsx: agregar prop disabled?: boolean
```

### Orden de ejecución Fase 1

1. Modificar 6 Server pages → pasar `isDemo`
2. `DashboardClient` → dialogs inline disabled
3. `StudentsClient` → form + dropdown disabled
4. `ProfessorsClient` → agregar prop + form disabled
5. `ExamsClient` → agregar prop + modal + acciones disabled
6. `ExamEditorClient` → agregar prop + todos los botones/inputs disabled
7. `GroupsClient` + `GroupForm` → agregar prop + fields disabled
8. `pnpm lint && pnpm type-check`

### Verificación Fase 1

- Login como `demo@aulika.cl` → entrar a `/aulika-demo/students`
- Click "Agregar estudiante" → modal abre, todos los campos gris/disabled
- Botón "Guardar" está deshabilitado
- Intentar editar un estudiante existente → misma experiencia
- Login como `carlos.lopez@ulagos.cl` → panel completamente funcional sin cambios

---

## Fase 2 — Driver.js Guided Tour (planificar por separado)

### Instalación

```bash
pnpm add driver.js
```

### Archivos a crear

```
src/features/tour/
├── lib/
│   └── tour-steps.ts        ← pasos del tour por sección
└── components/
    └── TourButton.tsx        ← botón trigger + auto-start (localStorage)
```

### Integración

- `data-tour="sidebar"` en `Sidebar.tsx`
- `data-tour="stat-tiles"`, `data-tour="new-exam-btn"`, etc. en `DashboardClient.tsx`
- `<TourButton />` (fixed bottom-right) en `src/app/(admin)/[slug]/layout.tsx`
- Auto-disparo en primer login: `localStorage` key `aulika-tour-seen-v1`
- Para demo: tour disponible también después de cerrar `DemoWelcomeModal`
- Para usuarios reales: auto-disparo en el primer login post-registro

### Pasos del tour dashboard

1. `[data-tour="sidebar"]` — Navegación principal
2. `[data-tour="stat-tiles"]` — Métricas en tiempo real
3. `[data-tour="new-exam-btn"]` — Crear y publicar exámenes
4. `[data-tour="active-exams"]` — Exámenes en curso
5. `[data-tour="recent-results"]` — Resultados recientes

### CSS overrides Driver.js

Aplicar variables CSS del design system de Aulika en el popover:

- `--driver-popover-bg-color`: `white`
- Border radius: `16px`
- Primary color: `var(--color-primary)`
- Title/description: colores `ink` / `mute` del sistema

---

## Notas de implementación

- **NO modificar** `src/features/demo/lib/cleanup.ts` — el problema de acumulación de usuarios queda mitigado por el readonly mode (nadie puede crearlos)
- **NO agregar** campos de DB para Fase 1 — solo props y UI
- **Fase 2** requiere `pnpm add driver.js` — pedir autorización antes de instalar
