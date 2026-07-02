# Plan — Habilitación Aula Virtual + Comercialización B2C + "Preu PDV"

**Autor:** MiniMax-M3 — plano crudo, **no ejecutar directamente**. Anexo de investigación de mercado al plan previo `claude-preu-pdv.md`.
**Fecha:** 2026-06-30
**Branch actual:** `aula-v1`
**Estado:** Investigación de mercado (webfetch) terminada. Sin cambios de código aplicados todavía.

> **Convención de lectura:** este archivo **complementa** `claude-preu-pdv.md` (188 líneas), que ya cubre la auditoría técnica completa del código actual, los conflictos críticos (seeder vs. toggle manual, JWT vs. DB), y las Partes A-D de implementación. Acá se agrega **solo lo nuevo**: (a) benchmark del mercado chileno de preuniversitarios, (b) pricing recomendado para Aulika, (c) features que Aulika todavía no tiene y que PDV/CPECH ofrecen como estándar, (d) decisiones de UX/modelo de producto inspiradas en la industria. No se duplica nada del plan previo — leerlos en paralelo.

---

## 1. Pedido original (Edgardo) — recordatorio

1. No todas las instituciones tienen habilitado el Aula Virtual.
2. En `/config/institutions` (editar institución) se debe poder habilitar/deshabilitar el Aula Virtual por institución.
3. Eso debe prender/apagar en el Sidebar de esa institución los items **Aula Virtual** y **Clases en vivo**.
4. Una institución como "Pepe PreU" tiene que poder abrir matrícula de alumnos externos a su curso de pre-universitario (B2C).
5. Investigar cómo funcionan instituciones chilenas que venden cursos preuniversitarios (PDV, CPECH, etc.) — modalidad, costos, formas — para que Aulika no improvise.

Puntos 1-4 están resueltos conceptualmente en `claude-preu-pdv.md` (Parte A = toggle, Parte B = flujo B2C ya existente, Parte C = addon comercial, Parte D = "Preu PDV" como institución/curso). El punto 5 es lo que este archivo agrega.

---

## 2. Benchmark del mercado chileno — Preu PDV (Pedro de Valdivia)

Fuente primaria: `https://www.preupdv.cl` (home + programas + FAQ + becas + admisión). Datos complementarios de `cinnamoncat.cl` (oct 2025) y `comparapreuniversitarios.com`.

### 2.1 Modelo de negocio

- **No es solo preuniversitario**, es un ecosistema: **PDV** (preu PAES), **Sube Notas** (1°-2° medio), **+Programas propios** (becas, materiales digitales, app móvil).
- 39 sedes físicas en Chile + canal de venta online (`ventaonline.preupdv.cl`).
- **+48 años de trayectoria** (posicionamiento de marca) — argumento central de venta ("líderes en puntajes PAES", "100% de las sedes con puntajes máximos nacionales", "más de 700 puntajes máximos nacionales").
- **Resultado verificable como argumento de venta:** puntajes PAES 2025 de alumnos reales exhibidos en la home (Magdalena Rojas, Matilde Torres, etc. — 1000 puntos en PAES Competencia Matemática M1).
- "Modelo Educativo 360°": **contenidos + docentes + ejercitación + evaluación + orientación**. Mismo eslogan en 360° se repite en todas las landings (es su diferenciador declarado).

### 2.2 Oferta académica (cómo segmentan)

Programas por nivel:

| Nivel | Programas | Modalidades |
|---|---|---|
| 1° Medio | Sube Notas | (no detalla modalidades en `/programas`) |
| 2° Medio | Sube Notas | (no detalla modalidades) |
| 3° Medio | PAES | Sala Grupo de Estudio · Sala Tradicional |
| 4° Medio | Tradicional · Esencial · Dynamic | Sala Grupo de Estudio · Sala Tradicional |
| Egresados | (similar a 4° Medio) | Sala Grupo de Estudio · Sala Tradicional |

**Observación para Aulika:** el concepto de "Sala Grupo de Estudio" vs "Sala Tradicional" es exactamente la diferenciación que el LMS de Aulika soporta vía **lecciones en vivo (Fase 6 — Daily.co)** vs **lecciones grabadas/asincrónicas**. Es decir, Aulika **ya tiene la primitiva técnica** que PDV vende como diferenciador, solo falta exponerla comercialmente.

### 2.3 Pricing (CLP, fuente: cinnamoncat.cl — verificación de campo recomendada con PDV)

