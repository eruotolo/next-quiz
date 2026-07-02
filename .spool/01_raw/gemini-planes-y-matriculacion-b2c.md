# Planificación de Negocio e Ingeniería: Planes Flexibles e Inscripciones B2C (Preuniversitarios)

> **Estado:** Especificación Técnica Completa (Gemini 3.5)  
> **Ubicación:** `.spool/01_raw/planes-y-matriculacion-b2c.md`  
> **Objetivo:** Definir el modelo de base de datos, enrutamiento y pasarela de pago para soportar límites de planes dinámicos, ventas de productos independientes (LMS y Exámenes) y auto-inscripción pagada de alumnos (B2C).

---

## 1. Requerimiento 1: Rediseño Dinámico de Planes (`PlanLimits`)

### 1.1 Limitación Actual

En `schema.prisma`, la tabla `PlanLimits` está acoplada al Enum rígido `Plan` (valores: `FREE`, `DOCENTE`, `COLEGIO`, `INSTITUCIONAL`). Si queremos agregar variantes de planes comerciales (ej: "LMS Avanzado", "Exámenes Pro", "Pack Completo Premium"), se requiere alterar el enum mediante migraciones complejas de base de datos.

### 1.2 Solución Propuesta

- Cambiar la relación en `PlanLimits` de un enum a una cadena de texto dinámica (`planCode`).
- Esto permite registrar y gestionar múltiples límites en la base de datos de manera dinámica a través de la interfaz del SuperAdmin.

### 1.3 Cambios en el Schema de Prisma

