/**
 * Curso: Competencia Matemática M2 (PAES Chile, Admisión 2027).
 * Temario oficial DEMRE/MINEDUC. La M2 evalúa contenidos avanzados
 * necesarios para carreras científicas e ingenierías.
 */
import { bullet, callout, codeBlock, doc, h, pText, paesExample, t } from './_tiptap';
import type { CourseSeed } from './_types';

export const m2: CourseSeed = {
    id: 'e6c7104f-9e4a-4e2e-8d8a-6b45a278fb6e',
    title: 'Competencia Matemática M2',
    description:
        'Curso avanzado de Competencia Matemática M2: álgebra, funciones exponenciales y logarítmicas, geometría analítica, trigonometría, probabilidad y estadística inferencial.',
    modules: [
        {
            title: 'Álgebra y funciones avanzadas',
            description:
                'Función exponencial, logarítmica, racional e inecuaciones.',
            lessons: [
                {
                    title: 'Función exponencial y logarítmica',
                    type: 'TEXTO',
                    durationSec: 2700,
                    contentJson: doc(
                        h(1, 'Función exponencial y logarítmica'),
                        pText(
                            'La función exponencial tiene la forma f(x) = a · b^x con b > 0 y b ≠ 1. Si b > 1 la función es creciente; si 0 < b < 1 es decreciente. Un caso particular es f(x) = e^x, base de los logaritmos naturales.',
                        ),
                        h(2, 'Propiedades clave'),
                        bullet([
                            'b^x · b^y = b^(x+y)',
                            'b^x / b^y = b^(x-y)',
                            '(b^x)^y = b^(x·y)',
                            'b^0 = 1, b^1 = b',
                        ]),
                        h(2, 'Función logarítmica'),
                        pText(
                            'El logaritmo en base b de x es el exponente al que hay que elevar b para obtener x: log_b(x) = y ↔ b^y = x. Por definición, x > 0 y b > 0, b ≠ 1.',
                        ),
                        bullet([
                            'log_b(x·y) = log_b(x) + log_b(y)',
                            'log_b(x/y) = log_b(x) - log_b(y)',
                            'log_b(x^n) = n · log_b(x)',
                            'log_b(b) = 1, log_b(1) = 0',
                        ]),
                        callout(
                            'En PAES aparecen modelos de crecimiento poblacional P(t) = P₀ · e^(kt) y desintegración radiactiva N(t) = N₀ · e^(-λt). Reconocer la estructura permite resolver sin memorizar fórmulas específicas.',
                        ),
                        h(2, 'Cambio de base'),
                        pText(
                            'log_a(x) = log_b(x) / log_b(a). Esto permite convertir entre bases con la calculadora, que típicamente ofrece log y ln.',
                        ),
                        h(2, 'Ecuaciones exponenciales y logarítmicas'),
                        pText(
                            'Se igualan bases o se aplican logaritmos a ambos lados. La idea clave: si a^u = a^v entonces u = v.',
                        ),
                        ...paesExample(
                            'Una población de bacterias se duplica cada 3 horas. Si inicialmente hay 500 bacterias, ¿cuántas habrá después de 12 horas?',
                            'Modelo: N(t) = N₀ · 2^(t/3). Para t=12: N(12) = 500 · 2^(12/3) = 500 · 2^4 = 500 · 16 = 8.000 bacterias.',
                        ),
                        h(2, 'Resumen'),
                        bullet([
                            'Exponencial: f(x) = a·b^x',
                            'Logaritmo: log_b(x) = y ↔ b^y = x',
                            'Propiedades: suma, resta, potencia',
                            'Cambio de base para calculadora',
                        ]),
                    ),
                },
                {
                    title: 'Funciones racionales y dominio',
                    type: 'TEXTO',
                    durationSec: 2100,
                    contentJson: doc(
                        h(1, 'Funciones racionales y dominio'),
                        pText(
                            'Una función racional es un cociente entre polinomios: f(x) = P(x) / Q(x), con Q(x) ≠ 0. Su dominio son todos los reales excepto las raíces de Q.',
                        ),
                        h(2, 'Asíntotas verticales'),
                        pText(
                            'Aparecen en los ceros del denominador que no son ceros del numerador. Indican los valores de x hacia los que la función crece sin límite (positiva o negativamente).',
                        ),
                        h(2, 'Asíntotas horizontales y oblicuas'),
                        pText(
                            'Si el grado del numerador es menor que el del denominador, hay asíntota horizontal y = 0. Si es igual, y = cociente de los coeficientes principales. Si es mayor en uno, hay asíntota oblicua.',
                        ),
                        h(2, 'Operaciones y composición'),
                        bullet([
                            'Suma/resta: común denominador',
                            'Producto: numerador por numerador y denominador por denominador',
                            'Composición f(g(x)): sustituir x en f por g(x)',
                            'Inversa: despejar x en función de y',
                        ]),
                        callout(
                            'La PAES pide a menudo determinar el dominio de una función racional o el signo de f(x) en intervalos, usando tabla de signos con los ceros de P y Q.',
                        ),
                        ...paesExample(
                            'Determina el dominio y la asíntota vertical de f(x) = (x² - 1) / (x - 2).',
                            'Dominio: ℝ - {2} (porque x = 2 anula el denominador). Asíntota vertical: x = 2. Asíntota oblicua: se divide x² - 1 entre x - 2: x + 2 + 3/(x-2). La asíntota es y = x + 2.',
                        ),
                        h(2, 'Resumen'),
                        bullet([
                            'Racional: P(x)/Q(x) con Q ≠ 0',
                            'Dominio: ℝ - {raíces de Q}',
                            'Asíntota vertical en ceros de Q no cancelados',
                            'Horizontal u oblicua según grados',
                        ]),
                    ),
                },
                {
                    title: 'Inecuaciones lineales y cuadráticas',
                    type: 'TEXTO',
                    durationSec: 1800,
                    contentJson: doc(
                        h(1, 'Inecuaciones lineales y cuadráticas'),
                        pText(
                            'Una inecuación es una desigualdad entre expresiones algebraicas. La solución es un conjunto de valores de la variable (intervalo o unión de intervalos).',
                        ),
                        h(2, 'Inecuaciones lineales'),
                        pText(
                            'Se despeja como una ecuación, pero al multiplicar o dividir por un número negativo, el sentido de la desigualdad se invierte.',
                        ),
                        codeBlock('2x - 5 > 3x + 1 → -x > 6 → x < -6'),
                        h(2, 'Inecuaciones cuadráticas'),
                        pText(
                            'Se llevan a un lado y se factoriza o se aplica la fórmula general. Luego se estudia el signo del producto usando una tabla con las raíces.',
                        ),
                        bullet([
                            'Si Δ < 0: la parábola no toca el eje X; el signo depende de a',
                            'Si Δ = 0: toca en un punto; la solución es ese punto (con ≥ o ≤)',
                            'Si Δ > 0: se alternan los signos entre las raíces',
                        ]),
                        h(2, 'Inecuaciones racionales'),
                        callout(
                            'Para P(x)/Q(x) > 0, se construye una tabla con los ceros de P y Q. La fracción es positiva donde P y Q tienen el mismo signo. Cuidado con los puntos donde Q = 0: se excluyen del dominio.',
                        ),
                        ...paesExample(
                            'Resuelve x² - 5x + 6 < 0.',
                            'Factorizamos: (x - 2)(x - 3) < 0. La parábola abre hacia arriba y sus raíces son 2 y 3. Es negativa entre las raíces: 2 < x < 3.',
                        ),
                        h(2, 'Resumen'),
                        bullet([
                            'Multiplicar por negativo invierte el signo',
                            'Cuadrática: factorizar y estudiar signo',
                            'Racional: tabla con ceros de P y Q',
                            'Puntos donde Q = 0 se excluyen',
                        ]),
                    ),
                },
            ],
        },
        {
            title: 'Geometría analítica y vectores',
            description:
                'Plano cartesiano, distancia, vectores, transformaciones isométricas.',
            lessons: [
                {
                    title: 'Plano cartesiano, distancia y pendiente',
                    type: 'TEXTO',
                    durationSec: 2100,
                    contentJson: doc(
                        h(1, 'Plano cartesiano, distancia y pendiente'),
                        pText(
                            'El plano cartesiano se forma con dos ejes perpendiculares: el eje X (horizontal) y el eje Y (vertical). Cada punto se representa por un par ordenado (x, y).',
                        ),
                        h(2, 'Distancia entre dos puntos'),
                        pText(
                            'Dados P(x₁, y₁) y Q(x₂, y₂), la distancia es d = √((x₂ - x₁)² + (y₂ - y₁)²). Esto es la generalización del teorema de Pitágoras.',
                        ),
                        h(2, 'Punto medio'),
                        pText(
                            'El punto medio entre P y Q es M = ((x₁ + x₂)/2, (y₁ + y₂)/2). La sección en razón r:s (r desde P) tiene coordenadas ((sx₁ + rx₂)/(r+s), (sy₁ + ry₂)/(r+s)).',
                        ),
                        h(2, 'Ecuación de la recta'),
                        bullet([
                            'Forma general: ax + by + c = 0',
                            'Forma principal: y = mx + n (m es pendiente, n es intercepto)',
                            'Dos puntos: m = (y₂ - y₁)/(x₂ - x₁)',
                            'Recta paralela: misma pendiente',
                            'Recta perpendicular: pendientes cumplen m₁·m₂ = -1',
                        ]),
                        h(2, 'Pendiente como razón de cambio'),
                        callout(
                            'La pendiente m representa el cambio de y por unidad de x. En contextos como velocidad, costo marginal o depreciación, m es la razón de cambio constante.',
                        ),
                        ...paesExample(
                            'Calcula la distancia entre A(1, 3) y B(7, 11) y la pendiente de la recta AB.',
                            'Distancia: √((7-1)² + (11-3)²) = √(36 + 64) = √100 = 10. Pendiente: m = (11-3)/(7-1) = 8/6 = 4/3.',
                        ),
                        h(2, 'Resumen'),
                        bullet([
                            'Distancia: √((Δx)² + (Δy)²)',
                            'Punto medio: promedio de coordenadas',
                            'Pendiente: Δy/Δx',
                            'Perpendiculares: m₁·m₂ = -1',
                        ]),
                    ),
                },
                {
                    title: 'Vectores en el plano y operaciones',
                    type: 'TEXTO',
                    durationSec: 2400,
                    contentJson: doc(
                        h(1, 'Vectores en el plano y operaciones'),
                        pText(
                            'Un vector en el plano es un par ordenado (a, b) que representa un desplazamiento. Geométricamente, se dibuja como una flecha desde el origen hasta el punto (a, b).',
                        ),
                        h(2, 'Operaciones'),
                        bullet([
                            'Suma: (a₁, b₁) + (a₂, b₂) = (a₁ + a₂, b₁ + b₂)',
                            'Resta: (a₁, b₁) - (a₂, b₂) = (a₁ - a₂, b₁ - b₂)',
                            'Escalar por vector: k·(a, b) = (k·a, k·b)',
                        ]),
                        h(2, 'Magnitud y dirección'),
                        pText(
                            'Magnitud (norma): |v| = √(a² + b²). Dirección: ángulo θ con el eje X tal que tan θ = b/a (considerando el cuadrante).',
                        ),
                        h(2, 'Producto punto (escalar)'),
                        callout(
                            'u · v = u₁v₁ + u₂v₂ = |u|·|v|·cos θ. Permite calcular ángulos entre vectores: cos θ = (u·v) / (|u|·|v|). Si u·v = 0, los vectores son perpendiculares.',
                        ),
                        h(2, 'Vectores en coordenadas'),
                        pText(
                            'Si A(x₁, y₁) y B(x₂, y₂), el vector AB = (x₂ - x₁, y₂ - y₁). Su magnitud es la distancia AB y su dirección es la de la recta AB.',
                        ),
                        h(2, 'Aplicaciones'),
                        bullet([
                            'Fuerzas yresultantes (suma de vectores)',
                            'Desplazamientos sucesivos',
                            'Velocidades (vector velocidad = dirección y rapidez)',
                        ]),
                        ...paesExample(
                            'Dados u = (3, 4) y v = (1, 2), calcula u + v, |u| y u·v.',
                            'u + v = (4, 6). |u| = √(9 + 16) = √25 = 5. u·v = 3·1 + 4·2 = 3 + 8 = 11.',
                        ),
                        h(2, 'Resumen'),
                        bullet([
                            'Vector: par ordenado (a, b)',
                            'Suma y resta componente a componente',
                            'Norma: √(a² + b²)',
                            'Producto punto: u·v = u₁v₁ + u₂v₂ = |u||v|cos θ',
                        ]),
                    ),
                },
                {
                    title: 'Transformaciones isométricas',
                    type: 'TEXTO',
                    durationSec: 2100,
                    contentJson: doc(
                        h(1, 'Transformaciones isométricas'),
                        pText(
                            'Una transformación isométrica es una operación que mueve una figura sin cambiar su forma ni su tamaño: traslaciones, rotaciones y reflexiones.',
                        ),
                        h(2, 'Traslación'),
                        pText(
                            'Mueve cada punto (x, y) a (x + a, y + b). El vector (a, b) es el vector de traslación. Las distancias y los ángulos se conservan.',
                        ),
                        h(2, 'Rotación'),
                        pText(
                            'Gira la figura un ángulo θ alrededor de un punto fijo (el centro de rotación). Para una rotación de 90° en torno al origen: (x, y) → (-y, x). Para 180°: (x, y) → (-x, -y). Para 270°: (x, y) → (y, -x).',
                        ),
                        h(2, 'Reflexión'),
                        bullet([
                            'Sobre el eje X: (x, y) → (x, -y)',
                            'Sobre el eje Y: (x, y) → (-x, y)',
                            'Sobre y = x: (x, y) → (y, x)',
                            'Sobre el origen: (x, y) → (-x, -y)',
                        ]),
                        h(2, 'Composición'),
                        callout(
                            'Una simetría central es la composición de una rotación de 180° con el origen como centro. Una traslación seguida de una rotación puede dar lugar a una rotación de otro centro.',
                        ),
                        ...paesExample(
                            'El triángulo con vértices A(1, 2), B(3, 4), C(5, 2) se traslada según el vector (2, -1). ¿Cuáles son los nuevos vértices?',
                            'A = (1+2, 2-1) = (3, 1). B = (3+2, 4-1) = (5, 3). C = (5+2, 2-1) = (7, 1). El triángulo conserva su forma y tamaño.',
                        ),
                        h(2, 'Resumen'),
                        bullet([
                            'Traslación: (x, y) → (x + a, y + b)',
                            'Rotación 90°: (x, y) → (-y, x)',
                            'Reflexión eje X: (x, y) → (x, -y)',
                            'Conservan forma y tamaño',
                        ]),
                    ),
                },
            ],
        },
        {
            title: 'Trigonometría',
            description:
                'Razones trigonométricas, identidades, ley de senos y cosenos.',
            lessons: [
                {
                    title: 'Razones trigonométricas en el círculo unitario',
                    type: 'TEXTO',
                    durationSec: 2700,
                    contentJson: doc(
                        h(1, 'Razones trigonométricas en el círculo unitario'),
                        pText(
                            'El círculo unitario es el círculo de radio 1 centrado en el origen. Para cualquier ángulo θ, el punto (cos θ, sen θ) está sobre la circunferencia.',
                        ),
                        h(2, 'Signos por cuadrante'),
                        bullet([
                            'Cuadrante I (0°–90°): sen +, cos +',
                            'Cuadrante II (90°–180°): sen +, cos -',
                            'Cuadrante III (180°–270°): sen -, cos -',
                            'Cuadrante IV (270°–360°): sen -, cos +',
                        ]),
                        h(2, 'Ángulos notables'),
                        bullet([
                            'sen 0° = 0, cos 0° = 1',
                            'sen 30° = 1/2, cos 30° = √3/2',
                            'sen 45° = √2/2, cos 45° = √2/2',
                            'sen 60° = √3/2, cos 60° = 1/2',
                            'sen 90° = 1, cos 90° = 0',
                        ]),
                        h(2, 'Periodicidad'),
                        callout(
                            'sen y cos tienen período 2π. sen(θ + 360°) = sen θ. cos(θ + 360°) = cos θ. La PAES usa esta propiedad para ángulos negativos o mayores a 360°.',
                        ),
                        h(2, 'Ángulos negativos'),
                        pText(
                            'sen(-θ) = -sen θ. cos(-θ) = cos θ. Esto significa que cos es par y sen es impar.',
                        ),
                        ...paesExample(
                            'Calcula el valor exacto de sen 150°.',
                            '150° está en el cuadrante II. El ángulo de referencia es 180° - 150° = 30°. sen 150° = sen 30° = 1/2.',
                        ),
                        h(2, 'Resumen'),
                        bullet([
                            'Círculo unitario: (cos θ, sen θ)',
                            'Signos según cuadrante',
                            'Período 360° para sen y cos',
                            'cos es par, sen es impar',
                        ]),
                    ),
                },
                {
                    title: 'Identidades trigonométricas fundamentales',
                    type: 'TEXTO',
                    durationSec: 2400,
                    contentJson: doc(
                        h(1, 'Identidades trigonométricas fundamentales'),
                        pText(
                            'Las identidades trigonométricas son ecuaciones verdaderas para todo valor admisible de la variable. Permiten simplificar expresiones y resolver ecuaciones.',
                        ),
                        h(2, 'Identidad pitagórica'),
                        pText(
                            'sen²θ + cos²θ = 1. De aquí se derivan: 1 + tan²θ = sec²θ y 1 + cot²θ = csc²θ.',
                        ),
                        h(2, 'Ángulo doble'),
                        bullet([
                            'sen 2θ = 2 sen θ cos θ',
                            'cos 2θ = cos²θ - sen²θ = 2 cos²θ - 1 = 1 - 2 sen²θ',
                            'tan 2θ = 2 tan θ / (1 - tan²θ)',
                        ]),
                        h(2, 'Ángulo suma y diferencia'),
                        bullet([
                            'sen(α + β) = sen α cos β + cos α sen β',
                            'cos(α + β) = cos α cos β - sen α sen β',
                            'sen(α - β) = sen α cos β - cos α sen β',
                            'cos(α - β) = cos α cos β + sen α sen β',
                        ]),
                        h(2, 'Factorización y reducción'),
                        callout(
                            'Truco PAES: una expresión como sen²θ - cos²θ es cos 2θ. Una expresión como 1 - cos 2θ es 2 sen²θ. Reconocer patrones acelera la simplificación.',
                        ),
                        ...paesExample(
                            'Simplifica (1 - cos 2θ) / sen 2θ.',
                            'Numerador: 1 - cos 2θ = 2 sen²θ. Denominador: sen 2θ = 2 sen θ cos θ. Cociente: (2 sen²θ) / (2 sen θ cos θ) = sen θ / cos θ = tan θ.',
                        ),
                        h(2, 'Resumen'),
                        bullet([
                            'Pitagórica: sen²θ + cos²θ = 1',
                            'Doble: sen 2θ = 2 sen θ cos θ',
                            'Suma: sen(α+β) = sen α cos β + cos α sen β',
                            'Simplificar siempre con identidad pitagórica',
                        ]),
                    ),
                },
                {
                    title: 'Ley de senos y ley de cosenos',
                    type: 'TEXTO',
                    durationSec: 2400,
                    contentJson: doc(
                        h(1, 'Ley de senos y ley de cosenos'),
                        pText(
                            'Estas dos leyes resuelven triángulos cualesquiera (no solo rectángulos) conocidos ciertos elementos.',
                        ),
                        h(2, 'Ley de senos'),
                        pText(
                            'En todo triángulo ABC con lados a (opuesto a A), b (opuesto a B), c (opuesto a C):',
                        ),
                        codeBlock('a / sen A = b / sen B = c / sen C = 2R'),
                        callout(
                            'Útil cuando se conoce un par ángulo-lado opuesto, o dos ángulos y un lado, o dos lados y un ángulo opuesto a uno de ellos (caso ambiguo).',
                        ),
                        h(2, 'Ley de cosenos'),
                        pText(
                            'Permite calcular un lado si se conocen los otros dos y el ángulo entre ellos, o un ángulo si se conocen los tres lados:',
                        ),
                        codeBlock('a² = b² + c² - 2bc·cos A\ncos A = (b² + c² - a²) / (2bc)'),
                        h(2, 'Cuándo usar cada una'),
                        bullet([
                            'Ley de senos: tengo un ángulo y un lado, o dos ángulos',
                            'Ley de cosenos: tengo dos lados y el ángulo entre ellos (SAS), o tres lados (SSS)',
                            'Caso ambiguo: dos lados y un ángulo no incluido (SSA) puede tener 0, 1 o 2 soluciones',
                        ]),
                        ...paesExample(
                            'En un triángulo, a = 7, A = 60°, B = 50°. Calcula b.',
                            'Por ley de senos: b / sen 50° = 7 / sen 60°. Entonces b = 7 · sen 50° / sen 60° ≈ 7 · 0.766 / 0.866 ≈ 6.19.',
                        ),
                        h(2, 'Resumen'),
                        bullet([
                            'Ley de senos: a/sen A = b/sen B = c/sen C',
                            'Ley de cosenos: a² = b² + c² - 2bc cos A',
                            'Senos: AAS, ASA, SSA (con cuidado)',
                            'Cosenos: SAS, SSS',
                        ]),
                    ),
                },
            ],
        },
        {
            title: 'Probabilidad y estadística',
            description:
                'Probabilidad condicional, distribuciones, estadística inferencial.',
            lessons: [
                {
                    title: 'Probabilidad condicional y teorema de Bayes',
                    type: 'TEXTO',
                    durationSec: 2400,
                    contentJson: doc(
                        h(1, 'Probabilidad condicional y teorema de Bayes'),
                        pText(
                            'La probabilidad condicional P(A|B) es la probabilidad de que ocurra A dado que B ya ocurrió. Se define como P(A|B) = P(A ∩ B) / P(B), siempre que P(B) > 0.',
                        ),
                        h(2, 'Eventos independientes'),
                        pText(
                            'A y B son independientes si P(A ∩ B) = P(A)·P(B), lo que equivale a P(A|B) = P(A). Saber que B ocurrió no cambia la probabilidad de A.',
                        ),
                        h(2, 'Teorema de Bayes'),
                        callout(
                            'P(A|B) = P(B|A)·P(A) / P(B). Permite actualizar la probabilidad de una hipótesis a la luz de nueva evidencia. Es la base del razonamiento bayesiano.',
                        ),
                        h(2, 'Tabla de contingencia'),
                        pText(
                            'Útil cuando hay dos variables categóricas. Las celdas muestran frecuencias conjuntas y los marginales permiten calcular probabilidades condicionales por cociente.',
                        ),
                        h(2, 'Aplicaciones'),
                        bullet([
                            'Pruebas médicas (sensibilidad y especificidad)',
                            'Filtros de spam',
                            'Diagnóstico de fallos',
                            'Predicción meteorológica',
                        ]),
                        ...paesExample(
                            'Una prueba para una enfermedad tiene sensibilidad 99% (detecta al 99% de enfermos) y especificidad 95% (sana al 95% de sanos). Si la enfermedad afecta al 1% de la población, ¿cuál es la probabilidad de estar enfermo dado que la prueba fue positiva?',
                            'Por Bayes: P(E|+) = P(+|E)·P(E) / P(+). P(+) = P(+|E)·P(E) + P(+|¬E)·P(¬E) = 0.99·0.01 + 0.05·0.99 = 0.0099 + 0.0495 = 0.0594. Entonces P(E|+) = 0.0099 / 0.0594 ≈ 16.7%. Aunque la prueba es muy precisa, la baja prevalencia hace que un positivo tenga solo ~17% de probabilidad real.',
                        ),
                        h(2, 'Resumen'),
                        bullet([
                            'P(A|B) = P(A ∩ B) / P(B)',
                            'Independientes: P(A ∩ B) = P(A)·P(B)',
                            'Bayes: P(A|B) = P(B|A)·P(A) / P(B)',
                            'Sensibilidad/especificidad son condicionales',
                        ]),
                    ),
                },
                {
                    title: 'Distribuciones de probabilidad',
                    type: 'TEXTO',
                    durationSec: 2100,
                    contentJson: doc(
                        h(1, 'Distribuciones de probabilidad'),
                        pText(
                            'Una variable aleatoria asigna un número a cada resultado de un experimento. Su distribución indica qué valores toma y con qué probabilidad.',
                        ),
                        h(2, 'Variable aleatoria discreta'),
                        bullet([
                            'Toma valores en un conjunto finito o numerable',
                            'Distribución: lista de valores y sus probabilidades',
                            'Esperanza: E[X] = Σ xᵢ · P(xᵢ)',
                            'Varianza: Var(X) = Σ (xᵢ - E[X])² · P(xᵢ)',
                        ]),
                        h(2, 'Distribución binomial'),
                        pText(
                            'Modela el número de éxitos en n ensayos independientes con probabilidad p de éxito cada uno. Sus parámetros:',
                        ),
                        bullet([
                            'Esperanza: E[X] = n·p',
                            'Varianza: Var(X) = n·p·(1-p)',
                            'Probabilidad puntual: P(X = k) = C(n,k) · p^k · (1-p)^(n-k)',
                        ]),
                        callout(
                            'La PAES identifica el modelo binomial cuando hay "n intentos", "cada uno independiente" y "éxito/fracaso". Reconocer el patrón es la mitad del problema.',
                        ),
                        h(2, 'Variable aleatoria continua'),
                        pText(
                            'Se describe mediante una función de densidad f(x) con área total 1 bajo la curva. La distribución normal (campana de Gauss) es la más usada.',
                        ),
                        ...paesExample(
                            'Un examen tiene 5 preguntas de verdadero/falso. Si un estudiante responde al azar, ¿cuál es la probabilidad de acertar exactamente 3?',
                            'Modelo binomial con n=5, p=0.5, k=3. P(X=3) = C(5,3) · 0.5³ · 0.5² = 10 · 0.125 · 0.25 = 0.3125. Probabilidad ≈ 31.25%.',
                        ),
                        h(2, 'Resumen'),
                        bullet([
                            'Discreta: lista finita, esperanza = Σ xᵢ P(xᵢ)',
                            'Binomial: n intentos, p éxito, E = np, Var = np(1-p)',
                            'Continua: densidad f(x), área = 1',
                            'Normal: campana, parámetro μ (media) y σ (desviación)',
                        ]),
                    ),
                },
                {
                    title: 'Estadística inferencial: estimación y muestreo',
                    type: 'TEXTO',
                    durationSec: 1800,
                    contentJson: doc(
                        h(1, 'Estadística inferencial: estimación y muestreo'),
                        pText(
                            'La estadística inferencial extrae conclusiones sobre una población a partir de una muestra. La estimación de parámetros y las pruebas de hipótesis son sus dos grandes herramientas.',
                        ),
                        h(2, 'Muestreo'),
                        bullet([
                            'Aleatorio simple: cada elemento tiene la misma probabilidad de ser elegido',
                            'Estratificado: se divide en estratos y se muestrea cada uno',
                            'Sistemático: se elige uno cada k',
                            'Por conglomerados: se eligen grupos completos',
                        ]),
                        h(2, 'Estimación de la media'),
                        pText(
                            'Si x̄ es la media muestral, el intervalo de confianza para la media poblacional es x̄ ± z·σ/√n, donde z depende del nivel de confianza (1.96 para 95%).',
                        ),
                        h(2, 'Error estándar'),
                        callout(
                            'σ/√n mide la dispersión esperada de la media muestral. A mayor tamaño de muestra, menor error estándar. La raíz cuadrada es clave: cuadruplicar n reduce el error a la mitad.',
                        ),
                        h(2, 'Tipos de muestreo y sesgos'),
                        pText(
                            'Sesgo de selección: muestra no representativa. Sesgo de respuesta: participantes no responden con honestidad. La PAES pregunta cómo evitar sesgos en un diseño muestral.',
                        ),
                        ...paesExample(
                            'Una muestra de 100 personas tiene media de edad 35 años con desviación 10 años. ¿Cuál es el intervalo de confianza al 95% para la media poblacional?',
                            'x̄ ± 1.96·σ/√n = 35 ± 1.96·10/√100 = 35 ± 1.96. El intervalo es [33.04, 36.96]. Con 95% de confianza, la media real está entre 33 y 37 años.',
                        ),
                        h(2, 'Resumen'),
                        bullet([
                            'Muestreo aleatorio es la base',
                            'IC 95%: x̄ ± 1.96·σ/√n',
                            'Error estándar: σ/√n',
                            'Sesgo: muestra no representativa',
                        ]),
                    ),
                },
            ],
        },
    ],
};