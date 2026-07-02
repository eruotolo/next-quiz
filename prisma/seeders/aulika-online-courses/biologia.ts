/**
 * Curso: Ciencias — Biología (PAES Chile, Admisión 2027).
 * Temario oficial DEMRE/MINEDUC: célula, genética, ecología, evolución y fisiología humana.
 */
import { bullet, callout, doc, h, pText } from './_tiptap';
import type { CourseSeed } from './_types';

export const biologia: CourseSeed = {
    id: 'c2a07384-e113-4ec2-a53b-f10bde486c92',
    title: 'Ciencias — Biología',
    description:
        'Curso de Biología PAES Chile: célula, genética, herencia, ecología, evolución y fisiología humana. Temario oficial DEMRE.',
    modules: [
        {
            title: 'La célula: estructura y función',
            description:
                'Tipos celulares, orgánulos, membrana y transporte, división celular.',
            lessons: [
                {
                    title: 'Célula procariota y eucariota',
                    type: 'TEXTO',
                    durationSec: 2100,
                    contentJson: doc(
                        h(1, 'Célula procariota y eucariota'),
                        pText(
                            'La célula es la unidad estructural y funcional de todos los seres vivos. Se distinguen dos grandes tipos: procariotas (sin núcleo definido) y eucariotas (con núcleo y orgánulos membranosos).',
                        ),
                        h(2, 'Célula procariota'),
                        bullet([
                            'Material genético libre en el citoplasma (nucleoide)',
                            'Sin orgánulos membranosos',
                            'Pared celular de peptidoglucano',
                            'Tamaño: 1 a 10 μm',
                            'Ejemplos: bacterias y arqueas',
                        ]),
                        h(2, 'Célula eucariota'),
                        bullet([
                            'Núcleo definido con envoltura nuclear',
                            'Orgánulos membranosos: mitocondrias, RE, Golgi, lisosomas',
                            'Citoesqueleto de actina, microtúbulos y filamentos intermedios',
                            'Tamaño: 10 a 100 μm',
                            'Ejemplos: animales, plantas, hongos, protistas',
                        ]),
                        callout(
                            'La PAES suele preguntar diferencias funcionales: solo las eucariotas tienen mitocondrias (respiración celular aeróbica) y cloroplastos (fotosíntesis en vegetales).',
                        ),
                        h(2, 'Orgánulos y funciones'),
                        bullet([
                            'Mitocondria: respiración celular, produce ATP',
                            'Retículo endoplasmático rugoso: síntesis de proteínas',
                            'Retículo endoplasmático liso: síntesis de lípidos',
                            'Aparato de Golgi: modificación y empaquetamiento',
                            'Lisosomas: digestión celular',
                            'Ribosomas: síntesis de proteínas',
                            'Citoesqueleto: estructura y movimiento',
                        ]),
                        h(2, 'Pared celular en células vegetales'),
                        pText(
                            'Células vegetales tienen cloroplastos, pared celular de celulosa y una gran vacuola central. Hongos tienen pared de quitina; animales no tienen pared.',
                        ),
                        h(2, 'Resumen'),
                        bullet([
                            'Procariota: sin núcleo, bacterias',
                            'Eucariota: con núcleo, animales/plantas/hongos',
                            'Orgánulos con funciones específicas',
                            'Pared celular varía entre reinos',
                        ]),
                    ),
                },
                {
                    title: 'Membrana celular y transporte',
                    type: 'TEXTO',
                    durationSec: 2100,
                    contentJson: doc(
                        h(1, 'Membrana celular y transporte'),
                        pText(
                            'La membrana plasmática es una bicapa lipídica con proteínas embebidas. Su modelo es el mosaico fluido: los lípidos y proteínas se desplazan lateralmente.',
                        ),
                        h(2, 'Componentes'),
                        bullet([
                            'Fosfolípidos: doble capa con cabezas hidrofílicas y colas hidrofóbicas',
                            'Colesterol: estabiliza la membrana en células animales',
                            'Proteínas integrales y periféricas: transporte, receptores, anclaje',
                            'Glucocáliz: carbohidratos de la membrana, reconocimiento celular',
                        ]),
                        h(2, 'Transporte pasivo'),
                        callout(
                            'Sin gasto de ATP. Va a favor del gradiente de concentración. Tipos: difusión simple (moléculas pequeñas no polares), difusión facilitada (proteínas canal o transportadoras) y ósmosis (agua a través de membrana semipermeable).',
                        ),
                        h(2, 'Transporte activo'),
                        pText(
                            'Con gasto de ATP. Va en contra del gradiente. Usa bombas (Na⁺/K⁺ ATPasa) o cotransporte (simporte, antiporte).',
                        ),
                        h(2, 'Transporte en masa'),
                        bullet([
                            'Endocitosis: la célula incorpora material (fagocitosis para sólidos, pinocitosis para líquidos)',
                            'Exocitosis: la célula expulsa material mediante vesículas',
                        ]),
                        h(2, 'Ósmosis y tonicidad'),
                        pText(
                            'Medio isotónico: misma concentración, no hay cambio. Medio hipotónico: agua entra, célula animal se hincha y puede lisarse; vegetal se vuelve turgente. Medio hipertónico: agua sale, célula animal se encoge y vegetal sufre plasmólisis.',
                        ),
                        h(2, 'Resumen'),
                        bullet([
                            'Mosaico fluido: bicapa lipídica + proteínas',
                            'Pasivo: a favor del gradiente, sin ATP',
                            'Activo: contra el gradiente, con ATP',
                            'Tonicidad: isotónico, hipotónico, hipertónico',
                        ]),
                    ),
                },
                {
                    title: 'División celular: mitosis y meiosis',
                    type: 'TEXTO',
                    durationSec: 2400,
                    contentJson: doc(
                        h(1, 'División celular: mitosis y meiosis'),
                        pText(
                            'La mitosis produce dos células hijas idénticas (crecimiento y reparación). La meiosis produce cuatro células haploides diferentes (gametos).',
                        ),
                        h(2, 'Fases de la mitosis'),
                        bullet([
                            'Profase: cromatina se condensa en cromosomas, se forma el huso',
                            'Metafase: cromosomas se alinean en el ecuador',
                            'Anafase: cromátidas hermanas se separan hacia polos opuestos',
                            'Telofase: se forman dos núcleos, comienza la citocinesis',
                        ]),
                        h(2, 'Fases de la meiosis'),
                        callout(
                            'Meiosis I (reductora): separación de cromosomas homólogos. Meiosis II (ecuacional): separación de cromátidas hermanas. Resultado: 4 células haploides (n) a partir de una diploide (2n).',
                        ),
                        h(2, 'Diferencias clave'),
                        bullet([
                            'Mitosis: una división, células hijas 2n idénticas',
                            'Meiosis: dos divisiones, células hijas n genéticamente diversas',
                            'Mitosis: en somáticas; meiosis: en gónadas',
                            'Mitosis: sin sobrecruzamiento; meiosis: con sobrecruzamiento y recombinación',
                        ]),
                        h(2, 'Importancia biológica'),
                        pText(
                            'La mitosis permite crecimiento, reparación tisular y reproducción asexual. La meiosis genera variabilidad genética (base de la evolución) y reduce a la mitad el número de cromosomas para mantener constante la especie.',
                        ),
                        h(2, 'Resumen'),
                        bullet([
                            'Mitosis: 2n → 2n (idénticas)',
                            'Meiosis: 2n → n (haploides distintas)',
                            'Profase → Metafase → Anafase → Telofase',
                            'Meiosis genera variabilidad',
                        ]),
                    ),
                },
            ],
        },
        {
            title: 'Genética y herencia',
            description:
                'Leyes de Mendel, ADN, síntesis de proteínas, mutaciones, biotecnología.',
            lessons: [
                {
                    title: 'Leyes de Mendel y herencia',
                    type: 'TEXTO',
                    durationSec: 2400,
                    contentJson: doc(
                        h(1, 'Leyes de Mendel y herencia'),
                        pText(
                            'Mendel formuló tres leyes que explican los patrones básicos de herencia. Usó arvejas porque tienen ciclos cortos y caracteres fácilmente identificables.',
                        ),
                        h(2, 'Primera ley: segregación'),
                        callout(
                            'Cada individuo tiene dos alelos para cada carácter, pero solo transmite uno a cada descendiente (segregan durante la meiosis).',
                        ),
                        h(2, 'Segunda ley: distribución independiente'),
                        pText(
                            'Los alelos de distintos genes se heredan de manera independiente, salvo que estén en el mismo cromosoma (genes ligados).',
                        ),
                        h(2, 'Tercera ley: dominancia'),
                        bullet([
                            'Homocigoto dominante: AA (fenotipo dominante)',
                            'Homocigoto recesivo: aa (fenotipo recesivo)',
                            'Heterocigoto: Aa (fenotipo dominante, portador del alelo recesivo)',
                        ]),
                        h(2, 'Cruce monohíbrido'),
                        pText(
                            'Aa × Aa: 1/4 AA : 2/4 Aa : 1/4 aa → fenotipos 3:1 (dominante:recesivo).',
                        ),
                        h(2, 'Cruce dihíbrido'),
                        bullet([
                            'AaBb × AaBb → 9:3:3:1',
                            '9 A_B_ : 3 A_bb : 3 aaB_ : 1 aabb',
                            'Válido si los genes están en cromosomas distintos (no ligados)',
                        ]),
                        h(2, 'Herencia ligada al sexo'),
                        pText(
                            'Cromosoma X contiene muchos genes. Un hombre (XY) expresa el alelo recesivo ligado a X con una sola copia. Ejemplos: hemofilia, daltonismo.',
                        ),
                        h(2, 'Resumen'),
                        bullet([
                            'Segregación: cada progenitor aporta un alelo',
                            'Dominancia: Aa muestra fenotipo de A',
                            'Monohíbrido: 3:1; Dihíbrido: 9:3:3:1',
                            'Ligada al X: más frecuente en hombres',
                        ]),
                    ),
                },
                {
                    title: 'ADN, genes y expresión génica',
                    type: 'TEXTO',
                    durationSec: 2400,
                    contentJson: doc(
                        h(1, 'ADN, genes y expresión génica'),
                        pText(
                            'El ADN (ácido desoxirribonucleico) es la molécula que almacena la información genética. Está formado por dos cadenas de nucleótidos enrolladas en doble hélice.',
                        ),
                        h(2, 'Estructura del ADN'),
                        bullet([
                            'Cada nucleótido: fosfato + desoxirribosa + base nitrogenada',
                            'Bases: adenina (A), timina (T), citosina (C), guanina (G)',
                            'Complementariedad: A-T y C-G',
                            'Antiparalelas: las dos cadenas van en direcciones opuestas',
                        ]),
                        h(2, 'Replicación del ADN'),
                        callout(
                            'Es semiconservativa: cada nueva molécula conserva una cadena original y sintetiza una nueva. Ocurre en la fase S del ciclo celular, con la enzima ADN polimerasa.',
                        ),
                        h(2, 'Del ADN a la proteína'),
                        bullet([
                            'Transcripción: ADN → ARNm en el núcleo',
                            'Traducción: ARNm → proteína en los ribosomas',
                            'Código genético: tripletes de nucleótidos (codones) → aminoácidos',
                            'Universal: compartido por casi todos los organismos',
                        ]),
                        h(2, 'Gen y genoma'),
                        pText(
                            'Un gen es un segmento de ADN con información para un producto funcional (proteína o ARN). El genoma es el conjunto completo de ADN de un organismo. El Proyecto Genoma Humano secuenció ~3.000 millones de pares de bases.',
                        ),
                        h(2, 'Resumen'),
                        bullet([
                            'ADN: doble hélice, A-T y C-G',
                            'Replicación semiconservativa',
                            'Transcripción → Traducción → Proteína',
                            'Gen: unidad de información hereditaria',
                        ]),
                    ),
                },
                {
                    title: 'Mutaciones y biotecnología',
                    type: 'TEXTO',
                    durationSec: 2100,
                    contentJson: doc(
                        h(1, 'Mutaciones y biotecnología'),
                        pText(
                            'Una mutación es un cambio permanente en la secuencia de ADN. Puede ser beneficiosa, neutra o perjudicial. Es la fuente última de la variabilidad genética.',
                        ),
                        h(2, 'Tipos de mutaciones'),
                        bullet([
                            'Génicas: sustitución, inserción o deleción de nucleótidos',
                            'Cromosómicas: deleción, duplicación, inversión, translocación',
                            'Genómicas: cambio en el número de cromosomas (aneuploidía, poliploidía)',
                        ]),
                        h(2, 'Agentes mutagénicos'),
                        callout(
                            'Rayos UV, rayos X, sustancias químicas (benzopireno del tabaco), errores de la ADN polimerasa. Las mutaciones espontáneas son raras; las inducidas son más frecuentes.',
),
                        h(2, 'Biotecnología'),
                        pText(
                            'Aplicación de organismos o sistemas biológicos para obtener productos. Tres herramientas clave:',
                        ),
                        bullet([
                            'ADN recombinante: cortar y pegar genes entre organismos',
                            'PCR: amplificar fragmentos de ADN para análisis',
                            'CRISPR-Cas9: edición genética precisa y económica',
                        ]),
                        h(2, 'Aplicaciones'),
                        bullet([
                            'Medicina: insulina recombinante, terapia génica',
                            'Agricultura: cultivos transgénicos resistentes a plagas',
                            'Forense: identificación por ADN',
                            'Ambiental: bacterias que degradan petróleo',
                        ]),
                        h(2, 'Resumen'),
                        bullet([
                            'Mutación: cambio en la secuencia',
                            'Tipos: génica, cromosómica, genómica',
                            'Mutágenos: UV, químicos, radiación',
                            'Biotecnología usa ADN recombinante y PCR',
                        ]),
                    ),
                },
            ],
        },
        {
            title: 'Ecología y evolución',
            description:
                'Ecosistemas, flujo de energía, poblaciones, biodiversidad, evolución.',
            lessons: [
                {
                    title: 'Ecosistemas y flujo de energía',
                    type: 'TEXTO',
                    durationSec: 2400,
                    contentJson: doc(
                        h(1, 'Ecosistemas y flujo de energía'),
                        pText(
                            'Un ecosistema es el conjunto de organismos (biocenosis) y el medio físico donde viven (biotopo), en interacción. La energía fluye en una dirección; la materia circula.',
                        ),
                        h(2, 'Niveles tróficos'),
                        bullet([
                            'Productores: plantas, algas y algunas bacterias (fotosíntesis)',
                            'Consumidores primarios: herbívoros',
                            'Consumidores secundarios: carnívoros',
                            'Consumidores terciarios: superdepredadores',
                            'Descomponedores: hongos y bacterias',
                        ]),
                        h(2, 'Cadena y red trófica'),
                        callout(
                            'Una cadena trófica es lineal; una red trófica es la interconexión de varias cadenas en un ecosistema. La PAES pide interpretar relaciones de alimentación.',
                        ),
                        h(2, 'Flujo de energía'),
                        pText(
                            'La energía fluye en una dirección y se pierde en cada nivel (~10% se transfiere, el resto se disipa como calor). Por eso las cadenas tienen pocos eslabones.',
                        ),
                        h(2, 'Ciclos biogeoquímicos'),
                        bullet([
                            'Ciclo del carbono: fotosíntesis y respiración',
                            'Ciclo del nitrógeno: fijación, nitrificación, desnitrificación',
                            'Ciclo del agua: evaporación, condensación, precipitación',
                            'Ciclo del fósforo: weathering, sedimentación',
                        ]),
                        h(2, 'Resumen'),
                        bullet([
                            'Productores → Consumidores → Descomponedores',
                            'Solo 10% de energía se transfiere',
                            'Materia circula, energía fluye',
                            'Ciclos biogeoquímicos',
                        ]),
                    ),
                },
                {
                    title: 'Poblaciones y comunidades',
                    type: 'TEXTO',
                    durationSec: 2100,
                    contentJson: doc(
                        h(1, 'Poblaciones y comunidades'),
                        pText(
                            'Una población es un grupo de individuos de la misma especie en un lugar y tiempo dados. Una comunidad son todas las poblaciones de un ecosistema.',
                        ),
                        h(2, 'Propiedades de las poblaciones'),
                        bullet([
                            'Densidad: individuos por unidad de área o volumen',
                            'Natalidad y mortalidad: tasas de nacimientos y muertes',
                            'Migración: emigración e inmigración',
                            'Distribución: aleatoria, agrupada o uniforme',
                            'Pirámide poblacional: estructura por edad y sexo',
                        ]),
                        h(2, 'Crecimiento poblacional'),
                        callout(
                            'Crecimiento exponencial (J): en condiciones ideales, la población se duplica en intervalos regulares. Crecimiento logístico (S): limitado por la capacidad de carga (K) del ambiente.',
                        ),
                        h(2, 'Interacciones en la comunidad'),
                        bullet([
                            'Depredación: uno se beneficia, otro muere',
                            'Competencia: dos especies compiten por recursos',
                            'Mutualismo: ambas se benefician',
                            'Comensalismo: uno se beneficia, otro no afectado',
                            'Parasitismo: uno se beneficia, otro perjudicado',
                            'Simbiosis en sentido amplio: cualquier interacción estrecha',
                        ]),
                        h(2, 'Sucesión ecológica'),
                        pText(
                            'Sucesión primaria: en un terreno sin vida previa (roca desnuda). Sucesión secundaria: tras un disturbio que conserva el suelo. Culmina en una comunidad clímax estable.',
                        ),
                        h(2, 'Resumen'),
                        bullet([
                            'Densidad, natalidad, mortalidad',
                            'Crecimiento J vs. logístico (K)',
                            'Interacciones: competencia, mutualismo, depredación',
                            'Sucesión primaria vs. secundaria',
                        ]),
                    ),
                },
                {
                    title: 'Evolución y biodiversidad',
                    type: 'TEXTO',
                    durationSec: 2400,
                    contentJson: doc(
                        h(1, 'Evolución y biodiversidad'),
                        pText(
                            'La evolución es el cambio en las frecuencias alélicas de una población a lo largo del tiempo. La teoría moderna integra selección natural, mutación, migración y deriva genética.',
                        ),
                        h(2, 'Selección natural'),
                        bullet([
                            'Variabilidad: existen diferencias entre individuos',
                            'Herencia: las diferencias se transmiten',
                            'Supervivencia diferencial: algunos sobreviven más',
                            'Reproducción diferencial: los mejor adaptados dejan más descendencia',
                        ]),
                        h(2, 'Tipos de selección'),
                        callout(
                            'Direccional: favorece un extremo. Estabilizadora: favorece el promedio. Disruptiva: favorece ambos extremos. La PAES pide identificar el tipo a partir de gráficos.',
                        ),
                        h(2, 'Evidencias de evolución'),
                        bullet([
                            'Fósiles: registro cronológico de especies extintas',
                            'Anatomía comparada: estructuras homólogas (mismo origen) vs. análogas (misma función)',
                            'Embriología: embriones similares en etapas tempranas',
                            'Biología molecular: similitud en ADN y proteínas',
                            'Biogeografía: distribución de especies',
                        ]),
                        h(2, 'Especiación'),
                        bullet([
                            'Alopátrida: barrera geográfica separa poblaciones',
                            'Simpátrida: especiación sin separación geográfica',
                            'Poliploidía: duplicación de juegos cromosómicos (frecuente en plantas)',
                        ]),
                        h(2, 'Biodiversidad'),
                        pText(
                            'Número de especies distintas en un área. Chile es un país de alta biodiversidad por sus variados climas y aislamientos geográficos. Las principales amenazas son pérdida de hábitat, especies invasoras y cambio climático.',
                        ),
                        h(2, 'Resumen'),
                        bullet([
                            'Selección natural: variabilidad + herencia + reproducción diferencial',
                            'Direccional, estabilizadora, disruptiva',
                            'Especiación alopátrida vs. simpátrida',
                            'Biodiversidad amenazada por pérdida de hábitat',
                        ]),
                    ),
                },
            ],
        },
        {
            title: 'Fisiología humana',
            description:
                'Sistemas digestivo, respiratorio, circulatorio, excretor, nervioso y endocrino.',
            lessons: [
                {
                    title: 'Sistemas digestivo y respiratorio',
                    type: 'TEXTO',
                    durationSec: 2400,
                    contentJson: doc(
                        h(1, 'Sistemas digestivo y respiratorio'),
                        pText(
                            'El sistema digestivo degrada los alimentos en nutrientes absorbibles. El respiratorio intercambia O₂ y CO₂ entre el aire y la sangre.',
                        ),
                        h(2, 'Sistema digestivo'),
                        bullet([
                            'Boca: masticación y saliva (amilasa)',
                            'Esófago: tubo muscular con peristaltismo',
                            'Estómago: jugos gástricos (HCl y pepsina), pH ~2',
                            'Intestino delgado: duodeno, yeyuno, íleon — absorción principal',
                            'Intestino grueso: absorción de agua y electrolitos',
                            'Hígado: bilis, almacenamiento de glucógeno, detoxificación',
                            'Páncreas: insulina, glucagón, jugo pancreático',
                        ]),
                        callout(
                            'En el duodeno, la bilis emulsiona grasas (las hace accesibles a las lipasas). El páncreas secreta enzimas y bicarbonato para neutralizar el quilo ácido.',
                        ),
                        h(2, 'Sistema respiratorio'),
                        bullet([
                            'Vías respiratorias: nariz, faringe, laringe, tráquea, bronquios, bronquiolos',
                            'Pulmones: alvéolos (sitio de intercambio gaseoso)',
                            'Diafragma: músculo principal de la inspiración',
                            'Hematosis: O₂ pasa del alvéolo a la sangre, CO₂ en sentido contrario',
                        ]),
                        h(2, 'Transporte de gases'),
                        pText(
                            'O₂ se une a la hemoglobina formando oxihemoglobina. CO₂ se transporta disuelto, como bicarbonato o carbaminohemoglobina.',
                        ),
                        h(2, 'Resumen'),
                        bullet([
                            'Digestivo: boca → estómago → intestino',
                            'Respiratorio: vías → alvéolos → sangre',
                            'Hematosis en alvéolos',
                            'O₂ con hemoglobina, CO₂ como bicarbonato',
                        ]),
                    ),
                },
                {
                    title: 'Sistemas circulatorio y excretor',
                    type: 'TEXTO',
                    durationSec: 2400,
                    contentJson: doc(
                        h(1, 'Sistemas circulatorio y excretor'),
                        pText(
                            'El sistema circulatorio transporta nutrientes, gases y desechos. El excretor elimina desechos metabólicos y regula el equilibrio hídrico.',
                        ),
                        h(2, 'Sistema circulatorio'),
                        bullet([
                            'Corazón: cuatro cavidades (2 aurículas, 2 ventrículos)',
                            'Circulación pulmonar: corazón → pulmones → corazón',
                            'Circulación sistémica: corazón → tejidos → corazón',
                            'Arterias: llevan sangre desde el corazón',
                            'Venas: devuelven sangre al corazón',
                            'Capilares: sitio de intercambio',
                        ]),
                        callout(
                            'El corazón late por el nodo sinusal (marcapasos natural). La sístole es la contracción; la diástole, la relajación. La frecuencia cardíaca en reposo es ~70 bpm.',
                        ),
                        h(2, 'Sangre'),
                        bullet([
                            'Glóbulos rojos (eritrocitos): hemoglobina, transporte de O₂',
                            'Glóbulos blancos (leucocitos): defensa inmune',
                            'Plaquetas: coagulación',
                            'Plasma: agua, sales, proteínas',
                        ]),
                        h(2, 'Sistema excretor'),
                        bullet([
                            'Riñones: filtran sangre y producen orina',
                            'Nefrona: unidad funcional (glomérulo, túbulos)',
                            'Filtración, reabsorción y secreción',
                            'Uréteres, vejiga y uretra',
                        ]),
                        h(2, 'Resumen'),
                        bullet([
                            'Corazón: 4 cavidades, doble circulación',
                            'Sangre: glóbulos rojos, blancos, plaquetas, plasma',
                            'Riñón: nefrona, orina',
                            'Función excretora: equilibrio hídrico',
                        ]),
                    ),
                },
                {
                    title: 'Sistemas nervioso y endocrino',
                    type: 'TEXTO',
                    durationSec: 2700,
                    contentJson: doc(
                        h(1, 'Sistemas nervioso y endocrino'),
                        pText(
                            'El sistema nervioso transmite señales eléctricas rápidas. El endocrino libera hormonas a la sangre, con efectos más lentos pero duraderos.',
                        ),
                        h(2, 'Sistema nervioso'),
                        bullet([
                            'Central: encéfalo y médula espinal',
                            'Periférico: nervios somáticos y autónomos (simpático y parasimpático)',
                            'Neurona: célula con dendritas, cuerpo celular y axón',
                            'Sinapsis: comunicación entre neuronas con neurotransmisores',
                        ]),
                        callout(
                            'El potencial de acción viaja por el axón gracias al intercambio iónico (Na⁺ y K⁺). La mielina aísla y aumenta la velocidad de conducción.',
                        ),
                        h(2, 'Encéfalo'),
                        bullet([
                            'Cerebro: pensamiento, memoria, movimiento voluntario',
                            'Cerebelo: equilibrio y coordinación',
                            'Tronco encefálico: funciones vitales (respiración, ritmo cardíaco)',
                            'Hipotálamo: enlace con el sistema endocrino',
                        ]),
                        h(2, 'Sistema endocrino'),
                        bullet([
                            'Glándulas: hipófisis, tiroides, suprarrenales, páncreas, gónadas',
                            'Hormonas: mensajeros químicos en la sangre',
                            'Insulina y glucagón: regulan glucosa',
                            'Adrenalina: respuesta de estrés',
                            'Tiroxina: metabolismo',
                            'Hormonas sexuales: caracteres sexuales secundarios',
                        ]),
                        h(2, 'Resumen'),
                        bullet([
                            'Nervioso: rápido, eléctrico',
                            'Endocrino: lento, hormonal',
                            'Neurona: dendritas, axón, sinapsis',
                            'Hipotálamo conecta ambos sistemas',
                        ]),
                    ),
                },
            ],
        },
    ],
};