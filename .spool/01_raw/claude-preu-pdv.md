# Plan — Aula Virtual habilitable por institución + comercialización + "Preu PDV"

**Autor:** Claude (Sonnet) — plano crudo, no ejecutar directamente.
**Fecha:** 2026-06-30
**Branch actual:** `aula-v1`
**Estado:** Investigación de código terminada (lectura directa + agente Explore). Sin cambios de código aplicados todavía.

---

## 1. Pedido original (Edgardo)

1. No todas las instituciones tienen habilitado el Aula Virtual.
2. En `/config/institutions` (editar institución) se debe poder habilitar/deshabilitar el Aula Virtual por institución.
3. Eso debe prender/apagar en el Sidebar de esa institución los items **Aula Virtual** y **Clases en vivo**.
4. Una institución como "Pepe PreU" tiene que poder abrir matrícula de alumnos externos a su curso de pre-universitario (B2C). Evaluar agregar en `L3Pricing.tsx` la posibilidad de comprar una licencia de "Institución con Aula".
5. Tener en algún lugar de la Home la posibilidad de inscribirse y pagar el programa intensivo propio de Aulika, "Preu PDV".

---

## 2. Lo que YA EXISTE y se debe reutilizar (no reinventar)

Confirmado por lectura directa de código, no por documentación (CLAUDE.md tiene aquí desfasajes — ver sección 9).

| Pieza | Archivo | Estado real |
|---|---|---|
| Campo `lmsEnabled` en `AcademicInstitution` | `prisma/schema.prisma:98` | Existe, `@default(false)`. **No hace falta migración.** |
| `examsEnabled`/`lmsEnabled`/`*PlanCode` | `prisma/schema.prisma:92-98` | Existen los 6 campos. |
| Lectura de flags con fallback por plan | `src/features/auth/lib/institution-flags.ts` (`getInstitutionFlags`) | Completo y funcional. |
| Gating del Sidebar (oculta items) | `src/features/dashboard/components/Sidebar.tsx:84-85` (items `/aula` y `/aula/clases`, ambos `requiresLms: true`), filtro línea `~431` | **Ya funciona.** Lee `lmsEnabled` fresco por request — ver hallazgo crítico 3.2. |
| Gating del layout admin | `src/app/(admin)/[slug]/layout.tsx:101-104` | Llama `getInstitutionFlags` **en cada request** (no cachea en JWT). SuperAdmin siempre `true`. |
| Gating de rutas `/aula/*` | `src/proxy.ts:104-113` | Bloquea con `session.user.lmsEnabled !== true` → redirige a `/{slug}/settings?notice=lms_disabled`. **Usa el JWT, no la DB** — ver hallazgo crítico 3.2. |
| Formulario editar institución | `src/features/institutions/components/InstitutionsClient.tsx` (`InstitutionForm`, línea ~218-376) | Existe. Campos: name, slug, city, country, address, phone, campus, type, active. Ya usa `<Switch>` (import línea 25, uso línea ~620 para `active`). **No tiene `lmsEnabled`.** |
| Schema Zod de institución | `src/features/institutions/schemas/institution.schemas.ts:4-18` | `institutionSchema` sin `lmsEnabled`. |
| Server action de update | `src/features/institutions/actions/mutations.ts:62-92` (`updateInstitution`) | Hace `prisma.academicInstitution.update({ data: parsed.data })` — **spread directo del Zod parseado**. Si agregamos `lmsEnabled` al schema, la action NO necesita tocarse. |
| Catálogo público de cursos | `/[slug]/cursos` + `PublicCourseCard.tsx` | **Ya implementado** (Fase 4). |
| Checkout B2C completo | `/[slug]/checkout/[courseId]` → `createLmsCheckoutPreference` (`b2c-orders.ts`) → MercadoPago Checkout Pro | **Ya implementado.** |
| Webhook de pago B2C | `src/app/api/webhooks/mercadopago-b2c/route.ts` | **YA IMPLEMENTADO Y COMPLETO** (221 líneas: verifica firma, matricula al alumno en transacción atómica, envía email de activación). CLAUDE.md lo lista como "pendiente Fase 5 — GLM-5.2" pero **ya no está pendiente**. Falta solo verificarlo end-to-end y corregir la doc. |
| Activación de cuenta del alumno | `src/features/lms/actions/b2c-activation.ts` | Implementado. |
| `LmsCourse.isPublic` / `LmsCourse.price` | `prisma/schema.prisma:715-716` | Existen. No hay campo de "tipo de programa"; el scope es vía `CourseSection` (opcional). |
| Seeder de packs por producto | `prisma/seeders/plan-codes.ts` + `plan-codes-cli.ts` | **Ya implementado** (otro ítem que CLAUDE.md listaba como pendiente Fase 5). Corre en cada `pnpm build` (`package.json:9`). Ver hallazgo crítico 3.1 — **tiene un bug de diseño que hay que resolver.** |
| Páginas de registro self-service | `/registro/free`, `/registro/docente`, `/registro/colegio` (`signup.ts`) | Ninguna de las 3 setea `lmsEnabled` al crear la institución → **siempre queda en `false`** (default de schema), sin importar el plan. |
| Plan "Institución" | `L3Pricing.tsx:91-99` | Sin checkout propio, usa `QuoteDialog` → `requestInstitutionalQuote` (envía email, no crea institución). |

