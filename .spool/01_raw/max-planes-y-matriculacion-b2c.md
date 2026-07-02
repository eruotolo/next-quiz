# Plan de Implementación: Planes Dinámicos + Venta B2C (Preuniversitarios)

> **Estado:** Plan Operativo (Max)  
> **Fuente:** `.spool/01_raw/gemini-planes-y-matriculacion-b2c.md` (Gemini 3.5)  
> **Ubicación:** `.spool/01_raw/max-planes-y-matriculacion-b2c.md`  
> **Objetivo:** Traducir la especificación de Gemini a un plan ejecutable, validado contra el código actual, minimizando breaking changes y maximizando reuso de la infra existente.

---

## 0. Resumen ejecutivo

El documento Gemini propone tres grandes cambios:

1. **`PlanLimits.planCode` String** — desacoplar los límites del enum `Plan`.
2. **Flags de producto `examsEnabled` / `lmsEnabled`** — venta independiente de Exámenes y LMS.
3. **Checkout B2C público** — auto-inscripción pagada de estudiantes a cursos LMS individuales.

Después de mapear contra el código actual, **mi propuesta es NO aceptar literalmente la propuesta 1** (rompe el enum en producción) y resolver la necesidad real con un **plan híbrido**: enum comercial vigente + capa de `planCode` opcional + flags de producto. La propuesta 2 se adopta tal cual. La propuesta 3 se adopta con un cambio importante: usar **preference (pago único)** de MercadoPago en vez de preapproval, porque es lo correcto para una compra no recurrente.

### Decisiones clave (resumen)

| # | Decisión | Justificación |
|---|---|---|
| D1 | Mantener `PlanLimits.plan` enum + agregar `planCode String?` opcional con `@@unique([plan, planCode])` | Evita renombrar columna y migrar 5 lugares (`plan-limits.ts`, `quota.ts`, `webhook`, `upgrade.ts`, UI SuperAdmin). Permite packs nuevos sin alterar enum. |
| D2 | Instituciones nuevas tienen `examsEnabled=true` y `lmsEnabled=false` por defecto | Mantiene el comportamiento actual para FREE (sólo exámenes). Backfill activa LMS sólo para instituciones con plan pago vigente. |
| D3 | `CustomPlan` se duplica en **fase futura**: `customPlanId` sigue siendo global por ahora | YAGNI. Un CustomPlan "LMS Ilimitado" cubre la necesidad inmediata; separar por producto se decide tras feedback de clientes. |
| D4 | Checkout usa `preference` (pago único), NO `preapproval` | El documento habla de compra de curso, no suscripción. MercadoPago maneja ambos con APIs distintas. Preference es la correcta. |
| D5 | Rutas por path (`/[slug]/cursos`, `/[slug]/checkout/[courseId]`), NO subdominio `aula.aulika.cl` | El proxy actual está armado sobre paths. Multi-subdominio requiere cambio de infra y DNS. |
| D6 | Catálogo público NO entra al sitemap estático en fase 1 | Las URLs son dinámicas por institución → sitemap dinámico con `revalidate` es fase 2. Priorizar el flujo de pago. |
| D7 | Webhook MP se extiende con `handlePreferencePayment(dataId)` | Nuevo topic `payment` con `external_reference = LmsOrder.id` ya distingue de suscripciones por preapproval. |

---

## 1. Mapeo del documento Gemini contra el código actual

### 1.1 Lo que ya existe (reusable tal cual)

| Componente Gemini | Existe en | Reusable |
|---|---|---|
| `getPlanLimits` | `src/features/subscriptions/lib/plan-limits.ts` | ✅ Sí, con cambio de firma |
| `quota.ts` (cuotas) | `src/features/subscriptions/lib/quota.ts` | ✅ Sí, con cambio de firma |
| `mercadopago.ts` (preapproval) | `src/features/subscriptions/lib/mercadopago.ts` | ✅ Sí — sumar `createPreference` |
| Webhook MP | `src/app/api/webhooks/mercadopago/route.ts` | ✅ Sí — extender con `handlePreferencePayment` |
| `requireInstitutionPageAccess` | `src/features/auth/lib/auth-guard.ts` | ✅ Sí — ya valida scope de institución |
| `audit.ts` | `src/shared/lib/audit.ts` | ✅ Sí — agregar acciones nuevas |
| Sidebar dinámico | `src/features/dashboard/components/Sidebar.tsx` (mencionado en AGENTS.md) | ✅ Sí — leer flags de institución |
| `LmsEnrollment` | `prisma/schema.prisma:756` | ✅ Sí — modelo ya existe |
| `LmsCourse.published` | `prisma/schema.prisma:676` | ✅ Sí — reutilizar para gating de `isPublic` |
| `RutField` + `RUT_MASK` | `src/shared/components/ui/rut-field.tsx` | ✅ Sí — formulario de checkout |
| `email.ts` (Brevo) | `src/shared/lib/email.ts` | ✅ Sí — bienvenida del estudiante B2C |

### 1.2 Lo que NO existe y hay que crear

