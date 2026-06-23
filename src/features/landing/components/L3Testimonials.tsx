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

export function L3Testimonials() {
    return (
        <section className="bg-paper-warm/60 py-24">
            <div className="mx-auto max-w-[1200px] px-6">
                <div className="mb-12 text-center">
                    <p className="text-mute mb-3 font-mono text-[11px] tracking-[0.12em] uppercase">
                        Testimonios
                    </p>
                    <h2 className="font-display text-ink text-[48px] font-semibold tracking-[-0.03em]">
                        Lo que dicen quienes ya lo usan
                    </h2>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                    {TESTIMONIALS.map((t) => (
                        <div
                            key={t.name}
                            className="border-border relative flex flex-col justify-between gap-6 rounded-[22px] border bg-white p-8"
                        >
                            <span
                                className="font-display text-primary/20 absolute top-4 right-6 text-[64px] leading-none select-none"
                                aria-hidden="true"
                            >
                                "
                            </span>
                            <p className="text-ink relative text-[16px] leading-relaxed">
                                "{t.quote}"
                            </p>
                            <div>
                                <p className="text-ink text-[14px] font-semibold">{t.name}</p>
                                <p className="text-mute mt-0.5 text-[12px]">{t.role}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
