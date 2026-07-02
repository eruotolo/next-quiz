# Plan Maestro Consolidado: Aula Virtual y Venta B2C Aulika Online

> **Estado:** Plan Consolidado y Asignado (Gemini 3.5)  
> **Fase del Pipeline:** `.spool/02_inbox/master-plan-preu-pdv.md`

---

## 1. Visión y Objetivos

El objetivo de este desarrollo es habilitar la comercialización de cursos B2C en Aulika de manera general y flexible. Para ello, se creará una institución de administración central llamada **Aulika Institution Online** (`aulika-online`) que servirá de vitrina para publicar y vender cursos individuales administrados directamente por la plataforma.

Se implementará una **página especial de compras y vitrina unificada en el frontend** bajo la ruta pública `/cursos` (`src/app/(public)/cursos/page.tsx`). Esta página presentará la oferta de manera 100% comercial y premium (siguiendo la línea estética de Aulika), permitiendo a los alumnos adquirir asignaturas individuales por **CLP $99.990 c/u** o el **"Pack Completo PAES: Todas las Áreas"** por un arancel promocional de **CLP $450.000** (que autoinscribe al estudiante en todos los cursos individuales de la institución).

Se implementará además el switch de Aula Virtual en el panel del SuperAdmin, la edición de visibilidad pública (`isPublic`) y precio (`price`) en el creador de cursos del LMS, y se integrará la sección de Home para derivar tráfico a la nueva vitrina `/cursos`.

### 1.1 Principios de Negocio y Reglas Técnicas
- **Storefront Unificado B2C (`/cursos`):** Diseñar una página de e-commerce educativo de alto nivel con un hero inspirador, tarjetas de asignaturas con sus detalles estructurados de módulos/lecciones y un banner destacado para el Pack Completo.
- **Venta por Asignatura o Pack:** Los alumnos pueden comprar cursos específicos por $99.990 c/u o el Pack Completo por $450.000 con vigencia anual (365 días).
- **Lógica de Autoregistro (Bundle):** La Server Action que procesa el webhook de MercadoPago detectará la compra del curso contenedor "Pack Completo" (identificado por su UUID estático) e inscribirá al alumno atómicamente en todos los cursos de `aulika-online` marcados como públicos.
- **Idempotencia de Datos:** El seeder de la institución `aulika-online` y sus cursos debe ejecutarse repetidamente sin colisiones ni duplicados utilizando UUIDs fijos y deterministas.
- **Resolución de Conflictos:** Se ajusta el script `seedPlanCodes` para proteger las configuraciones de Aula Virtual manuales hechas por el SuperAdmin.
- **Flujo de Asignación Multi-Agente:** Se delegan responsabilidades divididas entre Sonnet (Frontend/UI) y MiniMax (Base de datos/Integraciones/QA).

---

## 2. Estructura y Archivos Afectados

```
prisma/
├── seed.ts                                       ← MODIFICAR: Registrar la llamada al nuevo seeder de Aulika Online.
└── seeders/
    ├── plan-codes.ts                             ← MODIFICAR: Condicionar el updateMany para no pisar lmsEnabled si ya tiene lmsPlanCode.
    └── aulika-online.ts                          ← NUEVO: Seeder de la institución "Aulika Institution Online" con la oferta PAES y el Bundle.

src/
├── features/
│   ├── institutions/
│   │   ├── schemas/institution.schemas.ts        ← MODIFICAR: Agregar lmsEnabled al institutionSchema.
│   │   └── components/InstitutionsClient.tsx     ← MODIFICAR: Agregar el switch "Aula Virtual" en el dialog de edición.
│   └── lms/
│       ├── actions/courses.ts                    ← MODIFICAR: Extender toggleLmsCourseSetting para isPublic y crear updateLmsCoursePrice.
│       └── components/LmsCourseEditorClient.tsx  ← MODIFICAR: Agregar controles interactivos de isPublic y price en configuración del curso.
└── app/
    ├── api/webhooks/mercadopago-b2c/route.ts     ← MODIFICAR: Agregar lógica de autoinscripción múltiple al detectar la compra del Pack Completo.
    └── (public)/
        ├── page.tsx                              ← MODIFICAR: Integrar la sección L3PreuPDV en la landing.
        ├── cursos/
        │   └── page.tsx                          ← NUEVO: Vitrina comercial premium que lista todos los cursos públicos de aulika-online y el Pack Completo.
        └── components/
            └── L3PreuPDV.tsx                     ← NUEVO: Componente visual en la Home que destaca la oferta de cursos y enlaza a la nueva página /cursos.
```

---

## 3. Checklist de Implementación y Modelos Asignados

### Fase 1: Corrección de Caching y Seeder de "Aulika Online"
*Asignado a: **MiniMax***
- [ ] **Ajustar `prisma/seeders/plan-codes.ts`:**
  Modificar la consulta de backfill `updateMany` para que solo actualice las instituciones que no tengan asignado `lmsPlanCode` (es decir, `where: { plan: rule.plan, lmsPlanCode: null }`), protegiendo los toggles manuales del SuperAdmin.