**Conclusión de esta sección:** la infraestructura de LMS y B2C (Fases 1-5 documentadas en CLAUDE.md) está, en la práctica, más avanzada de lo que la propia documentación indica. El trabajo pendiente real es mucho más acotado de lo que parecía: **falta sobre todo el control de habilitación (toggle) y la conexión comercial (cómo se vende)**, no construir el motor de cursos/pagos, que ya existe.

---

## 3. ⚠️ Conflictos críticos encontrados (deben resolverse, no son opcionales)

### 3.1 — El seeder de build pisa cualquier toggle manual

`prisma/seeders/plan-codes.ts` (función `seedPlanCodes`, líneas 157-168) ejecuta, **en cada deploy** (está en el `build` script de `package.json:9`):

```ts
await prisma.academicInstitution.updateMany({
  where: { plan: rule.plan },
  data: { examsPlanCode: rule.examsPlanCode, lmsEnabled: rule.lmsEnabled, lmsPlanCode: rule.lmsPlanCode },
});
```

para **todas** las instituciones de cada plan (`FREE`→false, `DOCENTE`→false, `COLEGIO`→true, `INSTITUCIONAL`→true).

**Problema:** si agregamos el toggle manual en `/config/institutions` (pedido del usuario) y un SuperAdmin habilita LMS para una institución `FREE` o `DOCENTE` (ej. para dar acceso anticipado a "Pepe PreU" sin subirla de plan, o el caso de "Preu PDV"), **el próximo deploy a producción borra ese cambio silenciosamente**, porque el `updateMany` se ejecuta por `plan`, sin distinguir si el valor fue seteado a mano.

**Esto rompe directamente el pedido del usuario** si no se corrige.

**Recomendación:** convertir el backfill de `lmsEnabled`/`examsEnabled` por institución en una operación *verdaderamente* de una sola vez (no en cada build), y mover la responsabilidad de fijar el flag correcto al momento en que realmente cambia (alta de institución, cambio de plan, toggle manual del SuperAdmin). Opciones concretas a decidir con Edgardo:

- **Opción A (recomendada):** sacar el loop de `AcademicInstitution.updateMany` del pipeline de `pnpm build`. Dejar `seedPlanCodes` solo para upsert de `PlanLimits` (eso sí es idempotente y seguro de repetir). El backfill de instituciones legacy ya corrió — convertirlo en un script manual (`pnpm db:seed:plans` ya existe como comando aparte, línea `package.json:19`) que se ejecuta a demanda, no en cada deploy.
- **Opción B:** agregar un campo `lmsEnabledOverride: Boolean?` (nullable) separado de `lmsEnabled`, donde `null` = "seguir la regla del plan" y `true/false` = "decisión manual que el seeder debe respetar". Más flexible pero agrega un campo y lógica extra — no es necesario si se aplica la Opción A.

Se sugiere **Opción A** por ser la más simple (YAGNI) y no requerir migración.

### 3.2 — El gating de `/aula/*` en `proxy.ts` lee el JWT, no la DB (puede quedar desincronizado)

