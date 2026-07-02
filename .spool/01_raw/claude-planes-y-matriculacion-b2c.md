# Plan Claude — Planes Flexibles e Inscripciones B2C

> **Estado:** Especificación Técnica — Claude Sonnet 4.6  
> **Fecha:** 2026-06-30  
> **Basado en:** `gemini-planes-y-matriculacion-b2c.md`  
> **Objetivo:** Implementar PlanLimits dinámico, flags de producto por institución y flujo B2C de auto-inscripción para preuniversitarios.

---

## 1. Análisis de Riesgos y Decisiones Clave

Antes de la implementación, hay tres puntos donde el plan de Gemini necesita ajuste por la arquitectura real del proyecto:

### 1.1 Proxy en Edge Runtime — No puede hacer queries Prisma

**Problema:** El plan de Gemini propone que `proxy.ts` valide `examsEnabled` y `lmsEnabled` interceptando requests. Pero `proxy.ts` en Next.js 16 corre en **Edge runtime** sin acceso a Prisma.

**Solución adoptada:** Dos capas de validación:
1. **JWT** (proxy): incluir `examsEnabled` y `lmsEnabled` en el payload del token de NextAuth al hacer login. El proxy filtra con este valor (puede ser ligeramente stale).
2. **Server Component** (primera defensa real): el layout de `/[slug]/aula/` y la ruta de exámenes validan contra DB en tiempo real. Esta es la barrera real.

El proxy solo hace pre-filtrado para experiencia de usuario; los layouts garantizan la seguridad real.

### 1.2 Webhook de MercadoPago — NO TOCAR la ruta existente

**Problema:** El CLAUDE.md marca `/api/webhooks/mercadopago` como **NO TOCAR**. Ese webhook maneja las suscripciones B2B.

**Solución adoptada:** Crear un endpoint separado `/api/webhooks/mercadopago-b2c` exclusivo para las órdenes `LmsOrder`. En MercadoPago se configurará la URL de notificación al crear la preferencia B2C apuntando a este nuevo endpoint.

### 1.3 Migración de PlanLimits — Requiere data migration explícita

**Problema:** Cambiar de enum a `planCode String` rompe cualquier código que use la FK actual. Hay que seedear las filas base en la misma migración SQL antes de que `assertQuota` u otros accesos busquen por `planCode`.

**Solución adoptada:** La migración Prisma incluirá un `INSERT` con los 4 códigos base (`exams_free`, `exams_docente`, `lms_free`, `lms_colegio`, `pack_completo`) como parte del SQL. El `seed.ts` los crea idempotentemente también.

---

## 2. Fase 1 — Schema: PlanLimits Dinámico

### 2.1 Cambios en `schema.prisma`

**Modificar `PlanLimits`:** eliminar la relación con el enum `Plan` y reemplazar por `planCode String @unique`.

```prisma
model PlanLimits {
  id              String   @id @default(uuid()) @db.Uuid
  planCode        String   @unique  // Ej: "exams_free", "lms_colegio", "pack_completo"
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
}
```

**El enum `Plan` en `AcademicInstitution` NO se toca.** Sigue siendo `FREE | DOCENTE | COLEGIO | INSTITUCIONAL` para el flujo de suscripción B2B existente. Los nuevos campos `examsPlanCode` / `lmsPlanCode` son independientes.

### 2.2 Migración de datos

La migración SQL debe incluir el INSERT inicial para no romper `assertQuota`:

```sql
-- Datos base para PlanLimits con planCode dinámico
INSERT INTO "PlanLimits" (id, "planCode", "maxGroups", "maxAdmins", "maxProfessors", "maxStudents", "maxExamsPerYear", description)
VALUES
  (gen_random_uuid(), 'exams_free',     3,  1,  2,  30,  10,  'Aulika Exámenes — Plan Gratuito'),
  (gen_random_uuid(), 'exams_docente',  5,  1,  5,  60,  30,  'Aulika Exámenes — Plan Docente'),
  (gen_random_uuid(), 'exams_colegio',  20, 3,  20, 300, 100, 'Aulika Exámenes — Plan Colegio'),
  (gen_random_uuid(), 'exams_institucional', NULL, NULL, NULL, NULL, NULL, 'Aulika Exámenes — Plan Institucional'),
  (gen_random_uuid(), 'lms_free',       2,  1,  2,  20,  NULL, 'Aula Aulika — Plan Gratuito'),
  (gen_random_uuid(), 'lms_colegio',    20, 3,  20, 300, NULL, 'Aula Aulika — Plan Colegio'),
  (gen_random_uuid(), 'pack_completo',  NULL, NULL, NULL, NULL, NULL, 'Pack Completo — LMS + Exámenes')
ON CONFLICT ("planCode") DO NOTHING;
```

