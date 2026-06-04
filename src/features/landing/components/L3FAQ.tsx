'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

const FAQS = [
    {
        q: '¿Los alumnos necesitan crear una cuenta?',
        a: 'No. Los estudiantes acceden con su RUT. Sin correos, sin contraseñas, sin instalaciones. El docente comparte el link del examen y listo.',
    },
    {
        q: '¿Funciona desde el celular?',
        a: 'Sí. La interfaz del examen es 100% responsiva. Funciona en cualquier dispositivo con navegador moderno: PC, tablet, smartphone.',
    },
    {
        q: '¿Qué pasa si el alumno pierde internet durante el examen?',
        a: 'Las respuestas se guardan automáticamente cada vez que el alumno avanza a la siguiente pregunta. Si la conexión se corta, al reconectarse el examen continúa desde donde quedó.',
    },
    {
        q: '¿Puedo importar preguntas desde un Word o Excel?',
        a: 'Sí. Aulika acepta importación desde Google Forms y desde plantillas Excel. También puedes crear preguntas directamente en la plataforma.',
    },
    {
        q: '¿Los datos están en Chile?',
        a: 'Los datos de la institución y de los estudiantes se almacenan en servidores con residencia en la región de Sudamérica, cumpliendo con la ley 19.628 de protección de datos personales de Chile.',
    },
    {
        q: '¿Cuánto demora implementar Aulika en mi institución?',
        a: 'Una institución pequeña puede estar operativa en un día. Para instituciones grandes con integración a SGA o importación masiva de datos, el proceso toma entre 3 y 5 días hábiles con nuestro equipo de soporte.',
    },
];

export function L3FAQ(): React.JSX.Element {
    const [open, setOpen] = useState<string | null>(null);

    return (
        <section className="bg-white py-24" id="faq">
            <div className="mx-auto max-w-[760px] px-6">
                <div className="mb-12 text-center">
                    <p className="text-mute mb-3 font-mono text-[11px] tracking-[0.12em] uppercase">
                        Preguntas frecuentes
                    </p>
                    <h2 className="font-display text-ink text-[48px] font-semibold tracking-[-0.03em]">
                        Dudas comunes
                    </h2>
                </div>

                <div className="divide-border divide-y">
                    {FAQS.map((faq) => (
                        <div key={faq.q} className="py-1">
                            <button
                                type="button"
                                onClick={() => setOpen(open === faq.q ? null : faq.q)}
                                className="flex w-full items-center justify-between gap-4 py-5 text-left"
                            >
                                <span className="text-ink text-[16px] font-medium">{faq.q}</span>
                                <Plus
                                    className={cn(
                                        'text-mute size-5 shrink-0 transition-transform duration-200',
                                        open === faq.q && 'text-primary rotate-45',
                                    )}
                                />
                            </button>
                            <div
                                className={cn(
                                    'overflow-hidden transition-all duration-200',
                                    open === faq.q
                                        ? 'max-h-64 pb-5 opacity-100'
                                        : 'max-h-0 opacity-0',
                                )}
                            >
                                <p className="text-ink-dim text-[15px] leading-relaxed">{faq.a}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
