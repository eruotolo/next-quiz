import type { Metadata } from 'next';
import { L3SubpageLayout } from '@/features/landing/components/L3SubpageLayout';
import { L3CTA } from '@/features/landing/components/L3CTA';

export const dynamic = 'force-static';

export const metadata: Metadata = {
    title: 'Términos y Condiciones | Aulika',
    description:
        'Condiciones de uso del servicio SaaS Aulika para instituciones educativas. Licencia, propiedad intelectual, SLA, limitación de responsabilidad e IA. Crow Advance EIRL.',
    alternates: { canonical: 'https://www.aulika.cl/empresa/terminos' },
    robots: { index: true, follow: true },
};

const LAST_UPDATED = '26 de junio de 2026';

export default function TerminosPage() {
    return (
        <>
            <L3SubpageLayout
                tag="LEGAL · TÉRMINOS"
                title="Términos y Condiciones."
                description="Condiciones de uso del servicio SaaS Aulika para instituciones educativas. Licencia, disponibilidad, responsabilidad, propiedad intelectual e inteligencia artificial."
            >
                <div className="text-ink-dim space-y-14 leading-relaxed">
                    {/* Meta info */}
                    <div className="border-border bg-paper rounded-xl border p-6 text-sm">
                        <p>
                            <strong className="text-ink">Versión vigente:</strong> {LAST_UPDATED}
                        </p>
                        <p className="mt-1">
                            <strong className="text-ink">Proveedor del servicio:</strong> Crow
                            Advance EIRL — RUT 27.039.635-6
                        </p>
                        <p className="mt-1">
                            <strong className="text-ink">Representante legal:</strong> Edgardo
                            Ruotolo Cardozo
                        </p>
                        <p className="mt-1">
                            <strong className="text-ink">Domicilio:</strong> Centenario 493,
                            Chonchi, Chiloé, Región de Los Lagos, Chile
                        </p>
                        <p className="mt-1">
                            <strong className="text-ink">Contacto legal:</strong>{' '}
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
                            Artículo 1 — Partes y Objeto
                        </h2>
                        <p>
                            El presente contrato se celebra entre{' '}
                            <strong className="text-ink">Crow Advance EIRL</strong> (RUT
                            27.039.635-6), titular de la plataforma Aulika (en adelante, "Aulika"
                            o "el Proveedor"), y la{' '}
                            <strong className="text-ink">institución educativa</strong> (en
                            adelante, "el Cliente") que ha aceptado estos términos al contratar o
                            acceder al servicio.
                        </p>
                        <p className="mt-4">
                            Aulika provee una plataforma SaaS (Software as a Service) de
                            evaluación en línea para instituciones educativas, que incluye gestión
                            de exámenes, preguntas, estudiantes, grupos, resultados académicos y
                            herramientas de asistencia por IA.
                        </p>
                    </section>

                    {/* Art. 2 */}
                    <section>
                        <h2 className="text-ink mb-4 text-2xl font-bold">
                            Artículo 2 — Licencia de Uso
                        </h2>
                        <p>
                            Aulika otorga al Cliente una licencia de uso con las siguientes
                            características:
                        </p>
                        <ul className="mt-4 list-disc space-y-2 pl-6">
                            <li>No exclusiva e intransferible.</li>
                            <li>Limitada al período de vigencia del contrato y suscripción activa.</li>
                            <li>
                                Circunscrita al uso interno de la institución para fines educativos.
                            </li>
                            <li>
                                Sin derecho a sublicenciar ni ceder el acceso a terceros ajenos a
                                la institución.
                            </li>
                        </ul>
                        <p className="mt-4">
                            Queda expresamente <strong className="text-ink">prohibido</strong>{' '}
                            al Cliente:
                        </p>
                        <ul className="mt-3 list-disc space-y-2 pl-6">
                            <li>
                                Sublicenciar, vender, ceder o transferir el acceso a la plataforma
                                a terceros.
                            </li>
                            <li>
                                Realizar ingeniería inversa, descompilación o extracción del código
                                fuente.
                            </li>
                            <li>
                                Reproducir total o parcialmente el diseño, interfaces o
                                funcionalidades de Aulika.
                            </li>
                            <li>
                                Usar la plataforma para fines distintos a los educativos descritos
                                en el contrato.
                            </li>
                        </ul>
                    </section>

                    {/* Art. 3 */}
                    <section>
                        <h2 className="text-ink mb-4 text-2xl font-bold">
                            Artículo 3 — Propiedad Intelectual
                        </h2>
                        <p>
                            El código fuente, diseño, interfaces, logotipos, nombre comercial,
                            arquitectura de software, bases de datos propias y toda la
                            documentación técnica de Aulika son propiedad exclusiva de{' '}
                            <strong className="text-ink">Crow Advance EIRL</strong>, protegidos
                            por la Ley Nº 17.336 sobre Propiedad Intelectual y sus modificaciones,
                            incluyendo la Ley Nº 20.435.
                        </p>
                        <p className="mt-4">
                            El Cliente retiene la propiedad de los datos que carga en la
                            plataforma: preguntas, exámenes, información de estudiantes y
                            resultados académicos. Aulika no reivindica propiedad sobre dichos
                            contenidos.
                        </p>
                    </section>

                    {/* Art. 4 */}
                    <section>
                        <h2 className="text-ink mb-4 text-2xl font-bold">
                            Artículo 4 — Obligaciones del Cliente
                        </h2>
                        <p>El Cliente se compromete a:</p>
                        <ol className="mt-4 list-[lower-alpha] space-y-3 pl-6">
                            <li>
                                Mantener la confidencialidad de las credenciales de acceso de sus
                                usuarios (docentes y administradores).
                            </li>
                            <li>
                                Notificar a Aulika de inmediato ante cualquier acceso no autorizado
                                o sospecha de compromiso de credenciales.
                            </li>
                            <li>
                                Garantizar que sus usuarios utilicen la plataforma conforme a estos
                                Términos y a la normativa educativa vigente.
                            </li>
                            <li>
                                Obtener el consentimiento informado de los representantes legales
                                de los estudiantes menores de edad antes de registrarlos.
                            </li>
                            <li>
                                No cargar contenido ilegal, discriminatorio, ofensivo ni que
                                infrinja derechos de propiedad intelectual de terceros.
                            </li>
                            <li>
                                Mantener actualizado el correo de contacto para notificaciones
                                legales y técnicas.
                            </li>
                        </ol>
                    </section>

                    {/* Art. 5 */}
                    <section>
                        <h2 className="text-ink mb-4 text-2xl font-bold">
                            Artículo 5 — Disponibilidad del Servicio (SLA)
                        </h2>
                        <p>Aulika se compromete a:</p>
                        <ul className="mt-4 list-disc space-y-2 pl-6">
                            <li>
                                <strong className="text-ink">
                                    Meta de disponibilidad del 99,5% mensual
                                </strong>
                                , excluyendo ventanas de mantenimiento programado.
                            </li>
                            <li>
                                Mantenimientos programados notificados con al menos{' '}
                                <strong className="text-ink">24 horas de anticipación</strong>,
                                preferentemente fuera del horario escolar (00:00–07:00 CLT o fines
                                de semana).
                            </li>
                            <li>
                                Mantenimientos de emergencia sin aviso previo, notificados en{' '}
                                <a
                                    href="/recursos/estado"
                                    className="text-primary hover:underline"
                                >
                                    aulika.cl/recursos/estado
                                </a>{' '}
                                durante su ejecución.
                            </li>
                        </ul>
                        <p className="mt-4">
                            Aulika <strong className="text-ink">no garantiza</strong>{' '}
                            disponibilidad ante:
                        </p>
                        <ul className="mt-3 list-disc space-y-2 pl-6">
                            <li>
                                Fallas de proveedores de infraestructura (Vercel, Neon/AWS) fuera
                                de su control.
                            </li>
                            <li>Interrupciones del servicio de Internet del Cliente.</li>
                            <li>Ataques de denegación de servicio (DDoS) de escala masiva.</li>
                            <li>Eventos de fuerza mayor o caso fortuito.</li>
                        </ul>
                    </section>

                    {/* Art. 6 */}
                    <section>
                        <h2 className="text-ink mb-4 text-2xl font-bold">
                            Artículo 6 — Limitación de Responsabilidad
                        </h2>
                        <p>
                            En la máxima extensión permitida por la ley chilena, se establecen
                            las siguientes limitaciones:
                        </p>
                        <ol className="mt-4 list-[lower-alpha] space-y-4 pl-6">
                            <li>
                                Aulika{' '}
                                <strong className="text-ink">no será responsable</strong> de daños
                                directos, indirectos, incidentales, especiales o consecuenciales
                                derivados de:
                                <ul className="mt-2 list-disc space-y-1 pl-6 text-sm">
                                    <li>
                                        Negligencia del personal del Cliente en la gestión de
                                        credenciales, incluyendo sin limitarse a:{' '}
                                        <strong className="text-ink">
                                            compartir contraseñas entre usuarios no autorizados
                                        </strong>{' '}
                                        o{' '}
                                        <strong className="text-ink">
                                            dejar sesiones activas en equipos de uso compartido
                                        </strong>
                                        .
                                    </li>
                                    <li>
                                        Carga de contenido educativo (preguntas, imágenes u otros
                                        materiales) que infrinja{' '}
                                        <strong className="text-ink">derechos de autor</strong>,
                                        derechos de imagen, o que atente contra la{' '}
                                        <strong className="text-ink">
                                            honra y reputación de personas naturales
                                        </strong>
                                        .
                                    </li>
                                    <li>
                                        Contenido discriminatorio, ofensivo, ilegal o que vulnere
                                        derechos de terceros cargado por usuarios del Cliente.
                                    </li>
                                    <li>
                                        Interrupciones de servicio de proveedores de infraestructura
                                        externos (Vercel, AWS, Neon).
                                    </li>
                                    <li>
                                        Pérdida de datos ocasionada por fuerza mayor, caso fortuito
                                        o actos de terceros fuera del control de Aulika.
                                    </li>
                                </ul>
                            </li>
                            <li>
                                La responsabilidad total de Aulika frente al Cliente, en cualquier
                                caso y concepto, no excederá el monto efectivamente pagado por el
                                Cliente en los{' '}
                                <strong className="text-ink">
                                    tres (3) meses anteriores
                                </strong>{' '}
                                al evento que origina el reclamo.
                            </li>
                            <li>
                                El Cliente es exclusivamente responsable de la veracidad e
                                integridad del contenido educativo (preguntas y exámenes) que
                                carga en la plataforma.
                            </li>
                        </ol>
                    </section>

                    {/* Art. 7 */}
                    <section>
                        <h2 className="text-ink mb-4 text-2xl font-bold">
                            Artículo 7 — Inteligencia Artificial: Transparencia y Supervisión
                            Humana
                        </h2>
                        <p>
                            Aulika incorpora herramientas de Inteligencia Artificial para asistir
                            a los docentes en la generación de preguntas de evaluación. En
                            cumplimiento del marco regulatorio chileno vigente (Boletín Nº
                            16821-19) y las directrices internacionales sobre IA en contextos
                            educativos, se declara expresamente:
                        </p>
                        <ol className="mt-4 list-[lower-alpha] space-y-3 pl-6">
                            <li>
                                <strong className="text-ink">Transparencia activa.</strong> Los
                                docentes son informados en la interfaz cuando interactúan con un
                                sistema asistido por IA. No existe interacción de IA oculta al
                                usuario.
                            </li>
                            <li>
                                <strong className="text-ink">Supervisión humana obligatoria.</strong>{' '}
                                Toda pregunta sugerida por IA requiere revisión, validación y
                                aprobación explícita del docente antes de publicarse.
                            </li>
                            <li>
                                <strong className="text-ink">
                                    La IA no evalúa ni califica estudiantes.
                                </strong>{' '}
                                La corrección de exámenes es matemáticamente determinista (porcentaje
                                de respuestas correctas). Ningún sistema de IA incide en la
                                calificación final.
                            </li>
                            <li>
                                <strong className="text-ink">Sin perfilamiento por IA.</strong> La
                                IA no construye perfiles de aprendizaje, conductuales ni
                                predictivos sobre los estudiantes.
                            </li>
                            <li>
                                <strong className="text-ink">No discriminación.</strong> Los
                                modelos de IA utilizados no producen ni replican sesgos
                                discriminatorios basados en género, etnia, origen socioeconómico u
                                otras categorías protegidas.
                            </li>
                            <li>
                                <strong className="text-ink">Trazabilidad.</strong> Aulika mantiene
                                registros auditables del uso de IA en la generación de contenido,
                                disponibles al Cliente mediante solicitud formal.
                            </li>
                            <li>
                                <strong className="text-ink">Derecho a revisión.</strong> El
                                Cliente tiene derecho a solicitar que cualquier contenido generado
                                con asistencia de IA sea revisado, editado o eliminado.
                            </li>
                            <li>
                                <strong className="text-ink">
                                    Exención de responsabilidad por decisiones académicas.
                                </strong>{' '}
                                Aulika queda expresamente eximida de toda responsabilidad por las{' '}
                                <strong className="text-ink">
                                    decisiones académicas, evaluativas o disciplinarias
                                </strong>{' '}
                                que el personal docente o directivo de la Institución adopte
                                basándose en los resultados, sugerencias o reportes generados por
                                las herramientas de asistencia algorítmica disponibles en la
                                plataforma. La responsabilidad por dichas decisiones recae
                                exclusiva e íntegramente en el profesional humano que las adopta.
                            </li>
                        </ol>
                    </section>

                    {/* Art. 8 */}
                    <section>
                        <h2 className="text-ink mb-4 text-2xl font-bold">
                            Artículo 8 — Protección de Datos Personales
                        </h2>
                        <p>
                            El tratamiento de datos personales se rige íntegramente por la{' '}
                            <a href="/empresa/privacidad" className="text-primary hover:underline">
                                Política de Privacidad y Tratamiento de Datos de Aulika
                            </a>
                            , disponible en{' '}
                            <strong className="text-ink">
                                www.aulika.cl/empresa/privacidad
                            </strong>
                            , la que se considera parte integrante e inseparable de estos
                            Términos y Condiciones.
                        </p>
                    </section>

                    {/* Art. 9 */}
                    <section>
                        <h2 className="text-ink mb-4 text-2xl font-bold">
                            Artículo 9 — Vigencia y Terminación
                        </h2>
                        <ol className="list-[lower-alpha] space-y-3 pl-6">
                            <li>
                                El contrato entra en vigor en la fecha de activación del servicio
                                y se mantiene vigente durante el período de suscripción contratado.
                            </li>
                            <li>
                                El Cliente puede solicitar la no renovación del servicio en
                                cualquier momento, con efecto al fin del período de suscripción
                                pagado.
                            </li>
                            <li>
                                Aulika puede dar término inmediato al contrato ante: incumplimiento
                                grave de estos Términos, uso fraudulento de la plataforma, o falta
                                de pago.
                            </li>
                            <li>
                                La terminación no libera al Cliente de obligaciones pecuniarias
                                devengadas ni a Aulika de sus obligaciones de retención y
                                eliminación de datos descritas en el artículo siguiente.
                            </li>
                        </ol>
                    </section>

                    {/* Art. 10 */}
                    <section>
                        <h2 className="text-ink mb-4 text-2xl font-bold">
                            Artículo 10 — Protocolo de Datos al Término del Contrato
                        </h2>
                        <div className="mt-4 space-y-4">
                            <div className="border-border rounded-lg border p-4">
                                <p className="text-ink font-semibold">
                                    Fase 1 — Exportación (días 1 a 30)
                                </p>
                                <p className="mt-1 text-sm">
                                    El Cliente puede solicitar la exportación de sus datos en
                                    formato CSV y/o JSON, incluyendo: listado de estudiantes,
                                    grupos, exámenes, preguntas y resultados académicos.
                                </p>
                            </div>
                            <div className="border-border rounded-lg border p-4">
                                <p className="text-ink font-semibold">
                                    Fase 2 — Eliminación segura (día 30+)
                                </p>
                                <p className="mt-1 text-sm">
                                    Transcurridos 30 días desde el término sin solicitud de
                                    exportación, Aulika eliminará en forma segura e irreversible
                                    todos los datos del Cliente. Los logs de seguridad pueden
                                    conservarse hasta 12 meses adicionales por obligación legal.
                                </p>
                            </div>
                            <div className="border-border rounded-lg border p-4">
                                <p className="text-ink font-semibold">
                                    Fase 3 — Certificación
                                </p>
                                <p className="mt-1 text-sm">
                                    A solicitud del Cliente, Aulika emitirá un certificado de
                                    eliminación de datos dentro de los 15 días hábiles siguientes.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Art. 11 */}
                    <section>
                        <h2 className="text-ink mb-4 text-2xl font-bold">
                            Artículo 11 — Protocolo de Seguridad y Notificación de Brechas
                        </h2>
                        <p>
                            Crow Advance EIRL implementa medidas de seguridad descritas en la
                            Política de Privacidad. En caso de detectar una brecha de seguridad
                            que afecte o pueda afectar datos del Cliente, Aulika:
                        </p>
                        <ol className="mt-4 list-[lower-alpha] space-y-3 pl-6">
                            <li>
                                Notificará al contacto registrado del Cliente en un plazo máximo
                                de <strong className="text-ink">72 horas</strong> desde la
                                detección del incidente.
                            </li>
                            <li>
                                Proporcionará información sobre la naturaleza, alcance y datos
                                potencialmente afectados.
                            </li>
                            <li>
                                Comunicará las medidas adoptadas para contener y remediar el
                                incidente.
                            </li>
                            <li>
                                Asistirá al Responsable del Tratamiento en el cumplimiento de sus
                                obligaciones de notificación ante la Agencia de Protección de Datos
                                Personales, conforme a la Ley Nº 21.719.
                            </li>
                        </ol>
                    </section>

                    {/* Art. 12 */}
                    <section>
                        <h2 className="text-ink mb-4 text-2xl font-bold">
                            Artículo 12 — Ley Aplicable y Jurisdicción
                        </h2>
                        <p>
                            Estos Términos y Condiciones se rigen por las leyes de la República
                            de Chile. Para la resolución de conflictos, las partes se someten a
                            la jurisdicción de los Tribunales Ordinarios de Justicia de la ciudad
                            de Santiago de Chile, renunciando a cualquier otro fuero o domicilio
                            especial que pudiera corresponderles.
                        </p>
                    </section>

                    {/* Art. 13 */}
                    <section>
                        <h2 className="text-ink mb-4 text-2xl font-bold">
                            Artículo 13 — Modificaciones
                        </h2>
                        <p>
                            Aulika podrá modificar estos Términos y Condiciones en cualquier
                            momento. Las modificaciones serán notificadas al Cliente con al menos{' '}
                            <strong className="text-ink">30 días corridos de anticipación</strong>{' '}
                            mediante correo electrónico al contacto registrado. El uso continuado
                            del servicio tras el vencimiento de dicho plazo constituirá aceptación
                            tácita de los nuevos términos.
                        </p>
                        <p className="mt-3">
                            La versión vigente siempre estará disponible en{' '}
                            <a href="/empresa/terminos" className="text-primary hover:underline">
                                www.aulika.cl/empresa/terminos
                            </a>
                            .
                        </p>
                    </section>

                    {/* Contacto */}
                    <section>
                        <h2 className="text-ink mb-4 text-2xl font-bold">Contacto Legal</h2>
                        <div className="border-border bg-paper rounded-xl border p-6 text-sm">
                            <p className="text-ink font-semibold">Crow Advance EIRL — Aulika</p>
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