### 2.3 Impacto en código existente

Buscar y actualizar todos los usos actuales de `PlanLimits`:
- `assertQuota` (probablemente en `src/shared/lib/` o `src/features/subscriptions/`) — cambia la query de buscar por `plan` a buscar por `planCode`.
- SuperAdmin UI de planes (si existe): mostrar y editar `planCode` en lugar del enum.

**Regla:** `assertQuota` debe recibir el `planCode` activo de la institución (del campo `examsPlanCode` o `lmsPlanCode` según el módulo que se esté validando).

---

## 3. Fase 2 — Flags de Producto en AcademicInstitution

### 3.1 Cambios en `schema.prisma`

```prisma
model AcademicInstitution {
  // ... campos existentes sin tocar ...

  // Control de Exámenes (Aulika)
  examsEnabled       Boolean   @default(true)
  examsPlanCode      String    @default("exams_free")
  examsPlanExpiresAt DateTime?

  // Control de Aula Virtual (LMS)
  lmsEnabled         Boolean   @default(false)
  lmsPlanCode        String    @default("lms_free")
  lmsPlanExpiresAt   DateTime?

  // ... resto sin tocar ...
}
```

**Defaults intencionales:**
- `examsEnabled: true` — las instituciones existentes no pierden acceso al producto principal.
- `lmsEnabled: false` — el LMS es un producto adicional, no se habilita automáticamente.

### 3.2 JWT de NextAuth — Extender payload

En `src/features/auth/auth.ts`, en el callback `jwt`, agregar al token:

```ts
token.examsEnabled = institution.examsEnabled;
token.lmsEnabled = institution.lmsEnabled;
```

En `src/features/auth/next-auth.d.ts`, extender `JWT`:
```ts
examsEnabled?: boolean;
lmsEnabled?: boolean;
```

### 3.3 Proxy — Pre-filtrado por JWT

En `src/proxy.ts`, agregar validación para rutas LMS cuando `lmsEnabled === false`:

```ts
// Si intenta acceder a /[slug]/aula/* y lmsEnabled es false → redirigir
if (pathname.startsWith(`/${slug}/aula`) && !token.lmsEnabled) {
  return NextResponse.redirect(new URL(`/${slug}/upgrade`, request.url));
}
```

**Importante:** Solo bloquear rutas de admin (`/[slug]/aula`). La ruta de estudiante `/aula/*` se valida en su layout (la sesión estudiante no tiene JWT de NextAuth).

### 3.4 Layouts — Barrera real de seguridad

En `src/app/(aula)/layout.tsx`: antes de renderizar, verificar `institution.lmsEnabled` desde DB:

```ts
const institution = await prisma.academicInstitution.findUnique({
  where: { id: student.academicInstitutionId },
  select: { lmsEnabled: true, lmsPlanExpiresAt: true }
});
if (!institution?.lmsEnabled || isPlanExpired(institution.lmsPlanExpiresAt)) {
  redirect('/examen/seleccion?error=lms_disabled');
}
```

### 3.5 SuperAdmin UI — Gestión de flags

En `/config/institutions`, agregar controles para activar/desactivar `examsEnabled` / `lmsEnabled` y seleccionar el `planCode` activo (dropdown que lista los `PlanLimits` disponibles).

### 3.6 Matriz de comportamiento (resumen de routing)

| examsEnabled | lmsEnabled | Proxy bloquea             | Layout estudiante         |
|--------------|------------|--------------------------|---------------------------|
| `true`       | `false`    | `/[slug]/aula/*`         | Redirige a exámenes       |
| `false`      | `true`     | `/[slug]/exams/*`        | Redirige al aula          |
| `true`       | `true`     | Ninguno                  | Acceso completo           |
| `false`      | `false`    | Ambos                    | Sin acceso                |

---

## 4. Fase 3 — B2C: Catálogo y Auto-inscripción

### 4.1 Schema — LmsCourse y LmsOrder

**Extensión de `LmsCourse`:**
```prisma
model LmsCourse {
  // ... campos existentes ...
  isPublic Boolean @default(false)  // aparece en catálogo público
  price    Float?                   // CLP, null = gratis / no vendible por B2C
}
```