| Componente | Crear | Notas |
|---|---|---|
| `LmsCourse.isPublic` + `price` | Schema + editor admin | Extender el form de creación de curso |
| `LmsOrder` model + `OrderStatus` enum | Schema + actions + webhook handler | Trazabilidad de pagos B2C |
| `AcademicInstitution.examsEnabled/lmsEnabled` + `examsPlanCode/lmsPlanCode` + expiraciones | Schema + backfill | Requiere default + migración cuidadosa |
| `PlanLimits.planCode` opcional | Schema + UI admin + backfill | Soft-add, sin romper enum |
| Ruta `(public)/[slug]/cursos` | Nueva | Catálogo público, sin auth |
| Ruta `(public)/[slug]/checkout/[courseId]` | Nueva | Form RUT + nombre + email |
| Server action `createLmsOrderPreference` | Nuevo | Llama `createPreference` de MP |
| `createPreference()` en `mercadopago.ts` | Nuevo | API `checkout/preferences` |
| Sidebar hide sección Aula si `lmsEnabled=false` | Modificar `Sidebar.tsx` | Layout admin lee flag |
| Layout `/students/aula` valida `lmsEnabled` | Modificar `(students)/students/aula/page.tsx` | Render error si flag apagado |
| Email bienvenida estudiante B2C | Nuevo template en `email.ts` | Con credenciales temporales |

### 1.3 Lo que Gemini propone y voy a RECHAZAR o RECHAZAR PARCIALMENTE

- **❌ Renombrar `PlanLimits.plan` → `planCode` (literalmente).**  
  Razón: rompe `prisma/schema.prisma`, `plan-limits.ts`, `quota.ts`, `upgrade.ts`, el webhook, la UI `PlanLimitsClient.tsx`, el seeder `prisma/seed.ts` y todos los `CustomPlan` que referencian `plan` indirectamente. Riesgo altísimo en producción.  
  **Mitigación:** Mantener `plan` enum + agregar `planCode String?` opcional con `@@unique([plan, planCode])`. Los packs nuevos (ej. "lms_colegio") se identifican por `planCode`. Los packs viejos se identifican por `plan`.

- **❌ Soft-delete o políticas de reembolso para LmsCourse.**  
  Razón: NO está en el documento Gemini explícitamente, pero es un edge case. Decisión: en fase 1, **NO permitir borrar un curso con órdenes APROBADAS** (constraint de UI + acción). Reembolso queda fuera de scope.

- **❌ Multi-subdominio (`aula.aulika.cl`).**  
  Razón: el proxy actual rutea por path. Migrar a subdominios requiere cambio de `vercel.json`, DNS wildcard y reescritura de auth. Mantener paths por consistencia.

- **⚠️ Reemplazar `AcademicInstitution.plan` por flags puros.**  
  Razón: el campo `plan` sigue siendo útil para el upgrade page y para distinguir "qué pack comercial compró la institución". **Mantenerlo**, agregar flags al lado.

---

## 2. Cambios en schema Prisma (DB-first)

### 2.1 Migración 1: `20260701000000_plan_codes_and_product_flags`

```prisma
// PlanLimits — agregar planCode opcional (backward compatible)
model PlanLimits {
  id              String   @id @default(uuid()) @db.Uuid
  plan            Plan     // se mantiene como "categoría comercial"
  planCode        String?  // NUEVO: código único del pack (ej: "lms_colegio"). Permite packs sin alterar enum.
  maxGroups       Int?
  maxAdmins       Int?
  maxProfessors   Int?
  maxStudents     Int?
  maxExamsPerYear Int?
  maxPrograms     Int?
  maxCourses      Int?
  description     String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@unique([plan, planCode])  // un planCode por plan comercial; NULL permitido por plan
  @@index([planCode])
}

// AcademicInstitution — flags de producto independientes
model AcademicInstitution {
  // ... existentes ...
  plan                Plan     @default(FREE)
  planExpiresAt       DateTime?

  // Flags de producto (NUEVO)
  examsEnabled        Boolean  @default(true)   // FREE mantiene acceso a exámenes
  examsPlanCode       String?                  // ej: "exams_free", "exams_colegio"
  examsPlanExpiresAt  DateTime?

  lmsEnabled          Boolean  @default(false)  // LMS apagado por defecto; se activa por upgrade
  lmsPlanCode         String?                  // ej: "lms_free", "lms_colegio", "lms_pack_completo"
  lmsPlanExpiresAt    DateTime?

  // ... resto sin cambios ...
}

// CustomPlan — agregar scope opcional (NUEVO)
// Por ahora NULL = aplica a ambos productos; futuro: "lms" / "exams" para separar.
model CustomPlan {
  // ... existentes ...
  productScope        String?  // NULL = ambos; futuro: "lms" | "exams"
  // ... resto sin cambios ...
}
```

**Backfill obligatorio en la migración SQL:**
```sql
-- 1) Activar LMS en instituciones que ya pagan plan pago y tienen cursos LMS
UPDATE "AcademicInstitution" ai
SET "lmsEnabled" = true,
    "lmsPlanCode" = 'lms_' || lower(ai.plan::text)
WHERE ai.plan IN ('COLEGIO', 'INSTITUCIONAL')
  AND ai."planExpiresAt" IS NULL OR ai."planExpiresAt" > NOW();

-- 2) Backfill examsPlanCode
UPDATE "AcademicInstitution"
SET "examsPlanCode" = 'exams_' || lower(plan::text)
WHERE "examsPlanCode" IS NULL;

-- 3) Backfill PlanLimits.planCode para los registros existentes
UPDATE "PlanLimits"
SET "planCode" = 'exams_' || lower(plan::text)
WHERE "planCode" IS NULL;
```

### 2.2 Migración 2: `20260701010000_lms_public_courses_and_orders`

