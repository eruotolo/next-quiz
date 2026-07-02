/**
 * Curso: Ciencias — Química (PAES Chile, Admisión 2027).
 * Temario oficial DEMRE/MINEDUC: estructura atómica, tabla periódica,
 * enlaces, reacciones, estequiometría y química orgánica.
 */
import { bullet, callout, doc, h, pText } from './_tiptap';
import type { CourseSeed } from './_types';

export const quimica: CourseSeed = {
    id: 'b1a07384-f113-4ec2-a53b-a10bde486c93',
    title: 'Ciencias — Química',
    description:
        'Curso de Química PAES Chile: estructura atómica, tabla periódica, enlaces químicos, reacciones, estequiometría, equilibrio y química orgánica.',
    modules: [
        {
            title: 'Estructura atómica y tabla periódica',
            description:
                'Modelos atómicos, configuración electrónica y propiedades periódicas.',
            lessons: [
                {
                    title: 'Modelo atómico y números cuánticos',
                    type: 'TEXTO',
                    durationSec: 2400,
                    contentJson: doc(
                        h(1, 'Modelo atómico y números cuánticos'),
                        pText(
                            'El átomo es la unidad básica de la materia. Está formado por protones y neutrones (en el núcleo) y electrones (en la corteza). El modelo atómico actual es mecánico-ondulatorio.',
                        ),
                        h(2, 'Partículas subatómicas'),
                        bullet([
                            'Protón: carga +1, masa ~1 u, en el núcleo',
                            'Neutrón: sin carga, masa ~1 u, en el núcleo',
                            'Electrón: carga -1, masa ~1/1836 u, en la corteza',
                        ]),
                        h(2, 'Número atómico y masa atómica'),
                        callout(
                            'Z = número de protones (define el elemento). A = protones + neutrones (número másico). Isótopos: átomos con mismo Z pero distinto A.',
),
                        h(2, 'Modelo de Bohr'),
                        pText(
                            'Los electrones giran en órbitas circulares con energía fija (cuantizada). Al absorber o emitir energía saltan entre niveles.',
                        ),
                        h(2, 'Modelo mecánico-ondulatorio'),
                        bullet([
                            'Orbital: región del espacio con alta probabilidad de encontrar el electrón',
                            'Cuatro números cuánticos: n, l, mₗ, mₛ',
                            'n: nivel de energía (1, 2, 3…)',
                            'l: subnivel (0=s, 1=p, 2=d, 3=f)',
                            'mₗ: orbital específico',
                            'mₛ: espín (±1/2)',
                        ]),
                        h(2, 'Configuración electrónica'),
                        pText(
                            'Distribución de electrones en subniveles. Regla de Aufbau: orden de llenado 1s, 2s, 2p, 3s, 3p, 4s, 3d, 4p, 5s, 4d, 5p, 6s, 4f, 5d, 6p, 7s. Cada orbital admite máximo 2 electrones.',
                        ),
                        h(2, 'Resumen'),
                        bullet([
                            'Z = protones; A = Z + neutrones',
                            'Isótopos mismo Z, distinto A',
                            'Cuatro números cuánticos',
                            'Aufbau: 1s → 2s → 2p → 3s → 3p → 4s → 3d …',
                        ]),
                    ),
                },
                {
                    title: 'Tabla periódica y propiedades periódicas',
                    type: 'TEXTO',
                    durationSec: 2100,
                    contentJson: doc(
                        h(1, 'Tabla periódica y propiedades periódicas'),
                        pText(
                            'La tabla periódica organiza los elementos por Z creciente. Las filas son períodos y las columnas son grupos. Los grupos numerados del 1 al 18 tienen propiedades similares.',
                        ),
                        h(2, 'Clasificación'),
                        bullet([
                            'Metales: izquierda y centro (electronegatividad baja, pierden electrones)',
                            'No metales: derecha (electronegatividad alta, ganan electrones)',
                            'Metaloides: línea diagonal (B, Si, Ge, As, Sb, Te, At)',
                            'Gases nobles: grupo 18 (estables, baja reactividad)',
                        ]),
                        h(2, 'Propiedades periódicas'),
                        callout(
                            'Radio atómico: aumenta hacia abajo y disminuye hacia la derecha. Energía de ionización: opuesta al radio. Electronegatividad: aumenta hacia arriba y a la derecha (excluyendo gases nobles). Afinidad electrónica: similar a electronegatividad.',
                        ),
                        h(2, 'Valencia y números de oxidación'),
                        pText(
                            'Valencia es la capacidad de combinación. Grupo 1: +1. Grupo 2: +2. Grupo 13: +3. Grupo 15: -3. Grupo 16: -2. Grupo 17: -1. Metales de transición: variable.',
                        ),
                        h(2, 'Resumen'),
                        bullet([
                            'Períodos: filas; grupos: columnas',
                            'Radio: ↑ abajo, ↓ derecha',
                            'Ionización: ↑ arriba, ↑ derecha',
                            'Electronegatividad: ↑ arriba, ↑ derecha',
                        ]),
                    ),
                },
                {
                    title: 'Enlaces químicos: iónico, covalente y metálico',
                    type: 'TEXTO',
                    durationSec: 2400,
                    contentJson: doc(
                        h(1, 'Enlaces químicos: iónico, covalente y metálico'),
                        pText(
                            'Los átomos se unen para alcanzar la configuración de gas noble (regla del octeto). Hay tres tipos principales de enlace.',
                        ),
                        h(2, 'Enlace iónico'),
                        bullet([
                            'Metal + no metal con electronegatividades muy distintas',
                            'Transferencia de electrones',
                            'Forma cationes (+) y aniones (-)',
                            'Estructura cristalina, alto punto de fusión',
                            'Solubles en agua, conductores en disolución',
                            'Ejemplo: NaCl',
                        ]),
                        h(2, 'Enlace covalente'),
                        callout(
                            'No metal + no metal. Compartición de pares de electrones. Puede ser simple (1 par), doble (2) o triple (3). Polar si la diferencia de electronegatividad es intermedia; apolar si es muy baja.',
),
                        bullet([
                            'Moléculas discretas (H₂O, CO₂)',
                            'Pueden ser polares o apolares',
                            'Puntos de fusión variables',
                            'Solubles en solventes polares o apolares según polaridad',
                        ]),
                        h(2, 'Enlace metálico'),
                        bullet([
                            'Metal + metal',
                            'Mar de electrones deslocalizados',
                            'Conductividad eléctrica y térmica',
                            'Maleables y dúctiles',
                            'Ejemplo: Cu, Fe, Au',
                        ]),
                        h(2, 'Fuerzas intermoleculares'),
                        pText(
                            'Puentes de hidrógeno (N-H, O-H, F-H), dipolo-dipolo (moléculas polares) y fuerzas de London (dispersión, todas las moléculas). Determinan puntos de ebullición y solubilidad.',
                        ),
                        h(2, 'Geometría molecular (VSEPR)'),
                        bullet([
                            '2 pares: lineal',
                            '3 pares: trigonal plana',
                            '4 pares: tetraédrica',
                            '5 pares: bipiramidal trigonal',
                            '6 pares: octaédrica',
                        ]),
                        h(2, 'Resumen'),
                        bullet([
                            'Iónico: metal + no metal',
                            'Covalente: no metal + no metal',
                            'Metálico: metal + metal',
                            'VSEPR predice geometría',
                        ]),
                    ),
                },
            ],
        },
        {
            title: 'Reacciones químicas y estequiometría',
            description:
                'Tipos de reacciones, balance y cálculos estequiométricos.',
            lessons: [
                {
                    title: 'Tipos de reacciones químicas',
                    type: 'TEXTO',
                    durationSec: 2100,
                    contentJson: doc(
                        h(1, 'Tipos de reacciones químicas'),
                        pText(
                            'Una reacción química es una transformación en la que los enlaces se rompen y se forman nuevos. Se representan con ecuaciones químicas balanceadas.',
                        ),
                        h(2, 'Síntesis o combinación'),
                        callout(
                            'A + B → AB. Dos o más reactantes forman un producto. Ejemplo: 2H₂ + O₂ → 2H₂O.',
                        ),
                        h(2, 'Descomposición'),
                        pText(
                            'AB → A + B. Un reactante se descompone en productos. Ejemplo: 2H₂O → 2H₂ + O₂ (electrólisis).',
                        ),
                        h(2, 'Sustitución o desplazamiento simple'),
                        bullet([
                            'A + BC → AC + B',
                            'Un elemento más activo reemplaza a otro menos activo',
                            'Ejemplo: Zn + CuSO₄ → ZnSO₄ + Cu',
                        ]),
                        h(2, 'Doble desplazamiento'),
                        pText(
                            'AB + CD → AD + CB. Intercambio de iones. Ocurre si se forma un precipitado, gas o agua. Ejemplo: AgNO₃ + NaCl → AgCl↓ + NaNO₃.',
                        ),
                        h(2, 'Combustión'),
                        bullet([
                            'Combustible + O₂ → CO₂ + H₂O + energía',
                            'Liberan gran cantidad de energía',
                            'Ejemplo: CH₄ + 2O₂ → CO₂ + 2H₂O',
                        ]),
                        h(2, 'Oxido-reducción (redox)'),
                        pText(
                            'Una especie pierde electrones (oxidación, aumenta su número de oxidación) mientras otra los gana (reducción, disminuye). Siempre acopladas: el agente oxidante se reduce y el reductor se oxida.',
                        ),
                        h(2, 'Resumen'),
                        bullet([
                            'Síntesis: A + B → AB',
                            'Descomposición: AB → A + B',
                            'Sustitución: A + BC → AC + B',
                            'Redox: transferencia de electrones',
                        ]),
                    ),
                },
                {
                    title: 'Balance de ecuaciones y moles',
                    type: 'TEXTO',
                    durationSec: 2400,
                    contentJson: doc(
                        h(1, 'Balance de ecuaciones y moles'),
                        pText(
                            'Una ecuación química balanceada cumple la ley de conservación de la materia: hay el mismo número de átomos de cada elemento en reactantes y productos.',
                        ),
                        h(2, 'Métodos de balance'),
                        bullet([
                            'Tanteo: ajustar coeficientes uno a uno',
                            'Algebraico: asignar variables (a, b, c, d) y resolver sistema',
                            'Redox: separar semirreacciones de oxidación y reducción',
                        ]),
                        callout(
                            'Solo se balancean coeficientes, nunca subíndices. Cambiar un subíndice cambia la sustancia.',
                        ),
                        h(2, 'Concepto de mol'),
                        pText(
                            'Un mol contiene 6.022 × 10²³ partículas (número de Avogadro). La masa molar de un elemento (g/mol) coincide numéricamente con su masa atómica.',
                        ),
                        h(2, 'Cálculos estequiométricos'),
                        bullet([
                            'moles de A → moles de B (razón molar de la ecuación)',
                            'moles → masa (masa molar)',
                            'moles → volumen en CNPT (22.4 L/mol para gases)',
                            'moles → número de partículas (Nₐ)',
                        ]),
                        h(2, 'Reactivo limitante'),
                        callout(
                            'En reacciones con más de un reactante, el reactivo limitante es el que se consume primero y determina la cantidad máxima de producto. Se identifica comparando las relaciones molares disponibles con las estequiométricas.',
                        ),
                        h(2, 'Rendimiento'),
                        pText(
                            'Rendimiento teórico: cantidad calculada. Rendimiento real: cantidad obtenida experimentalmente. Porcentaje de rendimiento = (real / teórico) × 100%.',
                        ),
                        h(2, 'Resumen'),
                        bullet([
                            'Conservación de la materia',
                            'Solo coeficientes se balancean',
                            'Mol: 6.022 × 10²³ partículas',
                            'Rendimiento real vs. teórico',
                        ]),
                    ),
                },
                {
                    title: 'Disoluciones y concentración',
                    type: 'TEXTO',
                    durationSec: 1800,
                    contentJson: doc(
                        h(1, 'Disoluciones y concentración'),
                        pText(
                            'Una disolución es una mezcla homogénea de soluto y solvente. La concentración indica cuánto soluto hay por unidad de disolución.',
                        ),
                        h(2, 'Unidades de concentración'),
                        bullet([
                            'Molaridad (M): moles de soluto por litro de disolución',
                            'Molalidad (m): moles de soluto por kg de solvente',
                            '% m/m: gramos de soluto por 100 g de disolución',
                            '% v/v: mL de soluto por 100 mL de disolución',
                            'ppm: partes por millón (mg/L o mg/kg)',
                        ]),
                        h(2, 'Dilución'),
                        callout(
                            'M₁V₁ = M₂V₂. Al añadir más solvente, la concentración disminuye pero la cantidad de soluto (moles) se mantiene constante.',
                        ),
                        h(2, 'Propiedades coligativas'),
                        pText(
                            'Dependen del número de partículas disueltas, no de su naturaleza. Incluyen descenso del punto de congelación, ascenso del punto de ebullición y presión osmótica.',
                        ),
                        h(2, 'Solubilidad'),
                        bullet([
                            'Sólidos en líquidos: aumenta con la temperatura',
                            'Gases en líquidos: disminuye con la temperatura, aumenta con la presión (Ley de Henry)',
                            '"Semejante disuelve a semejante": polar con polar, apolar con apolar',
                        ]),
                        h(2, 'Resumen'),
                        bullet([
                            'Molaridad M = mol soluto / L disolución',
                            'Dilución: M₁V₁ = M₂V₂',
                            'Propiedades coligativas según partículas',
                            'Solubilidad: polar con polar',
                        ]),
                    ),
                },
            ],
        },
        {
            title: 'Química orgánica',
            description:
                'Hidrocarburos, grupos funcionales, isomería y reacciones orgánicas.',
            lessons: [
                {
                    title: 'Hidrocarburos: alcanos, alquenos y alquinos',
                    type: 'TEXTO',
                    durationSec: 2400,
                    contentJson: doc(
                        h(1, 'Hidrocarburos: alcanos, alquenos y alquinos'),
                        pText(
                            'Los hidrocarburos están formados solo por C e H. Se clasifican según el tipo de enlace entre carbonos.',
                        ),
                        h(2, 'Alcanos'),
                        bullet([
                            'Enlace simple C-C',
                            'Fórmula general: CₙH₂ₙ₊₂',
                            'Saturados',
                            'Nomenclatura IUPAC: prefijo según n + sufijo -ano',
                            'Ejemplos: metano (CH₄), etano (C₂H₆), propano (C₃H₈)',
                        ]),
                        h(2, 'Alquenos'),
                        callout(
                            'Al menos un enlace doble C=C. Fórmula general: CₙH₂ₙ (no cíclicos). Nomenclatura: prefijo + sufijo -eno. Numerar la cadena para dar al doble enlace el número más bajo. Ejemplo: eteno (CH₂=CH₂).',
                        ),
                        h(2, 'Alquinos'),
                        pText(
                            'Al menos un enlace triple C≡C. Fórmula general: CₙH₂ₙ₋₂. Sufijo -ino. Ejemplo: etino o acetileno (CH≡CH).',
                        ),
                        h(2, 'Isomería'),
                        bullet([
                            'Estructural o constitucional: distinta conectividad',
                            'Cis-trans (geométrica): en alquenos con sustituyentes distintos',
                            'Óptica: carbonos con cuatro sustituyentes diferentes',
                        ]),
                        h(2, 'Reacciones orgánicas básicas'),
                        bullet([
                            'Combustión: CₙH₂ₙ₊₂ + O₂ → CO₂ + H₂O',
                            'Sustitución: característica de alcanos (halogenación)',
                            'Adición: alquenos y alquinos (hidrogenación, halogenación)',
                            'Polimerización: formación de polímeros a partir de monómeros',
                        ]),
                        h(2, 'Resumen'),
                        bullet([
                            'Alcanos: CₙH₂ₙ₊₂ (saturados)',
                            'Alquenos: CₙH₂ₙ (un doble enlace)',
                            'Alquinos: CₙH₂ₙ₋₂ (un triple enlace)',
                            'Isomería: estructural, geométrica, óptica',
                        ]),
                    ),
                },
                {
                    title: 'Grupos funcionales y familias',
                    type: 'TEXTO',
                    durationSec: 2400,
                    contentJson: doc(
                        h(1, 'Grupos funcionales y familias'),
                        pText(
                            'Un grupo funcional es un átomo o conjunto de átomos que otorga reactividad característica a una molécula orgánica.',
                        ),
                        h(2, 'Familias principales'),
                        bullet([
                            'Alcoholes: -OH (ej. etanol)',
                            'Aldehídos: -CHO (ej. formaldehído)',
                            'Cetonas: -CO- (ej. acetona)',
                            'Ácidos carboxílicos: -COOH (ej. ácido acético)',
                            'Éteres: -O- (ej. dimetiléter)',
                            'Ésteres: -COO- (ej. acetato de etilo)',
                            'Aminas: -NH₂ (ej. metilamina)',
                            'Amidas: -CONH₂ (ej. urea)',
                        ]),
                        h(2, 'Polaridad y propiedades'),
                        callout(
                            'El grupo -OH permite puentes de hidrógeno → alcoholes con alto punto de ebullición. Los ácidos carboxílicos forman dímeros por doble puente de H.',
                        ),
                        h(2, 'Reacciones características'),
                        bullet([
                            'Alcoholes: oxidación a aldehídos/cetonas/ácidos',
                            'Ácidos + alcoholes → éster + agua (esterificación)',
                            'Aminas: basicidad (aceptan H⁺)',
                            'Amidas: enlace peptídico en proteínas',
                        ]),
                        h(2, 'Biomoléculas'),
                        pText(
                            'Los grupos funcionales están en el centro de la química de la vida: carbohidratos (alcohol + carbonilo), proteínas (amida), ácidos nucleicos (éster fosfórico + amina), lípidos (éster + ácido graso).',
                        ),
                        h(2, 'Resumen'),
                        bullet([
                            '-OH alcohol, -CHO aldehído, -CO- cetona',
                            '-COOH ácido carboxílico, -COO- éster',
                            '-NH₂ amina, -CONH₂ amida',
                            'Grupos funcionales dan reactividad',
                        ]),
                    ),
                },
                {
                    title: 'Isomería y estereoquímica',
                    type: 'TEXTO',
                    durationSec: 2100,
                    contentJson: doc(
                        h(1, 'Isomería y estereoquímica'),
                        pText(
                            'Isómeros son moléculas con la misma fórmula molecular pero distinta disposición de átomos. La estereoquímica estudia la disposición tridimensional.',
                        ),
                        h(2, 'Tipos de isomería'),
                        bullet([
                            'Estructural: distinta conectividad (cadena, posición, función)',
                            'Estereoisomería: misma conectividad, distinta disposición espacial',
                        ]),
                        h(2, 'Estereoisomería'),
                        callout(
                            'Cis-trans (geométrica): en alquenos con sustituyentes distintos en cada carbono del doble enlace. Óptica: moléculas con un carbono quiral (4 sustituyentes diferentes).',
                        ),
                        h(2, 'Quiralidad'),
                        pText(
                            'Una molécula es quiral si no es superponible con su imagen especular. Tiene un carbono asimétrico (quiral). Pares de enantiómeros desvían la luz polarizada en direcciones opuestas.',
                        ),
                        h(2, 'Importancia biológica'),
                        bullet([
                            'Aminoácidos: solo L-aminoácidos en proteínas',
                            'Azúcares: solo D-azúcares en ácidos nucleicos',
                            'Fármacos: un enantiómero puede ser terapéutico y el otro tóxico (talidomida)',
                        ]),
                        h(2, 'Resumen'),
                        bullet([
                            'Isómeros: misma fórmula, distinta estructura',
                            'Cis-trans: dobles enlaces',
                            'Óptica: carbono quiral',
                            'Quiralidad clave en bioquímica',
                        ]),
                    ),
                },
            ],
        },
        {
            title: 'Química aplicada',
            description:
                'Ácido-base, redox, cinética química y equilibrio.',
            lessons: [
                {
                    title: 'Ácidos y bases: pH y neutralización',
                    type: 'TEXTO',
                    durationSec: 2100,
                    contentJson: doc(
                        h(1, 'Ácidos y bases: pH y neutralización'),
                        pText(
                            'Según Brønsted-Lowry, un ácido dona protones (H⁺) y una base los acepta. En disolución acuosa, el agua se ioniza: H₂O ⇌ H⁺ + OH⁻.',
                        ),
                        h(2, 'Escala de pH'),
                        callout(
                            'pH = -log[H⁺]. Neutro: pH = 7. Ácido: pH < 7. Básico: pH > 7. pOH = -log[OH⁻]. pH + pOH = 14 a 25 °C.',
                        ),
                        h(2, 'Ácidos y bases fuertes vs. débiles'),
                        bullet([
                            'Fuertes: se ionizan completamente (HCl, NaOH)',
                            'Débiles: ionización parcial (CH₃COOH, NH₃)',
                            'Constante de acidez Ka y basicidad Kb',
                        ]),
                        h(2, 'Neutralización'),
                        pText(
                            'ácido + base → sal + agua. La neutralización total ocurre cuando moles de H⁺ = moles de OH⁻.',
                        ),
                        h(2, 'Indicadores'),
                        bullet([
                            'Tornasol: rojo en ácido, azul en base',
                            'Fenolftaleína: incoloro en ácido, rosa en base',
                            'Indicador universal: gama de colores según pH',
                        ]),
                        h(2, 'Resumen'),
                        bullet([
                            'Ácido: dona H⁺; Base: acepta H⁺',
                            'pH = -log[H⁺]; pH + pOH = 14',
                            'Neutralización: moles H⁺ = moles OH⁻',
                            'Fuertes: ionización total; Débiles: parcial',
                        ]),
                    ),
                },
                {
                    title: 'Reacciones redox y electroquímica',
                    type: 'TEXTO',
                    durationSec: 2100,
                    contentJson: doc(
                        h(1, 'Reacciones redox y electroquímica'),
                        pText(
                            'En una reacción redox hay transferencia de electrones entre especies. La oxidación pierde electrones; la reducción los gana.',
                        ),
                        h(2, 'Conceptos clave'),
                        bullet([
                            'Número de oxidación: carga formal de un átomo en un compuesto',
                            'Agente oxidante: se reduce, gana electrones',
                            'Agente reductor: se oxida, pierde electrones',
                            'Semirreacción: ecuación de oxidación o reducción aislada',
                        ]),
                        h(2, 'Balance de ecuaciones redox'),
                        callout(
                            'Método del ion-electrón: separar en dos semirreacciones, balancear átomos y cargas con H⁺/OH⁻ y H₂O, multiplicar para igualar electrones y sumar.',
                        ),
                        h(2, 'Celdas electroquímicas'),
                        bullet([
                            'Celda galvánica (pila): energía química → eléctrica',
                            'Celdas electrolíticas: energía eléctrica → química',
                            'Ánodo: oxidación; Cátodo: reducción',
                            'Mnemotecnia: "AnOx" (ánodo-oxidación), "CaRe" (cátodo-reducción)',
                        ]),
                        h(2, 'Aplicaciones'),
                        bullet([
                            'Baterías y pilas',
                            'Corrosión de metales',
                            'Electrólisis industrial (aluminio, cloro)',
                            'Galvanoplastia',
                        ]),
                        h(2, 'Resumen'),
                        bullet([
                            'Oxidación pierde electrones',
                            'Reducción gana electrones',
                            'AnOx / CaRe',
                            'Pila: química → eléctrica',
                        ]),
                    ),
                },
                {
                    title: 'Cinética química y equilibrio',
                    type: 'TEXTO',
                    durationSec: 2100,
                    contentJson: doc(
                        h(1, 'Cinética química y equilibrio'),
                        pText(
                            'La cinética estudia la velocidad de las reacciones. El equilibrio se alcanza cuando las velocidades directa e inversa se igualan.',
                        ),
                        h(2, 'Velocidad de reacción'),
                        bullet([
                            'Factores: concentración, temperatura, superficie, catalizador',
                            'Más concentración → más colisiones → más velocidad',
                            'Temperatura ↑ → más energía cinética → más velocidad',
                            'Catalizador: disminuye energía de activación sin consumirse',
                        ]),
                        h(2, 'Constante de equilibrio Kc'),
                        callout(
                            'Para aA + bB ⇌ cC + dD: Kc = [C]^c [D]^d / [A]^a [B]^b. Kc grande: productos favorecidos. Kc pequeño: reactantes favorecidos.',
                        ),
                        h(2, 'Principio de Le Chatelier'),
                        pText(
                            'Si un sistema en equilibrio es perturbado, se desplaza para contrarrestar la perturbación.',
                        ),
                        bullet([
                            '↑ reactante → equilibrio se desplaza a productos',
                            '↑ producto → se desplaza a reactantes',
                            '↑ T en reacción exotérmica → se desplaza a reactantes',
                            '↑ P con gases → se desplaza al lado con menos moles de gas',
                        ]),
                        h(2, 'Resumen'),
                        bullet([
                            'Cinética: rapidez de reacción',
                            'Catalizador baja Ea',
                            'Kc grande: productos; Kc pequeño: reactantes',
                            'Le Chatelier predice desplazamiento',
                        ]),
                    ),
                },
            ],
        },
    ],
};