- El **Sidebar** (`[slug]/layout.tsx:101-104`) consulta `getInstitutionFlags` **en cada request** → refleja el toggle de inmediato, sin relogin. Ya hay un comentario explícito en el código sobre esto (línea 107-108: *"El JWT no lo lleva porque cambia, así que se resuelve por request"*) aplicado a otro campo análogo (`coordinatedProgramIds`), mismo patrón.
- El **proxy** (`src/proxy.ts:110`) en cambio usa `session.user.lmsEnabled`, que viene del JWT y **solo se recalcula en el próximo login** (`src/features/auth/auth.ts:141-142` y `173-174`, ambos dentro de bloques `if (user && ...)`, que solo corren en el sign-in inicial).

**Consecuencia concreta:** si el SuperAdmin habilita LMS para una institución con un Administrador ya logueado, ese Administrador va a **ver** "Aula Virtual" en el Sidebar (porque el layout lee fresco) pero al hacer clic el `proxy.ts` lo va a **redirigir** a `/{slug}/settings?notice=lms_disabled` porque su JWT todavía dice `lmsEnabled: false`. Confusión garantizada para el usuario final.

**Recomendación:** no es necesario resolver esto con infraestructura nueva (evitar leer Prisma en Edge runtime). Es un patrón ya existente en la app (los cambios de plan también tardan hasta el próximo login en reflejarse del todo). Mitigación mínima y suficiente:
1. Documentar el comportamiento esperado: "el cambio de Aula Virtual aplica de inmediato para refrescar el menú, pero el acceso a `/aula` requiere que el usuario vuelva a iniciar sesión".
2. Mostrar ese mensaje en el propio `/config/institutions` al togglear (toast: "Listo. El usuario deberá cerrar sesión y volver a entrar para acceder a Aula Virtual").
3. (Opcional, no bloqueante) cambiar el copy del aviso en `/{slug}/settings?notice=lms_disabled` para cubrir también el caso "tu sesión está desactualizada, cerrá sesión y volvé a entrar", no solo "tu institución no tiene Aula Virtual".

---

## 4. Parte A — Toggle de `lmsEnabled` en `/config/institutions`

Cambios concretos, en orden:

1. **`src/features/institutions/schemas/institution.schemas.ts`** — agregar a `institutionSchema` (línea 17, junto a `active`):
   ```ts
   lmsEnabled: z.boolean().default(false),
   ```
2. **`src/features/institutions/components/InstitutionsClient.tsx`** — en `InstitutionForm` (línea ~218-376):
   - Agregar `lmsEnabled: institution?.lmsEnabled ?? false` a los defaultValues (cerca de línea 236-237).
   - Agregar un `<Switch>` (mismo patrón que el de `active`, línea ~620) con label "Aula Virtual habilitada" y un texto de ayuda corto ("Muestra los menús Aula Virtual y Clases en vivo a esta institución").
   - Opcional/recomendado: mostrar una columna o badge en la tabla de instituciones indicando si tiene LMS habilitado (mismo patrón visual que el badge de `active`).
3. **`src/features/institutions/actions/mutations.ts`** — `updateInstitution` y `createInstitution` **no requieren cambios**: ya hacen `data: parsed.data` con spread directo del Zod parseado.
4. **Resolver el conflicto 3.1 antes o junto con este cambio** (sin eso, el toggle se revertiría en el próximo deploy).
5. Agregar el toast/mensaje mencionado en 3.2 al guardar el toggle.

No requiere migración de Prisma (el campo ya existe).

---

## 5. Parte B — Caso "Pepe PreU" (institución existente quiere vender un curso B2C)

Con la Parte A resuelta, el flujo para que una institución abra matrícula externa a un curso ya es 100% el existente, sin desarrollo adicional:

1. SuperAdmin (o el propio admin de la institución, si se decide auto-servicio — ver Parte C) habilita `lmsEnabled=true` para "Pepe PreU" desde `/config/institutions`.
2. El admin de "Pepe PreU" entra a `/pepe-preu/aula`, crea un `LmsCourse` (ya soportado, Fase 1) y lo marca `isPublic: true` + define `price` (ya soportado, Fase 4 — falta confirmar si el formulario de creación/edición de curso en `LmsCourseEditorClient.tsx` expone esos dos campos; **verificar antes de implementar, no asumido en esta investigación**).
3. El curso aparece automáticamente en `/pepe-preu/cursos` (catálogo público).
4. Un alumno externo compra vía `/pepe-preu/checkout/[courseId]` → MercadoPago → webhook `mercadopago-b2c` → matrícula automática + email de activación. Todo esto ya funciona.

