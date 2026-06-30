# Plan Maestro Consolidado — Planes Flexibles e Inscripciones B2C

> **Estado:** Plan Consolidado y Aprobado (Gemini 3.5)  
> **Fecha:** 2026-06-30  
> **Fuentes:**  
> - `.spool/01_raw/claude-planes-y-matriculacion-b2c.md`  
> - `.spool/01_raw/max-planes-y-matriculacion-b2c.md`  
> **Objetivo:** Implementar planes dinámicos con gating por producto (Exámenes y LMS) e inscripciones B2C con pasarela de pago único (MercadoPago) y activación por token.

---

## 1. Análisis de Riesgos y Decisiones Estratégicas

### 1.1 Resguardo de Compatibilidad en `PlanLimits`
Se rechaza la propuesta de renombrar la columna `plan` (enum) directamente en `PlanLimits`. Hacerlo rompería el funcionamiento actual de múltiples módulos en producción.
* **Solución:** Estrategia híbrida de Max. Mantener la columna `plan` (enum) y añadir la columna opcional `planCode String?` con una restricción única compuesta `@@unique([plan, planCode])`. Los planes heredados continúan funcionando por el enum (`planCode` nulo), mientras que los nuevos planes flexibles por producto se identificarán mediante el `planCode`.

### 1.2 Validación y Gating en el Proxy vs. Layouts (Next.js 16 Edge Runtime)
El archivo `proxy.ts` corre en el Edge Runtime de Next.js y no puede realizar llamadas Prisma directas a la base de datos sin incurrir en penalizaciones críticas de rendimiento y complejidad de red.
* **Solución:** Validación en dos capas. El proxy lee los flags `examsEnabled` y `lmsEnabled` desde el JWT de NextAuth para realizar un pre-filtrado rápido en rutas de administrador (`/[slug]/aula/*`). Para los estudiantes (cuya sesión no está en NextAuth), y como mecanismo de defensa definitivo para los admins, el layout server-side de cada sección consulta a la base de datos en tiempo real.

### 1.3 Aislamiento del Webhook de MercadoPago
El webhook de MercadoPago para suscripciones corporativas (B2B) ubicado en `/api/webhooks/mercadopago` está marcado como de alta sensibilidad y no debe ser modificado directamente para evitar regresiones de facturación.
* **Solución:** Crear un endpoint exclusivo `/api/webhooks/mercadopago-b2c` para procesar los pagos de tipo `preference` (pago único por curso) de los estudiantes B2C.

### 1.4 Seguridad de Credenciales del Estudiante
Enviar contraseñas generadas al azar en texto plano por correo electrónico representa un riesgo de seguridad elevado.
* **Solución:** Flujo de activación mediante token. Al aprobarse la orden B2C, se crea el usuario inactivo y se genera un `activationToken` con expiración de 24 horas. Se envía un enlace `/examen/activar?token=...` por Brevo y el alumno define su propia clave al ingresar por primera vez.

---

## 2. Modelo de Datos (Cambios en `schema.prisma`)

### 2.1 Fase A: Estructura de Planes y Flags
```prisma
// PlanLimits - Flexibilidad retrocompatible
model PlanLimits {
  id              String   @id @default(uuid()) @db.Uuid
  plan            Plan     // Se mantiene el enum comercial original
  planCode        String?  // Nuevo: Código único del pack (ej. "lms_colegio", "exams_docente")
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

  @@unique([plan, planCode])
  @@index([planCode])
}

// AcademicInstitution - Flags de habilitación por producto
model AcademicInstitution {
  // ... Campos actuales ...
  plan                Plan     @default(FREE)
  planExpiresAt       DateTime?

  // Flags para Exámenes (Aulika)
  examsEnabled        Boolean   @default(true)
  examsPlanCode       String?   @default("exams_free")
  examsPlanExpiresAt  DateTime?

  // Flags para Aula Virtual (LMS)
  lmsEnabled          Boolean   @default(false)
  lmsPlanCode         String?   @default("lms_free")
  lmsPlanExpiresAt    DateTime?
  // ...
}
```

