/**
 * Curso: Historia y Ciencias Sociales (PAES Chile, Admisión 2027).
 * Temario oficial DEMRE/MINEDUC: historia universal, historia de Chile,
 * geografía, economía y formación ciudadana.
 */
import { bullet, callout, doc, h, pText } from './_tiptap';
import type { CourseSeed } from './_types';

export const historia: CourseSeed = {
    id: '99a07384-b113-4ec2-a53b-c10bde486c95',
    title: 'Historia y Ciencias Sociales',
    description:
        'Curso de Historia y Ciencias Sociales PAES Chile: historia universal, historia de Chile, geografía, sistemas económicos y formación ciudadana.',
    modules: [
        {
            title: 'Historia universal',
            description:
                'Edad Media, modernidad, revoluciones, mundo contemporáneo.',
            lessons: [
                {
                    title: 'Edad Media y renacimiento',
                    type: 'TEXTO',
                    durationSec: 2400,
                    contentJson: doc(
                        h(1, 'Edad Media y renacimiento'),
                        pText(
                            'La Edad Media (siglos V al XV) abarca desde la caída del Imperio Romano de Occidente hasta la caída de Constantinopla (1453). El Renacimiento marca la transición hacia la modernidad.',
                        ),
                        h(2, 'Edad Media'),
                        bullet([
                            'Feudalismo: relaciones de vasallaje y tenencia de tierras',
                            'Iglesia Católica: poder espiritual y económico',
                            'Economía agraria, autosuficiencia local',
                            'Alta Edad Media (V-X): invasiones bárbaras, islam',
                            'Baja Edad Media (XI-XV): cruzadas, peste negra, crisis',
                        ]),
                        h(2, 'Renacimiento (siglos XIV-XVI)'),
                        callout(
                            'Resurgimiento del arte, la ciencia y la filosofía grecolatina. Humanismo: el ser humano como centro. Avances científicos de Copérnico, Galileo, Vesalio.',
),
                        h(2, 'Reforma protestante (1517)'),
                        bullet([
                            'Martín Lutero publica las 95 tesis',
                            'Crítica a las indulgencias y al poder papal',
                            'Iglesias nacionales (luterana, calvinista, anglicana)',
                            'Contrarreforma católica: Concilio de Trento',
                        ]),
                        h(2, 'Descubrimiento y conquista de América'),
                        pText(
                            '1492: Cristóbal Colón llega a América. Conquista española y portuguesa. Intercambio colombino: plantas, animales, enfermedades y personas entre Europa y América. Impacto demográfico devastador en pueblos originarios.',
                        ),
                        h(2, 'Resumen'),
                        bullet([
                            'Edad Media: feudalismo, Iglesia Católica',
                            'Renacimiento: humanismo, ciencia',
                            'Reforma protestante y Contrarreforma',
                            'Descubrimiento de América: encuentro de mundos',
                        ]),
                    ),
                },
                {
                    title: 'Ilustración, revoluciones y mundo moderno',
                    type: 'TEXTO',
                    durationSec: 2700,
                    contentJson: doc(
                        h(1, 'Ilustración, revoluciones y mundo moderno'),
                        pText(
                            'La Ilustración (siglo XVIII) promovió la razón, la libertad y la igualdad. Sus ideas inspiraron las revoluciones americana y francesa, que transformaron el mundo.',
                        ),
                        h(2, 'Pensadores ilustrados'),
                        bullet([
                            'John Locke: derechos naturales (vida, libertad, propiedad)',
                            'Montesquieu: separación de poderes',
                            'Rousseau: contrato social, soberanía popular',
                            'Voltaire: tolerancia religiosa, libertad de expresión',
                            'Diderot y la Enciclopedia',
                        ]),
                        h(2, 'Revolución Industrial (1760-1840)'),
                        callout(
                            'Inicia en Inglaterra. Transforma la producción artesanal en fabril. Avances técnicos: máquina de vapor (James Watt), telar mecánico, ferrocarriles. Nace el proletariado y la cuestión social.',
),
                        h(2, 'Revolución Francesa (1789)'),
                        bullet([
                            'Toma de la Bastilla (14 de julio)',
                            'Declaración de los Derechos del Hombre y del Ciudadano',
                            'Fin del absolutismo monárquico',
                            'Período del Terror (Robespierre)',
                            'Napoleón Bonaparte: Consulado, Imperio, Código Civil',
                        ]),
                        h(2, 'Independencias americanas (1810-1825)'),
                        pText(
                            'Inspiradas por la Independencia de EE.UU. (1776) y la Revolución Francesa. Figuras: Simón Bolívar, José de San Martín, Bernardo O\'Higgins. Proceso largo con fracasos y éxitos hasta la consolidación republicana.',
                        ),
                        h(2, 'Resumen'),
                        bullet([
                            'Ilustración: razón, libertad, igualdad',
                            'Revolución Industrial: máquina de vapor',
                            'Revolución Francesa: derechos humanos',
                            'Independencias americanas',
                        ]),
                    ),
                },
                {
                    title: 'Mundo contemporáneo: guerras, Guerra Fría y globalización',
                    type: 'TEXTO',
                    durationSec: 2700,
                    contentJson: doc(
                        h(1, 'Mundo contemporáneo: guerras, Guerra Fría y globalización'),
                        pText(
                            'El siglo XX estuvo marcado por dos guerras mundiales, una Guerra Fría ideológica y la globalización posterior a 1989.',
                        ),
                        h(2, 'Primera Guerra Mundial (1914-1918)'),
                        bullet([
                            'Causas: imperialismo, nacionalismo, sistema de alianzas',
                            'Trigger: asesinato del archiduque Francisco Fernando',
                            'Trincheras, armas químicas, millones de muertos',
                            'Tratado de Versalles (1919)',
                        ]),
                        h(2, 'Revolución rusa (1917)'),
                        callout(
                            'Caída del zar Nicolás II. Bolsheviques (Lenin) toman el poder en octubre. Primera revolución socialista triunfante. URSS hasta 1991.',
                        ),
                        h(2, 'Segunda Guerra Mundial (1939-1945)'),
                        bullet([
                            'Ascenso del nazismo en Alemania (Hitler)',
                            'Holocausto judío',
                            'Eje (Alemania, Italia, Japón) vs. Aliados',
                            'Bombas atómicas en Hiroshima y Nagasaki',
                            'Creación de la ONU',
                        ]),
                        h(2, 'Guerra Fría (1947-1991)'),
                        bullet([
                            'EE.UU. (capitalismo) vs. URSS (socialismo)',
                            'Carrera armamentista y espacial',
                            'Conflictosproxy: Corea, Vietnam, Cuba',
                            'Caída del Muro de Berlín (1989), disolución URSS (1991)',
                        ]),
                        h(2, 'Globalización'),
                        pText(
                            'Interconexión económica, cultural y política mundial. Avances: internet, libre comercio, organizaciones internacionales (OMC, FMI). Críticas: desigualdad, pérdida de soberanía, cambio climático.',
                        ),
                        h(2, 'Resumen'),
                        bullet([
                            'Primera Guerra Mundial: imperialismo y alianzas',
                            'Segunda Guerra: nazismo, Holocausto',
                            'Guerra Fría: EE.UU. vs. URSS',
                            'Globalización: interconexión mundial',
                        ]),
                    ),
                },
            ],
        },
        {
            title: 'Historia de Chile',
            description:
                'Independencia, siglo XIX, siglo XX, transición y democracia.',
            lessons: [
                {
                    title: 'Independencia y organización republicana',
                    type: 'TEXTO',
                    durationSec: 2700,
                    contentJson: doc(
                        h(1, 'Independencia y organización republicana'),
                        pText(
                            'Chile se independiza de España en 1818, tras un proceso que comienza con la Primera Junta Nacional de Gobierno en 1810.',
                        ),
                        h(2, 'Ciclo de la Independencia (1810-1826)'),
                        bullet([
                            '1810: Primera Junta Nacional de Gobierno',
                            '1812: Reglamento Constitucional Provisorio',
                            '1814: Desastre de Rancagua, período de Reconquista',
                            '1817: Batalla de Chacabuco, Crossing of the Andes',
                            '1818: Batalla de Maipú, Independencia proclamada',
                        ]),
                        h(2, 'Período portaliano (1830-1861)'),
                        callout(
                            'Diego Portales organiza el Estado: Constitución de 1833, centralismo, orden público. Su lema: "una constitución moderada y de tendencia central". Establece bases de la institucionalidad chilena.',
),
                        h(2, 'Guerra del Pacífico (1879-1884)'),
                        bullet([
                            'Chile contra Bolivia y Perú',
                            'Causas: impuestos al salitre, disputas fronterizas',
                            'Héroe naval: Arturo Prat (Combate Naval de Iquique, 1879)',
                            'Tratados de Lima (1929) y de Paz (1904)',
                        ]),
                        h(2, 'Economía del salitre'),
                        pText(
                            'El salitre dominó la economía chilena desde 1880 hasta 1930. Generó enorme riqueza pero también dependencia. Su reemplazo por fertilizantes sintéticos provocó la Gran Depresión de 1930.',
                        ),
                        h(2, 'Resumen'),
                        bullet([
                            'Independencia: 1810-1818',
                            'Portales: Constitución 1833',
                            'Guerra del Pacífico: 1879-1884',
                            'Economía del salitre',
                        ]),
                    ),
                },
                {
                    title: 'Parlamentarismo, cuestión social y siglo XX',
                    type: 'TEXTO',
                    durationSec: 2700,
                    contentJson: doc(
                        h(1, 'Parlamentarismo, cuestión social y siglo XX'),
                        pText(
                            'A fines del siglo XIX y principios del XX, Chile transitó del parlamentarismo a las reformas sociales, enfrentando la cuestión obrera y la presión popular.',
                        ),
                        h(2, 'Parlamentarismo (1891-1925)'),
                        bullet([
                            'Guerra Civil de 1891 (derrota de Balmaceda)',
                            'Poder legislativo domina sobre el ejecutivo',
                            'Inestabilidad, rotación ministerial ("rueda de carreta")',
                            'Crisis económica del salitre',
                        ]),
                        h(2, 'Cuestión social'),
                        callout(
                            'Pobreza obrera, hacinamiento, mortalidad infantil. Surge el movimiento obrero (mancomunales, FOCH). Intelectuales como Baldomero Lillo ("Sub Terra", "Sub Sole") y Luis Emilio Recabarren (Partido Comunista) visibilizan la cuestión.',
                        ),
                        h(2, 'Retorno al presidencialismo (1925)'),
                        bullet([
                            'Constitución de 1925: presidencialismo fuerte',
                            'Carlos Ibáñez del Campo: dictadura modernizadora (1927-1931)',
                            'Crisis de 1929: Gran Depresión',
                        ]),
                        h(2, 'Frente Popular y gobiernos radicales'),
                        pText(
                            '1938-1952: gobiernos del Frente Popular y radicales (Aguirre Cerda, Ríos, González Videla, Ibáñez). Industrialización por sustitución de importaciones, papel del Estado.',
                        ),
                        h(2, 'Resumen'),
                        bullet([
                            'Parlamentarismo: 1891-1925',
                            'Cuestión social: Recabarren, Lillo',
                            'Constitución 1925: presidencialismo',
                            'Frente Popular: industrialización',
                        ]),
                    ),
                },
                {
                    title: 'Unidad Popular, dictadura y transición',
                    type: 'TEXTO',
                    durationSec: 2700,
                    contentJson: doc(
                        h(1, 'Unidad Popular, dictadura y transición'),
                        pText(
                            'La segunda mitad del siglo XX chileno estuvo marcada por la polarización política, el golpe de Estado de 1973, la dictadura militar y la transición a la democracia.',
                        ),
                        h(2, 'Reformas de los 60 y Unidad Popular'),
                        bullet([
                            'Reforma agraria (1962-1973)',
                            'Nacionalización del cobre (1967-1971, Salvador Allende)',
                            'Chilenización: 51% estatal (1967)',
                            'Reforma educacional: escuelas nacionalizadas',
                        ]),
                        h(2, 'Gobierno de Allende (1970-1973)'),
                        callout(
                            'Programa de la Unidad Popular: nacionalización total del cobre, reforma agraria acelerada, expansión del área social. Polarización política y crisis económica (inflación, desabastecimiento). Golpe de Estado del 11 de septiembre de 1973.',
),
                        h(2, 'Dictadura militar (1973-1990)'),
                        bullet([
                            'Augusto Pinochet: 17 años de régimen',
                            'Violaciones a DDHH: detenidos desaparecidos, tortura',
                            'Economía neoliberal: privatizaciones, apertura',
                            'Constitución de 1980',
                        ]),
                        h(2, 'Transición a la democracia (1990)'),
                        bullet([
                            'Plebiscito de 1988: NO gana',
                            'Gobiernos de la Concertación (1990-2010)',
                            'Verdad y Reconciliación (Rettig), Valech',
                            'Reforma procesal penal',
                        ]),
                        h(2, 'Resumen'),
                        bullet([
                            'Reformas de los 60',
                            'Unidad Popular y golpe de 1973',
                            'Dictadura: violaciones DDHH, neoliberalismo',
                            'Transición desde 1990',
                        ]),
                    ),
                },
            ],
        },
        {
            title: 'Geografía',
            description:
                'Geografía física de Chile, recursos naturales, geografía humana.',
            lessons: [
                {
                    title: 'Geografía física de Chile',
                    type: 'TEXTO',
                    durationSec: 2400,
                    contentJson: doc(
                        h(1, 'Geografía física de Chile'),
                        pText(
                            'Chile continental se extiende desde los 17°30′ S hasta los 56°32′ S, con más de 4.000 km de longitud. Presenta una gran diversidad climática y geográfica.',
                        ),
                        h(2, 'Relieve'),
                        bullet([
                            'Norte Grande: desierto de Atacama, altiplano, volcanes',
                            'Norte Chico: valles transversales, cordillera de la Costa',
                            'Zona Central: depresión intermedia, valles',
                            'Zona Sur: Cordillera de los Andes, lagos, volcanes',
                            'Zona Austral: Patagonia, canales, glaciares',
                            'Chile insular: Isla de Pascua, Juan Fernández',
                        ]),
                        h(2, 'Climas'),
                        callout(
                            'Desértico (Norte Grande), semiárido y estepario cálido (Norte Chico), mediterráneo (Zona Central), oceánico y frío (Zona Sur), tundra y polar (Zona Austral).',
),
                        h(2, 'Hidrografía'),
                        pText(
                            'Ríos cortos y torrentosos por la presencia de la Cordillera. Vertiente del Pacífico: mayoría. Vertiente del Atlántico: pocos (Río Baker). Cuencas endorreicas: Altiplano.',
                        ),
                        h(2, 'Recursos naturales'),
                        bullet([
                            'Minería: cobre, litio, molibdeno',
                            'Pesca: jurel, sardina, salmón',
                            'Forestal: plantaciones de pino y eucalipto',
                            'Agricultura: frutas, vino',
                        ]),
                        h(2, 'Resumen'),
                        bullet([
                            'Chile: 4.000 km de longitud',
                            'Cinco zonas geográficas',
                            'Clima mediterráneo en la zona central',
                            'Recursos: cobre, litio, pesca, forestal',
                        ]),
                    ),
                },
                {
                    title: 'Geografía humana y población',
                    type: 'TEXTO',
                    durationSec: 2400,
                    contentJson: doc(
                        h(1, 'Geografía humana y población'),
                        pText(
                            'Chile tiene una población aproximada de 19 millones de habitantes, concentrada principalmente en la Zona Central (Santiago, Valparaíso, Biobío).',
                        ),
                        h(2, 'Distribución'),
                        bullet([
                            'Región Metropolitana: ~7 millones (40% del país)',
                            'Concentración urbana: ~88% de la población',
                            'Zona Austral: baja densidad',
                            'Norte Grande: pueblos originarios y migración altiplánica',
                        ]),
                        h(2, 'Migración'),
                        callout(
                            'Chile ha recibido inmigración europea (1850-1950), latinoamericana (1960-1970) y venezolana, haitiana y colombiana reciente. Hoy se enfrenta a un nuevo ciclo migratorio.',
                        ),
                        h(2, 'Pueblos originarios'),
                        bullet([
                            'Mapuche: la principal etnia, sur de Chile',
                            'Aymara y Quechua: altiplano nortino',
                            'Rapa Nui: Isla de Pascua',
                            'Atacameño, Diaguita, Colla, Kawésqar, Yagán',
                        ]),
                        h(2, 'Pirámide poblacional'),
                        pText(
                            'Chile está en una etapa avanzada de transición demográfica: baja natalidad, baja mortalidad, envejecimiento progresivo. Esperanza de vida ~80 años.',
                        ),
                        h(2, 'Resumen'),
                        bullet([
                            'Población: ~19 millones',
                            '40% en Región Metropolitana',
                            'Mapuche, Aymara, Rapa Nui',
                            'Transición demográfica avanzada',
                        ]),
                    ),
                },
                {
                    title: 'Recursos naturales y medio ambiente',
                    type: 'TEXTO',
                    durationSec: 2400,
                    contentJson: doc(
                        h(1, 'Recursos naturales y medio ambiente'),
                        pText(
                            'Chile enfrenta el desafío de explotar sus recursos naturales de manera sostenible, preservando los ecosistemas únicos del país.',
                        ),
                        h(2, 'Recursos renovables y no renovables'),
                        bullet([
                            'Renovables: pesca, forestal, agua, energía solar y eólica',
                            'No renovables: cobre, litio, carbón, gas natural',
                            'Sustentabilidad: usar renovables sin sobrepasar su tasa de renovación',
                        ]),
                        h(2, 'Problemas ambientales'),
                        callout(
                            'Contaminación atmosférica (Santiago, Temuco), escasez hídrica (zona central), pérdida de glaciares, deforestación, basura marina. Chile es uno de los países más vulnerables al cambio climático en Sudamérica.',
                        ),
                        h(2, 'Políticas ambientales'),
                        bullet([
                            'Ministerio del Medio Ambiente (2010)',
                            'Ley REP de Responsabilidad Extendida del Productor',
                            'Áreas protegidas: parques nacionales, reservas',
                            'Acuerdo de Escazú (2022)',
                            'Carbono neutralidad al 2050 (compromiso)',
                        ]),
                        h(2, 'Cambio climático'),
                        bullet([
                            'Sequía prolongada en la zona central (mega-sequía desde 2010)',
                            'Aumento de temperatura, retroceso glaciar',
                            'Acidificación del océano',
                            'Eventos extremos: incendios, aluviones',
                        ]),
                        h(2, 'Resumen'),
                        bullet([
                            'Renovables y no renovables',
                            'Contaminación y escasez hídrica',
                            'Ministerio del Medio Ambiente desde 2010',
                            'Mega-sequía desde 2010',
                        ]),
                    ),
                },
            ],
        },
        {
            title: 'Economía y formación ciudadana',
            description:
                'Sistemas económicos, oferta y demanda, ciudadanía y derechos.',
            lessons: [
                {
                    title: 'Sistemas económicos',
                    type: 'TEXTO',
                    durationSec: 2400,
                    contentJson: doc(
                        h(1, 'Sistemas económicos'),
                        pText(
                            'Un sistema económico organiza la producción, distribución y consumo de bienes y servicios. Hay tres grandes modelos: tradicional, de mercado (capitalismo) y planificado (socialismo).',
                        ),
                        h(2, 'Economía de mercado'),
                        bullet([
                            'Propiedad privada de los medios de producción',
                            'Decisiones descentralizadas en mercado',
                            'Precios determinados por oferta y demanda',
                            'Adam Smith: "La riqueza de las naciones"',
                            'Libre empresa y competencia',
                        ]),
                        h(2, 'Economía planificada'),
                        callout(
                            'Propiedad estatal de los medios de producción. Decisiones centralizadas en el Estado. Precios fijados administrativamente. Caso histórico: URSS, Cuba. Críticas: ineficiencia, falta de incentivos.',
),
                        h(2, 'Economía mixta'),
                        pText(
                            'Combinación de mercado y Estado. Es el modelo dominante en el mundo actual. El Estado regula, provee servicios públicos y corrige externalidades; el mercado asigna recursos eficientemente.',
                        ),
                        h(2, 'Economía social de mercado'),
                        bullet([
                            'Modelo europeo (Alemania, países nórdicos)',
                            'Capitalismo con fuerte protección social',
                            'Estado de bienestar: salud, educación, pensiones',
                            'Diálogo social y negociación colectiva',
                        ]),
                        h(2, 'Resumen'),
                        bullet([
                            'Mercado: propiedad privada, oferta y demanda',
                            'Planificada: Estado centraliza',
                            'Mixta: combinación',
                            'Social de mercado: capitalismo con bienestar',
                        ]),
                    ),
                },
                {
                    title: 'Oferta, demanda y mercado',
                    type: 'TEXTO',
                    durationSec: 2100,
                    contentJson: doc(
                        h(1, 'Oferta, demanda y mercado'),
                        pText(
                            'La oferta y la demanda determinan los precios en una economía de mercado. El equilibrio se alcanza donde ambas curvas se cortan.',
                        ),
                        h(2, 'Ley de demanda'),
                        callout(
                            'Si el precio sube, la cantidad demandada baja (relación inversa). Excepciones: bienes Giffen (pan, alimentos básicos para sectores pobres) y bienes Veblen (lujo).',
                        ),
                        h(2, 'Ley de oferta'),
                        bullet([
                            'Si el precio sube, la cantidad ofrecida sube (relación directa)',
                            'Más precio → más incentivo a producir',
                            'Excepciones: productos perecederos a corto plazo',
                        ]),
                        h(2, 'Equilibrio de mercado'),
                        pText(
                            'Precio de equilibrio: donde oferta = demanda. Si el precio está por encima, hay excedente (sobra oferta). Si está por debajo, hay escasez.',
                        ),
                        h(2, 'Elasticidad'),
                        bullet([
                            'Demanda elástica: pequeño cambio de precio → gran cambio en cantidad',
                            'Demanda inelástica: cambio de precio apenas afecta la cantidad',
                            'Bienes necesarios: inelásticos',
                            'Bienes con sustitutos: elásticos',
                        ]),
                        h(2, 'Resumen'),
                        bullet([
                            'Demanda: inversa al precio',
                            'Oferta: directa al precio',
                            'Equilibrio: oferta = demanda',
                            'Elasticidad: sensibilidad al precio',
                        ]),
                    ),
                },
                {
                    title: 'Ciudadanía, derechos y participación',
                    type: 'TEXTO',
                    durationSec: 2400,
                    contentJson: doc(
                        h(1, 'Ciudadanía, derechos y participación'),
                        pText(
                            'La ciudadanía es el conjunto de derechos y deberes que vinculan a una persona con el Estado. Implica participación en lo público y respeto al Estado de Derecho.',
                        ),
                        h(2, 'Tipos de derechos'),
                        bullet([
                            'Primera generación: civiles y políticos (libertad, voto)',
                            'Segunda generación: sociales y económicos (salud, educación)',
                            'Tercera generación: colectivos (medio ambiente, paz)',
                            'Cuarta generación: digitales (privacidad, acceso a internet)',
                        ]),
                        h(2, 'Instituciones democráticas en Chile'),
                        callout(
                            'Presidente de la República (ejecutivo), Congreso Nacional (legislativo bicameral: Cámara de Diputados y Senado), Poder Judicial. Órganos autónomos: Banco Central, Contraloría, Ministerio Público.',
),
                        h(2, 'Participación ciudadana'),
                        bullet([
                            'Sufragio universal (desde 1949 incluye a mujeres)',
                            'Plebiscitos y consultas',
                            'Partidos políticos',
                            'Organizaciones civiles, sindicatos',
                            'Mecanismos de democracia directa: Iniciativa popular de ley, plebiscito comunal',
                        ]),
                        h(2, 'Estado de Derecho'),
                        bullet([
                            'División de poderes',
                            'Legalidad: nadie por encima de la ley',
                            'Derechos humanos garantizados',
                            'Tribunal Constitucional',
                        ]),
                        h(2, 'Resumen'),
                        bullet([
                            'Cuatro generaciones de derechos',
                            'Poderes: ejecutivo, legislativo, judicial',
                            'Sufragio universal',
                            'Estado de Derecho',
                        ]),
                    ),
                },
            ],
        },
    ],
};