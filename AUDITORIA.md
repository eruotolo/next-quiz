# Auditoría de CRUD y Usabilidad — Aulika

> Documento de seguimiento. Generado el 29-05-2026 mediante CodeGraph + revisión directa de código.
> Estado de cada ítem: ⬜ pendiente · 🟦 en progreso · ✅ resuelto.
> Confianza: ✅ verificado leyendo código · 🔸 detectado en barrido (confirmar antes del fix).

## Leyenda de severidad
- 🔴 Crítico — rompe una operación o genera inconsistencia de datos/seguridad.
- 🟠 Alto — deuda funcional o de seguridad relevante.
- 🟡 Medio/Bajo — robustez, consistencia o pulido de UX.

---

## 1. Gap insignia — Ciclo de vida del plan de una institución

La cadena de asignación de plan está rota de extremo a extremo.

| # | Hallazgo | Evidencia | Sev. | Conf. | Estado |
|---|---|---|---|---|---|
| PLAN-1 | El formulario de alta/edición de institución no permite elegir `plan`, `email`, `planExpiresAt` ni dominios permitidos | `institution.schemas.ts:3-16`; `InstitutionsClient.tsx` (InstitutionForm) | 🔴 | ✅ | ⬜ |
| PLAN-2 | No existe acción para asignar/cambiar el plan de una institución manualmente | `institutions/actions/mutations.ts` (solo create/update/delete/toggle, `update` usa `parsed.data`) | 🔴 | ✅ | ⬜ |
| PLAN-3 | El webhook de MercadoPago nunca actualiza `institution.plan` ni `planExpiresAt` | `app/api/webhooks/mercadopago/route.ts` (solo toca `Subscription`) | 🔴 | ✅ | ⬜ |
| PLAN-4 | Cancelar/pausar una suscripción no degrada el plan de la institución | `admin-plan/actions/mutations.ts:169-244` | 🔴 | ✅ | ⬜ |
| PLAN-5 | No se puede crear una suscripción manual ni vincularla a una institución desde el panel | `admin-plan/actions/mutations.ts` | 🟠 | ✅ | ⬜ |
| PLAN-6 | `quota.ts` enforce límites leyendo `institution.plan`, que queda desincronizado del estado real de pago | `subscriptions/lib/quota.ts` | 🟠 | ✅ | ⬜ |

---

## 2. Hallazgos sistémicos (transversales)

| # | Hallazgo | Evidencia | Sev. | Conf. | Estado |
|---|---|---|---|---|---|
| SYS-1 | Contrato de error inconsistente: actions que lanzan (`.parse`/`throw`) vs actions que retornan `{data,error}` | students/groups/exams/professors/results vs admin-users/profile/institutions | 🟠 | ✅ | ⬜ |
| SYS-2 | Validación duplicada cliente/servidor (sin `zodResolver`) | StudentsClient, GroupsClient, ExamsClient, ExamEditorClient | 🟡 | ✅ | ⬜ |
| SYS-3 | IDOR cross-tenant: `where: { id }` sin `academicInstitutionId` | `students/actions/mutations.ts:72-73, 94-96`; revisar professors | 🔴 | ✅ | ⬜ |
| SYS-4 | Bypass de SuperAdmin roto en rutas `/[slug]`: `if (!slug) throw` con `institutionSlug=null` | `students/actions/mutations.ts:56-57, 87-89` | 🟠 | ✅ | ⬜ |
| SYS-5 | Caché de límites en memoria (60s, por instancia) incoherente en Vercel multi-instancia | `subscriptions/lib/plan-limits.ts` | 🟡 | ✅ | ⬜ |

---

## 3. Acciones sin UI (operación "muerta")

| # | Hallazgo | Evidencia | Sev. | Conf. | Estado |
|---|---|---|---|---|---|
| UI-1 | `toggleExamActive` existe pero no hay botón "Publicar" en la UI | `exams/actions/mutations.ts:141`; sin invocación en ExamsClient | 🔴 | 🔸 | ⬜ |
| UI-2 | `toggleStudentActive` existe pero no hay control en StudentsClient | `students/actions/mutations.ts:109-138` | 🟠 | 🔸 | ⬜ |
| UI-3 | Se puede publicar un examen sin preguntas (sin validación pre-publicación) | exams (sin check de count) | 🔴 | 🔸 | ⬜ |

---

## 4. Campos no editables / controles fantasma

