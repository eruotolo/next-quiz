const INSTITUTIONS = [
    'Colegio Antártica',
    'Instituto INACAP',
    'Liceo Politécnico',
    'Colegio San Marcos',
    'Universidad del Norte',
    'Centro Mackay',
    'Preuniversitario Pedro de Valdivia',
];

export function L3Trust(): React.JSX.Element {
    return (
        <section className="border-y border-border bg-paper-warm py-12">
            <div className="mx-auto max-w-[1400px] px-6 md:px-14">
                <p className="mb-8 text-center font-mono text-[11px] font-bold uppercase tracking-[0.15em] text-mute opacity-70">
                    INSTITUCIONES QUE YA RINDEN SUS EXÁMENES EN AULIKA
                </p>
                <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6">
                    {INSTITUTIONS.map((name) => (
                        <span
                            key={name}
                            className="font-display text-[20px] font-bold text-ink/20 grayscale transition-all hover:text-ink/60 cursor-default"
                        >
                            {name}
                        </span>
                    ))}
                </div>
            </div>
        </section>
    );
}
