import type { Metadata } from 'next';
import { prisma } from '@/shared/lib/prisma';
import { LogoLockup } from '@/shared/components/branding/logo';
import { ActivationForm } from './ActivationForm';

export const metadata: Metadata = {
    title: 'Activar cuenta · Aulika',
    description: 'Activá tu cuenta de Aulika con el enlace que recibiste por email.',
    robots: { index: false, follow: false },
};

interface PageProps {
    searchParams: Promise<{ token?: string }>;
}

export default async function ActivarPage({ searchParams }: PageProps) {
    const { token } = await searchParams;
    if (!token) {
        return (
            <main className="flex min-h-screen items-center justify-center px-5 py-12">
                <InvalidState message="Falta el token de activación. Abrí el enlace que te enviamos por email." />
            </main>
        );
    }

    const user = await prisma.user.findFirst({
        where: { activationToken: token },
        select: {
            id: true,
            name: true,
            lastname: true,
            email: true,
            activationTokenExp: true,
        },
    });

    if (!user) {
        return (
            <main className="flex min-h-screen items-center justify-center px-5 py-12">
                <InvalidState message="El enlace de activación no es válido. Pedí uno nuevo escribiendo a soporte." />
            </main>
        );
    }
    if (!user.activationTokenExp || user.activationTokenExp < new Date()) {
        return (
            <main className="flex min-h-screen items-center justify-center px-5 py-12">
                <InvalidState message="El enlace de activación expiró. Pedí uno nuevo escribiendo a soporte." />
            </main>
        );
    }

    return (
        <main className="flex min-h-screen items-center justify-center bg-paper-warm px-5 py-12">
            <div className="w-full max-w-[420px]">
                <div className="mb-6 flex justify-center">
                    <LogoLockup size={32} variant="cobalto" />
                </div>
                <div className="border-border bg-white shadow-sm rounded-[18px] border p-6 sm:p-8">
                    <h1 className="text-ink font-display text-[24px] font-bold tracking-tight">
                        Activá tu cuenta
                    </h1>
                    <p className="text-ink-dim mt-1 text-[14px]">
                        Hola {user.name.split(' ')[0]}, definí una contraseña para empezar a
                        usar el Aula Virtual de Aulika.
                    </p>
                    <div className="mt-6">
                        <ActivationForm token={token} />
                    </div>
                </div>
            </div>
        </main>
    );
}

function InvalidState({ message }: { message: string }) {
    return (
        <div className="w-full max-w-[420px] border-border bg-white shadow-sm rounded-[18px] border p-6 text-center">
            <h1 className="text-ink font-display text-[20px] font-bold tracking-tight">
                No pudimos activar tu cuenta
            </h1>
            <p className="text-ink-dim mt-2 text-[14px]">{message}</p>
            <p className="text-mute mt-4 text-[12px]">
                Soporte: <a className="text-primary hover:underline" href="mailto:soporte@aulika.cl">soporte@aulika.cl</a>
            </p>
        </div>
    );
}