| # | Hallazgo | Evidencia | Sev. | Conf. | Estado |
|---|---|---|---|---|---|
| FLD-1 | `stream` y `tutor` de grupo se muestran pero no son editables | `GroupsClient.tsx`; `group.schemas.ts` solo tiene `name` | 🟠 | 🔸 | ⬜ |
| FLD-2 | `antiCheatEnabled`/`lockTabSwitch` no editables en el editor de examen | `ExamEditorClient.tsx:524-559` (read-only) | 🟡 | 🔸 | ⬜ |
| FLD-3 | Búsqueda y filtros de StudentsClient sin `onChange` (decorativos) | `StudentsClient.tsx:385-397` | 🟡 | 🔸 | ⬜ |
| FLD-4 | Botón "Importar grupos" solo muestra "próximamente" | `GroupsClient.tsx:176` | 🟡 | 🔸 | ⬜ |
| FLD-5 | `avgScore` de grupo siempre muestra "—" pese a calcularse en query | `GroupsClient.tsx`; `groups/actions/queries.ts:60-63` | 🟡 | 🔸 | ⬜ |

---

## 5. Robustez y seguridad

| # | Hallazgo | Evidencia | Sev. | Conf. | Estado |
|---|---|---|---|---|---|
| ROB-1 | `deleteResult` sin Zod ni try/catch; no valida existencia | `results/actions/mutations.ts:10-30` | 🟠 | 🔸 | ⬜ |
| ROB-2 | No existe recalcular resultado ni reabrir intento | results (sin acción) | 🟡 | 🔸 | ⬜ |
| ROB-3 | SuperAdmin puede autoeliminarse (riesgo de lockout) | `admin-users/actions/mutations.ts:143-166` | 🟠 | 🔸 | ⬜ |
| ROB-4 | professors usa `.parse()` sin safeParse y sin try/catch → 500 sin feedback | `professors/actions/mutations.ts:64,104` | 🟠 | 🔸 | ⬜ |
| ROB-5 | `value` de AppConfig sin `maxLength` (riesgo de blobs gigantes) | `config/actions/app-config.ts:52` | 🟡 | 🔸 | ⬜ |
| ROB-6 | profile no usa `revalidatePath` servidor (solo `router.refresh`) | `profile/actions/mutations.ts` | 🟡 | 🔸 | ⬜ |
| ROB-7 | Chequeo de unicidad fuera de transacción en signup (race condition) | `subscriptions/actions/signup.ts:64-70, 269-275` | 🟠 | 🔸 | ⬜ |
| ROB-8 | Suscripciones `pending` huérfanas sin garbage collection | `subscriptions/actions/signup.ts` | 🟡 | 🔸 | ⬜ |
| ROB-9 | Profesor conserva acceso histórico a examen tras salir de todos sus grupos | `exams/actions/mutations.ts:44-50` | 🟡 | 🔸 | ⬜ |

---

## 6. Consistencia de UX

| # | Hallazgo | Evidencia | Sev. | Conf. | Estado |
|---|---|---|---|---|---|
| UX-1 | Falta toast de éxito en exams, exam-editor, groups y students locales | varios Client | 🟡 | 🔸 | ⬜ |
| UX-2 | Confirmación de borrado de grupo sin conteo de alumnos afectados | `GroupsClient.tsx` | 🟡 | 🔸 | ⬜ |
| UX-3 | Faltan estados vacíos/skeleton en vistas pesadas (editor de examen) | ExamEditorClient | 🟡 | 🔸 | ⬜ |

---

## 7. Plan de remediación por fases

- **Fase 0 — Cimientos transversales** (`/backend-agent`): SYS-1, SYS-3, SYS-4, SYS-5, ROB-7.
- **Fase 1 — Ciclo de vida del plan** (`/backend-agent` → `/frontend-agent`): PLAN-1 a PLAN-6.
- **Fase 2 — Integridad de exámenes y acciones invisibles** (`/backend-agent` + `/frontend-agent`): UI-1, UI-2, UI-3, ROB-9.
- **Fase 3 — Campos editables y controles fantasma** (`/frontend-agent` + schema `/backend-agent`): FLD-1 a FLD-5.
- **Fase 4 — Robustez y guardarraíles** (`/backend-agent` + `/frontend-agent`): ROB-1 a ROB-6, ROB-8.
- **Fase 5 — Consistencia de UX** (`/frontend-agent`): UX-1, UX-2, UX-3, SYS-2.

Regla de coordinación: cada fase con código requiere invocar el agente correspondiente antes de implementar. Commits vía `/github-agent`.

## Falso positivo descartado
- ~~`updateStudent` no persiste `groupId`~~: descartado. `studentSchema` incluye `groupId` y se guarda con `data: parsed` (`students/actions/mutations.ts:72-73`).