```prisma
// LmsCourse — campos B2C
model LmsCourse {
  // ... existentes ...
  isPublic      Boolean  @default(false)  // aparece en catálogo público
  price         Float?                   // CLP; null/0 = gratis
  // ... resto sin cambios ...

  @@index([isPublic, published])
  @@index([academicInstitutionId, isPublic])
}

// Nueva orden de compra B2C
enum OrderStatus {
  PENDIENTE
  APROBADO
  RECHAZADO
}

model LmsOrder {
  id              String      @id @default(uuid()) @db.Uuid
  studentRut      String      // RUT normalizado (sin puntos/guión)
  studentName     String
  studentLastname String
  studentEmail    String
  courseId        String      @db.Uuid
  course          LmsCourse   @relation(fields: [courseId], references: [id], onDelete: Restrict)
  amount          Float       // CLP; snapshot al momento de la compra
  status          OrderStatus @default(PENDIENTE)
  mpPreferenceId  String?     // ID de preference (no preapproval)
  mpPaymentId     String?     @unique
  // Resultado: si el pago fue aprobado, qué usuario se creó/activó y qué enrollment se hizo
  enrolledUserId  String?     @db.Uuid
  enrollmentId    String?     @db.Uuid
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt

  @@index([courseId])
  @@index([studentRut])
  @@index([status])
  @@index([createdAt])
}
```

**Por qué `onDelete: Restrict` y no `Cascade`:** un curso con órdenes históricas NO debe poder borrarse. La UI debe ocultar el botón "Eliminar" cuando `lmsOrders` count > 0.

### 2.3 Validación del schema

```bash
pnpm db:generate
pnpm db:migrate dev --name 20260701000000_plan_codes_and_product_flags
pnpm db:migrate dev --name 20260701010000_lms_public_courses_and_orders
pnpm db:seed           # verifica que los seeds siguen pasando
pnpm type-check
```

---

## 3. Cambios en lib (sin breaking changes)

### 3.1 `src/features/subscriptions/lib/plan-limits.ts`

```typescript
import type { Plan, PlanLimits } from '@prisma/client';
import { cache } from 'react';
import { prisma } from '@/shared/lib/prisma';

/**
 * Resuelve los límites efectivos de un (plan, planCode) dado.
 * El lookup es por `planCode` si está presente; si no, por `plan`.
 * Esto permite packs viejos (identificados por enum) coexistir con packs
 * nuevos (identificados por código libre) sin migrar el enum.
 */
export const getPlanLimits = cache(
    async (plan: Plan, planCode?: string | null): Promise<PlanLimits> => {
        const where = planCode
            ? { plan_planCode: { plan, planCode } }   // composite unique
            : { plan, planCode: null };                // solo el enum

        const limits = await prisma.planLimits.findUnique({ where });
        if (!limits) throw new Error(`PlanLimits not found: plan=${plan}, planCode=${planCode}`);
        return limits;
    },
);

/** Invalidador (compatibilidad — actualmente no-op). */
export function invalidatePlanLimitsCache(plan?: Plan): void {
    void plan;
}
```

⚠️ **Cuidado:** cambiar la firma de `getPlanLimits(plan)` → `getPlanLimits(plan, planCode?)` rompe todos los llamadores. Estrategia: hacer **backwards-compatible** con default `planCode=null` en todos los call sites.

### 3.2 `src/features/subscriptions/lib/quota.ts`

```typescript
// getEffectiveLimits(): agregar lectura de flags de la institución
async function getEffectiveLimits(institutionId: string) {
    const institution = await prisma.academicInstitution.findUnique({
        where: { id: institutionId },
        select: {
            plan: true,
            examsPlanCode: true,   // NUEVO
            lmsPlanCode: true,     // NUEVO
            examsEnabled: true,    // NUEVO
            lmsEnabled: true,      // NUEVO
            customPlan: { /* ... */ },
        },
    });
    // ...
}
```

Y la nueva API:
```typescript
/**
 * Límites efectivos por producto. La UI llama esto con `product='exams' | 'lms'`
 * para saber si la institución puede crear exámenes o cursos LMS.
 */
export async function getProductLimits(
    institutionId: string,
    product: 'exams' | 'lms',
): Promise<{ limits: EffectiveLimits; label: string; enabled: boolean; expiresAt: Date | null }>
```

`product='lms'` debe respetar `lmsEnabled`. Si el flag es `false`, devuelve `enabled: false` independientemente de CustomPlan.

### 3.3 `src/features/subscriptions/lib/mercadopago.ts` — sumar `createPreference`

```typescript
interface CreatePreferenceParams {
    title: string;
    quantity: number;
    unitPrice: number;
    currencyId?: 'CLP';
    externalReference: string;  // LmsOrder.id
    payerEmail: string;
    backUrl: { success: string; failure: string; pending: string };
}

export interface CreatePreferenceResult {
    initPoint: string;
    preferenceId: string;
}

export async function createPreference(
    params: CreatePreferenceParams,
): Promise<CreatePreferenceResult> {
    const token = process.env.MP_ACCESS_TOKEN;
    if (!token) throw new Error('MP_ACCESS_TOKEN is not set');

    const res = await fetch('https://api.mercadopago.com/checkout/preferences', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            items: [{
                title: params.title,
                quantity: params.quantity,
                unit_price: params.unitPrice,
                currency_id: params.currencyId ?? 'CLP',
            }],
            external_reference: params.externalReference,
            payer: { email: params.payerEmail },
            back_urls: params.backUrl,
            auto_return: 'approved',
        }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message ?? `MP error ${res.status}`);
    return {
        initPoint: data.init_point,
        preferenceId: data.id,
    };
}
```

