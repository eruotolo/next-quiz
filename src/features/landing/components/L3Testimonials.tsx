const TESTIMONIALS = [
    {
        quote: 'Antes imprimíamos 30 hojas por curso. Ahora el examen cierra y en diez segundos tengo el promedio del curso y las preguntas con más error.',
        name: 'Claudia Fierro',
        role: 'Profesora de Matemática, Colegio San Marcos',
    },
    {
        quote: 'Los alumnos ya no pueden pasar respuestas porque cada uno tiene las preguntas en distinto orden. El cambio fue inmediato.',
        name: 'Rodrigo Muñoz',
        role: 'Jefe de UTP, Liceo Politécnico Regional',
    },
    {
        quote: 'Implementamos Aulika en toda la sede en menos de una semana. El soporte respondió cada duda el mismo día.',
        name: 'Ana González',
        role: 'Coordinadora Académica, INACAP',
    },
];

export function L3Testimonials(): React.JSX.Element {
    return (
        <section className="bg-paper-warm/60 py-24">
            <div className="mx-auto max-w-[1200px] px-6">
                <div className="mb-12 text-center">
                    <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.12em] text-mute">
                        Testimonios
                    </p>
                    <h2 className="font-display text-[48px] font-semibold tracking-[-0.03em] text-ink">
                        Lo que dicen quienes ya lo usan
                    </h2>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                    {TESTIMONIALS.map((t) => (
                        <div
                            key={t.name}
                            className="relative flex flex-col justify-between gap-6 rounded-[22px] border border-border bg-white p-8"
                        >
                            <span
                                className="absolute top-4 right-6 font-display text-[64px] leading-none text-primary/20 select-none"
                                aria-hidden="true"
                            >
                                "
                            </span>
                            <p className="relative text-[16px] leading-relaxed text-ink">
                                "{t.quote}"
                            </p>
                            <div>
                                <p className="text-[14px] font-semibold text-ink">{t.name}</p>
                                <p className="mt-0.5 text-[12px] text-mute">{t.role}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
