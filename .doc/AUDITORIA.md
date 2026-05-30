# Auditoría de CRUD y Usabilidad — Aulika

> Documento de seguimiento. Generado el 29-05-2026 mediante CodeGraph + revisión directa de código.
> Remediación ejecutada en 6 fases (branch `fix/auditoria-crud`, v1.11.0 → v1.15.1).
> Estado: ⬜ pendiente/diferido · ✅ resuelto · ➖ falso positivo descartado.
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
| PLAN-2 | No existía acción para asignar/cambiar plan | 🔴 | ✅ | `setInstitutionPlan` (SuperAdmin) en institutions/actions |
| PLAN-3 | El webhook nunca actualizaba `institution.plan` | 🔴 | ✅ | `handlePreapproval` sincroniza plan en `authorized` y degrada en `cancelled` |
| PLAN-4 | Cancelar/pausar no degradaba el plan | 🔴 | ✅ | `cancelSubscription` degrada la institución a FREE |
| PLAN-5 | No se podía crear/vincular suscripción manual | 🟠 | ✅* | Cubierto operativamente con `setInstitutionPlan`; no se crea registro `Subscription` manual (no necesario para la operación) |
| PLAN-6 | `quota.ts` leía `institution.plan` desincronizado | 🟠 | ✅ | `institution.plan` ahora se mantiene sincronizado (assign/webhook/cancel), elimina la divergencia |

Helper central: `src/features/subscriptions/lib/plan-sync.ts` (`activateInstitutionPlan`, `downgradeInstitutionToFree`).

---

## 2. Hallazgos sistémicos

| # | Hallazgo | Sev. | Estado | Resolución |
|---|---|---|---|---|
| SYS-1 | Contrato de error inconsistente | 🟠 | ✅* | students/groups/results/professors a `{data,error}`; exams create/update siguen lanzando pero capturados en UI |
| SYS-2 | Validación duplicada cliente/servidor (sin zodResolver) | 🟡 | ⬜ | Diferido — pulido; la validación servidor (safeParse) ya es la fuente de verdad |
| SYS-3 | IDOR cross-tenant (`where: { id }` sin institución) | 🔴 | ✅ | Scope por `institutionId` en students/groups/exams/professors/results vía `updateMany`/`deleteMany`/guards |
| SYS-4 | Bypass SuperAdmin roto en `/[slug]` | 🟠 | ✅ | `requireInstitutionAccess` resuelve la institución del SuperAdmin desde el slug |
| SYS-5 | Cache de límites incoherente entre instancias | 🟡 | ✅ | Reemplazado por memoización per-request con React `cache()` |

Helper central: `src/shared/lib/auth-guard.ts` (`requireInstitutionAccess`, `requireSuperAdmin`) y `src/shared/types/action.ts` (`ActionResult`, `ok`, `fail`, `toActionError`).

---

## 3. Acciones sin UI

| # | Hallazgo | Sev. | Estado | Resolución |
|---|---|---|---|---|
| UI-1 | `toggleExamActive` sin botón | 🔴 | ✅ | Ítem "Publicar/Despublicar" en ExamsClient |
| UI-2 | `toggleStudentActive` sin control | 🟠 | ✅ | Ítem "Activar/Desactivar" en StudentsClient |
| UI-3 | Se podía publicar examen sin preguntas | 🔴 | ✅ | Guard en `toggleExamActive`: no publica con 0 preguntas |

---

## 4. Campos editables / controles fantasma

| # | Hallazgo | Sev. | Estado | Resolución |
|---|---|---|---|---|
| FLD-1 | `stream`/`tutor` de grupo no editables | 🟠 | ✅ | Campos en el formulario + validación de tutor de la institución |
| FLD-2 | `antiCheat`/`lockTabSwitch` no editables en editor | 🟡 | ➖ | Editables vía "Ajustes de examen"; en el editor son solo lectura por diseño |
| FLD-3 | Búsqueda/filtros de StudentsClient decorativos | 🟡 | ✅ | Búsqueda + filtro por curso + filtro por estado funcionales |
| FLD-4 | Botón "Importar grupos" falso | 🟡 | ✅ | Botón removido |
| FLD-5 | `avgScore` de grupo siempre "—" | 🟡 | ⬜ | Diferido — se mantiene "—" honesto (sin dato calculado) en lugar de valor falso |

También eliminados: valores aleatorios dummy de Exámenes/Promedio y breadcrumb hardcodeado en StudentsClient.

---

## 5. Robustez y seguridad

| # | Hallazgo | Sev. | Estado | Resolución |
|---|---|---|---|---|
| ROB-1 | `deleteResult` sin validación/scope | 🟠 | ✅ | Scope por institución (vía examen) + contrato `{data,error}` |
| ROB-2 | No hay recalcular/reabrir resultado | 🟡 | ⬜ | Diferido — decisión de producto |
| ROB-3 | SuperAdmin podía autoeliminarse | 🟠 | ✅ | Guard `id === actor.id` en `deleteAdminUser` |
| ROB-4 | professors con `.parse()` sin try/catch + IDOR | 🟠 | ✅ | safeParse + `{data,error}` + scope de institución + bypass SuperAdmin |
| ROB-5 | `value` de AppConfig sin `maxLength` | 🟡 | ✅ | `max(2000)` en el schema |
| ROB-6 | profile sin `revalidatePath` servidor | 🟡 | ✅ | `revalidatePath('/perfil')` |
| ROB-7 | Unicidad fuera de transacción en signup | 🟠 | ➖ | Falso positivo: los constraints únicos de slug/email/rut garantizan integridad |
| ROB-8 | Suscripciones `pending` huérfanas sin GC | 🟡 | ⬜ | Diferido — requiere cron job de limpieza |
| ROB-9 | Profesor con acceso histórico a examen | 🟡 | ➖ | Falso positivo: `assertProfessorExamAccess` valida membresía actual en cada mutación |

---

## 6. Consistencia de UX

| # | Hallazgo | Sev. | Estado | Resolución |
|---|---|---|---|---|
| UX-1 | Falta toast de éxito | 🟡 | ✅ | Toasts en students/groups/exams/editor/professors |
| UX-2 | Borrado de grupo sin conteo de alumnos | 🟡 | ✅ | Mensaje con cantidad de alumnos afectados |
| UX-3 | Falta skeleton en editor de examen | 🟡 | ⬜ | Diferido — pulido visual |

---

## 7. Resumen de cierre

- **Fase 0** (v1.11.0): helper de autorización, IDOR + bypass SuperAdmin (students/groups), contrato `{data,error}`, cache de límites.
- **Fase 1** (v1.12.0): asignación de plan + sincronización webhook + degradación al cancelar.
- **Fase 2** (v1.13.0): publicar examen, bloqueo de examen vacío, IDOR exams.
- **Fase 3** (v1.14.0): stream + tutor editables en grupos.
- **Fase 4** (v1.15.0): deleteResult, anti-autoeliminación, professors endurecido, config, perfil.
- **Fase 5** (v1.15.1): toasts de confirmación.

**Diferidos** (no críticos): SYS-2 (zodResolver), FLD-5 (promedio de grupo), ROB-2 (recalcular resultado), ROB-8 (GC de suscripciones pendientes vía cron), UX-3 (skeleton).
**Falsos positivos descartados**: FLD-2, ROB-7, ROB-9, y la sospecha inicial de que `updateStudent` no persistía `groupId`.

Verificación: `pnpm type-check` sin errores; `pnpm lint` sin errores (solo warnings preexistentes de complejidad/keys). Sin push ni deploy. No se requirieron migraciones de Prisma (los campos de plan ya existían en el schema).
