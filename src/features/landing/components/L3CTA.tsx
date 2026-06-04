import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Tag } from '@/shared/components/ui/badge';

export function L3CTA(): React.JSX.Element {
    return (
        <section className="bg-paper pt-10 pb-24">
            <div className="mx-auto max-w-[1400px] px-6 md:px-14">
                <div
                    className="bg-ink relative overflow-hidden rounded-[32px] px-8 py-24 text-center lg:px-20 lg:text-left"
                    style={{
                        backgroundImage:
                            'radial-gradient(circle at 80% 20%, rgba(31,46,255,0.4) 0%, transparent 60%), radial-gradient(circle at 10% 80%, rgba(214,255,31,0.15) 0%, transparent 50%)',
                    }}
                >
                    {/* High energy glow */}
                    <div className="bg-primary/20 absolute top-0 right-0 size-96 translate-x-1/2 -translate-y-1/2 blur-[120px]" />

                    <div className="relative flex flex-col gap-12 lg:flex-row lg:items-center lg:justify-between">
                        <div className="max-w-[760px] space-y-6">
                            <div className="flex justify-center lg:justify-start">
                                <Tag tone="lime" size="sm" className="font-bold">
                                    SIN COMPROMISO
                                </Tag>
                            </div>
                            <h2 className="font-display text-[56px] leading-[0.95] font-medium tracking-[-0.04em] text-white md:text-[84px]">
                                Tu próximo examen,
                                <br />
                                lo <em className="text-lime not-italic">rinden</em> en Aulika.
                            </h2>
                            <p className="mx-auto max-w-lg text-[18px] text-white/60 lg:mx-0">
                                30 días gratuitos, sin tarjeta. Te activamos una institución de
                                prueba en menos de 24 horas.
                            </p>
                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center lg:min-w-[280px] lg:flex-col lg:items-stretch">
                            <Button
                                variant="lime"
                                size="lg"
                                asChild
                                className="h-14 px-8 text-[16px] font-bold"
                            >
                                <Link href="/login">
                                    Activar mi institución
                                    <ArrowRight className="ml-2 size-5" />
                                </Link>
                            </Button>
                            <Button
                                variant="ghost-dark"
                                size="lg"
                                asChild
                                className="h-14 px-8 text-[16px] font-bold"
                            >
                                <Link href="mailto:hola@aulika.cl">Agendar llamada</Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