**Nuevos modelos:**
```prisma
enum OrderStatus {
  PENDIENTE
  APROBADO
  RECHAZADO
}

model LmsOrder {
  id              String      @id @default(uuid()) @db.Uuid
  studentRut      String
  studentName     String
  studentLastname String
  studentEmail    String
  courseId        String      @db.Uuid
  course          LmsCourse   @relation(fields: [courseId], references: [id], onDelete: Cascade)
  amount          Float
  status          OrderStatus @default(PENDIENTE)
  mpPreferenceId  String?
  mpPaymentId     String?     @unique
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt

  @@index([courseId])
  @@index([studentRut])
}
```

### 4.2 Schemas Zod

Archivo: `src/features/lms/schemas/b2c-checkout.schemas.ts`

```ts
export const checkoutFormSchema = z.object({
  rut: rutSchema,            // reutilizar el schema canónico de RUT
  name: z.string().min(2).max(80),
  lastname: z.string().min(2).max(80),
  email: z.string().email(),
  courseId: z.string().uuid(),
  slug: z.string().min(1),
});
```

### 4.3 Server Actions — `src/features/lms/actions/b2c-checkout.ts`

**`initB2CCheckout(formData)`:**
1. Valida inputs con `checkoutFormSchema` + validación matemática de RUT (reutilizar `@/shared/lib/rut`).
2. Busca la institución por `slug` — verifica `lmsEnabled: true`.
3. Busca el curso: `isPublic: true`, `price > 0`, pertenece a la institución.
4. Verifica que el estudiante no esté ya inscripto (`LmsEnrollment` existente).
5. Busca `User` por RUT + `academicInstitutionId`:
   - Si no existe: crea `User` con `isActive: false`, sin contraseña, rol `Estudiante`.
   - Si existe pero no está inscripto: reutiliza el User existente.
6. Crea `LmsOrder` con `status: PENDIENTE`.
7. Llama a MP API `createPreference` pasando `external_reference: order.id` y `notification_url` apuntando a `/api/webhooks/mercadopago-b2c`.
8. Retorna `{ initPoint: preference.init_point }`.

**`getPublicCourses(slug)`:**
- Retorna cursos con `isPublic: true` y `price > 0` de la institución.
- Proyección: `id`, `title`, `description`, `coverImageUrl`, `price`, `_count.LmsEnrollment`.

### 4.4 Rutas Públicas

**`src/app/(public)/[slug]/cursos/page.tsx`** — Server Component:
- Llama `getPublicCourses(slug)`.
- Muestra grilla de tarjetas con título, descripción, portada Cloudinary y precio formateado en CLP.
- Botón "Inscribirme" → `/[slug]/checkout/[courseId]`.
- Si `courses.length === 0`: mensaje "No hay cursos disponibles actualmente".

**`src/app/(public)/[slug]/checkout/[courseId]/page.tsx`** — Server Component + Client Form:
- Verifica que el curso exista y sea público (redirect 404 si no).
- Renderiza `CheckoutForm` (Client Component) con `courseId` y `slug` como props.
- `CheckoutForm` usa React Hook Form + Zod, campo `RutField` canónico.
- Al submit: llama `initB2CCheckout(formData)` → redirect al `initPoint` de MP.
- Estado de carga durante la llamada (botón deshabilitado, spinner).

**Sitemap:** agregar `/[slug]/cursos` a `sitemap.ts` **solo para preuniversitarios con cursos públicos**.

### 4.5 Webhook B2C — `/api/webhooks/mercadopago-b2c`

Archivo: `src/app/api/webhooks/mercadopago-b2c/route.ts`

```ts
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  // 1. Verificar firma de MP (mismo patrón que el webhook existente)
  // 2. Parsear body — buscar payment.id
  // 3. Consultar estado del pago en MP API
  // 4. Leer external_reference → LmsOrder.id
  // 5. Si pago APROBADO:
  //    a. Actualizar LmsOrder: status = APROBADO, mpPaymentId
  //    b. Activar User (isActive = true)
  //    c. Generar contraseña temporal (crypto.randomBytes)
  //    d. Crear LmsEnrollment (status: ACTIVO)
  //    e. Enviar email de bienvenida via Brevo
  // 6. Si pago RECHAZADO: actualizar LmsOrder: status = RECHAZADO
  // 7. Responder 200 siempre para evitar reintentos de MP
}
```

**Lógica de activación atómica en `$transaction`:**
```ts
await prisma.$transaction([
  prisma.user.update({ where: { id: order.studentUserId }, data: { isActive: true, password: hashedTempPassword } }),
  prisma.lmsEnrollment.create({ data: { userId: order.studentUserId, courseId: order.courseId, status: 'ACTIVO' } }),
  prisma.lmsOrder.update({ where: { id: order.id }, data: { status: 'APROBADO', mpPaymentId } }),
]);
```

