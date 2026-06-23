const INSTITUTIONS = [
    'Colegio Antártica',
    'Instituto INACAP',
    'Liceo Politécnico',
    'Colegio San Marcos',
    'Universidad del Norte',
    'Centro Mackay',
    'Preuniversitario Pedro de Valdivia',
];

export function L3Trust() {
    return (
        <section className="border-border bg-paper-warm border-y py-12">
            <div className="mx-auto max-w-[1400px] px-6 md:px-14">
                <p className="text-mute mb-8 text-center font-mono text-[11px] font-bold tracking-[0.15em] uppercase opacity-70">
                    INSTITUCIONES QUE YA RINDEN SUS EXÁMENES EN AULIKA
                </p>
                <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6">
                    {INSTITUTIONS.map((name) => (
                        <span
                            key={name}
                            className="font-display text-ink/20 hover:text-ink/60 cursor-default text-[20px] font-bold grayscale transition-all"
                        >
                            {name}
                        </span>
                    ))}
                </div>
            </div>
        </section>
    );
}
