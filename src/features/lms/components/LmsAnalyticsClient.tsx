'use client';

import { Award, BookOpen, CheckSquare, TrendingUp, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/shared/components/ui/table';
import { Badge } from '@/shared/components/ui/badge';
import { cn } from '@/shared/lib/utils';
import type { CourseAnalytics } from '@/features/lms/actions/analytics';

interface Props {
    analytics: CourseAnalytics;
}

interface StatCardProps {
    icon: typeof Users;
    label: string;
    value: string | number;
    sub?: string;
}

function StatCard({ icon: Icon, label, value, sub }: StatCardProps) {
    return (
        <Card className="p-4">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-mute text-xs font-medium tracking-wider uppercase">
                        {label}
                    </p>
                    <p className="text-ink mt-1 text-2xl font-bold">{value}</p>
                    {sub && <p className="text-mute mt-0.5 text-xs">{sub}</p>}
                </div>
                <div className="bg-primary/8 rounded-lg p-2">
                    <Icon size={18} className="text-primary" />
                </div>
            </div>
        </Card>
    );
}

function DistributionBar({ label, count, total }: { label: string; count: number; total: number }) {
    const pct = total > 0 ? Math.round((count / total) * 100) : 0;
    return (
        <div className="flex items-center gap-3">
            <span className="text-mute w-16 text-right text-xs">{label}</span>
            <div className="bg-border h-2 flex-1 overflow-hidden rounded-full">
                <div className="bg-primary h-full rounded-full" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-ink w-8 text-xs font-semibold">{count}</span>
        </div>
    );
}

type RiskLevel = 'BAJO' | 'MEDIO' | 'ALTO';
const RISK_BADGE: Record<RiskLevel, { label: string; className: string }> = {
    ALTO: { label: 'Alto', className: 'bg-red-100 text-red-700 border-red-200' },
    MEDIO: { label: 'Medio', className: 'bg-amber-100 text-amber-700 border-amber-200' },
    BAJO: { label: 'Bajo', className: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
};

function RiskRow({ student }: { student: CourseAnalytics['atRisk'][number] }) {
    const badge: { label: string; className: string } = RISK_BADGE[student.riskLevel];
    return (
        <TableRow>
            <TableCell>
                <p className="text-ink text-sm font-medium">{student.name}</p>
                {student.reasons.length > 0 && (
                    <p className="text-mute mt-0.5 text-xs">{student.reasons.join(' · ')}</p>
                )}
            </TableCell>
            <TableCell>
                <div className="flex items-center gap-2">
                    <div className="bg-border h-1.5 w-20 overflow-hidden rounded-full">
                        <div
                            className={cn(
                                'h-full rounded-full',
                                student.progressPct < 15 ? 'bg-red-500' : 'bg-amber-400',
                            )}
                            style={{ width: `${student.progressPct}%` }}
                        />
                    </div>
                    <span className="text-mute text-xs">{student.progressPct}%</span>
                </div>
            </TableCell>
            <TableCell>
                {student.averageGrade !== null ? (
                    <span
                        className={cn(
                            'text-sm font-bold',
                            student.averageGrade >= 4 ? 'text-green-600' : 'text-red-500',
                        )}
                    >
                        {student.averageGrade.toFixed(1)}
                    </span>
                ) : (
                    <span className="text-mute text-xs">—</span>
                )}
            </TableCell>
            <TableCell>
                {student.daysSinceActivity !== null ? (
                    <span className="text-mute text-xs">Hace {student.daysSinceActivity}d</span>
                ) : (
                    <span className="text-mute text-xs">Sin actividad</span>
                )}
            </TableCell>
            <TableCell>
                <Badge className={cn('text-xs', badge.className)}>{badge.label}</Badge>
            </TableCell>
        </TableRow>
    );
}

export function LmsAnalyticsClient({ analytics }: Props) {
    const { enrollment, progress, assignments, grades, atRisk, completedCertificates } = analytics;

    return (
        <div className="flex flex-col gap-6 p-6">
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <StatCard
                    icon={Users}
                    label="Inscriptos"
                    value={enrollment.total}
                    sub={`${enrollment.active} activos · ${enrollment.completed} completados`}
                />
                <StatCard
                    icon={TrendingUp}
                    label="Progreso promedio"
                    value={`${progress.average}%`}
                />
                <StatCard
                    icon={CheckSquare}
                    label="Tasa de entrega"
                    value={`${assignments.submissionRate}%`}
                    sub={`${assignments.submitted} entregas · ${assignments.graded} calificadas`}
                />
                <StatCard
                    icon={Award}
                    label="Certificados"
                    value={completedCertificates}
                    sub={`de ${enrollment.total} inscriptos`}
                />
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                            <BookOpen size={15} className="text-primary" />
                            Distribución de progreso
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-2">
                        {progress.distribution.map((d) => (
                            <DistributionBar
                                key={d.range}
                                label={d.range}
                                count={d.count}
                                total={enrollment.total}
                            />
                        ))}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                            <TrendingUp size={15} className="text-primary" />
                            Calificaciones
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {grades.average !== null ? (
                            <div className="flex flex-col gap-4">
                                <div className="flex items-baseline gap-2">
                                    <span className="text-ink text-4xl font-bold">
                                        {grades.average.toFixed(1)}
                                    </span>
                                    <span className="text-mute text-sm">promedio general</span>
                                </div>
                                <div className="flex gap-4">
                                    <div>
                                        <span className="text-2xl font-bold text-green-600">
                                            {grades.passing}
                                        </span>
                                        <p className="text-mute text-xs">aprueban (≥4.0)</p>
                                    </div>
                                    <div className="border-border mx-2 border-l" />
                                    <div>
                                        <span className="text-2xl font-bold text-red-500">
                                            {grades.failing}
                                        </span>
                                        <p className="text-mute text-xs">reprueban (&lt;4.0)</p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <p className="text-mute py-6 text-center text-sm">
                                Sin calificaciones registradas
                            </p>
                        )}
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                        <Users size={15} className="text-amber-500" />
                        Alumnos en riesgo
                        {atRisk.length > 0 && (
                            <Badge className="ml-1 border-amber-200 bg-amber-100 text-xs text-amber-700">
                                {atRisk.length}
                            </Badge>
                        )}
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {atRisk.length === 0 ? (
                        <div className="flex flex-col items-center gap-2 py-10">
                            <CheckSquare size={32} className="text-green-400" />
                            <p className="text-ink text-sm font-medium">Sin alumnos en riesgo</p>
                            <p className="text-mute text-xs">
                                Todos los activos tienen buen progreso.
                            </p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Alumno</TableHead>
                                    <TableHead>Progreso</TableHead>
                                    <TableHead>Nota prom.</TableHead>
                                    <TableHead>Última actividad</TableHead>
                                    <TableHead>Riesgo</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {atRisk.map((s) => (
                                    <RiskRow key={s.userId} student={s} />
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