**Email de bienvenida (Brevo):**
- Asunto: "¡Tu inscripción en [nombre del curso] fue confirmada!"
- Cuerpo: nombre del estudiante, contraseña temporal, link al aula `aula.aulika.cl/[slug]`.
- Reutilizar `sendEmail` de `src/shared/lib/brevo.ts`.

### 4.6 Páginas de resultado de pago

MercadoPago redirige al usuario a URLs de éxito/pendiente/fallo. Crearlas en:

- `src/app/(public)/[slug]/checkout/[courseId]/exito/page.tsx` — "¡Pago aprobado! Revisá tu email."
- `src/app/(public)/[slug]/checkout/[courseId]/pendiente/page.tsx` — "Pago en proceso, te avisaremos."
- `src/app/(public)/[slug]/checkout/[courseId]/error/page.tsx` — "Hubo un error, intentá de nuevo."

Estas páginas son estáticas (no requieren DB). El estado real se maneja por webhook.

---

## 5. Impactos en Código Existente

| Archivo/Módulo | Cambio requerido |
|---|---|
| `src/shared/lib/scoping.ts` o similar | `assertQuota` debe aceptar `planCode` en lugar de buscar por enum `Plan` |
| `src/features/auth/auth.ts` | JWT callback: agregar `examsEnabled`, `lmsEnabled` |
| `src/features/auth/next-auth.d.ts` | Extender tipos de JWT y Session |
| `src/proxy.ts` | Agregar bloqueo de `/[slug]/aula/*` si `!token.lmsEnabled` |
| `src/app/(aula)/layout.tsx` | Validar `lmsEnabled` desde DB antes de renderizar |
| `src/features/subscriptions/lib/mercadopago.ts` | Agregar función `createB2CPreference(order)` separada de `createPreapproval` |
| `prisma/seed.ts` | Seedear `PlanLimits` base con los nuevos `planCode` |
| `src/app/sitemap.ts` | Agregar rutas de catálogo público cuando corresponda |

---

## 6. Orden de Ejecución

```
1. schema.prisma — PlanLimits (planCode) + AcademicInstitution (flags) + LmsCourse (isPublic, price) + LmsOrder
2. pnpm db:migrate — una sola migración con todos los cambios + INSERTs de PlanLimits base
3. pnpm db:generate
4. Actualizar assertQuota para usar planCode
5. Extender JWT de NextAuth con examsEnabled / lmsEnabled
6. Actualizar proxy.ts
7. Actualizar layout del aula para validar lmsEnabled
8. Crear b2c-checkout.schemas.ts + b2c-checkout.ts (actions)
9. Crear rutas públicas: /[slug]/cursos + /[slug]/checkout/[courseId]
10. Crear páginas de resultado (éxito, pendiente, error)
11. Crear webhook /api/webhooks/mercadopago-b2c
12. Agregar función createB2CPreference en mercadopago.ts
13. SuperAdmin UI: controles de flags en /config/institutions
14. pnpm type-check → pnpm lint → pnpm build
```

---

## 7. Criterios de Verificación

- [ ] `assertQuota` sigue funcionando para instituciones existentes (con `examsPlanCode: "exams_free"`)
- [ ] Institución con `lmsEnabled: false` no puede acceder a `/[slug]/aula` (redirect)
- [ ] Institución con `lmsEnabled: false` (estudiante) no puede acceder al aula (redirect desde layout)
- [ ] Flujo B2C completo: catálogo → checkout → MP → webhook → student activo → enrollment creado → email enviado
- [ ] Webhook B2C no rompe el webhook existente de subscriptions
- [ ] Student con RUT duplicado: reutiliza User existente sin crear duplicado
- [ ] `pnpm type-check` sin errores
- [ ] `pnpm lint` sin errores
- [ ] `pnpm build` exitoso
- [ ] Tests unitarios existentes (323/323) siguen pasando

---

## 8. Decisiones que Requieren Confirmación de Edgardo

1. **Contraseña temporal B2C**: ¿generamos una aleatoria y la enviamos por email, o enviamos un magic link de primer acceso?
2. **Flag de expiración**: cuando `lmsPlanExpiresAt` vence, ¿el sistema deshabilita automáticamente (cron job) o solo el proxy/layout valida la fecha?
3. **Catálogo público y SEO**: ¿las páginas `/[slug]/cursos` deben estar indexadas por Google para todos los preuniversitarios, o solo las que lo configuren explícitamente?
4. **Institución requerida para B2C**: ¿el catálogo público solo muestra cursos de la institución identificada por `slug`, o existe un catálogo global de Aulika con todos los cursos públicos de todos los preuniversitarios?