- [ ] **Crear `prisma/seeders/aulika-online.ts`:**
  Crear el seeder que inserte:
  - Institución: `Aulika Institution Online` (slug: `aulika-online`, `lmsEnabled: true`, `plan: 'INSTITUCIONAL'`) usando UUID estático `9a8b7c6d-5e4f-3a2b-1c0d-9e8f7a6b5c4d`.
  - Profesor: `profesor.online@aulika.cl` con contraseña de test `Online2026!` y rol de Profesor.
  - El curso contenedor "Pack Completo PAES - Todas las Áreas" con precio de CLP $450.000 y UUID `99a07384-b113-4ec2-a53b-c10bde486c90`.
  - Los 7 cursos PAES completos, marcados como `isPublic: true`, `published: true` y con precio individual de CLP $99.990 c/u (con UUIDs estáticos):
    1. *Competencia Matemática M1* (UUID: `f47ac10b-58cc-4372-a567-0e02b2c3d479`) - Temario del DEMRE.
    2. *Competencia Matemática M2* (UUID: `e6c7104f-9e4a-4e2e-8d8a-6b45a278fb6e`) - Temario Avanzado M2.
    3. *Competencia Lectora* (UUID: `d3b07384-d113-4ec2-a53b-e10bde486c91`) - Habilidades de Lectura.
    4. *Ciencias - Biología* (UUID: `c2a07384-e113-4ec2-a53b-f10bde486c92`) - Eje Biología.
    5. *Ciencias - Química* (UUID: `b1a07384-f113-4ec2-a53b-a10bde486c93`) - Eje Química.
    6. *Ciencias - Física* (UUID: `a0a07384-a113-4ec2-a53b-b10bde486c94`) - Eje Física.
    7. *Historia y Ciencias Sociales* (UUID: `99a07384-b113-4ec2-a53b-c10bde486c95`) - Eje Historia y Ciencias Sociales.
  - Cargar en cada uno de los cursos los módulos y lecciones correspondientes con datos reales e interactivos del DEMRE.
- [ ] **Registrar en `prisma/seed.ts`:**
  Importar y ejecutar `seedAulikaOnline(prisma)` al final de la función `main` para que esté disponible en local y producción.

### Fase 2: Toggle de LMS por Institución (SuperAdmin)
*Asignado a: **Sonnet***
- [ ] **Modificar `src/features/institutions/schemas/institution.schemas.ts`:**
  Agregar `lmsEnabled: z.boolean().default(false)` al `institutionSchema`.
- [ ] **Modificar `src/features/institutions/components/InstitutionsClient.tsx`:**
  En `InstitutionForm`, agregar el componente `<Switch>` controlado para `lmsEnabled`. Agregar un texto explicativo indicando que la activación del Aula Virtual requiere que el usuario cierre sesión y vuelva a ingresar para refrescar las credenciales del proxy.

### Fase 3: Edición de Comercialización en LMS y Webhook de Pago
*Asignado a: **MiniMax** (Acciones/Backend/Webhook) y **Sonnet** (UI/Componente)*
- [ ] **Modificar `src/app/api/webhooks/mercadopago-b2c/route.ts`:** [MiniMax]
  En `fulfillB2cOrder`, interceptar si `order.courseId` corresponde al UUID del Pack Completo (`99a07384-b113-4ec2-a53b-c10bde486c90`). Si es así, buscar todas las asignaturas públicas de `aulika-online` e inscribir al estudiante de forma automática en todas ellas mediante `LmsEnrollment.upsert`.
- [ ] **Modificar `src/features/lms/actions/courses.ts`:** [MiniMax]
  - Permitir a `toggleLmsCourseSetting` aceptar el parámetro `'isPublic'`.
  - Crear e implementar la Server Action `updateLmsCoursePrice(slug, courseId, price)` para actualizar el precio del curso en CLP.
- [ ] **Modificar `src/features/lms/components/LmsCourseEditorClient.tsx`:** [Sonnet]
  - Agregar controles interactivos en la tarjeta de configuración del curso:
    * Switch "Curso Público (B2C)" que llama a `toggleLmsCourseSetting(..., 'isPublic', value)`.
    * Input de número "Precio del Curso (CLP)" con botón de guardar que llama a `updateLmsCoursePrice`. Muestra el precio actual o input vacío si es gratuito.

### Fase 4: Storefront Comercial de Cursos (`/cursos`) y Sección en la Home
*Asignado a: **Sonnet***
- [ ] **Crear la página pública `/cursos` (`src/app/(public)/cursos/page.tsx`):**
  Desarrollar una vitrina comercial (Storefront) de alta fidelidad estética. Debe incluir:
  - Cabecera Hero con copy de alto impacto y propuesta de valor del preuniversitario online de Aulika.
  - Banner interactivo del **Pack Completo PAES** (CLP $450.000) con botón para ir directo al checkout.
  - Grid de las 7 asignaturas individuales (CLP $99.990 c/u) mostrando portada, descripción y listado interactivo/acordeón de módulos del curso. Cada una con su respectivo botón de compra.
- [ ] **Crear `src/features/landing/components/L3PreuPDV.tsx`:**
  Desarrollar una sección premium en la Home que promocione la vitrina e invite a hacer clic en el CTA principal ("Ver catálogo de cursos") para redirigir a `/cursos`.
- [ ] **Modificar `src/app/(public)/page.tsx`:**
  Importar y renderizar `<L3PreuPDV />` justo antes de `<L3Pricing />`.

### Fase 5: QA, Compilación y Cleanup
*Asignado a: **MiniMax***
- [ ] **Verificar tipado y estilo:** Ejecutar `pnpm lint` y `pnpm type-check`.
- [ ] **Verificar compilación:** Correr `pnpm build` para asegurar la integridad de la compilación.
- [ ] **Archivar el plan:** Mover este archivo a `.spool/04_archive/` al concluir las tareas.
