'use client';

import { ArrowLeft, BookOpen, GraduationCap, Users } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import type { ProfessorOption } from '@/features/coordinators/actions/queries';
import { CoordinatorsTab } from '@/features/coordinators/components/CoordinatorsTab';
import { Card } from '@/shared/components/ui/card';
import { StatTile } from '@/shared/components/ui/stat-tile';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/shared/components/ui/table';
import { cn } from '@/shared/lib/utils';

interface CourseItem {
    id: string;
    name: string;
    periodName: string;
    professors: string[];
    groupName: string | null;
}

interface GroupItem {
    id: string;
    name: string;
    studentsCount: number;
}

interface CoordinatorItem {
    id: string;
    userId: string;
    name: string;
}

interface Props {
    slug: string;
    programId: string;
    programName: string;
    programCode: string | null;
    programLabel: string;
    programLabelPlural: string;
    courseLabelPlural: string;
    stats: { groups: number; courses: number; students: number };
    courses: CourseItem[];
    groups: GroupItem[];
    coordinators: CoordinatorItem[];
    professors: ProfessorOption[];
    canMutate: boolean;
}

type TabKey = 'courses' | 'groups' | 'coordinators';

export function ProgramDetail({
    slug,
    programId,
    programName,
    programCode,
    programLabel,
    programLabelPlural,
    courseLabelPlural,
    stats,
    courses,
    groups,
    coordinators,
    professors,
    canMutate,
}: Props) {
    const [tab, setTab] = useState<TabKey>('courses');

    const tabs: { key: TabKey; label: string; count: number }[] = [
        { key: 'courses', label: courseLabelPlural, count: courses.length },
        { key: 'groups', label: 'Grupos', count: groups.length },
        { key: 'coordinators', label: 'Coordinadores', count: coordinators.length },
    ];

    return (
        <main className="flex-1 overflow-auto p-8">
            <div className="mb-6">
                <Link
                    href={`/${slug}/programs`}
                    className="text-mute hover:text-ink mb-2 inline-flex items-center gap-1.5 text-[12px] font-medium"
                >
                    <ArrowLeft size={13} /> {programLabelPlural}
                </Link>
                <h2 className="font-display text-ink text-[28px] leading-none font-bold tracking-tight">
                    {programName}
                </h2>
                <p className="text-mute mt-1.5 font-mono text-[11px] font-bold tracking-[0.1em] uppercase">
                    {programLabel}
                    {programCode ? ` · ${programCode}` : ''}
                </p>
            </div>

            <div className="mb-6 grid gap-4 sm:grid-cols-3">
                <StatTile label="Grupos" value={stats.groups} icon={<Users />} />
                <StatTile
                    label={courseLabelPlural}
                    value={stats.courses}
                    tone="primary"
                    icon={<BookOpen />}
                />
                <StatTile label="Alumnos" value={stats.students} icon={<GraduationCap />} />
            </div>

            <div className="border-border mb-4 flex items-center gap-1 border-b">
                {tabs.map((t) => (
                    <button
                        key={t.key}
                        type="button"
                        onClick={() => setTab(t.key)}
                        className={cn(
                            '-mb-px border-b-2 px-4 py-2.5 text-[13px] font-semibold transition-colors',
                            tab === t.key
                                ? 'border-primary text-primary'
                                : 'text-mute hover:text-ink border-transparent',
                        )}
                    >
                        {t.label}
                        <span className="text-mute ml-1.5 font-mono text-[11px]">{t.count}</span>
                    </button>
                ))}
            </div>

            {tab === 'courses' && (
                <Card className="border-border overflow-hidden bg-white p-0 shadow-sm">
                    {courses.length === 0 ? (
                        <EmptyRow
                            text={`Sin ${courseLabelPlural.toLowerCase()} en este programa.`}
                        />
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nombre</TableHead>
                                    <TableHead>Período</TableHead>
                                    <TableHead>Profesor(es)</TableHead>
                                    <TableHead>Grupo</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {courses.map((c) => (
                                    <TableRow key={c.id}>
                                        <TableCell className="text-ink font-semibold">
                                            {c.name}
                                        </TableCell>
                                        <TableCell className="text-mute text-[12px]">
                                            {c.periodName}
                                        </TableCell>
                                        <TableCell className="text-mute text-[12px]">
                                            {c.professors.length > 0
                                                ? c.professors.join(', ')
                                                : 'Sin asignar'}
                                        </TableCell>
                                        <TableCell className="text-mute text-[12px]">
                                            {c.groupName ?? '—'}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </Card>
            )}

            {tab === 'groups' && (
                <Card className="border-border overflow-hidden bg-white p-0 shadow-sm">
                    {groups.length === 0 ? (
                        <EmptyRow text="Sin grupos vinculados a este programa." />
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nombre</TableHead>
                                    <TableHead className="text-center">Estudiantes</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {groups.map((g) => (
                                    <TableRow key={g.id}>
                                        <TableCell className="text-ink font-semibold">
                                            {g.name}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {g.studentsCount}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </Card>
            )}

            {tab === 'coordinators' && (
                <Card className="border-border bg-white p-5 shadow-sm">
                    <CoordinatorsTab
                        slug={slug}
                        programId={programId}
                        coordinators={coordinators}
                        professors={professors}
                        canMutate={canMutate}
                    />
                </Card>
            )}
        </main>
    );
}

function EmptyRow({ text }: { text: string }) {
    return <p className="text-mute px-6 py-10 text-center text-sm">{text}</p>;
}
