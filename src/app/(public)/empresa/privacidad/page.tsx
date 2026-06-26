import type { Metadata } from 'next';
import { L3SubpageLayout } from '@/features/landing/components/L3SubpageLayout';
import { L3CTA } from '@/features/landing/components/L3CTA';

export const dynamic = 'force-static';

export const metadata: Metadata = {
    title: 'Política de Privacidad | Aulika',
    description:
        'Cómo Crow Advance E.I.R.L. trata y protege los datos personales de instituciones educativas, docentes y estudiantes en la plataforma Aulika. Cumplimiento Ley 21.719 y Ley 19.628.',
    alternates: { canonical: 'https://www.aulika.cl/empresa/privacidad' },
    robots: { index: true, follow: true },
};

const LAST_UPDATED = '26 de junio de 2026';

export default function PrivacidadPage() {
    return (
        <>
            <L3SubpageLayout
                tag="LEGAL · PRIVACIDAD"
                title="Política de Privacidad."
                description="Cómo Crow Advance E.I.R.L. gestiona y protege los datos personales de instituciones, docentes y estudiantes en la plataforma Aulika."
            >
                <div className="text-ink-dim space-y-14 leading-relaxed">
                    {/* Meta info */}
                    <div className="border-border bg-paper rounded-xl border p-6 text-sm">
                        <p>
                            <strong className="text-ink">Versión vigente:</strong> {LAST_UPDATED}
                        </p>
                        <p className="mt-1">
                            <strong className="text-ink">Razón Social:</strong> EDGARDO ANTONIO
                            RUOTOLO CARDOZO CONSULTORIA INFORMATICA E.I.R.L.
                        </p>
                        <p className="mt-1">
                            <strong className="text-ink">Nombre de Fantasía:</strong> Crow Advance
                            E.I.R.L.
                        </p>
                        <p className="mt-1">
                            <strong className="text-ink">RUT:</strong> 78.456.748-6
                        </p>
                        <p className="mt-1">
                            <strong className="text-ink">Representante legal:</strong> Edgardo
                            Antonio Ruotolo Cardozo
                        </p>
                        <p className="mt-1">
                            <strong className="text-ink">Domicilio:</strong> Centenario 493,
                            Chonchi, Chiloé, Región de Los Lagos, Chile
                        </p>
                        <p className="mt-1">
                            <strong className="text-ink">Contacto privacidad:</strong>{' '}
                            <a
                                href="mailto:edgardoruotolo@crowadvance.com"
                                className="text-primary hover:underline"
                            >
                                edgardoruotolo@crowadvance.com
                            </a>
                        </p>
                    </div>

                    {/* Art. 1 */}
                    <section>
                        <h2 className="text-ink mb-4 text-2xl font-bold">
                            Artículo 1 — Marco Legal Aplicable
                        </h2>
                        <p>
                            La presente Política se dicta en conformidad con la legislación chilena
                            vigente en materia de protección de datos personales y privacidad:
                        </p>
                        <ul className="mt-4 list-disc space-y-2 pl-6">
                            <li>
                                <strong className="text-ink">Ley Nº 19.628</strong> sobre
                                Protección de la Vida Privada (vigente).
                            </li>
                            <li>
                                <strong className="text-ink">Ley Nº 21.719</strong> de Protección
                                de Datos Personales (publicada el 13 de diciembre de 2024; las
                                disposiciones específicas rigen conforme a sus plazos de entrada en
                                vigor).
                            </li>
                            <li>
                                <strong className="text-ink">Ley Nº 21.096</strong> que
                                constitucionaliza el derecho a la protección de los datos personales.
                            </li>
                            <li>
                                <strong className="text-ink">
                                    Decreto Exento MINEDUC Nº 678 de 2018
                                </strong>{' '}
                                sobre protección de datos en el sistema escolar.
                            </li>
                            <li>
                                <strong className="text-ink">Ley Nº 19.223</strong> sobre delitos
                                informáticos.
                            </li>
                            <li>
                                <strong className="text-ink">Boletín Nº 16821-19</strong> —
                                Proyecto de Ley Marco sobre Inteligencia Artificial (en tramitación
                                legislativa).
                            </li>
                        </ul>
                    </section>

                    {/* Art. 2 */}
                    <section>
                        <h2 className="text-ink mb-4 text-2xl font-bold">
                            Artículo 2 — Roles en el Tratamiento de Datos
                        </h2>
                        <p>
                            En el marco de la prestación del servicio Aulika se distinguen dos
                            roles jurídicamente diferenciados:
                        </p>
                        <div className="mt-6 space-y-4">
                            <div className="border-primary/20 bg-primary/5 rounded-lg border-l-4 p-4">
                                <h3 className="text-ink mb-1 font-bold">
                                    Responsable del Tratamiento
                                </h3>
                                <p className="text-sm">
                                    La <strong>institución educativa</strong> (colegio, liceo,
                                    universidad, instituto u otro establecimiento) que contrata el
                                    servicio. Determina los fines y medios del tratamiento de datos
                                    de sus estudiantes y personal. Es la única obligada a obtener
                                    el consentimiento de los titulares y de sus representantes
                                    legales cuando corresponda.
                                </p>
                            </div>
                            <div className="border-border rounded-lg border-l-4 p-4">
                                <h3 className="text-ink mb-1 font-bold">
                                    Encargado del Tratamiento{' '}
                                    <span className="text-ink-dim font-normal text-xs">
                                        (Mandatario del Tratamiento — art. 16 Ley 21.719)
                                    </span>
                                </h3>
                                <p className="text-sm">
                                    <strong>Crow Advance E.I.R.L. (Aulika)</strong>, quien trata los
                                    datos únicamente por instrucción y en nombre del Responsable,
                                    sin utilizarlos para fines propios. Actúa en calidad de
                                    Mandatario del Tratamiento conforme al artículo 16 de la Ley
                                    Nº 21.719, sin tomar decisiones sobre los fines del tratamiento.
                                    La relación entre ambas partes constituye el Acuerdo de
                                    Tratamiento de Datos (ATD) exigido por la normativa vigente.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Art. 3 */}
                    <section>
                        <h2 className="text-ink mb-4 text-2xl font-bold">
                            Artículo 3 — Categorías de Datos Personales Tratados
                        </h2>
                        <p>
                            Aulika trata, por instrucción del Responsable, las siguientes
                            categorías de datos:
                        </p>
                        <div className="mt-6 space-y-6">
                            <div>
                                <h3 className="text-ink mb-2 font-semibold">
                                    Datos de estudiantes
                                </h3>
                                <ul className="list-disc space-y-1 pl-6 text-sm">
                                    <li>Nombre completo y RUT</li>
                                    <li>
                                        Correo electrónico institucional (cuando el establecimiento
                                        lo provea)
                                    </li>
                                    <li>Grupo, curso o sección académica</li>
                                    <li>Resultados de evaluaciones y calificaciones</li>
                                    <li>Historial de intentos de exámenes</li>
                                </ul>
                            </div>
                            <div>
                                <h3 className="text-ink mb-2 font-semibold">
                                    Datos de docentes y personal administrativo
                                </h3>
                                <ul className="list-disc space-y-1 pl-6 text-sm">
                                    <li>Nombre completo, RUT y correo electrónico institucional</li>
                                    <li>Asignaturas y grupos asignados</li>
                                    <li>Historial de actividad y auditoría en la plataforma</li>
                                </ul>
                            </div>
                            <div>
                                <h3 className="text-ink mb-2 font-semibold">
                                    Datos técnicos (tratados automáticamente)
                                </h3>
                                <ul className="list-disc space-y-1 pl-6 text-sm">
                                    <li>Dirección IP y datos de sesión</li>
                                    <li>Registros de acceso y logs de auditoría</li>
                                    <li>Metadatos de navegación en la plataforma</li>
                                </ul>
                            </div>
                        </div>
                        <p className="mt-4 text-sm">
                            Aulika <strong>no trata datos sensibles</strong> tales como origen
                            racial o étnico, opiniones políticas, convicciones religiosas, datos
                            de salud ni datos biométricos.
                        </p>
                    </section>

                    {/* Art. 4 */}
                    <section>
                        <h2 className="text-ink mb-4 text-2xl font-bold">
                            Artículo 4 — Tratamiento de Datos de Menores de Edad
                        </h2>
                        <p>
                            Dado que la plataforma es utilizada por instituciones que atienden a
                            estudiantes menores de edad, rigen las siguientes reglas estrictas:
                        </p>
                        <div className="border-destructive/20 bg-destructive/5 mt-4 rounded-lg border-l-4 p-4 text-sm">
                            <p className="text-ink font-semibold">Declaración fundamental</p>
                            <p className="mt-1">
                                <strong>Aulika no solicita ni recolecta datos personales de
                                menores de edad de forma directa.</strong> Toda la información
                                relativa a estudiantes menores de edad es ingresada, gestionada y
                                controlada exclusivamente por la Institución Educativa en su calidad
                                de Responsable del Tratamiento.
                            </p>
                        </div>
                        <ol className="mt-4 list-[lower-alpha] space-y-3 pl-6">
                            <li>
                                <strong className="text-ink">
                                    Responsabilidad contractual de la institución.
                                </strong>{' '}
                                Corresponde exclusiva e indelegablemente al Responsable del
                                Tratamiento obtener el consentimiento previo, expreso e informado
                                de los padres, tutores legales o representantes de los estudiantes
                                menores de edad antes de ingresarlos al sistema. Aulika no puede
                                verificar el cumplimiento de esta obligación y queda exenta de
                                responsabilidad ante su incumplimiento.
                            </li>
                            <li>
                                <strong className="text-ink">
                                    Prohibición de uso para fines distintos.
                                </strong>{' '}
                                Los datos de menores de edad no serán utilizados por Aulika para
                                ninguna finalidad distinta a la prestación del servicio educativo
                                contratado.
                            </li>
                            <li>
                                <strong className="text-ink">
                                    Prohibición absoluta de comercialización.
                                </strong>{' '}
                                Queda terminantemente prohibida la venta, cesión, arrendamiento o
                                cualquier forma de uso comercial o publicitario de datos de
                                estudiantes menores de edad.
                            </li>
                            <li>
                                <strong className="text-ink">Sin perfilamiento.</strong> Aulika no
                                construirá perfiles conductuales, de personalidad ni de aprendizaje
                                de los estudiantes más allá de los registros estrictamente
                                necesarios para la evaluación académica.
                            </li>
                            <li>
                                <strong className="text-ink">Solicitud de eliminación.</strong> Si
                                un representante legal acredita que su pupilo fue registrado sin
                                consentimiento válido, Aulika eliminará los datos del menor en un
                                plazo máximo de 72 horas desde la notificación, previa verificación
                                con el Responsable.
                            </li>
                        </ol>
                    </section>

                    {/* Art. 5 */}
                    <section>
                        <h2 className="text-ink mb-4 text-2xl font-bold">
                            Artículo 5 — Finalidades del Tratamiento
                        </h2>
                        <p>Los datos personales son tratados única y exclusivamente para:</p>
                        <ol className="mt-4 list-decimal space-y-2 pl-6">
                            <li>Prestación del servicio de evaluación en línea contratado.</li>
                            <li>
                                Autenticación e identificación de usuarios en la plataforma.
                            </li>
                            <li>
                                Registro, calificación y presentación de resultados de
                                evaluaciones académicas (funciones técnicas y pedagógicas).
                            </li>
                            <li>
                                Comunicación interna entre la plataforma y los usuarios
                                autorizados de la institución (notificaciones operacionales).
                            </li>
                            <li>
                                Generación de reportes y estadísticas institucionales.
                            </li>
                            <li>Soporte técnico y atención al cliente.</li>
                            <li>Cumplimiento de obligaciones legales.</li>
                            <li>
                                Seguridad de la plataforma y prevención de accesos fraudulentos.
                            </li>
                        </ol>
                        <p className="mt-4">
                            Aulika <strong className="text-ink">no tratará</strong> los datos
                            para: publicidad, marketing directo, perfilamiento comercial,{' '}
                            <strong className="text-ink">
                                envío de correos masivos (mailing) no solicitados
                            </strong>
                            , ni para venta, cesión o transferencia a terceros con fines
                            ajenos al servicio contratado. Esta prohibición es taxativa e
                            irrenunciable por parte del Encargado.
                        </p>
                    </section>

                    {/* Art. 6 */}
                    <section>
                        <h2 className="text-ink mb-4 text-2xl font-bold">
                            Artículo 6 — Base Jurídica del Tratamiento
                        </h2>
                        <p>El tratamiento de datos personales se sustenta en:</p>
                        <ul className="mt-4 list-disc space-y-2 pl-6">
                            <li>
                                La ejecución del contrato de servicios suscrito entre la institución
                                y Crow Advance E.I.R.L..
                            </li>
                            <li>
                                El consentimiento de los titulares, obtenido y gestionado por el
                                Responsable del Tratamiento.
                            </li>
                            <li>
                                El interés legítimo en la prestación y mejora del servicio educativo.
                            </li>
                            <li>Las obligaciones legales aplicables a Crow Advance E.I.R.L..</li>
                        </ul>
                    </section>

                    {/* Art. 7 */}
                    <section>
                        <h2 className="text-ink mb-4 text-2xl font-bold">
                            Artículo 7 — Transferencia Internacional de Datos
                        </h2>
                        <p>
                            Para la prestación del servicio, Aulika utiliza proveedores de
                            infraestructura tecnológica ubicados en los{' '}
                            <strong className="text-ink">Estados Unidos de América</strong>:
                        </p>
                        <div className="mt-4 space-y-3">
                            <div className="border-border rounded-lg border p-4 text-sm">
                                <p className="text-ink font-semibold">Vercel Inc.</p>
                                <p>
                                    Alojamiento y despliegue de la aplicación — AWS us-east-1,
                                    Virginia, EE.UU. Datos en tránsito protegidos con{' '}
                                    <strong className="text-ink">cifrado SSL/TLS</strong>.
                                </p>
                            </div>
                            <div className="border-border rounded-lg border p-4 text-sm">
                                <p className="text-ink font-semibold">Neon Inc.</p>
                                <p>
                                    Base de datos PostgreSQL — AWS us-east-1, Virginia, EE.UU.
                                    Datos en reposo protegidos con{' '}
                                    <strong className="text-ink">cifrado AES-256</strong>; datos
                                    en tránsito con <strong className="text-ink">SSL/TLS</strong>.
                                </p>
                            </div>
                        </div>
                        <p className="mt-4 text-sm">
                            Crow Advance E.I.R.L. ha suscrito Acuerdos de Tratamiento de Datos con
                            cada sub-encargado, garantizando que{' '}
                            <strong className="text-ink">
                                todos los datos viajan y se almacenan bajo cifrado SSL/TLS en
                                tránsito y AES-256 en reposo
                            </strong>
                            , conforme a los estándares exigidos por la Ley Nº 21.719. Al
                            contratar el servicio, el Responsable del Tratamiento toma
                            conocimiento y acepta esta cadena de sub-encargados. Aulika notificará
                            al Responsable con antelación ante cualquier cambio significativo.
                        </p>
                    </section>

                    {/* Art. 8 */}
                    <section>
                        <h2 className="text-ink mb-4 text-2xl font-bold">
                            Artículo 8 — Derechos ARCO
                        </h2>
                        <p>
                            Los titulares de los datos y sus representantes legales pueden
                            ejercer los siguientes derechos:
                        </p>
                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            {[
                                {
                                    title: 'Acceso',
                                    desc: 'Conocer qué datos personales trata Aulika y con qué finalidad.',
                                },
                                {
                                    title: 'Rectificación',
                                    desc: 'Solicitar la corrección de datos inexactos o incompletos.',
                                },
                                {
                                    title: 'Cancelación',
                                    desc: 'Solicitar la supresión de datos cuando no sean necesarios para la finalidad original.',
                                },
                                {
                                    title: 'Oposición',
                                    desc: 'Oponerse al tratamiento en determinadas circunstancias previstas por ley.',
                                },
                            ].map((d) => (
                                <div key={d.title} className="border-border rounded-lg border p-4">
                                    <p className="text-ink font-semibold">{d.title}</p>
                                    <p className="mt-1 text-sm">{d.desc}</p>
                                </div>
                            ))}
                        </div>
                        <p className="mt-4 text-sm">
                            Los derechos ARCO deben ejercerse preferentemente a través del
                            Responsable del Tratamiento (la institución educativa). Subsidiariamente,
                            los titulares pueden contactar directamente a Aulika en{' '}
                            <a
                                href="mailto:edgardoruotolo@crowadvance.com"
                                className="text-primary hover:underline"
                            >
                                edgardoruotolo@crowadvance.com
                            </a>
                            . Aulika responderá en un plazo máximo de 15 días hábiles.
                        </p>
                    </section>

                    {/* Art. 9 */}
                    <section>
                        <h2 className="text-ink mb-4 text-2xl font-bold">
                            Artículo 9 — Retención y Eliminación de Datos
                        </h2>
                        <ol className="list-[lower-alpha] space-y-3 pl-6">
                            <li>
                                Los datos se conservan durante la vigencia del contrato con la
                                institución y no más allá del tiempo estrictamente necesario para
                                los fines del tratamiento.
                            </li>
                            <li>
                                Al término del contrato, el Responsable tiene derecho a solicitar
                                la exportación de sus datos en formato estándar (CSV/JSON) dentro
                                de los <strong className="text-ink">30 días corridos</strong>{' '}
                                siguientes al término.
                            </li>
                            <li>
                                Transcurridos 30 días sin solicitud de exportación, Aulika
                                procederá al{' '}
                                <strong className="text-ink">
                                    borrado lógico y físico irreversible de todos los registros y
                                    respaldos
                                </strong>{' '}
                                del Responsable, salvo obligación legal de retención específica.
                            </li>
                            <li>
                                Una vez ejecutado el borrado, Aulika emitirá una{' '}
                                <strong className="text-ink">
                                    confirmación técnica de eliminación
                                </strong>{' '}
                                dentro de los 15 días hábiles siguientes a la solicitud o al
                                vencimiento del plazo de exportación.
                            </li>
                            <li>
                                Los datos de auditoría y logs de seguridad pueden conservarse por
                                un período adicional de hasta{' '}
                                <strong className="text-ink">12 meses</strong> para el cumplimiento
                                de obligaciones legales, tras lo cual serán igualmente destruidos.
                            </li>
                        </ol>
                    </section>

                    {/* Art. 10 */}
                    <section>
                        <h2 className="text-ink mb-4 text-2xl font-bold">
                            Artículo 10 — Medidas de Seguridad
                        </h2>
                        <p>
                            Crow Advance E.I.R.L. implementa las siguientes medidas técnicas y
                            organizativas para proteger los datos:
                        </p>
                        <ul className="mt-4 list-disc space-y-2 pl-6">
                            <li>
                                Cifrado SSL/TLS en todas las comunicaciones (datos en tránsito).
                            </li>
                            <li>Cifrado AES-256 para datos en reposo en la base de datos.</li>
                            <li>
                                Contraseñas almacenadas con hash bcrypt; nunca en texto plano.
                            </li>
                            <li>Control de acceso basado en roles (RBAC).</li>
                            <li>Tokens de sesión seguros con expiración automática.</li>
                            <li>Registros de auditoría de todas las acciones críticas.</li>
                            <li>Revisiones periódicas de seguridad de la plataforma.</li>
                        </ul>
                    </section>

                    {/* Art. 11 */}
                    <section>
                        <h2 className="text-ink mb-4 text-2xl font-bold">
                            Artículo 11 — Inteligencia Artificial y Decisiones Automatizadas
                        </h2>
                        <p>
                            Aulika utiliza herramientas de Inteligencia Artificial exclusivamente
                            para <strong className="text-ink">asistir a los docentes</strong> en
                            la generación y formulación de preguntas de evaluación (mediante
                            protocolos MCP — Model Context Protocol). Se declara expresamente:
                        </p>
                        <ol className="mt-4 list-[lower-alpha] space-y-3 pl-6">
                            <li>
                                <strong className="text-ink">Supervisión humana exclusiva.</strong>{' '}
                                La IA genera sugerencias de preguntas; el docente decide, edita,
                                aprueba o descarta cada pregunta antes de publicarla. Ninguna
                                pregunta se publica de forma automática.
                            </li>
                            <li>
                                <strong className="text-ink">
                                    La IA no corrige ni califica exámenes.
                                </strong>{' '}
                                Las calificaciones se calculan mediante algoritmos matemáticos
                                deterministas basados en el porcentaje de respuestas correctas.
                            </li>
                            <li>
                                <strong className="text-ink">Sin evaluación de estudiantes.</strong>{' '}
                                La IA no evalúa, clasifica ni perfila a los estudiantes.
                            </li>
                            <li>
                                <strong className="text-ink">Sin decisiones automatizadas.</strong>{' '}
                                No existen decisiones automatizadas con efectos jurídicos o
                                significativos sobre los estudiantes.
                            </li>
                            <li>
                                <strong className="text-ink">Trazabilidad y no discriminación.</strong>{' '}
                                Los modelos de IA utilizados no perpetúan sesgos discriminatorios.
                                Los registros de uso de IA son auditables y disponibles al
                                Responsable mediante solicitud formal.
                            </li>
                        </ol>
                        <p className="mt-4 text-sm">
                            Esta declaración aplica en conformidad con el Boletín Nº 16821-19 y
                            las directrices internacionales sobre sistemas de IA en contextos
                            educativos.
                        </p>
                    </section>

                    {/* Art. 12 */}
                    <section>
                        <h2 className="text-ink mb-4 text-2xl font-bold">
                            Artículo 12 — Modificaciones a Esta Política
                        </h2>
                        <p>
                            Aulika podrá modificar esta Política en cualquier momento. Los
                            cambios se notificarán al Responsable del Tratamiento con al menos{' '}
                            <strong className="text-ink">15 días hábiles de anticipación</strong>{' '}
                            mediante correo electrónico al contacto registrado. La versión vigente
                            siempre estará disponible en{' '}
                            <a
                                href="/empresa/privacidad"
                                className="text-primary hover:underline"
                            >
                                www.aulika.cl/empresa/privacidad
                            </a>
                            .
                        </p>
                    </section>

                    {/* Art. 13 */}
                    <section>
                        <h2 className="text-ink mb-4 text-2xl font-bold">
                            Artículo 13 — Contacto
                        </h2>
                        <div className="border-border bg-paper rounded-xl border p-6 text-sm">
                            <p className="text-ink font-semibold">
                                Crow Advance E.I.R.L. — Aulika
                            </p>
                            <p className="mt-2">
                                Responsable: Edgardo Ruotolo Cardozo
                            </p>
                            <p>
                                Domicilio: Centenario 493, Chonchi, Chiloé, Región de Los Lagos,
                                Chile
                            </p>
                            <p className="mt-2">
                                Correo:{' '}
                                <a
                                    href="mailto:edgardoruotolo@crowadvance.com"
                                    className="text-primary hover:underline"
                                >
                                    edgardoruotolo@crowadvance.com
                                </a>
                            </p>
                        </div>
                    </section>
                </div>
            </L3SubpageLayout>
            <L3CTA />
        </>
    );
}
