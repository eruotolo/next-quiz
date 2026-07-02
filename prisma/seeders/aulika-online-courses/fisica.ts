/**
 * Curso: Ciencias — Física (PAES Chile, Admisión 2027).
 * Temario oficial DEMRE/MINEDUC: mecánica, energía, termodinámica,
 * ondas, óptica, electricidad y magnetismo.
 */
import { bullet, callout, doc, h, pText } from './_tiptap';
import type { CourseSeed } from './_types';

export const fisica: CourseSeed = {
    id: 'a0a07384-a113-4ec2-a53b-b10bde486c94',
    title: 'Ciencias — Física',
    description:
        'Curso de Física PAES Chile: mecánica clásica, energía, termodinámica, ondas, óptica, electricidad y electromagnetismo. Temario oficial DEMRE.',
    modules: [
        {
            title: 'Mecánica clásica',
            description:
                'Cinemática, dinámica, trabajo, energía y conservación del momentum.',
            lessons: [
                {
                    title: 'Cinemática: movimiento rectilíneo y parabólico',
                    type: 'TEXTO',
                    durationSec: 2700,
                    contentJson: doc(
                        h(1, 'Cinemática: movimiento rectilíneo y parabólico'),
                        pText(
                            'La cinemática describe el movimiento sin atender sus causas. Trabaja con conceptos como posición, velocidad y aceleración.',
                        ),
                        h(2, 'Magnitudes fundamentales'),
                        bullet([
                            'Posición (x): metros (m)',
                            'Velocidad (v): m/s, vectorial',
                            'Aceleración (a): m/s²',
                            'Tiempo (t): segundos (s)',
                        ]),
                        h(2, 'MRU (movimiento rectilíneo uniforme)'),
                        callout(
                            'v constante. x = x₀ + v·t. La gráfica x-t es una recta. No hay aceleración.',
                        ),
                        h(2, 'MRUA (movimiento rectilíneo uniformemente acelerado)'),
                        bullet([
                            'a constante',
                            'v = v₀ + a·t',
                            'x = x₀ + v₀·t + (1/2)·a·t²',
                            'v² = v₀² + 2·a·Δx (independiente del tiempo)',
                        ]),
                        h(2, 'Caída libre'),
                        pText(
                            'Cuerpo bajo la gravedad, sin resistencia del aire. a = g ≈ 9.8 m/s² (10 m/s² en PAES). Las fórmulas del MRUA aplican con a = g.',
                        ),
                        h(2, 'Movimiento parabólico'),
                        callout(
                            'Composición de MRU horizontal y MRUA vertical. Alcance horizontal: x = v₀·cos(θ)·t. Altura máxima: y_max = (v₀·sen(θ))² / (2g). Tiempo de vuelo: t_total = 2·v₀·sen(θ)/g.',
                        ),
                        h(2, 'Resumen'),
                        bullet([
                            'MRU: x = x₀ + v·t',
                            'MRUA: v = v₀ + a·t; x = x₀ + v₀·t + ½·a·t²',
                            'v² = v₀² + 2·a·Δx',
                            'Parabólico: composición de MRU + MRUA',
                        ]),
                    ),
                },
                {
                    title: 'Leyes de Newton y fuerzas',
                    type: 'TEXTO',
                    durationSec: 2700,
                    contentJson: doc(
                        h(1, 'Leyes de Newton y fuerzas'),
                        pText(
                            'La dinámica estudia las causas del movimiento. Las tres leyes de Newton son la base de la mecánica clásica.',
                        ),
                        h(2, 'Primera ley: inercia'),
                        bullet([
                            'Un cuerpo permanece en reposo o MRU si la fuerza neta es cero',
                            'Resistencia al cambio de movimiento',
                            'Sistemas inerciales: donde esta ley se cumple',
                        ]),
                        h(2, 'Segunda ley: F = m·a'),
                        callout(
                            'La fuerza neta es igual al producto de la masa por la aceleración. F en N (newtons), m en kg, a en m/s². Es vectorial: la dirección de F coincide con la de a.',
                        ),
                        h(2, 'Tercera ley: acción y reacción'),
                        pText(
                            'A toda fuerza de acción le corresponde una reacción igual y opuesta. Actúan sobre cuerpos distintos, así que no se cancelan.',
                        ),
                        h(2, 'Tipos de fuerza'),
                        bullet([
                            'Peso: P = m·g (siempre hacia abajo)',
                            'Normal: perpendicular a la superficie',
                            'Tensión: a lo largo de cuerdas',
                            'Rozamiento: opuesto al movimiento, f = μ·N',
                            'Elástica: F = -k·x (Ley de Hooke)',
                        ]),
                        h(2, 'Diagrama de cuerpo libre'),
                        pText(
                            'Representar todas las fuerzas sobre el cuerpo en un diagrama. Sumar vectorialmente para obtener la fuerza neta y aplicar F = m·a.',
                        ),
                        h(2, 'Resumen'),
                        bullet([
                            'Inercia: reposo o MRU sin fuerza neta',
                            'F = m·a (vectorial)',
                            'Acción-reacción: fuerzas iguales y opuestas en cuerpos distintos',
                            'Peso P = m·g',
                        ]),
                    ),
                },
                {
                    title: 'Trabajo, energía y conservación',
                    type: 'TEXTO',
                    durationSec: 2700,
                    contentJson: doc(
                        h(1, 'Trabajo, energía y conservación'),
                        pText(
                            'La energía es la capacidad de realizar trabajo. En sistemas conservativos se conserva la energía mecánica.',
                        ),
                        h(2, 'Trabajo mecánico'),
                        callout(
                            'W = F · d · cos(θ). En joules (J). Si la fuerza es paralela al desplazamiento (θ = 0°), W = F·d. Si perpendicular, W = 0.',
                        ),
                        h(2, 'Energía cinética'),
                        bullet([
                            'Ec = (1/2)·m·v²',
                            'Energía asociada al movimiento',
                            'Teorema trabajo-energía: W_neto = ΔEc',
                        ]),
                        h(2, 'Energía potencial'),
                        pText(
                            'Energía almacenada según la posición o configuración:',
                        ),
                        bullet([
                            'Gravitatoria: Ep = m·g·h',
                            'Elástica: Ep = (1/2)·k·x²',
                            'Eléctrica: Ep = k·q₁·q₂/r',
                        ]),
                        h(2, 'Energía mecánica'),
                        callout(
                            'Em = Ec + Ep. En un sistema conservativo sin fricción: Em inicial = Em final. Principio de conservación de la energía mecánica.',
                        ),
                        h(2, 'Potencia'),
                        bullet([
                            'P = W / t (vatios, W)',
                            'P = F · v',
                            'kW = 1000 W; kWh = energía consumida en 1 hora a 1 kW',
                        ]),
                        h(2, 'Resumen'),
                        bullet([
                            'W = F·d·cos(θ) en joules',
                            'Ec = ½·m·v²; Ep = m·g·h',
                            'Em = Ec + Ep se conserva sin fricción',
                            'P = W/t en vatios',
                        ]),
                    ),
                },
            ],
        },
        {
            title: 'Termodinámica',
            description:
                'Calor, temperatura, primera ley, procesos termodinámicos.',
            lessons: [
                {
                    title: 'Calor y temperatura',
                    type: 'TEXTO',
                    durationSec: 2100,
                    contentJson: doc(
                        h(1, 'Calor y temperatura'),
                        pText(
                            'La temperatura mide la energía cinética promedio de las moléculas. El calor es la transferencia de energía entre cuerpos a diferente temperatura.',
                        ),
                        h(2, 'Escalas de temperatura'),
                        bullet([
                            'Celsius (°C): 0 °C = congelación del agua, 100 °C = ebullición',
                            'Fahrenheit (°F): 32 °F y 212 °F en los mismos puntos',
                            'Kelvin (K): escala absoluta, 0 K = cero absoluto',
                            'Conversión: K = °C + 273.15',
                        ]),
                        h(2, 'Calor sensible'),
                        callout(
                            'Q = m · c · ΔT. c es el calor específico del material (J/kg·K). Por ejemplo, agua: c ≈ 4186 J/kg·K. Indica cuánta energía hay que entregar para subir 1 kg en 1 K.',
                        ),
                        h(2, 'Calor latente'),
                        pText(
                            'Energía para cambiar de fase a temperatura constante: Q = m · L, donde L es el calor latente (fusión, vaporización, etc.).',
                        ),
                        h(2, 'Dilatación térmica'),
                        bullet([
                            'Lineal: ΔL = α · L₀ · ΔT',
                            'Superficial: ΔA = β · A₀ · ΔT (β ≈ 2α)',
                            'Volumétrica: ΔV = γ · V₀ · ΔT (γ ≈ 3α)',
                        ]),
                        h(2, 'Resumen'),
                        bullet([
                            'T: promedio de energía cinética molecular',
                            'Q = m·c·ΔT (calor sensible)',
                            'Q = m·L (calor latente, cambio de fase)',
                            'Dilatación proporcional a ΔT',
                        ]),
                    ),
                },
                {
                    title: 'Primera ley de la termodinámica',
                    type: 'TEXTO',
                    durationSec: 2400,
                    contentJson: doc(
                        h(1, 'Primera ley de la termodinámica'),
                        pText(
                            'La energía se conserva: el calor entregado a un sistema se traduce en cambio de energía interna y trabajo realizado por el sistema.',
                        ),
                        h(2, 'Ecuación'),
                        callout(
                            'Q = ΔU + W. Q: calor neto recibido. ΔU: cambio de energía interna. W: trabajo realizado por el sistema. Convención: positivo lo que entra al sistema, negativo lo que sale.',
                        ),
                        h(2, 'Procesos termodinámicos'),
                        bullet([
                            'Isotérmico: T constante → ΔU = 0 → Q = W',
                            'Isobárico: P constante → W = P·ΔV',
                            'Isocórico: V constante → W = 0 → Q = ΔU',
                            'Adiabático: Q = 0 → ΔU = -W',
                        ]),
                        h(2, 'Trabajo en procesos'),
                        pText(
                            'En un proceso isobárico, W = P·ΔV. En general, W = ∫P·dV (área bajo la curva en diagrama P-V).',
                        ),
                        h(2, 'Aplicaciones'),
                        bullet([
                            'Motores térmicos convierten calor en trabajo',
                            'Refrigeradores mueven calor de frío a caliente con trabajo',
                            'Rendimiento: η = W/Q_absorbido ≤ 1',
                        ]),
                        h(2, 'Resumen'),
                        bullet([
                            'Q = ΔU + W',
                            'Isotérmico: T cte, ΔU = 0',
                            'Isocórico: V cte, W = 0',
                            'Adiabático: Q = 0',
                        ]),
                    ),
                },
                {
                    title: 'Procesos termodinámicos y gases ideales',
                    type: 'TEXTO',
                    durationSec: 2400,
                    contentJson: doc(
                        h(1, 'Procesos termodinámicos y gases ideales'),
                        pText(
                            'Un gas ideal cumple la ecuación PV = nRT. R = 8.314 J/mol·K. El trabajo y el calor dependen del proceso.',
                        ),
                        h(2, 'Tipos de procesos (en diagrama P-V)'),
                        bullet([
                            'Isoterma: hipérbola (P·V = cte)',
                            'Isobara: recta horizontal (P = cte)',
                            'Isocora: recta vertical (V = cte)',
                            'Adiabática: curva más pronunciada que la isoterma',
                        ]),
                        h(2, 'Trabajo en procesos isotérmicos'),
                        callout(
                            'W = nRT·ln(V₂/V₁). El trabajo es el área bajo la curva P-V.',
                        ),
                        h(2, 'Capacidad calorífica'),
                        bullet([
                            'A volumen constante: Cv = (3/2)R para gas monoatómico',
                            'A presión constante: Cp = Cv + R = (5/2)R para gas monoatómico',
                            'γ = Cp/Cv = 5/3 para monoatómico',
                        ]),
                        h(2, 'Ciclos termodinámicos'),
                        pText(
                            'Un ciclo es una sucesión de procesos que vuelven al estado inicial. El trabajo neto es el área encerrada en el diagrama P-V.',
                        ),
                        h(2, 'Resumen'),
                        bullet([
                            'PV = nRT (gas ideal)',
                            'Isoterma: W = nRT·ln(V₂/V₁)',
                            'γ = Cp/Cv',
                            'Ciclo: trabajo neto = área en P-V',
                        ]),
                    ),
                },
            ],
        },
        {
            title: 'Ondas y óptica',
            description:
                'Movimiento ondulatorio, sonido, luz y óptica geométrica.',
            lessons: [
                {
                    title: 'Movimiento ondulatorio y sonido',
                    type: 'TEXTO',
                    durationSec: 2400,
                    contentJson: doc(
                        h(1, 'Movimiento ondulatorio y sonido'),
                        pText(
                            'Una onda transporta energía sin transportar materia. Se clasifican en mecánicas (necesitan medio) y electromagnéticas (no necesitan).',
                        ),
                        h(2, 'Parámetros de una onda'),
                        bullet([
                            'Longitud de onda λ (m): distancia entre dos crestas consecutivas',
                            'Frecuencia f (Hz): ciclos por segundo',
                            'Período T (s): tiempo de un ciclo. T = 1/f',
                            'Velocidad v = λ·f',
                            'Amplitud A: máxima elongación',
                        ]),
                        h(2, 'Ondas transversales y longitudinales'),
                        callout(
                            'Transversal: la vibración es perpendicular a la propagación (cuerda, electromagnéticas). Longitudinal: la vibración es paralela (sonido en el aire).',
                        ),
                        h(2, 'Sonido'),
                        bullet([
                            'Onda mecánica longitudinal',
                            'Velocidad en el aire: ~343 m/s a 20 °C',
                            'Velocidad en el agua: ~1500 m/s; en acero: ~5000 m/s',
                            'Intensidad: I = P / (4πr²)',
                            'Nivel de intensidad: β = 10·log(I/I₀) en dB',
                        ]),
                        h(2, 'Fenómenos ondulatorios'),
                        bullet([
                            'Reflexión: la onda rebota al cambiar de medio',
                            'Refracción: cambia de dirección al cambiar de medio',
                            'Difracción: contornea obstáculos',
                            'Interferencia: superposición (constructiva o destructiva)',
                            'Efecto Doppler: cambio de frecuencia por movimiento relativo',
                        ]),
                        h(2, 'Resumen'),
                        bullet([
                            'v = λ·f',
                            'T = 1/f',
                            'Sonido: longitudinal, ~343 m/s en aire',
                            'Doppler: cambio de frecuencia por movimiento',
                        ]),
                    ),
                },
                {
                    title: 'Luz y óptica geométrica',
                    type: 'TEXTO',
                    durationSec: 2700,
                    contentJson: doc(
                        h(1, 'Luz y óptica geométrica'),
                        pText(
                            'La luz es una onda electromagnética. La óptica geométrica trata la luz como rayos que se propagan en línea recta.',
                        ),
                        h(2, 'Naturaleza de la luz'),
                        bullet([
                            'Onda electromagnética transversal',
                            'Velocidad en el vacío: c ≈ 3 × 10⁸ m/s',
                            'Espectro visible: 400 nm (violeta) a 700 nm (rojo)',
                            'Luz infrarroja (calor), ultravioleta (dañino), rayos X, microondas',
                        ]),
                        h(2, 'Reflexión'),
                        callout(
                            'Ángulo de incidencia = ángulo de reflexión (respecto a la normal). Imagen en espejo plano: misma distancia del espejo, virtual y derecha.',
                        ),
                        h(2, 'Refracción'),
                        bullet([
                            'Ley de Snell: n₁·sen(θ₁) = n₂·sen(θ₂)',
                            'n: índice de refracción. n = c/v',
                            'Aire: n ≈ 1; Agua: n ≈ 1.33; Vidrio: n ≈ 1.5',
                        ]),
                        h(2, 'Lentes y espejos'),
                        bullet([
                            'Lente convergente: positiva, enfoca rayos paralelos en un foco',
                            'Lente divergente: negativa, los dispersa',
                            'Ecuación de lentes: 1/f = 1/p + 1/q',
                            'Aumento: M = -q/p',
                        ]),
                        h(2, 'Espejos'),
                        bullet([
                            'Espejo plano: imagen virtual, derecha, mismo tamaño',
                            'Espejo cóncavo: puede formar imagen real o virtual según posición',
                            'Espejo convexo: siempre imagen virtual, derecha y reducida',
                        ]),
                        h(2, 'Resumen'),
                        bullet([
                            'c ≈ 3 × 10⁸ m/s',
                            'n₁·sen(θ₁) = n₂·sen(θ₂)',
                            '1/f = 1/p + 1/q',
                            'M = -q/p',
                        ]),
                    ),
                },
                {
                    title: 'Espectro electromagnético y color',
                    type: 'TEXTO',
                    durationSec: 1800,
                    contentJson: doc(
                        h(1, 'Espectro electromagnético y color'),
                        pText(
                            'El espectro electromagnético agrupa todas las ondas EM según su longitud de onda o frecuencia.',
                        ),
                        h(2, 'Regiones del espectro'),
                        bullet([
                            'Ondas de radio: > 1 mm (radio AM, FM, microondas)',
                            'Infrarrojo: 700 nm a 1 mm (calor)',
                            'Visible: 400–700 nm',
                            'Ultravioleta: 10–400 nm',
                            'Rayos X: 0.01–10 nm',
                            'Rayos gamma: < 0.01 nm',
                        ]),
                        h(2, 'Luz visible y color'),
                        callout(
                            'El color es la percepción de la luz reflejada. Un objeto rojo absorbe todas las longitudes de onda excepto la roja, que refleja. La luz blanca contiene todos los colores del espectro visible.',
                        ),
                        h(2, 'Propiedades ondulatorias de la luz'),
                        bullet([
                            'Reflexión y refracción',
                            'Difracción (experimento de Young, doble rendija)',
                            'Interferencia constructiva y destructiva',
                            'Polarización',
                        ]),
                        h(2, 'Aplicaciones'),
                        bullet([
                            'Radiografías (rayos X)',
                            'Comunicaciones por microondas y fibra óptica',
                            'Espectroscopía',
                            'Telecomunicaciones satelitales',
                        ]),
                        h(2, 'Resumen'),
                        bullet([
                            'Visible: 400–700 nm',
                            'Color = longitud de onda reflejada',
                            'Luz blanca = todos los colores',
                            'Aplicaciones médicas y comunicaciones',
                        ]),
                    ),
                },
            ],
        },
        {
            title: 'Electricidad y magnetismo',
            description:
                'Carga eléctrica, campo, circuitos, electromagnetismo.',
            lessons: [
                {
                    title: 'Carga eléctrica y campo eléctrico',
                    type: 'TEXTO',
                    durationSec: 2400,
                    contentJson: doc(
                        h(1, 'Carga eléctrica y campo eléctrico'),
                        pText(
                            'La carga eléctrica es una propiedad de la materia que produce interacciones electromagnéticas. Existe en dos tipos: positiva y negativa.',
                        ),
                        h(2, 'Ley de Coulomb'),
                        callout(
                            'F = k·q₁·q₂/r². k = 9 × 10⁹ N·m²/C². La fuerza es repulsiva entre cargas iguales y atractiva entre opuestas.',
                        ),
                        h(2, 'Campo eléctrico'),
                        bullet([
                            'E = F/q (N/C)',
                            'Magnitud vectorial',
                            'Dirección: la fuerza sobre una carga positiva de prueba',
                            'Para una carga puntual: E = k·q/r²',
                        ]),
                        h(2, 'Conductores y aislantes'),
                        pText(
                            'Conductores: permiten el flujo de cargas (metales, agua con sales). Aislantes: lo dificultan (plástico, vidrio, madera seca). Semiconductores: propiedades intermedias (silicio, germanio).',
                        ),
                        h(2, 'Potencial eléctrico'),
                        bullet([
                            'V = k·q/r (voltios, V)',
                            'Trabajo por unidad de carga',
                            'Diferencia de potencial: ΔV = W/q',
                        ]),
                        h(2, 'Resumen'),
                        bullet([
                            'Coulomb: F = k·q₁·q₂/r²',
                            'E = F/q en N/C',
                            'Conductores, aislantes, semiconductores',
                            'V = k·q/r',
                        ]),
                    ),
                },
                {
                    title: 'Circuitos eléctricos: ley de Ohm',
                    type: 'TEXTO',
                    durationSec: 2400,
                    contentJson: doc(
                        h(1, 'Circuitos eléctricos: ley de Ohm'),
                        pText(
                            'Un circuito eléctrico es un camino cerrado por donde circula corriente. Está formado por fuente, conductores y resistencias.',
                        ),
                        h(2, 'Conceptos básicos'),
                        bullet([
                            'Corriente (I): carga que pasa por unidad de tiempo (A = C/s)',
                            'Voltaje (V): diferencia de potencial (V)',
                            'Resistencia (R): oposición al flujo (Ω)',
                            'Potencia: P = V·I (W)',
                        ]),
                        h(2, 'Ley de Ohm'),
                        callout(
                            'V = I·R. La corriente es proporcional al voltaje e inversamente proporcional a la resistencia.',
                        ),
                        h(2, 'Resistencias en serie y paralelo'),
                        bullet([
                            'Serie: R_eq = R₁ + R₂ + … (la corriente es la misma)',
                            'Paralelo: 1/R_eq = 1/R₁ + 1/R₂ + … (el voltaje es el mismo)',
                        ]),
                        h(2, 'Leyes de Kirchhoff'),
                        pText(
                            'Ley de nodos: la suma de corrientes que entran es igual a la suma de las que salen. Ley de mallas: la suma de voltajes en una malla cerrada es cero.',
                        ),
                        h(2, 'Energía y potencia'),
                        bullet([
                            'P = V·I = I²·R = V²/R',
                            'Energía: E = P·t (kWh)',
                            'Efecto Joule: Q = I²·R·t',
                        ]),
                        h(2, 'Resumen'),
                        bullet([
                            'V = I·R (Ley de Ohm)',
                            'Serie: R_eq = suma',
                            'Paralelo: 1/R_eq = suma de 1/R',
                            'P = V·I',
                        ]),
                    ),
                },
                {
                    title: 'Magnetismo y electromagnetismo',
                    type: 'TEXTO',
                    durationSec: 2400,
                    contentJson: doc(
                        h(1, 'Magnetismo y electromagnetismo'),
                        pText(
                            'Los imanes tienen dos polos (norte y sur) que generan un campo magnético. Las cargas en movimiento y las corrientes eléctricas también producen campos magnéticos.',
                        ),
                        h(2, 'Campo magnético'),
                        bullet([
                            'B en teslas (T)',
                            'Líneas de campo: salen del norte y entran al sur',
                            'Polos iguales se repelen, polos opuestos se atraen',
                        ]),
                        h(2, 'Fuerza sobre carga en movimiento'),
                        callout(
                            'F = q·v·B·sen(θ). La fuerza es perpendicular a v y a B. Es la base de motores y aceleradores de partículas.',
                        ),
                        h(2, 'Campo magnético de un conductor'),
                        pText(
                            'Un conductor recto genera un campo magnético circular a su alrededor (regla de la mano derecha). Una espira genera un dipolo magnético. Un solenoide (bobina) genera un campo similar al de un imán recto.',
                        ),
                        h(2, 'Inducción electromagnética'),
                        bullet([
                            'Faraday: variar el flujo magnético induce una FEM',
                            'ε = -dΦ/dt',
                            'Ley de Lenz: la corriente inducida se opone al cambio',
                        ]),
                        h(2, 'Aplicaciones'),
                        bullet([
                            'Motores eléctricos (corriente → movimiento)',
                            'Generadores (movimiento → corriente)',
                            'Transformadores (corriente alterna)',
                            'Auriculares y parlantes',
                            'Discos duros y tarjetas magnéticas',
                        ]),
                        h(2, 'Resumen'),
                        bullet([
                            'B en teslas',
                            'F = q·v·B·sen(θ) sobre carga',
                            'ε = -dΦ/dt (Faraday)',
                            'Lenz: la corriente se opone al cambio',
                        ]),
                    ),
                },
            ],
        },
    ],
};