### 2.2 Fase B: Cursos Públicos y Órdenes B2C
```prisma
// LmsCourse - Campos para venta B2C
model LmsCourse {
  // ... Campos actuales ...
  isPublic      Boolean  @default(false)  // Habilita visibilidad en el catálogo público
  price         Float?                   // CLP. Null o 0 = Gratis
  
  lmsOrders     LmsOrder[]
  // ...
}

enum OrderStatus {
  PENDIENTE
  APROBADO
  RECHAZADO
}

// LmsOrder - Registro y trazabilidad de compras B2C
model LmsOrder {
  id              String      @id @default(uuid()) @db.Uuid
  studentRut      String      // RUT normalizado
  studentName     String
  studentLastname String
  studentEmail    String
  courseId        String      @db.Uuid
  course          LmsCourse   @relation(fields: [courseId], references: [id], onDelete: Restrict)
  amount          Float       // CLP
  status          OrderStatus @default(PENDIENTE)
  mpPreferenceId  String?
  mpPaymentId     String?     @unique
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

### 2.3 Fase C: Tokens de Activación
```prisma
model User {
  // ... Campos actuales ...
  activationToken    String?   @unique
  activationTokenExp DateTime?
}
```

---

## 3. Lógica de Negocio y Cuotas

### 3.1 `getPlanLimits` en `src/features/subscriptions/lib/plan-limits.ts`
Actualizar para resolver límites dinámicamente si existe un `planCode`, manteniendo la compatibilidad hacia atrás:
```typescript
export const getPlanLimits = cache(
    async (plan: Plan, planCode?: string | null): Promise<PlanLimits> => {
        const where = planCode
            ? { plan_planCode: { plan, planCode } }
            : { plan, planCode: null };

        const limits = await prisma.planLimits.findUnique({ where });
        if (!limits) throw new Error(`PlanLimits no encontrado para plan=${plan}, planCode=${planCode}`);
        return limits;
    },
);
```

### 3.2 `getProductLimits` en `src/features/subscriptions/lib/quota.ts`
Implementar una función que retorne las cuotas segmentadas por producto y valide si el módulo está habilitado en la institución actual.

---

## 4. Flujo de Activación y Webhook B2C

1. **Creación de Preferencia:** El estudiante completa sus datos en el formulario de la página `/[slug]/checkout/[courseId]`. La Server Action `createLmsCheckoutPreference` valida los datos, comprueba que el RUT no pertenezca a otra institución ni esté ya matriculado, crea una `LmsOrder` en estado `PENDIENTE` y genera un link de pago único redirigiendo a MercadoPago.
2. **Procesamiento de Pago:** Cuando el pago es aprobado, MercadoPago invoca a `/api/webhooks/mercadopago-b2c`.
3. **Matriculación Atómica en `$transaction`:**
   - Crear o actualizar al `User` (asociándole un token aleatorio en `activationToken` y fecha límite en `activationTokenExp`).
   - Crear el registro `LmsEnrollment` en estado `ACTIVO`.
   - Actualizar el estado de la `LmsOrder` a `APROBADO`.
4. **Envío de Email (Brevo):** Fuera de la transacción de base de datos para no bloquear el hilo de ejecución, se dispara un correo electrónico con la plantilla de bienvenida y el enlace `/examen/activar?token=XYZ`.

---

## 5. Checklist de Implementación por Fases

### [ ] Fase 1: Base de Datos y Backfills [Asignado a: GLM-5.2]
- [ ] Modificar `prisma/schema.prisma` agregando los nuevos campos en `PlanLimits`, `AcademicInstitution`, `LmsCourse`, `LmsOrder` y `User`.
- [ ] Generar la migración local con `pnpm db:migrate`.
- [ ] En la migración SQL generada, agregar el insert de los `PlanLimits` base (`exams_free`, `exams_docente`, `exams_colegio`, `lms_free`, `lms_colegio`, `pack_completo`) y el backfill de flags en `AcademicInstitution` (LMS activado para planes existentes).
- [ ] Generar el cliente Prisma con `pnpm db:generate`.
- [ ] Verificar que el seeder de base de datos (`pnpm db:seed`) siga funcionando sin errores.

### [ ] Fase 2: Lógica de Cuotas e Integraciones [Asignado a: GLM-5.2]
- [ ] Actualizar `getPlanLimits` en `plan-limits.ts` para que resuelva de forma híbrida (`plan` + `planCode`).
- [ ] Ajustar la firma y la lógica de consumo en `quota.ts` agregando `getProductLimits`.
- [ ] Crear la función `createPreference` en `src/features/subscriptions/lib/mercadopago.ts` para crear cobros de un pago único en MercadoPago.
- [ ] Crear los esquemas de validación Zod en `b2c-checkout.schemas.ts`.
- [ ] Desarrollar la Server Action `createLmsCheckoutPreference` en `checkout.ts` para procesar el pre-checkout B2C y retornar el `initPoint`.

### [x] Fase 3: Gating de Producto (Admin y Alumno) [Asignado a: MiniMax-M3]
- [x] Modificar el callback `jwt` y extender los tipos de NextAuth (`next-auth.d.ts`) para incluir `examsEnabled` y `lmsEnabled` en la sesión de administrador.
- [x] Actualizar `src/proxy.ts` para interceptar y bloquear solicitudes a `/[slug]/aula/*` si la institución de la sesión no tiene LMS activo.
- [x] Modificar `Sidebar.tsx` para ocultar condicionalmente la sección "Aula" según la propiedad `lmsEnabled` de la sesión.
- [x] Crear la restricción en el layout del estudiante (`/students/aula/layout.tsx` o similar) validando en base de datos el flag `lmsEnabled` de la institución.

### [x] Fase 4: Catálogo y Checkout Público [Asignado a: MiniMax-M3]
- [x] Implementar la vista del catálogo público de la institución en `/[slug]/cursos`.
- [x] Diseñar las tarjetas de cursos agregando Schema Markup (JSON-LD) para optimizar el SEO (`schema.org/Course`).
- [x] Crear la página de checkout `/[slug]/checkout/[courseId]` integrando el componente cliente `CheckoutForm` y reutilizando `RutField`.
- [x] Implementar la pantalla de éxito/espera post-pago con un polling simple del estado de la orden.
- [x] Crear la página de activación `/examen/activar` que reciba el token y le permita al estudiante definir su contraseña definitiva.

### [ ] Fase 5: Webhook B2C y Envío de Correo [Asignado a: GLM-5.2]
- [ ] Crear la API de webhook `/api/webhooks/mercadopago-b2c`.
- [ ] Implementar la transacción atómica `$transaction` para el upsert del usuario (inactivo), creación del enrollment (`ACTIVO`), registro del token de activación y aprobación de la `LmsOrder`.
- [ ] Integrar el servicio Brevo en el webhook para despachar el correo de bienvenida con el enlace de activación.

### [x] Fase 6: Pruebas y Hardening [Asignado a: MiniMax-M3]
- [x] Escribir tests unitarios para validar la normalización de RUT, `getProductLimits`, y la creación de órdenes.
- [x] Desarrollar pruebas E2E (Playwright) para el flujo público (catálogo + checkout + activación). E2E end-to-end con webhook real se difiere a Fase 5.
- [x] Validar compilación con `pnpm build`.
- [x] Ejecutar verificaciones automáticas: `pnpm type-check` y `pnpm lint`.

### Notas de entrega (MiniMax-M3)
- Fixes colaterales aplicados para que type-check pase tras la migración de Fase 1 (cambios en `prisma/seed.ts`, `src/features/admin-plan/actions/mutations.ts`, `src/features/subscriptions/lib/plan-limits.ts`, `src/features/subscriptions/lib/quota.ts`).
- El catálogo público se montó en `(public)/[slug]/` (route group público). El path raíz `/{slug}/` sigue mapeando al dashboard admin para preservar el flujo existente.
- `createPreference` agregada en `mercadopago.ts` con la firma `item/payerName/payerSurname/backUrls/notificationUrl` (la firma completa estaba duplicada en un edit; se consolidó).
- `generateActivationToken` movida a `src/features/lms/lib/activation-token.ts` (lib pura, sin `'use server'`) para que Fase 5 la reuse.
- **Round 2 (cierre de gaps de GLM-5.2):** 53 tests unitarios nuevos (webhook B2C con 13 escenarios, getProductLimits, seedPlanCodes, createLmsCheckoutPreference, getLmsOrderStatus, activateB2cAccount, activation-token). Refactor de `PlanLimitsClient.tsx` para mostrar las 6 filas por producto + las 4 heredadas, agrupadas por plan comercial y editables. 2 specs Playwright (`b2c-catalog.spec.ts`, `b2c-checkout.spec.ts`) + seeder extendido (`local-test.ts`) que crea 1 curso público sembrado.
- Total suite: **316/316 tests pasando**.

