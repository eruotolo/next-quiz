'use client';

import { usePathname } from 'next/navigation';
import { AdminTopBar } from '@/shared/components/layout/AdminTopBar';

interface RouteConfig {
    title: string;
    breadcrumb: string[];
}

const CONFIG_ROUTES: Record<string, RouteConfig> = {
    '/config': { title: 'Panel SuperAdmin', breadcrumb: ['Aulika · Plataforma', 'Panel Global'] },
    '/config/institutions': { title: 'Instituciones', breadcrumb: ['Sistema', 'Instituciones'] },
    '/config/admins': { title: 'Gestión de Accesos', breadcrumb: ['Sistema', 'Administradores'] },
    '/config/students': { title: 'Todos los Estudiantes', breadcrumb: ['Sistema', 'Base Global'] },
    '/config/auditoria': { title: 'Auditoría', breadcrumb: ['Sistema', 'Auditoría'] },
    '/config/settings': { title: 'Configuración', breadcrumb: ['Sistema', 'Configuración'] },
    '/config/payments': { title: 'Pagos', breadcrumb: ['Aulika · Plataforma', 'Panel Global', 'Pagos'] },
    '/config/subscriptions': { title: 'Suscripciones y pagos', breadcrumb: ['Aulika · Plataforma', 'Panel Global', 'Suscripciones'] },
    '/config/periods': { title: 'Períodos Académicos', breadcrumb: ['Sistema', 'Períodos'] },
    '/config/plan-limits': { title: 'Límites de planes', breadcrumb: ['Aulika · Plataforma', 'Panel Global', 'Límites de planes'] },
    '/config/groups': { title: 'Grupos / Cursos', breadcrumb: ['Sistema', 'Grupos'] },
    '/config/programs': { title: 'Programas / Carreras', breadcrumb: ['Sistema', 'Programas'] },
    '/config/exams': { title: 'Exámenes / Evaluaciones', breadcrumb: ['Sistema', 'Exámenes'] },
    '/config/billing': { title: 'Facturación', breadcrumb: ['Aulika · Plataforma', 'Panel Global', 'Facturación'] },
};

function resolveRoute(pathname: string): RouteConfig {
    const match = Object.entries(CONFIG_ROUTES)
        .sort(([a], [b]) => b.length - a.length)
        .find(([key]) => pathname === key || pathname.startsWith(`${key}/`));

    return match?.[1] ?? { title: 'Panel SuperAdmin', breadcrumb: ['Sistema'] };
}

export function ConfigTopBar() {
    const pathname = usePathname();
    const { title, breadcrumb } = resolveRoute(pathname);

    return (
        <AdminTopBar
            title={title}
            breadcrumb={breadcrumb}
            className="lg:h-31.25 lg:items-center lg:py-0"
        />
    );
}