### 3.4 `src/features/subscriptions/lib/plan-sync.ts` — agregar helpers por producto

```typescript
/**
 * Activa un producto específico (exams o lms) en la institución. Usado por:
 * - Webhook de MP cuando se aprueba una preferencia B2C de un curso LMS.
 * - UI SuperAdmin cuando asigna manualmente un pack.
 */
export async function enableProduct(
    institutionId: string,
    product: 'exams' | 'lms',
    planCode: string,
    expiresAt: Date | null,
): Promise<void> {
    await prisma.academicInstitution.update({
        where: { id: institutionId },
        data: product === 'exams'
            ? { examsEnabled: true, examsPlanCode: planCode, examsPlanExpiresAt: expiresAt }
            : { lmsEnabled: true, lmsPlanCode: planCode, lmsPlanExpiresAt: expiresAt },
    });
}

export async function disableProduct(
    institutionId: string,
    product: 'exams' | 'lms',
): Promise<void> {
    await prisma.academicInstitution.update({
        where: { id: institutionId },
        data: product === 'exams'
            ? { examsEnabled: false, examsPlanExpiresAt: null }
            : { lmsEnabled: false, lmsPlanExpiresAt: null },
    });
}
```

⚠️ `activateInstitutionPlan` y `downgradeInstitutionToFree` se **mantienen** (para self-service upgrade de Admin). Se complementan con `enableProduct`/`disableProduct`.

---

## 4. Cambios en routing y proxy

### 4.1 `src/proxy.ts` — agregar paths públicos y gating por producto

```typescript
const PUBLIC_PREFIXES = [
    '/_next', '/api', '/favicon.ico',
    '/demo', '/login', '/paes', '/audiencias', '/empresa', '/recursos',
    '/registro', '/certificado',
    // NUEVOS para B2C
    // Cuidado: '/[slug]/cursos' y '/[slug]/checkout' NO matchean aquí porque
    // tienen slug dinámico. Se manejan explícitamente abajo.
];

export default auth((req: NextAuthRequest) => {
    const { pathname } = req.nextUrl;
    // ... existentes ...

    // ── B2C público ────────────────────────────────────────────
    // Match: /<slug>/cursos y /<slug>/checkout/*
    const b2cMatch = pathname.match(/^\/([^/]+)\/(cursos|checkout)(\/.*)?$/);
    if (b2cMatch) {
        // Pasa sin auth. La lógica de gating (lmsEnabled, curso isPublic) vive
        // en el page.tsx correspondiente con prisma directo.
        return next();
    }

    // ── Estudiantes con LMS activo ─────────────────────────────
    if (pathname.startsWith('/students/aula') || pathname.startsWith('/students/cursos')) {
        // El session jose se valida en el layout server-side; aquí solo dejamos pasar.
        // El layout hace el check de lmsEnabled de la institución del estudiante.
        return protectedResponse;
    }

    // ... resto sin cambios ...
});
```

**Riesgo:** el matcher regex puede matchear falsos positivos (ej. `/config/cursos` no existe, pero `/login` ya está en PUBLIC_PREFIXES). Validar manualmente con `pnpm dev` y curl a cada ruta.

### 4.2 Nuevas rutas

```
src/app/(public)/
├── [slug]/
│   ├── layout.tsx                 ← NUEVO: layout público con branding institución
│   ├── cursos/
│   │   └── page.tsx               ← NUEVO: catálogo público
│   └── checkout/
│       ├── [courseId]/
│       │   └── page.tsx           ← NUEVO: form checkout
│       └── success/
│           └── page.tsx           ← NUEVO: post-pago, polling
```

**Restricciones del layout `(public)/[slug]/layout.tsx`:**
- Sin auth requerida.
- Lee `AcademicInstitution` por slug → si `lmsEnabled=false`, devuelve 404 (la institución no vende cursos).
- Lee `seoTitle`, `seoDescription`, `seoKeywords` para `<head>`.
- Aplica `X-Robots-Tag: all` (SÍ indexable, a diferencia de las rutas admin).

**`/cursos/page.tsx` (catálogo público):**
- Query: `LmsCourse.findMany({ where: { institution: { slug, lmsEnabled: true }, isPublic: true, published: true } })`
- Render: grid de tarjetas (reutilizar `Card` de `src/shared/components/ui/card.tsx`).
- Cada tarjeta: imagen de portada (Cloudinary), título, descripción corta, precio formateado CLP, botón "Inscribirme" → `/[slug]/checkout/[courseId]`.

**`/checkout/[courseId]/page.tsx`:**
- Server component. Lee `LmsCourse` por id + valida `isPublic=true && published=true && institution.lmsEnabled=true`.
- Si falla → 404.
- Si pasa, renderiza `<CheckoutForm course={...} />` (client component):
  - `RutField` canónico.
  - Inputs nombre, apellido, email.
  - Botón "Pagar con MercadoPago".
- Submit → server action `createLmsCheckoutPreference`.

---

## 5. Server actions y webhook

### 5.1 Nueva action `createLmsCheckoutPreference`

`src/features/lms/actions/checkout.ts` (NUEVO):

