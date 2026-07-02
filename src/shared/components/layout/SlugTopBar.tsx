'use client';

import { usePathname } from 'next/navigation';
import { AdminTopBar } from '@/shared/components/layout/AdminTopBar';
import { academicLabel, type InstitutionType } from '@/shared/lib/academic-labels';

interface RouteConfig {
    title: string;
    breadcrumb: string[];
}

interface Props {
    institutionName: string;
    institutionType: InstitutionType;
}

function resolveRoute(
    pathname: string,
    institutionName: string,
    institutionType: InstitutionType,
): RouteConfig {
    const labels = academicLabel(institutionType);
    const seg = pathname.split('/').filter(Boolean).slice(1); // skip slug segment
    const s0 = seg[0] ?? '';
    const s2 = seg[2] ?? '';

    // /exams/[id]/edit
    if (s0 === 'exams' && s2 === 'edit') {
        return { title: 'Editor de examen', breadcrumb: [institutionName, 'Exámenes', 'Editor'] };
    }

    if (s0 === 'aula') {
        // /aula/[id] — course editor
        if (seg.length === 2) {
            return {
                title: 'Editor de curso',
                breadcrumb: [institutionName, 'Aula Virtual', 'Editor de curso'],
            };
        }
        // /aula/[id]/section
        if (seg.length >= 3) {
            const sectionMap: Record<string, string> = {
                tareas: 'Tareas',
                calificaciones: 'Calificaciones',
                foro: 'Foro',
                analiticas: 'Analítica',
                ranking: 'Ranking',
                certificados: 'Certificados',
            };
            const section = sectionMap[s2] ?? 'Aula Virtual';
            return { title: section, breadcrumb: [institutionName, 'Aula Virtual', section] };
        }
        // /aula
        return { title: 'Aula Virtual', breadcrumb: [institutionName, 'Aula Virtual'] };
    }

    // Dashboard (no sub-segment)
    if (seg.length === 0) {
        return { title: 'Dashboard', breadcrumb: [institutionName, 'Panel principal'] };
    }

    const staticMap: Record<string, RouteConfig> = {
        students: { title: 'Estudiantes', breadcrumb: [institutionName, 'Estudiantes'] },
        exams: { title: 'Exámenes', breadcrumb: [institutionName, 'Exámenes'] },
        results: { title: 'Resultados', breadcrumb: [institutionName, 'Resultados'] },
        liveresults: { title: 'Monitoreo en vivo', breadcrumb: [institutionName, 'En vivo'] },
        groups: { title: 'Grupos', breadcrumb: [institutionName, 'Grupos'] },
        professors: { title: 'Cuerpo Docente', breadcrumb: [institutionName, 'Profesores'] },
        programs: {
            title: labels.programPlural,
            breadcrumb: [institutionName, labels.programPlural],
        },
        courses: { title: labels.coursePlural, breadcrumb: [institutionName, labels.coursePlural] },
        periods: { title: 'Períodos', breadcrumb: [institutionName, 'Períodos'] },
        settings: { title: 'Configuración', breadcrumb: [institutionName, 'Ajustes'] },
        ayuda: { title: 'Centro de ayuda', breadcrumb: [institutionName, 'Ayuda'] },
        upgrade: { title: 'Mejorá tu plan', breadcrumb: [institutionName, 'Planes'] },
        questions: {
            title: 'Banco de Preguntas',
            breadcrumb: [institutionName, 'Banco de preguntas'],
        },
    };

    return staticMap[s0] ?? { title: institutionName, breadcrumb: [institutionName] };
}

export function SlugTopBar({ institutionName, institutionType }: Props) {
    const pathname = usePathname();
    const { title, breadcrumb } = resolveRoute(pathname, institutionName, institutionType);
    return (
        <AdminTopBar
            title={title}
            breadcrumb={breadcrumb}
            className="lg:h-31.25 lg:items-center lg:py-0"
        />
    );
}
