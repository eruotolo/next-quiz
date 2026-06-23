import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/features/auth/auth';
import { prisma } from '@/shared/lib/prisma';
import { AdminTopBar } from '@/shared/components/layout/AdminTopBar';
import { ProfileClient } from '@/features/profile/components/ProfileClient';
import { UserCircle } from 'lucide-react';

export const metadata: Metadata = {
    title: 'Mi perfil · Aulika',
};

export default async function PerfilPage() {
    const session = await auth();
    if (!session?.user?.id) redirect('/login');

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
            name: true,
            lastname: true,
            email: true,
            rut: true,
            userRole: { select: { name: true } },
        },
    });

    if (!user) redirect('/login');

    return (
        <div className="bg-paper flex min-h-screen flex-col">
            <AdminTopBar
                breadcrumb={['Mi cuenta', 'Perfil']}
                title="Mi perfil"
                subtitle="Actualizá tu información personal y contraseña"
                icon={<UserCircle size={18} />}
            />
            <ProfileClient
                user={{
                    name: user.name,
                    lastname: user.lastname,
                    email: user.email,
                    rut: user.rut,
                    role: user.userRole?.name ?? '',
                }}
            />
        </div>
    );
}