```typescript
'use server';

import { z } from 'zod';
import { prisma } from '@/shared/lib/prisma';
import { createPreference } from '@/features/subscriptions/lib/mercadopago';
import { fail, ok, toActionError, type ActionResult } from '@/shared/types/action';
import { normalizeRut } from '@/shared/lib/rut';
import { logAudit } from '@/shared/lib/audit';
import { AUDIT_ACTION } from '@/features/audit/lib/actions';

const checkoutSchema = z.object({
    courseId: z.string().uuid(),
    studentRut: z.string().min(8).max(12),
    studentName: z.string().min(2).max(80),
    studentLastname: z.string().min(2).max(80),
    studentEmail: z.string().email(),
});

export async function createLmsCheckoutPreference(
    input: z.input<typeof checkoutSchema>,
): Promise<ActionResult<{ initPoint: string; orderId: string }>> {
    try {
        const parsed = checkoutSchema.parse(input);

        const course = await prisma.lmsCourse.findUnique({
            where: { id: parsed.courseId },
            select: {
                id: true,
                title: true,
                price: true,
                isPublic: true,
                published: true,
                academicInstitutionId: true,
                academicInstitution: {
                    select: { id: true, slug: true, lmsEnabled: true, name: true },
                },
            },
        });

        // Precondiciones
        if (!course || !course.isPublic || !course.published) {
            return fail('Curso no disponible para compra.');
        }
        if (!course.academicInstitution.lmsEnabled) {
            return fail('La institución no tiene el LMS activo.');
        }
        if (!course.price || course.price <= 0) {
            return fail('Curso gratuito no requiere pago.');
        }

        const rut = normalizeRut(parsed.studentRut);

        // Verificar que el RUT no esté ya inscripto a este curso
        const existingUser = await prisma.user.findUnique({
            where: { rut },
            select: { id: true, academicInstitutionId: true },
        });
        if (existingUser) {
            const alreadyEnrolled = await prisma.lmsEnrollment.findUnique({
                where: { userId_courseId: { userId: existingUser.id, courseId: course.id } },
                select: { id: true },
            });
            if (alreadyEnrolled) {
                return fail('Ya estás inscripto en este curso. Inicia sesión para acceder.');
            }
            // Si está en otra institución, bloquear (decisión de seguridad B2C)
            if (
                existingUser.academicInstitutionId &&
                existingUser.academicInstitutionId !== course.academicInstitutionId
            ) {
                return fail(
                    'Tu RUT ya está registrado en otra institución. Contacta a soporte.',
                );
            }
        }

        // Crear orden PENDIENTE
        const order = await prisma.lmsOrder.create({
            data: {
                studentRut: rut,
                studentName: parsed.studentName,
                studentLastname: parsed.studentLastname,
                studentEmail: parsed.studentEmail,
                courseId: course.id,
                amount: course.price,
                status: 'PENDIENTE',
            },
            select: { id: true },
        });

        const baseUrl = process.env.AUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? 'https://aulika.cl';
        const { initPoint, preferenceId } = await createPreference({
            title: `Curso: ${course.title} (${course.academicInstitution.name})`,
            quantity: 1,
            unitPrice: course.price,
            externalReference: order.id,
            payerEmail: parsed.studentEmail,
            backUrl: {
                success: `${baseUrl}/${course.academicInstitution.slug}/checkout/success?order=${order.id}`,
                failure: `${baseUrl}/${course.academicInstitution.slug}/checkout?error=1`,
                pending: `${baseUrl}/${course.academicInstitution.slug}/checkout/success?order=${order.id}&pending=1`,
            },
        });

        await prisma.lmsOrder.update({
            where: { id: order.id },
            data: { mpPreferenceId: preferenceId },
        });

        await logAudit({
            action: AUDIT_ACTION.LMS_ORDER_CREATE,
            actorEmail: parsed.studentEmail,
            actorRole: 'Estudiante (B2C)',
            academicInstitutionId: course.academicInstitutionId,
            entity: 'LmsOrder',
            entityId: order.id,
            metadata: { courseId: course.id, amount: course.price },
        });

        return ok({ initPoint, orderId: order.id });
    } catch (err) {
        return fail(toActionError(err, 'No se pudo iniciar el pago.'));
    }
}
```

### 5.2 Extender webhook MP — `handlePreferencePayment`

`src/app/api/webhooks/mercadopago/route.ts`:

```typescript
async function handlePreferencePayment(dataId: string, token: string): Promise<void> {
    const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${dataId}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!mpRes.ok) return;

    const payment = await mpRes.json() as {
        status?: string;
        transaction_amount?: number;
        external_reference?: string;  // LmsOrder.id
        payer?: { email?: string };
    };

    if (!payment.external_reference) return;

    // Diferenciar de suscripciones por preapproval (no tienen LmsOrder)
    const order = await prisma.lmsOrder.findUnique({
        where: { id: payment.external_reference },
        select: {
            id: true,
            status: true,
            studentRut: true,
            studentName: true,
            studentLastname: true,
            studentEmail: true,
            courseId: true,
            course: {
                select: { academicInstitutionId: true, title: true },
            },
        },
    });
    if (!order) return;  // no es una orden B2C; ya manejada por handlePayment

    // Idempotencia
    if (order.status === 'APROBADO') return;

    if (payment.status !== 'approved') {
        await prisma.lmsOrder.update({
            where: { id: order.id },
            data: {
                status: payment.status === 'rejected' ? 'RECHAZADO' : 'PENDIENTE',
                mpPaymentId: dataId,
            },
        });
        return;
    }

    // ── APROBADO: matriculación atómica ─────────────────────────────
    const result = await prisma.$transaction(async (tx) => {
        // 1) Upsert del User
        const user = await tx.user.upsert({
            where: { rut: order.studentRut },
            create: {
                rut: order.studentRut,
                name: order.studentName,
                lastname: order.studentLastname,
                email: order.studentEmail,
                password: await hashPassword(generateTempPassword()),
                active: true,
                userRole: { connect: { name: 'Estudiante' } },
                academicInstitution: {
                    connect: { id: order.course.academicInstitutionId },
                },
            },
            update: { active: true },
            select: { id: true },
        });

        // 2) Crear enrollment
        const enrollment = await tx.lmsEnrollment.upsert({
            where: { userId_courseId: { userId: user.id, courseId: order.courseId } },
            create: {
                userId: user.id,
                courseId: order.courseId,
                status: 'ACTIVO',
            },
            update: { status: 'ACTIVO' },
            select: { id: true },
        });

        // 3) Marcar orden APROBADA
        await tx.lmsOrder.update({
            where: { id: order.id },
            data: {
                status: 'APROBADO',
                mpPaymentId: dataId,
                enrolledUserId: user.id,
                enrollmentId: enrollment.id,
            },
        });

        return { userId: user.id, enrollmentId: enrollment.id };
    });

    // 4) Email bienvenida (fire-and-forget, fuera de la transacción)
    void sendWelcomeEmailB2C({
        email: order.studentEmail,
        name: order.studentName,
        tempPassword: '...', // ⚠️ Problema: ya no la tenemos porque está hasheada
    }).catch(console.error);
}
```

