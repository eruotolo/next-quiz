# Auditoría de CRUD y Usabilidad — Aulika

> Documento de seguimiento. Generado el 29-05-2026 mediante CodeGraph + revisión directa de código.
> Remediación completa en 6 fases + cierre de diferidos (branch `fix/auditoria-crud`, v1.11.0 → v1.16.0).
> Estado: ✅ resuelto · ➖ falso positivo descartado.
> Confianza original: ✅ verificado leyendo código · 🔸 detectado en barrido.

## Leyenda de severidad
- 🔴 Crítico — rompe una operación o genera inconsistencia de datos/seguridad.
- 🟠 Alto — deuda funcional o de seguridad relevante.
- 🟡 Medio/Bajo — robustez, consistencia o pulido de UX.

---

## 1. Gap insignia — Ciclo de vida del plan de una institución

| # | Hallazgo | Sev. | Estado | Resolución |
|---|---|---|---|---|
| PLAN-1 | El formulario de institución no permite elegir plan | 🔴 | ✅ | Diálogo "Asignar plan" en `/config/institutions` (plan + vencimiento) |
| PLAN-2 | No existía acción para asignar/cambiar plan | 🔴 | ✅ | `setInstitutionPlan` (SuperAdmin) |
| PLAN-3 | El webhook nunca actualizaba `institution.plan` | 🔴 | ✅ | `handlePreapproval` sincroniza en `authorized` y degrada en `cancelled` |
| PLAN-4 | Cancelar/pausar no degradaba el plan | 🔴 | ✅ | `cancelSubscription` degrada la institución a FREE |
| PLAN-5 | No se podía crear/vincular suscripción manual | 🟠 | ✅* | Cubierto con `setInstitutionPlan`; sin registro `Subscription` manual (no necesario) |
| PLAN-6 | `quota.ts` leía `institution.plan` desincronizado | 🟠 | ✅ | `institution.plan` ahora sincronizado (assign/webhook/cancel) |

Helper central: `src/features/subscriptions/lib/plan-sync.ts`.

---

## 2. Hallazgos sistémicos

| # | Hallazgo | Sev. | Estado | Resolución |
|---|---|---|---|---|
| SYS-1 | Contrato de error inconsistente | 🟠 | ✅* | students/groups/results/professors a `{data,error}`; exams create/update lanzan pero capturados |
| SYS-2 | Validación duplicada cliente/servidor | 🟡 | ✅ | StudentsClient/ExamsClient/ExamEditorClient validan con el mismo schema Zod (`safeParse`); groups alineado |
| SYS-3 | IDOR cross-tenant | 🔴 | ✅ | Scope por `institutionId` en students/groups/exams/professors/results |
| SYS-4 | Bypass SuperAdmin roto en `/[slug]` | 🟠 | ✅ | `requireInstitutionAccess` resuelve la institución del SuperAdmin |
| SYS-5 | Cache de límites incoherente | 🟡 | ✅ | React `cache()` per-request |

Helpers: `src/shared/lib/auth-guard.ts`, `src/shared/types/action.ts`.

---

## 3. Acciones sin UI

| # | Hallazgo | Sev. | Estado | Resolución |
|---|---|---|---|---|
| UI-1 | `toggleExamActive` sin botón | 🔴 | ✅ | "Publicar/Despublicar" en ExamsClient |
| UI-2 | `toggleStudentActive` sin control | 🟠 | ✅ | "Activar/Desactivar" en StudentsClient |
| UI-3 | Se podía publicar examen sin preguntas | 🔴 | ✅ | Guard: no publica con 0 preguntas |

---

## 4. Campos editables / controles fantasma