**Único punto a verificar antes de dar esto por "no requiere código":** confirmar que el editor de curso (`src/features/lms/components/LmsCourseEditorClient.tsx`, no leído en esta investigación) ya expone los campos `isPublic` y `price` en su formulario. Si no los expone, es un agregado menor y acotado a ese componente + su schema/action de `courses.ts`.

---

## 6. Parte C — Comercializar "Institución con Aula" en `L3Pricing.tsx`

Esto es lo único genuinamente nuevo desde el punto de vista comercial/checkout. Decisión de diseño recomendada (evitar sobre-ingeniería, no crear un nuevo tipo de producto/billing):

**No crear un nuevo plan en el array `PLANS`.** En cambio, agregar un **add-on opcional** "+ Aula Virtual" a los planes pagos existentes (`DOCENTE`, `COLEGIO`), reutilizando toda la infraestructura de `Subscription` que ya existe (no hace falta un modelo de billing nuevo):

1. **`L3Pricing.tsx`** — en `PlanCard` para `docente` y `colegio`: agregar un checkbox/switch "Agregar Aula Virtual (+ $X.XXX/mes)" que:
   - Suma el recargo al precio mostrado en `PriceDisplay`.
   - Pasa un query param a la URL de registro, ej. `/registro/colegio?addon=lms`.
2. **`src/app/(signup)/registro/[plan]/page.tsx`** y **`PayerForm`** — leer el query param y pasarlo como prop hasta `createPaidCheckout`.
3. **`src/features/subscriptions/actions/signup.ts`**:
   - `createPaidCheckout` — si viene el addon, guardarlo en `Subscription.metadata` (campo `Json?` ya existe, `prisma/schema.prisma:649` — **sin migración**), ej. `{ addonLms: true }`.
   - `completeRegistration` — al crear la `AcademicInstitution`, leer `subscription.metadata.addonLms` y setear `lmsEnabled: true` directamente en el `create()` (línea ~305-314).
4. **`src/features/subscriptions/lib/mercadopago.ts`** — `getAutoRecurring`/`PLAN_PRICES` (líneas 13-26): sumar un monto fijo de addon al `transaction_amount` cuando corresponda. Definir el precio del addon (ej. $9.990/mes) — **pendiente de decisión comercial de Edgardo, no técnica.**
5. **Plan "Institución" (custom quote)** — agregar un checkbox "Incluir Aula Virtual" al formulario de `QuoteDialog.tsx` (campo libre, ya envía `message`/datos por email vía `requestInstitutionalQuote`); la activación de `lmsEnabled` para este caso queda manual vía `/config/institutions` (Parte A), igual que hoy se gestiona todo el plan Institución.

**Importante:** este flujo de addon de pago **requiere que las instituciones nuevas creadas vía `signup.ts` empiecen a setear `lmsEnabled` explícitamente** (hoy no lo hacen, sección 2). Si se implementa la Parte C, aprovechar para que `completeRegistration` también fije `lmsEnabled: true` automáticamente cuando el plan es `COLEGIO`/`INSTITUCIONAL` aunque no se compre el addon explícito — **a decidir con Edgardo si COLEGIO debe incluir LMS por defecto o ser siempre opcional/pago aparte.**

---

## 7. Parte D — "Preu PDV" (programa propio de Aulika, venta directa B2C en la Home)

Aquí la recomendación fuerte es **reutilizar el mismo motor B2C que ya existe**, en vez de construir un flujo paralelo. "Preu PDV" se modela igual que cualquier institución que vende un curso, no como un sistema nuevo:

1. Crear, vía `/config/institutions` + la Parte A, una institución dedicada (ej. slug `aulika-preu-pdv`, nombre "Aulika — Preu PDV"), con `lmsEnabled=true`, `plan: INSTITUCIONAL` (uso interno, no facturado vía MP — análogo a cómo ya existe la institución `aulika-demo` con `isDemo=true`, ver CLAUDE.md sección "Modo Demo").
2. Crear el `LmsCourse` "Preu PDV — Intensivo PAES" desde `/aulika-preu-pdv/aula` (admin existente), `isPublic: true`, `price` definido.
3. El checkout, pago y matrícula son **exactamente** el flujo B2C de la Parte B — cero código nuevo en backend.
4. En la Home (`src/app/(public)/page.tsx`), agregar una sección o banner nuevo (ej. `L3PreuPDV.tsx`, siguiendo el patrón de los componentes `L3*` existentes) con copy de venta directa ("Prepárate para la PAES con nuestro Preuniversitario intensivo") y CTA que linkea directo a `/aulika-preu-pdv/cursos/[courseId]` (o al catálogo `/aulika-preu-pdv/cursos` si va a haber más de un curso a futuro).
   - Ubicación sugerida: nueva sección entre `L3Segments` y `L3Pricing`, o como variante de `L3CTA.tsx` (que ya tiene la estructura de banner oscuro con CTA, líneas 1-64) — **decisión de UX/diseño, no técnica.**