⚠️ **PROBLEMA con `tempPassword`:** el flujo actual genera, hashea y guarda, pero no podemos enviarla por email porque ya no la tenemos. **Solución:** generar la password ANTES de hashear y devolverla de la transacción (no es ideal persistirla, pero es necesario para entregarla al usuario). Alternativa: generar un link de "primera activación" con token temporal hasheado en DB y enviarlo por email; el estudiante setea su propia contraseña al primer login. **Decisión recomendada:** **link de activación**, no enviar contraseña plana.

### 5.3 Token de activación de cuenta

Agregar a `User`:
```prisma
model User {
    // ... existentes ...
    activationToken    String?   @unique
    activationTokenExp DateTime?
}
```

Migración 3 (pequeña): `20260701020000_user_activation_token`.

Flujo:
1. Webhook crea User con `activationToken=hash(token)`, `activationTokenExp=now+24h`, `active=true` (puede entrar al aula con RUT, pero el sistema le fuerza cambiar password en primer login si token presente).
2. Email contiene `/examen/activar?token=xyz`.
3. Página `/examen/activar/[token]` (server) → valida token + expira + muestra form "Nueva contraseña".
4. Submit → hashea nueva password + limpia `activationToken` + login automático con sesión jose.

---

## 6. Cambios en UI

### 6.1 Sidebar dinámico

`src/features/dashboard/components/Sidebar.tsx`: agregar prop `lmsEnabled: boolean` al layout `(admin)/[slug]/layout.tsx` y pasarla al sidebar. Si `lmsEnabled=false`, la sección "Aula" no se renderiza.

### 6.2 Editor de cursos LMS — campos B2C

`LmsCourseEditorClient.tsx`: agregar sección "Venta al público":
- Switch `isPublic` (con warning: "Aparecerá en el catálogo público").
- Input `price` (CLP, ≥0).
- Validación: si `price=null` y `isPublic=true` → gratis (mostrar badge "GRATIS" en catálogo).
- Si `price>0` y `isPublic=true` → pagado.
- Si `isPublic=false` → no aparece en catálogo (default).

### 6.3 Layout `(public)/[slug]/layout.tsx`

Lee `AcademicInstitution` por slug. Si `lmsEnabled=false`, render `notFound()` (404). Si OK, muestra:
- Logo + nombre de la institución (header simple).
- Footer legal de Aulika.
- Aplica `metadata` para SEO con `seoTitle`, `seoDescription`.

### 6.4 Layout `(students)/students/aula/layout.tsx` (NUEVO si no existe)

Lee la institución del estudiante logueado. Si `lmsEnabled=false`, muestra pantalla "El aula virtual no está habilitada en tu institución. Contacta al administrador." en vez del contenido.

### 6.5 Página `/config/institutions` — SuperAdmin

Agregar columnas a la tabla: `Exams`, `LMS`, `Plan Code`, `Vencimiento`. Y permitir editar flags manualmente (override de la lógica automática).

### 6.6 `/config/plan-limits` — UI SuperAdmin para `planCode`

Extender `PlanLimitsClient.tsx` para soportar múltiples filas por plan comercial (cada fila es un `planCode`). Default: las 4 filas existentes (FREE, DOCENTE, COLEGIO, INSTITUCIONAL) más filas nuevas para packs LMS-only.

---

## 7. Auditoría y SEO

### 7.1 Nuevas acciones de auditoría

Agregar a `AUDIT_ACTION` (en `src/features/audit/lib/actions.ts`):
```typescript
LMS_ORDER_CREATE
LMS_ORDER_APPROVED
LMS_ORDER_REJECTED
LMS_PRODUCT_ENABLED  // SuperAdmin habilita LMS/Exams manualmente
LMS_PRODUCT_DISABLED
```

### 7.2 Sitemap

**Decisión:** NO agregar rutas dinámicas B2C al sitemap estático en fase 1.

Razón: las URLs son `/[slug]/cursos/[courseId]` con millones de combinaciones (instituciones × cursos). Generar sitemap dinámico con `generateSitemap` y `revalidate=3600` es **fase 2** (después del lanzamiento).

En esta fase, agregar manualmente al sitemap las landings SEO existentes (sin cambios) y documentar la limitación.