| Modalidad | Duración | Precio aprox. (CLP) |
|---|---|---|
| Curso completo presencial | 6 meses | $400.000 – $450.000 |
| Curso completo online | 6 meses | $350.000 – $400.000 |
| Curso por asignatura presencial | Mensual | $80.000 – $100.000 |
| Curso por asignatura online | Mensual | $60.000 – $80.000 |
| Costo mensual promedio del programa | — | $150.000 – $200.000 |
| Programa anual (rango total) | 1 año | **$1.200.000 – $2.000.000** |

> ⚠️ Datos de terceros, no oficiales de PDV. Para pricing exacto consultar `https://ventaonline.preupdv.cl/?utm_source=sitio_web`. **Recomendación:** validar con la institución real antes de tomar decisiones de pricing finales.

### 2.4 Formas de pago

- **Canal online (`ventaonline.preupdv.cl`):** solo tarjetas de débito y crédito vía **Transbank Webpay**. Las cuotas pueden tener interés del banco emisor.
- **Canal presencial / matrícula telefónica:** tarjeta, **cheque, pagaré, compromiso, depósito, transferencia**.
- **Cotización online disponible sin pago** (genera PDF) — reduce fricción de "no sé cuánto cuesta".
- **Boleta emitida en un plazo de 72 horas** tras el pago — confirmación legal de la matrícula.

**Observación para Aulika:** hoy el checkout B2C usa MercadoPago Checkout Pro (un solo pago o cuotas según tarjeta del usuario, mismo modelo Transbank en el fondo). Esto **ya cubre la lógica de PDV online**. Lo que Aulika **no tiene** todavía es: (a) cotización formal sin pago (un PDF de presupuesto), (b) flujo de pago presencial (cheque/pagaré) — pero ese es un problema del colegio/Pepe PreU, no de Aulika como plataforma.

### 2.5 Becas y descuentos

- **Beca 100% semanal** sorteada entre los inscritos al programa **PDVx** (clases en vivo vía streaming, su programa más premium). Sorteo semanal, devolución del dinero si el alumno ya se había matriculado.
- **Becas por NEM** (Notas de Enseñanza Media): descuentos según rendimiento académico.
- **Convenios** con colegios (Scuola italiana, etc. — listado público de PDFs): paquetes especiales para alumnos de colegios aliados.
- **Convenios con cajas de compensación** (Caja Los Andes): descuentos del 40% con código.
- **Descuento online único:** "Nuestra venta online tiene un porcentaje único de descuento y no se aplican descuentos adicionales" — política explícita, sin狡辩 sobre叠 descuentos.

**Observación para Aulika:** **el modelo de becas es uno de los grandes ausentes del LMS/B2C actual**. `LmsOrder` solo tiene `amount` (lo que se pagó) y `status`. No hay:
- Cupones de descuento (`couponCode`).
- Becas parciales (descuento sobre el precio público).
- Sorteos / promociones temporales.
- Convenios institucionales (precio diferenciado por colegio).
- Flag de "alumno becado" para reportes.

Esto es **un gap grande** si Aulika quiere ser competitiva con PDV/CPECH como plataforma de preuniversitarios. PDV lo ofrece como gancho principal de marketing.

### 2.6 Materiales incluidos en el precio

- **Libro digital** incluido según programa y modalidad.
- **Plataforma académica** (videos, ejercitación, ensayos, seguimiento).
- **App Preu PDV** (iOS + Android) con **tutor IA 24/7**.
- **App Preu PDV Lab**: centro de recursos virtuales interactivos y audiovisuales.
- **JEG** (Jornadas de Evaluación General): **4 ensayos presenciales + 4 ensayos online al año**, el primero como diagnóstico.

**Observación para Aulika:** el LMS actual cubre:
- ✅ Plataforma académica (lecciones video/documento/texto/enlace/examen/tarea/en vivo).
- ✅ Ejercitación y tareas (Fase 2 — `LmsAssignment`, `LmsSubmission`).
- ❌ Examen/ensayo masivo tipo PAES con corrección automática — Aulika sí tiene **exámenes** como modelo (`Exam`), pero no hay un "modo ensayo PAES" específico. Los exámenes existentes son los de la institución (matemática, lenguaje, etc.), no simulacros tipo DEMRE.
- ❌ Tutor IA 24/7 (existe Gemini para resúmenes de lecciones en `summaryJson`, pero no un tutor conversacional disponible para el alumno).
- ❌ Libro digital (no hay modelo de "libro" en el LMS — sí hay módulos con lecciones).
- ❌ App móvil nativa (es web responsive, sin app dedicada).