```prisma
model PlanLimits {
  id              String   @id @default(uuid()) @db.Uuid
  planCode        String   @unique // Ej: "exams_free", "exams_docente", "lms_colegio", "pack_completo"
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

---

## 2. Requerimiento 2: Venta Independiente de LMS y Exámenes (Flags de Producto)

### 2.1 Lógica Comercial

1. **Aulika Exámenes Independiente:** Acceso único a evaluaciones. El Aula Virtual está inactiva y bloqueada.
2. **Aula Aulika LMS Independiente:** Acceso a lecciones, tareas, foros y notas. El motor de exámenes avanzados de Aulika no está disponible (o solo se permiten cuestionarios formativos básicos del LMS).
3. **Pack Completo (Aula Virtual + Exámenes):** El LMS incluye el motor de exámenes de Aulika como un tipo de lección (`LessonType.EXAMEN`).

### 2.2 Cambios en `AcademicInstitution`

Para controlar estos accesos independientes, se añaden flags booleanos y fechas de expiración separadas:

```prisma
model AcademicInstitution {
  // ... campos identificadores existentes ...

  // Control de Exámenes (Aulika)
  examsEnabled        Boolean             @default(true)
  examsPlanCode       String              @default("exams_free")
  examsPlanExpiresAt  DateTime?

  // Control de Aula Virtual (LMS)
  lmsEnabled          Boolean             @default(false)
  lmsPlanCode         String              @default("lms_free")
  lmsPlanExpiresAt    DateTime?

  // ... resto de relaciones académicas existentes ...
}
```

### 2.3 Control en Proxy (`src/proxy.ts`)

El middleware interceptará las peticiones del subdominio de la institución y validará los accesos activos:

- Si intenta acceder a rutas de exámenes (`/examen` o `/[slug]/exams`) y `examsEnabled` es `false` (o plan expirado): Redirigir a pantalla de error o compra.
- Si intenta acceder a rutas del LMS (`aula.aulika.cl/*` o `src/app/(aula)/*`) y `lmsEnabled` es `false` (o plan expirado): Redirigir a pantalla de error o compra.

---

## 3. Requerimiento 3: Auto-inscripción de Alumnos B2C (Preuniversitarios)

Para permitir que estudiantes individuales se registren y paguen para acceder a un curso de entrenamiento PAES, implementamos un flujo de catálogo público y checkout.

### 3.1 Cambios en el Modelo de Datos del LMS (`schema.prisma`)

1. **En `LmsCourse`:**

```prisma
model LmsCourse {
  // ... campos existentes ...
  isPublic      Boolean  @default(false) // Si es true, aparece en el catálogo público de la institución
  price         Float?   // Precio del curso en CLP. Si es null/0, es gratis/privado
  // ...
}
```

2. **Nuevo modelo `LmsOrder` (para trazabilidad del pago antes de matricular):**

```prisma
enum OrderStatus {
  PENDIENTE
  APROBADO
  RECHAZADO
}

model LmsOrder {
  id              String      @id @default(uuid()) @db.Uuid
  studentRut      String      // RUT del estudiante que compra
  studentName     String
  studentLastname String
  studentEmail    String
  courseId        String      @db.Uuid
  course          LmsCourse   @relation(fields: [courseId], references: [id], onDelete: Cascade)
  amount          Float
  status          OrderStatus @default(PENDIENTE)
  mpPreferenceId  String?     // ID de preferencia de MercadoPago
  mpPaymentId     String?     @unique
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt

  @@index([courseId])
  @@index([studentRut])
}
```

### 3.2 Flujo de Compra (Checkout B2C)

#### Paso 1: Catálogo Público de la Institución

- **Ruta:** `src/app/(public)/[slug]/cursos/page.tsx`
- **Acción:** Muestra tarjetas con los cursos de la institución que tienen `isPublic: true`. Cada tarjeta muestra el título, descripción, portada (Cloudinary) y el precio.
- **Componente:** Botón de "Comprar / Inscribirse".

#### Paso 2: Formulario de Checkout y Pre-registro

- **Ruta:** `src/app/(public)/[slug]/checkout/[courseId]/page.tsx`
- **Acción:** Si el estudiante no está logueado, completa un formulario simple: **RUT (obligatorio y validado), Nombre, Apellido y Email**.
- **Procesamiento (Server Action):**
    1. Verifica si el estudiante ya existe en la base de datos (por RUT). Si no existe, se creará el `User` (asociado a la institución con rol `Estudiante`) pero quedará temporalmente inactivo o sin contraseña hasta que se apruebe el pago.
    2. Crea un registro en `LmsOrder` en estado `PENDIENTE`.
    3. Llama a la API de MercadoPago para crear una preferencia de pago, pasando el ID de la orden en el campo `external_reference`.
    4. Devuelve la URL de redirección (`init_point`) de MercadoPago.

#### Paso 3: Pago en MercadoPago y Webhook

- **Acción:** El estudiante paga en la pasarela segura.
- **Procesamiento del Webhook (`/api/webhooks/mercadopago`):**
    1. Recibe la notificación de pago aprobado.
    2. Lee la `external_reference` que corresponde al `LmsOrder.id`.
    3. Actualiza el estado de `LmsOrder` a `APROBADO` y guarda el `mpPaymentId`.
    4. Realiza la **matriculación atómica**:
        - Busca al estudiante por el RUT registrado en la orden. Si el `User` existía pero estaba inactivo, lo activa.
        - Crea un registro en **`LmsEnrollment`** vinculando al estudiante con el `LmsCourse` comprado.
        - Genera una contraseña temporal o envía un email de bienvenida mediante Brevo indicando cómo ingresar a su portal (`aula.aulika.cl/[slug]`).

---

## 4. Matriz de Combinaciones de Compra de Productos

| examsEnabled | lmsEnabled | Comportamiento del Sistema                                                                                                                                                                                                                       |
| ------------ | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `true`       | `false`    | **Solo Exámenes (Aulika):** Portal clásico para pruebas. LMS completamente invisible en el sidebar y bloqueado en el proxy.                                                                                                                      |
| `false`      | `true`     | **Solo LMS (Aula Aulika):** Cursos, lecciones (videos Cloudinary/Mux, PDFs), foros y tareas. Las lecciones de tipo `EXAMEN` solo permiten cuestionarios sencillos y formativos del LMS; el motor de exámenes proctorizados Aulika está inactivo. |
| `true`       | `true`     | **Pack Integrado:** Acceso completo al LMS y exámenes. Las lecciones del LMS pueden embeber exámenes avanzados de Aulika (`Lesson.examId`), sincronizando la nota del resultado directamente con el libro de calificaciones del curso.           |