### 7.3 Schema markup (JSON-LD)

En `(public)/[slug]/cursos/page.tsx`: cada tarjeta de curso debe inyectar `Course` schema (`schema.org/Course`) con `provider`, `offers.price`, `offers.priceCurrency: 'CLP'`. Componente reutilizar `JsonLd` de `src/shared/components/seo/`.

En `(public)/[slug]/checkout/[courseId]/page.tsx`: schema `Product` o `Offer` con `priceValidUntil`.

---

## 8. Plan de ejecución por fases

### Fase A — DB + backfill (sin UI)
1. Crear migración 1 (`plan_codes_and_product_flags`) y aplicar SQL de backfill.
2. Crear migración 2 (`lms_public_courses_and_orders`).
3. Crear migración 3 (`user_activation_token`).
4. `pnpm db:generate && pnpm type-check && pnpm test:run`.
5. **Verificación:** `pnpm db:studio` y revisar que instituciones FREE tienen `lmsEnabled=false`, COLEGIO tienen `lmsEnabled=true`.

### Fase B — Refactor de `plan-limits.ts` y `quota.ts` (backwards compatible)
1. Cambiar firma `getPlanLimits(plan)` → `getPlanLimits(plan, planCode?)`.
2. Actualizar todos los call sites con `planCode=null` por default.
3. Agregar `getProductLimits(institutionId, product)`.
4. `pnpm type-check && pnpm test:run`.

### Fase C — Flags de producto en UI admin (sin venta todavía)
1. Layout `(admin)/[slug]/layout.tsx` lee `lmsEnabled` y `examsEnabled`, pasa al Sidebar.
2. `Sidebar.tsx` oculta "Aula" si `lmsEnabled=false`.
3. `(students)/students/aula/layout.tsx` valida `lmsEnabled`.
4. `/config/institutions` muestra columnas y permite override.
5. `/config/plan-limits` soporta `planCode` por fila.
6. E2E: test que verifica que un FREE sin LMS no ve "Aula" en sidebar.

### Fase D — Catálogo público + checkout (sin pago todavía)
1. Ruta `(public)/[slug]/layout.tsx` con branding.
2. Ruta `(public)/[slug]/cursos/page.tsx` con grid de cursos.
3. Ruta `(public)/[slug]/checkout/[courseId]/page.tsx` con form.
4. Editor `LmsCourseEditorClient.tsx` extendido con `isPublic` + `price`.
5. Tests E2E: navegación anónima por el catálogo y submit de form.

### Fase E — Pago MercadoPago + webhook + activación
1. `createPreference()` en `mercadopago.ts`.
2. Server action `createLmsCheckoutPreference`.
3. Webhook extendido con `handlePreferencePayment`.
4. Token de activación + ruta `/examen/activar/[token]`.
5. Email bienvenida con link de activación (Brevo).
6. Test E2E end-to-end con sandbox de MP (o mock).

### Fase F — Hardening
1. Tests unitarios para `getProductLimits`, `enableProduct`, normalización de RUT en orden B2C.
2. Tests E2E: catálogo público + flujo de pago completo.
3. Documentación en `AGENTS.md` y `CLAUDE.md`.
4. Seeder `pnpm db:seed:local` con 2 cursos públicos de prueba (1 gratis, 1 pagado).

### Fase G (opcional, post-lanzamiento)
- Sitemap dinámico con `revalidate`.
- Reembolsos: extender `OrderStatus` con `REEMBOLSADO`.
- Cupones de descuento.
- Multi-moneda (UF, USD).
- CustomPlan por producto (D3 del resumen).

---

## 9. Riesgos y mitigaciones

| # | Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|---|
| R1 | Webhook MP duplicado (reintento) crea doble enrollment | Alta | Alto | Idempotencia: `if (order.status === 'APROBADO') return;`. Constraint única en `LmsEnrollment` (`@@unique([userId, courseId])`). Constraint única en `LmsOrder.mpPaymentId`. |
| R2 | RUT con typo en checkout crea User falso | Alta | Medio | Validar con `validateRut()` (canónico en `shared/lib/rut.ts`). Normalizar con `normalizeRut()`. |
| R3 | Email del B2C ya existe en otra institución | Media | Alto | Bloquear compra si `existingUser.academicInstitutionId !== course.institution`. Mensaje claro: "Tu RUT ya está registrado en otra institución". |
| R4 | Institución cambia `lmsEnabled=false` mientras hay órdenes PENDIENTES | Baja | Medio | No afecta órdenes ya APROBADAS (enrollments persisten). Órdenes PENDIENTES quedan colgadas → job cron las reconcilia a las 24h (fase futura). |
| R5 | Curso se borra con órdenes históricas | Baja | Alto | `onDelete: Restrict` en `LmsOrder.course`. UI deshabilita botón "Eliminar" si `_count.lmsOrders > 0`. |
| R6 | Precio cambia entre checkout y pago | Baja | Alto | Snapshot en `LmsOrder.amount` al crear la preferencia. Webhook lee `payment.transaction_amount` y compara; si difiere >5%, marca la orden para revisión manual. |
| R7 | Sidebar muestra "Aula" a institución LMS-off | Baja | Bajo (cosmético) | Sidebar lee flag directo de DB en layout server. |
| R8 | Estudiante B2C se loguea en `/examen/login` pero su institución no tiene LMS | Media | Medio | El login jose no valida `lmsEnabled` → pero el layout `/students/aula/layout.tsx` muestra pantalla explicativa. Mejor: agregar validación en `getStudentAuthSession`. |
| R9 | Firma del webhook MP no válida (replay attack) | Baja | Crítico | `verifyWebhookSignature` ya implementado. Mantener. Auditar en cada cambio. |
| R10 | Cache de `getPlanLimits` retorna límites viejos entre request | Muy baja | Bajo | `cache()` de React es per-request, no persiste entre invocaciones serverless. OK. |