5. Agregar la nueva ruta pública al sitemap (`src/app/sitemap.ts`) — regla obligatoria del proyecto (CLAUDE.md, sección SEO).

**Por qué este enfoque y no uno custom:** evita duplicar lógica de pago/matrícula/activación que ya está probada (271 tests pasando según CLAUDE.md), cumple DRY, y el "producto" Preu PDV en sí es solo datos (una institución + un curso), no código.

---

## 8. Documentación a actualizar (regla obligatoria del proyecto)

Al cerrar la implementación, en la misma tarea:
- Actualizar `CLAUDE.md`:
  - Corregir la sección "Pendiente (Fase 5 — GLM-5.2)" del bloque "Planes Flexibles e Inscripciones B2C" — el webhook y los seeders de PlanLimits **ya están implementados**, no pendientes.
  - Documentar el nuevo toggle `lmsEnabled` en `/config/institutions`.
  - Documentar el addon "Aula Virtual" en planes pagos (si se implementa la Parte C).
  - Documentar la institución/curso "Preu PDV" y la nueva sección de Home.
- Append en Obsidian (`~/SitesDoc/nextjs_projects/next-quiz/next-quiz.md`) con el resumen del cambio, según el comando ya estandarizado en CLAUDE.md.

---

## 9. Decisiones que requieren confirmación explícita de Edgardo antes de codear

1. **Conflicto 3.1 (seeder vs. toggle manual):** ¿aprueba sacar el backfill de instituciones del pipeline de `pnpm build` (Opción A, recomendada) o prefiere el campo `lmsEnabledOverride` separado (Opción B)?
2. **Parte C — modelo comercial del addon:**
   - ¿"Aula Virtual" es un add-on pago opcional sobre DOCENTE/COLEGIO, o debe venir incluido gratis en COLEGIO/INSTITUCIONAL (como ya sugiere el seeder `INSTITUTION_BACKFILL` actual)?
   - Precio mensual del addon, si aplica.
3. **Parte C — auto-servicio vs. asistido:** ¿el toggle de `/config/institutions` queda solo para SuperAdmin (control manual, como hoy con `active`), o el propio Administrador de la institución debe poder activarlo desde `/[slug]/settings` (con cobro)? Esta investigación asumió **solo SuperAdmin**, igual que el resto de `/config/institutions`.
4. **Parte D — naming y alcance de "Preu PDV":** ¿es un único curso o varios (ej. por asignatura PAES)? Define si el CTA de Home apunta a un curso específico o al catálogo `/aulika-preu-pdv/cursos`.
5. **Parte D — slug/branding:** confirmar el slug definitivo de la institución interna (propuesto `aulika-preu-pdv`) y si debe tener layout público propio distinto al genérico `(public)/[slug]/layout.tsx` (ej. con identidad visual "Preu PDV" en vez del logo Aulika genérico).

---

## 10. Orden de implementación sugerido

1. Resolver conflicto 3.1 (seeder) — bloqueante para todo lo demás.
2. Parte A — toggle `lmsEnabled` en `/config/institutions` (incluye mitigación 3.2).
3. Verificar/probar Parte B end-to-end con una institución de prueba (confirmar que `LmsCourseEditorClient` expone `isPublic`/`price`).
4. Definir con Edgardo las decisiones de la sección 9 (puntos 2 y 3) antes de tocar `L3Pricing.tsx`.
5. Parte C — addon en `L3Pricing.tsx` + registro + MercadoPago.
6. Parte D — institución/curso "Preu PDV" (dato) + sección Home + sitemap.
7. Actualizar CLAUDE.md + Obsidian (sección 8).