| # | Hallazgo | Sev. | Estado | Resolución |
|---|---|---|---|---|
| FLD-1 | `stream`/`tutor` de grupo no editables | 🟠 | ✅ | Campos en el formulario + validación de tutor |
| FLD-2 | `antiCheat`/`lockTabSwitch` no editables en editor | 🟡 | ➖ | Editables vía "Ajustes de examen" |
| FLD-3 | Búsqueda/filtros de StudentsClient decorativos | 🟡 | ✅ | Búsqueda + filtros funcionales |
| FLD-4 | Botón "Importar grupos" falso | 🟡 | ✅ | Removido |
| FLD-5 | `avgGrade` de grupo siempre "—" | 🟡 | ✅ | Promedio real por grupo (`calcGrade` sobre resultados de sus estudiantes) |

También eliminados: valores aleatorios dummy y breadcrumb hardcodeado en StudentsClient.

---

## 5. Robustez y seguridad

| # | Hallazgo | Sev. | Estado | Resolución |
|---|---|---|---|---|
| ROB-1 | `deleteResult` sin validación/scope | 🟠 | ✅ | Scope por institución + `{data,error}` |
| ROB-2 | No hay recalcular/reabrir resultado | 🟡 | ✅ | `recalculateResult` re-corrige desde respuestas guardadas + botón "Recalcular nota" (reabrir = eliminar, ya existente) |
| ROB-3 | SuperAdmin podía autoeliminarse | 🟠 | ✅ | Guard `id === actor.id` |
| ROB-4 | professors con `.parse()` + IDOR | 🟠 | ✅ | safeParse + `{data,error}` + scope + bypass SuperAdmin |
| ROB-5 | `value` de AppConfig sin `maxLength` | 🟡 | ✅ | `max(2000)` |
| ROB-6 | profile sin `revalidatePath` | 🟡 | ✅ | `revalidatePath('/perfil')` |
| ROB-7 | Unicidad fuera de transacción en signup | 🟠 | ➖ | Falso positivo: constraints únicos garantizan integridad |
| ROB-8 | Suscripciones `pending` huérfanas sin GC | 🟡 | ✅ | Cron diario `/api/cron/cleanup-subscriptions` (CRON_SECRET) purga `pending` sin institución > 7 días |
| ROB-9 | Profesor con acceso histórico a examen | 🟡 | ➖ | Falso positivo: `assertProfessorExamAccess` valida membresía actual |

---

## 6. Consistencia de UX

| # | Hallazgo | Sev. | Estado | Resolución |
|---|---|---|---|---|
| UX-1 | Falta toast de éxito | 🟡 | ✅ | Toasts en students/groups/exams/editor/professors |
| UX-2 | Borrado de grupo sin conteo de alumnos | 🟡 | ✅ | Mensaje con cantidad afectada |
| UX-3 | Falta skeleton en editor de examen | 🟡 | ✅ | `loading.tsx` con skeleton en la ruta del editor |

---

## 7. Resumen de cierre

- **Fase 0** (v1.11.0): autorización, IDOR + bypass SuperAdmin (students/groups), contrato, cache.
- **Fase 1** (v1.12.0): asignación de plan + webhook + degradación.
- **Fase 2** (v1.13.0): publicar examen, bloqueo de vacío, IDOR exams.
- **Fase 3** (v1.14.0): stream + tutor de grupo.
- **Fase 4** (v1.15.0): deleteResult, anti-autoeliminación, professors, config, perfil.
- **Fase 5** (v1.15.1): toasts.
- **Cierre de diferidos** (v1.16.0): SYS-2 (validación por schema), FLD-5 (promedio real), ROB-2 (recalcular), ROB-8 (cron GC), UX-3 (skeleton).

**TODOS los hallazgos accionables resueltos.** Falsos positivos descartados: FLD-2, ROB-7, ROB-9, y la sospecha de que `updateStudent` no persistía `groupId`.

### Requiere acción del usuario
- Definir la variable de entorno **`CRON_SECRET`** en Vercel para que el cron de limpieza (`/api/cron/cleanup-subscriptions`) quede autorizado. Sin esa variable la ruta responde 401 y el cron no purga nada.

Verificación: `pnpm type-check` sin errores; `pnpm lint` sin errores (warnings de complejidad/keys preexistentes). Sin push ni deploy. Sin migraciones de Prisma (no hubo cambios de schema).