---

## 10. Verificación end-to-end

```bash
# 1. Compilación
pnpm type-check        # 0 errores
pnpm lint              # 0 warnings críticos

# 2. Tests
pnpm test:run          # suite completa, todas las pruebas existentes + nuevas

# 3. Migraciones en local
pnpm db:migrate dev --name 20260701000000_plan_codes_and_product_flags
pnpm db:migrate dev --name 20260701010000_lms_public_courses_and_orders
pnpm db:migrate dev --name 20260701020000_user_activation_token
pnpm db:seed           # verifica que los seeds pasan

# 4. Build
pnpm build             # Next.js compila sin errores

# 5. E2E (Playwright)
pnpm db:seed:local     # instituciones de prueba
pnpm test:e2e          # suite completa
```

**Smoke test manual (después del build):**
1. Login como Admin de una institución FREE en `localhost:3000/universidad-demo`.
2. Verificar que el sidebar NO muestra "Aula".
3. SuperAdmin cambia `lmsEnabled=true` en `/config/institutions`.
4. Re-login → sidebar muestra "Aula".
5. Admin crea un curso LMS con `isPublic=true` y `price=9990`.
6. Logout. Ir a `localhost:3000/universidad-demo/cursos` (anónimo).
7. Click "Inscribirme" → checkout → completar form con RUT válido.
8. Redirige a MercadoPago sandbox. Pagar con tarjeta de prueba.
9. Vuelve a `/checkout/success?order=...` → muestra "Pago aprobado".
10. Revisar email (Brevo sandbox) con link de activación.
11. Click en link → `/examen/activar/[token]` → setea password.
12. Login en `/examen/login` con RUT + nueva password.
13. Redirige a `/students/aula` → ve el curso comprado.
14. Click en el curso → lecciones se cargan.

**Checklist de seguridad:**
- [ ] Webhook valida firma HMAC en cada request.
- [ ] Server action valida sesión antes de mutar (B2C NO requiere sesión, pero valida inputs con Zod).
- [ ] Tokens de activación son UUIDs aleatorios hasheados en DB.
- [ ] Password se hashea con bcrypt (mismo flujo que registro actual).
- [ ] No se exponen emails en `select` Prisma en rutas públicas.
- [ ] `X-Robots-Tag: all` en rutas públicas, `noindex, nofollow` en admin (mantener).

---

## 11. Dependencias externas

**Ninguna nueva.** Todo se construye con:
- `mercadopago` (ya integrado vía REST directo, no SDK).
- `zod` (ya en uso).
- `@/shared/lib/email.ts` (Brevo, ya integrado).
- `@/shared/lib/rut.ts` (canónico).
- `@/shared/lib/prisma.ts` (singleton).
- `@/shared/components/ui/card.tsx`, `rut-field.tsx`.

**Justificación:** mantener deps estables reduce riesgo de regresión en producción. Si en el futuro se quiere SDK de MP o servicio de token de un solo uso, se evalúa caso por caso.

---

## 12. Fuera de alcance (explícito)

1. **Reembolsos.** El documento no los pide. El enum `OrderStatus` solo tiene 3 valores (PENDIENTE, APROBADO, RECHAZADO). Agregar REEMBOLSADO es trivial pero requiere lógica de admin y reversión del enrollment. **Fase futura.**
2. **Multi-subdominio (`aula.aulika.cl`).** Mantener paths.
3. **Sitemap dinámico B2C.** Fase 2.
4. **CustomPlan por producto.** Fase 2 (después de feedback de clientes).
5. **Cupones y descuentos.** No pedido.
6. **Multi-moneda (UF, USD).** No pedido.
7. **Pasarela de pago distinta a MercadoPago.** No pedido.
8. **Reportes de ventas B2C para Admin.** Mencionado implícitamente; entregar vista básica con count de órdenes + revenue (suma de `LmsOrder.amount` filtrado por institución y status).

---

## 13. Documentación a actualizar

Después del merge:
- `AGENTS.md` y `CLAUDE.md`: agregar sección "Planes por producto + B2C" con resumen de 1 párrafo + link a este plan archivado en `.spool/04_archive/2026-07-XX_master-plan-planes-b2c.md`.
- `Spec.md` (si existe): actualizar modelo de planes y modelo de negocio.
- `prisma/seeders/`: agregar seeder de cursos públicos de prueba.
- `README.md` (si lo tiene): comando `pnpm db:seed:local` ahora también crea cursos B2C.

---

## 14. Cierre

Este plan:
- ✅ Adopta la propuesta de Gemini para flags de producto (Req 2).
- ✅ Adopta la propuesta de Gemini para checkout B2C (Req 3), con preference en vez de preapproval.
- ⚠️ Adapta la propuesta de `planCode` para NO romper el enum (Req 1) — backfill con default + columna opcional.
- ✅ Define 7 fases con verificación independiente.
- ✅ Identifica 10 riesgos con mitigaciones concretas.
- ✅ Mantiene dependencies externas sin cambios.

Listo para revisión del usuario antes de mover a `.spool/02_inbox/` y consolidar.