### 2.7 Flujo de inscripción (paso a paso, lo que vive un alumno)

1. **Cotiza online** → `ventaonline.preupdv.cl` → llena formulario con RUT, nombre, email, teléfono, sede, curso → recibe cotización (sin pagar).
2. **Pago online** (Transbank) → boleta en 72 hs.
3. **Acceso a plataforma** inmediato tras boleta → "Mi Zona Preu" (`mzp.preupdv.cl`) y app móvil.
4. **Ensayo de diagnóstico** (JEG #1) como primera actividad.
5. **Cambios de profesor/horario** posteriores a matrícula vía la app.
6. **Seguimiento** vía app + plataforma, con reportes a apoderado incluidos.

**Observación para Aulika:** el flujo **Cotiza → Paga → Activa cuenta → Entra al LMS** ya existe en Aulika (`/[slug]/cursos` → `/[slug]/checkout/[courseId]` → webhook MP → email activación → `/examen/activar`). Lo que Aulika **no tiene**:
- Página pública de **cotización formal** (hoy la cotización es el mismo checkout — no hay paso intermedio de "solo pedir presupuesto").
- **Reporte a apoderado** (no hay relación tutor/alumno/apoderado en el modelo actual — solo RUT + email del comprador).

---

## 3. Benchmark del mercado chileno — CPECH (Cpech)

Fuente: `https://www.cpech.cl` + `/admision`.

### 3.1 Modelo

- "40 años de experiencia", 35 sedes, 800 docentes, +16.000 recursos académicos.
- **3 modalidades bien diferenciadas** en su naming:
  - **+Sala** (presencial en sede).
  - **+En línea** (online en vivo, con interacción).
  - **+E-learning** (asincrónico puro, plataforma).
- **Programas por nivel** (1° a 4° medio, egresados, exámenes libres +18/-18, +Orientados).
- Sistema **100% telefónico y presencial** — el único canal online es un formulario que captura el lead y un ejecutivo comercial contacta después. (Más conservador que PDV.)

### 3.2 Pricing y formas de pago

- No publica precios en la web (solo bajo cotización).
- Acepta pagos en sede, online, ejecutivo comercial.
- Más tradicional y opaco en pricing que PDV.

**Observación para Aulika:** CPECH es **menos relevante como benchmark** porque su modelo comercial depende de ejecutivos y no escala bien a una plataforma auto-servicio como Aulika. PDV es el referente más cercano a lo que Aulika puede/debe aspirar.

---

## 4. Brecha Aulika ↔ mercado — qué falta para ser competitivo

Comparación honesta de capacidades, asumiendo implementadas las Partes A-D del plan previo (`claude-preu-pdv.md`):

| Capacidad | PDV/CPECH (estándar) | Aulika hoy | Gap |
|---|---|---|---|
| LMS con video/documento/tarea/examen | ✅ | ✅ (Fases 1-5) | — |
| Clases en vivo (videollamada) | ✅ ("Sala Grupo de Estudio", "En línea") | ✅ (Fase 6 — Daily.co) | — |
| Compra online B2C con MercadoPago | ✅ | ✅ (Fase 4) | — |
| Activación de cuenta tras pago | ✅ | ✅ (Fase 4 — `b2c-activation`) | — |
| **Multi-sede física** de la institución | ✅ (PDV 39 sedes, CPECH 35) | ❌ (no hay modelo multi-sede) | 🟡 medio |
| **Becas y descuentos** programáticos | ✅ (NEM, convenios, sorteos 100%) | ❌ (no hay modelo de cupones/becas) | 🔴 alto |
| **Cotización formal** sin pago | ✅ (PDF sin compromiso) | ❌ (el checkout exige pagar) | 🟡 medio |
| **Ensayo masivo tipo PAES** (simulacro DEMRE) | ✅ (JEG — 8 al año) | ⚠️ parcial (existen `Exam`, pero no como simulacro público masivo) | 🟡 medio |
| **Libro digital** como unidad académica | ✅ | ❌ (hay módulos/lecciones, no "libro") | 🟢 bajo |
| **App móvil nativa** (iOS/Android) | ✅ (Preu PDV, Preu PDV Lab) | ❌ (web responsive) | 🟢 bajo (no prioritario) |
| **Tutor IA conversacional 24/7** | ✅ | ⚠️ parcial (Gemini solo resume lecciones, no chatea) | 🟡 medio |
| **Reporte a apoderado** | ✅ | ❌ (no hay modelo de apoderado) | 🟡 medio |
| **Cambio de horario/profesor post-matrícula** | ✅ (vía app) | ❌ (no hay flujo de "reasignación") | 🟢 bajo |
| **Modelo multi-curso con bundle** (suscripción anual a varios cursos) | ✅ (Sube Notas 1°+2°, PAES anual, etc.) | ❌ (cada curso es independiente) | 🟡 medio |
| **Reputación y puntajes reales de alumnos** | ✅ (testimonials de 1000 puntos en home) | ❌ (no hay showcase de resultados) | 🟢 bajo |

### 4.1 Tres gaps que sí deberíamos priorizar (alto impacto / costo manejable)

**GAP-1 — Modelo de becas y descuentos (🔴 alto)**
- Hoy `LmsOrder` solo guarda `amount` y `status`. No hay forma de representar "este alumno tiene 50% beca NEM" o "este cupón da 20% de descuento".
- Decisión sugerida: **fase separada posterior** a este plan. Si se prioriza, agregar a `LmsCourse`: `originalPrice`, `hasScholarship`, `scholarshipPercent`. A `LmsOrder`: `discountCode`, `discountAmount`, `scholarshipReason`. A `AcademicInstitution`: `nemBecaEnabled`. UI: nuevo card en `LmsCoursesListClient` + `LmsCourseEditorClient`, flujo de "validar RUT contra NEM" en checkout.
- **Bloqueante para Parte D ("Preu PDV") si se quiere vender con descuento de lanzamiento.** No bloqueante para Parte B (Pepe PreU cobra precio lleno).

**GAP-2 — Multi-sede (🟡 medio)**
- PDV tiene 39 sedes físicas. Para Aulika esto es **fundamental para vender a instituciones como Pepe PreU que tienen varias sedes**.
- Hoy `AcademicInstitution` no tiene modelo de sedes. La tabla `LmsCourse` no tiene FK a sede.
- Decisión sugerida: **fase separada posterior**, no crítica para MVP. Si se prioriza, agregar `InstitutionCampus` (FK a `AcademicInstitution`) y opcionalmente `LmsCourseCampus` (M:N). UI: gestión desde `/[slug]/settings` o nueva sección `/[slug]/campus`.
- **No bloqueante** para Parte B (Pepe PreU de una sede) ni Parte D (Preu PDV como institución con una sede de Aulika).

**GAP-3 — Cotización formal sin pago (🟡 medio)**
- Hoy el checkout exige pagar inmediatamente. PDV deja pedir cotización primero.
- Decisión sugerida: agregar `/[slug]/cursos/[courseId]/cotizar` que pide RUT + email + nombre y genera un PDF (vía `react-pdf`, ya instalado para certificados) con el precio del curso + datos de contacto. **Sin pago**. Reusa `LmsOrder` con `status='PENDIENTE'` + nuevo campo `isQuote: Boolean` para diferenciarlo. La cotización se "convierte" en orden de pago al confirmarla el alumno.
- **No bloqueante** para Parte B/D pero **mejora significativamente la conversión** de Leads (es lo que PDV explota — "cotiza sin compromiso").

### 4.2 Gaps que NO priorizar ahora (costo alto / beneficio incierto)

- App móvil nativa: PWA responsive es suficiente para MVP.
- Libro digital: reusar el modelo de módulos es suficiente.
- Tutor IA conversacional: extensión futura, no core para venta inicial.
- Reporte a apoderado: requiere repensar el modelo de identidad (¿otro `UserRole`?).

---

## 5. Pricing recomendado para Aulika B2C

Basado en benchmark PDV/CPECH, considerando que Aulika es **plataforma** (no preu presencial con costos de sede, infraestructura física, profesores full-time):

### 5.1 Rango sugerido para cursos Aulika (un curso puntual, no plan anual)

| Producto Aulika | Precio sugerido (CLP) | Justificación |
|---|---|---|
| Curso corto (≤ 8 lecciones) | $19.990 – $39.990 | Precio de entrada bajo, similar a cursos de Udemy Chile. |
| Curso medio (8-20 lecciones) | $59.990 – $99.990 | Rango de cursos especializados. |
| Curso largo / preu completo (20+ lecciones) | $149.990 – $299.990 | Por debajo del PDV anual pero con modelo 100% online (sin gastos de sede). |
| Plan anual multi-curso | $499.990 – $799.990 | Bundle con descuento, similar a "PDV anual" pero sin presencial. |

### 5.2 Pricing diferenciado por tipo de institución

- **Institución nueva FREE:** puede vender cursos a precio sugerido arriba (o el que la institución defina). Aulika se queda con una comisión.
- **Institución COLEGIO/INSTITUCIONAL:** la institución pone su propio precio (ya soportado, `LmsCourse.price`). Aulika cobra fee fijo por venta o % (a definir con Edgardo, no en este plan).
- **"Preu PDV" propio de Aulika:** precio sugerido arriba (rango $149.990-$299.990 para curso intensivo). Es el único donde Aulika es dueño del precio.

### 5.3 Lo que NO está decidido y requiere input de Edgardo

1. **¿Aulika cobra comisión por venta o es flat-fee por uso de plataforma?** Modelo "marketplace" (% por venta) vs "SaaS mensual" (fee fijo por institución). PDV cobra directo al alumno y retiene todo; Aulika como plataforma debería elegir uno.
2. **Precio definitivo del addon "+ Aula Virtual" en planes pagos DOCENTE/COLEGIO** (Parte C del plan previo). Sugerencia: $9.990-$19.990/mes por debajo del costo de un preu individual.
3. **Política de becas:** ¿Aulika subsidia becas como gancho de marketing (tipo "100% beca semanal" de PDV), o las becas son 100% responsabilidad de la institución que vende?
4. **Política de reembolso:** ¿Aulika retiene X% si el alumno desiste dentro de los primeros 7 días? MercadoPago permite devoluciones, pero hay que definir política.

---

## 6. UX/UI — ideas inspiradas en PDV para las pantallas Aulika

(Decisión final de UX la tiene el equipo de diseño — estas son recomendaciones, no specs).

### 6.1 Catálogo público `/[slug]/cursos`

Tomar como referencia la home de PDV: **resultados reales primero** (testimonials + puntajes), **después oferta**. Sugerencia:

- Agregar al `PublicCourseCard` un badge "Top nacional" o "Más vendido" si aplica (lógica de negocio después).
- Mostrar contador de alumnos inscritos si > X (social proof).
- Link a "Resultados de nuestros alumnos" si la institución tiene track record.

### 6.2 Detalle curso `/[slug]/cursos/[courseId]`

PDV estructura la página de cada programa con: nombre, descripción, "Ver Sala Grupo de Estudio / Ver Sala Tradicional" (modalidad), galería de imágenes, "Deja tus datos / Cotiza aquí" como CTAs gemelos. Sugerencia para Aulika:

- Mantener la card de precio + CTA "Comprar" (ya existe).
- Agregar tab o sección "**Modalidades disponibles**" si el curso tiene lección `EN_VIVO` (Fase 6) — mostrar "En vivo con profesor" como diferenciador.
- Sección "**Incluye**" (bullets: acceso a plataforma, libro digital X, comunidad Y, etc.) — contenido lo edita la institución en `description`.
- FAQ inline por curso (markdown o JSON configurable).

### 6.3 Checkout `/[slug]/checkout/[courseId]`

Hoy pide RUT + nombre + email + acceptTerms. PDV además pide teléfono, colegio, curso de interés, sede, "cómo deseas que te contacten", "quién está postulando". Sugerencia mínima para Aulika:

- Agregar **teléfono** (canal de comunicación post-compra, hoy no se captura → gap para soporte).
- (Opcional) agregar campo libre "**¿Cómo te enteraste?**" para atribución de marketing.
- Mostrar **política de reembolso** explícita antes del pago (link a página legal).

### 6.4 Activación `/examen/activar`

Hoy pide contraseña. PDV tras pago envía **boleta + reglamento** por email en 72 hs. Sugerencia para Aulika:

- Tras activar cuenta, enviar email con **"reglamento del alumno"** (markdown configurable por institución) — `AcademicInstitution.termsUrl` o similar.
- Pantalla post-activación con **tour guiado del LMS** (4 pasos: ver curso → unirse a clase → hacer tarea → ver progreso). Reusar la lógica de TourButton existente (CLAUDE.md sección Tour guiado).

### 6.5 Home (solo Parte D, "Preu PDV" propio)

Si Aulika vende su propio Preu, necesita una sección nueva en `src/app/(public)/page.tsx`. Sugerencia de estructura (siguiendo el patrón `L3*` existente):

```
< L3Segments  →  < L3PreuPDV />  →  < L3Pricing />
```

Donde `L3PreuPDV` es un componente nuevo tipo "hero + CTA + 3 puntos de valor + link directo al checkout":

- Hero con imagen de estudiantes + título "Prepárate para la PAES con Aulika".
- 3 bullets: "Plataforma completa", "Profesores de excelencia", "Resultados medibles".
- CTA: "Conoce el programa Intensivo PAES" → `/aulika-preu-pdv/cursos`.
- Sección "¿Por qué Aulika?": idéntica estructura a la de PDV pero con el copy propio.

> **Decisión abierta:** ¿"Preu PDV" es un único curso intensivo, o una serie (Matemática, Lenguaje, Ciencias por separado)? El plan previo `claude-preu-pdv.md` sección 9 pregunta 4 lo deja a Edgardo. Como **MiniMax-M3**, sugiero **un curso bundle "Intensivo PAES 2026"** para el lanzamiento — más simple de vender, más simple de medir conversión. Multi-curso se agrega después.

---

## 7. Decisiones que requieren confirmación de Edgardo antes de codear

Estas **se suman** a las del plan previo `claude-preu-pdv.md` sección 9 (las técnicas — seeder, addon, toggle auto-servicio, slug Preu PDV).

1. **Pricing del addon "+ Aula Virtual"** (Parte C del plan previo): $9.990 / $14.990 / $19.990 mensuales — ¿cuál?
2. **Pricing del curso "Preu PDV — Intensivo PAES" propio de Aulika** (Parte D): rango $149.990-$299.990 propuesto — ¿confirmar monto de lanzamiento?
3. **¿Becas para "Preu PDV" propio?** Si sí, GAP-1 (becas) deja de ser "futuro" y pasa a Parte D del scope.
4. **Cotización sin pago** (GAP-3): ¿prioridad para el MVP, o fase 2?
5. **¿Aulika cobra comisión por venta o fee fijo?** Afecta el modelo de `LmsOrder.amount` y el split con MercadoPago.
6. **"Preu PDV" propio**: ¿un curso único bundle o múltiples cursos por asignatura PAES?
7. **¿Agregar teléfono al checkout B2C?** PDV lo pide, hoy Aulika no. Cambio mínimo.

---

## 8. Orden de ejecución propuesto (combinado con `claude-preu-pdv.md`)

1. **Resolver conflicto 3.1 del plan previo** (seeder vs. toggle manual) — bloqueante.
2. **Parte A — toggle `lmsEnabled` en `/config/institutions`** + mitigación 3.2.
3. **Verificar Parte B** end-to-end (que `LmsCourseEditorClient` exponga `isPublic` y `price`).
4. **Decisiones de pricing** (sección 7 de este archivo) — antes de Parte C.
5. **Parte C — addon en `L3Pricing.tsx`** + registro + MercadoPago.
6. **Parte D — institución/curso "Preu PDV"** (dato) + `L3PreuPDV.tsx` + sitemap.
7. **(Opcional) GAP-3 — cotización sin pago**, si Edgardo lo prioriza.
8. **Actualizar CLAUDE.md + Obsidian**.

Gaps 4.1 priorizados (becas, multi-sede, cotización, simulacro PAES, tutor IA conversacional) **se difieren a fase posterior** — no bloquean MVP.

---

## 9. Referencias cruzadas

- **Auditoría técnica completa + Partes A-D de implementación:** ver `claude-preu-pdv.md` (mismo directorio).
- **Pipeline SPOOL:** este archivo está en `.spool/01_raw/` (plano crudo). El plan consolidado por Gemini vivirá en `.spool/02_inbox/`. El plan en ejecución en `.spool/03_work/`.
- **Benchmark PDV:** `https://www.preupdv.cl` (home, /programas, /preguntas-frecuentes, /becaspdv, /sube-notas).
- **Benchmark CPECH:** `https://www.cpech.cl` (home, /programas-cpech, /admision).
- **Precios PDV (terceros, verificación recomendada):** `https://www.cinnamoncat.cl/cuanto-cuesta-el-preuniversitario-pedro-de-valdivia-en-chile/` (28 oct 2025), `https://comparapreuniversitarios.com/preuniversitario-pedro-de-valdivia`.
- **Compara-preus general:** `https://comparapreuniversitarios.com` (lista de PDV, Cpech, UC, PreuFEN, Filadd, Puntaje Nacional, PreUNAB, PreuClass, Gauss, etc.).