# Plan: Resolución de warnings de Biome

> Plan crudo (fase `01_raw`). Pendiente de consolidación en `02_inbox/`.

## Contexto

- **92 warnings**, 0 errores (tras fix a11y de `MyCoursesWidget.tsx`).
- Fuente de medición: `pnpm exec biome check . --max-diagnostics=400`.
- No bloquean el build, pero representan deuda técnica y varios ocultan bugs
  reales (render React, crashes en runtime, código muerto).
- Meta realista: reducir a **< 20** (algunos warnings tienen `biome-ignore`
  justificado como `legacy` y no conviene forzarlos a 0).

## Distribución por regla

| Regla Biome                                  | Count | Categoría         | Riesgo                         |
| -------------------------------------------- | ----- | ----------------- | ------------------------------ |
| `complexity/noExcessiveCognitiveComplexity`  | 37    | Deuda técnica     | Mantenibilidad (medio)         |
| `correctness/noUnusedVariables`              | 22    | Bug potencial     | Código muerto (bajo-medio)     |
| `suspicious/noArrayIndexKey`                 | 20    | Bug potencial     | Render React (medio)           |
| `style/noNonNullAssertion`                   | 8     | Robustez          | Crash runtime si null (medio)  |
| `correctness/noUnusedFunctionParameters`     | 4     | Bug potencial     | Bajo                           |

## Top archivos con más warnings

| Archivo                                                        | Count |
| -------------------------------------------------------------- | ----- |
| `src/app/(students)/students/dashboard/page.tsx`               | 5     |
| `src/app/(students)/students/dashboard/loading.tsx`            | 4     |
| `src/features/results/components/LiveResultsClient.tsx`        | 3     |
| `src/features/lms/lib/at-risk-detector.ts`                     | 3     |
| `src/features/lms/components/LmsLessonViewer.tsx`              | 3     |
| `src/features/exam-session/components/ExamCarousel.tsx`        | 3     |
| `src/app/(admin)/[slug]/aula/clases/page.tsx`                  | 3     |
| `src/features/students/lib/dashboard-queries.ts`               | 2     |
| `src/features/questions/components/QuestionsClient.tsx`        | 2     |
| `src/features/lms/components/LmsTaskSubmissionForm.tsx`        | 2     |
| `src/features/lms/components/LmsGradebookClient.tsx`           | 2     |
| `src/features/lms/actions/live-chat.ts`                        | 2     |
| `src/features/lms/actions/analytics.ts`                        | 2     |
| `src/features/landing/components/L3Hero.tsx`                   | 2     |
| `src/features/landing/components/L3Comparison.tsx`             | 2     |
| `src/features/dashboard/components/DashboardClient.tsx`        | 2     |
| `src/app/api/webhooks/mercadopago/route.ts`                    | 2     |
| `src/app/(admin)/[slug]/aula/[id]/certificados/page.tsx`       | 2     |
| (+ ~30 archivos con 1)                                         | ...   |

## Priorización y estrategia

### P1 — Correctness & runtime (alto valor, cambios acotados)

**1. `suspicious/noArrayIndexKey` (20)** — reemplazar `key={index}` por un id
estable en listas React. Riesgo real: bugs de render, estado mezclado entre
ítems al reordenar/eliminar. Validar con QA visual en flujos de listas
(dashboard, foros, gradebook, resultados). Si no hay id natural, generar uno
derivable del contenido.

**2. `style/noNonNullAssertion` (8)** — reemplazar `foo!` por guards / narrowing
real. Riesgo: crash en runtime si llega `null`/`undefined`. Cada caso requiere
entender el contexto (¿puede ser null de verdad? → guard; si no, documentar con
tipo correcto). Evitar el `!` a ciegas.

**3. `correctness/noUnusedVariables` (22) + `noUnusedFunctionParameters` (4)** —
eliminar o prefijar con `_`. Auto-fixable con `biome check --write`, **PERO**
revisar caso por caso: un `total` o `count` sin usar puede ser un bug real
(destructuring incompleto, query que debería usarse) y no solo ruido. Ejemplo ya
detectado: `total` en `src/app/(admin)/config/students/page.tsx:16` y `count` en
`src/app/(admin)/config/.../page.tsx:14`.

### P2 — Complejidad (deuda, refactor cuidadoso)

**4. `complexity/noExcessiveCognitiveComplexity` (37)** — funciones demasiado
largasas/anidadas. Varios ya marcados `biome-ignore: legacy ...; refactor
tracked separately`. Estrategia: refactor por feature extrayendo helpers
pequeños (early returns, funciones puras). Top archivos: `dashboard/page.tsx`,
`LiveResultsClient`, `at-risk-detector`, `LmsLessonViewer`, `ExamCarousel`,
`aula/clases/page`. Requiere tests/qa en cada uno.

## Plan de ejecución (fases)

- **Fase 0 — Baseline.** Registrar count actual (92) y listar por regla/archivo
  (`biome check . --max-diagnostics=400`). Confirmar 0 errores.
- **Fase 1 — Auto-fix supervisado.** `pnpm lint:fix` (aplica prefijo `_` a
  variables/params sin uso). **Revisión manual posterior** para distinguir
  ruido de bugs. Commit: `refactor: remove unused vars/params (biome auto-fix)`.
- **Fase 2 — noArrayIndexKey + noNonNullAssertion (P1 manual).** Por feature,
  con QA visual tras cada lote. Un commit por feature para bisectar si algo
  rompe.
- **Fase 3 — noExcessiveCognitiveComplexity (P2).** Refactor por archivo, con
  `pnpm test:run` tras cada uno. Mantener los `biome-ignore` legacy que tengan
  justificación válida.
- **Fase de cierre.** Verificar count < 20, correr `pnpm type-check`,
  `pnpm test:run`, `pnpm lint`, y actualizar este plan en `04_archive/`.

## Verificación tras cada fase

```bash
pnpm type-check        # 0 errores
pnpm test:run          # suite verde
pnpm exec biome check . --max-diagnostics=400   # count baja
```

## Riesgos y notas

- `noArrayIndexKey`: cambiar keys puede alterar comportamiento de listas con
  estado interno (inputs controlados, animaciones). QA obligatorio.
- `noNonNullAssertion`: quitar `!` puede exponer paths de null no manejados;
  compensar con guards o tipos más precisos.
- `complexity`: el refactor puede introducir regresiones; ir archivo por archivo
  con tests.
- Varios `biome-ignore` legacy son intencionales (no forzar su eliminación).
- **Este plan es crudo (`01_raw`)**; al consolidar, definir alcance por sprint y
  responsables.
