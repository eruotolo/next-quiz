import { auth } from '@/features/auth/auth';
import { USER_ROLE } from '@/shared/lib/roles';
import { LogoMark } from '@/shared/components/branding/logo';
import { Building2, LogOut, Settings } from 'lucide-react';
import { signOut } from '@/features/auth/auth';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

export default async function ConfigLayout({ children }: Props) {
    const session = await auth();
    if (!session || session.user.userRoleName !== USER_ROLE.SUPER_ADMIN) redirect('/login');

    return (
        <div className="bg-muted/30 flex min-h-screen">
            <aside className="border-border fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r bg-white">
                <div className="border-border flex items-center gap-3 border-b px-6 py-5">
                    <LogoMark size={36} className="shrink-0 shadow-sm" />
                    <div>
                        <p className="text-foreground text-[15px] leading-none font-bold">
                            EduNext Quiz
                        </p>
                        <p className="text-muted-foreground mt-1 text-xs leading-none">
                            SuperAdministrador
                        </p>
                    </div>
                </div>

                <nav className="flex-1 overflow-y-auto px-3 py-4">
                    <ul className="space-y-1">
                        <li>
                            <Link
                                href="/config"
                                className="text-muted-foreground hover:bg-muted hover:text-foreground flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors"
                            >
                                <Settings size={18} className="shrink-0" />
                                Configuración
                            </Link>
                        </li>
                        <li>
                            <Link
                                href="/config/institutions"
                                className="text-muted-foreground hover:bg-muted hover:text-foreground flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors"
                            >
                                <Building2 size={18} className="shrink-0" />
                                Instituciones
                            </Link>
                        </li>
                    </ul>
                </nav>

                <div className="border-border space-y-1 border-t px-3 py-4">
                    <div className="bg-muted/50 rounded-xl px-4 py-3">
                        <p className="text-foreground truncate text-sm font-bold">
                            {session.user?.name ?? 'SuperAdmin'}
                        </p>
                        <p className="text-muted-foreground truncate text-xs">
                            {session.user?.email}
                        </p>
                    </div>
                    <form
                        action={async () => {
                            'use server';
                            await signOut({ redirectTo: '/login' });
                        }}
                    >
                        <button
                            type="submit"
                            className="text-destructive hover:bg-destructive/10 flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors"
                        >
                            <LogOut size={18} className="shrink-0" />
                            Cerrar sesión
                        </button>
                    </form>
                </div>
            </aside>

            <main className="ml-64 flex-1 overflow-y-auto">
                <div className="px-10 py-8">{children}</div>
            </main>
        </div>
    );
}
