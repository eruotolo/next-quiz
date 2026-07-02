/**
 * Curso: Competencia Matemática M1 (PAES Chile, Admisión 2027).
 * Temario oficial DEMRE/MINEDUC. La M1 evalúa habilidades matemáticas
 * transversales necesarias para todas las carreras universitarias.
 */
import { bullet, callout, codeBlock, doc, h, p, pBold, pText, paesExample, t } from './_tiptap';
import type { CourseSeed } from './_types';

export const m1: CourseSeed = {
    id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    title: 'Competencia Matemática M1',
    description:
        'Curso completo de Competencia Matemática M1 según temario DEMRE PAES Chile. Cubre números, álgebra, funciones, geometría, estadística y probabilidad con ejercitación tipo PAES.',
    modules: [
        {
            title: 'Números y proporcionalidad',
            description:
                'Operaciones con números reales, razones, proporciones, porcentajes y proporcionalidad directa e inversa.',
            lessons: [
                {
                    title: 'Operaciones con números enteros, racionales y reales',
                    type: 'TEXTO',
                    durationSec: 2400,
                    contentJson: doc(
                        h(1, 'Operaciones con números enteros, racionales y reales'),
                        p(
                            t('La PAES Competencia Matemática M1 parte del trabajo numérico como base para todo el temario. Los conjuntos numéricos se organizan así: los números naturales (ℕ) incluyen el 0 y sirven para contar; los enteros (ℤ) agregan los negativos; los racionales (ℚ) son todas las fracciones a/b con b ≠ 0; los reales (ℝ) incluyen además los irracionales como √2 o π.'),
                        ),
                        h(2, 'Jerarquía de operaciones'),
                        pText(
                            'Para evaluar una expresión numérica se respeta esta jerarquía: primero paréntesis y corchetes; luego potencias y raíces; después multiplicaciones y divisiones (de izquierda a derecha); finalmente sumas y restas.',
                        ),
                        codeBlock('2 + 3 · 4 = 2 + 12 = 14\n(2 + 3) · 4 = 5 · 4 = 20'),
                        h(2, 'Suma y resta de fracciones'),
                        pText(
                            'Para sumar o restar fracciones se requiere denominador común. El mínimo común múltiplo (mcm) entre los denominadores es la elección más eficiente.',
                        ),
                        callout(
                            'Ejemplo: 1/2 + 3/4. El mcm(2,4)=4, entonces 1/2 = 2/4. La suma es 2/4 + 3/4 = 5/4.',
                        ),
                        h(2, 'Notación científica'),
                        pText(
                            'La PAES suele incluir preguntas con números muy grandes o muy pequeños. La notación científica los expresa como a × 10ⁿ con 1 ≤ |a| < 10. Por ejemplo, 0.0000042 = 4.2 × 10⁻⁶.',
                        ),
                        h(2, 'Aproximación y redondeo'),
                        pText(
                            'Redondear a n cifras significativas consiste en conservar las primeras n cifras del número y ajustar la última según la cifra siguiente (≥5 sube, <5 baja). Esta técnica es clave al comparar resultados en ejercicios de opciones.',
                        ),
                        ...paesExample(
                            'Si la población de Chile es aproximadamente 1.95 × 10⁷ habitantes y la de Uruguay es 3.4 × 10⁶, ¿cuántas veces más habitantes tiene Chile que Uruguay?',
                            'Dividimos: (1.95 × 10⁷) / (3.4 × 10⁶) = (1.95/3.4) × 10¹ = 0.5735 × 10 = 5.735 ≈ 5.7 veces. La alternativa correcta suele ser 5.7.',
                        ),
                        h(2, 'Resumen'),
                        bullet([
                            'Jerarquía: paréntesis → potencias → ×÷ → +−',
                            'Fracciones: buscar denominador común (mcm)',
                            'Notación científica: a × 10ⁿ con 1 ≤ |a| < 10',
                            'Redondeo: 5 o más sube la última cifra conservada',
                        ]),
                    ),
                },
                {
                    title: 'Razones, proporciones y porcentajes',
                    type: 'TEXTO',
                    durationSec: 2100,
                    contentJson: doc(
                        h(1, 'Razones, proporciones y porcentajes'),
                        pText(
                            'Una razón es la comparación por cociente entre dos cantidades. Si a y b son números, la razón a:b equivale a la fracción a/b. Cuando dos razones son iguales forman una proporción: a/b = c/d.',
                        ),
                        h(2, 'Propiedad fundamental de las proporciones'),
                        pText(
                            'En toda proporción a/b = c/d se cumple a · d = b · c (producto cruzado). Esto permite encontrar el término desconocido.',
                        ),
                        codeBlock('Si 3/x = 6/10, entonces 3·10 = 6·x → x = 30/6 = 5'),
                        h(2, 'Porcentajes'),
                        pText(
                            'El porcentaje es una razón con denominador 100. Calcular el n% de una cantidad equivale a multiplicar por n/100. Tres problemas típicos aparecen en la PAES:',
                        ),
                        bullet([
                            'Hallar el porcentaje de una cantidad (cuánto es el 20% de 450)',
                            'Expresar una cantidad como porcentaje (qué % es 36 de 150)',
                            'Aumento o descuento porcentual (precio original $50.000 con 12% de descuento)',
                        ]),
                        h(2, 'Aumentos y descuentos sucesivos'),
                        callout(
                            'Un aumento del 20% seguido de uno del 10% NO equivale a un aumento del 30%. El factor acumulado es 1.20 · 1.10 = 1.32, es decir, un 32% neto. La PAES suele poner distractores con esta confusión.',
                        ),
                        h(2, 'Tasa de interés simple'),
                        pText(
                            'En interés simple, el capital C genera un interés I = C · r · t, donde r es la tasa (decimal) y t el tiempo en el periodo correspondiente. Por ejemplo, $100.000 al 2% mensual durante 3 meses generan $100.000 · 0.02 · 3 = $6.000.',
                        ),
                        ...paesExample(
                            'Un artículo cuesta $24.000 y se le aplica un descuento del 15% y luego un recargo del 10% por envío. ¿Cuál es el precio final?',
                            'Tras el descuento: $24.000 · 0.85 = $20.400. Tras el recargo: $20.400 · 1.10 = $22.440. El precio final es $22.440.',
                        ),
                        h(2, 'Resumen'),
                        bullet([
                            'Proporción a/b = c/d → a·d = b·c',
                            'n% de x = x · n/100',
                            'Descuentos sucesivos se multiplican, no se suman',
                            'Interés simple: I = C · r · t',
                        ]),
                    ),
                },
                {
                    title: 'Proporcionalidad directa e inversa',
                    type: 'TEXTO',
                    durationSec: 1800,
                    contentJson: doc(
                        h(1, 'Proporcionalidad directa e inversa'),
                        pText(
                            'Dos variables x e y son directamente proporcionales si su cociente es constante: y = k · x, donde k es la constante de proporcionalidad. Esto significa que si x se duplica, y también se duplica; si x se reduce a la mitad, y se reduce a la mitad.',
                        ),
                        h(2, 'Tabla de proporcionalidad directa'),
                        pText(
                            'En una tabla, las filas mantienen igual razón: si x₁/y₁ = x₂/y₂ = k, las magnitudes son directamente proporcionales. La regla de tres simple directa usa esta propiedad.',
                        ),
                        codeBlock(
                            'Si 3 operarios pintan 12 m² en 1 día, ¿cuántos m² pintan 5 operarios en el mismo tiempo?\n\n12/3 = 4 m² por operario → 5 · 4 = 20 m²',
                        ),
                        h(2, 'Proporcionalidad inversa'),
                        pText(
                            'Dos variables son inversamente proporcionales si su producto es constante: x · y = k. Aquí, si x se duplica, y se reduce a la mitad. Un caso típico: más operarios tardan menos tiempo en la misma faena.',
                        ),
                        codeBlock(
                            'Si 4 pintores terminan un mural en 9 horas, ¿cuánto tardan 6 pintores?\n\nk = 4 · 9 = 36 → t = 36/6 = 6 horas',
                        ),
                        h(2, 'Proporcionalidad compuesta'),
                        callout(
                            'Si tres magnitudes A, B y C se relacionan, se separan en razones directas e inversas con la incógnita. La PAES exige identificar correctamente qué factor es directo y cuál inverso.',
                        ),
                        h(2, 'Gráficos'),
                        pText(
                            'La proporcionalidad directa se representa con una recta que pasa por el origen (en coordenadas cartesianas). La proporcionalidad inversa se representa con una hipérbola. La PAES pide a menudo interpretar la pendiente k.',
                        ),
                        ...paesExample(
                            'En una fábrica, 6 máquinas idénticas embotellan 900 litros en 5 horas. Si se incorporan 4 máquinas más, ¿cuántas horas tardarán en embotellar la misma cantidad?',
                            'Primero relación inversa entre máquinas y tiempo: 6 máquinas tardan 5 h. Con 10 máquinas: t = (6 · 5) / 10 = 30/10 = 3 horas.',
                        ),
                        h(2, 'Resumen'),
                        bullet([
                            'Directa: y = k·x (cociente constante)',
                            'Inversa: x·y = k (producto constante)',
                            'Más máquinas → menos tiempo (inversa)',
                            'Recta por el origen ↔ directa; hipérbola ↔ inversa',
                        ]),
                    ),
                },
            ],
        },
        {
            title: 'Álgebra y funciones',
            description:
                'Ecuaciones lineales, sistemas de ecuaciones, funciones afín/lineal/cuadrática y expresiones algebraicas.',
            lessons: [
                {
                    title: 'Ecuaciones lineales y sistemas de ecuaciones',
                    type: 'TEXTO',
                    durationSec: 2400,
                    contentJson: doc(
                        h(1, 'Ecuaciones lineales y sistemas de ecuaciones'),
                        pText(
                            'Una ecuación lineal en una variable tiene la forma ax + b = 0, con a ≠ 0. Su solución se despeja: x = -b/a. Geométricamente, es el punto donde la recta y = -ax - b cruza el eje X.',
                        ),
                        h(2, 'Resolución paso a paso'),
                        bullet([
                            'Agrupar términos con x a un lado y constantes al otro',
                            'Sumar o restar para cancelar',
                            'Dividir por el coeficiente de x',
                        ]),
                        codeBlock('3x + 5 = 2x + 11 → 3x - 2x = 11 - 5 → x = 6'),
                        h(2, 'Sistemas de ecuaciones lineales 2×2'),
                        pText(
                            'Dos ecuaciones con dos incógnitas tienen solución única cuando las rectas se cruzan. Tres métodos usuales:',
                        ),
                        bullet([
                            'Sustitución: despejar una variable y reemplazar',
                            'Igualación: despejar la misma variable en ambas ecuaciones',
                            'Reducción: sumar/restar ecuaciones para eliminar una incógnita',
                        ]),
                        codeBlock(
                            'x + y = 7\n2x - y = 5\n—Suma: 3x = 12 → x = 4 → y = 3',
                        ),
                        h(2, 'Sistemas con infinitas o ninguna solución'),
                        callout(
                            'Si las rectas son paralelas distintas, el sistema no tiene solución (incompatible). Si coinciden, tiene infinitas soluciones (indeterminado). La PAES pregunta esto interpretando el discriminante.',
                        ),
                        h(2, 'Aplicaciones'),
                        pText(
                            'Sistemas 2×2 modelan problemas clásicos: mezclas, edades, precios con descuentos, trayectorias con velocidades distintas. Se recomienda siempre traducir el enunciado a una tabla con dos columnas.',
                        ),
                        ...paesExample(
                            'En una librería, 3 cuadernos y 2 lápices cuestan $5.900. Un cuaderno y 4 lápices cuestan $3.700. ¿Cuánto cuesta cada artículo?',
                            'Sean c el precio del cuaderno y l el del lápiz. 3c + 2l = 5.900 y c + 4l = 3.700. Multiplicando la segunda por 3: 3c + 12l = 11.100. Restando: 10l = 5.200 → l = $520. Entonces c = 3.700 - 4·520 = 3.700 - 2.080 = $1.620.',
                        ),
                        h(2, 'Resumen'),
                        bullet([
                            'Ecuación lineal: ax + b = 0 → x = -b/a',
                            'Sistemas 2×2: sustitución, igualación o reducción',
                            'Sin solución ↔ rectas paralelas',
                            'Infinitas soluciones ↔ misma recta',
                        ]),
                    ),
                },
                {
                    title: 'Función afín, lineal y cuadrática',
                    type: 'TEXTO',
                    durationSec: 2700,
                    contentJson: doc(
                        h(1, 'Función afín, lineal y cuadrática'),
                        pText(
                            'Una función f: ℝ → ℝ asigna a cada x un único f(x). En el eje cartesiano, el gráfico muestra el comportamiento global.',
                        ),
                        h(2, 'Función lineal y afín'),
                        pText(
                            'Función afín: f(x) = mx + n. Si n = 0, es lineal pura f(x) = mx y pasa por el origen. La pendiente m representa el cambio de y por cada unidad de x.',
                        ),
                        bullet([
                            'm > 0: función creciente',
                            'm < 0: función decreciente',
                            'm = 0: función constante',
                        ]),
                        codeBlock('f(x) = 2x - 3 → pasa por (0, -3) y crece 2 unidades en y por cada 1 en x'),
                        h(2, 'Función cuadrática'),
                        pText(
                            'f(x) = ax² + bx + c, con a ≠ 0. Su gráfico es una parábola. Si a > 0 abre hacia arriba (tiene mínimo); si a < 0 abre hacia abajo (tiene máximo).',
                        ),
                        h(2, 'Vértice y discriminante'),
                        pText(
                            'El vértice está en x_v = -b/(2a), y su ordenada es y_v = f(x_v). El discriminante Δ = b² - 4ac indica las intersecciones con el eje X:',
                        ),
                        bullet([
                            'Δ > 0: dos raíces reales distintas (la parábola cruza el eje X dos veces)',
                            'Δ = 0: una raíz real doble (es tangente al eje X)',
                            'Δ < 0: ninguna raíz real (no cruza el eje X)',
                        ]),
                        h(2, 'Forma factorizada y canónica'),
                        callout(
                            'Forma factorizada: f(x) = a(x - x₁)(x - x₂). Permite leer las raíces de inmediato. Forma canónica: f(x) = a(x - x_v)² + y_v. Permite leer el vértice directamente.',
                        ),
                        ...paesExample(
                            'Una pelota se lanza hacia arriba. Su altura en metros está dada por h(t) = -5t² + 20t + 1. ¿En qué instante alcanza la altura máxima y cuál es?',
                            'Coeficientes: a = -5, b = 20, c = 1. Vértice en t_v = -20/(2·-5) = 20/10 = 2 segundos. h(2) = -5·4 + 20·2 + 1 = -20 + 40 + 1 = 21 metros.',
                        ),
                        h(2, 'Resumen'),
                        bullet([
                            'Afín: f(x) = mx + n',
                            'Cuadrática: parábola con vértice en -b/(2a)',
                            'Δ = b² - 4ac: signo determina raíces',
                            'Forma factorizada ↔ raíces; canónica ↔ vértice',
                        ]),
                    ),
                },
                {
                    title: 'Expresiones algebraicas y factorización',
                    type: 'TEXTO',
                    durationSec: 2100,
                    contentJson: doc(
                        h(1, 'Expresiones algebraicas y factorización'),
                        pText(
                            'Una expresión algebraica combina números, variables y operaciones. Simplificar y factorizar son operaciones inversas: simplificar agrupa términos; factorizar descompone un producto en sus factores.',
                        ),
                        h(2, 'Productos notables'),
                        bullet([
                            '(a + b)² = a² + 2ab + b²',
                            '(a - b)² = a² - 2ab + b²',
                            '(a + b)(a - b) = a² - b²',
                            '(x + a)(x + b) = x² + (a+b)x + ab',
                        ]),
                        callout(
                            'La PAES usa productos notables para factorizar rápido. Por ejemplo, x² - 9 = (x - 3)(x + 3).',
                        ),
                        h(2, 'Factor común'),
                        pText(
                            'Si todos los términos comparten un factor, se extrae: 2x² + 4x = 2x(x + 2).',
                        ),
                        h(2, 'Factorización de trinomios'),
                        pText(
                            'Para ax² + bx + c, se buscan dos números que sumen b y multipliquen a·c (cuando a = 1, basta con que sumen b y multipliquen c).',
                        ),
                        codeBlock(
                            'x² + 5x + 6 = (x + 2)(x + 3)\n2x² - 7x - 15 = (2x + 3)(x - 5)',
                        ),
                        h(2, 'Simplificación de fracciones algebraicas'),
                        pText(
                            'Se factoriza numerador y denominador y se cancelan factores comunes. La condición de existencia exige que el denominador no se anule.',
                        ),
                        ...paesExample(
                            'Simplifica (x² - 4) / (x² - 4x + 4).',
                            'Numerador: x² - 4 = (x - 2)(x + 2). Denominador: x² - 4x + 4 = (x - 2)². Cancelamos (x - 2): resultado (x + 2)/(x - 2), con x ≠ 2.',
                        ),
                        h(2, 'Resumen'),
                        bullet([
                            'Productos notables: (a±b)², (a+b)(a-b), (x+a)(x+b)',
                            'Factor común: extraer factor que se repite',
                            'Trinomio ax² + bx + c: buscar dos números con suma b y producto a·c',
                            'Simplificar: factorizar antes de cancelar',
                        ]),
                    ),
                },
            ],
        },
        {
            title: 'Geometría',
            description:
                'Áreas, perímetros, geometría tridimensional, teorema de Pitágoras y trigonometría básica.',
            lessons: [
                {
                    title: 'Áreas y perímetros de figuras planas',
                    type: 'TEXTO',
                    durationSec: 2100,
                    contentJson: doc(
                        h(1, 'Áreas y perímetros de figuras planas'),
                        pText(
                            'El perímetro es la suma de los lados de una figura; el área es la medida de la superficie interior. Ambas magnitudes se expresan en unidades lineales (m, cm) y cuadradas (m², cm²) respectivamente.',
                        ),
                        h(2, 'Fórmulas esenciales'),
                        bullet([
                            'Cuadrado de lado a: perímetro 4a, área a²',
                            'Rectángulo de lados a y b: perímetro 2(a+b), área a·b',
                            'Triángulo de base b y altura h: perímetro suma de lados, área b·h/2',
                            'Círculo de radio r: circunferencia 2πr, área πr²',
                            'Trapecio de bases B y b y altura h: área (B+b)·h/2',
                        ]),
                        h(2, 'Suma y diferencia de áreas'),
                        callout(
                            'Problemas PAES típicos: figuras compuestas. Se calcula el área total sumando y restando piezas. Un rectángulo con un semicírculo restado, etc.',
                        ),
                        h(2, 'Área del triángulo: tres casos'),
                        pText(
                            'Además de base × altura / 2, hay dos fórmulas útiles: la de Herón (en función de los tres lados, con s = (a+b+c)/2 y área = √(s(s-a)(s-b)(s-c))) y la trigonométrica con dos lados y el ángulo entre ellos (área = (1/2)·a·b·sen(C)).',
                        ),
                        ...paesExample(
                            'Una plaza rectangular de 80 m por 60 m tiene en su centro una fuente circular de 14 m de diámetro. ¿Cuál es el área disponible para caminar?',
                            'Área rectángulo: 80 · 60 = 4.800 m². Área fuente: π · 7² = 49π ≈ 153.94 m². Área disponible: 4.800 - 49π ≈ 4.646 m².',
                        ),
                        h(2, 'Resumen'),
                        bullet([
                            'Perímetro: suma de lados',
                            'Área: medida de superficie (m²)',
                            'Figuras compuestas: sumar y restar áreas simples',
                            'Fórmula de Herón o trigonométrica para triángulos arbitrarios',
                        ]),
                    ),
                },
                {
                    title: 'Geometría 3D: volúmenes y áreas superficiales',
                    type: 'TEXTO',
                    durationSec: 2400,
                    contentJson: doc(
                        h(1, 'Geometría 3D: volúmenes y áreas superficiales'),
                        pText(
                            'El volumen mide el espacio que ocupa un cuerpo y se expresa en unidades cúbicas (m³, cm³). El área superficial es la suma de las áreas de todas las caras.',
                        ),
                        h(2, 'Prisma y cilindro'),
                        bullet([
                            'Prisma de área basal A y altura h: volumen A·h',
                            'Cilindro de radio r y altura h: área basal πr², volumen πr²·h',
                            'Área superficial cilindro: 2πr² + 2πrh',
                        ]),
                        h(2, 'Pirámide y cono'),
                        pText(
                            'Una pirámide con área basal A y altura h tiene volumen A·h/3. Un cono de radio r y altura h tiene volumen πr²h/3.',
                        ),
                        callout(
                            'La regla del tercio es uno de los patrones más frecuentes en la PAES: cono y pirámide ocupan exactamente un tercio del prisma o cilindro de igual base y altura.',
                        ),
                        h(2, 'Esfera'),
                        bullet([
                            'Volumen: (4/3)πr³',
                            'Área superficial: 4πr²',
                        ]),
                        h(2, 'Cuerpos compuestos'),
                        pText(
                            'Se descomponen en figuras conocidas. Por ejemplo, un tanque cilíndrico con tapa cónica se calcula como cilindro + cono. La PAES pide volumen, capacidad (en litros) o material necesario (área superficial).',
                        ),
                        ...paesExample(
                            'Un balde tiene forma de tronco cónico: radio superior 18 cm, radio inferior 12 cm, altura 24 cm. ¿Cuánta agua cabe en litros?',
                            'Volumen del tronco: V = (π·h/3)(R² + Rr + r²) = (π·24/3)(18² + 18·12 + 12²) = 8π·(324 + 216 + 144) = 8π·684 = 5.472π ≈ 17.190 cm³ ≈ 17.19 litros.',
                        ),
                        h(2, 'Resumen'),
                        bullet([
                            'Prisma/cilindro: V = A·h',
                            'Pirámide/cono: V = A·h/3',
                            'Esfera: V = (4/3)πr³',
                            'Cuerpos compuestos: descomponer y combinar',
                        ]),
                    ),
                },
                {
                    title: 'Teorema de Pitágoras y trigonometría básica',
                    type: 'TEXTO',
                    durationSec: 2400,
                    contentJson: doc(
                        h(1, 'Teorema de Pitágoras y trigonometría básica'),
                        pText(
                            'En todo triángulo rectángulo, el cuadrado de la hipotenusa es igual a la suma de los cuadrados de los catetos: a² + b² = c². Esta identidad es la base de la trigonometría.',
                        ),
                        h(2, 'Aplicaciones del teorema de Pitágoras'),
                        bullet([
                            'Hallar un lado desconocido del triángulo rectángulo',
                            'Calcular la diagonal de un rectángulo o de una caja',
                            'Determinar distancias en el plano entre dos puntos (x₁,y₁) y (x₂,y₂): d = √((x₂-x₁)² + (y₂-y₁)²)',
                        ]),
                        h(2, 'Razones trigonométricas en el triángulo rectángulo'),
                        pText(
                            'Para un ángulo agudo α en un triángulo rectángulo, se definen:',
                        ),
                        bullet([
                            'sen α = cateto opuesto / hipotenusa',
                            'cos α = cateto adyacente / hipotenusa',
                            'tan α = cateto opuesto / cateto adyacente = sen α / cos α',
                        ]),
                        callout(
                            'En PAES es útil recordar los valores exactos para 30°, 45° y 60°: sen 30° = 1/2, sen 45° = √2/2, sen 60° = √3/2. Lo mismo para cos y tan.',
                        ),
                        h(2, 'Ángulos notables en triángulos notables'),
                        bullet([
                            '30°-60°-90°: lados en proporción 1 : √3 : 2',
                            '45°-45°-90°: lados en proporción 1 : 1 : √2',
                        ]),
                        h(2, 'Aplicaciones'),
                        pText(
                            'Calcular alturas inaccesibles, distancias entre puntos, ángulos de inclinación. La PAES combina Pitágoras con razones trigonométricas en problemas contextualizados.',
                        ),
                        ...paesExample(
                            'Una escalera de 5 m está apoyada contra una pared. La base está a 3 m del muro. ¿A qué altura del suelo toca la pared?',
                            'Aplicamos Pitágoras: h² + 3² = 5² → h² = 25 - 9 = 16 → h = 4 m. La escalera toca la pared a 4 m de altura.',
                        ),
                        h(2, 'Resumen'),
                        bullet([
                            'Pitágoras: a² + b² = c²',
                            'Distancia entre puntos: √((Δx)² + (Δy)²)',
                            'sen, cos, tan: opuesto, adyacente, hipotenusa',
                            'Triángulos notables: 30-60-90 y 45-45-90',
                        ]),
                    ),
                },
            ],
        },
        {
            title: 'Estadística y probabilidad',
            description:
                'Medidas de tendencia central y dispersión, probabilidad básica, reglas de conteo, lectura de gráficos.',
            lessons: [
                {
                    title: 'Medidas de tendencia central y dispersión',
                    type: 'TEXTO',
                    durationSec: 2100,
                    contentJson: doc(
                        h(1, 'Medidas de tendencia central y dispersión'),
                        pText(
                            'Las medidas de tendencia central resumen un conjunto de datos en un valor representativo. Las tres principales son la media aritmética, la mediana y la moda.',
                        ),
                        h(2, 'Media aritmética'),
                        pText(
                            'Es la suma de todos los valores dividida por el número de datos: x̄ = (Σxᵢ) / n. Si los datos están agrupados en una tabla con frecuencias fᵢ, la media ponderada es x̄ = (Σxᵢfᵢ) / (Σfᵢ).',
                        ),
                        h(2, 'Mediana'),
                        pText(
                            'Es el valor central cuando los datos están ordenados. Si hay n par, es el promedio de los dos centrales. La mediana es robusta frente a valores extremos.',
                        ),
                        h(2, 'Moda'),
                        pText(
                            'Es el valor que más se repite. Puede no haber moda, haber una sola, o haber más de una (multimodal).',
                        ),
                        h(2, 'Medidas de dispersión'),
                        bullet([
                            'Rango: máximo - mínimo',
                            'Varianza: σ² = (Σ(xᵢ - x̄)²) / n',
                            'Desviación estándar: σ = √σ²',
                            'Rango intercuartil: Q3 - Q1 (50% central de los datos)',
                        ]),
                        callout(
                            'La PAES suele incluir interpretación: si la desviación estándar es alta, los datos están más dispersos y la media es menos representativa. La mediana suele ser más estable.',
                        ),
                        ...paesExample(
                            'Las notas de un alumno son 4.5, 5.8, 6.2, 3.9 y 6.8. Calcula media, mediana y rango.',
                            'Media = (4.5 + 5.8 + 6.2 + 3.9 + 6.8) / 5 = 27.2 / 5 = 5.44. Ordenados: 3.9, 4.5, 5.8, 6.2, 6.8 → mediana = 5.8. Rango = 6.8 - 3.9 = 2.9.',
                        ),
                        h(2, 'Resumen'),
                        bullet([
                            'Media: promedio aritmético',
                            'Mediana: valor central ordenado',
                            'Moda: valor más frecuente',
                            'Varianza y desviación: miden dispersión',
                        ]),
                    ),
                },
                {
                    title: 'Probabilidad básica y reglas de conteo',
                    type: 'TEXTO',
                    durationSec: 1800,
                    contentJson: doc(
                        h(1, 'Probabilidad básica y reglas de conteo'),
                        pText(
                            'La probabilidad de un evento A es un número entre 0 y 1 que mide qué tan posible es que ocurra. Si todos los resultados del espacio muestral son igualmente probables, P(A) = casos favorables / casos totales.',
                        ),
                        h(2, 'Espacio muestral y eventos'),
                        bullet([
                            'Espacio muestral Ω: conjunto de todos los resultados posibles',
                            'Evento: cualquier subconjunto de Ω',
                            'Evento seguro: Ω (probabilidad 1)',
                            'Evento imposible: ∅ (probabilidad 0)',
                        ]),
                        h(2, 'Reglas de conteo'),
                        bullet([
                            'Principio multiplicativo: si un evento tiene m opciones y otro n, hay m·n combinaciones',
                            'Permutaciones: orden importa, P(n,k) = n!/(n-k)!',
                            'Combinaciones: orden no importa, C(n,k) = n!/(k!(n-k)!)',
                        ]),
                        h(2, 'Eventos complementarios'),
                        callout(
                            'P(no A) = 1 - P(A). Útil cuando calcular el complemento es más fácil que calcular el evento directo.',
                        ),
                        h(2, 'Probabilidad condicional e independencia'),
                        pText(
                            'P(A|B) = P(A ∩ B) / P(B), si P(B) > 0. A y B son independientes si P(A ∩ B) = P(A) · P(B).',
                        ),
                        ...paesExample(
                            'Una bolsa tiene 3 bolas rojas y 2 azules. Se extraen 2 bolas sin reposición. ¿Cuál es la probabilidad de que ambas sean rojas?',
                            'P(R₁) = 3/5. P(R₂|R₁) = 2/4 = 1/2. P(ambas rojas) = (3/5) · (1/2) = 3/10 = 0.3.',
                        ),
                        h(2, 'Resumen'),
                        bullet([
                            'P(A) = casos favorables / casos totales (si equiprobable)',
                            'Multiplicación: m·n para opciones combinadas',
                            'Combinaciones vs permutaciones: ¿importa el orden?',
                            'Complemento: P(no A) = 1 - P(A)',
                        ]),
                    ),
                },
                {
                    title: 'Lectura e interpretación de gráficos y tablas',
                    type: 'TEXTO',
                    durationSec: 1800,
                    contentJson: doc(
                        h(1, 'Lectura e interpretación de gráficos y tablas'),
                        pText(
                            'La Competencia Lectora Matemática de la PAES incluye preguntas centradas en interpretar información presentada en gráficos de barras, líneas, circulares, histogramas y tablas de frecuencia.',
                        ),
                        h(2, 'Tipos de gráficos'),
                        bullet([
                            'Barras: comparar categorías discretas',
                            'Circular (pie): proporciones de un total',
                            'Líneas: evolución temporal',
                            'Histograma: distribución de variable continua',
                            'Dispersión (XY): relación entre dos variables',
                        ]),
                        h(2, 'Errores frecuentes'),
                        callout(
                            'Escala engañosa: ejes que no parten de 0 o que cambian la unidad. La PAES usa este truco para inducir errores. Verificar siempre el origen y la unidad.',
                        ),
                        h(2, 'Análisis crítico'),
                        pText(
                            'Tres preguntas clave: ¿qué mide cada eje?, ¿qué单位和 escala se usan?, ¿qué conclusión se puede extraer sin extrapolar más allá de los datos mostrados?',
                        ),
                        ...paesExample(
                            'Un gráfico de barras muestra que en 2025 las ventas de la tienda A fueron 120 unidades y las de la tienda B fueron 90. ¿Qué porcentaje más vendió A respecto de B?',
                            'Diferencia: 120 - 90 = 30. Porcentaje respecto de B: 30/90 = 1/3 ≈ 33.3%. La tienda A vendió un 33.3% más que B.',
                        ),
                        h(2, 'Resumen'),
                        bullet([
                            'Identificar tipo de gráfico y qué mide cada eje',
                            'Verificar escala y origen antes de interpretar',
                            'Comparar proporciones, no absolutos',
                            'Cuidado con extrapolaciones más allá del rango mostrado',
                        ]),
                    ),
                },
            ],
        },
    ],
};