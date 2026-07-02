/**
 * Curso: Competencia Lectora (PAES Chile, Admisión 2027).
 * La prueba de Competencia Lectora mide habilidades de comprensión,
 * interpretación y evaluación de textos continuos y discontinuos.
 */
import { bullet, callout, doc, h, pText } from './_tiptap';
import type { CourseSeed } from './_types';

export const competenciaLectora: CourseSeed = {
    id: 'd3b07384-d113-4ec2-a53b-e10bde486c91',
    title: 'Competencia Lectora',
    description:
        'Curso de Competencia Lectora PAES Chile: estrategias de comprensión lectora, análisis de textos continuos y discontinuos, evaluación argumentativa y vocabulario en contexto.',
    modules: [
        {
            title: 'Estrategias de comprensión',
            description:
                'Localizar información, hacer inferencias locales y globales, y evaluar la calidad argumentativa.',
            lessons: [
                {
                    title: 'Localizar información explícita',
                    type: 'TEXTO',
                    durationSec: 1800,
                    contentJson: doc(
                        h(1, 'Localizar información explícita'),
                        pText(
                            'La habilidad más básica de la lectura PAES es encontrar en el texto un dato que está dicho de manera clara. La información puede estar en cualquier parte del texto y, a veces, expresada con palabras distintas a las del enunciado (sinónimos o paráfrasis).',
                        ),
                        h(2, 'Estrategia: lectura de preguntas primero'),
                        bullet([
                            'Lee todas las preguntas antes de buscar en el texto',
                            'Subraya las palabras clave de cada pregunta',
                            'Localiza los párrafos relevantes y lee solo esa parte',
                            'Verifica que la respuesta esté efectivamente dicha, no inferida',
                        ]),
                        h(2, 'Tipos de información a localizar'),
                        callout(
                            'Datos concretos (fechas, cifras, nombres), definiciones explícitas, listas de elementos enumerados en el texto y secuencias de hechos descritos literalmente.',
                        ),
                        h(2, 'Distractores comunes'),
                        pText(
                            'La PAES suele poner alternativas que dicen algo parecido a lo verdadero pero cambian un detalle (un número, un adverbio, un sujeto). Releer la parte exacta del texto antes de elegir cierra esa puerta.',
                        ),
                        h(2, 'Práctica'),
                        pText(
                            'Lee un párrafo, tápalo y anota las ideas principales. Luego compara con el original. Este ejercicio entrena la memoria activa, esencial para no perder tiempo saltando entre párrafo y pregunta.',
                        ),
                        h(2, 'Resumen'),
                        bullet([
                            'Información explícita está dicha literalmente',
                            'Buscar sinónimos o paráfrasis en el texto',
                            'Releer la parte exacta antes de elegir',
                            'Distractores cambian un detalle puntual',
                        ]),
                    ),
                },
                {
                    title: 'Inferencias locales y globales',
                    type: 'TEXTO',
                    durationSec: 2400,
                    contentJson: doc(
                        h(1, 'Inferencias locales y globales'),
                        pText(
                            'Inferir es deducir algo que el texto no dice de forma directa pero que se desprende lógicamente de lo que dice. La PAES distingue entre inferencias locales (dentro de un párrafo) e inferencias globales (a lo largo de todo el texto).',
                        ),
                        h(2, 'Inferencia local'),
                        bullet([
                            'Causa de algo que el texto menciona como efecto',
                            'Significado implícito de una expresión en contexto',
                            'Relación entre dos oraciones contiguas (causa-efecto, contraste, consecuencia)',
                            'Sentido de un pronombre o conector sin sustituto explícito',
                        ]),
                        h(2, 'Inferencia global'),
                        bullet([
                            'Idea central o tesis del texto (no siempre al principio)',
                            'Postura del autor aunque no la diga con esas palabras',
                            'Propósito comunicativo (informar, persuadir, criticar)',
                            'Conclusión que se desprende del conjunto de argumentos',
                        ]),
                        callout(
                            'Para inferir la idea central: lee los primeros y últimos párrafos (suelen tener la tesis y la conclusión). Si no aparece ahí, busca el párrafo más cargado de argumentos.',
                        ),
                        h(2, 'Tipos de inferencia según nivel'),
                        pText(
                            'Inferencias textuales: apoyadas en una parte específica. Inferencias supratextuales: requieren conocimiento del mundo. La PAES prefiere las primeras porque evalúan comprensión lectora, no conocimiento general.',
                        ),
                        h(2, 'Cuidado con el exceso'),
                        pText(
                            'Una inferencia válida debe estar fundamentada en el texto. Si la alternativa requiere asumir demasiado o incorporar información externa, probablemente no es la correcta.',
                        ),
                        h(2, 'Resumen'),
                        bullet([
                            'Local: dentro de un párrafo',
                            'Global: a lo largo del texto (tesis, postura)',
                            'Buscar párrafos extremos para la idea central',
                            'Debe estar respaldada por el texto',
                        ]),
                    ),
                },
                {
                    title: 'Evaluar la calidad argumentativa',
                    type: 'TEXTO',
                    durationSec: 2400,
                    contentJson: doc(
                        h(1, 'Evaluar la calidad argumentativa'),
                        pText(
                            'Evaluar es la habilidad más alta de la PAES: juzgar la solidez de los argumentos, identificar falacias, distinguir opinión de hecho y comparar fuentes.',
                        ),
                        h(2, 'Argumento vs. opinión'),
                        bullet([
                            'Opinión: juicio personal sin justificación suficiente',
                            'Argumento: opinión respaldada con razones y/o evidencia',
                            'Hecho: afirmación verificable objetivamente',
                        ]),
                        h(2, 'Tipos de evidencia'),
                        callout(
                            'Estadísticas, ejemplos, citas de expertos, analogías, datos históricos. La PAES pregunta cuál es la más pertinente para respaldar una afirmación.',
                        ),
                        h(2, 'Falacias comunes'),
                        bullet([
                            'Ad hominem: atacar a quien sostiene la idea, no a la idea',
                            'Falsa dicotomía: presentar solo dos opciones cuando hay más',
                            'Generalización apresurada: concluir de un caso aislado',
                            'Apelación a la autoridad: citar experto sin relevancia con el tema',
                            'Pendiente resbaladiza: si pasa X, entonces ocurrirá una cadena extrema',
                        ]),
                        h(2, 'Estrategia de evaluación'),
                        pText(
                            'Identifica la afirmación principal. Pregúntate: ¿qué evidencia la sostiene? ¿Es pertinente? ¿Hay contraargumentos? ¿La conclusión sigue lógicamente?',
                        ),
                        h(2, 'Resumen'),
                        bullet([
                            'Argumento: opinión + razón + evidencia',
                            'Falacias más frecuentes: ad hominem, falsa dicotomía, generalización',
                            'Evaluar pertinencia de la evidencia',
                            'Buscar contraargumentos',
                        ]),
                    ),
                },
            ],
        },
        {
            title: 'Tipología textual y géneros',
            description:
                'Textos narrativos, expositivos, argumentativos y discontinuos.',
            lessons: [
                {
                    title: 'Textos narrativos y expositivos',
                    type: 'TEXTO',
                    durationSec: 1800,
                    contentJson: doc(
                        h(1, 'Textos narrativos y expositivos'),
                        pText(
                            'Los textos narrativos cuentan una historia con personajes, espacio, tiempo y conflicto. Los expositivos explican un tema con el objetivo de informar.',
                        ),
                        h(2, 'Elementos del texto narrativo'),
                        bullet([
                            'Narrador: 1ª persona (protagonista) o 3ª (omnisciente o testigo)',
                            'Personajes: principales y secundarios',
                            'Espacio y tiempo: dónde y cuándo ocurre',
                            'Trama: introducción, nudo, desenlace',
                        ]),
                        h(2, 'Elementos del texto expositivo'),
                        callout(
                            'Estructura causa-efecto, comparación-contraste, problema-solución, definición-ejemplo. Títulos y subtítulos anticipan la organización.',
                        ),
                        h(2, 'Indicadores de tipo'),
                        pText(
                            'Verbos en pasado, diálogos y descripciones: narrativa. Verbos en presente atemporal, definiciones, datos y clasificaciones: exposición.',
                        ),
                        h(2, 'Estrategia de lectura'),
                        pText(
                            'Identificar el tipo de texto ayuda a anticipar preguntas. En narrativa, esperar preguntas sobre motivación de personajes y secuencia. En exposición, sobre definiciones y relaciones entre conceptos.',
                        ),
                        h(2, 'Resumen'),
                        bullet([
                            'Narrativa: personajes, trama, narrador',
                            'Expositiva: causa-efecto, comparación, definición',
                            'Reconocer tipo orienta la lectura',
                            'Marcar verbos y pronombres clave',
                        ]),
                    ),
                },
                {
                    title: 'Textos argumentativos y estructura del ensayo',
                    type: 'TEXTO',
                    durationSec: 2100,
                    contentJson: doc(
                        h(1, 'Textos argumentativos y estructura del ensayo'),
                        pText(
                            'El texto argumentativo defiende una tesis con el objetivo de convencer al lector. Es el más frecuente en la PAES de Competencia Lectora.',
                        ),
                        h(2, 'Estructura del ensayo'),
                        bullet([
                            'Introducción: presenta el tema y la tesis',
                            'Desarrollo: argumentos principales con evidencia',
                            'Contraargumentos: objeciones que el autor responde',
                            'Conclusión: refuerza la tesis y deja una reflexión',
                        ]),
                        h(2, 'Tipos de argumentos'),
                        callout(
                            'Racionales (lógica), de autoridad (cita a experto), de ejemplo (casos concretos), por analogía (comparación con otro caso), por consecuencia (qué pasaría si...).',
                        ),
                        h(2, 'Conectores argumentativos'),
                        bullet([
                            'Adición: además, también, asimismo',
                            'Causa: porque, dado que, puesto que',
                            'Consecuencia: por lo tanto, en consecuencia, así',
                            'Oposición: sin embargo, no obstante, aunque',
                            'Conclusión: en definitiva, en conclusión',
                        ]),
                        h(2, 'Detectar postura del autor'),
                        pText(
                            'No siempre está al principio. Buscar el párrafo con mayor carga valorativa (adjetivos, adverbios de modo, juicios explícitos). A veces se deduce de qué alternativas descarta.',
                        ),
                        h(2, 'Resumen'),
                        bullet([
                            'Tesis + argumentos + conclusión',
                            'Conectores marcan la lógica',
                            'Tipos de argumentos: razón, autoridad, ejemplo',
                            'Postura del autor no siempre explícita',
                        ]),
                    ),
                },
                {
                    title: 'Textos discontinuos y multimodales',
                    type: 'TEXTO',
                    durationSec: 2100,
                    contentJson: doc(
                        h(1, 'Textos discontinuos y multimodales'),
                        pText(
                            'Los textos discontinuos combinan lenguaje verbal con otros sistemas simbólicos: tablas, gráficos, infografías, mapas, diagramas. La PAES los usa cada vez más.',
                        ),
                        h(2, 'Tipos frecuentes en PAES'),
                        bullet([
                            'Gráficos de barras: comparar categorías',
                            'Gráficos circulares: proporciones del total',
                            'Líneas: evolución temporal',
                            'Infografías: combinación de imagen + texto + datos',
                            'Tablas: datos cruzados con encabezados',
                        ]),
                        h(2, 'Lectura cruzada'),
                        callout(
                            'La estrategia clave es alternar entre la imagen y el texto que la acompaña. Primero global: ¿qué se comunica en conjunto? Luego al detalle: ¿qué dice cada elemento?',
                        ),
                        h(2, 'Errores comunes'),
                        pText(
                            'Confundir porcentajes con valores absolutos, comparar categorías de tamaños distintos, no leer la leyenda del gráfico. La PAES induce a error con estos detalles.',
                        ),
                        h(2, 'Cohesión visual'),
                        pText(
                            'Colores, flechas, iconos y tipografías también comunican. Una flecha grande puede indicar la tendencia principal; un color rojo puede señalar alerta.',
                        ),
                        h(2, 'Resumen'),
                        bullet([
                            'Discontinuos: gráficos, tablas, infografías',
                            'Lectura cruzada: alternar imagen y texto',
                            'Cuidado con porcentajes vs absolutos',
                            'Elementos visuales también comunican',
                        ]),
                    ),
                },
            ],
        },
        {
            title: 'Análisis y vocabulario en contexto',
            description:
                'Identificar postura, analizar evidencia, comparar fuentes, vocabulario.',
            lessons: [
                {
                    title: 'Identificar postura del autor y propósito',
                    type: 'TEXTO',
                    durationSec: 1800,
                    contentJson: doc(
                        h(1, 'Identificar postura del autor y propósito'),
                        pText(
                            'La postura es la posición ideológica o valorativa que adopta el autor frente al tema. El propósito es la intención comunicativa: informar, persuadir, entretener, criticar.',
                        ),
                        h(2, 'Marcadores de postura'),
                        bullet([
                            'Adjetivos valorativos: "necesario", "inaceptable", "fundamental"',
                            'Adverbios de modo: "lamentablemente", "afortunadamente"',
                            'Verbos de opinión: "creo", "considero", "parece"',
                            'Ironía y eufemismos: posicionan implícitamente',
                        ]),
                        h(2, 'Propósito comunicativo'),
                        callout(
                            'No confundir tema con propósito. El tema es "el cambio climático"; el propósito puede ser "convencer de reducir emisiones" o "informar sobre el último informe IPCC".',
                        ),
                        h(2, 'Texto neutral vs. argumentativo'),
                        pText(
                            'Un texto informativo mantiene distancia. Un texto argumentativo toma partido explícitamente o implícitamente. Distinguirlos ayuda a calibrar el grado de postura que la PAES pregunta.',
                        ),
                        h(2, 'Resumen'),
                        bullet([
                            'Postura: posición valorativa',
                            'Propósito: intención comunicativa',
                            'Marcadores: adjetivos, adverbios, verbos de opinión',
                            'Tema ≠ propósito',
                        ]),
                    ),
                },
                {
                    title: 'Analizar evidencia y razonamiento',
                    type: 'TEXTO',
                    durationSec: 2100,
                    contentJson: doc(
                        h(1, 'Analizar evidencia y razonamiento'),
                        pText(
                            'Una vez identificada la tesis y la postura, la PAES pregunta por la calidad de la evidencia que respalda los argumentos. Esto es central en preguntas de evaluación.',
                        ),
                        h(2, 'Tipos de evidencia'),
                        bullet([
                            'Datos cuantitativos: estadísticas, porcentajes, cifras',
                            'Citas de autoridad: expertos, instituciones',
                            'Ejemplos concretos: casos, anécdotas',
                            'Comparaciones: analogías con otros fenómenos',
                            'Experimentos: estudios citados',
                        ]),
                        h(2, 'Pertinencia y suficiencia'),
                        callout(
                            'Una evidencia es pertinente cuando se relaciona directamente con la tesis. Es suficiente cuando su volumen o calidad respalda la magnitud de la afirmación. La PAES pregunta si la evidencia es pertinente pero insuficiente, pertinente y suficiente, o no pertinente.',
                        ),
                        h(2, 'Razonamiento válido vs. falaz'),
                        pText(
                            'Válido: la conclusión se sigue de las premisas. Falaz: usa atajos lógicos. La PAES presenta razonamientos sutilmente falaces como distractores.',
                        ),
                        h(2, 'Resumen'),
                        bullet([
                            'Tipos: datos, citas, ejemplos, comparaciones',
                            'Pertinencia: relación directa con la tesis',
                            'Suficiencia: volumen adecuado',
                            'Falacias: atajos lógicos',
                        ]),
                    ),
                },
                {
                    title: 'Vocabulario en contexto',
                    type: 'TEXTO',
                    durationSec: 1800,
                    contentJson: doc(
                        h(1, 'Vocabulario en contexto'),
                        pText(
                            'La PAES evalúa vocabulario mediante el significado contextual. No se trata de definiciones de diccionario, sino del sentido que la palabra adquiere en un contexto específico.',
                        ),
                        h(2, 'Estrategia de sustitución'),
                        bullet([
                            'Lee la oración completa',
                            'Identifica las palabras clave y su función',
                            'Prueba mentalmente cada alternativa',
                            'Verifica que el significado encaje en la oración',
                        ]),
                        h(2, 'Tipos de significado'),
                        callout(
                            'Denotativo: sentido literal del diccionario. Connotativo: sentido emocional o simbólico. La PAES prefiere el connotativo en textos argumentativos y literarios.',
                        ),
                        h(2, 'Sinonimia y antonimia contextual'),
                        pText(
                            'Dos palabras son sinónimas en un texto si pueden intercambiarse sin alterar el significado global. No siempre lo son en abstracto.',
                        ),
                        h(2, 'Palabras polisémicas'),
                        pText(
                            'Una palabra con varios significados se elige en función del contexto. "Banco" puede ser financiero, de plaza o de arena; el contexto decide.',
                        ),
                        h(2, 'Resumen'),
                        bullet([
                            'Significado viene del contexto',
                            'Denotativo vs. connotativo',
                            'Sinonimia contextual, no abstracta',
                            'Sustituir y verificar coherencia',
                        ]),
                    ),
                },
            ],
        },
        {
            title: 'Cohesión, coherencia y conectores',
            description:
                'Cohesión textual, coherencia, conectores y progresión temática.',
            lessons: [
                {
                    title: 'Cohesión y referencia',
                    type: 'TEXTO',
                    durationSec: 1800,
                    contentJson: doc(
                        h(1, 'Cohesión y referencia'),
                        pText(
                            'La cohesión son los mecanismos lingüísticos que conectan las partes del texto: pronombres, sinónimos, elipsis, conectores, marcadores discursivos.',
                        ),
                        h(2, 'Tipos de referencia'),
                        bullet([
                            'Anáfora: pronombre o sinónimo que se refiere a algo mencionado antes',
                            'Catáfora: lo referido aparece después',
                            'Endófora: referencia dentro del texto',
                            'Exófora: referencia al contexto externo',
                        ]),
                        h(2, 'Sustitución y elipsis'),
                        callout(
                            'La elipsis omite algo que se recupera del contexto ("María estudia matemáticas; Pedro, física" — se omite "estudia"). Reconocer el elemento omitido es clave para no perder información.',
                        ),
                        h(2, 'Recurrencia sinonímica'),
                        pText(
                            'Sustituir una palabra por un sinónimo a lo largo del texto evita la repetición y mantiene el flujo. La PAES evalúa si el sinónimo conserva el matiz original.',
                        ),
                        h(2, 'Resumen'),
                        bullet([
                            'Anáfora: mira hacia atrás',
                            'Catáfora: mira hacia adelante',
                            'Elipsis: se omite lo recuperable',
                            'Sinónimos evitan repetición',
                        ]),
                    ),
                },
                {
                    title: 'Conectores y su función lógica',
                    type: 'TEXTO',
                    durationSec: 1800,
                    contentJson: doc(
                        h(1, 'Conectores y su función lógica'),
                        pText(
                            'Los conectores explicitan la relación lógica entre las partes del texto. Elegir el conector correcto es clave tanto para escribir como para interpretar.',
                        ),
                        h(2, 'Conectores de adición'),
                        bullet(['Además', 'También', 'Asimismo', 'Incluso', 'De hecho']),
                        h(2, 'Conectores de causa'),
                        callout(
                            'Porque, puesto que, ya que, dado que, debido a. Elegir entre "porque" (explicación general) y "puesto que" (causa más formal) depende del registro del texto.',
                        ),
                        h(2, 'Conectores de consecuencia'),
                        bullet(['Por lo tanto', 'En consecuencia', 'Así', 'De modo que', 'Luego']),
                        h(2, 'Conectores de oposición'),
                        pText(
                            'Sin embargo, no obstante, aunque, a pesar de que, en cambio, por el contrario. Reconocer el tipo de oposición (parcial vs. total) es clave para interpretar el matiz.',
                        ),
                        h(2, 'Conectores temporales'),
                        bullet(['Antes', 'Después', 'Mientras', 'Luego', 'Finalmente', 'A continuación']),
                        h(2, 'Resumen'),
                        bullet([
                            'Adición: además, también',
                            'Causa: porque, ya que',
                            'Consecuencia: por lo tanto',
                            'Oposición: sin embargo, no obstante',
                        ]),
                    ),
                },
                {
                    title: 'Coherencia y progresión temática',
                    type: 'TEXTO',
                    durationSec: 1800,
                    contentJson: doc(
                        h(1, 'Coherencia y progresión temática'),
                        pText(
                            'La coherencia es la relación lógica global del texto: que las ideas estén bien estructuradas y se apoyen entre sí. La progresión temática es cómo se van introduciendo nuevos temas vinculados al central.',
                        ),
                        h(2, 'Principios de coherencia'),
                        bullet([
                            'No contradicción: las ideas no se oponen entre sí',
                            'Relevancia: cada parte aporta al todo',
                            'Progresión: el texto avanza, no se estanca',
                            'Pertenencia: el vocabulario es el adecuado al tema',
                        ]),
                        h(2, 'Tipos de progresión'),
                        callout(
                            'Temática lineal: cada oración introduce un tema nuevo. Temática con tema constante: se mantiene el mismo tema y se profundiza. La PAES pregunta cómo progresa el texto.',
                        ),
                        h(2, 'Detectar incoherencias'),
                        pText(
                            'Una oración que cambia de tema sin transición, una contradicción con un párrafo anterior, una información que no se conecta con la tesis: todas son incoherencias.',
                        ),
                        h(2, 'Resumen'),
                        bullet([
                            'Coherencia: relación lógica global',
                            'No contradicción, relevancia, progresión',
                            'Progresión lineal vs. de tema constante',
                            'Detectar saltos temáticos sin transición',
                        ]),
                    ),
                },
            ],
        },
    ],
};